// Design Ref: §5.3 + §9 SEO Strategy — Metadata utilities
// Plan SC: FR-04 (canonical), FR-05 (metadataBase + twitter)
//
// JSON-LD 빌더는 lib/seo/jsonld.ts 로 분리되었다.
// 이 파일은 Next.js Metadata 객체만 책임진다.
import type { Metadata } from "next";
import { getGenreMeta } from "@/lib/seo/slug";

const SITE_NAME = "PickShow";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pickshow.kr";
const SITE_DESCRIPTION =
  "공연 예매처 통합 검색 — 뮤지컬·연극·콘서트·클래식 공연 정보를 검색하고 예매처로 바로 이동";

const DEFAULT_OG_IMAGE = {
  url: `${SITE_URL}/og`,
  width: 1200,
  height: 630,
  alt: SITE_NAME,
} as const;

/**
 * 모든 페이지 공통 base metadata.
 * metadataBase를 설정하여 상대 경로 OG/canonical이 올바르게 해석되도록 한다.
 */
export function getBaseMetadata(): Metadata {
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: `${SITE_NAME} — 공연 예매처 통합 검색`,
      template: `%s — ${SITE_NAME}`,
    },
    description: SITE_DESCRIPTION,
    applicationName: SITE_NAME,
    authors: [{ name: SITE_NAME, url: SITE_URL }],
    keywords: [
      "공연 예매",
      "뮤지컬 예매",
      "연극 예매",
      "콘서트 예매",
      "공연 검색",
      "예매처 통합",
      "PickShow",
      "픽쇼",
    ],
    alternates: {
      canonical: "/",
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      url: SITE_URL,
      locale: "ko_KR",
      title: `${SITE_NAME} — 공연 예매처 통합 검색`,
      description: SITE_DESCRIPTION,
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: `${SITE_NAME} — 공연 예매처 통합 검색`,
      description: SITE_DESCRIPTION,
      images: [DEFAULT_OG_IMAGE.url],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    verification: process.env.NEXT_PUBLIC_GSC_VERIFICATION
      ? { google: process.env.NEXT_PUBLIC_GSC_VERIFICATION }
      : undefined,
  };
}

/**
 * 공연 상세 페이지 metadata.
 * canonical을 명시적으로 설정하여 쿼리스트링 변형의 중복 색인을 방지한다.
 */
export function generatePerformanceMetadata(performance: {
  title: string;
  venue: string;
  startDate: Date;
  endDate: Date;
  posterUrl: string | null;
  id: string;
  genre: string;
  synopsis: string | null;
}): Metadata {
  const dateRange = `${formatDateShort(performance.startDate)} ~ ${formatDateShort(performance.endDate)}`;
  const genreLabel = getGenreMeta(performance.genre)?.label ?? performance.genre;
  const description =
    performance.synopsis && performance.synopsis.trim().length > 0
      ? truncate(performance.synopsis, 155)
      : `${performance.title} | ${performance.venue} | ${dateRange} | ${genreLabel} 공연 예매처 바로가기`;

  const canonicalPath = `/genre/${performance.genre}/${performance.id}`;
  const ogImageUrl = `${SITE_URL}/og/performance/${performance.id}`;

  return {
    title: `${performance.title} 예매처`,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: `${performance.title} 예매처 — ${SITE_NAME}`,
      description,
      url: `${SITE_URL}${canonicalPath}`,
      type: "website",
      siteName: SITE_NAME,
      locale: "ko_KR",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: performance.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${performance.title} 예매처 — ${SITE_NAME}`,
      description,
      images: [ogImageUrl],
    },
  };
}

/**
 * 장르 랜딩 페이지 metadata.
 */
export function generateGenreMetadata(genreSlug: string): Metadata | null {
  const meta = getGenreMeta(genreSlug);
  if (!meta) return null;

  const canonicalPath = `/genre/${meta.slug}`;
  const title = `${meta.label} 예매처 통합 검색`;

  return {
    title,
    description: meta.description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: `${title} — ${SITE_NAME}`,
      description: meta.description,
      url: `${SITE_URL}${canonicalPath}`,
      type: "website",
      siteName: SITE_NAME,
      locale: "ko_KR",
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} — ${SITE_NAME}`,
      description: meta.description,
      images: [DEFAULT_OG_IMAGE.url],
    },
  };
}

/**
 * 공연장 랜딩 페이지 metadata.
 */
export function generateVenueMetadata(input: {
  venue: string;
  slug: string;
  performanceCount: number;
}): Metadata {
  const canonicalPath = `/venue/${input.slug}`;
  const title = `${input.venue} 공연 예매처`;
  const description = `${input.venue}에서 열리는 공연 ${input.performanceCount}건의 예매처 정보를 PickShow에서 통합 검색하세요.`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: `${title} — ${SITE_NAME}`,
      description,
      url: `${SITE_URL}${canonicalPath}`,
      type: "website",
      siteName: SITE_NAME,
      locale: "ko_KR",
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} — ${SITE_NAME}`,
      description,
      images: [DEFAULT_OG_IMAGE.url],
    },
  };
}

// ─────────────────────────────────────────────────────────
// Re-exports — 기존 consumer와의 호환성 유지
// ─────────────────────────────────────────────────────────
export {
  generateEventJsonLd,
  generateWebsiteJsonLd,
  generateBreadcrumbJsonLd,
  generateItemListJsonLd,
  generateOrganizationJsonLd,
  generatePlaceJsonLd,
  serializeJsonLd,
} from "@/lib/seo/jsonld";

// ─────────────────────────────────────────────────────────
// 내부 helpers
// ─────────────────────────────────────────────────────────

function formatDateShort(date: Date): string {
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + "…";
}
