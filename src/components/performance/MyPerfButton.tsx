// 내공연 등록/해제 — 로컬스토리지 기반 (체크 아이콘)
"use client";

import { useSyncExternalStore, useCallback } from "react";

const STORAGE_KEY = "pickshow-my-performances";

function getMyPerfs(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function setMyPerfs(ids: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  window.dispatchEvent(new Event("myperfs-changed"));
}

function subscribe(cb: () => void) {
  window.addEventListener("myperfs-changed", cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener("myperfs-changed", cb);
    window.removeEventListener("storage", cb);
  };
}

function getSnapshot() {
  return localStorage.getItem(STORAGE_KEY) || "[]";
}

function getServerSnapshot() {
  return "[]";
}

interface Props {
  performanceId: string;
  size?: "sm" | "md";
}

export default function MyPerfButton({ performanceId, size = "sm" }: Props) {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const ids: string[] = JSON.parse(raw);
  const isChecked = ids.includes(performanceId);

  const toggle = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const current = getMyPerfs();
      if (current.includes(performanceId)) {
        setMyPerfs(current.filter((id) => id !== performanceId));
      } else {
        setMyPerfs([...current, performanceId]);
      }
    },
    [performanceId]
  );

  const sizeClass = size === "md" ? "w-9 h-9" : "w-7 h-7";

  return (
    <button
      onClick={toggle}
      className={`${sizeClass} flex items-center justify-center rounded-full transition-colors ${
        isChecked
          ? "bg-mint-dark text-white"
          : "bg-white/80 text-text-muted hover:text-mint-dark hover:bg-white"
      }`}
      title={isChecked ? "내공연 해제" : "내공연 등록"}
    >
      <svg
        width={size === "md" ? 18 : 14}
        height={size === "md" ? 18 : 14}
        fill="none"
        stroke="currentColor"
        strokeWidth={isChecked ? "3" : "2"}
        viewBox="0 0 24 24"
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
    </button>
  );
}

// 전체 내공연 ID 목록 hook (내공연 페이지용)
export function useAllMyPerfs(): string[] {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return JSON.parse(raw);
}
