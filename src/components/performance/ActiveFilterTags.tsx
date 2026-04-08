// 적용된 필터를 제거 가능한 태그로 표시 (다중선택 대응)
"use client";

import { useSearchStore, useCommonCodes } from "@/features/search/hooks";

export default function ActiveFilterTags() {
  const { filters, toggleFilter, setFilter } = useSearchStore();
  const { data: statuses } = useCommonCodes("status");
  const { data: ageLimits } = useCommonCodes("age_limit");
  const { data: ticketSites } = useCommonCodes("ticket_site");

  const tags: { key: string; label: string; onRemove: () => void }[] = [];

  // 다중선택 필터 → 각 값마다 태그 생성
  filters.status?.forEach((code) => {
    const label = statuses?.find((s) => s.code === code)?.label ?? code;
    tags.push({ key: `status-${code}`, label: `상태: ${label}`, onRemove: () => toggleFilter("status", code) });
  });
  if (filters.startDate) {
    tags.push({ key: "startDate", label: `시작: ${filters.startDate}`, onRemove: () => setFilter("startDate", undefined) });
  }
  if (filters.endDate) {
    tags.push({ key: "endDate", label: `종료: ${filters.endDate}`, onRemove: () => setFilter("endDate", undefined) });
  }
  if (filters.minPrice !== undefined) {
    tags.push({ key: "minPrice", label: `최소 ${filters.minPrice.toLocaleString()}원`, onRemove: () => setFilter("minPrice", undefined) });
  }
  if (filters.maxPrice !== undefined) {
    tags.push({ key: "maxPrice", label: `최대 ${filters.maxPrice.toLocaleString()}원`, onRemove: () => setFilter("maxPrice", undefined) });
  }
  filters.ageLimit?.forEach((code) => {
    const label = ageLimits?.find((a) => a.code === code)?.label ?? code;
    tags.push({ key: `age-${code}`, label, onRemove: () => toggleFilter("ageLimit", code) });
  });
  filters.ticketSite?.forEach((code) => {
    const label = ticketSites?.find((t) => t.code === code)?.label ?? code;
    tags.push({ key: `ticket-${code}`, label: `예매: ${label}`, onRemove: () => toggleFilter("ticketSite", code) });
  });
  if (filters.venue) {
    tags.push({ key: "venue", label: `장소: ${filters.venue}`, onRemove: () => setFilter("venue", undefined) });
  }

  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mb-3">
      {tags.map((tag) => (
        <button
          key={tag.key}
          onClick={tag.onRemove}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-mint-light text-mint-dark text-xs font-medium hover:bg-mint hover:text-white transition-colors"
        >
          {tag.label}
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      ))}
    </div>
  );
}
