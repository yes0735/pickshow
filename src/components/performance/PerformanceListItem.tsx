// Design Ref: §5.4 — 공연 리스트형 행
"use client";

import Link from "next/link";
import type { Performance } from "@/types/performance";
import { formatDateRange, formatPriceRange, genreLabel } from "@/lib/utils";
import StatusBadge from "./StatusBadge";

interface Props {
  performance: Performance;
}

export default function PerformanceListItem({ performance }: Props) {
  return (
    <Link
      href={`/performance/${performance.id}`}
      scroll={false}
      className="flex gap-4 p-3 rounded-xl border border-border bg-white hover:shadow-md transition-shadow"
    >
      <div className="w-20 h-28 flex-shrink-0 rounded-lg overflow-hidden bg-bg-secondary">
        {performance.posterUrl ? (
          <img
            src={performance.posterUrl}
            alt={performance.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-muted text-[10px]">
            포스터 없음
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex items-center gap-2 mb-1">
          <StatusBadge status={performance.status} />
          <span className="text-[10px] text-text-muted">{genreLabel(performance.genre)}</span>
        </div>
        <h3 className="font-semibold text-sm leading-tight truncate mb-0.5">
          {performance.title}
        </h3>
        <p className="text-xs text-text-muted truncate">{performance.venue}</p>
        <p className="text-xs text-text-muted">
          {formatDateRange(new Date(performance.startDate), new Date(performance.endDate))}
        </p>
        <p className="text-sm font-medium text-pink-dark mt-1">
          {formatPriceRange(performance.minPrice, performance.maxPrice)}
        </p>
      </div>
    </Link>
  );
}
