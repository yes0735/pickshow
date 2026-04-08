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
