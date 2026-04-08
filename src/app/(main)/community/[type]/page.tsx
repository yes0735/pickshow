// Design Ref: §5.4 — 게시판 목록 (탭, 카테고리 필터, 페이지네이션)
"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { cn, getRelativeTime } from "@/lib/utils";

const CATEGORY_COLORS: Record<string, string> = {
  promotion: "bg-pink-light text-pink-dark",
  info: "bg-mint-light text-mint-dark",
  wanted: "bg-[#FFF3E0] text-[#E65100]",
  transfer: "bg-[#E8EAF6] text-[#283593]",
};

const CATEGORIES: Record<string, { code: string; label: string }[]> = {
  anonymous: [
    { code: "promotion", label: "홍보" },
    { code: "info", label: "정보" },
    { code: "wanted", label: "구함" },
  ],
  member: [
    { code: "promotion", label: "홍보" },
    { code: "info", label: "정보" },
    { code: "transfer", label: "양도" },
    { code: "wanted", label: "구함" },
  ],
};

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

  const categories = CATEGORIES[boardType] ?? CATEGORIES.anonymous;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold mb-6">게시판</h1>

      {/* 카테고리 필터 */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => router.push(`/community/${boardType}`)}
          className={cn(
            "px-3 py-1 rounded-lg text-xs transition-colors",
            !category ? "bg-pink-light text-pink-dark" : "text-text-muted hover:bg-bg-secondary"
          )}
        >
          전체
        </button>
        {categories.map((c) => (
          <button
            key={c.code}
            onClick={() => router.push(`/community/${boardType}?category=${c.code}`)}
            className={cn(
              "px-3 py-1 rounded-lg text-xs transition-colors",
              category === c.code
                ? "bg-pink-light text-pink-dark"
                : "text-text-muted hover:bg-bg-secondary"
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* 글쓰기 버튼 */}
      <div className="flex justify-end mb-4">
        <Link
          href={`/community/${boardType}/write`}
          className="px-4 py-2 rounded-lg bg-mint text-white text-sm font-medium hover:bg-mint-dark transition-colors"
        >
          글쓰기
        </Link>
      </div>

      {/* 게시글 목록 */}
      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-bg-secondary animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && (!data?.data || data.data.length === 0) && (
        <div className="text-center py-20 text-text-muted">
          게시글이 없습니다
        </div>
      )}

      {data?.data && data.data.length > 0 && (
        <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
          {data.data.map((post) => (
            <Link
              key={post.id}
              href={`/community/${boardType}/${post.id}`}
              className="block px-4 py-3 hover:bg-bg-secondary transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${CATEGORY_COLORS[post.category] ?? "bg-bg-secondary text-text-muted"}`}>
                  {categories.find((c) => c.code === post.category)?.label ?? post.category}
                </span>
                <h3 className="text-sm font-medium truncate flex-1">{post.title}</h3>
                {post.commentCount > 0 && (
                  <span className="text-xs text-pink-dark">[{post.commentCount}]</span>
                )}
              </div>
              <div className="flex gap-3 text-[11px] text-text-muted">
                <span>{post.authorNickname}</span>
                <span>{getRelativeTime(new Date(post.createdAt))}</span>
                <span>조회 {post.viewCount}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* 페이지네이션 */}
      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex justify-center gap-1 mt-6">
          {Array.from({ length: data.pagination.totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => {
                const qs = new URLSearchParams();
                qs.set("page", String(p));
                if (category) qs.set("category", category);
                router.push(`/community/${boardType}?${qs}`);
              }}
              className={cn(
                "w-8 h-8 rounded-lg text-xs transition-colors",
                p === page
                  ? "bg-mint text-white"
                  : "text-text-muted hover:bg-bg-secondary"
              )}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
