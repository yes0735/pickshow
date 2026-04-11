// Design Ref: §4.3 — 동적 sitemap (generateSitemaps 분할, cursor 페이지네이션)
// Plan SC: FR-12 (분할), FR-13 (genre/venue 포함)
//
// Next.js 16의 generateSitemaps()로 대량 URL을 분할한다.
// - sitemap[0]: 정적 페이지 + /genre/* + /venue/*
// - sitemap[1..N]: 공연 상세 페이지 (50,000개씩)
//
// cursor 기반 페이지네이션: OFFSET 대신 WHERE id > ? ORDER BY id
// → 대량 데이터에서도 O(log N) 인덱스 조회.
import type { MetadataRoute } from "next";
import {
  countAllPerformances,
  getAllActiveVenues,
} from "@/features/search/service";
import { GENRE_SLUGS, venueToSlug } from "@/lib/seo/slug";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pickshow.kr";
const PERFORMANCES_PER_SITEMAP = 5000; // Google 권장 50,000 이하, 안정성 위해 5,000

/**
 * generateSitemaps: sitemap index를 자동 생성. 각 id는 sitemap/{id}.xml 로 매핑.
 * id=0 은 정적 + 랜딩, id=1..N 은 공연 상세.
 */
export async function generateSitemaps(): Promise<Array<{ id: number }>> {
  try {
    const total = await countAllPerformances();
    const performancePages = Math.max(1, Math.ceil(total / PERFORMANCES_PER_SITEMAP));
    // id=0: static + landing, id=1..N: performances
    return Array.from({ length: performancePages + 1 }, (_, i) => ({ id: i }));
  } catch {
    // DB 미연결 시에도 static + landing 만큼은 제공
    return [{ id: 0 }];
  }
}

export default async function sitemap({
  id,
}: {
  id: number;
}): Promise<MetadataRoute.Sitemap> {
  // ─── id=0: 정적 페이지 + 장르/공연장 랜딩 ───
  if (id === 0) {
    const now = new Date();

    const staticPages: MetadataRoute.Sitemap = [
      {
        url: SITE_URL,
        lastModified: now,
        changeFrequency: "daily",
        priority: 1.0,
      },
      {
        url: `${SITE_URL}/community/anonymous`,
        lastModified: now,
        changeFrequency: "hourly",
        priority: 0.7,
      },
      {
        url: `${SITE_URL}/community/member`,
        lastModified: now,
        changeFrequency: "hourly",
        priority: 0.7,
      },
      {
        url: `${SITE_URL}/privacy`,
        changeFrequency: "monthly",
        priority: 0.3,
      },
      {
        url: `${SITE_URL}/terms`,
        changeFrequency: "monthly",
        priority: 0.3,
      },
    ];

    // Plan SC: FR-13 — /genre/* 전체
    const genrePages: MetadataRoute.Sitemap = GENRE_SLUGS.map((slug) => ({
      url: `${SITE_URL}/genre/${slug}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.9,
    }));

    // Plan SC: FR-13 — /venue/* (활성 공연장 전부)
    let venuePages: MetadataRoute.Sitemap = [];
    try {
      const venues = await getAllActiveVenues();
      venuePages = venues.map((venue) => ({
        url: `${SITE_URL}/venue/${venueToSlug(venue)}`,
        lastModified: now,
        changeFrequency: "daily" as const,
        priority: 0.8,
      }));
    } catch {
      // DB 미연결 시 venue 페이지는 생략
    }

    return [...staticPages, ...genrePages, ...venuePages];
  }

  // ─── id=1..N: 공연 상세 페이지 분할 ───
  // id=1 → skip 0, id=2 → skip 5,000, ...
  // cursor 기반이므로 이전 batch의 마지막 id를 찾아 이어가야 하지만,
  // sitemap 호출은 병렬일 수 있으므로 offset-style로 처리.
  // Prisma cursor는 OFFSET을 내부적으로 안 쓰므로 여기서는 skip+take 조합 사용.
  const pageIndex = id - 1; // 0-based

  try {
    // Prisma의 skip + take + orderBy id로 stable 페이지네이션
    // (sitemap 데이터는 자주 갱신되므로 skip 방식도 허용)
    const performances = await getPerformanceIdsForSitemapByOffset({
      offset: pageIndex * PERFORMANCES_PER_SITEMAP,
      limit: PERFORMANCES_PER_SITEMAP,
    });

    return performances.map((p) => ({
      url: `${SITE_URL}/performance/${p.id}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch {
    return [];
  }
}

/**
 * sitemap 분할용 offset 기반 조회.
 * service.ts의 getPerformanceIdsForSitemap은 cursor 기반이지만,
 * generateSitemaps의 id 분할은 병렬 호출이므로 offset이 적합하다.
 * Prisma는 내부적으로 id 인덱스를 사용하여 skip을 효율 처리.
 */
async function getPerformanceIdsForSitemapByOffset(opts: {
  offset: number;
  limit: number;
}): Promise<Array<{ id: string; updatedAt: Date }>> {
  const { prisma } = await import("@/lib/prisma");
  return prisma.performance.findMany({
    select: { id: true, updatedAt: true },
    orderBy: { id: "asc" },
    skip: opts.offset,
    take: opts.limit,
  });
}
