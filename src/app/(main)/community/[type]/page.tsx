// 게시판 목록 — 카드형 UI
"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { cn, getRelativeTime } from "@/lib/utils";

const CATEGORY_COLORS: Record<string, string> = {
  promotion: "bg-pink-light text-pink-dark border-pink-dark/15",
  info: "bg-mint-light text-mint-dark border-mint-dark/15",
  wanted: "bg-[#FFF3E0] text-[#E65100] border-[#E65100]/15",
  transfer: "bg-[#E8EAF6] text-[#283593] border-[#283593]/15",
};

const CATEGORY_ICONS: Record<string, string> = {
  promotion: "📢",
  info: "💡",
  wanted: "🔍",
  transfer: "🔄",
};

const CATEGORIES = [
  { code: "promotion", label: "홍보" },
  { code: "info", label: "정보" },
  { code: "wanted", label: "구함" },
];

interface Post {
  id: string;
  title: string;
  authorNickname: string;
  viewCount: number;
  commentCount: number;
  category: string;
  createdAt: string;
}

export default function BoardListPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const boardType = (params.type as string) ?? "anonymous";
  const category = searchParams.get("category") ?? undefined;
  const page = Number(searchParams.get("page") ?? "1");

  const { data, isLoading } = useQuery<{
    data: Post[];
    pagination: { page: number; totalPages: number; total: number };
  }>({
    queryKey: ["posts", boardType, category, page],
    queryFn: async () => {
      const qs = new URLSearchParams({ boardType, page: String(page) });
      if (category) qs.set("category", category);
      const res = await fetch(`/api/community/posts?${qs}`);
      return res.json();
    },
  });

  const total = data?.pagination?.total ?? 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold">게시판</h1>
          {!isLoading && (
            <p className="text-xs text-text-muted mt-0.5">{total.toLocaleString()}개의 글</p>
          )}
        </div>
        <Link
          href={`/community/${boardType}/write`}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-mint-dark text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm"
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M12 5v14M5 12h14" />
          </svg>
          글쓰기
        </Link>
      </div>

      {/* 카테고리 필터 */}
      <div className="flex gap-2 mb-5 overflow-x-auto">
        <button
          onClick={() => router.push(`/community/${boardType}`)}
          className={cn(
            "px-3.5 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap",
            !category
              ? "bg-foreground text-white"
              : "bg-bg-secondary text-text-secondary hover:bg-border-light"
          )}
        >
          전체
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.code}
            onClick={() => router.push(`/community/${boardType}?category=${c.code}`)}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap border",
              category === c.code
                ? CATEGORY_COLORS[c.code]
                : "bg-white text-text-secondary border-border hover:border-text-muted"
            )}
          >
            {CATEGORY_ICONS[c.code]} {c.label}
          </button>
        ))}
      </div>

      {/* 로딩 스켈레톤 */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-bg-secondary animate-pulse" />
          ))}
        </div>
      )}

      {/* 빈 상태 */}
      {!isLoading && (!data?.data || data.data.length === 0) && (
        <div className="text-center py-24">
          <div className="text-4xl mb-3">📝</div>
          <p className="text-text-muted text-sm mb-1">아직 게시글이 없습니다</p>
          <p className="text-text-muted text-xs">첫 번째 글을 작성해보세요!</p>
        </div>
      )}

      {/* 게시글 목록 (카드형) */}
      {data?.data && data.data.length > 0 && (
        <div className="space-y-2.5">
          {data.data.map((post) => (
            <Link
              key={post.id}
              href={`/community/${boardType}/${post.id}`}
              className="block p-4 rounded-2xl border border-border bg-white hover:shadow-md hover:border-mint-dark/20 transition-all"
            >
              {/* 카테고리 + 시간 */}
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                    CATEGORY_COLORS[post.category] ?? "bg-bg-secondary text-text-muted border-border"
                  }`}
                >
                  {CATEGORY_ICONS[post.category] ?? ""}{" "}
                  {CATEGORIES.find((c) => c.code === post.category)?.label ?? post.category}
                </span>
                <span className="text-[11px] text-text-muted">
                  {getRelativeTime(new Date(post.createdAt))}
                </span>
              </div>

              {/* 제목 */}
              <h3 className="text-sm font-semibold leading-snug mb-2 line-clamp-2">
                {post.title}
              </h3>

              {/* 하단 메타 */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">{post.authorNickname}</span>
                <div className="flex items-center gap-3 text-[11px] text-text-muted">
                  <span className="flex items-center gap-0.5">
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    {post.viewCount}
                  </span>
                  {post.commentCount > 0 && (
                    <span className="flex items-center gap-0.5 text-mint-dark font-medium">
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      {post.commentCount}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* 페이지네이션 */}
      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-1 mt-8">
          {/* 이전 */}
          <button
            onClick={() => {
              if (page <= 1) return;
              const qs = new URLSearchParams();
              qs.set("page", String(page - 1));
              if (category) qs.set("category", category);
              router.push(`/community/${boardType}?${qs}`);
            }}
            disabled={page <= 1}
            className="w-8 h-8 rounded-lg text-xs text-text-muted hover:bg-bg-secondary disabled:opacity-30 transition-colors"
          >
            ‹
          </button>

          {Array.from({ length: data.pagination.totalPages }, (_, i) => i + 1)
            .filter((p) => {
              // 현재 페이지 기준 ±2 범위만 표시
              return Math.abs(p - page) <= 2 || p === 1 || p === data.pagination.totalPages;
            })
            .map((p, idx, arr) => (
              <span key={p}>
                {idx > 0 && arr[idx - 1] !== p - 1 && (
                  <span className="text-xs text-text-muted px-1">…</span>
                )}
                <button
                  onClick={() => {
                    const qs = new URLSearchParams();
                    qs.set("page", String(p));
                    if (category) qs.set("category", category);
                    router.push(`/community/${boardType}?${qs}`);
                  }}
                  className={cn(
                    "w-8 h-8 rounded-lg text-xs font-medium transition-colors",
                    p === page
                      ? "bg-mint-dark text-white"
                      : "text-text-muted hover:bg-bg-secondary"
                  )}
                >
                  {p}
                </button>
              </span>
            ))}

          {/* 다음 */}
          <button
            onClick={() => {
              if (page >= data.pagination.totalPages) return;
              const qs = new URLSearchParams();
              qs.set("page", String(page + 1));
              if (category) qs.set("category", category);
              router.push(`/community/${boardType}?${qs}`);
            }}
            disabled={page >= data.pagination.totalPages}
            className="w-8 h-8 rounded-lg text-xs text-text-muted hover:bg-bg-secondary disabled:opacity-30 transition-colors"
          >
            ›
          </button>
        </div>
      )}

      {/* 모바일 글쓰기 FAB */}
      <Link
        href={`/community/${boardType}/write`}
        className="sm:hidden fixed bottom-6 right-6 w-14 h-14 rounded-full bg-mint-dark text-white shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity z-30"
        aria-label="글쓰기"
      >
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </Link>
    </div>
  );
}
