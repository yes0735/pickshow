// Design Ref: §5.4 — 회원가입 페이지 (필수/선택 동의 분리)
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    password: "",
    passwordConfirm: "",
    nickname: "",
    agreeTerms: false,
    agreePrivacy: false,
    agreeMarketing: false,
  });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [globalError, setGlobalError] = useState("");
  const [loading, setLoading] = useState(false);

  const allRequired = form.agreeTerms && form.agreePrivacy;
  const allChecked = form.agreeTerms && form.agreePrivacy && form.agreeMarketing;

  const handleAllAgree = () => {
    const next = !allChecked;
    setForm((f) => ({
      ...f,
      agreeTerms: next,
      agreePrivacy: next,
      agreeMarketing: next,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGlobalError("");

    if (form.password !== form.passwordConfirm) {
      setErrors({ passwordConfirm: ["비밀번호가 일치하지 않습니다"] });
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.email,
        password: form.password,
        nickname: form.nickname,
        agreeTerms: form.agreeTerms,
        agreePrivacy: form.agreePrivacy,
        agreeMarketing: form.agreeMarketing,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      if (data.error?.details?.fieldErrors) {
        setErrors(data.error.details.fieldErrors);
      } else {
        setGlobalError(data.error?.message ?? "가입에 실패했습니다");
      }
      return;
    }

    // 가입 성공 → 자동 로그인
    await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    router.push("/");
    router.refresh();
  };

  const inputClass =
    "w-full h-10 px-3 rounded-lg border border-border text-sm focus:outline-none focus:border-mint";

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-secondary px-4 py-8">
      <div className="w-full max-w-sm bg-white rounded-2xl p-8 shadow-sm border border-border">
        <Link href="/" className="block text-center text-2xl font-bold mb-8">
          <span className="text-mint-dark">Pick</span>
          <span className="text-pink-dark">Show</span>
        </Link>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="이메일" error={errors.email}>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
              className={inputClass}
            />
          </Field>

          <Field label="비밀번호" error={errors.password}>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="영문 + 숫자 8자 이상"
              required
              className={inputClass}
            />
          </Field>

          <Field label="비밀번호 확인" error={errors.passwordConfirm}>
            <input
              type="password"
              value={form.passwordConfirm}
              onChange={(e) => setForm((f) => ({ ...f, passwordConfirm: e.target.value }))}
              required
              className={inputClass}
            />
          </Field>

          <Field label="닉네임" error={errors.nickname}>
            <input
              type="text"
              value={form.nickname}
              onChange={(e) => setForm((f) => ({ ...f, nickname: e.target.value }))}
              placeholder="2~20자"
              required
              className={inputClass}
            />
          </Field>

          {/* 동의 체크박스 */}
          <div className="pt-2 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={allChecked}
                onChange={handleAllAgree}
                className="w-4 h-4 accent-mint"
              />
              <span className="text-sm font-medium">전체 동의</span>
            </label>
            <div className="ml-6 space-y-1.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.agreeTerms}
                  onChange={(e) => setForm((f) => ({ ...f, agreeTerms: e.target.checked }))}
                  className="w-3.5 h-3.5 accent-mint"
                />
                <span className="text-xs text-text-secondary">
                  [필수]{" "}
                  <Link href="/terms" className="underline" target="_blank">
                    이용약관
                  </Link>{" "}
                  동의
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.agreePrivacy}
                  onChange={(e) => setForm((f) => ({ ...f, agreePrivacy: e.target.checked }))}
                  className="w-3.5 h-3.5 accent-mint"
                />
                <span className="text-xs text-text-secondary">
                  [필수]{" "}
                  <Link href="/privacy" className="underline" target="_blank">
                    개인정보처리방침
                  </Link>{" "}
                  동의
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.agreeMarketing}
                  onChange={(e) => setForm((f) => ({ ...f, agreeMarketing: e.target.checked }))}
                  className="w-3.5 h-3.5 accent-mint"
                />
                <span className="text-xs text-text-muted">[선택] 마케팅 수신 동의</span>
              </label>
            </div>
          </div>

          {globalError && <p className="text-xs text-pink-dark">{globalError}</p>}

          <button
            type="submit"
            disabled={loading || !allRequired}
            className="w-full h-10 rounded-lg bg-mint text-white text-sm font-medium hover:bg-mint-dark transition-colors disabled:opacity-50"
          >
            {loading ? "가입 중..." : "회원가입"}
          </button>
        </form>

        <p className="text-center text-xs text-text-muted mt-6">
          이미 회원이신가요?{" "}
          <Link href="/login" className="text-mint-dark font-medium hover:underline">
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string[];
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs text-text-secondary mb-1">{label}</label>
      {children}
      {error?.map((e, i) => (
        <p key={i} className="text-xs text-pink-dark mt-1">
          {e}
        </p>
      ))}
    </div>
  );
}
