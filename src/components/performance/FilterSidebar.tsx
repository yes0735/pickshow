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
            <div className="flex items-center gap-2">
              <input
                type="date"
                aria-label="시작일"
                value={filters.startDate ?? ""}
                onClick={(e) => (e.target as HTMLInputElement).showPicker()}
                onChange={(e) => setFilter("startDate", e.target.value || undefined)}
                className="w-full h-9 px-2.5 rounded-lg border border-border text-xs focus:outline-none focus:border-mint-dark cursor-pointer"
              />
              <span className="text-text-muted text-xs flex-shrink-0">~</span>
              <input
                type="date"
                aria-label="종료일"
                value={filters.endDate ?? ""}
                onClick={(e) => (e.target as HTMLInputElement).showPicker()}
                onChange={(e) => setFilter("endDate", e.target.value || undefined)}
                className="w-full h-9 px-2.5 rounded-lg border border-border text-xs focus:outline-none focus:border-mint-dark cursor-pointer"
              />
            </div>
          </AccordionSection>

          {/* 가격대 */}
          <AccordionSection
            title="가격대"
            active={filters.minPrice !== undefined || filters.maxPrice !== undefined}
          >
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="최소"
                aria-label="최소 가격"
                value={filters.minPrice ?? ""}
                onChange={(e) =>
                  setFilter("minPrice", e.target.value ? Number(e.target.value) : undefined)
                }
                className="w-full h-9 px-2.5 rounded-lg border border-border text-xs focus:outline-none focus:border-mint-dark"
              />
              <span className="text-text-muted text-xs flex-shrink-0">~</span>
              <input
                type="number"
                placeholder="최대"
                aria-label="최대 가격"
                value={filters.maxPrice ?? ""}
                onChange={(e) =>
                  setFilter("maxPrice", e.target.value ? Number(e.target.value) : undefined)
                }
                className="w-full h-9 px-2.5 rounded-lg border border-border text-xs focus:outline-none focus:border-mint-dark"
              />
            </div>
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
            <input
              type="text"
              placeholder="장소명을 입력하세요"
              aria-label="공연장소 검색"
              value={filters.venue ?? ""}
              onChange={(e) => setFilter("venue", e.target.value || undefined)}
              className="w-full h-9 px-2.5 rounded-lg border border-border text-xs focus:outline-none focus:border-mint-dark"
            />
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
