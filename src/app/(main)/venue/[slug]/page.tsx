// Design Ref: §5.1 + §5.4 — 공연장 랜딩 페이지 (RSC + ISR + ItemList/Breadcrumb JSON-LD)
// Plan SC: FR-10 (/venue/[slug]), FR-04 (canonical), FR-11 (ISR)
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import {
  getAllActiveVenues,
  getPerformancesByVenue,
} from "@/features/search/service";
import {
  generateVenueMetadata,
  generateBreadcrumbJsonLd,
  generateItemListJsonLd,
  generatePlaceJsonLd,
  serializeJsonLd,
} from "@/lib/seo";
import { venueToSlug } from "@/lib/seo/slug";
import PerformanceCard from "@/components/performance/PerformanceCard";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pickshow.kr";

// Plan SC: FR-11 — ISR
export const revalidate = 3600;

/**
 * Plan SC: FR-10 — 활성 공연장 전부 정적 사전 생성.
 * 빌드 시 공연장 목록을 조회하여 slug 매핑을 생성한다.
 */
export async function generateStaticParams() {
  try {
    const venues = await getAllActiveVenues();
    return venues.map((venue) => ({ slug: venueToSlug(venue) }));
  } catch {
    // DB 미연결 시 빌드 실패 방지
    return [];
  }
}

/**
 * slug → venue 역방향 조회.
 * venueToSlug은 해시 기반이라 역변환 불가 → 전체 목록 스캔 후 일치 항목 반환.
 * 활성 공연장은 보통 수백 개 수준이므로 O(N) 허용.
 */
async function resolveVenueFromSlug(slug: string): Promise<string | null> {
  const venues = await getAllActiveVenues();
  return venues.find((v) => venueToSlug(v) === slug) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const venue = await resolveVenueFromSlug(slug);
  if (!venue) return { title: "공연장을 찾을 수 없습니다" };

  const performances = await getPerformancesByVenue(venue, { limit: 1 });

  return generateVenueMetadata({
    venue,
    slug,
    performanceCount: performances.length > 0 ? performances.length : 0,
  });
}

export default async function VenueLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const venue = await resolveVenueFromSlug(slug);
  if (!venue) notFound();

  const performances = await getPerformancesByVenue(venue, { limit: 50 });

  // 주소는 첫 공연에서 추출 (같은 공연장이면 동일)
  const venueAddress = performances[0]?.venueAddress ?? "";

  // Plan SC: FR-08 — BreadcrumbList JSON-LD
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: "홈", url: SITE_URL },
    { name: venue, url: `${SITE_URL}/venue/${slug}` },
  ]);

  // ItemList JSON-LD
  const itemListJsonLd =
    performances.length > 0
      ? generateItemListJsonLd({
          name: `${venue} 공연 목록`,
          description: `${venue}에서 열리는 공연 ${performances.length}건`,
          url: `${SITE_URL}/venue/${slug}`,
          performances: performances.map((p) => ({
            id: p.id,
            title: p.title,
            posterUrl: p.posterUrl,
          })),
        })
      : null;

  // Gap I6 — Place JSON-LD (PerformingArtsTheater Rich Results 자격)
  const placeJsonLd = generatePlaceJsonLd({
    venue,
    venueAddress,
    slug,
    performanceCount: performances.length,
  });

  // Gap I3 — 현재 공연 중인 장르 추출 (SEO 본문 동적 확장용)
  const activeGenres = Array.from(
    new Set(performances.map((p) => p.genre).filter(Boolean)),
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
      />
      {itemListJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(itemListJsonLd) }}
        />
      )}
      {/* Gap I6 — Place JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(placeJsonLd) }}
      />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumb (가시) */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-xs text-text-muted mb-4"
        >
          <Link href="/" className="hover:text-mint-dark">
            홈
          </Link>
          <span>›</span>
          <span className="text-text-secondary">{venue}</span>
        </nav>

        {/* SEO 헤더 — Gap I3: 200자+ 동적 longDescription */}
        <header className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-3">
            {venue} 공연 예매처
          </h1>
          <p className="text-sm text-text-muted leading-relaxed max-w-3xl">
            {venue}에서 열리는 공연 정보를 PickShow에서 한눈에 확인하고,
            인터파크·예스24·티켓링크·멜론티켓·놀유니버스·NHN티켓링크 등 주요 예매처로
            바로 이동할 수 있는 통합 예매처 검색 페이지입니다.
            {performances.length > 0
              ? ` 현재 ${venue}에서는 ${performances.length}건의 공연이 진행 중이거나 예정되어 있으며,`
              : ` 현재 예정된 공연 정보는 없지만 곧 업데이트됩니다.`}
            {activeGenres.length > 0 &&
              ` 주요 장르는 ${activeGenres
                .slice(0, 5)
                .map((g) => {
                  const map: Record<string, string> = {
                    musical: "뮤지컬",
                    theater: "연극",
                    concert: "콘서트",
                    classic: "클래식",
                    dance: "무용",
                    korean: "국악",
                    etc: "기타",
                  };
                  return map[g] ?? g;
                })
                .join(", ")}입니다.`}{" "}
            공연 기간, 출연진, 러닝타임, 관람 연령, 가격 정보를 비교하고 원하는 예매 사이트에서
            즉시 예매하세요. {venue} 관련 공연 정보는 KOPIS 공식 데이터를 기반으로 매일 자동
            업데이트됩니다.
          </p>
          {venueAddress && (
            <p className="mt-2 text-xs text-text-muted">📍 {venueAddress}</p>
          )}
        </header>

        {/* 공연 목록 */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-4">
            현재 공연 중·예정{" "}
            <span className="text-text-muted text-sm font-normal">
              ({performances.length}건)
            </span>
          </h2>

          {performances.length === 0 ? (
            <div className="text-center py-16 text-text-muted">
              <p className="text-base mb-1">
                현재 {venue}에서 예정된 공연이 없습니다.
              </p>
              <p className="text-sm">
                <Link href="/" className="text-mint-dark hover:underline">
                  전체 공연 보기 →
                </Link>
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {performances.map((p) => (
                <PerformanceCard key={p.id} performance={p} />
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
