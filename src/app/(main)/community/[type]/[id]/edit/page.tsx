// Design Ref: §5.4 — 게시글 수정 페이지
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

// 상세 페이지에서 비밀번호 모달 통과 후 임시 저장된 비밀번호 키
const editPasswordKey = (postId: string) => `pickshow-edit-pw-${postId}`;

interface PostDetail {
  id: string;
  boardType: string;
  category: string;
  title: string;
  content: string;
  authorId: string | null;
  authorNickname: string;
}

export default function EditPostPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const boardType = (params.type as string) ?? "anonymous";
  const postId = params.id as string;

  const [post, setPost] = useState<PostDetail | null>(null);
  const [loadError, setLoadError] = useState<string>("");
  const [form, setForm] = useState({
    title: "",
    content: "",
    anonymousPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  // 상세 페이지에서 비밀번호 모달을 통과했는지 여부
  const [passwordPreVerified, setPasswordPreVerified] = useState(false);

  // 게시글 로드 + sessionStorage에서 비밀번호 자동 로드
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/community/posts/${postId}`);
        if (!res.ok) {
          setLoadError("게시글을 찾을 수 없습니다");
          return;
        }
        const json = await res.json();
        const p: PostDetail = json.data;
        setPost(p);

        // 상세 페이지에서 비밀번호 모달을 통과한 경우 sessionStorage에 저장됨
        let savedPw = "";
        try {
          savedPw = sessionStorage.getItem(editPasswordKey(postId)) ?? "";
        } catch {
          // sessionStorage 접근 차단
        }

        setForm((f) => ({
          ...f,
          title: p.title,
          content: p.content,
          anonymousPassword: savedPw,
        }));
        if (savedPw) setPasswordPreVerified(true);
      } catch {
        setLoadError("게시글을 불러오지 못했습니다");
      }
    })();
  }, [postId]);

  // 익명 게시판 수정 진입은 반드시 상세 페이지에서 비밀번호 모달을 거쳐야 함
  // sessionStorage에 비번이 없다면 상세로 되돌림
  useEffect(() => {
    if (!post) return;
    if (post.boardType !== "anonymous") return;
    if (passwordPreVerified) return;
    // 비밀번호 사전 검증 없이 /edit 직접 진입한 경우
    router.replace(`/community/${boardType}/${postId}`);
  }, [post, passwordPreVerified, router, boardType, postId]);

  // 권한 검증 (회원 게시판만 즉시 확인 가능, 익명은 비번으로 서버 검증)
  if (loadError) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-text-muted mb-4">{loadError}</p>
        <Link
          href={`/community/${boardType}`}
          className="text-mint-dark hover:underline text-sm"
        >
          목록으로
        </Link>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20">
        <div className="h-8 w-2/3 bg-bg-secondary animate-pulse rounded mb-4" />
        <div className="h-40 bg-bg-secondary animate-pulse rounded" />
      </div>
    );
  }

  // 회원 게시판인데 본인 글이 아닌 경우
  if (
    post.boardType === "member" &&
    (!session?.user?.id || post.authorId !== session.user.id)
  ) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-text-muted mb-4">수정 권한이 없습니다</p>
        <Link
          href={`/community/${boardType}/${postId}`}
          className="text-mint-dark hover:underline text-sm"
        >
          게시글로 돌아가기
        </Link>
      </div>
    );
  }

  const isAnonymous = post.boardType === "anonymous";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const body: Record<string, string> = {
      title: form.title,
      content: form.content,
    };
    if (isAnonymous && form.anonymousPassword) {
      body.anonymousPassword = form.anonymousPassword;
    }

    const res = await fetch(`/api/community/posts/${postId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error?.message ?? "수정에 실패했습니다");
      return;
    }

    // 수정 성공 시 sessionStorage 정리
    try {
      sessionStorage.removeItem(editPasswordKey(postId));
    } catch {
      // ignore
    }

    router.push(`/community/${boardType}/${postId}`);
    router.refresh();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link
        href={`/community/${boardType}/${postId}`}
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
        취소
      </Link>

      <h1 className="text-xl font-bold mb-6">
        {isAnonymous ? "익명게시판" : "회원게시판"} 글 수정
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 제목 */}
        <div>
          <label className="block text-xs text-text-secondary mb-1">제목</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
            maxLength={100}
            className="w-full h-10 px-3 rounded-lg border border-border text-sm focus:outline-none focus:border-mint"
          />
        </div>

        {/* 내용 */}
        <div>
          <label className="block text-xs text-text-secondary mb-1">내용</label>
          <textarea
            value={form.content}
            onChange={(e) =>
              setForm((f) => ({ ...f, content: e.target.value }))
            }
            required
            rows={10}
            maxLength={5000}
            className="w-full px-3 py-2 rounded-lg border border-border text-sm resize-none focus:outline-none focus:border-mint"
          />
        </div>

        {/* 익명 게시판: 비밀번호는 상세 페이지 모달에서 사전 검증됨 (hidden) */}
        {isAnonymous && passwordPreVerified && (
          <div className="flex items-center gap-2 rounded-lg border border-mint-light bg-mint-light/30 px-3 py-2">
            <svg
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              className="text-mint-dark flex-shrink-0"
            >
              <path d="M9 12l2 2 4-4" />
              <circle cx="12" cy="12" r="10" />
            </svg>
            <span className="text-[11px] text-mint-dark">
              비밀번호 확인 완료 · 수정 후 저장하세요.
            </span>
          </div>
        )}

        {error && <p className="text-xs text-pink-dark">{error}</p>}

        <div className="flex gap-2">
          <Link
            href={`/community/${boardType}/${postId}`}
            className="flex-1 h-10 flex items-center justify-center rounded-lg border border-border text-sm text-text-secondary hover:bg-bg-secondary transition-colors"
          >
            취소
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex-[2] h-10 rounded-lg bg-mint-dark text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "저장 중..." : "수정 완료"}
          </button>
        </div>
      </form>
    </div>
  );
}
