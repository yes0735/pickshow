// Design Ref: §5.4 — 내가 본 공연 목록 (별점, 한줄리뷰 표시)
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import Link from "next/link";

interface MyPerf {
  id: string;
  performanceId: string;
  rating: number;
  review: string | null;
  seatInfo: string | null;
  ticketSite: string | null;
  viewedAt: string | null;
  performance: { title: string; posterUrl: string | null; venue: string };
}

export default function MyPerformancesPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<MyPerf[]>({
    queryKey: ["my-performances"],
    queryFn: async () => {
      const res = await fetch("/api/my-performances");
      if (!res.ok) return [];
      const json = await res.json();
      return json.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/my-performances/${id}`, { method: "DELETE" });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-performances"] }),
  });

  // Gap Fix: F-6 — 내가본공연 등록 폼
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    performanceId: "",
    rating: 5,
    review: "",
    seatInfo: "",
    ticketSite: "",
    viewedAt: "",
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/my-performances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          review: form.review || undefined,
          seatInfo: form.seatInfo || undefined,
          ticketSite: form.ticketSite || undefined,
          viewedAt: form.viewedAt || undefined,
        }),
      });
      if (!res.ok) throw new Error("등록 실패");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-performances"] });
      setShowForm(false);
      setForm({ performanceId: "", rating: 5, review: "", seatInfo: "", ticketSite: "", viewedAt: "" });
    },
  });

  const stars = (rating: number) => "★".repeat(rating) + "☆".repeat(5 - rating);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">내가 본 공연</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-lg bg-mint text-white text-sm font-medium hover:bg-mint-dark transition-colors"
        >
          {showForm ? "취소" : "등록하기"}
        </button>
      </div>

      {/* 등록 폼 */}
      {showForm && (
        <div className="border border-border rounded-xl p-4 mb-6 space-y-3">
          <div>
            <label className="block text-xs text-text-secondary mb-1">공연 ID (검색 후 복사)</label>
            <input
              type="text"
              value={form.performanceId}
              onChange={(e) => setForm((f) => ({ ...f, performanceId: e.target.value }))}
              placeholder="공연 상세 URL에서 ID 복사"
              className="w-full h-10 px-3 rounded-lg border border-border text-sm focus:outline-none focus:border-mint"
            />
          </div>
          <div>
            <label className="block text-xs text-text-secondary mb-1">별점</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, rating: n }))}
                  className={`text-2xl ${n <= form.rating ? "text-pink" : "text-border"}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs text-text-secondary mb-1">한줄 리뷰</label>
            <input
              type="text"
              value={form.review}
              onChange={(e) => setForm((f) => ({ ...f, review: e.target.value }))}
              maxLength={200}
              placeholder="간단한 한줄 메모"
              className="w-full h-10 px-3 rounded-lg border border-border text-sm focus:outline-none focus:border-mint"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs text-text-secondary mb-1">좌석 정보</label>
              <input
                type="text"
                value={form.seatInfo}
                onChange={(e) => setForm((f) => ({ ...f, seatInfo: e.target.value }))}
                placeholder="예: 1층 A구역 3열"
                className="w-full h-10 px-3 rounded-lg border border-border text-sm focus:outline-none focus:border-mint"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-text-secondary mb-1">예매처</label>
              <input
                type="text"
                value={form.ticketSite}
                onChange={(e) => setForm((f) => ({ ...f, ticketSite: e.target.value }))}
                placeholder="인터파크, YES24 등"
                className="w-full h-10 px-3 rounded-lg border border-border text-sm focus:outline-none focus:border-mint"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-text-secondary mb-1">관람 날짜</label>
            <input
              type="date"
              value={form.viewedAt}
              onChange={(e) => setForm((f) => ({ ...f, viewedAt: e.target.value }))}
              className="w-full h-10 px-3 rounded-lg border border-border text-sm focus:outline-none focus:border-mint"
            />
          </div>
          <button
            onClick={() => addMutation.mutate()}
            disabled={!form.performanceId || addMutation.isPending}
            className="w-full h-10 rounded-lg bg-pink text-white text-sm font-medium hover:bg-pink-dark transition-colors disabled:opacity-50"
          >
            {addMutation.isPending ? "등록 중..." : "등록하기"}
          </button>
        </div>
      )}

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-bg-secondary animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && (!data || data.length === 0) && (
        <div className="text-center py-20">
          <p className="text-text-muted text-lg mb-2">아직 등록한 공연이 없습니다</p>
          <Link href="/" className="text-sm text-mint-dark hover:underline">
            공연 검색하러 가기
          </Link>
        </div>
      )}

      {data && data.length > 0 && (
        <div className="space-y-3">
          {data.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 p-4 rounded-xl border border-border bg-white"
            >
              <Link
                href={`/performance/${item.performanceId}`}
                className="w-20 h-28 flex-shrink-0 rounded-lg overflow-hidden bg-bg-secondary"
              >
                {item.performance.posterUrl ? (
                  <img
                    src={item.performance.posterUrl}
                    alt={item.performance.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-text-muted text-[10px]">
                    포스터
                  </div>
                )}
              </Link>

              <div className="flex-1 min-w-0">
                <Link href={`/performance/${item.performanceId}`}>
                  <h3 className="font-semibold text-sm truncate hover:text-mint-dark transition-colors">
                    {item.performance.title}
                  </h3>
                </Link>
                <p className="text-xs text-text-muted">{item.performance.venue}</p>
                <p className="text-sm text-pink-dark mt-1">{stars(item.rating)}</p>
                {item.review && (
                  <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                    {item.review}
                  </p>
                )}
                <div className="flex gap-3 mt-2 text-[10px] text-text-muted">
                  {item.seatInfo && <span>좌석: {item.seatInfo}</span>}
                  {item.ticketSite && <span>예매처: {item.ticketSite}</span>}
                </div>
                <button
                  onClick={() => deleteMutation.mutate(item.id)}
                  disabled={deleteMutation.isPending}
                  className="mt-2 px-3 py-1 rounded-lg border border-border text-xs text-text-muted hover:text-pink-dark hover:border-pink transition-colors"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
