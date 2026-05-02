// 찜 목록 — 로컬스토리지 기반
"use client";

import { useAllFavorites } from "@/features/favorite/hooks";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import Link from "next/link";
import type { Performance } from "@/types/performance";
import { formatDateRange, formatPriceRange, genreLabel } from "@/lib/utils";
import StatusBadge from "@/components/performance/StatusBadge";
import FavoriteButton from "@/components/performance/FavoriteButton";
import MyPerfButton from "@/components/performance/MyPerfButton";

export default function FavoritesPage() {
  const rawFavoriteIds = useAllFavorites();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const favoriteIds = mounted ? rawFavoriteIds : [];

  // 찜한 공연 ID로 상세 정보 조회
  const { data: performances, isLoading } = useQuery<Performance[]>({
    queryKey: ["favorite-performances", favoriteIds],
    queryFn: async () => {
      if (favoriteIds.length === 0) return [];
      const results = await Promise.all(
        favoriteIds.map(async (id) => {
          const res = await fetch(`/api/performances/${id}`);
          if (!res.ok) return null;
          const json = await res.json();
          return json.data as Performance;
        })
      );
      return results.filter(Boolean) as Performance[];
    },
    enabled: favoriteIds.length > 0,
  });

  return (
    <>
    <div className="max-w-7xl mx-auto px-4 pt-6">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-text-muted mb-4">
        <Link href="/" className="hover:text-mint-dark transition-colors">홈</Link>
        <span>›</span>
        <span className="text-text-secondary">찜</span>
      </nav>
    </div>
    <div className="max-w-3xl mx-auto px-4 pb-8">
      <h1 className="text-xl font-bold mb-6">찜한 공연</h1>

      {(!mounted || isLoading) && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-bg-secondary animate-pulse" />
          ))}
        </div>
      )}

      {mounted && !isLoading && favoriteIds.length === 0 && (
        <div className="text-center py-20">
          <p className="text-text-muted text-lg mb-2">찜한 공연이 없습니다</p>
          <Link href="/" className="text-sm text-mint-dark hover:underline">
            공연 검색하러 가기
          </Link>
        </div>
      )}

      {performances && performances.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {performances.map((perf) => (
            <FavoriteItem key={perf.id} performance={perf} />
          ))}
        </div>
      )}
    </div>
    </>
  );
}

function FavoriteItem({ performance }: { performance: Performance }) {
  return (
    <div className="rounded-xl border border-border bg-white overflow-hidden">
      <Link href={`/genre/${performance.genre}/${performance.id}`}>
        <div className="aspect-[3/4] bg-bg-secondary relative overflow-hidden">
          {performance.posterUrl ? (
            <img
              src={performance.posterUrl}
              alt={performance.title}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
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
      </Link>

      <div className="p-3">
        <div className="text-[10px] text-text-muted mb-1">{genreLabel(performance.genre)}</div>
        <Link href={`/genre/${performance.genre}/${performance.id}`}>
          <h3 className="font-semibold text-sm leading-tight line-clamp-2 mb-1 hover:text-mint-dark transition-colors">
            {performance.title}
          </h3>
        </Link>
        <p className="text-xs text-text-muted truncate">{performance.venue}</p>
        <p className="text-xs text-text-muted mb-1">
          {formatDateRange(new Date(performance.startDate), new Date(performance.endDate))}
        </p>
        <p className="text-sm font-medium text-pink-dark">
          {formatPriceRange(performance.minPrice, performance.maxPrice)}
        </p>
      </div>
    </div>
  );
}
