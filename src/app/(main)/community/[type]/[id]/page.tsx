// Design Ref: §5.4 — 게시글 상세 + 댓글
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import { getRelativeTime } from "@/lib/utils";
import DOMPurify from "dompurify";

interface PostDetail {
  id: string;
  boardType: string;
  category: string;
  title: string;
  content: string;
  authorId: string | null;
  authorNickname: string;
  viewCount: number;
  commentCount: number;
  createdAt: string;
}

interface Comment {
  id: string;
  authorNickname: string;
  authorId: string | null;
  content: string;
  createdAt: string;
}

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const boardType = params.type as string;
  const postId = params.id as string;
  const [commentPage, setCommentPage] = useState(1);

  const { data: post, isLoading } = useQuery<PostDetail>({
    queryKey: ["post", postId],
    queryFn: async () => {
      const res = await fetch(`/api/community/posts/${postId}`);
      if (!res.ok) throw new Error("게시글을 찾을 수 없습니다");
      const json = await res.json();
      return json.data;
    },
  });

  // 댓글 페이징 조회
  const { data: commentsData } = useQuery<{
    data: Comment[];
    pagination: { page: number; totalPages: number; total: number };
  }>({
    queryKey: ["comments", postId, commentPage],
    queryFn: async () => {
      const res = await fetch(`/api/community/posts/${postId}/comments?page=${commentPage}&limit=10`);
      return res.json();
    },
    enabled: !!post,
  });

  // 댓글 작성
  const [commentText, setCommentText] = useState("");
  const [commentNickname, setCommentNickname] = useState("");
  const [commentPassword, setCommentPassword] = useState("");

  const addComment = useMutation({
    mutationFn: async () => {
      const body: Record<string, string> = { content: commentText };
      if (!session?.user) {
        body.authorNickname = commentNickname || "익명";
        if (commentPassword) body.anonymousPassword = commentPassword;
      }
      const res = await fetch(`/api/community/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("댓글 작성 실패");
    },
    onSuccess: () => {
      setCommentText("");
      setCommentNickname("");
      setCommentPassword("");
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
    },
  });

  // 게시글 삭제
  const deletePost = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/community/posts/${postId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error("삭제 실패");
    },
    onSuccess: () => {
      window.location.href = `/community/${boardType}`;
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="h-8 w-2/3 bg-bg-secondary animate-pulse rounded mb-4" />
        <div className="h-40 bg-bg-secondary animate-pulse rounded" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center text-text-muted">
        게시글을 찾을 수 없습니다
      </div>
    );
  }

  const isAuthor = session?.user?.id && post.authorId === session.user.id;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link
        href={`/community/${boardType}`}
        className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-mint-dark mb-6"
      >
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="m15 18-6-6 6-6" />
        </svg>
        목록으로
      </Link>

      {/* 게시글 */}
      <article className="bg-white rounded-2xl border border-border p-5 sm:p-6 mb-6">
        {/* 카테고리 + 메타 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-mint-light text-mint-dark flex items-center justify-center text-sm font-bold">
              {post.authorNickname.charAt(0)}
            </span>
            <div>
              <p className="text-sm font-medium">{post.authorNickname}</p>
              <p className="text-[11px] text-text-muted">
                {getRelativeTime(new Date(post.createdAt))} · 조회 {post.viewCount}
              </p>
            </div>
          </div>
          {isAuthor && (
            <button
              onClick={() => deletePost.mutate()}
              disabled={deletePost.isPending}
              className="px-3 py-1.5 rounded-lg text-xs text-text-muted hover:text-pink-dark hover:bg-pink-light transition-colors"
            >
              삭제
            </button>
          )}
        </div>

        <h1 className="text-lg font-bold mb-4">{post.title}</h1>

        <div
          className="text-sm leading-relaxed whitespace-pre-line text-text-secondary"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(post.content, { ALLOWED_TAGS: [] }),
          }}
        />
      </article>

      {/* 댓글 */}
      <section>
        <h2 className="flex items-center gap-2 text-sm font-semibold mb-4">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          댓글 {commentsData?.pagination.total ?? post.commentCount}개
        </h2>

        {commentsData && commentsData.data.length > 0 && (
          <div className="space-y-2.5 mb-4">
            {commentsData.data.map((c) => (
              <div key={c.id} className="p-3.5 rounded-xl bg-bg-secondary">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-6 h-6 rounded-full bg-border-light text-text-muted flex items-center justify-center text-[10px] font-bold">
                    {c.authorNickname.charAt(0)}
                  </span>
                  <span className="text-xs font-medium">{c.authorNickname}</span>
                  <span className="text-[11px] text-text-muted">{getRelativeTime(new Date(c.createdAt))}</span>
                </div>
                <p className="text-sm pl-8">{c.content}</p>
              </div>
            ))}
          </div>
        )}

        {/* 댓글 페이지네이션 */}
        {commentsData && commentsData.pagination.totalPages > 1 && (
          <div className="flex justify-center gap-1 mb-6">
            {Array.from({ length: commentsData.pagination.totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setCommentPage(p)}
                className={`w-7 h-7 rounded text-xs font-medium transition-colors ${
                  p === commentPage
                    ? "bg-mint-dark text-white"
                    : "text-text-muted hover:bg-bg-secondary"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {/* 댓글 작성 폼 */}
        <div className="bg-white rounded-2xl border border-border p-4">
          {!session?.user && (
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={commentNickname}
                onChange={(e) => setCommentNickname(e.target.value)}
                placeholder="닉네임"
                className="flex-1 h-9 px-3 rounded-xl border border-border text-xs focus:outline-none focus:border-mint-dark"
              />
              <input
                type="password"
                value={commentPassword}
                onChange={(e) => setCommentPassword(e.target.value)}
                placeholder="비밀번호"
                className="flex-1 h-9 px-3 rounded-xl border border-border text-xs focus:outline-none focus:border-mint-dark"
              />
            </div>
          )}
          <div className="flex gap-2 items-end">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="댓글을 작성해주세요"
              rows={2}
              className="flex-1 px-3 py-2.5 rounded-xl border border-border text-sm resize-none focus:outline-none focus:border-mint-dark"
            />
            <button
              onClick={() => addComment.mutate()}
              disabled={!commentText.trim() || addComment.isPending}
              className="h-[52px] px-4 rounded-xl bg-mint-dark text-white text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 flex-shrink-0"
            >
              {addComment.isPending ? "..." : "등록"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
