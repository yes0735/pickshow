// 장르 필터 — 다중선택 칩
"use client";

import { useSearchStore, useCommonCodes } from "@/features/search/hooks";
import { cn } from "@/lib/utils";

export default function GenreFilter() {
  const { filters, toggleFilter, setFilter } = useSearchStore();
  const { data: genres } = useCommonCodes("genre");

  const selected = filters.genre ?? [];
  const isAll = selected.length === 0;

  const chipBase =
    "px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all";
  const chipActive = "bg-mint-dark text-white shadow-sm";
  const chipInactive =
    "bg-white text-text-secondary border border-border hover:border-mint-dark hover:text-mint-dark";

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => setFilter("genre", undefined)}
        className={cn(chipBase, isAll ? chipActive : chipInactive)}
      >
        전체
      </button>
      {genres?.map((g) => (
        <button
          key={g.code}
          onClick={() => toggleFilter("genre", g.code)}
          className={cn(
            chipBase,
            selected.includes(g.code) ? chipActive : chipInactive
          )}
        >
          {g.label}
        </button>
      ))}
    </div>
  );
}
