// Design Ref: §5.4 — 공연 리스트형 행
// Plan SC: FR-02 — next/image
"use client";

import Link from "next/link";
import Image from "next/image";
import type { Performance } from "@/types/performance";
import { formatDateRange, formatPriceRange, genreLabel } from "@/lib/utils";
import { isOptimizableHost } from "@/lib/image-host";
import StatusBadge from "./StatusBadge";

interface Props {
  performance: Performance;
}

export default function PerformanceListItem({ performance }: Props) {
  return (
    <Link
      href={`/genre/${performance.genre}/${performance.id}`}
      className="flex gap-4 p-3 rounded-xl border border-border bg-white hover:shadow-md transition-shadow"
    >
      <div className="relative w-20 h-28 flex-shrink-0 rounded-lg overflow-hidden bg-bg-secondary">
        {performance.posterUrl ? (
          <Image
            src={performance.posterUrl}
            alt={performance.title}
            fill
            sizes="80px"
            className="object-cover"
            unoptimized={!isOptimizableHost(performance.posterUrl)}
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
