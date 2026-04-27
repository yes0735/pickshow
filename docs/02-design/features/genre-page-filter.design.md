# Design: genre-page-filter (카테고리 페이지 필터 추가)

- Feature: genre-page-filter
- Created: 2026-04-27
- Phase: Design
- Architecture: Option C (Pragmatic)

## Context Anchor

| Key | Value |
|-----|-------|
| WHY | 카테고리 페이지가 정적 나열만 제공, 메인 대비 기능 격차가 큼 |
| WHO | 장르별 공연을 탐색하는 사용자 + SEO 크롤러 |
| RISK | ISR → CSR 전환에 따른 SEO 영향 |
| SUCCESS | 메인과 동일한 필터/정렬/뷰모드 + 장르 프리셋 + SEO 유지 |
| SCOPE | genre/[slug]/page.tsx |

---

## 1. Overview

`/genre/[slug]` 페이지를 메인 page.tsx와 동일한 RSC shell + SearchClient 패턴으로 전환한다. 해당 장르가 initialFilters에 프리셋된 상태로 필터/정렬/뷰모드/무한스크롤을 제공한다.

## 2. File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/app/(main)/genre/[slug]/page.tsx` | Major rewrite | SearchClient 통합, SEO sr-only, 정적 섹션 제거 |

## 3. Page Structure (After)

```
/genre/musical 접속 시:

┌─ JSON-LD (BreadcrumbList + ItemList) ──────── SSR, <script> ─┐
│                                                               │
│  <h1 class="sr-only">뮤지컬 예매처 통합 검색</h1>             │
│  <p class="sr-only">{longDescription}</p>                     │
│                                                               │
│  Breadcrumb: 홈 › 뮤지컬                                      │
│                                                               │
│  ┌─ SearchClient (initialFilters: { genre: ["musical"] }) ─┐ │
│  │  GenreFilter: [전체] [뮤지컬●] [연극] [콘서트] ...       │ │
│  │  ActiveFilterTags                                         │ │
│  │  ┌──────────────────────────────────────────────────┐    │ │
│  │  │ FilterSidebar │ Cards/List + Sort + View         │    │ │
│  │  │ (Desktop)     │ + InfiniteScroll                 │    │ │
│  │  └──────────────────────────────────────────────────┘    │ │
│  └──────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
```

## 4. Code Structure

```tsx
// genre/[slug]/page.tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { HydrationBoundary, dehydrate, QueryClient } from "@tanstack/react-query";
import { searchPerformances } from "@/features/search/service";
import SearchClient from "@/components/performance/SearchClient";
import { generateGenreMetadata, generateBreadcrumbJsonLd, generateItemListJsonLd, serializeJsonLd } from "@/lib/seo";
import { GENRE_SLUGS, getGenreMeta, isGenreSlug } from "@/lib/seo/slug";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pickshow.kr";
const INITIAL_PAGE_SIZE = 20;

// ISR 유지 (JSON-LD 데이터를 주기적으로 갱신)
export const revalidate = 3600;

export function generateStaticParams() { ... }  // 기존 유지
export async function generateMetadata() { ... } // 기존 유지

export default async function GenreLandingPage({ params }) {
  const { slug } = await params;
  if (!isGenreSlug(slug)) notFound();
  const meta = getGenreMeta(slug);
  if (!meta) notFound();

  // 1. initialFilters (genre 프리셋)
  const initialFilters = { genre: [slug], status: ["ongoing"] };
  const initialSort = "title";

  // 2. React Query prefetch (메인과 동일 패턴)
  const queryClient = new QueryClient();
  try {
    await queryClient.prefetchInfiniteQuery({ ... });
  } catch {}

  // 3. JSON-LD (prefetch 데이터 기반)
  const performances = queryClient.getQueryData(...)?.pages[0]?.data ?? [];
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([...]);
  const itemListJsonLd = performances.length > 0 ? generateItemListJsonLd({...}) : null;

  return (
    <>
      {/* JSON-LD */}
      <script type="application/ld+json" ... />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* SEO sr-only */}
        <h1 className="sr-only">{meta.label} 예매처 통합 검색</h1>
        <p className="sr-only">{meta.longDescription}</p>

        {/* Breadcrumb (시각적) */}
        <nav aria-label="Breadcrumb" className="...">
          홈 › {meta.label}
        </nav>

        {/* SearchClient with genre preset */}
        <HydrationBoundary state={dehydrate(queryClient)}>
          <SearchClient initialFilters={initialFilters} initialSort={initialSort} />
        </HydrationBoundary>
      </div>
    </>
  );
}
```

## 5. Key Decisions

| Decision | Rationale |
|----------|-----------|
| ISR revalidate=3600 유지 | JSON-LD ItemList를 위해 서버에서 주기적 데이터 갱신 필요 |
| SearchClient 그대로 재사용 | genre 칩이 initialFilters로 자동 활성화됨 (별도 prop 불필요) |
| "다른 장르 보기" 섹션 제거 | GenreFilter 칩이 동일 역할 수행 |
| "주요 공연장" 섹션 제거 | FilterSidebar의 venue 필터로 대체 |
| JSON-LD는 prefetch cache에서 추출 | 별도 DB 조회 없이 dehydrated 데이터 활용 |

## 6. SEO Considerations

| 항목 | 처리 |
|------|------|
| h1 | `<h1 class="sr-only">{label} 예매처 통합 검색</h1>` — 크롤러가 읽음 |
| longDescription | `<p class="sr-only">` — 크롤러가 읽음, 사용자에게 안 보임 |
| Breadcrumb | 시각적 유지 + JSON-LD BreadcrumbList |
| ItemList | prefetch된 첫 페이지 20건으로 JSON-LD 생성 |
| canonical | generateGenreMetadata에서 이미 설정됨 |
| SSR 카드 데이터 | HydrationBoundary로 첫 페이지 데이터가 HTML에 포함 |

## 7. Removed Sections

| Section | Reason | Alternative |
|---------|--------|-------------|
| 정적 PerformanceCard 그리드 (50건) | SearchClient가 대체 | SearchClient + 무한스크롤 |
| "주요 공연장" | FilterSidebar venue 필터 | 사이드바에서 공연장 선택 가능 |
| "다른 장르 보기" | GenreFilter 칩 | 상단 칩에서 장르 전환 |

## 8. Implementation Guide

### 11.1 Implementation Order

| Step | Task |
|------|------|
| 1 | genre/[slug]/page.tsx rewrite: imports 정리, 정적 섹션 제거 |
| 2 | initialFilters/initialSort 정의, prefetch 로직 추가 |
| 3 | SearchClient + HydrationBoundary 통합 |
| 4 | SEO 요소 유지: sr-only h1/p, Breadcrumb, JSON-LD |
| 5 | 로컬 확인: /genre/musical 접속 테스트 |

### 11.3 Session Guide

단일 세션 완료 가능 (1개 파일 rewrite).

| Module | Files | Description |
|--------|-------|-------------|
| module-1 | genre/[slug]/page.tsx | 전체 구현 |
