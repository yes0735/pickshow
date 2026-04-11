// Design Ref: §5.4 + §9 SEO — 직접 URL 접근용 공연 상세 페이지 (SSR + SEO + ISR)
// Plan SC: FR-02 (next/image), FR-06 (Event JSON-LD 보강), FR-08 (BreadcrumbList), FR-11 (ISR)
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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pickshow.kr";

// Plan SC: FR-11 — on-demand ISR (Vercel Edge Cache s-maxage=3600, stale-while-revalidate)
export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
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
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const performance = await getPerformanceById(id);

  if (!performance) notFound();

  // Plan SC: FR-06 — Event JSON-LD (보강된 필드: eventStatus, PostalAddress, performer, organizer, offers.priceCurrency)
  const eventJsonLd = generateEventJsonLd({
    ...performance,
    performanceId: performance.id,
    startDate: new Date(performance.startDate),
    endDate: new Date(performance.endDate),
  });

  // Plan SC: FR-08 — BreadcrumbList JSON-LD (홈 > 장르 > 공연명)
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
    { name: performance.title, url: `${SITE_URL}/performance/${performance.id}` },
  ]);

  return (
    <>
      {/* Plan SC: FR-06 — Event JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(eventJsonLd) }}
      />
      {/* Plan SC: FR-08 — BreadcrumbList JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
      />

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Plan SC: FR-08 — 사용자 가시 breadcrumb (SEO + UX) */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-xs text-text-muted mb-4"
        >
          <Link href="/" className="hover:text-mint-dark">
            홈
          </Link>
          {genreMeta && (
            <>
              <span>›</span>
              <Link
                href={`/genre/${genreMeta.slug}`}
                className="hover:text-mint-dark"
              >
                {genreMeta.label}
              </Link>
            </>
          )}
          <span>›</span>
          <span className="truncate text-text-secondary">{performance.title}</span>
        </nav>

        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-mint-dark mb-6"
        >
          <svg
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          검색으로 돌아가기
        </Link>

        {/* Plan SC: FR-02 — next/image로 LCP 최적화 (priority + sizes) */}
        {performance.posterUrl && (
          <div className="relative w-full max-w-md mx-auto aspect-[3/4] rounded-2xl overflow-hidden bg-bg-secondary mb-6">
            <Image
              src={performance.posterUrl}
              alt={`${performance.title} 공연 포스터`}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 448px"
              className="object-contain"
              unoptimized={!isOptimizableHost(performance.posterUrl)}
            />
          </div>
        )}

        <h1 className="text-2xl font-bold mb-4">{performance.title}</h1>

        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div>
            <span className="text-text-muted text-xs">장르</span>
            <p className="font-medium">{genreLabel(performance.genre)}</p>
          </div>
          <div>
            <span className="text-text-muted text-xs">공연상태</span>
            <p className="font-medium">{performance.status}</p>
          </div>
          <div>
            <span className="text-text-muted text-xs">공연기간</span>
            <p className="font-medium">
              {formatDateRange(
                new Date(performance.startDate),
                new Date(performance.endDate),
              )}
            </p>
          </div>
          <div>
            <span className="text-text-muted text-xs">공연장소</span>
            <p className="font-medium">{performance.venue}</p>
          </div>
          <div>
            <span className="text-text-muted text-xs">관람연령</span>
            <p className="font-medium">{performance.ageLimit || "-"}</p>
          </div>
          <div>
            <span className="text-text-muted text-xs">러닝타임</span>
            <p className="font-medium">{performance.runtime || "-"}</p>
          </div>
          <div className="col-span-2">
            <span className="text-text-muted text-xs">가격</span>
            <p className="font-medium text-pink-dark">
              {formatPriceRange(performance.minPrice, performance.maxPrice)}
            </p>
          </div>
        </div>

        {performance.cast && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold mb-2">출연진</h2>
            <p className="text-sm text-text-secondary">{performance.cast}</p>
          </div>
        )}

        {performance.synopsis && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold mb-2">줄거리</h2>
            <p className="text-sm text-text-secondary whitespace-pre-line leading-relaxed">
              {performance.synopsis}
            </p>
          </div>
        )}

        <TicketLinkList ticketUrls={performance.ticketUrls} />
      </div>
    </>
  );
}

