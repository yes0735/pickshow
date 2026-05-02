// 공연 상세 페이지 — /genre/[slug]/[id] (카테고리 URL 내 상세)
// SSR + SEO + ISR
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getPerformanceById } from "@/features/search/service";
import {
  generatePerformanceMetadata,
  generateEventJsonLd,
  generateBreadcrumbJsonLd,
  serializeJsonLd,
} from "@/lib/seo";
import { getGenreMeta } from "@/lib/seo/slug";
import { isOptimizableHost } from "@/lib/image-host";
import { formatDateRange, formatPriceRange, genreLabel } from "@/lib/utils";
import TicketLinkList from "@/components/performance/TicketLinkList";
import StatusBadge from "@/components/performance/StatusBadge";
import FavoriteButton from "@/components/performance/FavoriteButton";
import MyPerfButton from "@/components/performance/MyPerfButton";
import ShareButton from "@/components/performance/ShareButton";
import ActiveGenreHint from "@/components/layout/ActiveGenreHint";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pickshow.kr";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const performance = await getPerformanceById(id);
  if (!performance) return { title: "공연을 찾을 수 없습니다" };

  return generatePerformanceMetadata({
    ...performance,
    startDate: new Date(performance.startDate),
    endDate: new Date(performance.endDate),
  });
}

export default async function PerformanceDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const performance = await getPerformanceById(id);

  if (!performance) notFound();

  const eventJsonLd = generateEventJsonLd({
    ...performance,
    performanceId: performance.id,
    startDate: new Date(performance.startDate),
    endDate: new Date(performance.endDate),
  });

  const genreMeta = getGenreMeta(performance.genre);
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: "홈", url: SITE_URL },
    ...(genreMeta
      ? [
          {
            name: genreMeta.label,
            url: `${SITE_URL}/genre/${genreMeta.slug}`,
          },
        ]
      : []),
    { name: performance.title, url: `${SITE_URL}/genre/${slug}/${performance.id}` },
  ]);

  return (
    <>
      <ActiveGenreHint genre={performance.genre} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(eventJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
      />

      {/* Breadcrumb — 카테고리 리스트와 동일 위치 (max-w-7xl) */}
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-xs text-text-muted mb-4"
        >
          <Link href="/" className="hover:text-mint-dark transition-colors">
            홈
          </Link>
          {genreMeta && (
            <>
              <span>›</span>
              <Link
                href={`/genre/${genreMeta.slug}`}
                className="hover:text-mint-dark transition-colors"
              >
                {genreMeta.label}
              </Link>
            </>
          )}
          <span>›</span>
          <span className="truncate text-text-secondary">{performance.title}</span>
        </nav>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-6 sm:pb-10">
        {/* 히어로: 포스터 + 핵심 정보 가로 배치 */}
        <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 mb-8">
          {performance.posterUrl && (
            <div className="relative w-full sm:w-72 shrink-0 aspect-[3/4] rounded-2xl overflow-hidden bg-bg-secondary shadow-sm">
              <Image
                src={performance.posterUrl}
                alt={`${performance.title} 공연 포스터`}
                fill
                priority
                sizes="(max-width: 640px) 100vw, 288px"
                className="object-contain"
                unoptimized={!isOptimizableHost(performance.posterUrl)}
              />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-3">
              <StatusBadge status={performance.status} size="md" />
              <span className="text-xs text-text-muted">{genreLabel(performance.genre)}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold leading-tight mb-4">
              {performance.title}
            </h1>

            <dl className="space-y-3 text-sm mb-5">
              <InfoRow label="공연기간" value={formatDateRange(new Date(performance.startDate), new Date(performance.endDate))} />
              <InfoRow label="공연장소" value={performance.venue} />
              <InfoRow label="관람연령" value={performance.ageLimit || "-"} />
              <InfoRow label="러닝타임" value={performance.runtime || "-"} />
              <InfoRow
                label="가격"
                value={formatPriceRange(performance.minPrice, performance.maxPrice)}
                highlight
              />
            </dl>

            <div className="flex items-center gap-2">
              <FavoriteButton performanceId={performance.id} size="md" />
              <MyPerfButton performanceId={performance.id} size="md" />
              <ShareButton />
            </div>
          </div>
        </div>

        <hr className="border-border-light mb-8" />

        {performance.cast && performance.cast.trim() && (
          <section className="mb-8">
            <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
              <span className="w-1 h-4 rounded-full bg-mint-dark inline-block" />
              출연진
            </h2>
            <p className="text-sm text-text-secondary leading-relaxed">{performance.cast}</p>
          </section>
        )}

        {performance.synopsis && performance.synopsis.trim() && (
          <section className="mb-8">
            <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
              <span className="w-1 h-4 rounded-full bg-pink inline-block" />
              줄거리
            </h2>
            <p className="text-sm text-text-secondary whitespace-pre-line leading-relaxed">
              {performance.synopsis}
            </p>
          </section>
        )}

        <section className="mb-8">
          <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
            <span className="w-1 h-4 rounded-full bg-mint inline-block" />
            예매하기
          </h2>
          <TicketLinkList ticketUrls={performance.ticketUrls} />
        </section>

        <div className="pt-4 border-t border-border-light">
          <Link
            href={`/genre/${slug}`}
            className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-mint-dark transition-colors"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="m15 18-6-6 6-6" />
            </svg>
            {genreMeta ? `${genreMeta.label} 목록으로` : "목록으로 돌아가기"}
          </Link>
        </div>
      </div>
    </>
  );
}

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-baseline gap-3">
      <dt className="w-16 shrink-0 text-text-muted text-xs">{label}</dt>
      <dd className={`font-medium ${highlight ? "text-pink-dark" : ""}`}>{value}</dd>
    </div>
  );
}
