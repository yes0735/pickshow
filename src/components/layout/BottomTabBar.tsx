// 하단 탭 바 — 모바일 앱 스타일 (md 이하에서만 표시)
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  {
    href: "/",
    label: "홈",
    icon: (active: boolean) => (
      <svg width="22" height="22" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
        {!active && <path d="M9 21V12h6v9" />}
      </svg>
    ),
    exact: true,
  },
  {
    href: "/search",
    label: "검색",
    icon: () => (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
    ),
  },
  {
    href: "/community/anonymous",
    label: "게시판",
    icon: () => (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    matchPrefix: "/community",
  },
  {
    href: "/my/favorites",
    label: "찜",
    icon: (active: boolean) => (
      <svg width="22" height="22" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    href: "/my/performances",
    label: "내공연",
    icon: () => (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M20 6 9 17l-5-5" />
      </svg>
    ),
  },
];

export default function BottomTabBar() {
  const pathname = usePathname();

  const isActive = (tab: typeof TABS[number]) => {
    if (tab.exact) return pathname === tab.href;
    if (tab.matchPrefix) return pathname.startsWith(tab.matchPrefix);
    return pathname === tab.href || pathname.startsWith(tab.href + "/");
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-14">
        {TABS.map((tab) => {
          const active = isActive(tab);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center gap-0.5 w-full h-full transition-colors ${
                active ? "text-mint-dark" : "text-text-muted"
              }`}
            >
              {tab.icon(active)}
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
