// Design Ref: §5.4 — 게시글 작성 페이지
"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import Link from "next/link";

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

export default function WritePostPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const boardType = (params.type as string) ?? "anonymous";

  const [form, setForm] = useState({
    category: "",
    title: "",
    content: "",
    anonymousPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const categories = CATEGORIES[boardType] ?? CATEGORIES.anonymous;

  // 회원 게시판인데 로그인 안 된 경우
  if (boardType === "member" && !session?.user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-text-muted mb-4">회원 게시판은 로그인이 필요합니다</p>
        <Link href="/login" className="text-mint-dark hover:underline text-sm">
          로그인하기
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const body: Record<string, string> = {
      boardType,
      category: form.category,
      title: form.title,
      content: form.content,
    };

    if (boardType === "anonymous") {
      // 익명 게시판: 작성자는 항상 "익명"으로 고정
      body.authorNickname = "익명";
      if (form.anonymousPassword) body.anonymousPassword = form.anonymousPassword;
    }

    const res = await fetch("/api/community/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error?.message ?? "글 작성에 실패했습니다");
      return;
    }

    const data = await res.json();
    window.location.href = `/community/${boardType}/${data.data.id}`;
  };

  return (
    <>
    <div className="max-w-7xl mx-auto px-4 pt-6">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-text-muted mb-4">
        <Link href="/" className="hover:text-mint-dark transition-colors">홈</Link>
        <span>›</span>
        <Link href={`/community/${boardType}`} className="hover:text-mint-dark transition-colors">게시판</Link>
        <span>›</span>
        <span className="text-text-secondary">글쓰기</span>
      </nav>
    </div>
    <div className="max-w-3xl mx-auto px-4 pb-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">
          {boardType === "anonymous" ? "익명게시판" : "회원게시판"} 글쓰기
        </h1>
        <Link
          href={`/community/${boardType}`}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border text-sm text-text-secondary hover:bg-bg-secondary transition-colors"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          목록
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-border p-5 sm:p-6 space-y-4">
        {/* 카테고리 */}
        <div>
          <label className="block text-xs text-text-secondary mb-1">카테고리</label>
          <select
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            required
            className="w-full h-10 px-3 rounded-lg border border-border text-sm focus:outline-none focus:border-mint"
          >
            <option value="">선택해주세요</option>
            {categories.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* 익명 게시판: 비밀번호 (수정/삭제용) — 닉네임은 "익명"으로 고정 */}
        {boardType === "anonymous" && (
          <div>
            <label className="block text-xs text-text-secondary mb-1">
              비밀번호 <span className="text-text-muted">(수정/삭제용, 선택)</span>
            </label>
            <input
              type="password"
              value={form.anonymousPassword}
              onChange={(e) =>
                setForm((f) => ({ ...f, anonymousPassword: e.target.value }))
              }
              placeholder="4자 이상 (나중에 삭제하려면 입력)"
              className="w-full h-10 px-3 rounded-lg border border-border text-sm focus:outline-none focus:border-mint"
            />
            <p className="mt-1 text-[11px] text-text-muted">
              작성자는 자동으로 <b>익명</b>으로 등록됩니다.
            </p>
          </div>
        )}

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
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            required
            rows={10}
            maxLength={5000}
            className="w-full px-3 py-2 rounded-lg border border-border text-sm resize-none focus:outline-none focus:border-mint"
          />
        </div>

        {error && <p className="text-xs text-pink-dark">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-10 rounded-lg bg-mint text-white text-sm font-medium hover:bg-mint-dark transition-colors disabled:opacity-50"
        >
          {loading ? "등록 중..." : "글 등록"}
        </button>
      </form>
    </div>
    </>
  );
}
