// Design Ref: §5.4 + §8.3 — 설정 페이지 (회원탈퇴 포함)
"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleWithdraw = async () => {
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/withdraw", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: password || undefined }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error?.message ?? "탈퇴에 실패했습니다");
      return;
    }

    await signOut({ redirect: false });
    router.push("/");
    router.refresh();
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <h1 className="text-xl font-bold mb-8">설정</h1>

      <section className="border border-border rounded-xl p-6">
        <h2 className="text-sm font-semibold text-pink-dark mb-2">회원 탈퇴</h2>
        <p className="text-xs text-text-muted mb-4">
          탈퇴 시 개인정보가 즉시 파기되며, 찜 목록과 내가 본 공연 기록이 삭제됩니다.
          작성한 게시글은 &quot;탈퇴회원&quot;으로 표시됩니다.
        </p>

        {!showWithdraw ? (
          <button
            onClick={() => setShowWithdraw(true)}
            className="px-4 py-2 rounded-lg border border-pink text-pink-dark text-xs hover:bg-pink-light transition-colors"
          >
            회원 탈퇴하기
          </button>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-text-secondary mb-1">
                비밀번호 확인 (이메일 가입 회원)
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="소셜 로그인은 비워두세요"
                className="w-full h-10 px-3 rounded-lg border border-border text-sm focus:outline-none focus:border-pink"
              />
            </div>

            {error && <p className="text-xs text-pink-dark">{error}</p>}

            <div className="flex gap-2">
              <button
                onClick={handleWithdraw}
                disabled={loading}
                className="flex-1 h-10 rounded-lg bg-pink-dark text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? "처리 중..." : "탈퇴 확인"}
              </button>
              <button
                onClick={() => {
                  setShowWithdraw(false);
                  setPassword("");
                  setError("");
                }}
                className="flex-1 h-10 rounded-lg border border-border text-sm text-text-secondary hover:bg-bg-secondary transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
