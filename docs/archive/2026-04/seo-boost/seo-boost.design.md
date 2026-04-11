# seo-boost Design Document

> **Summary**: PickShow SEO 보강 — 홈 RSC 전환, Core Web Vitals 확보, Rich Results JSON-LD, 롱테일 랜딩 페이지, 측정 인프라 구축.
>
> **Project**: pickshow
> **Version**: 0.1.0
> **Author**: kyungheelee
> **Date**: 2026-04-12
> **Status**: Draft
> **Planning Doc**: [seo-boost.plan.md](../../01-plan/features/seo-boost.plan.md)

---

## Context Anchor

> Copied from Plan document. Ensures strategic context survives Design→Do handoff.

| Key | Value |
|-----|-------|
| **WHY** | 홈 CSR + Core Web Vitals 붕괴 + metadata/JSON-LD 부족으로 공연 롱테일 검색 유입이 막혀있음 |
| **WHO** | "뮤지컬 예매", "세종문화회관 공연", "{공연명} 티켓" 같은 자연어/롱테일을 Google에 검색하는 예비 관객 |
| **RISK** | Next.js 16 breaking change (AGENTS.md 경고), Prisma 쿼리 폭주(sitemap 분할/ISR 오구성), 기존 Zustand 필터 상태 깨짐(홈 SSR 리팩터링) |
| **SUCCESS** | Lighthouse SEO 100 + Event Rich Results 0 errors + LCP < 2.5s + 4주 후 GSC Impressions ×3 + 색인 공연 ≥ 활성 80% |
| **SCOPE** | Phase A(기초) → Phase B(Rich Results) → Phase C(롱테일+ISR) → Phase D(측정) |

---

## 1. Overview

### 1.1 Design Goals

1. **SEO 크롤러가 초기 HTML에서 의미 있는 공연 데이터를 즉시 인덱싱할 수 있도록 한다** — 홈 SSR로 초기 20건 렌더.
2. **Core Web Vitals(LCP/INP/CLS)를 Google의 "Good" 임계값 이내로 확보한다** — next/image, next/font, SSR로 LCP < 2.5s.
3. **Event rich result 자격을 획득한다** — Google이 요구하는 모든 구조화 데이터 필드를 충족.
4. **롱테일 키워드("뮤지컬 예매", "세종문화회관 공연")에 매칭되는 정적 랜딩 페이지를 자동 생성한다** — `/genre/[slug]`, `/venue/[slug]`.
5. **개선 효과를 정량 측정 가능한 상태로 만든다** — GSC + GA4 연동.
6. **Next.js 16 breaking change 리스크를 최소화하면서 핵심 이점은 선택적으로 취한다** — `revalidate` + `'use cache'` 하이브리드.

### 1.2 Design Principles

- **RSC First, Client Island Only When Needed**: 기본은 Server Component, 인터랙션 필요한 부분만 `'use client'` island로 격리.
- **기존 `features/search` 모듈 최대 재활용**: 신규 `features/landing` 생성 대신 service 확장. YAGNI.
- **검증된 API를 프로덕션 경로에, 실험적 API를 저위험 경로에**: 공연 상세는 `revalidate` (프로덕션 트래픽), 랜딩 페이지는 `'use cache'` (신규 저위험).
- **SEO 로직은 `lib/seo` 내부에 응집**: JSON-LD 빌더와 metadata 헬퍼가 여기저기 흩어지지 않도록 경계 명확화.
- **URL Search Params를 SSR의 단일 진입점으로**: 홈 필터 상태는 URL ↔ Zustand 양방향 동기화, SSR은 URL 기반으로만 작동.

---

## 2. Architecture Options (v1.7.0)

### 2.0 Architecture Comparison

| Criteria | Option A: Minimal | Option B: Clean | Option C: Pragmatic |
|----------|:-:|:-:|:-:|
| **Approach** | 최소 변경, revalidate만, seo.ts 단일 파일 | 'use cache' 전면, features/landing 신규, lib/seo/ 완전 분할 | RSC+Client island, revalidate+'use cache' 혼용, jsonld.ts만 분리 |
| **New Files** | 4 | 12+ | 6 |
| **Modified Files** | 6 | 9 | 7 |
| **Complexity** | Low | High | Medium |
| **Maintainability** | Medium | High | High |
| **Effort** | Low (1-2 세션) | High (4-5 세션) | Medium (2-3 세션) |
| **Risk (NX 16)** | Low | High | Medium |
| **Recommendation** | Quick wins | Long-term scale | **Default choice** |

**Selected**: **Option C — Pragmatic Balance** — **Rationale**:
- Next.js 16 breaking change 리스크를 공연 상세(프로덕션 핫패스)에서는 회피하고, 신규 랜딩 페이지(저위험)에서만 `'use cache'`를 검증하는 점진적 접근.
- `features/landing` 분리는 현재 트래픽/복잡도 대비 YAGNI. 기존 `features/search/service.ts` 확장이 충분.
- JSON-LD 빌더만 `lib/seo/jsonld.ts`로 분리하여 `seo.ts` 비대화 방지.
- 4주 후 효과 측정 후 필요하면 점진적으로 Option B로 리팩터 가능.

### 2.1 Component Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                      Google/Naver Crawler                         │
└────────────────────────────┬─────────────────────────────────────┘
                             │ GET /, /performance/:id, /genre/:slug
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│              Next.js 16 App Router (Vercel Edge Cache)            │
│                                                                   │
│  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────────┐  │
│  │ / (Home)        │  │ /performance/:id │  │ /genre/:slug    │  │
│  │ RSC Shell       │  │ RSC + revalidate │  │ RSC + 'use cache'│ │
│  │ (SSR top 20)    │  │ (on-demand ISR)  │  │ (cacheLife hrs) │  │
│  └────────┬────────┘  └────────┬─────────┘  └────────┬────────┘  │
│           │                    │                     │            │
│           │  hydrate           │  JSON-LD            │            │
│           ▼                    │  (Event+Breadcrumb) │            │
│  ┌─────────────────┐           │                     │            │
│  │ <SearchClient>  │           ▼                     ▼            │
│  │ Client island   │  ┌──────────────────────────────────────┐   │
│  │ (Zustand + RQ)  │  │  lib/seo + lib/seo/jsonld.ts         │   │
│  └─────────────────┘  └──────────────────────────────────────┘   │
│           │                                                       │
│           │ fetchMore()                                           │
│           ▼                                                       │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │       features/search/service.ts (DAL)                      │  │
│  │   searchPerformances │ getPerformanceById                   │  │
│  │   getPerformancesByGenre │ getPerformancesByVenue           │  │
│  │   getAllPerformanceIdsCursor (sitemap)                      │  │
│  └──────────────────────────┬─────────────────────────────────┘  │
│                             │ Prisma                              │
└─────────────────────────────┼──────────────────────────────────────┘
                              ▼
                    ┌─────────────────────┐
                    │  PostgreSQL         │
                    │  (Prisma 7.6.0)     │
                    └─────────────────────┘
```

### 2.2 Data Flow

**홈 페이지 첫 방문 (SEO Crawler)**

```
1. GET / (URL params: ?q&genre&venue&...)
   ↓
2. Next.js RSC: (main)/page.tsx (async Server Component)
   ↓
3. parseSearchParams(searchParams) → initialFilters
   ↓
4. features/search/service.ts → searchPerformances(initialFilters, page=1, limit=20)
   ↓
5. HTML 렌더 + <script type="application/ld+json"> WebSite JSON-LD
   ↓
6. <SearchClient initialData={...} initialFilters={...} />
   ↓
7. 크롤러는 초기 20건 카드를 인덱스. 사용자는 즉시 콘텐츠 확인.
   ↓
8. [클라이언트] hydration: React Query에 initialData 주입, 이후 필터 변경 시 /api/performances 직접 호출
```

**공연 상세 페이지 (ISR)**

```
1. GET /performance/abc123 (첫 요청)
   ↓
2. performance/[id]/page.tsx: async Server Component
   ↓
3. generateMetadata → getPerformanceById → Metadata + JSON-LD
   ↓
4. 본문 렌더 + Event JSON-LD + BreadcrumbList JSON-LD
   ↓
5. HTML 응답 + Cache-Control: s-maxage=3600, stale-while-revalidate
   ↓
6. 두 번째 방문: Vercel Edge Cache hit (ISR 효과)
```

**/genre/musical 랜딩 ('use cache')**

```
1. GET /genre/musical
   ↓
2. genre/[slug]/page.tsx: async RSC + 'use cache' directive + cacheLife('hours')
   ↓
3. getPerformancesByGenre('musical', { limit: 50 }) → cached by slug
   ↓
4. HTML + Event collection JSON-LD + BreadcrumbList JSON-LD
   ↓
5. Vercel Cache Components에 의해 slug 키로 캐시
```

### 2.3 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| `(main)/page.tsx` (RSC) | `features/search/service.ts`, `SearchClient` | 초기 SSR + island hydration |
| `SearchClient` (Client) | `useSearchStore`, `useSearchPerformances`, `PerformanceCard` | 클라이언트 상호작용 |
| `performance/[id]/page.tsx` | `features/search/service.ts`, `lib/seo`, `lib/seo/jsonld.ts` | 공연 상세 렌더 + JSON-LD |
| `genre/[slug]/page.tsx` | `features/search/service.ts` (신규 함수), `lib/seo/jsonld.ts` | 장르 랜딩 |
| `venue/[slug]/page.tsx` | `features/search/service.ts` (신규 함수), `lib/seo/jsonld.ts` | 공연장 랜딩 |
| `lib/seo/jsonld.ts` | `lib/seo.ts` (SITE_URL 상수) | JSON-LD 빌더 |
| `sitemap.ts` | `features/search/service.ts` (cursor 함수) | sitemap 분할 |
| `layout.tsx` | `next/font/local`, `@next/third-parties/google`, `lib/seo/jsonld.ts` | 폰트/GA4/WebSite JSON-LD |

---

## 3. Data Model

### 3.1 기존 Entity 활용

seo-boost는 **새로운 엔티티를 추가하지 않는다**. 기존 `Performance` 모델의 필드를 JSON-LD 구조화 데이터에 매핑한다.

```typescript
// 기존 Prisma schema에서 사용할 필드
interface Performance {
  id: string;
  title: string;
  genre: string;          // → /genre/[slug] 랜딩 매핑 키
  venue: string;          // → /venue/[slug] 랜딩 매핑 키
  venueAddress: string;   // → PostalAddress.streetAddress
  startDate: Date;        // → Event.startDate
  endDate: Date;          // → Event.endDate
  status: string;         // → Event.eventStatus 매핑
  posterUrl: string | null; // → Event.image + next/image
  cast: string | null;    // → Event.performer
  synopsis: string | null; // → Event.description
  minPrice: number | null; // → Offer.price
  maxPrice: number | null; // → Offer (high bound)
  ticketUrls: { name: string; url: string }[]; // → Offer[].url
  updatedAt: Date;        // → sitemap lastModified
}
```

### 3.2 Genre/Venue Slug 매핑

장르/공연장 값을 URL-safe slug로 변환하기 위한 매핑 규칙:

```typescript
// lib/seo/slug.ts (신규 유틸)
const GENRE_SLUG_MAP: Record<string, { slug: string; label: string; description: string }> = {
  "뮤지컬": { slug: "musical", label: "뮤지컬", description: "국내외 뮤지컬 공연 예매처 통합 검색" },
  "연극": { slug: "play", label: "연극", description: "대학로부터 대극장까지 연극 예매처 검색" },
  "클래식": { slug: "classic", label: "클래식", description: "클래식 콘서트 및 오페라 예매처 검색" },
  "콘서트": { slug: "concert", label: "콘서트", description: "K-POP, 내한 콘서트 예매처 검색" },
  "무용": { slug: "dance", label: "무용", description: "발레, 현대무용 공연 예매처 검색" },
  "국악": { slug: "traditional", label: "국악", description: "국악 공연 예매처 검색" },
  "아동": { slug: "kids", label: "아동·가족", description: "아동·가족 공연 예매처 검색" },
  "복합": { slug: "etc", label: "복합·기타", description: "복합 공연 예매처 검색" },
};

function genreToSlug(genre: string): string | null { /* ... */ }
function slugToGenre(slug: string): string | null { /* ... */ }

// 공연장은 동적 변환 (한글 → 영문 transliterate 또는 정규화된 키)
function venueToSlug(venue: string): string {
  // 세종문화회관 → sejong-cultural-center
  // 예술의전당 → seoul-arts-center
  // DB 조회 없이 hash 기반 변환 (venue string → stable slug)
}
```

### 3.3 JSON-LD Schema 매핑

```typescript
// Event JSON-LD 완전판 (lib/seo/jsonld.ts)
{
  "@context": "https://schema.org",
  "@type": "Event",
  name: performance.title,
  description: performance.synopsis || `${performance.title} ${performance.venue} ${dateRange}`,
  image: performance.posterUrl,
  startDate: performance.startDate.toISOString(),
  endDate: performance.endDate.toISOString(),
  eventStatus: mapStatus(performance.status), // "Scheduled" | "Postponed" | "Cancelled"
  eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
  location: {
    "@type": "Place",
    name: performance.venue,
    address: {
      "@type": "PostalAddress",
      streetAddress: performance.venueAddress,
      addressCountry: "KR",
      addressRegion: extractRegion(performance.venueAddress), // "서울", "경기" 등
    }
  },
  performer: performance.cast
    ? { "@type": "PerformingGroup", name: performance.cast }
    : undefined,
  organizer: {
    "@type": "Organization",
    name: "PickShow",
    url: "https://pickshow.kr"
  },
  offers: performance.ticketUrls.map((ticket, idx) => ({
    "@type": "Offer",
    url: ticket.url,
    name: ticket.name,
    price: performance.minPrice ?? 0,
    priceCurrency: "KRW",
    availability: "https://schema.org/InStock",
    validFrom: performance.startDate.toISOString(),
  }))
}
```

---

## 4. API Specification

### 4.1 내부 API (변경 없음)

seo-boost는 **기존 API 엔드포인트를 수정하지 않는다**. 다만 `SearchClient` (Client island)는 기존 `/api/performances`를 그대로 사용한다.

### 4.2 신규 Server-side Data Access (API가 아닌 서버 함수)

`features/search/service.ts`에 다음 함수를 추가한다:

```typescript
// 기존 (유지)
export async function searchPerformances(filters, page, limit): Promise<{ data, pagination }>
export async function getPerformanceById(id): Promise<Performance | null>

// 신규
export async function getPerformancesByGenre(
  genre: string,
  opts: { limit?: number; status?: string[] }
): Promise<Performance[]>

export async function getPerformancesByVenue(
  venue: string,
  opts: { limit?: number; status?: string[] }
): Promise<Performance[]>

export async function getAllActiveGenres(): Promise<string[]>

export async function getAllActiveVenues(): Promise<string[]>

// sitemap용 cursor pagination
export async function getPerformanceIdsForSitemap(
  opts: { after?: string; limit: number }
): Promise<Array<{ id: string; updatedAt: Date }>>
```

**Cursor 기반 페이지네이션 근거**: `sitemap.ts`가 `generateSitemaps()`로 분할될 때, `OFFSET`은 대량 데이터에서 비싸므로 `WHERE id > {cursor} ORDER BY id LIMIT 50000` 패턴 사용. Prisma `cursor` 옵션 활용.

### 4.3 robots.ts & sitemap.ts 출력 계약

```typescript
// robots.ts 출력
{
  rules: [{
    userAgent: "*",
    allow: "/",
    disallow: ["/api/", "/my/", "/login", "/register", "/api-docs", "/og"],
  }],
  sitemap: "https://pickshow.kr/sitemap.xml",
}

// sitemap.ts 출력 (generateSitemaps 분할)
// - /sitemap.xml → sitemap index (자동 생성)
// - /sitemap/0.xml → 정적 페이지 + 장르/공연장 랜딩
// - /sitemap/1.xml → 공연 50,000개
// - /sitemap/2.xml → 공연 50,001 ~ 100,000
// - ...
```

---

## 5. UI/UX Design

### 5.1 Screen Layout (변경된 페이지만)

**홈 `/` (RSC + Client island)**

```
┌─────────────────────────────────────────────────────────────┐
│  Header (기존 유지)                                          │
├─────────────────────────────────────────────────────────────┤
│  [RSC 영역] <h1>공연 예매처 통합 검색</h1>                    │
│  [RSC 영역] <p>디스크립션 텍스트 (SEO용)</p>                 │
│ ┌─────────────────┬─────────────────────────────────────┐  │
│ │ [Client]        │ [RSC 렌더] 초기 공연 카드 20건       │  │
│ │ FilterSidebar   │ (SSR HTML, 크롤러 즉시 인덱스)       │  │
│ │ (Zustand)       │                                      │  │
│ │                 │ [Client island] <SearchClient>       │  │
│ │                 │ - 필터 변경 시 /api/performances     │  │
│ │                 │ - 무한스크롤                         │  │
│ │                 │ - 뷰 전환 (카드/리스트)              │  │
│ └─────────────────┴─────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**/genre/musical (신규 랜딩)**

```
┌─────────────────────────────────────────────────────────────┐
│  Header                                                      │
├─────────────────────────────────────────────────────────────┤
│  Breadcrumb: 홈 > 장르 > 뮤지컬                              │
│  <h1>뮤지컬 예매처 통합 검색</h1>                            │
│  <p>국내외 뮤지컬 공연 예매처 통합 검색. [200자+ 설명]</p>  │
├─────────────────────────────────────────────────────────────┤
│  <h2>현재 공연 중인 뮤지컬</h2>                              │
│  [공연 카드 그리드 50개]                                     │
├─────────────────────────────────────────────────────────────┤
│  <h2>관련 공연장</h2>                                        │
│  [공연장 칩 리스트: 예술의전당, 세종문화회관, ...]            │
└─────────────────────────────────────────────────────────────┘
```

**/performance/:id (기존 수정)**

```
┌─────────────────────────────────────────────────────────────┐
│  Header                                                      │
├─────────────────────────────────────────────────────────────┤
│  [RSC] Breadcrumb JSON-LD: 홈 > 장르 > 뮤지컬 > {제목}      │
│  [RSC] Event JSON-LD (보강 필드)                             │
│                                                              │
│  <h1>{제목}</h1>                                             │
│  [next/image with priority] 포스터                           │
│  (기존 메타데이터 그리드 유지)                               │
│  TicketLinkList                                              │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 User Flow

```
[크롤러 흐름]
Google Bot → / (초기 20건 인덱스)
         → /sitemap.xml → /sitemap/1.xml (공연 ID 리스트 크롤)
         → /performance/abc123 (Event rich result 인덱스)
         → /genre/musical (롱테일 키워드 색인)
         → /venue/sejong-cultural-center (롱테일 키워드 색인)

[사용자 흐름]
Google 검색: "뮤지컬 예매"
  → /genre/musical (랭킹된 랜딩 페이지)
  → 공연 카드 클릭 → /performance/:id
  → 예매처 클릭 → 외부 예매 사이트

Google 검색: "햄릿 뮤지컬 예매"
  → /performance/:id (Event rich result 카드)
  → 예매처 클릭
```

### 5.3 Component List

| Component | Location | Layer | Responsibility |
|-----------|----------|-------|----------------|
| `SearchClient` | `src/components/performance/SearchClient.tsx` | Presentation (Client) | 홈 필터/무한스크롤 island |
| `SearchPageShell` (inline in page.tsx) | `src/app/(main)/page.tsx` | Presentation (RSC) | SSR 초기 데이터 fetch + island 래핑 |
| `GenreLandingPage` | `src/app/(main)/genre/[slug]/page.tsx` | Presentation (RSC) | 장르 랜딩 렌더 |
| `VenueLandingPage` | `src/app/(main)/venue/[slug]/page.tsx` | Presentation (RSC) | 공연장 랜딩 렌더 |
| `generateEventJsonLd` | `src/lib/seo/jsonld.ts` | Infrastructure | Event 구조화 데이터 빌더 |
| `generateBreadcrumbJsonLd` | `src/lib/seo/jsonld.ts` | Infrastructure | BreadcrumbList 빌더 |
| `generateWebsiteJsonLd` | `src/lib/seo/jsonld.ts` | Infrastructure | WebSite + SearchAction 빌더 |
| `generateItemListJsonLd` | `src/lib/seo/jsonld.ts` | Infrastructure | 랜딩 페이지 공연 컬렉션 ItemList |
| `getBaseMetadata` / `generatePerformanceMetadata` / `generateGenreMetadata` / `generateVenueMetadata` | `src/lib/seo.ts` | Infrastructure | Next.js Metadata 빌더 |

### 5.4 Page UI Checklist

#### 홈 `/` (RSC + Client island)

**Server-rendered (크롤러가 봐야 할 것)**
- [ ] `<h1>`: "공연 예매처 통합 검색" (정확한 텍스트)
- [ ] `<p>`: 200자 이상의 설명 텍스트 (SEO 본문)
- [ ] `<script type="application/ld+json">`: WebSite JSON-LD
- [ ] 초기 공연 카드: 최소 20개, 각 카드에 title/venue/dateRange/posterUrl 포함
- [ ] 각 공연 카드 링크: `/performance/:id` 절대 경로
- [ ] `<a>` 태그: `/genre/musical`, `/venue/*` 랜딩 페이지로 internal link 최소 5개

**Client island (`SearchClient`)**
- [ ] 필터 사이드바 (데스크톱) / 바텀시트 (모바일)
- [ ] 장르 필터 chip
- [ ] 검색어 input
- [ ] 정렬 select (최신순/가격순)
- [ ] 뷰 토글 (카드/리스트)
- [ ] 무한스크롤 트리거
- [ ] URL search params ↔ Zustand 양방향 동기화

#### 공연 상세 `/performance/:id`

- [ ] `<h1>`: 공연 제목
- [ ] `next/image`: 포스터 (priority, sizes="(max-width: 768px) 100vw, 400px")
- [ ] `<script>`: Event JSON-LD (필수 필드 전부: eventStatus, eventAttendanceMode, organizer, PostalAddress, priceCurrency)
- [ ] `<script>`: BreadcrumbList JSON-LD
- [ ] Breadcrumb 렌더: "홈 > 장르 > {장르명} > {제목}"
- [ ] 메타데이터 그리드: 장르, 공연상태, 공연기간, 공연장소, 관람연령, 러닝타임, 가격
- [ ] TicketLinkList: 예매처 버튼 (외부 링크)
- [ ] `alternates.canonical`: `https://pickshow.kr/performance/{id}`

#### 장르 랜딩 `/genre/[slug]`

- [ ] `<h1>`: "{장르} 예매처 통합 검색"
- [ ] `<p>`: 장르 설명 200자+ (SEO 본문)
- [ ] `<script>`: BreadcrumbList JSON-LD ("홈 > 장르 > {label}")
- [ ] `<script>`: ItemList JSON-LD (공연 컬렉션)
- [ ] 공연 카드 그리드: 최소 30건 (있으면 50건)
- [ ] `<h2>`: "현재 공연 중인 {장르}"
- [ ] 관련 공연장 섹션 (`<h2>` + 공연장 chip 링크)
- [ ] `alternates.canonical`: `https://pickshow.kr/genre/{slug}`

#### 공연장 랜딩 `/venue/[slug]`

- [ ] `<h1>`: "{공연장명} 공연 예매처"
- [ ] `<p>`: 공연장 설명 200자+
- [ ] `<script>`: BreadcrumbList + ItemList JSON-LD
- [ ] 공연 카드 그리드
- [ ] 주소 정보 (PostalAddress)
- [ ] `alternates.canonical`: `https://pickshow.kr/venue/{slug}`

---

## 6. Error Handling

### 6.1 Error Scenarios

| Code | Scenario | Handling |
|------|----------|----------|
| 404 | `/performance/:id` 존재하지 않는 ID | `notFound()` → 기본 404 페이지, robots noindex |
| 404 | `/genre/:slug` 정의되지 않은 장르 | `notFound()` — `GENRE_SLUG_MAP`에 없는 slug |
| 404 | `/venue/:slug` DB에 없는 공연장 | `notFound()` |
| DB Error | sitemap.ts Prisma 연결 실패 | catch + 정적 페이지만 반환 (기존 패턴 유지) |
| Font Error | next/font/local 파일 누락 | 빌드 실패로 조기 발견 |
| GA4 Error | Measurement ID 미설정 | `NEXT_PUBLIC_GA_MEASUREMENT_ID` falsy 체크 후 스크립트 skip |
| Image Error | next/image 포스터 URL 불가 | fallback placeholder + `unoptimized` flag 고려 |

### 6.2 SEO 특화 Error Handling

- **데이터 없는 랜딩 페이지**: `/genre/[slug]`가 활성 공연 0건일 때 → `robots: { index: false, follow: true }` 설정하여 thin content 분류 회피. 하지만 sitemap에는 포함하지 않음.
- **공연 종료 (status = "공연종료")**: Event JSON-LD에서 `eventStatus: "https://schema.org/EventScheduled"` → noindex 대신 `eventStatus` 값만 변경하고 인덱스는 유지 (과거 공연 검색 유입 활용).
- **Breadcrumb 슬러그 매핑 실패**: genre가 `GENRE_SLUG_MAP`에 없는 legacy 값이면 breadcrumb에서 해당 단계 skip, 장르 섹션 없이 렌더.

---

## 7. Security Considerations

- [ ] **XSS in JSON-LD**: `dangerouslySetInnerHTML`로 JSON.stringify 결과 삽입 시, `</script>` 포함 가능성 → `JSON.stringify(obj).replace(/</g, '\\u003c')` 처리.
- [ ] **robots.ts에서 민감 경로 누락 방지**: `/api/`, `/my/`, `/login`, `/register`, `/api-docs`, `/og` disallow.
- [ ] **GA4 Consent Compliance**: `CookieConsent` 수락 전에는 GA4 스크립트 로드 금지. `@next/third-parties/google`의 `<GoogleAnalytics>` 컴포넌트를 consent state 기반 조건부 렌더.
- [ ] **Canonical Injection**: 사용자 입력이 canonical에 직접 반영되지 않도록. `NEXT_PUBLIC_SITE_URL` 상수 사용.
- [ ] **Open Graph Image CSRF**: `/og` 엔드포인트가 쿼리 파라미터로 텍스트 입력받으면 XSS 위험 → 기존 `/og/performance/[id]` 구조 유지 (id 기반만).
- [ ] **Next.js 16 `proxy.ts`**: 기존 `src/proxy.ts` (NextAuth 미들웨어) 와 충돌하지 않도록 seo-boost는 proxy 수정 불필요.

---

## 8. Test Plan (v2.3.0)

> **CRITICAL**: Define WHAT to test here. Test CODE is written during Do phase alongside implementation.

### 8.1 Test Scope

| Type | Target | Tool | Phase |
|------|--------|------|-------|
| Static | Metadata/JSON-LD 구조 | Vitest + JSON schema 검증 | Do |
| L1: API | 신규 서버 함수 | Vitest + Prisma test DB | Do |
| L2: UI | RSC HTML 출력 검증 | Playwright (curl 기반 HTML 파싱) | Do |
| L3: E2E | SEO end-to-end (sitemap → 크롤 → Rich Results) | Playwright + 외부 검증 | Do + Manual |
| Perf | Lighthouse 자동화 | `@lhci/cli` 또는 `unlighthouse` | Check |

### 8.2 L1: Static/Unit Test Scenarios

| # | Target | Test Description | Expected |
|---|--------|-----------------|----------|
| 1 | `getBaseMetadata()` | `metadataBase`, `twitter`, `alternates` 존재 | 필드 포함 |
| 2 | `generateEventJsonLd()` | 모든 필수 필드 존재 | eventStatus, eventAttendanceMode, organizer, PostalAddress, priceCurrency 포함 |
| 3 | `generateBreadcrumbJsonLd()` | itemListElement 배열 구조 | 최소 3단계 포함 |
| 4 | `generateWebsiteJsonLd()` | SearchAction 포함 | potentialAction.target.urlTemplate 존재 |
| 5 | `generateItemListJsonLd()` | 공연 컬렉션 itemListElement | position 1부터 시작 |
| 6 | `getPerformancesByGenre('musical')` | 활성 공연만 반환 | status != "공연종료" 필터 |
| 7 | `getPerformanceIdsForSitemap({ limit: 50000 })` | cursor 기반 페이지네이션 | WHERE id > cursor |
| 8 | `genreToSlug("뮤지컬")` | "musical" 반환 | |
| 9 | `slugToGenre("musical")` | "뮤지컬" 반환 | |
| 10 | `venueToSlug("세종문화회관")` | stable slug (idempotent) | 동일 입력 → 동일 출력 |

### 8.3 L2: UI Action / HTML Output Test Scenarios

| # | Page | Action | Expected Result | Data Verification |
|---|------|--------|----------------|-------------------|
| 1 | `/` | `curl -s /` | `<h1>` 존재, 공연 카드 HTML 최소 20개 | `grep -c "performance-card"` >= 20 |
| 2 | `/` | curl HTML | `<script type="application/ld+json">` WebSite 주입 | JSON.parse 성공 |
| 3 | `/` + filter | 클라이언트 필터 변경 | URL 업데이트 + 결과 fetch | network: `/api/performances` 호출 |
| 4 | `/performance/:id` | curl HTML | Event JSON-LD 전체 필드 포함 | Rich Results Test 통과 (수동) |
| 5 | `/performance/:id` | curl HTML | `next/image` 태그 (`srcset` 포함) | `<img srcset=".*_next/image"` 매치 |
| 6 | `/performance/:id` | curl HTML | BreadcrumbList JSON-LD 포함 | itemListElement 3개 이상 |
| 7 | `/genre/musical` | curl HTML | `<h1>뮤지컬`, `<p>` 200자+, 공연 카드 | 유효 HTML |
| 8 | `/genre/musical` | Cache-Control 헤더 | ISR 캐시 히트 | 2번째 요청 빠름 |
| 9 | `/venue/sejong-cultural-center` | curl HTML | `<h1>`, 공연 카드, PostalAddress | 정상 |
| 10 | `/robots.txt` | curl | `/api-docs` disallow 포함 | grep match |
| 11 | `/sitemap.xml` | curl | sitemap index (sitemapindex 태그) | XML parse 성공 |
| 12 | `/sitemap/1.xml` | curl | 공연 URL 다수 포함 | 50 개 이상 URL |
| 13 | `/` | LCP 측정 | < 2.5s | Lighthouse |
| 14 | `/performance/:id` | Lighthouse SEO | score = 100 | Lighthouse CI |

### 8.4 L3: E2E Scenario Test Scenarios

| # | Scenario | Steps | Success Criteria |
|---|----------|-------|-----------------|
| 1 | Guest SEO crawl | 홈 GET → sitemap.xml GET → /sitemap/1.xml GET → 첫 공연 GET → /genre/musical GET | 모든 응답 200, 각 페이지 구조화 데이터 포함 |
| 2 | Home SSR + Client hydration | 홈 GET(SSR) → JS 로드 → 필터 적용 → 결과 변경 | SSR HTML에 카드 포함 + 필터 후 fetch 작동 |
| 3 | ISR 캐시 확인 | /performance/:id 첫 GET (MISS) → 두 번째 GET (HIT) | 두 번째 응답 Cache-Control + 빠름 |
| 4 | Rich Results 수동 검증 | 배포 URL을 https://search.google.com/test/rich-results 에 제출 | Event rich result 인식, 0 errors |
| 5 | Core Web Vitals | Lighthouse 홈/상세/장르 3개 페이지 | SEO=100, Performance=90+, LCP<2.5s |
| 6 | GSC 제출 | sitemap.xml을 GSC에 제출 → 상태 확인 | "성공" + 검색된 URL > 0 |
| 7 | GA4 연동 | 홈 방문 → GA4 Realtime 확인 | 트래픽 1명 집계 |

### 8.5 Seed Data Requirements

| Entity | Minimum Count | Key Fields Required |
|--------|:------------:|---------------------|
| Performance | 100 | title, genre (뮤지컬 30+), venue (5개 이상 분산), venueAddress, startDate, endDate, posterUrl, ticketUrls (최소 1개) |
| Performance (종료) | 20 | status = "공연종료" (과거 인덱스 테스트용) |
| Performance (뮤지컬) | 30 | genre = "뮤지컬" (장르 랜딩 데이터) |

---

## 9. Clean Architecture

### 9.1 Layer Structure

| Layer | Responsibility | Location |
|-------|---------------|----------|
| **Presentation** | RSC 페이지, Client island, 컴포넌트 | `src/app/(main)/`, `src/components/performance/` |
| **Application** | 검색 hooks, Zustand store | `src/features/search/hooks/`, `src/features/search/store/` |
| **Domain** | Performance type, SEO 빌더 로직 | `src/types/`, `src/lib/seo/` |
| **Infrastructure** | Prisma, next/font, next/image, @next/third-parties | `src/lib/prisma.ts`, `src/features/search/service.ts` |

### 9.2 Dependency Rules

```
(main)/page.tsx (Presentation RSC)
  → features/search/service.ts (Application/Infra)
  → lib/seo/jsonld.ts (Domain helpers)

SearchClient.tsx (Presentation Client)
  → features/search/hooks.ts (Application)
  → features/search/store.ts (Application)
  → components/performance/PerformanceCard.tsx (Presentation)

lib/seo.ts
  → lib/seo/jsonld.ts (내부 helper)
  ← app/layout.tsx (consumer)
  ← app/(main)/performance/[id]/page.tsx (consumer)
```

### 9.3 File Import Rules

| From | Can Import | Cannot Import |
|------|-----------|---------------|
| `(main)/page.tsx` (RSC) | `features/search/service`, `lib/seo`, `components/` | Zustand store 직접 (hydration mismatch 위험) |
| `SearchClient.tsx` (Client) | `features/search/hooks`, `features/search/store` | `lib/prisma` 직접 |
| `lib/seo/jsonld.ts` | `lib/seo.ts` (상수만) | 외부 라이브러리 (pure function) |
| `features/search/service.ts` | `lib/prisma` | `components/`, `app/` |

### 9.4 This Feature's Layer Assignment

| Component | Layer | Location |
|-----------|-------|----------|
| `(main)/page.tsx` (RSC) | Presentation | `src/app/(main)/page.tsx` |
| `SearchClient.tsx` | Presentation (Client) | `src/components/performance/SearchClient.tsx` |
| `performance/[id]/page.tsx` | Presentation | `src/app/(main)/performance/[id]/page.tsx` |
| `genre/[slug]/page.tsx` | Presentation | `src/app/(main)/genre/[slug]/page.tsx` |
| `venue/[slug]/page.tsx` | Presentation | `src/app/(main)/venue/[slug]/page.tsx` |
| `features/search/service.ts` | Application | 기존 파일 확장 |
| `lib/seo.ts` | Domain | 기존 파일 확장 |
| `lib/seo/jsonld.ts` | Domain | 신규 |
| `lib/seo/slug.ts` | Domain | 신규 |

---

## 10. Coding Convention Reference

### 10.1 Existing Conventions (from pickshow.design.md)

- Next.js 16 App Router (`AGENTS.md` 경고 준수)
- `"use client"` 최소화
- `await cookies()`, `await headers()`, `await params`
- Design Ref 주석: `// Design Ref: §{section} — {description}`
- Plan SC 주석: `// Plan SC: {criterion}`
- `proxy.ts` (middleware.ts 대신) — 기존 파일 수정 없음
- Tailwind (기존 디자인 시스템)

### 10.2 seo-boost 특화 컨벤션

| Item | Convention |
|------|-----------|
| JSON-LD injection | `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(obj).replace(/</g, '\\u003c') }} />` |
| Metadata export | `export const metadata` (static) 또는 `export async function generateMetadata()` (dynamic) |
| RSC data fetch | `await service()` 직접 호출, React Query는 Client island 내부에서만 |
| Canonical | `alternates: { canonical: \`${SITE_URL}/\${path}\` }` 절대 URL |
| Slug constants | `lib/seo/slug.ts`의 `GENRE_SLUG_MAP`을 single source of truth |
| Environment variables | `NEXT_PUBLIC_*` prefix (기존 규칙 유지) |

### 10.3 Environment Variables Needed

| Variable | Purpose | Scope |
|----------|---------|-------|
| `NEXT_PUBLIC_SITE_URL` | Canonical/metadataBase 기반 (이미 존재) | Client |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics 4 측정 ID | Client |
| `NEXT_PUBLIC_GSC_VERIFICATION` | GSC HTML 메타 verification (선택, DNS 권장) | Client |
| `NEXT_PUBLIC_ADSENSE_CLIENT_ID` | 기존 `NEXT_PUBLIC_GA_ID` 리네임 (이름 혼동 방지, 선택적) | Client |

---

## 11. Implementation Guide

### 11.1 File Structure

```
src/
├── app/
│   ├── layout.tsx                         [수정] next/font, WebSite JSON-LD, GA4
│   ├── sitemap.ts                         [수정] generateSitemaps 분할
│   ├── robots.ts                          [수정] /api-docs, /og disallow
│   └── (main)/
│       ├── page.tsx                       [수정] "use client" 제거, RSC shell
│       ├── performance/[id]/
│       │   └── page.tsx                   [수정] next/image, revalidate, Breadcrumb JSON-LD
│       ├── genre/
│       │   └── [slug]/
│       │       └── page.tsx               [신규] RSC + 'use cache'
│       └── venue/
│           └── [slug]/
│               └── page.tsx               [신규] RSC + 'use cache'
├── components/
│   └── performance/
│       └── SearchClient.tsx               [신규] 홈 Client island
├── features/search/
│   └── service.ts                         [수정] 신규 함수 5개 추가
├── lib/
│   ├── seo.ts                             [수정] metadataBase/twitter/canonical helpers
│   └── seo/                               [신규 디렉토리]
│       ├── jsonld.ts                      [신규] Event/WebSite/Breadcrumb/ItemList 빌더
│       └── slug.ts                        [신규] GENRE_SLUG_MAP + venueToSlug
├── public/
│   └── fonts/                             [신규] Pretendard woff2 subset
└── .env.example                           [수정] GA4 변수 추가
```

### 11.2 Implementation Order

**Phase A — Foundation (세션 1)**
1. [ ] `lib/seo.ts`에 `metadataBase`, `twitter`, canonical helpers 추가
2. [ ] `lib/seo/jsonld.ts` 생성 (Event 보강, WebSite, Breadcrumb, ItemList)
3. [ ] `lib/seo/slug.ts` 생성 (GENRE_SLUG_MAP, slug ↔ genre, venueToSlug)
4. [ ] `public/fonts/Pretendard-subset.woff2` 다운로드
5. [ ] `app/layout.tsx`: `next/font/local`, WebSite JSON-LD 주입
6. [ ] `robots.ts`: `/api-docs`, `/og` disallow 추가
7. [ ] Unit tests: seo/jsonld.ts, seo/slug.ts

**Phase B — 홈 SSR 전환 (세션 2)**
1. [ ] `components/performance/SearchClient.tsx` 신규 생성 (기존 `(main)/page.tsx` 로직 이전)
2. [ ] `(main)/page.tsx`: `"use client"` 제거, RSC shell로 재작성
3. [ ] URL search params → 초기 fetch 파라미터 파싱 로직
4. [ ] `searchPerformances(initialFilters, page=1, limit=20)` 서버 호출
5. [ ] `<SearchClient initialData={...} initialFilters={...}>` 렌더
6. [ ] 홈 metadata에 `alternates.canonical` 추가
7. [ ] `<h1>`, `<p>` 설명 텍스트 삽입 (서버 렌더)
8. [ ] Playwright test: curl로 홈 HTML 검증 (카드 20개, h1, JSON-LD)

**Phase C — 공연 상세 강화 (세션 2 후반)**
1. [ ] `performance/[id]/page.tsx`: `<img>` → `next/image` (priority)
2. [ ] `next.config.ts`: `images.remotePatterns` 에 공연 포스터 도메인 화이트리스트
3. [ ] Event JSON-LD 보강 (`generateEventJsonLd` 호출부 + 빌더 업그레이드)
4. [ ] BreadcrumbList JSON-LD 추가
5. [ ] `export const revalidate = 3600` 설정
6. [ ] `alternates.canonical` 추가
7. [ ] Playwright: Event JSON-LD 필드 파싱 검증

**Phase D — 롱테일 랜딩 페이지 (세션 3)**
1. [ ] `features/search/service.ts`: `getPerformancesByGenre`, `getPerformancesByVenue`, `getAllActiveGenres`, `getAllActiveVenues` 추가
2. [ ] `app/(main)/genre/[slug]/page.tsx` 신규 (`'use cache'` + `cacheLife('hours')`)
3. [ ] `app/(main)/venue/[slug]/page.tsx` 신규
4. [ ] `generateStaticParams`로 정의된 장르 전부 사전 생성
5. [ ] ItemList JSON-LD + BreadcrumbList JSON-LD
6. [ ] `sitemap.ts`: `generateSitemaps()` 분할, `getPerformanceIdsForSitemap` cursor 사용
7. [ ] sitemap에 `/genre/*`, `/venue/*` 포함
8. [ ] Playwright: 랜딩 페이지 HTML 검증 + sitemap 파싱

**Phase E — 측정 인프라 (세션 4)**
1. [ ] `npm install @next/third-parties`
2. [ ] `.env.example`에 `NEXT_PUBLIC_GA_MEASUREMENT_ID` 추가
3. [ ] `app/layout.tsx`: `<GoogleAnalytics gaId={...} />` 조건부 렌더 (consent 기반)
4. [ ] `CookieConsent` 컴포넌트에 GA4 gating 로직 추가
5. [ ] `.env.local`에 실제 GA4 ID 주입 (로컬 테스트)
6. [ ] Vercel 환경변수 설정
7. [ ] 배포 후 GSC 사이트 소유권 인증 (DNS TXT 권장)
8. [ ] sitemap.xml GSC 제출
9. [ ] GA4 Real-Time 확인

**Phase F — 검증 (Check phase)**
1. [ ] `next build` 경고 0개 확인 (metadataBase 경고 해소)
2. [ ] Lighthouse (홈/상세/장르) SEO = 100
3. [ ] Rich Results Test (수동, 배포 URL)
4. [ ] GSC sitemap 상태 "성공" 확인

### 11.3 Session Guide

> Auto-generated. Use `/pdca do seo-boost --scope phase-a` 로 세션별 구현.

#### Module Map

| Module | Scope Key | Description | Estimated Turns |
|--------|-----------|-------------|:---------------:|
| Phase A — Foundation | `phase-a` | lib/seo.ts 보강, lib/seo/jsonld.ts & slug.ts 생성, next/font, robots, layout JSON-LD | 25-35 |
| Phase B — Home SSR | `phase-b` | SearchClient 분리, page.tsx RSC 전환, canonical + h1, hydration 검증 | 35-45 |
| Phase C — Performance Detail | `phase-c` | next/image, Event JSON-LD 보강, Breadcrumb, revalidate | 20-30 |
| Phase D — Landing + Sitemap | `phase-d` | /genre/[slug], /venue/[slug], generateSitemaps, service 확장 | 35-45 |
| Phase E — Measurement | `phase-e` | @next/third-parties, GA4, CookieConsent 연동, 환경변수 | 15-25 |
| Phase F — Verify | `phase-f` | Lighthouse, Rich Results, GSC 제출, 최종 빌드 확인 | 15-25 |

#### Recommended Session Plan

| Session | Phase | Scope | Turns |
|---------|-------|-------|:-----:|
| Session 1 | Plan + Design | 전체 (이미 완료) | 25 |
| Session 2 | Do | `--scope phase-a` | 30 |
| Session 3 | Do | `--scope phase-b` | 40 |
| Session 4 | Do | `--scope phase-c,phase-d` | 55 |
| Session 5 | Do | `--scope phase-e` | 20 |
| Session 6 | Check + Report | `--scope phase-f` + analyze + report | 35 |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-12 | Initial draft — Option C (Pragmatic Balance) 채택 | kyungheelee |
