// Design Ref: §9.1 Application Layer — 검색 비즈니스 로직
import { prisma } from "@/lib/prisma";
import type { SearchParams } from "./schema";
import type { Prisma } from "@/generated/prisma/client";
import {
  fetchPerformanceList,
  fetchPerformanceDetail,
  parseKopisDate,
  mapGenreToCode,
  mapStatusToCode,
  parsePriceRange,
} from "@/lib/kopis";

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
    params.sort === "date_desc"
      ? { startDate: "desc" }
      : params.sort === "price_asc"
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

  // Fallback: DB 결과 적음 + 키워드 검색 시 KOPIS API 실시간 조회 → DB 보충
  if (total < 5 && params.q && params.q.trim().length > 0) {
    try {
      const kopisResults = await searchAndSaveFromKopis(params.q.trim());
      if (kopisResults.length > 0) {
        // KOPIS에서 새로 저장된 데이터 포함해서 DB 재조회
        const refreshed = await prisma.performance.findMany({
          where,
          orderBy,
          take: params.limit,
        });
        const refreshedTotal = await prisma.performance.count({ where });
        return {
          data: refreshed.map(serializePerformance),
          pagination: { cursor: null, hasNext: refreshedTotal > params.limit, total: refreshedTotal },
        };
      }
    } catch {
      // KOPIS API 실패 시 기존 DB 결과 반환
    }
  }

  return {
    data: data.map(serializePerformance),
    pagination: { cursor: nextCursor, hasNext, total },
  };
}

/**
 * KOPIS 키워드 검색 → DB upsert (fallback용)
 * 검색 범위: 1년 전 ~ 1년 후 (과거 종료 공연도 포함)
 */
async function searchAndSaveFromKopis(keyword: string) {
  const today = new Date();
  const pastDate = new Date(today);
  pastDate.setFullYear(pastDate.getFullYear() - 1);
  const futureDate = new Date(today);
  futureDate.setFullYear(futureDate.getFullYear() + 1);

  const fmt = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}${m}${day}`;
  };

  const list = await fetchPerformanceList({
    stdate: fmt(pastDate),
    eddate: fmt(futureDate),
    shprfnm: keyword,
    rows: 20,
  });

  if (list.length === 0) return [];

  const saved = [];
  for (const item of list) {
    try {
      const detail = await fetchPerformanceDetail(item.mt20id);
      if (!detail) continue;

      const priceRange = parsePriceRange(detail.pcseguidance);
      const ticketUrls = detail.relates.relate
        .filter((r) => r.relateurl)
        .map((r) => ({ name: r.relatenm, url: r.relateurl }));

      const perf = await prisma.performance.upsert({
        where: { kopisId: item.mt20id },
        update: {
          title: detail.prfnm,
          genre: mapGenreToCode(detail.genrenm),
          startDate: parseKopisDate(detail.prfpdfrom),
          endDate: parseKopisDate(detail.prfpdto),
          venue: detail.fcltynm,
          venueAddress: detail.area,
          status: mapStatusToCode(detail.prfstate),
          posterUrl: detail.poster || null,
          price: detail.pcseguidance,
          minPrice: priceRange.min,
          maxPrice: priceRange.max,
          ageLimit: detail.prfage,
          runtime: detail.prfruntime || null,
          cast: detail.prfcast || null,
          synopsis: detail.sty || null,
          ticketUrls,
        },
        create: {
          kopisId: item.mt20id,
          title: detail.prfnm,
          genre: mapGenreToCode(detail.genrenm),
          startDate: parseKopisDate(detail.prfpdfrom),
          endDate: parseKopisDate(detail.prfpdto),
          venue: detail.fcltynm,
          venueAddress: detail.area,
          status: mapStatusToCode(detail.prfstate),
          posterUrl: detail.poster || null,
          price: detail.pcseguidance,
          minPrice: priceRange.min,
          maxPrice: priceRange.max,
          ageLimit: detail.prfage,
          runtime: detail.prfruntime || null,
          cast: detail.prfcast || null,
          synopsis: detail.sty || null,
          ticketUrls,
        },
      });
      saved.push(perf);
    } catch {
      // 개별 공연 저장 실패 시 스킵
    }
  }

  return saved;
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
 * venue는 exact match.
 * 활성 공연(ongoing/upcoming) 우선, 없으면 최근 종료 공연 fallback.
 * → 과거 venue 페이지도 thin content가 되지 않도록 보장.
 */
export async function getPerformancesByVenue(
  venue: string,
  opts: { limit?: number } = {},
) {
  const limit = opts.limit ?? 50;

  // 1단계: 활성 공연
  const active = await prisma.performance.findMany({
    where: {
      venue,
      status: { in: ["ongoing", "upcoming"] },
    },
    orderBy: [{ startDate: "asc" }, { title: "asc" }],
    take: limit,
  });

  if (active.length > 0) {
    return active.map(serializePerformance);
  }

  // 2단계: fallback — 최근 종료 공연
  const completed = await prisma.performance.findMany({
    where: { venue },
    orderBy: [{ endDate: "desc" }, { title: "asc" }],
    take: limit,
  });
  return completed.map(serializePerformance);
}

/**
 * 활성 공연을 가진 공연장 이름 전체 목록.
 * /venue/[slug] generateStaticParams 에 사용.
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
 * 모든 공연장 이름 (활성 + 종료 포함).
 * venue slug 역방향 조회의 fallback으로 사용 — 빌드/런타임 DB 상태 차이 대응.
 * 과거 공연 venue도 검색 유입 유지를 위해 인덱싱 허용.
 */
export async function getAllVenueNames(): Promise<string[]> {
  const rows = await prisma.performance.findMany({
    select: { venue: true },
    distinct: ["venue"],
    orderBy: { venue: "asc" },
  });
  return rows.map((r) => r.venue).filter(Boolean);
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
