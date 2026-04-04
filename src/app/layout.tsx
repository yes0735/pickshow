// Design Ref: §11.1 — Root layout (Pretendard 폰트, AdSense, CookieConsent)
import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { getBaseMetadata } from "@/lib/seo";
import QueryProvider from "@/components/providers/QueryProvider";
import SessionProvider from "@/components/providers/SessionProvider";
import CookieConsent from "@/components/ui/CookieConsent";

export const metadata: Metadata = getBaseMetadata();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <SessionProvider>
          <QueryProvider>
            {children}
            <CookieConsent />
          </QueryProvider>
        </SessionProvider>

        {/* Google AdSense — afterInteractive for performance */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <Script
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_GA_ID}`}
            strategy="afterInteractive"
            crossOrigin="anonymous"
          />
        )}
      </body>
    </html>
  );
}
