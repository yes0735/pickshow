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
    authorNickname: "",
    anonymousPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const categories = CATEGORIES[boardType] ?? CATEGORIES.anonymous;

  // 회원 게시판인데 로그인 안 된 경우
  if (boardType === "member" && !session?.user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
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
      body.authorNickname = form.authorNickname || "익명";
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
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link
        href={`/community/${boardType}`}
        className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-mint-dark mb-6"
      >
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="m15 18-6-6 6-6" />
        </svg>
        목록으로
      </Link>

      <h1 className="text-xl font-bold mb-6">
        {boardType === "anonymous" ? "익명게시판" : "회원게시판"} 글쓰기
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
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

        {/* 익명 게시판: 닉네임/비밀번호 */}
        {boardType === "anonymous" && (
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs text-text-secondary mb-1">닉네임</label>
              <input
                type="text"
                value={form.authorNickname}
                onChange={(e) => setForm((f) => ({ ...f, authorNickname: e.target.value }))}
                placeholder="익명"
                className="w-full h-10 px-3 rounded-lg border border-border text-sm focus:outline-none focus:border-mint"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-text-secondary mb-1">비밀번호 (수정/삭제용)</label>
              <input
                type="password"
                value={form.anonymousPassword}
                onChange={(e) => setForm((f) => ({ ...f, anonymousPassword: e.target.value }))}
                placeholder="4자 이상"
                className="w-full h-10 px-3 rounded-lg border border-border text-sm focus:outline-none focus:border-mint"
              />
            </div>
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
  );
}
