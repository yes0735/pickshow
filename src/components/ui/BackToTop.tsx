// Plan SC: FR-04 - BackToTop 플로팅 버튼
"use client";

import { useState, useEffect } from "react";

export default function BackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 240);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!show) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="맨 위로"
      className="fixed right-4 bottom-18 md:bottom-4 z-40 w-11 h-11 flex items-center justify-center rounded-full bg-white border border-border text-text-secondary hover:text-mint-dark transition-colors"
      style={{ boxShadow: "0 4px 12px rgba(0,0,0,.12)" }}
    >
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M18 15l-6-6-6 6" />
      </svg>
    </button>
  );
}
