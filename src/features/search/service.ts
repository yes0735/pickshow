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
  // 다중선택: 콤마 구분 문자열 → 배열로 파싱
  const parseMulti = (v?: string) => v ? v.split(",").filter(Boolean) : [];

  const genres = parseMulti(params.genre);
  if (genres.length === 1) where.genre = genres[0];
  else if (genres.length > 1) where.genre = { in: genres };

  const statuses = parseMulti(params.status);
  if (statuses.length === 1) where.status = statuses[0];
  else if (statuses.length > 1) where.status = { in: statuses };

  // 시작일: 이 날짜 이후에도 관람 가능한 공연 (endDate >= 시작일)
  if (params.startDate) where.endDate = { ...(where.endDate as object), gte: new Date(params.startDate) };
  // 종료일: 이 날짜 이전에 시작하는 공연 (startDate <= 종료일)
  if (params.endDate) where.startDate = { ...(where.startDate as object), lte: new Date(params.endDate) };
  if (params.minPrice !== undefined) where.minPrice = { gte: params.minPrice };
  if (params.maxPrice !== undefined) where.maxPrice = { lte: params.maxPrice };

  const ageLimits = parseMulti(params.ageLimit);
  if (ageLimits.length === 1) {
    where.ageLimit = { contains: ageLimits[0] };
  } else if (ageLimits.length > 1) {
    where.AND = [
      ...(where.AND as [] ?? []),
      { OR: ageLimits.map((a) => ({ ageLimit: { contains: a } })) },
    ];
  }

  // 예매처 (다중선택 — OR 조건)
  const ticketSites = parseMulti(params.ticketSite);
  if (ticketSites.length > 0) {
    const TOP_TICKET_SITES = [
      "놀유니버스", "네이버N예약", "NHN티켓링크", "예스24", "멜론티켓",
      "플레이티켓", "타임티켓", "나눔티켓", "엔티켓", "쿠팡",
    ];

    const hasEtc = ticketSites.includes("etc");
    const normalSites = ticketSites.filter((s) => s !== "etc");

    // 각 예매처를 ILIKE OR 조건으로 합침
    const likeClauses: string[] = [];
    const likeParams: string[] = [];

    normalSites.forEach((site) => {
      likeParams.push(`%${site}%`);
      likeClauses.push(`ticket_urls::text ILIKE $${likeParams.length}`);
    });

    if (hasEtc) {
      const notLike = TOP_TICKET_SITES.map((s) => {
        likeParams.push(`%${s}%`);
        return `ticket_urls::text NOT ILIKE $${likeParams.length}`;
      }).join(" AND ");
      likeClauses.push(`(${notLike})`);
    }

    if (likeClauses.length > 0) {
      const matchedIds = await prisma.$queryRawUnsafe<{ id: string }[]>(
        `SELECT id FROM performances WHERE ${likeClauses.join(" OR ")}`,
        ...likeParams
      );
      const ids = matchedIds.map((r) => r.id);
      if (ids.length === 0) {
        return { data: [], pagination: { cursor: null, hasNext: false, total: 0 } };
      }
      where.id = { in: ids };
    }
  }
  if (params.venue) {
    where.venue = { contains: params.venue, mode: "insensitive" };
  }

  const orderBy: Prisma.PerformanceOrderByWithRelationInput =
    params.sort === "price_asc"
      ? { minPrice: { sort: "asc", nulls: "last" } }
      : params.sort === "price_desc"
        ? { maxPrice: { sort: "desc", nulls: "last" } }
        : { title: "asc" }; // 가나다순

  const take = params.limit + 1;
  const cursorObj = params.cursor ? { id: params.cursor } : undefined;

  const items = await prisma.performance.findMany({
    where,
    orderBy,
    take,
    cursor: cursorObj,
    skip: cursorObj ? 1 : 0,
  });

  const total = await prisma.performance.count({ where });

  const hasNext = items.length > params.limit;
  const data = hasNext ? items.slice(0, params.limit) : items;
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

// ─────────────────────────────────────────────────────────
// seo-boost Phase D — 롱테일 랜딩 페이지 지원 (Plan SC: FR-09, FR-10, FR-12)
// ─────────────────────────────────────────────────────────

/**
 * Plan SC: FR-09 — 장르 랜딩 페이지 데이터
 * 활성 공연(공연종료 제외)만 반환. 기본 50건, 시작일 최신순.
 */
export async function getPerformancesByGenre(
  genre: string,
  opts: { limit?: number } = {},
) {
  const limit = opts.limit ?? 50;
  const items = await prisma.performance.findMany({
    where: {
      genre,
      status: { in: ["ongoing", "upcoming"] },
    },
    orderBy: [{ startDate: "asc" }, { title: "asc" }],
    take: limit,
  });
  return items.map(serializePerformance);
}

/**
 * Plan SC: FR-10 — 공연장 랜딩 페이지 데이터
 * venue는 exact match (Prisma case-insensitive 옵션 사용).
 */
export async function getPerformancesByVenue(
  venue: string,
  opts: { limit?: number } = {},
) {
  const limit = opts.limit ?? 50;
  const items = await prisma.performance.findMany({
    where: {
      venue,
      status: { in: ["ongoing", "upcoming"] },
    },
    orderBy: [{ startDate: "asc" }, { title: "asc" }],
    take: limit,
  });
  return items.map(serializePerformance);
}

/**
 * 활성 공연을 가진 공연장 이름 전체 목록.
 * /venue/[slug] generateStaticParams 및 slug → venue 역방향 조회에 사용.
 */
export async function getAllActiveVenues(): Promise<string[]> {
  const rows = await prisma.performance.findMany({
    where: { status: { in: ["ongoing", "upcoming"] } },
    select: { venue: true },
    distinct: ["venue"],
    orderBy: { venue: "asc" },
  });
  return rows.map((r) => r.venue).filter(Boolean);
}

/**
 * Plan SC: FR-12 — sitemap 분할용 cursor 기반 페이지네이션.
 * OFFSET 대신 WHERE id > cursor 방식으로 대량 데이터에서도 효율적.
 */
export async function getPerformanceIdsForSitemap(opts: {
  cursor?: string;
  limit: number;
}): Promise<Array<{ id: string; updatedAt: Date }>> {
  const rows = await prisma.performance.findMany({
    select: { id: true, updatedAt: true },
    orderBy: { id: "asc" },
    take: opts.limit,
    ...(opts.cursor
      ? { cursor: { id: opts.cursor }, skip: 1 }
      : {}),
  });
  return rows;
}

/**
 * sitemap 분할 개수 계산용 — 총 공연 개수.
 */
export async function countAllPerformances(): Promise<number> {
  return prisma.performance.count();
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
