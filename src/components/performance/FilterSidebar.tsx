// Design Ref: §5.4 — 7종 필터 UI (데스크톱: 사이드바, 모바일: 시트)
"use client";

import { useSearchStore, useCommonCodes } from "@/features/search/hooks";

export default function FilterSidebar() {
  const { filters, setFilter, resetFilters } = useSearchStore();

  const { data: genres } = useCommonCodes("genre");
  const { data: statuses } = useCommonCodes("status");
  const { data: ageLimits } = useCommonCodes("age_limit");
  const { data: ticketSites } = useCommonCodes("ticket_site");

  return (
    <aside className="w-full lg:w-60 flex-shrink-0">
      <div className="sticky top-20 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm">검색 필터</h2>
          <button
            onClick={resetFilters}
            className="text-xs text-text-muted hover:text-pink-dark transition-colors"
          >
            초기화
          </button>
        </div>

        {/* 장르 */}
        <FilterSection title="장르">
          {genres?.map((g) => (
            <FilterCheckbox
              key={g.code}
              label={g.label}
              checked={filters.genre === g.code}
              onChange={() =>
                setFilter("genre", filters.genre === g.code ? undefined : g.code)
              }
            />
          ))}
        </FilterSection>

        {/* 공연상태 */}
        <FilterSection title="공연상태">
          {statuses?.map((s) => (
            <FilterCheckbox
              key={s.code}
              label={s.label}
              checked={filters.status === s.code}
              onChange={() =>
                setFilter("status", filters.status === s.code ? undefined : s.code)
              }
            />
          ))}
        </FilterSection>

        {/* 공연기간 */}
        <FilterSection title="공연기간">
          <div className="space-y-2">
            <input
              type="date"
              aria-label="시작일"
              value={filters.startDate ?? ""}
              onChange={(e) => setFilter("startDate", e.target.value || undefined)}
              className="w-full h-8 px-2 rounded border border-border text-xs focus:outline-none focus:border-mint"
            />
            <input
              type="date"
              aria-label="종료일"
              value={filters.endDate ?? ""}
              onChange={(e) => setFilter("endDate", e.target.value || undefined)}
              className="w-full h-8 px-2 rounded border border-border text-xs focus:outline-none focus:border-mint"
            />
          </div>
        </FilterSection>

        {/* 가격대 */}
        <FilterSection title="가격대">
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="최소"
              aria-label="최소 가격"
              value={filters.minPrice ?? ""}
              onChange={(e) =>
                setFilter("minPrice", e.target.value ? Number(e.target.value) : undefined)
              }
              className="w-full h-8 px-2 rounded border border-border text-xs focus:outline-none focus:border-mint"
            />
            <span className="text-text-muted self-center text-xs">~</span>
            <input
              type="number"
              placeholder="최대"
              aria-label="최대 가격"
              value={filters.maxPrice ?? ""}
              onChange={(e) =>
                setFilter("maxPrice", e.target.value ? Number(e.target.value) : undefined)
              }
              className="w-full h-8 px-2 rounded border border-border text-xs focus:outline-none focus:border-mint"
            />
          </div>
        </FilterSection>

        {/* 관람연령 */}
        <FilterSection title="관람연령">
          {ageLimits?.map((a) => (
            <FilterCheckbox
              key={a.code}
              label={a.label}
              checked={filters.ageLimit === a.code}
              onChange={() =>
                setFilter("ageLimit", filters.ageLimit === a.code ? undefined : a.code)
              }
            />
          ))}
        </FilterSection>

        {/* 예매처 */}
        <FilterSection title="예매처">
          {ticketSites?.map((t) => (
            <FilterCheckbox
              key={t.code}
              label={t.label}
              checked={filters.ticketSite === t.code}
              onChange={() =>
                setFilter(
                  "ticketSite",
                  filters.ticketSite === t.code ? undefined : t.code
                )
              }
            />
          ))}
        </FilterSection>

        {/* 공연장소 */}
        <FilterSection title="공연장소">
          <input
            type="text"
            placeholder="장소 검색"
            aria-label="공연장소 검색"
            value={filters.venue ?? ""}
            onChange={(e) => setFilter("venue", e.target.value || undefined)}
            className="w-full h-8 px-2 rounded border border-border text-xs focus:outline-none focus:border-mint"
          />
        </FilterSection>
      </div>
    </aside>
  );
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-xs font-medium text-text-secondary mb-2">{title}</h3>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function FilterCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-3.5 h-3.5 rounded border-border text-mint focus:ring-mint accent-mint"
      />
      <span className="text-xs text-text-secondary group-hover:text-foreground transition-colors">
        {label}
      </span>
    </label>
  );
}
