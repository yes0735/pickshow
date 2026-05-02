// Design Ref: §5.4 + §3.3 — JSON-LD 구조화 데이터 빌더
// Plan SC: FR-06 (Event Rich Results 0 errors), FR-07 (WebSite JSON-LD), FR-08 (BreadcrumbList)
//
// 모든 빌더는 순수 함수다. 출력은 `<script type="application/ld+json">` 의
// dangerouslySetInnerHTML로 삽입되므로, 사용처에서 escape 처리를 해야 한다.
// `serializeJsonLd()` 헬퍼로 `</script>` 이스케이프를 제공한다.

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pickshow.kr";
const SITE_NAME = "PickShow";

/**
 * XSS 회피: `</script>` 문자열이 JSON 내부에 포함될 수 있으므로 unicode escape.
 */
export function serializeJsonLd(obj: unknown): string {
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}

// ─────────────────────────────────────────────────────────
// WebSite JSON-LD (root layout에 주입)
// ─────────────────────────────────────────────────────────

export function generateWebsiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    alternateName: "픽쇼",
    url: SITE_URL,
    description: "공연 예매처 통합 검색 — 뮤지컬·연극·콘서트·클래식 공연 정보를 한 번에 검색하고 예매 사이트로 바로 이동",
    inLanguage: "ko-KR",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
}

// ─────────────────────────────────────────────────────────
// Event JSON-LD (공연 상세 페이지)
// ─────────────────────────────────────────────────────────

export interface EventJsonLdInput {
  title: string;
  startDate: Date;
  endDate: Date;
  venue: string;
  venueAddress: string;
  minPrice: number | null;
  maxPrice: number | null;
  posterUrl: string | null;
  synopsis: string | null;
  cast: string | null;
  status: string; // "ongoing" | "upcoming" | "completed"
  ticketUrls: { name: string; url: string }[];
  performanceId: string;
  genre: string;
}

/**
 * PickShow status → schema.org eventStatus 매핑.
 * 모든 정상 공연은 EventScheduled. 과거 공연(completed)도 검색 유입 유지를 위해 동일 값.
 */
function mapEventStatus(status: string): string {
  switch (status) {
    case "cancelled":
      return "https://schema.org/EventCancelled";
    case "postponed":
      return "https://schema.org/EventPostponed";
    default:
      return "https://schema.org/EventScheduled";
  }
}

/**
 * 공연장 주소에서 광역 지자체를 추출 (addressRegion).
 * 실패 시 KR만 반환.
 */
function extractAddressRegion(address: string): string | undefined {
  if (!address) return undefined;
  const match = address.match(/^(서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주)/);
  return match?.[1];
}

export function generateEventJsonLd(input: EventJsonLdInput) {
  const region = extractAddressRegion(input.venueAddress);
  const minPrice = input.minPrice ?? 0;

  const description =
    input.synopsis && input.synopsis.trim().length > 0
      ? input.synopsis
      : `${input.title} - ${input.venue}에서 ${formatDateISO(input.startDate)}부터 ${formatDateISO(input.endDate)}까지 열리는 공연. PickShow에서 예매처 정보를 확인하고 바로 예매하세요.`;

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: input.title,
    description,
    image: input.posterUrl ? [input.posterUrl] : undefined,
    startDate: input.startDate.toISOString(),
    endDate: input.endDate.toISOString(),
    eventStatus: mapEventStatus(input.status),
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: input.venue,
      address: {
        "@type": "PostalAddress",
        streetAddress: input.venueAddress || input.venue,
        addressCountry: "KR",
        ...(region ? { addressRegion: region } : {}),
      },
    },
    ...(input.cast && input.cast.trim().length > 0
      ? {
          performer: {
            "@type": "PerformingGroup",
            name: input.cast,
          },
        }
      : {}),
    organizer: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    offers:
      input.ticketUrls.length > 0
        ? input.ticketUrls.map((ticket) => ({
            "@type": "Offer",
            url: ticket.url,
            name: `${ticket.name} 예매`,
            price: minPrice,
            priceCurrency: "KRW",
            availability: "https://schema.org/InStock",
            validFrom: input.startDate.toISOString(),
            category: "primary",
          }))
        : [
            {
              "@type": "Offer",
              url: `${SITE_URL}/genre/${input.genre}/${input.performanceId}`,
              name: "PickShow 예매처 확인",
              price: minPrice,
              priceCurrency: "KRW",
              availability: "https://schema.org/InStock",
              validFrom: input.startDate.toISOString(),
            },
          ],
  };
}

function formatDateISO(date: Date): string {
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

// ─────────────────────────────────────────────────────────
// BreadcrumbList JSON-LD
// ─────────────────────────────────────────────────────────

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function generateBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

// ─────────────────────────────────────────────────────────
// ItemList JSON-LD (랜딩 페이지용 공연 컬렉션)
// ─────────────────────────────────────────────────────────

export interface ItemListJsonLdInput {
  name: string;
  description: string;
  url: string;
  performances: Array<{
    id: string;
    title: string;
    posterUrl: string | null;
    genre: string;
  }>;
}

export function generateItemListJsonLd(input: ItemListJsonLdInput) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: input.name,
    description: input.description,
    url: input.url,
    numberOfItems: input.performances.length,
    itemListElement: input.performances.map((p, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Event",
        "@id": `${SITE_URL}/genre/${p.genre}/${p.id}`,
        name: p.title,
        url: `${SITE_URL}/genre/${p.genre}/${p.id}`,
        ...(p.posterUrl ? { image: p.posterUrl } : {}),
      },
    })),
  };
}

// ─────────────────────────────────────────────────────────
// Place JSON-LD (공연장 랜딩 페이지)
// Gap I6 — venue 페이지 자체의 장소 구조화 데이터
// ─────────────────────────────────────────────────────────

export interface PlaceJsonLdInput {
  venue: string;
  venueAddress: string;
  slug: string;
  performanceCount: number;
}

/**
 * 공연장 페이지의 PerformingArtsTheater JSON-LD.
 * Google Rich Results 중 LocalBusiness/Venue 카테고리 자격 획득.
 */
export function generatePlaceJsonLd(input: PlaceJsonLdInput) {
  const region = extractAddressRegionForPlace(input.venueAddress);
  return {
    "@context": "https://schema.org",
    "@type": "PerformingArtsTheater",
    name: input.venue,
    url: `${SITE_URL}/venue/${input.slug}`,
    description: `${input.venue}에서 열리는 공연 ${input.performanceCount}건의 예매처 정보 — PickShow`,
    ...(input.venueAddress
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: input.venueAddress,
            addressCountry: "KR",
            ...(region ? { addressRegion: region } : {}),
          },
        }
      : {}),
  };
}

function extractAddressRegionForPlace(address: string): string | undefined {
  if (!address) return undefined;
  const match = address.match(
    /^(서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주)/,
  );
  return match?.[1];
}

// ─────────────────────────────────────────────────────────
// Organization JSON-LD (선택 — 루트 레이아웃에 함께 주입 가능)
// ─────────────────────────────────────────────────────────

export function generateOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    alternateName: "픽쇼",
    url: SITE_URL,
    logo: `${SITE_URL}/icon.png`,
    description: "공연 예매처 통합 검색 서비스",
  };
}
