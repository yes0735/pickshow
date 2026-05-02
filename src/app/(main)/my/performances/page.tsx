// 내공연 — 통계 + 다가오는 공연 + 최근 본 공연
"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useAllMyPerfs, type MyPerfData } from "@/components/performance/MyPerfButton";
import type { Performance } from "@/types/performance";
import { formatDate, genreLabel } from "@/lib/utils";

export default function MyPerformancesPage() {
  const rawMyPerfs = useAllMyPerfs();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const myPerfs = mounted ? rawMyPerfs : [];

  const { data: performances, isLoading, isFetching } = useQuery<
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

  // 통계 계산
  const stats = useMemo(() => {
    if (!performances || performances.length === 0) return null;
    const now = new Date();
    const thisYear = now.getFullYear();

    // 올해 관람 수
    const thisYearCount = performances.filter((p) => {
      if (!p.myData.viewedAt) return false;
      return new Date(p.myData.viewedAt).getFullYear() === thisYear;
    }).length;

    // 선호 장르 (빈도 순)
    const genreCount: Record<string, number> = {};
    for (const p of performances) {
      genreCount[p.genre] = (genreCount[p.genre] ?? 0) + 1;
    }
    const topGenres = Object.entries(genreCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([code, count]) => ({ label: genreLabel(code), count }));

    // 선호 예매처 (빈도 순)
    const siteCount: Record<string, number> = {};
    for (const p of performances) {
      if (p.myData.ticketSite) {
        siteCount[p.myData.ticketSite] = (siteCount[p.myData.ticketSite] ?? 0) + 1;
      }
    }
    const topSites = Object.entries(siteCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }));

    return { thisYearCount, topGenres, topSites, total: performances.length };
  }, [performances]);

  // KST 기준 오늘 날짜 (YYYY-MM-DD)
  const todayKST = useMemo(() => {
    const now = new Date();
    const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    return kst.toISOString().split("T")[0];
  }, []);

  // 다가오는 공연 (관람일 > 오늘 또는 관람일 미등록)
  const upcoming = useMemo(() => {
    if (!performances) return [];
    return performances
      .filter((p) => !p.myData.viewedAt || p.myData.viewedAt > todayKST)
      .sort((a, b) => (a.myData.viewedAt ?? "9999").localeCompare(b.myData.viewedAt ?? "9999"));
  }, [performances, todayKST]);

  // 최근 본 공연 (관람일 <= 오늘, 관람일 내림차순)
  const recent = useMemo(() => {
    if (!performances) return [];
    return [...performances]
      .filter((p) => p.myData.viewedAt && p.myData.viewedAt <= todayKST)
      .sort((a, b) => b.myData.viewedAt.localeCompare(a.myData.viewedAt));
  }, [performances, todayKST]);

  // 페이징
  const PAGE_SIZE = 5;
  const [upcomingPage, setUpcomingPage] = useState(1);
  const [recentPage, setRecentPage] = useState(1);
  const upcomingTotalPages = Math.ceil(upcoming.length / PAGE_SIZE);
  const recentTotalPages = Math.ceil(recent.length / PAGE_SIZE);
  const pagedUpcoming = upcoming.slice((upcomingPage - 1) * PAGE_SIZE, upcomingPage * PAGE_SIZE);
  const pagedRecent = recent.slice((recentPage - 1) * PAGE_SIZE, recentPage * PAGE_SIZE);

  const stars = (n: number) => "★".repeat(n) + "☆".repeat(5 - n);

  const handleRemove = (performanceId: string) => {
    const stored = JSON.parse(localStorage.getItem("pickshow-my-performances") || "[]");
    const updated = stored.filter((d: MyPerfData) => d.performanceId !== performanceId);
    localStorage.setItem("pickshow-my-performances", JSON.stringify(updated));
    window.dispatchEvent(new Event("myperfs-changed"));
  };

  return (
    <>
    <div className="max-w-7xl mx-auto px-4 pt-6">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-text-muted mb-4">
        <Link href="/" className="hover:text-mint-dark transition-colors">홈</Link>
        <span>›</span>
        <span className="text-text-secondary">내공연</span>
      </nav>
    </div>
    <div className="max-w-3xl mx-auto px-4 pb-8">
      <h1 className="text-xl font-bold mb-6">내공연</h1>

      {/* 빈 상태 조건용 */}

      {/* 로딩 */}
      {(!mounted || isFetching) && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-bg-secondary animate-pulse" />
          ))}
        </div>
      )}

      {/* 통계 카드 (항상 표시) */}
      {mounted && !isFetching && (
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-white rounded-2xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-mint-dark">{stats?.thisYearCount ?? 0}</p>
            <p className="text-[11px] text-text-muted mt-1">올해 관람</p>
          </div>
          <div className="bg-white rounded-2xl border border-border p-4 text-center">
            <p className="text-sm font-semibold text-foreground leading-tight">
              {stats?.topGenres?.[0]?.label ?? "-"}
            </p>
            {(stats?.topGenres?.length ?? 0) > 1 && (
              <p className="text-[10px] text-text-muted mt-0.5">
                {stats!.topGenres.slice(1).map((g) => g.label).join(", ")}
              </p>
            )}
            <p className="text-[11px] text-text-muted mt-1">선호 장르</p>
          </div>
          <div className="bg-white rounded-2xl border border-border p-4 text-center">
            <p className="text-sm font-semibold text-foreground leading-tight">
              {stats?.topSites?.[0]?.name ?? "-"}
            </p>
            {(stats?.topSites?.length ?? 0) > 1 && (
              <p className="text-[10px] text-text-muted mt-0.5">
                {stats!.topSites.slice(1).map((s) => s.name).join(", ")}
              </p>
            )}
            <p className="text-[11px] text-text-muted mt-1">선호 예매처</p>
          </div>
        </div>
      )}

      {/* 빈 상태 */}
      {mounted && !isFetching && (!performances || performances.length === 0) && (
        <div className="text-center py-12 bg-white rounded-2xl border border-border">
          <p className="text-text-muted text-lg mb-2">등록한 공연이 없습니다</p>
          <Link href="/" className="text-sm text-mint-dark hover:underline">
            공연 검색하러 가기
          </Link>
        </div>
      )}

      {/* 다가오는 공연 */}
      {upcoming.length > 0 && (
        <section className="mb-8">
          <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
            <span className="w-1 h-4 rounded-full bg-mint-dark inline-block" />
            다가오는 공연
            <span className="text-xs text-text-muted font-normal">{upcoming.length}건</span>
          </h2>
          <div className="space-y-3">
            {pagedUpcoming.map((item) => (
              <PerfCard key={item.id} item={item} stars={stars} onRemove={handleRemove} />
            ))}
          </div>
          {upcomingTotalPages > 1 && (
            <Pagination current={upcomingPage} total={upcomingTotalPages} onChange={setUpcomingPage} />
          )}
        </section>
      )}

      {/* 최근 본 공연 */}
      {recent.length > 0 && (
        <section className="mb-8">
          <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
            <span className="w-1 h-4 rounded-full bg-pink inline-block" />
            최근 본 공연
            <span className="text-xs text-text-muted font-normal">{recent.length}건</span>
          </h2>
          <div className="space-y-3">
            {pagedRecent.map((item) => (
              <PerfCard key={item.id} item={item} stars={stars} onRemove={handleRemove} />
            ))}
          </div>
          {recentTotalPages > 1 && (
            <Pagination current={recentPage} total={recentTotalPages} onChange={setRecentPage} />
          )}
        </section>
      )}
    </div>
    </>
  );
}

function PerfCard({
  item,
  stars,
  onRemove,
}: {
  item: Performance & { myData: MyPerfData };
  stars: (n: number) => string;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="flex gap-4 p-4 rounded-2xl border border-border bg-white">
      <Link
        href={`/genre/${item.genre}/${item.id}`}
        className="w-20 h-28 flex-shrink-0 rounded-xl overflow-hidden bg-bg-secondary"
      >
        {item.posterUrl ? (
          <img src={item.posterUrl} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-muted text-[10px]">
            포스터
          </div>
        )}
      </Link>

      <div className="flex-1 min-w-0">
        <Link href={`/genre/${item.genre}/${item.id}`}>
          <h3 className="font-semibold text-sm truncate hover:text-mint-dark transition-colors">
            {item.title}
          </h3>
        </Link>
        <p className="text-xs text-text-muted mb-1.5">{item.venue}</p>
        <p className="text-sm text-pink-dark mb-1">{stars(item.myData.rating)}</p>

        {item.myData.review && (
          <p className="text-xs text-text-secondary mb-1.5 line-clamp-2">
            &ldquo;{item.myData.review}&rdquo;
          </p>
        )}

        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-text-muted">
          {item.myData.viewedAt && (
            <span>관람 {formatDate(new Date(item.myData.viewedAt))}</span>
          )}
          {item.myData.seatInfo && <span>좌석 {item.myData.seatInfo}</span>}
          {item.myData.ticketSite && <span>{item.myData.ticketSite}</span>}
        </div>

        <button
          onClick={() => onRemove(item.id)}
          className="mt-2 px-3 py-1 rounded-lg border border-border text-xs text-text-muted hover:text-pink-dark hover:border-pink transition-colors"
        >
          삭제
        </button>
      </div>
    </div>
  );
}

function Pagination({
  current,
  total,
  onChange,
}: {
  current: number;
  total: number;
  onChange: (page: number) => void;
}) {
  return (
    <div className="flex justify-center items-center gap-1 mt-4">
      <button
        onClick={() => onChange(current - 1)}
        disabled={current <= 1}
        className="px-2 h-8 rounded text-xs text-text-muted hover:bg-bg-secondary disabled:opacity-30"
      >
        이전
      </button>
      {Array.from({ length: total }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`w-7 h-7 rounded text-xs font-medium transition-colors ${
            p === current
              ? "bg-mint-dark text-white"
              : "text-text-muted hover:bg-bg-secondary"
          }`}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => onChange(current + 1)}
        disabled={current >= total}
        className="px-2 h-8 rounded text-xs text-text-muted hover:bg-bg-secondary disabled:opacity-30"
      >
        다음
      </button>
    </div>
  );
}
