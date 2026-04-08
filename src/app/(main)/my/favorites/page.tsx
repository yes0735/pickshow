// 찜 목록 — 로컬스토리지 기반
"use client";

import { useAllFavorites, useLocalFavorites } from "@/features/favorite/hooks";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import Link from "next/link";
import type { Performance } from "@/types/performance";

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
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold mb-6">찜한 공연</h1>

      {isLoading && favoriteIds.length > 0 && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-bg-secondary animate-pulse" />
          ))}
        </div>
      )}

      {favoriteIds.length === 0 && (
        <div className="text-center py-20">
          <p className="text-text-muted text-lg mb-2">찜한 공연이 없습니다</p>
          <Link href="/" className="text-sm text-mint-dark hover:underline">
            공연 검색하러 가기
          </Link>
        </div>
      )}

      {performances && performances.length > 0 && (
        <div className="space-y-3">
          {performances.map((perf) => (
            <FavoriteItem key={perf.id} performance={perf} />
          ))}
        </div>
      )}
    </div>
  );
}

function FavoriteItem({ performance }: { performance: Performance }) {
  const { toggle } = useLocalFavorites(performance.id);

  return (
    <div className="flex gap-4 p-3 rounded-xl border border-border bg-white">
      <Link
        href={`/performance/${performance.id}`}
        className="w-20 h-28 flex-shrink-0 rounded-lg overflow-hidden bg-bg-secondary"
      >
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
      </Link>

      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <Link href={`/performance/${performance.id}`}>
          <h3 className="font-semibold text-sm truncate hover:text-mint-dark transition-colors">
            {performance.title}
          </h3>
        </Link>
        <button
          onClick={toggle}
          className="self-start px-3 py-1 rounded-lg border border-pink text-pink-dark text-xs hover:bg-pink-light transition-colors"
        >
          찜 해제
        </button>
      </div>
    </div>
  );
}
