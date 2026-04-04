// Design Ref: §5.4 — 정렬 셀렉트박스 (날짜순/가격낮은순/가격높은순)
"use client";

import { useSearchStore } from "@/features/search/hooks";
import type { SortOption } from "@/types/common";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "date", label: "날짜순" },
  { value: "price_asc", label: "가격 낮은순" },
  { value: "price_desc", label: "가격 높은순" },
];

export default function SortSelect() {
  const { sort, setSort } = useSearchStore();

  return (
    <select
      value={sort}
      onChange={(e) => setSort(e.target.value as SortOption)}
      className="h-8 px-3 rounded-lg border border-border bg-white text-xs text-text-secondary focus:outline-none focus:border-mint"
    >
      {SORT_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
