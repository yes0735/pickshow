// Design Ref: §10 + FR-18 — 쿠키 동의 배너 (AdSense + GA4 쿠키 고지)
// Plan SC (seo-boost): FR-16 — consent 상태 변경 시 ConsentGatedAnalytics 알림
"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";

const COOKIE_CONSENT_KEY = "pickshow-cookie-consent";
const CONSENT_EVENT = "pickshow-consent-changed";

function subscribe(listener: () => void) {
  window.addEventListener(CONSENT_EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(CONSENT_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}

function getSnapshot(): string | null {
  return localStorage.getItem(COOKIE_CONSENT_KEY);
}

function getServerSnapshot(): string | null {
  // SSR 중에는 localStorage 없음 → 배너 숨김 (hydration 후 클라이언트에서 재평가)
  return "pending";
}

function notifyConsentChange() {
  // ConsentGatedAnalytics 등 consent 의존 컴포넌트가 즉시 반영하도록 알림
  window.dispatchEvent(new Event(CONSENT_EVENT));
}

export default function CookieConsent() {
  const consent = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    notifyConsentChange();
  };

  const handleDecline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "declined");
    notifyConsentChange();
  };

  // consent === null: 결정 안 됨 → 배너 표시
  // consent === "accepted" | "declined" | "pending": 배너 숨김
  if (consent !== null) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border shadow-lg">
      <div className="max-w-4xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center gap-3">
        <p className="text-xs text-text-secondary flex-1">
          PickShow는 서비스 개선과 광고를 위해 쿠키를 사용합니다.{" "}
          <Link href="/privacy" className="text-mint-dark underline">
            개인정보처리방침
          </Link>
          에서 자세한 내용을 확인하세요.
        </p>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={handleDecline}
            className="px-4 py-2 rounded-lg border border-border text-xs text-text-muted hover:bg-bg-secondary transition-colors"
          >
            거부
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-2 rounded-lg bg-mint text-white text-xs font-medium hover:bg-mint-dark transition-colors"
          >
            동의
          </button>
        </div>
      </div>
    </div>
  );
}
