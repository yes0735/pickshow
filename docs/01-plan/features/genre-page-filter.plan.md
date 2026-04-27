# Plan: genre-page-filter (카테고리 페이지 필터 추가)

- Feature: genre-page-filter
- Created: 2026-04-27
- Phase: Plan
- Level: Dynamic

## Executive Summary

| 관점 | 내용 |
|------|------|
| Problem | 카테고리(`/genre/[slug]`) 페이지가 정적 50건 나열만 제공하여 필터/정렬/뷰모드 없이 탐색이 불편하고, SEO 설명이 화면 상단을 차지함 |
| Solution | 메인과 동일한 SearchClient(필터/정렬/뷰모드/무한스크롤)를 카테고리 페이지에 통합하고, SEO 헤더(h1+longDescription)를 전부 sr-only 처리 |
| Function UX Effect | 카테고리 페이지 진입 시 해당 장르가 미리 선택된 상태로 필터/정렬/무한스크롤 즉시 사용 가능. 다른 장르 칩 선택 시 해당 장르 페이지로 이동 |
| Core Value | 메인과 일관된 탐색 경험 제공 + SEO 크롤링 유지 + 카테고리 페이지 실용성 대폭 향상 |

## Context Anchor

| Key | Value |
|-----|-------|
| WHY | 카테고리 페이지가 정적 나열만 제공, 메인 대비 기능 격차가 큼 |
| WHO | 장르별 공연을 탐색하는 사용자 + SEO 크롤러 |
| RISK | ISR → CSR 전환에 따른 SEO 영향, SearchClient 재사용 시 genre 고정 로직 |
| SUCCESS | 메인과 동일한 필터/정렬/뷰모드 + 장르 프리셋 + SEO 유지 |
| SCOPE | genre/[slug]/page.tsx |

---

## 1. Background

현재 `/genre/[slug]` 페이지:
- ISR(1시간) + SSR로 50건 정적 렌더링
- PerformanceCard 그리드만 제공 (필터/정렬/뷰모드/무한스크롤 없음)
- SEO 헤더(h1 + longDescription)가 화면 상단 차지
- "다른 장르 보기" 섹션, "주요 공연장" 섹션 존재

메인 페이지 (`/`):
- SearchClient: GenreFilter 칩 + FilterSidebar + SortSelect + ViewToggle + 무한스크롤
- React Query + Zustand 기반 클라이언트 검색

## 2. Requirements

### FR-01: 카테고리 페이지에 SearchClient 통합
- 메인의 `<SearchClient>` 컴포넌트를 카테고리 페이지에서 재사용
- `initialFilters.genre`를 URL slug에 해당하는 장르로 프리셋
- GenreFilter 칩에서 해당 장르가 활성화된 상태로 표시
- 다른 장르 칩 클릭 시 해당 `/genre/{slug}` 페이지로 이동 (또는 필터 변경)
- FilterSidebar, SortSelect, ViewToggle, InfiniteScroll 모두 동작

### FR-02: SEO 헤더 sr-only 처리
- h1 "뮤지컬 예매처 통합 검색" → `sr-only` 클래스
- longDescription `<p>` → `sr-only` 클래스
- 크롤러/스크린리더는 읽을 수 있음
- 화면은 바로 Breadcrumb → GenreFilter → 필터/카드로 시작

### FR-03: 기존 섹션 정리
- "다른 장르 보기" 섹션: GenreFilter 칩이 이 역할을 대체하므로 제거
- "주요 공연장" 섹션: 유지 또는 제거 (FilterSidebar의 venue 필터로 대체 가능)
- Breadcrumb: 유지 (SEO + 네비게이션)
- JSON-LD (BreadcrumbList, ItemList): SSR prefetch 데이터 기반으로 유지

### FR-04: SSR Prefetch 유지
- 메인 page.tsx와 동일 패턴으로 React Query prefetch
- `initialFilters`에 `genre: [slug]` 포함하여 서버에서 첫 페이지 데이터 로드
- HydrationBoundary로 SearchClient에 전달

## 3. Out of Scope

- SearchClient 내부 로직 변경
- FilterSidebar UI 변경
- 다른 페이지 변경

## 4. Technical Approach

### 변경 파일:
| File | Action | Description |
|------|--------|-------------|
| `src/app/(main)/genre/[slug]/page.tsx` | Major rewrite | SearchClient 통합, SEO sr-only, 정적 섹션 제거 |

### 핵심 변경:
1. 기존 정적 PerformanceCard 그리드 → `<SearchClient initialFilters={{ genre: [slug] }}>`
2. React Query prefetch 추가 (메인 page.tsx 패턴 복사)
3. h1 + longDescription → sr-only
4. "다른 장르 보기" 섹션 제거 (GenreFilter가 대체)
5. "주요 공연장" 섹션 제거 (FilterSidebar venue 필터로 대체)
6. JSON-LD는 prefetch 데이터 기반으로 유지

## 5. Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| ISR → CSR 전환으로 SEO 영향 | Medium | SSR prefetch로 첫 페이지 20건은 서버 렌더. sr-only h1/description 유지. JSON-LD 유지 |
| GenreFilter에서 다른 장르 선택 시 동작 | Low | 장르 칩 클릭 → Zustand 필터 변경 → 데이터 재검색 (메인과 동일 동작) |
| 50건 정적 → 20건 prefetch + 무한스크롤 | Low | 사용자 경험 개선 (필터로 더 정밀한 탐색 가능) |

## 6. Success Criteria

| ID | Criteria | Measurement |
|----|----------|-------------|
| SC-01 | 카테고리 페이지에서 필터/정렬/뷰모드/무한스크롤 동작 | 기능 테스트 |
| SC-02 | 해당 장르가 GenreFilter에서 활성화 상태 | 시각적 확인 |
| SC-03 | h1, longDescription이 sr-only로 숨겨짐 | DOM 검사 |
| SC-04 | Breadcrumb 유지 | 시각적 확인 |
| SC-05 | JSON-LD 정상 출력 | HTML 소스 확인 |
| SC-06 | SSR prefetch로 첫 페이지 데이터 서버 렌더 | curl로 HTML에 카드 데이터 존재 확인 |
