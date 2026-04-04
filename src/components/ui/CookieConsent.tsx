// Design Ref: §10 + FR-18 — 쿠키 동의 배너 (AdSense 쿠키 고지)
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const COOKIE_CONSENT_KEY = "pickshow-cookie-consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) setVisible(true);
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "declined");
    setVisible(false);
  };

  if (!visible) return null;

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
