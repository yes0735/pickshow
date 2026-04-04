// Design Ref: §5.4 — 로그인 페이지 (이메일 + Google + Kakao)
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("이메일 또는 비밀번호가 올바르지 않습니다");
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-secondary px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl p-8 shadow-sm border border-border">
        <Link href="/" className="block text-center text-2xl font-bold mb-8">
          <span className="text-mint-dark">Pick</span>
          <span className="text-pink-dark">Show</span>
        </Link>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-text-secondary mb-1">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-10 px-3 rounded-lg border border-border text-sm focus:outline-none focus:border-mint"
            />
          </div>
          <div>
            <label className="block text-xs text-text-secondary mb-1">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full h-10 px-3 rounded-lg border border-border text-sm focus:outline-none focus:border-mint"
            />
          </div>

          {error && <p className="text-xs text-pink-dark">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 rounded-lg bg-mint text-white text-sm font-medium hover:bg-mint-dark transition-colors disabled:opacity-50"
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-text-muted">또는</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <div className="space-y-2">
          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="w-full h-10 rounded-lg border border-border text-sm font-medium hover:bg-bg-secondary transition-colors flex items-center justify-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google로 로그인
          </button>
          <button
            onClick={() => signIn("kakao", { callbackUrl: "/" })}
            className="w-full h-10 rounded-lg bg-[#FEE500] text-[#3C1E1E] text-sm font-medium hover:bg-[#FDD800] transition-colors flex items-center justify-center gap-2"
          >
            Kakao로 로그인
          </button>
        </div>

        <p className="text-center text-xs text-text-muted mt-6">
          아직 회원이 아니신가요?{" "}
          <Link href="/register" className="text-mint-dark font-medium hover:underline">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}
