// 게시판 목록 — 일반 게시판 형태
"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { cn, getRelativeTime } from "@/lib/utils";

const CATEGORY_COLORS: Record<string, string> = {
  promotion: "text-pink-dark",
  info: "text-mint-dark",
  wanted: "text-[#E65100]",
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
    <>
    <div className="max-w-7xl mx-auto px-4 pt-6">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-text-muted mb-4">
        <Link href="/" className="hover:text-mint-dark transition-colors">홈</Link>
        <span>›</span>
        <span className="text-text-secondary">게시판</span>
      </nav>
    </div>
    <div className="max-w-3xl mx-auto px-4 pb-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold">게시판</h1>
        <Link
          href={`/community/${boardType}/write`}
          className="px-4 py-2 rounded-lg bg-mint-dark text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          글쓰기
        </Link>
      </div>

      {/* 카테고리 필터 */}
      <div className="flex gap-1.5 mb-4">
        <button
          onClick={() => router.push(`/community/${boardType}`)}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
            !category
              ? "bg-mint-dark text-white"
              : "text-text-secondary hover:bg-bg-secondary"
          )}
        >
          전체
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.code}
            onClick={() => router.push(`/community/${boardType}?category=${c.code}`)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              category === c.code
                ? "bg-mint-dark text-white"
                : "text-text-secondary hover:bg-bg-secondary"
            )}
          >
            {c.label}
          </button>
        ))}
        {!isLoading && (
          <span className="ml-auto text-xs text-text-muted self-center">총 {total}건</span>
        )}
      </div>

      {/* 게시글 테이블 (흰색 카드) */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">

      {/* 테��블 헤더 */}
      <div className="hidden sm:grid grid-cols-[1fr_80px_80px_60px] gap-2 px-4 py-2 bg-bg-secondary text-[11px] text-text-muted font-medium border-b border-border-light">
        <span>제목</span>
        <span className="text-center">작성자</span>
        <span className="text-center">날짜</span>
        <span className="text-center">조회</span>
      </div>

      {/* 로딩 */}
      {isLoading && (
        <div className="divide-y divide-border-light">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 bg-bg-secondary/50 animate-pulse" />
          ))}
        </div>
      )}

      {/* 빈 상태 */}
      {!isLoading && (!data?.data || data.data.length === 0) && (
        <div className="text-center py-20">
          <p className="text-text-muted text-sm">게시글이 없습니다</p>
        </div>
      )}

      {/* 게시글 목록 */}
      {data?.data && data.data.length > 0 && (
        <div className="divide-y divide-border-light">
          {data.data.map((post) => (
            <Link
              key={post.id}
              href={`/community/${boardType}/${post.id}`}
              className="block hover:bg-bg-secondary/50 transition-colors"
            >
              {/* 데스크톱 */}
              <div className="hidden sm:grid grid-cols-[1fr_80px_80px_60px] gap-2 px-4 py-2 items-center">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`text-[11px] font-medium flex-shrink-0 ${CATEGORY_COLORS[post.category] ?? "text-text-muted"}`}>
                    [{CATEGORIES.find((c) => c.code === post.category)?.label ?? post.category}]
                  </span>
                  <span className="text-sm truncate">{post.title}</span>
                  {post.commentCount > 0 && (
                    <span className="text-[11px] text-mint-dark font-medium flex-shrink-0">
                      [{post.commentCount}]
                    </span>
                  )}
                </div>
                <span className="text-xs text-text-muted text-center truncate">{post.authorNickname}</span>
                <span className="text-xs text-text-muted text-center">{formatShortDate(post.createdAt)}</span>
                <span className="text-xs text-text-muted text-center">{post.viewCount}</span>
              </div>

              {/* 모바일 */}
              <div className="sm:hidden px-4 py-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`text-[10px] font-medium ${CATEGORY_COLORS[post.category] ?? "text-text-muted"}`}>
                    [{CATEGORIES.find((c) => c.code === post.category)?.label ?? post.category}]
                  </span>
                  <span className="text-sm truncate flex-1">{post.title}</span>
                  {post.commentCount > 0 && (
                    <span className="text-[10px] text-mint-dark font-medium">[{post.commentCount}]</span>
                  )}
                </div>
                <div className="flex gap-2 text-[11px] text-text-muted">
                  <span>{post.authorNickname}</span>
                  <span>{getRelativeTime(new Date(post.createdAt))}</span>
                  <span>조회 {post.viewCount}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      </div>{/* 흰색 카드 닫기 */}

      {/* 페이지네이션 */}
      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-1 mt-6">
          <button
            onClick={() => {
              if (page <= 1) return;
              const qs = new URLSearchParams();
              qs.set("page", String(page - 1));
              if (category) qs.set("category", category);
              router.push(`/community/${boardType}?${qs}`);
            }}
            disabled={page <= 1}
            className="px-2 h-8 rounded text-xs text-text-muted hover:bg-bg-secondary disabled:opacity-30"
          >
            이전
          </button>

          {Array.from({ length: data.pagination.totalPages }, (_, i) => i + 1)
            .filter((p) => Math.abs(p - page) <= 2 || p === 1 || p === data.pagination.totalPages)
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
                    "w-8 h-8 rounded text-xs font-medium transition-colors",
                    p === page
                      ? "bg-mint-dark text-white"
                      : "text-text-muted hover:bg-bg-secondary"
                  )}
                >
                  {p}
                </button>
              </span>
            ))}

          <button
            onClick={() => {
              if (page >= data.pagination.totalPages) return;
              const qs = new URLSearchParams();
              qs.set("page", String(page + 1));
              if (category) qs.set("category", category);
              router.push(`/community/${boardType}?${qs}`);
            }}
            disabled={page >= data.pagination.totalPages}
            className="px-2 h-8 rounded text-xs text-text-muted hover:bg-bg-secondary disabled:opacity-30"
          >
            다음
          </button>
        </div>
      )}
    </div>
    </>
  );
}

function formatShortDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }
  return `${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}
