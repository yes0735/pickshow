// Design Ref: §5.4 — 공연 카드 (포스터, 제목, 기간, 장소, 가격, 찜)
// Plan SC: FR-02 — next/image (CWV LCP 최적화, 홈 SSR 카드가 실제 LCP 요소)
"use client";

import Link from "next/link";
import Image from "next/image";
import type { Performance } from "@/types/performance";
import { formatDateRange, formatPriceRange } from "@/lib/utils";
import { isOptimizableHost } from "@/lib/image-host";
import FavoriteButton from "./FavoriteButton";
import MyPerfButton from "./MyPerfButton";
import StatusBadge from "./StatusBadge";

interface Props {
  performance: Performance;
}

export default function PerformanceCard({ performance }: Props) {
  return (
    <Link
      href={`/performance/${performance.id}`}
      scroll={false}
      className="group block rounded-xl border border-border bg-white overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="aspect-[3/4] bg-bg-secondary relative overflow-hidden">
        {performance.posterUrl ? (
          <Image
            src={performance.posterUrl}
            alt={performance.title}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            unoptimized={!isOptimizableHost(performance.posterUrl)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-muted text-sm">
            포스터 없음
          </div>
        )}
        <div className="absolute top-2 left-2">
          <StatusBadge status={performance.status} />
        </div>
        <div className="absolute top-2 right-2 flex gap-1">
          <MyPerfButton performanceId={performance.id} />
          <FavoriteButton performanceId={performance.id} />
        </div>
      </div>

      <div className="p-3">
        <h3 className="font-semibold text-sm leading-tight line-clamp-2 mb-1 group-hover:text-mint-dark transition-colors">
          {performance.title}
        </h3>
        <p className="text-xs text-text-muted mb-0.5">{performance.venue}</p>
        <p className="text-xs text-text-muted mb-1">
          {formatDateRange(new Date(performance.startDate), new Date(performance.endDate))}
        </p>
        <p className="text-sm font-medium text-pink-dark">
          {formatPriceRange(performance.minPrice, performance.maxPrice)}
        </p>
      </div>
    </Link>
  );
}
