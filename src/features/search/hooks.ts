// Design Ref: §2.3 — TanStack Query + Zustand for search state
"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { create } from "zustand";
import type { SearchFilters } from "@/types/performance";
import type { Performance } from "@/types/performance";
import type { CommonCode, Pagination, SortOption, ViewMode } from "@/types/common";

// 다중선택 필드 키
const MULTI_KEYS: (keyof SearchFilters)[] = ["genre", "status", "ageLimit", "ticketSite"];

// Zustand store for filter state
interface SearchStore {
  filters: SearchFilters;
  sort: SortOption;
  viewMode: ViewMode;
  setFilter: (key: keyof SearchFilters, value: string | number | string[] | undefined) => void;
  toggleFilter: (key: keyof SearchFilters, value: string) => void;
  setSort: (sort: SortOption) => void;
  setViewMode: (mode: ViewMode) => void;
  resetFilters: () => void;
}

// 기본 필터: 공연중
const defaultFilters = (): SearchFilters => ({
  status: ["ongoing"],
});

export const useSearchStore = create<SearchStore>((set) => ({
  filters: defaultFilters(),
  sort: "title",
  viewMode: "card",
  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value || undefined },
    })),
  // 다중선택 토글: 배열에서 값 추가/제거
  toggleFilter: (key, value) =>
    set((state) => {
      const current = (state.filters[key] as string[] | undefined) ?? [];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return {
        filters: {
          ...state.filters,
          [key]: next.length > 0 ? next : undefined,
        },
      };
    }),
  setSort: (sort) => set({ sort }),
  setViewMode: (viewMode) => set({ viewMode }),
  resetFilters: () =>
    set((state) => ({
      filters: { q: state.filters.q, ...defaultFilters() },
      sort: "title",
    })),
}));

// Build query string from filters (배열은 콤마 구분)
function buildSearchParams(filters: SearchFilters, sort: SortOption, cursor?: string) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === "") return;
    if (Array.isArray(value)) {
      if (value.length > 0) params.set(key, value.join(","));
    } else {
      params.set(key, String(value));
    }
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
    staleTime: 1000 * 60 * 30,
  });
}
