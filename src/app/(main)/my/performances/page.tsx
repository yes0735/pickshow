// 내공연 목록 — 로컬스토리지 기반
"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useAllMyPerfs, type MyPerfData } from "@/components/performance/MyPerfButton";
import type { Performance } from "@/types/performance";
import { formatDate } from "@/lib/utils";

export default function MyPerformancesPage() {
  const rawMyPerfs = useAllMyPerfs();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const myPerfs = mounted ? rawMyPerfs : [];

  // 공연 상세 정보 조회
  const { data: performances, isLoading } = useQuery<
    (Performance & { myData: MyPerfData })[]
  >({
    queryKey: ["my-perf-details", myPerfs.map((p) => p.performanceId)],
    queryFn: async () => {
      if (myPerfs.length === 0) return [];
      const results = await Promise.all(
        myPerfs.filter((mp) => mp.performanceId).map(async (mp) => {
          const res = await fetch(`/api/performances/${mp.performanceId}`);
          if (!res.ok) return null;
          const json = await res.json();
          return { ...json.data, myData: mp } as Performance & { myData: MyPerfData };
        })
      );
      return results.filter(Boolean) as (Performance & { myData: MyPerfData })[];
    },
    enabled: myPerfs.length > 0,
  });

  const stars = (n: number) => "★".repeat(n) + "☆".repeat(5 - n);

  const handleRemove = (performanceId: string) => {
    const stored = JSON.parse(localStorage.getItem("pickshow-my-performances") || "[]");
    const updated = stored.filter((d: MyPerfData) => d.performanceId !== performanceId);
    localStorage.setItem("pickshow-my-performances", JSON.stringify(updated));
    window.dispatchEvent(new Event("myperfs-changed"));
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-6">내공연</h1>

      {/* 로딩 */}
      {isLoading && myPerfs.length > 0 && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-bg-secondary animate-pulse" />
          ))}
        </div>
      )}

      {/* 빈 상태 */}
      {!isLoading && myPerfs.length === 0 && (
        <div className="text-center py-20">
          <p className="text-text-muted text-lg mb-2">등록한 공연이 없습니다</p>
          <Link href="/" className="text-sm text-mint-dark hover:underline">
            공연 검색하러 가기
          </Link>
        </div>
      )}

      {/* 목록 */}
      {performances && performances.length > 0 && (
        <div className="space-y-3">
          {performances.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 p-4 rounded-2xl border border-border bg-white"
            >
              {/* 포스터 */}
              <Link
                href={`/performance/${item.id}`}
                className="w-20 h-28 flex-shrink-0 rounded-xl overflow-hidden bg-bg-secondary"
              >
                {item.posterUrl ? (
                  <img
                    src={item.posterUrl}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-text-muted text-[10px]">
                    포스터
                  </div>
                )}
              </Link>

              {/* 정보 */}
              <div className="flex-1 min-w-0">
                <Link href={`/performance/${item.id}`}>
                  <h3 className="font-semibold text-sm truncate hover:text-mint-dark transition-colors">
                    {item.title}
                  </h3>
                </Link>
                <p className="text-xs text-text-muted mb-1.5">{item.venue}</p>

                {/* 별점 */}
                <p className="text-sm text-pink-dark mb-1">{stars(item.myData.rating)}</p>

                {/* 한줄 리뷰 */}
                {item.myData.review && (
                  <p className="text-xs text-text-secondary mb-1.5 line-clamp-2">
                    &ldquo;{item.myData.review}&rdquo;
                  </p>
                )}

                {/* 메타 정보 */}
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-text-muted">
                  {item.myData.viewedAt && (
                    <span>관람 {formatDate(new Date(item.myData.viewedAt))}</span>
                  )}
                  {item.myData.seatInfo && <span>좌석 {item.myData.seatInfo}</span>}
                  {item.myData.ticketSite && <span>{item.myData.ticketSite}</span>}
                </div>

                {/* 삭제 */}
                <button
                  onClick={() => handleRemove(item.id)}
                  className="mt-2 px-3 py-1 rounded-lg border border-border text-xs text-text-muted hover:text-pink-dark hover:border-pink transition-colors"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
