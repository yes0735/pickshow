// Design Ref: §9.1 Application Layer — 검색 비즈니스 로직
import { prisma } from "@/lib/prisma";
import type { SearchParams } from "./schema";
import type { Prisma } from "@/generated/prisma/client";

export async function searchPerformances(params: SearchParams) {
  const where: Prisma.PerformanceWhereInput = {};

  if (params.q) {
    where.OR = [
      { title: { contains: params.q, mode: "insensitive" } },
      { cast: { contains: params.q, mode: "insensitive" } },
    ];
  }
  if (params.genre) where.genre = params.genre;
  if (params.status) where.status = params.status;
  if (params.startDate) where.startDate = { gte: new Date(params.startDate) };
  if (params.endDate) where.endDate = { lte: new Date(params.endDate) };
  if (params.minPrice !== undefined) where.minPrice = { gte: params.minPrice };
  if (params.maxPrice !== undefined) where.maxPrice = { lte: params.maxPrice };
  if (params.ageLimit) where.ageLimit = { contains: params.ageLimit };
  if (params.ticketSite) {
    const TOP_TICKET_SITES = [
      "놀유니버스",
      "네이버N예약",
      "NHN티켓링크",
      "예스24",
      "멜론티켓",
      "플레이티켓",
      "타임티켓",
      "나눔티켓",
      "엔티켓",
      "쿠팡",
    ];

    let matchedIds: { id: string }[];
    if (params.ticketSite === "etc") {
      // 기타: 상위 10개 예매처가 포함되지 않은 공연
      const notLikeClause = TOP_TICKET_SITES.map(
        (_, i) => `ticket_urls::text NOT ILIKE $${i + 1}`
      ).join(" AND ");
      matchedIds = await prisma.$queryRawUnsafe<{ id: string }[]>(
        `SELECT id FROM performances WHERE ${notLikeClause}`,
        ...TOP_TICKET_SITES.map((s) => `%${s}%`)
      );
    } else {
      // 특정 예매처: ILIKE로 포함 여부 검색
      matchedIds = await prisma.$queryRawUnsafe<{ id: string }[]>(
        `SELECT id FROM performances WHERE ticket_urls::text ILIKE $1`,
        `%${params.ticketSite}%`
      );
    }

    const ids = matchedIds.map((r) => r.id);
    if (ids.length === 0) {
      return { data: [], pagination: { cursor: null, hasNext: false, total: 0 } };
    }
    where.id = { in: ids };
  }
  if (params.venue) {
    where.venue = { contains: params.venue, mode: "insensitive" };
  }

  const orderBy: Prisma.PerformanceOrderByWithRelationInput =
    params.sort === "price_asc"
      ? { minPrice: { sort: "asc", nulls: "last" } }
      : params.sort === "price_desc"
        ? { maxPrice: { sort: "desc", nulls: "last" } }
        : { startDate: "desc" };

  const take = params.limit + 1;
  const cursorObj = params.cursor ? { id: params.cursor } : undefined;

  let items;

  if (params.sort === "date") {
    // 날짜순: 단일 SQL 쿼리로 status 우선 + 날짜 정렬
    // 공연중(최근 시작 먼저) → 공연예정(가까운 날짜 먼저) → 공연완료(최근 끝난 순)
    const offset = cursorObj
      ? await getOffsetForCursor(cursorObj.id, where)
      : 0;

    items = await prisma.$queryRawUnsafe<RawPerformance[]>(
      `SELECT * FROM performances
       ${buildWhereSQL(where)}
       ORDER BY
         CASE status
           WHEN 'ongoing' THEN 1
           WHEN 'upcoming' THEN 2
           WHEN 'completed' THEN 3
           ELSE 4
         END,
         CASE status
           WHEN 'ongoing' THEN EXTRACT(EPOCH FROM start_date) * -1
           WHEN 'upcoming' THEN EXTRACT(EPOCH FROM start_date)
           WHEN 'completed' THEN EXTRACT(EPOCH FROM end_date) * -1
           ELSE EXTRACT(EPOCH FROM start_date)
         END
       LIMIT ${take} OFFSET ${offset}`
    );
  } else {
    items = await prisma.performance.findMany({
      where,
      orderBy,
      take,
      cursor: cursorObj,
      skip: cursorObj ? 1 : 0,
    });
  }

  const total = await prisma.performance.count({ where });

  if (params.sort === "date") {
    const rawItems = items as RawPerformance[];
    const hasNext = rawItems.length > params.limit;
    const data = hasNext ? rawItems.slice(0, params.limit) : rawItems;
    const nextCursor = hasNext ? data[data.length - 1].id : null;
    return {
      data: data.map(serializeRawPerformance),
      pagination: { cursor: nextCursor, hasNext, total },
    };
  }

  const hasNext = items.length > params.limit;
  const prismaItems = items as Awaited<ReturnType<typeof prisma.performance.findMany>>;
  const data = hasNext ? prismaItems.slice(0, params.limit) : prismaItems;
  const nextCursor = hasNext ? data[data.length - 1].id : null;
  return {
    data: data.map(serializePerformance),
    pagination: { cursor: nextCursor, hasNext, total },
  };
}

export async function getPerformanceById(id: string) {
  const performance = await prisma.performance.findUnique({ where: { id } });
  if (!performance) return null;
  return serializePerformance(performance);
}

// Raw SQL 결과 타입 (snake_case → Prisma 모델과 동일 매핑)
type RawPerformance = {
  id: string;
  kopis_id: string;
  title: string;
  genre: string;
  start_date: Date;
  end_date: Date;
  venue: string;
  venue_address: string;
  status: string;
  poster_url: string | null;
  price: string;
  min_price: number | null;
  max_price: number | null;
  age_limit: string;
  runtime: string | null;
  cast: string | null;
  synopsis: string | null;
  ticket_urls: unknown;
  created_at: Date;
  updated_at: Date;
};

function serializeRawPerformance(p: RawPerformance) {
  return {
    id: p.id,
    kopisId: p.kopis_id,
    title: p.title,
    genre: p.genre,
    startDate: p.start_date.toISOString(),
    endDate: p.end_date.toISOString(),
    venue: p.venue,
    venueAddress: p.venue_address,
    status: p.status,
    posterUrl: p.poster_url,
    price: p.price,
    minPrice: p.min_price,
    maxPrice: p.max_price,
    ageLimit: p.age_limit,
    runtime: p.runtime,
    cast: p.cast,
    synopsis: p.synopsis,
    ticketUrls: p.ticket_urls as { name: string; url: string }[],
    createdAt: p.created_at.toISOString(),
    updatedAt: p.updated_at.toISOString(),
  };
}

// Prisma where → 간단한 SQL WHERE 생성 (날짜순 raw 쿼리용)
function buildWhereSQL(where: Prisma.PerformanceWhereInput): string {
  const conditions: string[] = [];

  if (where.OR) {
    // 검색어 (title OR cast)
    const orConds = (where.OR as { title?: { contains: string }; cast?: { contains: string } }[])
      .map((o) => {
        if (o.title?.contains) return `title ILIKE '%${escapeSql(o.title.contains)}%'`;
        if (o.cast?.contains) return `"cast" ILIKE '%${escapeSql(o.cast.contains)}%'`;
        return null;
      })
      .filter(Boolean);
    if (orConds.length) conditions.push(`(${orConds.join(" OR ")})`);
  }
  if (where.genre && typeof where.genre === "string") conditions.push(`genre = '${escapeSql(where.genre)}'`);
  if (where.status && typeof where.status === "string") conditions.push(`status = '${escapeSql(where.status)}'`);
  if (where.startDate && typeof where.startDate === "object" && "gte" in where.startDate) {
    conditions.push(`start_date >= '${(where.startDate.gte as Date).toISOString()}'`);
  }
  if (where.endDate && typeof where.endDate === "object" && "lte" in where.endDate) {
    conditions.push(`end_date <= '${(where.endDate.lte as Date).toISOString()}'`);
  }
  if (where.minPrice && typeof where.minPrice === "object" && "gte" in where.minPrice) {
    conditions.push(`min_price >= ${where.minPrice.gte}`);
  }
  if (where.maxPrice && typeof where.maxPrice === "object" && "lte" in where.maxPrice) {
    conditions.push(`max_price <= ${where.maxPrice.lte}`);
  }
  if (where.ageLimit && typeof where.ageLimit === "object" && "contains" in where.ageLimit) {
    conditions.push(`age_limit ILIKE '%${escapeSql(where.ageLimit.contains as string)}%'`);
  }
  if (where.venue && typeof where.venue === "object" && "contains" in where.venue) {
    conditions.push(`venue ILIKE '%${escapeSql(where.venue.contains as string)}%'`);
  }
  if (where.id && typeof where.id === "object" && "in" in where.id) {
    const ids = (where.id.in as string[]).map((id) => `'${escapeSql(id)}'`).join(",");
    conditions.push(`id IN (${ids})`);
  }

  return conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
}

function escapeSql(str: string): string {
  return str.replace(/'/g, "''");
}

async function getOffsetForCursor(
  cursorId: string,
  where: Prisma.PerformanceWhereInput
): Promise<number> {
  // 커서 ID 이전 행 수를 카운트 (간단 offset 방식)
  const result = await prisma.$queryRawUnsafe<{ count: number }[]>(
    `SELECT COUNT(*)::int AS count FROM performances
     ${buildWhereSQL(where)}
     ${buildWhereSQL(where) ? "AND" : "WHERE"} id <= '${escapeSql(cursorId)}'`
  );
  return result[0]?.count ?? 0;
}

function serializePerformance(p: {
  id: string;
  kopisId: string;
  title: string;
  genre: string;
  startDate: Date;
  endDate: Date;
  venue: string;
  venueAddress: string;
  status: string;
  posterUrl: string | null;
  price: string;
  minPrice: number | null;
  maxPrice: number | null;
  ageLimit: string;
  runtime: string | null;
  cast: string | null;
  synopsis: string | null;
  ticketUrls: unknown;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...p,
    startDate: p.startDate.toISOString(),
    endDate: p.endDate.toISOString(),
    ticketUrls: p.ticketUrls as { name: string; url: string }[],
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}
