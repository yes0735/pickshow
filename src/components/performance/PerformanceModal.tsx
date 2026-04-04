// Design Ref: §5.4 — 공연 상세 모달 (Parallel Routes에서 사용)
"use client";

import { useRouter } from "next/navigation";
import type { Performance } from "@/types/performance";
import { formatDateRange, formatPriceRange } from "@/lib/utils";
import TicketLinkList from "./TicketLinkList";
import FavoriteButton from "./FavoriteButton";

interface Props {
  performance: Performance;
}

export default function PerformanceModal({ performance }: Props) {
  const router = useRouter();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={() => router.back()}
    >
      <div className="absolute inset-0 bg-black/40" />

      <div
        className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 닫기 버튼 */}
        <button
          onClick={() => router.back()}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 hover:bg-white shadow text-text-secondary"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        {/* 포스터 */}
        {performance.posterUrl && (
          <div className="w-full aspect-[3/2] bg-bg-secondary overflow-hidden rounded-t-2xl">
            <img
              src={performance.posterUrl}
              alt={performance.title}
              className="w-full h-full object-contain"
            />
          </div>
        )}

        {/* 정보 */}
        <div className="p-6 space-y-4">
          <h1 className="text-xl font-bold">{performance.title}</h1>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <InfoItem label="장르" value={performance.genre} />
            <InfoItem label="공연상태" value={performance.status} />
            <InfoItem
              label="공연기간"
              value={formatDateRange(
                new Date(performance.startDate),
                new Date(performance.endDate)
              )}
            />
            <InfoItem label="공연장소" value={performance.venue} />
            <InfoItem label="관람연령" value={performance.ageLimit} />
            <InfoItem label="러닝타임" value={performance.runtime ?? "-"} />
            <InfoItem
              label="가격"
              value={formatPriceRange(performance.minPrice, performance.maxPrice)}
            />
          </div>

          {performance.cast && (
            <div>
              <h3 className="text-sm font-semibold mb-1">출연진</h3>
              <p className="text-sm text-text-secondary">{performance.cast}</p>
            </div>
          )}

          {performance.synopsis && (
            <div>
              <h3 className="text-sm font-semibold mb-1">줄거리</h3>
              <p className="text-sm text-text-secondary whitespace-pre-line leading-relaxed">
                {performance.synopsis}
              </p>
            </div>
          )}

          <TicketLinkList ticketUrls={performance.ticketUrls} />

          {/* 찜 + 내가본공연 버튼 */}
          <div className="flex gap-2">
            <FavoriteButton performanceId={performance.id} size="md" />
          </div>

          {/* 공유 버튼 */}
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert("URL이 복사되었습니다!");
            }}
            className="w-full py-2.5 rounded-lg border border-border text-sm text-text-secondary hover:bg-bg-secondary transition-colors"
          >
            URL 복사하여 공유하기
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-text-muted text-xs">{label}</span>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
