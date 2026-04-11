# seo-boost Planning Document

> **Summary**: PickShow의 SEO 랭킹 신호를 전면 보강하여 공연 롱테일 키워드 유입을 극대화한다.
>
> **Project**: pickshow
> **Version**: 0.1.0
> **Author**: kyungheelee
> **Date**: 2026-04-12
> **Status**: Draft

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | 홈페이지 전체가 Client Component라 크롤러가 빈 페이지를 수신하고, raw `<img>`/CDN 폰트로 Core Web Vitals가 붕괴, canonical/metadataBase/Twitter/풍부한 Event JSON-LD 등 기본 metadata가 누락되어 공연 검색 유입이 잠재력의 10%도 실현되지 못하고 있다. |
| **Solution** | (1) 홈 RSC + Client island 분리로 SSR 활성화 (2) next/image·next/font로 Core Web Vitals 확보 (3) metadata 기초(metadataBase·canonical·Twitter) 보강 (4) Event/WebSite/BreadcrumbList JSON-LD 강화 (5) `/genre/[slug]` + `/venue/[slug]` 랜딩 페이지로 롱테일 키워드 포획 (6) 공연 상세 on-demand ISR (7) GSC/GA4 연동으로 측정 인프라 구축. |
| **Function/UX Effect** | 크롤러는 홈에서 초기 공연 20건을 즉시 인덱스하고, 공연 상세 페이지는 2~4주 내 Event rich result 자격 획득. 사용자는 LCP 2.5s 이하의 빠른 로딩 + Google SERP에서 공연 카드/브레드크럼/별점 노출로 클릭 유도. |
| **Core Value** | "공연 이름만 검색해도 예매처 통합 검색인 PickShow가 최상단에 뜬다" — 직접 트래픽이 아닌 검색 발견(discoverability)을 통한 사용자 획득 채널 확립. |

---

## Context Anchor

> Propagated to Design/Do documents for context continuity.

| Key | Value |
|-----|-------|
| **WHY** | 홈 CSR + Core Web Vitals 붕괴 + metadata/JSON-LD 부족으로 공연 롱테일 검색 유입이 막혀있음 |
| **WHO** | "뮤지컬 예매", "세종문화회관 공연", "{공연명} 티켓" 같은 자연어/롱테일을 Google에 검색하는 예비 관객 |
| **RISK** | Next.js 16 breaking change (AGENTS.md 경고), Prisma 쿼리 폭주(sitemap 분할/ISR 오구성), 기존 Zustand 필터 상태 깨짐(홈 SSR 리팩터링) |
| **SUCCESS** | Lighthouse SEO 100 + Event Rich Results 0 errors + LCP < 2.5s + 4주 후 GSC Total Impressions 기준선 대비 3배 + 색인된 공연 페이지 수 ≥ 전체 활성 공연 80% |
| **SCOPE** | Phase A(Critical 기초): 홈 SSR + next/image + next/font + metadataBase + canonical → Phase B(Rich Results): Event/WebSite/Breadcrumb JSON-LD + Twitter + robots → Phase C(롱테일): /genre·/venue 랜딩 + 공연 ISR + sitemap 분할 → Phase D(측정): GSC + GA4 연동 |

---

## 1. Overview

### 1.1 Purpose

검색 엔진을 통한 공연 롱테일 유입을 극대화한다. 특정 공연명, 장르, 공연장 키워드로 Google 검색 시 PickShow가 상위 노출되어 예매처 통합 검색 사용자를 획득하는 것이 목표다.

### 1.2 Background

PickShow는 공연 예매처 통합 검색 서비스로, 트래픽의 대부분이 검색을 통한 발견(discoverability)에 의존한다. 그러나 현재 코드베이스를 분석한 결과 다음과 같은 치명적 SEO 구멍이 확인되었다:

- `src/app/(main)/page.tsx:2` 전체가 `"use client"`로 선언되어, 홈페이지의 초기 HTML에 공연 카드가 **0개** 렌더된다. 크롤러는 빈 페이지를 인덱스한다.
- `src/app/(main)/performance/[id]/page.tsx:65` 포스터 이미지가 raw `<img>`로 LCP를 저해한다.
- `src/app/layout.tsx`가 Pretendard를 외부 CDN `<link>`로 로드하여 render-blocking이 발생한다.
- `src/lib/seo.ts`에 `metadataBase`, `canonical`, `twitter` 필드가 없고, Event JSON-LD는 `eventStatus`, `priceCurrency`, `eventAttendanceMode`, `organizer`, `PostalAddress` 등 Google이 요구하는 rich result 필드가 누락되어 있다.
- `generateWebsiteJsonLd()` 함수는 작성되어 있으나 어떤 페이지에서도 렌더되지 않고 있다.
- `src/app/sitemap.ts:24`가 `take: 1000`으로 하드코딩되어 공연 수 증가 시 누락된다.
- 장르/공연장 기반의 롱테일 랜딩 페이지가 전혀 없다.

이러한 문제를 종합 해결하여 SEO 건강도를 제로 기반에서 한 번에 건전 수준으로 끌어올린다.

### 1.3 Related Documents

- 기존 Plan: `docs/01-plan/features/pickshow.plan.md` (전체 서비스 Plan)
- 기존 Design: `docs/02-design/features/pickshow.design.md` (§9 SEO Strategy)
- 현재 SEO 유틸: `src/lib/seo.ts`
- 현재 sitemap: `src/app/sitemap.ts`
- 현재 robots: `src/app/robots.ts`
- Next.js 16 경고: `AGENTS.md` (breaking changes 주의)

---

## 2. Scope

### 2.1 In Scope

**Phase A — Core Web Vitals & SSR 기반**
- [ ] 홈페이지(`(main)/page.tsx`)를 RSC + Client island로 재구성, 초기 공연 20건 SSR
- [ ] 공연 상세 페이지의 포스터 `<img>` → `next/image` 교체 (`priority` + `sizes` 설정)
- [ ] Pretendard 외부 CDN → `next/font/local` 또는 subset을 포함한 self-hosting으로 마이그레이션

**Phase B — Metadata & JSON-LD Rich Results**
- [ ] `getBaseMetadata()`에 `metadataBase` 추가
- [ ] `getBaseMetadata()`에 `twitter: { card: "summary_large_image", ... }` 추가
- [ ] 홈/공연 상세/커뮤니티 각 페이지에 `alternates: { canonical }` 설정
- [ ] `generateEventJsonLd()` 필드 보강: `eventStatus`, `eventAttendanceMode`, `organizer`, `performer`, `PostalAddress` 구조화, `offers.priceCurrency: "KRW"`, `offers.validFrom`
- [ ] `generateWebsiteJsonLd()`를 root layout 또는 홈 page에 `<script type="application/ld+json">`로 주입
- [ ] 공연 상세 페이지에 `BreadcrumbList` JSON-LD 추가 ("홈 > 공연 > {장르} > {제목}")
- [ ] `robots.ts` disallow에 `/api-docs` 추가

**Phase C — 롱테일 랜딩 & ISR**
- [ ] `/genre/[slug]/page.tsx` 신설 (Server Component, `generateStaticParams` + 전체 장르 enumerate)
- [ ] `/venue/[slug]/page.tsx` 신설 (Server Component, 공연장 enumerate)
- [ ] 공연 상세 페이지를 on-demand ISR로 전환 (`revalidate` 또는 Next.js 16 `'use cache'` + `cacheLife`)
- [ ] `sitemap.ts`를 `generateSitemaps()`로 분할하여 50,000개/파일로 페이지네이션
- [ ] sitemap에 `/genre/*`, `/venue/*` 포함

**Phase D — 측정 인프라**
- [ ] Google Search Console 사이트 소유권 인증 (DNS TXT 또는 HTML 메타 태그)
- [ ] `sitemap.xml`을 GSC에 제출
- [ ] Google Analytics 4 속성 생성 및 `NEXT_PUBLIC_GA_MEASUREMENT_ID` 환경변수 추가
- [ ] GA4 스니펫을 `layout.tsx`에 `next/script`로 삽입 (consent 고려)
- [ ] 측정 기준선(baseline) 2주 수집

### 2.2 Out of Scope

- 다국어(hreflang) — KR only
- AMP 페이지
- 백링크 빌딩, 게스트 포스팅 등 오프페이지 SEO
- 블로그/콘텐츠 마케팅 (공연 칼럼 등)
- Google My Business, Kakao Local 등 지도 검색 최적화
- PWA/앱 설치 유도

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | 홈페이지 초기 HTML에 서버 렌더된 공연 카드가 최소 20건 포함되어야 한다 | High | Pending |
| FR-02 | 공연 포스터 이미지는 `next/image` 컴포넌트로 렌더되어 Vercel Image Optimization을 통과해야 한다 | High | Pending |
| FR-03 | Pretendard 폰트는 self-hosted `next/font`로 로드되어 render-blocking을 일으키지 않아야 한다 | High | Pending |
| FR-04 | 모든 주요 페이지(홈, 공연 상세, 장르, 공연장, 커뮤니티)는 `alternates.canonical`을 가져야 한다 | High | Pending |
| FR-05 | Root metadata는 `metadataBase`와 `twitter` 카드 필드를 포함해야 한다 | High | Pending |
| FR-06 | 공연 상세 Event JSON-LD는 Google Rich Results Test에서 0 errors + 0 warnings를 통과해야 한다 | High | Pending |
| FR-07 | Root layout에 WebSite JSON-LD(SearchAction 포함)가 주입되어야 한다 | Medium | Pending |
| FR-08 | 공연 상세 페이지에 BreadcrumbList JSON-LD가 포함되어야 한다 | Medium | Pending |
| FR-09 | `/genre/[slug]` 동적 라우트가 존재하며, 모든 활성 장르에 대해 SSG로 사전 생성되어야 한다 | High | Pending |
| FR-10 | `/venue/[slug]` 동적 라우트가 존재하며, 활성 공연장에 대해 SSG로 사전 생성되어야 한다 | High | Pending |
| FR-11 | 공연 상세 페이지는 on-demand ISR로 동작하며 첫 요청 후 캐시되어야 한다 | High | Pending |
| FR-12 | `sitemap.xml`은 `generateSitemaps()`로 분할되어 50,000개/파일 제한을 준수해야 한다 | Medium | Pending |
| FR-13 | `sitemap.xml`은 홈, 공연 상세, `/genre/*`, `/venue/*`, 커뮤니티를 모두 포함해야 한다 | High | Pending |
| FR-14 | `robots.ts`의 disallow에 `/api-docs`가 포함되어야 한다 | Low | Pending |
| FR-15 | Google Search Console에 사이트가 등록되고 소유권 인증이 완료되어야 한다 | High | Pending |
| FR-16 | Google Analytics 4가 연동되어 Real-Time 대시보드에 트래픽이 집계되어야 한다 | High | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance (LCP) | LCP < 2.5s on 4G (모바일) | Chrome DevTools Lighthouse, PageSpeed Insights |
| Performance (CLS) | CLS < 0.1 | Lighthouse |
| Performance (INP) | INP < 200ms | PageSpeed Insights (실측) |
| SEO (Lighthouse) | Lighthouse SEO 점수 100 | `npx unlighthouse` 또는 Chrome DevTools |
| SEO (Rich Results) | Event / WebSite / Breadcrumb JSON-LD가 Rich Results Test 0 errors | https://search.google.com/test/rich-results |
| Accessibility | Lighthouse Accessibility ≥ 95 (h1 유일성, alt, landmark) | Lighthouse |
| Build | 빌드 시간 증가율 < 30% (generateStaticParams 영향) | `next build` 로그 |
| DB Load | sitemap/ISR 리빌드 시 DB 쿼리 수가 현재 대비 < 5배 | Prisma query log |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] FR-01 ~ FR-16 모두 구현됨
- [ ] `next build` 가 경고 0개로 성공 (metadataBase 경고 해소 확인)
- [ ] Lighthouse SEO 점수 100 (홈, 공연 상세, 장르 랜딩 3개 페이지 모두)
- [ ] Google Rich Results Test에서 공연 상세 페이지가 Event rich result 자격 획득
- [ ] `sitemap.xml`이 실제로 `/genre/*`, `/venue/*` URL을 포함
- [ ] GSC에 sitemap 제출 완료 + "성공" 상태 수신
- [ ] GA4 Real-Time에 최소 1명의 트래픽이 집계됨

### 4.2 Quality Criteria

- [ ] Zero ESLint errors
- [ ] `tsc --noEmit` 통과
- [ ] 기존 `pickshow` feature의 Gap analysis가 회귀되지 않음 (Match Rate 유지)
- [ ] 필터/정렬/무한스크롤 기능이 홈 SSR 리팩터링 후에도 정상 작동

### 4.3 Business Metrics (4주 후 측정)

- [ ] GSC 기준 Total Impressions ≥ 기준선 × 3
- [ ] GSC 기준 색인된 공연 페이지 수 ≥ 활성 공연 80%
- [ ] GA4 기준 Organic Search 채널이 Direct를 추월

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Next.js 16 breaking changes로 `generateStaticParams`/`'use cache'` 동작이 훈련 데이터와 다름 (AGENTS.md 경고) | High | High | 구현 전 `node_modules/next/dist/docs/` 에서 관련 문서 확인, 작은 PoC부터 (`/genre/[slug]` 먼저), Design phase에서 옵션 A/B/C 비교 |
| 홈 SSR 전환 시 기존 Zustand 필터 상태가 hydration mismatch 발생 | High | Medium | Client island를 별도 컴포넌트로 분리하여 Zustand는 island 내부에만 존재. SSR은 초기 20건만, 필터 적용 후는 Client fetch. URL search params ↔ Zustand 동기화 전략 Design에서 확정 |
| Prisma 기반 sitemap 분할 시 DB 쿼리 폭주 (5만개 × N 파일) | Medium | Medium | `generateSitemaps()`의 id 페이지네이션은 인덱스 기반 LIMIT/OFFSET 대신 cursor (WHERE id > ?) 사용. `select` 필드를 id/updatedAt만으로 제한 |
| ISR 캐시 무효화 전략 부재로 stale 공연 정보 노출 | Medium | Medium | 공연 업데이트 시 `revalidatePath('/performance/[id]')` 호출을 관리자/cron 경로에 추가. Design phase에서 캐시 태그 전략 확정 |
| GA4 스니펫이 CookieConsent 전에 로드되어 개인정보법 위반 | High | Medium | 기존 `CookieConsent` 컴포넌트와 연동, consent 수락 후에만 GA4 로드 (`strategy="lazyOnload"` + consent 체크) |
| next/image 최적화가 Vercel 외 환경에서 비용 폭증 | Low | Low | Vercel 배포 전제. `remotePatterns` 화이트리스트만 유지. next.config.ts 검토 |
| `/genre/[slug]` 랜딩 페이지가 thin content로 분류되어 역효과 | Medium | Low | 각 랜딩 페이지에 장르 설명(200자+) + 공연 리스트 + 관련 공연장 섹션 포함. `<h1>` `<h2>` 계층 구조 명확화 |

---

## 6. Impact Analysis

### 6.1 Changed Resources

| Resource | Type | Change Description |
|----------|------|--------------------|
| `src/app/(main)/page.tsx` | React Component | `"use client"` 제거, RSC로 재구성 + `<SearchClient>` island 분리 |
| `src/app/(main)/performance/[id]/page.tsx` | React Component | `<img>` → `next/image`, BreadcrumbList JSON-LD 추가, ISR 설정 |
| `src/app/layout.tsx` | React Component | Pretendard CDN link 제거, `next/font` 도입, WebSite JSON-LD 주입, GA4 스니펫 |
| `src/lib/seo.ts` | Utility Module | `metadataBase`, `twitter`, Event JSON-LD 필드 보강, Breadcrumb 생성기 추가 |
| `src/app/sitemap.ts` | Next.js Route | `generateSitemaps()` 분할, `/genre`/`/venue` 포함 |
| `src/app/robots.ts` | Next.js Route | disallow 확장 |
| `src/app/(main)/genre/[slug]/page.tsx` | New File | 장르 랜딩 Server Component |
| `src/app/(main)/venue/[slug]/page.tsx` | New File | 공연장 랜딩 Server Component |
| `src/features/search/service.ts` | Service Layer | 장르별/공연장별 쿼리 함수 추가 |
| `.env`, `.env.example` | Config | `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_GSC_VERIFICATION` 추가 |
| `next.config.ts` | Config | `images.remotePatterns` 공연 포스터 도메인 화이트리스트 |

### 6.2 Current Consumers

| Resource | Operation | Code Path | Impact |
|----------|-----------|-----------|--------|
| `(main)/page.tsx` | READ | 홈 진입 / Deep link `?q=…&genre=…` 공유 | Needs verification — URL params 복원 동작 |
| `useSearchPerformances` | READ | 홈 페이지 무한스크롤 | Breaking — RSC 초기 데이터 주입 후 재사용 필요 |
| `useSearchStore` (Zustand) | CRUD | FilterSidebar, GenreFilter, ActiveFilterTags, SortSelect, ViewToggle | Needs verification — hydration 안전성 확인 |
| `performance/[id]/page.tsx` | READ | 직접 URL / 검색 결과 클릭 / og:url 공유 | None if Metadata/JSON-LD 변화만 |
| `getPerformanceById` | READ | 공연 상세 (generateMetadata + body) | None |
| `src/lib/seo.ts` getBaseMetadata | READ | root layout.tsx | None (신규 필드만 추가) |
| `generateEventJsonLd` | READ | 공연 상세 | Needs verification — 기존 필드 호환성 |
| `sitemap.ts` Prisma 쿼리 | READ | Google/Naver 봇 | Needs verification — 쿼리 비용 급증 |
| `layout.tsx` Pretendard link | READ | 모든 페이지 | Breaking — 폰트 로드 방식 변경, FOIT/FOUT 관찰 |
| `layout.tsx` AdSense Script | READ | 모든 페이지 (조건부) | None — GA4와 공존 검증 |

### 6.3 Verification

- [ ] 홈 URL 파라미터 (`/?q=hamlet&genre=musical`) deep link 가 SSR 이후에도 정상 작동
- [ ] Zustand filter state가 client island 내부에서만 사용되어 hydration mismatch 없음
- [ ] `next/image` remotePatterns에 Kopis(문화포털) / 티켓링크 / 인터파크 포스터 CDN 도메인 포함
- [ ] `next/font` 전환 후 Pretendard 한글/숫자 렌더링 동일
- [ ] GA4 스니펫이 CookieConsent 수락 후에만 로드됨
- [ ] sitemap 분할이 기존 `https://pickshow.kr/sitemap.xml` URL을 유지 (sitemap index로 응답)

---

## 7. Architecture Considerations

### 7.1 Project Level Selection

| Level | Characteristics | Recommended For | Selected |
|-------|-----------------|-----------------|:--------:|
| **Starter** | Simple structure | Static sites, portfolios | ☐ |
| **Dynamic** | Feature-based modules, BaaS | Web apps with backend, SaaS MVPs | ☑ |
| **Enterprise** | Strict layer separation, DI | High-traffic, complex | ☐ |

PickShow는 이미 Dynamic 레벨(feature-based `src/features/*` 구조, Prisma + NextAuth)로 구성되어 있다. seo-boost는 그 위에 얹는 개선 작업이다.

### 7.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| Rendering Strategy | CSR / SSR / RSC + Client island / Full RSC | **RSC + Client island** | 홈은 초기 공연 20건 SSR, 필터/무한스크롤은 island로 인터랙션 유지. 사용자 UX + SEO 동시 만족 |
| ISR Strategy | Full SSG prebuild / 인기 prebuild + 나머지 ISR / on-demand ISR / Next.js 16 `'use cache'` | **On-demand ISR** (Design phase 에서 `'use cache'` vs 기존 `revalidate` 최종 결정) | 공연 수 예측 불가 + 빌드 시간 증가 회피 + 첫 요청만 SSR |
| 랜딩 페이지 URL | `/?genre=...` / `/genre/[slug]` / `/shows/[genre]/[venue]` | **`/genre/[slug]` + `/venue/[slug]`** | 키워드 매칭 명확, canonical 깔끔, GSC URL Inspection 용이 |
| Font Loading | CDN link / next/font/google / next/font/local | **next/font/local** | Pretendard는 Google Fonts에 없음. woff2 subset self-host가 최적 |
| Image | `<img>` / `next/image` / Cloudinary | **`next/image`** | Vercel 배포 전제, 자동 AVIF/WebP, LCP priority |
| JSON-LD 주입 | `<script>` dangerouslySetInnerHTML / `@next/third-parties` | **`<script>` 수동** | 이미 프로젝트 패턴 (`performance/[id]/page.tsx:47`), 일관성 유지 |
| Analytics | GA4 `next/script` / `@next/third-parties/google` / 직접 gtag | **`@next/third-parties/google`** | Next.js 16 권장, consent 핸들링 용이 |
| Sitemap 분할 | 단일 sitemap.ts / `generateSitemaps()` / 수동 XML | **`generateSitemaps()`** | Next.js 네이티브, id 기반 cursor 페이지네이션 |

### 7.3 Clean Architecture Approach

```
Selected Level: Dynamic (기존 구조 유지)

Folder Structure (변경 부분만):
src/
├── app/
│   ├── layout.tsx                    [수정] next/font, WebSite JSON-LD, GA4
│   ├── sitemap.ts                    [수정] generateSitemaps() 분할
│   ├── robots.ts                     [수정] disallow 확장
│   └── (main)/
│       ├── page.tsx                  [수정] RSC + Client island 분리
│       ├── performance/[id]/page.tsx [수정] next/image, ISR, Breadcrumb
│       ├── genre/[slug]/page.tsx     [신규] 장르 랜딩
│       └── venue/[slug]/page.tsx     [신규] 공연장 랜딩
├── components/
│   └── performance/
│       └── SearchClient.tsx          [신규] 홈 Client island
├── features/search/
│   └── service.ts                    [수정] getPerformancesByGenre, getPerformancesByVenue
└── lib/
    └── seo.ts                        [수정] metadataBase, twitter, Event/Breadcrumb 확장
```

---

## 8. Convention Prerequisites

### 8.1 Existing Project Conventions

- [x] `CLAUDE.md` (→ `AGENTS.md`) 존재 — "This is NOT the Next.js you know" 경고 확인됨
- [x] `eslint.config.mjs` 존재
- [x] `.prettierrc` 존재
- [x] `tsconfig.json` 존재 (strict)
- [ ] `docs/01-plan/conventions.md` 미확인
- [x] `CLAUDE.md`에 별도 코딩 컨벤션 섹션 없음 (AGENTS.md 참조만)

### 8.2 Conventions to Define/Verify

| Category | Current State | To Define | Priority |
|----------|---------------|-----------|:--------:|
| **Design Ref 주석** | 기존 `// Design Ref: §9 SEO...` 패턴 존재 | seo-boost도 동일 패턴 준수 | High |
| **Next.js 16 API 사용** | AGENTS.md 경고 | 모든 `cookies()`, `headers()`, `params`, `searchParams`에 `await` | High |
| **Server/Client 경계** | 경계 느슨 | `'use client'`를 최소 필요 컴포넌트에만 | High |
| **JSON-LD 구조** | lib/seo.ts 함수 분리 | 신규 Breadcrumb generator도 lib/seo.ts에 배치 | Medium |
| **환경변수 네이밍** | `NEXT_PUBLIC_*` 사용 | GA4/GSC도 동일 prefix | Medium |

### 8.3 Environment Variables Needed

| Variable | Purpose | Scope | To Be Created |
|----------|---------|-------|:-------------:|
| `NEXT_PUBLIC_SITE_URL` | metadataBase 기반 (이미 존재) | Client | ☑ (exists) |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics 4 ID | Client | ☐ |
| `NEXT_PUBLIC_GSC_VERIFICATION` | GSC HTML meta verification token (대체로 DNS 권장) | Client | ☐ |
| `NEXT_PUBLIC_GA_ID` | 기존 AdSense client ID (layout.tsx 사용 중, 재사용) | Client | ☑ (exists, 단 변수명 혼란 있음 — 명확화) |

> **Note**: 현재 `layout.tsx:35`에서 `NEXT_PUBLIC_GA_ID`를 AdSense(`adsbygoogle.js`) 클라이언트 ID로 사용하고 있다. GA4와 혼동되지 않도록 `NEXT_PUBLIC_ADSENSE_CLIENT_ID`로 리네임 검토 (Design phase에서 최종 결정).

### 8.4 Pipeline Integration

| Phase | Status | Document Location | Command |
|-------|:------:|-------------------|---------|
| Phase 7 (SEO/Security) | 부분 적용 | — | `/phase-7-seo-security` |

seo-boost는 9-phase pipeline의 Phase 7 (SEO/Security)에 해당하는 작업의 심화 버전이다.

---

## 9. Next Steps

1. [ ] `/pdca design seo-boost` 로 Design 문서 작성 (3 architecture options 비교, 특히 ISR 전략과 홈 SSR 데이터 플로우)
2. [ ] Design phase에서 Next.js 16 문서 (`node_modules/next/dist/docs/`)를 확인해 `'use cache'` vs `revalidate` 최종 선택
3. [ ] `/pdca do seo-boost --scope phase-a` 부터 단계별 구현 착수 (Phase A → B → C → D)
4. [ ] `/pdca analyze seo-boost` 로 Gap analysis + Lighthouse + Rich Results Test 검증
5. [ ] 4주 후 GSC/GA4 baseline 비교

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-12 | Initial draft | kyungheelee |
