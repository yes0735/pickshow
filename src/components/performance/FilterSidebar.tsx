// 필터 사이드바 — 아코디언 섹션 + 활성 필터 뱃지
"use client";

import { useState } from "react";
import { useSearchStore, useCommonCodes } from "@/features/search/hooks";

export default function FilterSidebar() {
  const { filters, setFilter, resetFilters } = useSearchStore();

  const { data: statuses } = useCommonCodes("status");
  const { data: ageLimits } = useCommonCodes("age_limit");
  const { data: ticketSites } = useCommonCodes("ticket_site");

  // 적용된 필터 수 계산
  const activeCount = [
    filters.status,
    filters.startDate,
    filters.endDate,
    filters.minPrice,
    filters.maxPrice,
    filters.ageLimit,
    filters.ticketSite,
    filters.venue,
  ].filter(Boolean).length;

  return (
    <aside className="w-full lg:w-60 flex-shrink-0">
      <div className="sticky top-20">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-sm">필터</h2>
            {activeCount > 0 && (
              <span className="w-5 h-5 flex items-center justify-center rounded-full bg-mint-dark text-white text-[10px] font-bold">
                {activeCount}
              </span>
            )}
          </div>
          {activeCount > 0 && (
            <button
              onClick={resetFilters}
              className="text-xs text-text-muted hover:text-pink-dark transition-colors"
            >
              전체 초기화
            </button>
          )}
        </div>

        <div className="space-y-1">
          {/* 공연상태 */}
          <AccordionSection title="공연상태" active={!!filters.status}>
            <div className="flex flex-wrap gap-1.5">
              {statuses?.map((s) => (
                <button
                  key={s.code}
                  onClick={() =>
                    setFilter("status", filters.status === s.code ? undefined : s.code)
                  }
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    filters.status === s.code
                      ? "bg-mint-dark text-white"
                      : "bg-bg-secondary text-text-secondary hover:bg-border-light"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </AccordionSection>

          {/* 공연기간 */}
          <AccordionSection
            title="공연기간"
            active={!!(filters.startDate || filters.endDate)}
          >
            {/* 데스크톱 사이드바(좁음): 2줄, 모바일 바텀시트(넓음): 1줄 */}
            <div className="grid grid-cols-1 gap-1.5">
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-text-muted pointer-events-none">시작</span>
                <input
                  type="date"
                  aria-label="시작일"
                  value={filters.startDate ?? ""}
                  onClick={(e) => (e.target as HTMLInputElement).showPicker()}
                  onChange={(e) => setFilter("startDate", e.target.value || undefined)}
                  className="w-full h-9 pl-9 pr-7 rounded-lg border border-border text-xs focus:outline-none focus:border-mint-dark cursor-pointer"
                />
                {filters.startDate && (
                  <ClearButton onClick={() => setFilter("startDate", undefined)} />
                )}
              </div>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-text-muted pointer-events-none">종료</span>
                <input
                  type="date"
                  aria-label="종료일"
                  value={filters.endDate ?? ""}
                  onClick={(e) => (e.target as HTMLInputElement).showPicker()}
                  onChange={(e) => setFilter("endDate", e.target.value || undefined)}
                  className="w-full h-9 pl-9 pr-7 rounded-lg border border-border text-xs focus:outline-none focus:border-mint-dark cursor-pointer"
                />
                {filters.endDate && (
                  <ClearButton onClick={() => setFilter("endDate", undefined)} />
                )}
              </div>
            </div>
          </AccordionSection>

          {/* 가격대 */}
          <AccordionSection
            title="가격대"
            active={filters.minPrice !== undefined || filters.maxPrice !== undefined}
          >
            <PriceRangeSelector
              minPrice={filters.minPrice}
              maxPrice={filters.maxPrice}
              onChange={(min, max) => {
                setFilter("minPrice", min);
                setFilter("maxPrice", max);
              }}
            />
          </AccordionSection>

          {/* 관람연령 */}
          <AccordionSection title="관람연령" active={!!filters.ageLimit}>
            <div className="flex flex-wrap gap-1.5">
              {ageLimits?.map((a) => (
                <button
                  key={a.code}
                  onClick={() =>
                    setFilter("ageLimit", filters.ageLimit === a.code ? undefined : a.code)
                  }
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    filters.ageLimit === a.code
                      ? "bg-mint-dark text-white"
                      : "bg-bg-secondary text-text-secondary hover:bg-border-light"
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </AccordionSection>

          {/* 예매처 */}
          <AccordionSection title="예매처" active={!!filters.ticketSite}>
            <div className="flex flex-wrap gap-1.5">
              {ticketSites?.map((t) => (
                <button
                  key={t.code}
                  onClick={() =>
                    setFilter(
                      "ticketSite",
                      filters.ticketSite === t.code ? undefined : t.code
                    )
                  }
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    filters.ticketSite === t.code
                      ? "bg-mint-dark text-white"
                      : "bg-bg-secondary text-text-secondary hover:bg-border-light"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </AccordionSection>

          {/* 공연장소 */}
          <AccordionSection title="공연장소" active={!!filters.venue}>
            <div className="relative">
              <input
                type="text"
                placeholder="장소명을 입력하세요"
                aria-label="공연장소 검색"
                value={filters.venue ?? ""}
                onChange={(e) => setFilter("venue", e.target.value || undefined)}
                className="w-full h-9 px-2.5 pr-7 rounded-lg border border-border text-xs focus:outline-none focus:border-mint-dark"
              />
              {filters.venue && (
                <ClearButton onClick={() => setFilter("venue", undefined)} />
              )}
            </div>
          </AccordionSection>
        </div>
      </div>
    </aside>
  );
}

function AccordionSection({
  title,
  active,
  children,
}: {
  title: string;
  active: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="border-b border-border-light last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-foreground">{title}</span>
          {active && (
            <span className="w-1.5 h-1.5 rounded-full bg-mint-dark" />
          )}
        </div>
        <svg
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          className={`text-text-muted transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && <div className="pb-3">{children}</div>}
    </div>
  );
}

const PRICE_MAX = 200000;
const PRICE_STEP = 10000;

function PriceRangeSelector({
  minPrice,
  maxPrice,
  onChange,
}: {
  minPrice: number | undefined;
  maxPrice: number | undefined;
  onChange: (min: number | undefined, max: number | undefined) => void;
}) {
  const min = minPrice ?? 0;
  const max = maxPrice ?? PRICE_MAX;
  const active = minPrice !== undefined || maxPrice !== undefined;

  const formatWon = (v: number) =>
    v >= PRICE_MAX ? "20만원+" : v === 0 ? "0원" : `${(v / 10000).toFixed(0)}만원`;

  return (
    <div className="space-y-3">
      {/* 가격 표시 */}
      <div className="flex justify-between text-xs font-medium">
        <span className={active ? "text-mint-dark" : "text-text-muted"}>
          {formatWon(min)}
        </span>
        <span className={active ? "text-mint-dark" : "text-text-muted"}>
          {formatWon(max)}
        </span>
      </div>

      {/* 듀얼 슬라이더 */}
      <div className="relative h-6 flex items-center">
        {/* 트랙 배경 */}
        <div className="absolute w-full h-1.5 rounded-full bg-border-light" />
        {/* 활성 트랙 */}
        <div
          className="absolute h-1.5 rounded-full bg-mint-dark"
          style={{
            left: `${(min / PRICE_MAX) * 100}%`,
            right: `${100 - (max / PRICE_MAX) * 100}%`,
          }}
        />
        {/* 최소 슬라이더 */}
        <input
          type="range"
          aria-label="최소 가격"
          min={0}
          max={PRICE_MAX}
          step={PRICE_STEP}
          value={min}
          onChange={(e) => {
            const v = Number(e.target.value);
            const newMin = v >= max ? max - PRICE_STEP : v;
            onChange(
              newMin <= 0 ? undefined : newMin,
              maxPrice
            );
          }}
          className="absolute w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-mint-dark [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-mint-dark [&::-moz-range-thumb]:cursor-pointer"
        />
        {/* 최대 슬라이더 */}
        <input
          type="range"
          aria-label="최대 가격"
          min={0}
          max={PRICE_MAX}
          step={PRICE_STEP}
          value={max}
          onChange={(e) => {
            const v = Number(e.target.value);
            const newMax = v <= min ? min + PRICE_STEP : v;
            onChange(
              minPrice,
              newMax >= PRICE_MAX ? undefined : newMax
            );
          }}
          className="absolute w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-pink-dark [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-pink-dark [&::-moz-range-thumb]:cursor-pointer"
        />
      </div>

      {/* 눈금 */}
      <div className="flex justify-between text-[9px] text-text-muted px-0.5">
        <span>0</span>
        <span>5만</span>
        <span>10만</span>
        <span>15만</span>
        <span>20만+</span>
      </div>
    </div>
  );
}

function ClearButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="삭제"
      onClick={onClick}
      className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-foreground transition-colors"
    >
      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.12" />
        <path d="M15 9l-6 6M9 9l6 6" />
      </svg>
    </button>
  );
}
