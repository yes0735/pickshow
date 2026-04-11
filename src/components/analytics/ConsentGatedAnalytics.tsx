// Design Ref: §7 Security — GA4 consent gating (개인정보법 준수)
// Plan SC: FR-16 (Google Analytics 4 연동), §Risk "GA4 스니펫이 CookieConsent 전에 로드되어 개인정보법 위반" 방지
//
// 이 컴포넌트는 CookieConsent에서 사용자가 "동의"를 클릭한 후에만 GA4 스크립트를 로드한다.
// - 마운트 시: localStorage의 "pickshow-cookie-consent" 값 확인
// - 수락 상태면 즉시 <GoogleAnalytics> 렌더
// - 거부/미결정 상태면 아무것도 렌더하지 않음
// - CookieConsent가 "pickshow-consent-changed" 커스텀 이벤트를 발생시키면 재평가
"use client";

import { GoogleAnalytics } from "@next/third-parties/google";
import { useEffect, useState } from "react";

const COOKIE_CONSENT_KEY = "pickshow-cookie-consent";
const CONSENT_EVENT = "pickshow-consent-changed";

interface Props {
  gaId: string;
}

export default function ConsentGatedAnalytics({ gaId }: Props) {
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    // 초기 상태 확인
    const check = () => {
      const value = localStorage.getItem(COOKIE_CONSENT_KEY);
      setConsented(value === "accepted");
    };
    check();

    // CookieConsent에서 동의/거부 클릭 시 발생하는 이벤트 구독
    const handler = () => check();
    window.addEventListener(CONSENT_EVENT, handler);
    // 다른 탭에서 변경된 경우 대응
    window.addEventListener("storage", handler);

    return () => {
      window.removeEventListener(CONSENT_EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  if (!consented) return null;
  return <GoogleAnalytics gaId={gaId} />;
}
