// Design Ref: §4.3 — 동적 sitemap (단일 파일, 모든 URL 포함)
// Plan SC: FR-13 (genre/venue 포함), FR-12 (50K 이하 단일 파일)
//
// 과거 시도했던 generateSitemaps() 분할은 Next.js 16의 id 타입 전달 이슈로 실패했다.
// 현재 PickShow 공연 수는 수천 건 수준이므로 단일 sitemap (Google 권장 50,000 URL 이하)로 충분하다.
// 공연이 10만 건을 넘어서면 그때 분할로 전환한다.
import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { getAllActiveVenues } from "@/features/search/service";
import { GENRE_SLUGS, venueToSlug } from "@/lib/seo/slug";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pickshow.kr";
// Google 단일 sitemap 제한: 50,000 URL. 안전 마진 10%.
const MAX_PERFORMANCES = 45_000;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // ─── 1. 정적 페이지 ───
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

  // ─── 2. Plan SC: FR-13 — /genre/* 랜딩 페이지 (7개) ───
  const genrePages: MetadataRoute.Sitemap = GENRE_SLUGS.map((slug) => ({
    url: `${SITE_URL}/genre/${slug}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.9,
  }));

  // ─── 3. Plan SC: FR-13 — /venue/* 랜딩 페이지 (활성 공연장 전체) ───
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

  // ─── 4. 공연 상세 페이지 (최근 업데이트 순, 최대 45K) ───
  let performancePages: MetadataRoute.Sitemap = [];
  try {
    const performances = await prisma.performance.findMany({
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: MAX_PERFORMANCES,
    });
    performancePages = performances.map((p) => ({
      url: `${SITE_URL}/performance/${p.id}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch {
    // DB 미연결 시 공연 페이지는 생략
  }

  return [...staticPages, ...genrePages, ...venuePages, ...performancePages];
}
