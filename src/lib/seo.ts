// Design Ref: §9 SEO Strategy — JSON-LD helpers, metadata utils
import type { Metadata } from "next";

const SITE_NAME = "PickShow";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pickshow.kr";
const SITE_DESCRIPTION = "공연 예매처 통합 검색 — 공연정보를 검색하고 예매사이트로 바로 연결";

export function getBaseMetadata(): Metadata {
  return {
    title: {
      default: `${SITE_NAME} — 공연 예매처 통합 검색`,
      template: `%s — ${SITE_NAME}`,
    },
    description: SITE_DESCRIPTION,
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      url: SITE_URL,
      locale: "ko_KR",
      images: [{ url: `${SITE_URL}/og`, width: 1200, height: 630, alt: SITE_NAME }],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export function generateWebsiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function generateEventJsonLd(performance: {
  title: string;
  startDate: Date;
  endDate: Date;
  venue: string;
  venueAddress: string;
  price: string;
  posterUrl: string | null;
  ticketUrls: { name: string; url: string }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: performance.title,
    startDate: performance.startDate.toISOString(),
    endDate: performance.endDate.toISOString(),
    location: {
      "@type": "Place",
      name: performance.venue,
      address: performance.venueAddress,
    },
    image: performance.posterUrl,
    offers: performance.ticketUrls.map((ticket) => ({
      "@type": "Offer",
      url: ticket.url,
      name: ticket.name,
      availability: "https://schema.org/InStock",
    })),
    description: performance.price,
  };
}

export function generatePerformanceMetadata(performance: {
  title: string;
  venue: string;
  startDate: Date;
  endDate: Date;
  posterUrl: string | null;
  id: string;
}): Metadata {
  const dateRange = `${formatDateShort(performance.startDate)} ~ ${formatDateShort(performance.endDate)}`;
  const description = `${performance.title} | ${performance.venue} | ${dateRange} | 예매처 바로가기`;

  return {
    title: `${performance.title} 예매처`,
    description,
    openGraph: {
      title: `${performance.title} 예매처 — ${SITE_NAME}`,
      description,
      images: [
        {
          url: `${SITE_URL}/og/performance/${performance.id}`,
          width: 1200,
          height: 630,
          alt: performance.title,
        },
      ],
      url: `${SITE_URL}/performance/${performance.id}`,
      type: "website",
    },
  };
}

function formatDateShort(date: Date): string {
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}
