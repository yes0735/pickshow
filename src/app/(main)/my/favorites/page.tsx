// Design Ref: §5.4 — 마이페이지 찜 목록
"use client";

import { useFavorites, useToggleFavorite } from "@/features/favorite/hooks";
import Link from "next/link";
import { formatPriceRange } from "@/lib/utils";

export default function FavoritesPage() {
  const { data: favorites, isLoading } = useFavorites();
  const { remove } = useToggleFavorite();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold mb-6">찜한 공연</h1>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-bg-secondary animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && (!favorites || favorites.length === 0) && (
        <div className="text-center py-20">
          <p className="text-text-muted text-lg mb-2">찜한 공연이 없습니다</p>
          <Link href="/" className="text-sm text-mint-dark hover:underline">
            공연 검색하러 가기
          </Link>
        </div>
      )}

      {favorites && favorites.length > 0 && (
        <div className="space-y-3">
          {favorites.map((fav) => (
            <div
              key={fav.id}
              className="flex gap-4 p-3 rounded-xl border border-border bg-white"
            >
              <Link
                href={`/performance/${fav.performanceId}`}
                className="w-20 h-28 flex-shrink-0 rounded-lg overflow-hidden bg-bg-secondary"
              >
                {fav.performance.posterUrl ? (
                  <img
                    src={fav.performance.posterUrl}
                    alt={fav.performance.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-text-muted text-[10px]">
                    포스터 없음
                  </div>
                )}
              </Link>

              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <Link href={`/performance/${fav.performanceId}`}>
                  <h3 className="font-semibold text-sm truncate hover:text-mint-dark transition-colors">
                    {fav.performance.title}
                  </h3>
                </Link>
                <button
                  onClick={() => remove.mutate(fav.id)}
                  disabled={remove.isPending}
                  className="self-start px-3 py-1 rounded-lg border border-pink text-pink-dark text-xs hover:bg-pink-light transition-colors"
                >
                  찜 해제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
