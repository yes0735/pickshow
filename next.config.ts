// Plan SC: FR-02 — next/image remotePatterns (Vercel Image Optimization 통과)
// Design Ref: §6.1 (Image Error handling)
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // KOPIS(문화예술공연정보) 및 주요 한국 공연 포스터 CDN 허용
    remotePatterns: [
      { protocol: "http", hostname: "www.kopis.or.kr" },
      { protocol: "https", hostname: "www.kopis.or.kr" },
      { protocol: "http", hostname: "kopis.or.kr" },
      { protocol: "https", hostname: "kopis.or.kr" },
      // 공연 포스터가 다른 도메인에서 호스팅될 경우 여기에 추가
      { protocol: "https", hostname: "**.ticketlink.co.kr" },
      { protocol: "https", hostname: "**.interpark.com" },
      { protocol: "https", hostname: "**.melon.co.kr" },
      { protocol: "https", hostname: "**.yes24.com" },
    ],
    // 기본 AVIF + WebP 포맷 우선
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
