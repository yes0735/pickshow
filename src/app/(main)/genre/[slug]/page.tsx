// Design Ref: §5.1 + §5.4 — 장르 랜딩 페이지 (RSC + ISR + ItemList/Breadcrumb JSON-LD)
// Plan SC: FR-09 (/genre/[slug]), FR-04 (canonical), FR-11 (ISR)
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getPerformancesByGenre } from "@/features/search/service";
import {
  generateGenreMetadata,
  generateBreadcrumbJsonLd,
  generateItemListJsonLd,
  serializeJsonLd,
} from "@/lib/seo";
import {
  GENRE_SLUGS,
  getGenreMeta,
  isGenreSlug,
} from "@/lib/seo/slug";
import PerformanceCard from "@/components/performance/PerformanceCard";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pickshow.kr";

// Plan SC: FR-11 — ISR (1시간 TTL + stale-while-revalidate)
export const revalidate = 3600;

// Plan SC: FR-09 — 활성 장르 전부 정적 사전 생성
export function generateStaticParams() {
  return GENRE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return (
    generateGenreMetadata(slug) ?? {
      title: "장르를 찾을 수 없습니다",
    }
  );
}

export default async function GenreLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (!isGenreSlug(slug)) notFound();
  const meta = getGenreMeta(slug);
  if (!meta) notFound();

  const performances = await getPerformancesByGenre(slug, { limit: 50 });

  // Plan SC: FR-08 — BreadcrumbList JSON-LD
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: "홈", url: SITE_URL },
    { name: meta.label, url: `${SITE_URL}/genre/${meta.slug}` },
  ]);

  // ItemList JSON-LD (공연 컬렉션)
  const itemListJsonLd =
    performances.length > 0
      ? generateItemListJsonLd({
          name: `${meta.label} 공연 목록`,
          description: meta.description,
          url: `${SITE_URL}/genre/${meta.slug}`,
          performances: performances.map((p) => ({
            id: p.id,
            title: p.title,
            posterUrl: p.posterUrl,
          })),
        })
      : null;

  // 관련 공연장 상위 8개 추출 (중복 제거)
  const relatedVenues = Array.from(
    new Set(performances.map((p) => p.venue).filter(Boolean)),
  ).slice(0, 8);

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
          <span className="text-text-secondary">{meta.label}</span>
        </nav>

        {/* SEO 헤더 */}
        <header className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-3">
            {meta.label} 예매처 통합 검색
          </h1>
          <p className="text-sm text-text-muted leading-relaxed max-w-3xl">
            {meta.longDescription}
          </p>
        </header>

        {/* 공연 목록 */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-4">
            현재 공연 중·예정 {meta.label}{" "}
            <span className="text-text-muted text-sm font-normal">
              ({performances.length}건)
            </span>
          </h2>

          {performances.length === 0 ? (
            <div className="text-center py-16 text-text-muted">
              <p className="text-base mb-1">
                현재 공연 중인 {meta.label} 공연이 없습니다.
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

        {/* 관련 공연장 */}
        {relatedVenues.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-semibold mb-4">주요 공연장</h2>
            <div className="flex flex-wrap gap-2">
              {relatedVenues.map((venue) => (
                <Link
                  key={venue}
                  href={`/?venue=${encodeURIComponent(venue)}&genre=${slug}`}
                  className="inline-flex items-center px-3 py-1.5 rounded-full border border-border text-xs text-text-secondary bg-white hover:bg-bg-secondary hover:border-mint-dark transition-colors"
                >
                  {venue}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 다른 장르 둘러보기 */}
        <section>
          <h2 className="text-lg font-semibold mb-4">다른 장르 보기</h2>
          <div className="flex flex-wrap gap-2">
            {GENRE_SLUGS.filter((s) => s !== slug).map((s) => {
              const m = getGenreMeta(s);
              if (!m) return null;
              return (
                <Link
                  key={s}
                  href={`/genre/${s}`}
                  className="inline-flex items-center px-3 py-1.5 rounded-full border border-border text-xs text-text-secondary bg-white hover:bg-bg-secondary hover:border-mint-dark transition-colors"
                >
                  {m.label}
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </>
  );
}
