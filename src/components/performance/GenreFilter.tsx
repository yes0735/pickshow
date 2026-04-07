// 장르 필터 — 공연목록 상단 칩 (모바일: flex-wrap, 데스크톱: 한 줄)
"use client";

import { useSearchStore, useCommonCodes } from "@/features/search/hooks";
import { cn } from "@/lib/utils";

export default function GenreFilter() {
  const { filters, setFilter } = useSearchStore();
  const { data: genres } = useCommonCodes("genre");

  const selected = filters.genre;

  const handleSelect = (code: string | undefined) => {
    setFilter("genre", selected === code ? undefined : code);
  };

  const chipBase =
    "px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all";
  const chipActive = "bg-mint-dark text-white shadow-sm";
  const chipInactive =
    "bg-white text-text-secondary border border-border hover:border-mint-dark hover:text-mint-dark";

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => handleSelect(undefined)}
        className={cn(chipBase, !selected ? chipActive : chipInactive)}
      >
        전체
      </button>
      {genres?.map((g) => (
        <button
          key={g.code}
          onClick={() => handleSelect(g.code)}
          className={cn(
            chipBase,
            selected === g.code ? chipActive : chipInactive
          )}
        >
          {g.label}
        </button>
      ))}
    </div>
  );
}
