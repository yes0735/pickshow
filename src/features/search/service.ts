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

  const items = await prisma.performance.findMany({
    where,
    orderBy,
    take,
    cursor: cursorObj,
    skip: cursorObj ? 1 : 0,
  });

  const hasNext = items.length > params.limit;
  const data = hasNext ? items.slice(0, params.limit) : items;
  const nextCursor = hasNext ? data[data.length - 1].id : null;

  const total = await prisma.performance.count({ where });

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
