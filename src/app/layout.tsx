// Design Ref: §11.1 — Root layout (Pretendard next/font, WebSite JSON-LD, AdSense, CookieConsent, GA4)
// Plan SC: FR-03 (next/font), FR-05 (metadataBase+twitter), FR-07 (WebSite JSON-LD), FR-16 (GA4)
import type { Metadata } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import "./globals.css";
import {
  getBaseMetadata,
  generateWebsiteJsonLd,
  generateOrganizationJsonLd,
  serializeJsonLd,
} from "@/lib/seo";
import QueryProvider from "@/components/providers/QueryProvider";
import SessionProvider from "@/components/providers/SessionProvider";
import CookieConsent from "@/components/ui/CookieConsent";
import ConsentGatedAnalytics from "@/components/analytics/ConsentGatedAnalytics";

// Design Ref: §11.1 — Pretendard Variable self-host
// Plan SC: FR-03 — render-blocking CDN link 제거, next/font 전환
const pretendard = localFont({
  src: "../../public/fonts/PretendardVariable.woff2",
  display: "swap",
  weight: "45 920",
  style: "normal",
  variable: "--font-pretendard",
  preload: true,
});

export const metadata: Metadata = getBaseMetadata();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Plan SC: FR-07 — WebSite JSON-LD (SearchAction 포함) 루트에 주입
  const websiteJsonLd = generateWebsiteJsonLd();
  const organizationJsonLd = generateOrganizationJsonLd();

  return (
    <html lang="ko" className={`h-full antialiased ${pretendard.variable}`}>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        {/* Plan SC: FR-07 — WebSite JSON-LD (sitelinks searchbox 자격) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(organizationJsonLd) }}
        />

        <SessionProvider>
          <QueryProvider>
            {children}
            <CookieConsent />
          </QueryProvider>
        </SessionProvider>

        {/* Google AdSense — afterInteractive for performance
            NOTE: 변수명이 GA_ID지만 실제로는 AdSense client ID다 (레거시 네이밍) */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <Script
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_GA_ID}`}
            strategy="afterInteractive"
            crossOrigin="anonymous"
          />
        )}

        {/* Plan SC: FR-16 — Google Analytics 4 (consent gated)
            CookieConsent 수락 후에만 로드됨 (개인정보법 준수) */}
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <ConsentGatedAnalytics
            gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}
          />
        )}
      </body>
    </html>
  );
}
