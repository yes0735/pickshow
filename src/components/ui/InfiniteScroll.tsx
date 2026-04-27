// Design Ref: §5.4 — Intersection Observer 기반 무한스크롤
// Plan SC: FR-04 — N페이지 이후 자동 로딩 중단, "더보기" 버튼 전환
"use client";

import { useEffect, useRef } from "react";

interface InfiniteScrollProps {
  hasNext: boolean;
  isFetching: boolean;
  onLoadMore: () => void;
  /** 현재까지 로드된 페이지 수 */
  loadedPages?: number;
  /** 자동 로딩 최대 페이지 수 (기본 5, 초과 시 "더보기" 버튼) */
  autoLoadPages?: number;
}

export default function InfiniteScroll({
  hasNext,
  isFetching,
  onLoadMore,
  loadedPages = 1,
  autoLoadPages = 5,
}: InfiniteScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  const autoLoad = loadedPages < autoLoadPages;

  useEffect(() => {
    if (!autoLoad) return;

    const el = ref.current;
    if (!el || !hasNext) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetching) {
          onLoadMore();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNext, isFetching, onLoadMore, autoLoad]);

  if (!hasNext) return null;

  return (
    <div ref={ref} className="flex justify-center py-8">
      {isFetching ? (
        <div className="flex gap-1">
          <span className="w-2 h-2 rounded-full bg-mint animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2 h-2 rounded-full bg-mint animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2 h-2 rounded-full bg-mint animate-bounce" />
        </div>
      ) : !autoLoad ? (
        <button
          onClick={onLoadMore}
          className="px-6 py-2.5 rounded-xl border border-border text-sm text-text-secondary hover:bg-bg-secondary hover:border-mint-dark hover:text-mint-dark transition-colors"
        >
          더보기
        </button>
      ) : null}
    </div>
  );
}
