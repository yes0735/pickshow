// 검색 전용 페이지 — Header 돋보기 아이콘에서 진입
// 검색바 + 최근검색어 + 추천검색어 → 검색 시 같은 페이지에서 결과 표시
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSearchPerformances, useSearchStore } from "@/features/search/hooks";
import PerformanceCard from "@/components/performance/PerformanceCard";
import PerformanceListItem from "@/components/performance/PerformanceListItem";
import InfiniteScroll from "@/components/ui/InfiniteScroll";

const RECENTS_KEY = "ps_recents";
const MAX_RECENTS = 8;

const RECOMMENDED = ["뮤지컬", "연극", "콘서트", "클래식", "무용", "국악"];

function loadRecents(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(RECENTS_KEY) || "[]");
    return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function saveRecents(items: string[]) {
  localStorage.setItem(RECENTS_KEY, JSON.stringify(items.slice(0, MAX_RECENTS)));
}

export default function SearchPage() {
  const params = useSearchParams();
  const router = useRouter();
  const urlQuery = params.get("q") ?? "";
  const [input, setInput] = useState(urlQuery);
  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const [recents, setRecents] = useState<string[]>([]);
  const setFilter = useSearchStore((s) => s.setFilter);
  const viewMode = useSearchStore((s) => s.viewMode);

  useEffect(() => {
    setRecents(loadRecents());
  }, []);

  // URL q 파라미터 변경 시 검색 실행
  useEffect(() => {
    if (urlQuery) {
      setInput(urlQuery);
      setSearchQuery(urlQuery);
      setFilter("q", urlQuery);
    }
  }, [urlQuery, setFilter]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useSearchPerformances();

  const performances = data?.pages.flatMap((p) => p.data) ?? [];
  const total = data?.pages[0]?.pagination.total ?? 0;

  const submitSearch = useCallback(
    (q: string) => {
      const v = q.trim();
      if (!v) return;
      const next = [v, ...recents.filter((r) => r !== v)].slice(0, MAX_RECENTS);
      setRecents(next);
      saveRecents(next);
      setInput(v);
      setSearchQuery(v);
      setFilter("q", v);
      router.push(`/search?q=${encodeURIComponent(v)}`);
    },
    [recents, setFilter, router],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitSearch(input);
  };

  const clearInput = () => {
    setInput("");
    setSearchQuery("");
    setFilter("q", undefined);
  };

  const clearRecents = () => {
    setRecents([]);
    saveRecents([]);
  };

  const removeRecent = (r: string) => {
    const next = recents.filter((x) => x !== r);
    setRecents(next);
    saveRecents(next);
  };

  const handleLoadMore = useCallback(() => {
    fetchNextPage();
  }, [fetchNextPage]);

  return (
    <div className="max-w-7xl mx-auto px-4 pt-6 pb-12">
      {/* 검색바 */}
      <form onSubmit={handleSubmit} className="relative max-w-2xl mx-auto mb-6">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </span>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="공연명, 출연진 검색"
          autoFocus
          className="w-full h-12 pl-11 pr-14 rounded-full bg-white border border-border text-sm focus:outline-none focus:border-mint-dark transition-colors shadow-sm"
        />
        {input && (
          <button
            type="button"
            aria-label="검색어 삭제"
            onClick={clearInput}
            className="absolute right-12 top-1/2 -translate-y-1/2 text-text-muted hover:text-mint-dark transition-colors"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15" />
              <path d="M15 9l-6 6M9 9l6 6" />
            </svg>
          </button>
        )}
        <button
          type="submit"
          aria-label="검색"
          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-mint-dark text-white hover:opacity-90 transition-opacity"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </button>
      </form>

      {/* 검색 전: 최근검색어 + 추천검색어 */}
      {!searchQuery && (
        <div className="max-w-2xl mx-auto">
          {recents.length > 0 && (
            <section className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                  최근 검색어
                </span>
                <button
                  onClick={clearRecents}
                  className="text-[11px] text-text-muted hover:text-mint-dark transition-colors"
                >
                  모두 지우기
                </button>
              </div>
              <div className="flex gap-2 flex-wrap">
                {recents.map((r) => (
                  <span
                    key={r}
                    className="inline-flex items-center gap-1 rounded-full text-xs bg-bg-secondary border border-border text-text-secondary pl-3 pr-1 py-1"
                  >
                    <button
                      onClick={() => submitSearch(r)}
                      className="hover:text-mint-dark transition-colors"
                    >
                      {r}
                    </button>
                    <button
                      onClick={() => removeRecent(r)}
                      aria-label={`${r} 삭제`}
                      className="text-text-muted hover:text-mint-dark transition-colors p-0.5 flex items-center"
                    >
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M18 6 6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            </section>
          )}

          <section>
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block mb-3">
              추천 검색어
            </span>
            <div className="flex gap-2 flex-wrap">
              {RECOMMENDED.map((keyword) => (
                <button
                  key={keyword}
                  onClick={() => submitSearch(keyword)}
                  className="inline-flex items-center rounded-full text-xs font-medium px-3 py-1.5 bg-mint-light border border-mint-dark/20 text-mint-dark hover:bg-mint hover:text-white transition-colors"
                >
                  {keyword}
                </button>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* 검색 후: 결과 */}
      {searchQuery && (
        <>
          {/* 결과 헤더 */}
          <div className="max-w-2xl mx-auto mb-6 text-center">
            <h1 className="text-xl font-bold tracking-tight">
              <span className="text-mint-dark">&ldquo;{searchQuery}&rdquo;</span> 검색 결과
            </h1>
            <span className="text-[13px] text-text-muted">
              {isLoading ? "검색 중..." : `총 ${total.toLocaleString()}건`}
            </span>
          </div>

          {/* 로딩 */}
          {isLoading && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border bg-bg-secondary animate-pulse aspect-[3/5]" />
              ))}
            </div>
          )}

          {/* 결과 없음 */}
          {!isLoading && performances.length === 0 && (
            <div className="text-center py-20">
              <p className="text-text-muted text-lg mb-2">검색 결과가 없습니다</p>
              <p className="text-text-muted text-sm">다른 검색어를 사용해보세요</p>
            </div>
          )}

          {/* 카드 뷰 */}
          {!isLoading && performances.length > 0 && viewMode === "card" && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {performances.map((p) => (
                <PerformanceCard key={p.id} performance={p} />
              ))}
            </div>
          )}

          {/* 리스트 뷰 */}
          {!isLoading && performances.length > 0 && viewMode === "list" && (
            <div className="space-y-3">
              {performances.map((p) => (
                <PerformanceListItem key={p.id} performance={p} />
              ))}
            </div>
          )}

          {/* 무한스크롤 */}
          <InfiniteScroll
            hasNext={hasNextPage ?? false}
            isFetching={isFetchingNextPage}
            onLoadMore={handleLoadMore}
            loadedPages={data?.pages.length ?? 1}
          />
        </>
      )}
    </div>
  );
}
