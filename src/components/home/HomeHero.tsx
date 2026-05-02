// Plan SC: FR-01 - HomeHero (제목+설명+통합검색바+최근검색어)
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

const RECENTS_KEY = "ps_recents";
const MAX_RECENTS = 8;

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

export default function HomeHero() {
  const [input, setInput] = useState("");
  const [recents, setRecents] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    setRecents(loadRecents());
  }, []);

  const submitSearch = useCallback(
    (q: string) => {
      const v = q.trim();
      if (!v) return;
      setInput(v);
      const next = [v, ...recents.filter((r) => r !== v)].slice(0, MAX_RECENTS);
      setRecents(next);
      saveRecents(next);
      router.push(`/search?q=${encodeURIComponent(v)}`);
    },
    [recents, router],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitSearch(input);
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

  return (
    <section className="py-8">
      <div className="max-w-2xl mx-auto text-center px-2">
        <h1 className="text-xl font-bold tracking-tight leading-tight mb-2">
          공연 정보를 한 곳에서, 예매처로 바로
        </h1>
        <p className="text-[13px] text-text-secondary leading-relaxed mb-4">
          PickShow는 공연 정보를 한 곳에서 검색하고, 원하는 예매처로 바로 이동할 수 있는 공연 예매처 통합 검색 서비스입니다.
        </p>

        {/* 검색바 */}
        <form onSubmit={handleSubmit} className="relative max-w-[560px] mx-auto">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="공연명, 출연진 검색"
            className="w-full h-11 pl-5 pr-14 rounded-full bg-white border border-border text-sm focus:outline-none focus:border-mint-dark transition-colors shadow-sm"
          />
          {input && (
            <button
              type="button"
              aria-label="검색어 삭제"
              onClick={() => setInput("")}
              className="absolute right-11 top-1/2 -translate-y-1/2 text-text-muted hover:text-mint-dark transition-colors"
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
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-mint-dark text-white hover:opacity-90 transition-opacity"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </button>
        </form>

        {/* 최근 검색어 */}
        {recents.length > 0 && (
          <div className="mt-4 max-w-[560px] mx-auto text-left">
            <div className="flex items-center justify-between mb-2">
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
          </div>
        )}
      </div>
    </section>
  );
}
