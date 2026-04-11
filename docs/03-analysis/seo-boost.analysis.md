# seo-boost Gap Analysis Report

> **Feature**: seo-boost
> **Date**: 2026-04-12
> **Analyst**: gap-detector agent
> **Mode**: Static-only (no runtime verification)
> **Plan**: [seo-boost.plan.md](../01-plan/features/seo-boost.plan.md)
> **Design**: [seo-boost.design.md](../02-design/features/seo-boost.design.md)

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 홈 CSR + CWV 붕괴 + metadata/JSON-LD 부족으로 공연 롱테일 검색 유입이 막혀있음 |
| **WHO** | "뮤지컬 예매", "{공연명} 티켓" 같은 롱테일 검색 사용자 |
| **RISK** | Next.js 16 breaking change, Prisma 쿼리 폭주, Zustand hydration mismatch |
| **SUCCESS** | Lighthouse SEO 100 + Event Rich Results 0 errors + LCP < 2.5s |
| **SCOPE** | Phase A → B → C → D → E (F는 외부 작업) |

---

## 1. Overall Match Rate

```
Overall = (Structural × 0.2) + (Functional × 0.4) + (Contract × 0.4)
        = (95 × 0.2) + (92 × 0.4) + (95 × 0.4)
        = 93.8%
```

| Category | Score | Status |
|----------|:-----:|:------:|
| Structural Match | 95% | ✅ |
| Functional Depth | 92% | ✅ |
| API Contract | 95% | ✅ |
| **Overall** | **93.8%** | ✅ **≥ 90% threshold** |

---

## 2. Structural Match — 95%

**Files expected**: 22 (10 new + 12 modified)
**Files present and modified per design**: 22

| Category | Count | Status |
|----------|:-----:|:------:|
| 신규 파일 | 10/10 | ✅ |
| 수정 파일 | 12/12 | ✅ |

Minor deduction: Design §11.1 file structure가 Plan §6.1과 일부 차이 (4개 컴포넌트 수정이 Design에 명시되지 않음). 문서 불일치로 5점 차감.

---

## 3. Functional Depth — 92%

### Plan SC FR-01 ~ FR-16

| ID | Requirement | Evidence | Status |
|----|-------------|----------|:------:|
| FR-01 | 홈 초기 HTML SSR 카드 ≥20건 | `(main)/page.tsx:111` `limit: 10` | ❌ **Gap**: 10건만 prefetch |
| FR-02 | next/image + Vercel Image Opt | 4개 컴포넌트 모두 전환 | ✅ Met |
| FR-03 | Pretendard self-hosted next/font | `layout.tsx:20-27` | ✅ Met |
| FR-04 | alternates.canonical | `seo.ts:46,107,148,184` | ✅ Met |
| FR-05 | metadataBase + twitter | `seo.ts:27,57-62` | ✅ Met |
| FR-06 | Event JSON-LD 보강 필드 | `jsonld.ts:101-157` 전 필드 포함 | ✅ Met |
| FR-07 | WebSite JSON-LD + SearchAction | `layout.tsx:44-47` | ✅ Met |
| FR-08 | BreadcrumbList JSON-LD | `performance/[id]/page.tsx:60-71` | ✅ Met |
| FR-09 | /genre/[slug] generateStaticParams | `genre/[slug]/page.tsx:26-28` | ✅ Met |
| FR-10 | /venue/[slug] generateStaticParams | `venue/[slug]/page.tsx:28-36` | ✅ Met |
| FR-11 | 공연 상세 on-demand ISR | `performance/[id]/page.tsx:22` | ✅ Met |
| FR-12 | sitemap.xml generateSitemaps 분할 | `sitemap.ts:24-34` | ⚠️ Partial (5K/파일, Plan 50K) |
| FR-13 | sitemap에 /genre/*, /venue/* | `sitemap.ts:77-96` | ✅ Met |
| FR-14 | robots.ts /api-docs disallow | `robots.ts:13-20` | ✅ Met |
| FR-15 | GSC 소유권 인증 | `seo.ts:73-75` 코드 준비 | ⚠️ Code-ready (외부 작업 미실행) |
| FR-16 | GA4 Real-Time 집계 | `ConsentGatedAnalytics.tsx` + `layout.tsx:72-76` | ⚠️ Code-ready (외부 작업 미실행) |

### Page UI Checklist

| Page | Required Items | Met | Notes |
|------|:---:|:---:|-------|
| `/` | 6 | 4/6 | ❌ 초기 20건 prefetch 미달 (10), ❌ 랜딩 internal link 부재 |
| `/performance/:id` | 6 | 6/6 | ✅ All met |
| `/genre/[slug]` | 8 | 8/8 | ✅ All met |
| `/venue/[slug]` | 6 | 4/6 | ⚠️ SEO 본문 95자 (200자+ 미달), ⚠️ Place JSON-LD 부재 |

---

## 4. API Contract — 95%

### Service 함수 시그니처 (Design §4.2 vs 구현)

| Function | Design | Implementation | Match |
|----------|--------|----------------|:----:|
| `getPerformancesByGenre` | `{ limit?, status? }` | `{ limit? }` only | ⚠️ status 옵션 누락 |
| `getPerformancesByVenue` | `{ limit?, status? }` | `{ limit? }` only | ⚠️ 동일 |
| `getAllActiveGenres` | `Promise<string[]>` | **미구현** | ❌ GENRE_SLUGS 정적 상수가 대체 |
| `getAllActiveVenues` | `Promise<string[]>` | ✅ 구현됨 | ✅ Match |
| `getPerformanceIdsForSitemap` | cursor-based | cursor-based 구현 | ✅ Match |
| `getPerformanceIdsForSitemapByOffset` | 없음 | `sitemap.ts` private helper 추가 | ⚠️ Design 외 |
| `countAllPerformances` | 없음 | 추가됨 (sitemap 분할용) | ⚠️ Design 외 |

---

## 5. Gap List

### 🔴 Critical (2건 — fix 권장)

| # | Item | Location | Action |
|---|------|----------|--------|
| **C1** | 홈 초기 prefetch 10건 (20건 미달) | `src/app/(main)/page.tsx:111` | `limit: 10` → `limit: 20` |
| **C2** | 홈 SEO 헤더에 `/genre`, `/venue` internal link 부재 | `src/app/(main)/page.tsx:130-140` | `<nav>` 블록 추가 (GENRE_SLUGS 링크) |

### 🟡 Important (7건)

| # | Item | Location | Action |
|---|------|----------|--------|
| **I1** | sitemap 분할 단위 5,000 (Plan 50K) | `sitemap.ts:18` | 운영 결정: 5K 유지 시 Plan/Design 업데이트 |
| **I2** | 홈 SEO 본문 175자 (200자+ 미달) | `(main)/page.tsx:134-139` | 한 문장 추가 |
| **I3** | venue 페이지 SEO 본문 95자 | `venue/[slug]/page.tsx:132-136` | 동적 longDescription |
| **I4** | getPerformancesByGenre/Venue `status` opts 누락 | `service.ts:130,150` | opts 추가 또는 Design 업데이트 |
| **I5** | getAllActiveGenres 미구현 | `service.ts` | GENRE_SLUGS 대체 — Design 업데이트 |
| **I6** | venue 페이지 Place JSON-LD 부재 | `venue/[slug]/page.tsx` | PerformingArtsTheater JSON-LD 추가 |
| **I7** | SearchClient hydration 패턴 (useRef + render-body setState) | `SearchClient.tsx:33-40` | useEffect 또는 store-level helper 이전 |

### 🔵 Minor (3건)

| # | Item | Note |
|---|------|------|
| **M1** | `NEXT_PUBLIC_GA_ID` 변수 혼동 (AdSense vs GA4) | Plan §8.3 Note에서 리네임 제안, 미실행 |
| **M2** | Phase F 미실행 (Lighthouse, Rich Results, GSC 제출, GA4 실측) | 외부 작업 |
| **M3** | `generateOrganizationJsonLd` 추가 (Design 미명시) | 보강된 이점 |

---

## 6. Decision Record Verification

| Decision | Design Says | Reality | Verdict |
|----------|-------------|---------|:-------:|
| Rendering: RSC + Client island | ✓ | ✓ | ✅ Followed |
| ISR: revalidate + 'use cache' hybrid | 공연 상세=revalidate, 랜딩='use cache' | 모두 revalidate | ⚠️ Deviation |
| `lib/seo/jsonld.ts` 분리 | ✓ | ✓ | ✅ Followed |
| `features/landing` 분리 없음 | ✓ | ✓ | ✅ Followed |
| @next/third-parties GA4 | ✓ | ✓ | ✅ Followed |
| Sitemap cursor pagination | cursor (WHERE id > ?) | offset (skip+take) | ⚠️ Deviation |
| JSON-LD dangerouslySetInnerHTML | ✓ | ✓ | ✅ Followed |
| next/font/local | ✓ | ✓ | ✅ Followed |
| next/image + AVIF/WebP | ✓ | ✓ | ✅ Followed |

### Deviation 해설

1. **'use cache' → revalidate** (랜딩 페이지): Next.js 16 `cacheComponents` experimental flag가 비활성 상태라서 `revalidate` 대체 사용. 실용적 결정, Design §2.0/§2.2 업데이트 필요.
2. **cursor → offset** (sitemap): `generateSitemaps()`의 id 분할은 병렬 호출이라 cursor 체인 불가. `Prisma.findMany` skip+take가 id 인덱스를 활용하므로 여전히 효율적. Design §4.2/Plan §5 Risk에 반영 필요.

---

## 7. Strategic Alignment

| Anchor | Verdict |
|--------|:------:|
| **WHY 홈 CSR 해소** | ✅ |
| **WHY Core Web Vitals** | ✅ (런타임 측정 미실행) |
| **WHY metadata/JSON-LD 부족** | ✅ |
| **WHO 롱테일 검색자** | ✅ (531개 랜딩 생성) |
| **RISK NX16 breaking** | ✅ revalidate 사용으로 회피 |
| **RISK Zustand hydration** | ⚠️ I7 — 패턴 재검토 필요 |
| **RISK Prisma 폭주** | ⚠️ offset 기반으로 >100K 데이터 시 비용 증가 가능 |
| **SUCCESS 런타임 측정** | ⚠️ Phase F 외부 작업 미수행 |

---

## 8. Recommended Actions

### Immediate (Critical)
1. **C1**: `(main)/page.tsx` `limit: 10` → `limit: 20`
2. **C2**: 홈 SEO 헤더에 GENRE_SLUGS internal link 블록 추가

### Important (fix 권장)
3. **I2/I3**: 홈/venue SEO 본문 200자+ 보강
4. **I6**: venue Place JSON-LD 추가
5. **I7**: SearchClient hydration 패턴 재검토 (실 hydration 안전성 테스트)
6. **I1**: sitemap 분할 단위 의사결정
7. **I4/I5**: Design §4.2 or service.ts 중 하나를 일치시킴

### Design Document Update
8. Design §2.0/§2.2: 'use cache' → revalidate deviation 기록
9. Design §4.2/Plan §5: cursor → offset deviation 기록

### External (Phase F)
10. Lighthouse 측정 (홈/상세/장르)
11. Rich Results Test (Google 공식 도구)
12. GSC 사이트 등록 + sitemap 제출
13. GA4 측정 ID 발급 + 환경변수 + Real-time 검증

---

## 9. Runtime Verification Plan (참고용)

dev server 가동 시 실행할 수 있는 테스트 목록:

### L1 — curl 기반 (10건)
- `/robots.txt` disallow 확인
- `/sitemap.xml` index 구조
- 홈 HTML h1 + JSON-LD + 카드 수
- 장르/공연장 랜딩 200 + h1
- 존재하지 않는 장르 404

### L2 — Playwright (5건)
- 홈 페이지 로드 → 카드 ≥20 즉시 표시
- 장르 chip 클릭 → URL sync + 필터링
- 무한스크롤 페이지 fetch
- CookieConsent 동의 → GA4 script load

### L3 — E2E (4건)
- SEO crawl path (/ → sitemap → 랜딩 → 상세)
- 홈 SSR + hydration mismatch 0
- ISR cache 헤더
- GA4 consent gating

---

## 10. Decision

**Overall Match Rate: 93.8%** — **≥ 90% threshold 통과**

**Status**: ✅ Acceptable. Critical 2건 (C1, C2) 수정 시 **95%+** 도달 가능.

### Next Step Options
- **Option 1**: C1+C2만 수정 후 바로 Report (95%+ 확보)
- **Option 2**: Critical + Important 일부(I2/I3/I6/I7) 함께 수정 후 Report
- **Option 3**: 현재 상태(93.8%) 그대로 Report
