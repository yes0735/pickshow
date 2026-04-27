// Design Ref: §5.4 — 게시글 상세 + 댓글 (수정/삭제 지원)
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import { getRelativeTime } from "@/lib/utils";
import DOMPurify from "dompurify";

// 비밀번호 sessionStorage key (수정 페이지로 일시 전달)
const editPasswordKey = (postId: string) => `pickshow-edit-pw-${postId}`;

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

// 확인 + (선택) 비밀번호 입력 모달 (삭제 및 수정 게이팅 공용)
function ConfirmModal({
  title,
  description,
  requirePassword,
  confirmLabel,
  confirmColor = "pink",
  onConfirm,
  onCancel,
  isPending,
  errorMessage,
}: {
  title: string;
  description?: string;
  requirePassword: boolean;
  confirmLabel: string;
  confirmColor?: "pink" | "mint";
  onConfirm: (password?: string) => void;
  onCancel: () => void;
  isPending: boolean;
  errorMessage?: string;
}) {
  const [password, setPassword] = useState("");

  const confirmClasses =
    confirmColor === "mint"
      ? "bg-mint-dark text-white hover:opacity-90"
      : "bg-pink-dark text-white hover:opacity-90";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl p-5 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-semibold text-base mb-2">{title}</h3>
        {description && (
          <p className="text-xs text-text-muted mb-4">{description}</p>
        )}
        {requirePassword && (
          <div className="mb-4">
            <label className="block text-xs text-text-secondary mb-1">
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="작성 시 입력한 비밀번호"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && password) {
                  e.preventDefault();
                  onConfirm(password);
                }
              }}
              className="w-full h-10 px-3 rounded-lg border border-border text-sm focus:outline-none focus:border-mint-dark"
            />
          </div>
        )}
        {errorMessage && (
          <p className="mb-3 text-xs text-pink-dark">{errorMessage}</p>
        )}
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 h-10 rounded-lg border border-border text-xs text-text-secondary hover:bg-bg-secondary transition-colors"
          >
            취소
          </button>
          <button
            onClick={() => onConfirm(requirePassword ? password : undefined)}
            disabled={isPending || (requirePassword && !password)}
            className={`flex-1 h-10 rounded-lg text-xs font-semibold transition-opacity disabled:opacity-40 ${confirmClasses}`}
          >
            {isPending ? "처리 중..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
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
      const res = await fetch(
        `/api/community/posts/${postId}/comments?page=${commentPage}&limit=10`,
      );
      return res.json();
    },
    enabled: !!post,
  });

  // 댓글 작성 — 비로그인 사용자는 작성자 고정 "익명"
  const [commentText, setCommentText] = useState("");
  const [commentPassword, setCommentPassword] = useState("");

  const addComment = useMutation({
    mutationFn: async () => {
      const body: Record<string, string> = { content: commentText };
      if (!session?.user) {
        body.authorNickname = "익명";
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
      setCommentPassword("");
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
    },
  });

  // 게시글 수정 게이팅 (익명: 비밀번호 검증 후 edit 페이지 이동)
  const [postEditModalOpen, setPostEditModalOpen] = useState(false);
  const [postEditError, setPostEditError] = useState<string>("");

  const verifyAndEdit = useMutation({
    mutationFn: async (password: string) => {
      const res = await fetch(
        `/api/community/posts/${postId}/verify-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ anonymousPassword: password }),
        },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error?.message ?? "비밀번호 확인에 실패했습니다");
      }
      return password;
    },
    onSuccess: (password) => {
      // sessionStorage에 일시 저장 (edit 페이지에서 읽어 자동 채움)
      try {
        sessionStorage.setItem(editPasswordKey(postId), password);
      } catch {
        // sessionStorage 차단된 경우: edit 페이지에서 재입력하면 됨
      }
      setPostEditModalOpen(false);
      setPostEditError("");
      router.push(`/community/${boardType}/${postId}/edit`);
    },
    onError: (err: Error) => {
      setPostEditError(err.message);
    },
  });

  // 게시글 삭제
  const [postDeleteModalOpen, setPostDeleteModalOpen] = useState(false);
  const [postDeleteError, setPostDeleteError] = useState<string>("");

  const deletePost = useMutation({
    mutationFn: async (password?: string) => {
      const res = await fetch(`/api/community/posts/${postId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(password ? { anonymousPassword: password } : {}),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error?.message ?? "삭제에 실패했습니다");
      }
    },
    onSuccess: () => {
      window.location.href = `/community/${boardType}`;
    },
    onError: (err: Error) => {
      setPostDeleteError(err.message);
    },
  });

  // 댓글 삭제
  const [commentDeleteModal, setCommentDeleteModal] = useState<{
    id: string;
    requirePassword: boolean;
  } | null>(null);
  const [commentDeleteError, setCommentDeleteError] = useState<string>("");

  const deleteComment = useMutation({
    mutationFn: async ({
      id,
      password,
    }: {
      id: string;
      password?: string;
    }) => {
      const res = await fetch(`/api/community/comments/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(password ? { anonymousPassword: password } : {}),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error?.message ?? "삭제에 실패했습니다");
      }
    },
    onSuccess: () => {
      setCommentDeleteModal(null);
      setCommentDeleteError("");
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
    },
    onError: (err: Error) => {
      setCommentDeleteError(err.message);
    },
  });

  // 댓글 수정 — 익명이면 비밀번호 모달 → 검증 → 인라인 편집 모드 진입
  // 회원이면 바로 인라인 편집 모드
  const [commentEditState, setCommentEditState] = useState<{
    id: string;
    content: string;
    password?: string; // 익명 수정용
  } | null>(null);
  const [commentEditError, setCommentEditError] = useState<string>("");

  // 비밀번호 모달 (수정 진입용)
  const [commentEditPwModal, setCommentEditPwModal] = useState<{
    id: string;
    content: string;
  } | null>(null);
  const [commentEditPwError, setCommentEditPwError] = useState<string>("");

  const updateComment = useMutation({
    mutationFn: async ({
      id,
      content,
      password,
    }: {
      id: string;
      content: string;
      password?: string;
    }) => {
      const body: Record<string, string> = { content };
      if (password) body.anonymousPassword = password;

      const res = await fetch(`/api/community/comments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error?.message ?? "수정에 실패했습니다");
      }
    },
    onSuccess: () => {
      setCommentEditState(null);
      setCommentEditError("");
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
    },
    onError: (err: Error) => {
      setCommentEditError(err.message);
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

  // 수정/삭제 가능 여부 판단
  // - 회원 게시판: 본인 글만
  // - 익명 게시판: 누구나 (서버가 비밀번호로 검증, 비번 없이 쓴 글은 API가 거부)
  const isMemberAuthor =
    session?.user?.id && post.authorId === session.user.id;
  const canManagePost =
    post.boardType === "anonymous" || isMemberAuthor;
  const postNeedsPassword = post.boardType === "anonymous";

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link
        href={`/community/${boardType}`}
        className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-mint-dark mb-6"
      >
        <svg
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
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
                {getRelativeTime(new Date(post.createdAt))} · 조회{" "}
                {post.viewCount}
              </p>
            </div>
          </div>
          {canManagePost && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  if (postNeedsPassword) {
                    // 익명: 비밀번호 모달 → verify → edit 이동
                    setPostEditError("");
                    setPostEditModalOpen(true);
                  } else {
                    // 회원: 즉시 edit 이동
                    router.push(
                      `/community/${boardType}/${postId}/edit`,
                    );
                  }
                }}
                className="px-3 py-1.5 rounded-lg text-xs text-text-muted hover:text-mint-dark hover:bg-mint-light transition-colors"
              >
                수정
              </button>
              <button
                onClick={() => {
                  setPostDeleteError("");
                  setPostDeleteModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-lg text-xs text-text-muted hover:text-pink-dark hover:bg-pink-light transition-colors"
              >
                삭제
              </button>
            </div>
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
          <svg
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            viewBox="0 0 24 24"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          댓글 {commentsData?.pagination.total ?? post.commentCount}개
        </h2>

        {commentsData && commentsData.data.length > 0 && (
          <div className="space-y-2.5 mb-4">
            {commentsData.data.map((c) => {
              const isCommentMemberAuthor =
                session?.user?.id && c.authorId === session.user.id;
              const canManageComment =
                !c.authorId || isCommentMemberAuthor; // 익명 댓글 or 본인 회원 댓글
              const commentNeedsPassword = !c.authorId;
              const isEditing = commentEditState?.id === c.id;

              return (
                <div key={c.id} className="p-3.5 rounded-xl bg-bg-secondary">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-border-light text-text-muted flex items-center justify-center text-[10px] font-bold">
                        {c.authorNickname.charAt(0)}
                      </span>
                      <span className="text-xs font-medium">
                        {c.authorNickname}
                      </span>
                      <span className="text-[11px] text-text-muted">
                        {getRelativeTime(new Date(c.createdAt))}
                      </span>
                    </div>
                    {canManageComment && !isEditing && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setCommentEditError("");
                            if (commentNeedsPassword) {
                              // 익명: 비밀번호 모달 먼저
                              setCommentEditPwError("");
                              setCommentEditPwModal({
                                id: c.id,
                                content: c.content,
                              });
                            } else {
                              // 회원: 즉시 인라인 편집
                              setCommentEditState({
                                id: c.id,
                                content: c.content,
                              });
                            }
                          }}
                          className="text-[11px] text-text-muted hover:text-mint-dark transition-colors"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => {
                            setCommentDeleteError("");
                            setCommentDeleteModal({
                              id: c.id,
                              requirePassword: commentNeedsPassword,
                            });
                          }}
                          className="text-[11px] text-text-muted hover:text-pink-dark transition-colors"
                        >
                          삭제
                        </button>
                      </div>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="pl-8 space-y-2">
                      <textarea
                        value={commentEditState.content}
                        onChange={(e) =>
                          setCommentEditState((s) =>
                            s ? { ...s, content: e.target.value } : s,
                          )
                        }
                        rows={3}
                        className="w-full px-3 py-2 rounded-lg border border-border text-sm resize-none focus:outline-none focus:border-mint-dark"
                      />
                      {commentEditError && (
                        <p className="text-[11px] text-pink-dark">
                          {commentEditError}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setCommentEditState(null);
                            setCommentEditError("");
                          }}
                          className="h-8 px-3 rounded-lg border border-border text-[11px] text-text-secondary hover:bg-bg-secondary transition-colors"
                        >
                          취소
                        </button>
                        <button
                          onClick={() =>
                            updateComment.mutate({
                              id: commentEditState.id,
                              content: commentEditState.content,
                              password: commentEditState.password,
                            })
                          }
                          disabled={
                            !commentEditState.content.trim() ||
                            updateComment.isPending
                          }
                          className="h-8 px-3 rounded-lg bg-mint-dark text-white text-[11px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
                        >
                          {updateComment.isPending ? "저장 중..." : "저장"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm pl-8 whitespace-pre-wrap">
                      {c.content}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 댓글 페이지네이션 */}
        {commentsData && commentsData.pagination.totalPages > 1 && (
          <div className="flex justify-center gap-1 mb-6">
            {Array.from(
              { length: commentsData.pagination.totalPages },
              (_, i) => i + 1,
            ).map((p) => (
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

        {/* 댓글 작성 폼 — 비로그인은 "익명"으로 자동 등록 */}
        <div className="bg-white rounded-2xl border border-border p-4">
          {!session?.user && (
            <div className="mb-3">
              <input
                type="password"
                value={commentPassword}
                onChange={(e) => setCommentPassword(e.target.value)}
                placeholder="비밀번호 (삭제용, 선택)"
                className="w-full h-9 px-3 rounded-xl border border-border text-xs focus:outline-none focus:border-mint-dark"
              />
              <p className="mt-1 text-[11px] text-text-muted">
                작성자는 자동으로 <b>익명</b>으로 등록됩니다.
              </p>
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

      {/* 게시글 수정 비밀번호 모달 (익명 전용) */}
      {postEditModalOpen && (
        <ConfirmModal
          title="게시글 수정"
          description="작성 시 입력한 비밀번호를 입력해주세요."
          requirePassword={true}
          confirmLabel="확인"
          confirmColor="mint"
          onConfirm={(pw) => pw && verifyAndEdit.mutate(pw)}
          onCancel={() => {
            setPostEditModalOpen(false);
            setPostEditError("");
          }}
          isPending={verifyAndEdit.isPending}
          errorMessage={postEditError}
        />
      )}

      {/* 게시글 삭제 모달 */}
      {postDeleteModalOpen && (
        <ConfirmModal
          title="게시글을 삭제하시겠습니까?"
          description="삭제 후에는 복구할 수 없습니다."
          requirePassword={postNeedsPassword}
          confirmLabel="삭제"
          onConfirm={(pw) => deletePost.mutate(pw)}
          onCancel={() => {
            setPostDeleteModalOpen(false);
            setPostDeleteError("");
          }}
          isPending={deletePost.isPending}
          errorMessage={postDeleteError}
        />
      )}

      {/* 댓글 삭제 모달 */}
      {commentDeleteModal && (
        <ConfirmModal
          title="댓글을 삭제하시겠습니까?"
          description="삭제 후에는 복구할 수 없습니다."
          requirePassword={commentDeleteModal.requirePassword}
          confirmLabel="삭제"
          onConfirm={(pw) =>
            deleteComment.mutate({
              id: commentDeleteModal.id,
              password: pw,
            })
          }
          onCancel={() => {
            setCommentDeleteModal(null);
            setCommentDeleteError("");
          }}
          isPending={deleteComment.isPending}
          errorMessage={commentDeleteError}
        />
      )}

      {/* 댓글 수정 비밀번호 모달 (익명 전용) */}
      {commentEditPwModal && (
        <ConfirmModal
          title="댓글 수정"
          description="작성 시 입력한 비밀번호를 입력해주세요."
          requirePassword={true}
          confirmLabel="확인"
          confirmColor="mint"
          onConfirm={async (pw) => {
            if (!pw || !commentEditPwModal) return;
            // 댓글은 전용 verify API가 없으므로 실제 수정 시 검증됨.
            // UX를 위해 비번을 상태에 저장하고 인라인 편집 모드 진입.
            setCommentEditState({
              id: commentEditPwModal.id,
              content: commentEditPwModal.content,
              password: pw,
            });
            setCommentEditPwModal(null);
            setCommentEditPwError("");
          }}
          onCancel={() => {
            setCommentEditPwModal(null);
            setCommentEditPwError("");
          }}
          isPending={false}
          errorMessage={commentEditPwError}
        />
      )}
    </div>
  );
}
