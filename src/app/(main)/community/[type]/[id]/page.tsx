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
  comments: {
    id: string;
    authorNickname: string;
    authorId: string | null;
    content: string;
    createdAt: string;
  }[];
}

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const boardType = params.type as string;
  const postId = params.id as string;

  const { data: post, isLoading } = useQuery<PostDetail>({
    queryKey: ["post", postId],
    queryFn: async () => {
      const res = await fetch(`/api/community/posts/${postId}`);
      if (!res.ok) throw new Error("게시글을 찾을 수 없습니다");
      const json = await res.json();
      return json.data;
    },
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
    onSuccess: () => router.push(`/community/${boardType}`),
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
      <article className="border border-border rounded-xl p-6 mb-6">
        <h1 className="text-lg font-bold mb-2">{post.title}</h1>
        <div className="flex gap-3 text-xs text-text-muted mb-4">
          <span>{post.authorNickname}</span>
          <span>{getRelativeTime(new Date(post.createdAt))}</span>
          <span>조회 {post.viewCount}</span>
        </div>
        <div
          className="text-sm leading-relaxed whitespace-pre-line"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(post.content, { ALLOWED_TAGS: [] }),
          }}
        />

        {isAuthor && (
          <div className="flex gap-2 mt-4 pt-4 border-t border-border">
            <button
              onClick={() => deletePost.mutate()}
              disabled={deletePost.isPending}
              className="px-3 py-1 rounded-lg border border-pink text-pink-dark text-xs hover:bg-pink-light transition-colors"
            >
              삭제
            </button>
          </div>
        )}
      </article>

      {/* 댓글 */}
      <section>
        <h2 className="text-sm font-semibold mb-4">댓글 {post.comments.length}개</h2>

        {post.comments.length > 0 && (
          <div className="space-y-3 mb-6">
            {post.comments.map((c) => (
              <div key={c.id} className="p-3 rounded-lg bg-bg-secondary">
                <div className="flex gap-2 text-xs text-text-muted mb-1">
                  <span className="font-medium text-foreground">{c.authorNickname}</span>
                  <span>{getRelativeTime(new Date(c.createdAt))}</span>
                </div>
                <p className="text-sm">{c.content}</p>
              </div>
            ))}
          </div>
        )}

        {/* 댓글 작성 폼 */}
        <div className="border border-border rounded-xl p-4">
          {!session?.user && (
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={commentNickname}
                onChange={(e) => setCommentNickname(e.target.value)}
                placeholder="닉네임"
                className="w-24 h-8 px-2 rounded border border-border text-xs focus:outline-none focus:border-mint"
              />
              <input
                type="password"
                value={commentPassword}
                onChange={(e) => setCommentPassword(e.target.value)}
                placeholder="비밀번호"
                className="w-24 h-8 px-2 rounded border border-border text-xs focus:outline-none focus:border-mint"
              />
            </div>
          )}
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="댓글을 작성해주세요"
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-border text-sm resize-none focus:outline-none focus:border-mint"
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={() => addComment.mutate()}
              disabled={!commentText.trim() || addComment.isPending}
              className="px-4 py-2 rounded-lg bg-mint text-white text-xs font-medium hover:bg-mint-dark transition-colors disabled:opacity-50"
            >
              {addComment.isPending ? "등록 중..." : "댓글 등록"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
