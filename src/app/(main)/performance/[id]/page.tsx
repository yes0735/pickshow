// Design Ref: §5.4 + §9 SEO — 직접 URL 접근용 공연 상세 페이지 (SSR + SEO)
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPerformanceById } from "@/features/search/service";
import {
  generatePerformanceMetadata,
  generateEventJsonLd,
} from "@/lib/seo";
import { formatDateRange, formatPriceRange, genreLabel } from "@/lib/utils";
import TicketLinkList from "@/components/performance/TicketLinkList";
import Link from "next/link";

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

  const jsonLd = generateEventJsonLd({
    ...performance,
    startDate: new Date(performance.startDate),
    endDate: new Date(performance.endDate),
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-mint-dark mb-6"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="m15 18-6-6 6-6" />
          </svg>
          검색으로 돌아가기
        </Link>

        {performance.posterUrl && (
          <div className="w-full max-w-md mx-auto aspect-[3/4] rounded-2xl overflow-hidden bg-bg-secondary mb-6">
            <img
              src={performance.posterUrl}
              alt={performance.title}
              className="w-full h-full object-contain"
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
                new Date(performance.endDate)
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
