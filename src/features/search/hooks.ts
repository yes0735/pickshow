// Design Ref: §2.3 — TanStack Query + Zustand for search state
"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { create } from "zustand";
import type { SearchFilters } from "@/types/performance";
import type { Performance } from "@/types/performance";
import type { CommonCode, Pagination, SortOption, ViewMode } from "@/types/common";

// Zustand store for filter state
interface SearchStore {
  filters: SearchFilters;
  sort: SortOption;
  viewMode: ViewMode;
  setFilter: (key: keyof SearchFilters, value: string | number | undefined) => void;
  setSort: (sort: SortOption) => void;
  setViewMode: (mode: ViewMode) => void;
  resetFilters: () => void;
}

export const useSearchStore = create<SearchStore>((set) => ({
  filters: {},
  sort: "date",
  viewMode: "card",
  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value || undefined },
    })),
  setSort: (sort) => set({ sort }),
  setViewMode: (viewMode) => set({ viewMode }),
  resetFilters: () => set({ filters: {}, sort: "date" }),
}));

// Build query string from filters
function buildSearchParams(filters: SearchFilters, sort: SortOption, cursor?: string) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  params.set("sort", sort);
  params.set("limit", "10");
  if (cursor) params.set("cursor", cursor);
  return params.toString();
}

// Infinite query for performance search
export function useSearchPerformances() {
  const { filters, sort } = useSearchStore();

  return useInfiniteQuery<{
    data: Performance[];
    pagination: Pagination;
  }>({
    queryKey: ["performances", filters, sort],
    queryFn: async ({ pageParam }) => {
      const qs = buildSearchParams(filters, sort, pageParam as string | undefined);
      const res = await fetch(`/api/performances?${qs}`);
      if (!res.ok) throw new Error("검색에 실패했습니다");
      return res.json();
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNext ? lastPage.pagination.cursor : undefined,
  });
}

// Common codes for filter options
export function useCommonCodes(group?: string) {
  return useQuery<CommonCode[]>({
    queryKey: ["common-codes", group],
    queryFn: async () => {
      const qs = group ? `?group=${group}` : "";
      const res = await fetch(`/api/common-codes${qs}`);
      if (!res.ok) throw new Error("코드 조회 실패");
      const json = await res.json();
      return json.data;
    },
    staleTime: 1000 * 60 * 30, // 30분 캐시
  });
}
