// Design Ref: §5.3 — Header: 로고, 통합검색, 로그인/마이페이지 링크
"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useSearchStore } from "@/features/search/hooks";

export default function Header() {
  const [input, setInput] = useState("");
  const setFilter = useSearchStore((s) => s.setFilter);
  const resetFilters = useSearchStore((s) => s.resetFilters);
  const { data: session } = useSession();
  const pathname = usePathname();

  // 페이지 이동 시 검색어+필터 초기화
  useEffect(() => {
    if (pathname !== "/") {
      setInput("");
      resetFilters();
      setFilter("q", undefined);
    }
  }, [pathname, resetFilters, setFilter]);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilter("q", input || undefined);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
        <Link
          href="/"
          className="flex-shrink-0 text-xl font-bold"
          onClick={() => {
            setInput("");
            resetFilters();
            setFilter("q", undefined);
          }}
        >
          <span className="text-mint-dark">Pick</span>
          <span className="text-pink-dark">Show</span>
        </Link>

        <form onSubmit={handleSearch} className="flex-1 max-w-xl">
          <div className="relative">
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

        <nav className="flex items-center gap-3 text-sm">
          <Link
            href="/community"
            className="text-text-secondary hover:text-mint-dark transition-colors hidden sm:block"
          >
            커뮤니티
          </Link>

          {session?.user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="px-4 py-2 rounded-full bg-mint-light text-mint-dark text-sm font-medium hover:bg-mint transition-colors"
              >
                {session.user.name ?? "마이"}
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-xl border border-border shadow-lg py-1 z-50">
                  <Link
                    href="/my/favorites"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 text-sm hover:bg-bg-secondary transition-colors"
                  >
                    찜 목록
                  </Link>
                  <Link
                    href="/my/performances"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 text-sm hover:bg-bg-secondary transition-colors"
                  >
                    내가 본 공연
                  </Link>
                  <Link
                    href="/my/settings"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 text-sm hover:bg-bg-secondary transition-colors"
                  >
                    설정
                  </Link>
                  <hr className="my-1 border-border" />
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      signOut({ callbackUrl: "/" });
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-pink-dark hover:bg-bg-secondary transition-colors"
                  >
                    로그아웃
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 rounded-full bg-mint text-white text-sm font-medium hover:bg-mint-dark transition-colors"
            >
              로그인
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
