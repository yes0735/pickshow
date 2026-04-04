// Design Ref: §5.4 — Intersection Observer 기반 무한스크롤
"use client";

import { useEffect, useRef } from "react";

interface InfiniteScrollProps {
  hasNext: boolean;
  isFetching: boolean;
  onLoadMore: () => void;
}

export default function InfiniteScroll({
  hasNext,
  isFetching,
  onLoadMore,
}: InfiniteScrollProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
  }, [hasNext, isFetching, onLoadMore]);

  if (!hasNext) return null;

  return (
    <div ref={ref} className="flex justify-center py-8">
      {isFetching && (
        <div className="flex gap-1">
          <span className="w-2 h-2 rounded-full bg-mint animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2 h-2 rounded-full bg-mint animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2 h-2 rounded-full bg-mint animate-bounce" />
        </div>
      )}
    </div>
  );
}
