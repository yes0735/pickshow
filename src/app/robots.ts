// Design Ref: §4.3 — 크롤러 접근 제어 (마이페이지, API, API 문서, OG 동적 엔드포인트 제외)
// Plan SC: FR-14 (robots.ts disallow 확장)
import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pickshow.kr";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/my/",
          "/login",
          "/register",
          "/api-docs",
          "/og/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
