"use client";

import { useState } from "react";

export default function ShareButton() {
  const [copied, setCopied] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ url });
        return;
      } catch {
        // 사용자가 취소한 경우 — clipboard fallback
      }
    }

    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleClick}
      className="w-9 h-9 flex items-center justify-center rounded-full bg-white/80 text-text-muted hover:text-mint-dark hover:bg-white transition-colors"
      title="공유하기"
    >
      {copied ? (
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      ) : (
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" />
        </svg>
      )}
    </button>
  );
}
