// Header 1단 구조 — 로고 + 카테고리 + 유틸리티 nav
// 모바일: 햄버거 드로어
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const GENRES: { slug: string; label: string }[] = [
  { slug: "musical", label: "뮤지컬" },
  { slug: "theater", label: "연극" },
  { slug: "concert", label: "콘서트" },
  { slug: "classic", label: "클래식" },
  { slug: "dance", label: "무용" },
  { slug: "korean", label: "국악" },
  { slug: "etc", label: "기타" },
];

export default function Header() {
  const pathname = usePathname();
  const [drawer, setDrawer] = useState(false);
  const [hintGenre, setHintGenre] = useState<string | null>(null);

  useEffect(() => {
    const el = document.documentElement;
    const read = () => setHintGenre(el.dataset.activeGenre ?? null);
    read();
    const observer = new MutationObserver(read);
    observer.observe(el, { attributes: true, attributeFilter: ["data-active-genre"] });
    return () => observer.disconnect();
  }, [pathname]);

  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawer(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [drawer]);

  const isActiveGenre = (slug: string) => {
    return pathname.startsWith(`/genre/${slug}`) || hintGenre === slug;
  };

  const navLinkClass = (path: string) =>
    `text-[13px] transition-colors ${
      pathname === path || pathname.startsWith(path + "/")
        ? "text-mint-dark font-semibold"
        : "text-text-secondary hover:text-mint-dark"
    }`;

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border">
      <div className="max-w-7xl mx-auto px-4 h-12 flex items-center gap-4">
        {/* 모바일 햄버거 */}
        <button
          onClick={() => setDrawer(true)}
          aria-label="카테고리 메뉴 열기"
          className="md:hidden text-text-secondary hover:text-mint-dark transition-colors shrink-0"
        >
          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* 로고 */}
        <Link href="/" className="shrink-0 text-xl font-bold tracking-tight">
          <span className="text-mint-dark">Pick</span>
          <span className="text-pink-dark">Show</span>
        </Link>

        {/* 카테고리 탭 (데스크톱 md+, 로고 옆) */}
        <nav className="hidden md:flex items-center gap-1 overflow-x-auto shrink min-w-0" style={{ whiteSpace: "nowrap" }}>
          {GENRES.map((g) => {
            const active = isActiveGenre(g.slug);
            return (
              <Link
                key={g.slug}
                href={`/genre/${g.slug}`}
                className="text-[13px] font-medium transition-colors shrink-0 px-2.5 py-1 rounded-md"
                style={{
                  color: active ? "var(--color-mint-dark)" : "var(--color-text-secondary)",
                  fontWeight: active ? 600 : 500,
                  background: active ? "var(--color-mint-light)" : "transparent",
                }}
              >
                {g.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex-1" />

        {/* 유틸리티 nav */}
        <nav className="flex items-center gap-4 shrink-0" style={{ whiteSpace: "nowrap" }}>
          <Link href="/search" aria-label="검색" className="text-text-secondary hover:text-mint-dark transition-colors">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </Link>
          <Link href="/community" className={navLinkClass("/community")}>게시판</Link>
          <Link href="/my/favorites" className={navLinkClass("/my/favorites")}>찜</Link>
          <Link href="/my/performances" className={navLinkClass("/my/performances")}>내공연</Link>
        </nav>
      </div>

      {/* 모바일 드로어 */}
      {drawer && (
        <>
          <div
            onClick={() => setDrawer(false)}
            className="fixed inset-0 bg-black/50 z-[60] animate-fadeIn"
          />
          <aside
            className="fixed top-0 left-0 bottom-0 w-[280px] bg-white z-[61] flex flex-col animate-slideInLeft"
          >
            <div className="flex items-center justify-between border-b border-border px-4 h-12">
              <span className="text-sm font-semibold">카테고리</span>
              <button
                onClick={() => setDrawer(false)}
                aria-label="닫기"
                className="text-text-muted hover:text-mint-dark transition-colors"
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex flex-col p-2">
              {GENRES.map((g) => {
                const active = isActiveGenre(g.slug);
                return (
                  <Link
                    key={g.slug}
                    href={`/genre/${g.slug}`}
                    onClick={() => setDrawer(false)}
                    className="text-sm text-left transition-colors rounded-lg"
                    style={{
                      padding: "10px 12px",
                      background: active ? "var(--color-mint-light)" : "transparent",
                      color: active ? "var(--color-mint-dark)" : "var(--color-text)",
                      fontWeight: active ? 600 : 500,
                    }}
                  >
                    {g.label}
                  </Link>
                );
              })}
            </div>
          </aside>
        </>
      )}
    </header>
  );
}
