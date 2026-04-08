// 찜 — 로컬스토리지 기반 (로그인 불필요)
"use client";

import { useSyncExternalStore, useCallback } from "react";

const STORAGE_KEY = "pickshow-favorites";

function getFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function setFavorites(ids: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  // 다른 컴포넌트에 변경 알림
  window.dispatchEvent(new Event("favorites-changed"));
}

// 전역 구독 (useSyncExternalStore용)
function subscribe(callback: () => void) {
  window.addEventListener("favorites-changed", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("favorites-changed", callback);
    window.removeEventListener("storage", callback);
  };
}

function getSnapshot(): string {
  return localStorage.getItem(STORAGE_KEY) || "[]";
}

function getServerSnapshot(): string {
  return "[]";
}

export function useLocalFavorites(performanceId: string) {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const ids: string[] = JSON.parse(raw);
  const isFavorited = ids.includes(performanceId);

  const toggle = useCallback(() => {
    const current = getFavorites();
    if (current.includes(performanceId)) {
      setFavorites(current.filter((id) => id !== performanceId));
    } else {
      setFavorites([...current, performanceId]);
    }
  }, [performanceId]);

  return { isFavorited, toggle };
}

export function useAllFavorites() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const ids: string[] = JSON.parse(raw);
  return ids;
}
