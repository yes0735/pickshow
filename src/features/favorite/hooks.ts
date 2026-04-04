// Design Ref: §2.3 — 찜 클라이언트 hooks
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useFavorites() {
  return useQuery<{ id: string; performanceId: string; performance: { title: string; posterUrl: string | null } }[]>({
    queryKey: ["favorites"],
    queryFn: async () => {
      const res = await fetch("/api/favorites");
      if (res.status === 401) return [];
      if (!res.ok) throw new Error("찜 목록 조회 실패");
      const json = await res.json();
      return json.data;
    },
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  const add = useMutation({
    mutationFn: async (performanceId: string) => {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ performanceId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message ?? "찜 등록 실패");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });

  const remove = useMutation({
    mutationFn: async (favoriteId: string) => {
      const res = await fetch(`/api/favorites/${favoriteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("찜 해제 실패");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });

  return { add, remove };
}
