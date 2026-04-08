// Header: 상단 로고+메뉴 / 하단 검색창 2단 구조
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSearchStore } from "@/features/search/hooks";

export default function Header() {
  const [input, setInput] = useState("");
  const setFilter = useSearchStore((s) => s.setFilter);
  const resetFilters = useSearchStore((s) => s.resetFilters);
  const pathname = usePathname();

  // 페이지 이동 시 검색어+필터 초기화 (모달 URL은 제외)
  useEffect(() => {
    if (pathname !== "/" && !pathname.startsWith("/performance/")) {
      setInput("");
      resetFilters();
      setFilter("q", undefined);
    }
  }, [pathname, resetFilters, setFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilter("q", input || undefined);
  };

  const handleLogoClick = () => {
    setInput("");
    resetFilters();
    setFilter("q", undefined);
  };

  const navLinkClass = (path: string) =>
    `text-sm transition-colors ${
      pathname === path || pathname.startsWith(path + "/")
        ? "text-mint-dark font-semibold"
        : "text-text-secondary hover:text-mint-dark"
    }`;

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border">
      {/* 상단: 로고 + 메뉴 */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="h-12 flex items-center justify-between">
          <Link
            href="/"
            className="flex-shrink-0 text-xl font-bold"
            onClick={handleLogoClick}
          >
            <span className="text-mint-dark">Pick</span>
            <span className="text-pink-dark">Show</span>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-5">
            <Link href="/community" className={navLinkClass("/community")}>
              <span className="hidden sm:inline">게시판</span>
              <span className="sm:hidden text-xs">게시판</span>
            </Link>
            <Link href="/my/favorites" className={navLinkClass("/my/favorites")}>
              <span className="hidden sm:inline">찜목록</span>
              <span className="sm:hidden text-xs">찜</span>
            </Link>
            <Link href="/my/performances" className={navLinkClass("/my/performances")}>
              <span className="hidden sm:inline">내공연</span>
              <span className="sm:hidden text-xs">내공연</span>
            </Link>
          </nav>
        </div>
      </div>

      {/* 하단: 검색창 (메인+모달에서만 표시) */}
      {(pathname === "/" || pathname.startsWith("/performance/")) && (
        <div className="max-w-7xl mx-auto px-4 pb-3">
          <form onSubmit={handleSearch}>
            <div className="relative max-w-2xl mx-auto">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="공연명, 출연진 검색"
                className="w-full h-10 pl-4 pr-20 rounded-full border border-border bg-bg-secondary text-sm focus:outline-none focus:border-mint transition-colors"
              />
              {input && (
                <button
                  type="button"
                  aria-label="검색어 삭제"
                  onClick={() => {
                    setInput("");
                    setFilter("q", undefined);
                  }}
                  className="absolute right-10 top-1/2 -translate-y-1/2 text-text-muted hover:text-foreground"
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15" />
                    <path d="M15 9l-6 6M9 9l6 6" />
                  </svg>
                </button>
              )}
              <button
                type="submit"
                aria-label="검색"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-mint-dark"
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      )}
    </header>
  );
}
