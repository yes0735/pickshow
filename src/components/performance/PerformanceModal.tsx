// Design Ref: §5.4 — 공연 상세 모달 (모바일 bottom sheet, 데스크톱 센터 모달)
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Performance } from "@/types/performance";
import { formatDateRange, formatPriceRange } from "@/lib/utils";
import TicketLinkList from "./TicketLinkList";
import FavoriteButton from "./FavoriteButton";
import StatusBadge from "./StatusBadge";

interface Props {
  performance: Performance;
}

export default function PerformanceModal({ performance }: Props) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // 마운트 후 살짝 지연시켜 슬라이드 애니메이션 트리거
    const t = requestAnimationFrame(() => setVisible(true));
    // 모바일 스크롤 잠금
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(t);
      document.body.style.overflow = "";
    };
  }, []);

  const close = () => {
    setVisible(false);
    setTimeout(() => router.back(), 250);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
      onClick={close}
    >
      {/* 배경 오버레이 */}
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-250 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* 모달 / 바텀 시트 */}
      <div
        className={`relative bg-white w-full sm:max-w-2xl sm:w-full overflow-hidden shadow-xl
          rounded-t-3xl sm:rounded-2xl
          max-h-[92vh] sm:max-h-[90vh]
          transition-transform duration-300 ease-out
          ${
            visible
              ? "translate-y-0"
              : "translate-y-full sm:translate-y-4 sm:opacity-0"
          }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모바일 드래그 핸들 */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* 닫기 버튼 (데스크톱) */}
        <button
          onClick={close}
          className="hidden sm:flex absolute top-4 right-4 z-10 w-9 h-9 items-center justify-center rounded-full bg-white/90 hover:bg-white shadow-md text-text-secondary hover:text-foreground transition-colors"
          aria-label="닫기"
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        {/* 스크롤 영역 */}
        <div className="overflow-y-auto max-h-[calc(92vh-2rem)] sm:max-h-[90vh]">
          {/* 포스터 */}
          {performance.posterUrl && (
            <div className="w-full bg-gradient-to-b from-bg-secondary to-white overflow-hidden">
              <div className="relative aspect-[16/9] sm:aspect-[3/2]">
                <img
                  src={performance.posterUrl}
                  alt={performance.title}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          )}

          {/* 정보 */}
          <div className="p-5 sm:p-6 space-y-5">
            {/* 제목 + 찜 */}
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <StatusBadge status={performance.status} size="md" />
                  <span className="text-[11px] text-text-muted">{performance.genre}</span>
                </div>
                <h1 className="text-lg sm:text-xl font-bold leading-tight">
                  {performance.title}
                </h1>
              </div>
              <FavoriteButton performanceId={performance.id} size="md" />
            </div>

            {/* 주요 정보 */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <InfoItem
                label="공연기간"
                value={formatDateRange(
                  new Date(performance.startDate),
                  new Date(performance.endDate)
                )}
              />
              <InfoItem label="공연장소" value={performance.venue} />
              <InfoItem label="관람연령" value={performance.ageLimit || "-"} />
              <InfoItem label="러닝타임" value={performance.runtime ?? "-"} />
              <InfoItem
                label="가격"
                value={formatPriceRange(performance.minPrice, performance.maxPrice)}
                fullWidth
              />
            </div>

            {/* 출연진 */}
            {performance.cast && performance.cast.trim() && (
              <div>
                <h3 className="text-xs font-semibold text-text-muted mb-1.5">출연진</h3>
                <p className="text-sm">{performance.cast}</p>
              </div>
            )}

            {/* 줄거리 */}
            {performance.synopsis && performance.synopsis.trim() && (
              <div>
                <h3 className="text-xs font-semibold text-text-muted mb-1.5">줄거리</h3>
                <p className="text-sm text-text-secondary whitespace-pre-line leading-relaxed">
                  {performance.synopsis}
                </p>
              </div>
            )}

            {/* 여백 (하단 고정 버튼 피하기) */}
            <div className="h-2" />
          </div>

          {/* 예매처 + 공유 (하단 고정) */}
          <div className="sticky bottom-0 bg-white border-t border-border p-4 space-y-3 safe-area-bottom">
            <TicketLinkList ticketUrls={performance.ticketUrls} />
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert("URL이 복사되었습니다!");
              }}
              className="w-full py-2.5 rounded-lg border border-border text-sm text-text-secondary hover:bg-bg-secondary transition-colors"
            >
              URL 복사하여 공유
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({
  label,
  value,
  fullWidth,
}: {
  label: string;
  value: string;
  fullWidth?: boolean;
}) {
  return (
    <div className={fullWidth ? "col-span-2" : ""}>
      <span className="text-text-muted text-[11px] block mb-0.5">{label}</span>
      <p className={`text-sm font-medium ${fullWidth ? "text-pink-dark" : ""}`}>
        {value}
      </p>
    </div>
  );
}
