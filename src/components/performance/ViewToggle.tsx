// Design Ref: §5.4 — 카드뷰/리스트뷰 전환 버튼
"use client";

import { useSearchStore } from "@/features/search/hooks";
import { cn } from "@/lib/utils";

export default function ViewToggle() {
  const { viewMode, setViewMode } = useSearchStore();

  return (
    <div className="flex rounded-lg border border-border overflow-hidden">
      <button
        onClick={() => setViewMode("card")}
        className={cn(
          "px-3 py-1.5 text-xs transition-colors",
          viewMode === "card"
            ? "bg-mint text-white"
            : "bg-white text-text-secondary hover:bg-bg-secondary"
        )}
      >
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <rect x="1" y="1" width="6" height="6" rx="1" />
          <rect x="9" y="1" width="6" height="6" rx="1" />
          <rect x="1" y="9" width="6" height="6" rx="1" />
          <rect x="9" y="9" width="6" height="6" rx="1" />
        </svg>
      </button>
      <button
        onClick={() => setViewMode("list")}
        className={cn(
          "px-3 py-1.5 text-xs transition-colors",
          viewMode === "list"
            ? "bg-mint text-white"
            : "bg-white text-text-secondary hover:bg-bg-secondary"
        )}
      >
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <rect x="1" y="2" width="14" height="3" rx="1" />
          <rect x="1" y="7" width="14" height="3" rx="1" />
          <rect x="1" y="12" width="14" height="3" rx="1" />
        </svg>
      </button>
    </div>
  );
}
