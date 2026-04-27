# Plan: main-redesign (메인화면 디자인 변경)

- Feature: main-redesign
- Created: 2026-04-27
- Phase: Plan
- Level: Dynamic

## Executive Summary

| 관점 | 내용 |
|------|------|
| Problem | 메인화면에 장르 카테고리가 2곳(장르별 바로가기 링크 + GenreFilter 칩)에 중복 표시되고, SEO용 서비스 설명이 상단을 크게 차지하여 사용자가 실제 콘텐츠(공연 목록)에 도달하기까지 스크롤이 많이 필요함 |
| Solution | 장르별 바로가기 링크와 SEO 설명문을 푸터로 이동하고, h1은 visually-hidden 처리. 푸터를 서비스 설명 + 장르 링크 + KOPIS 출처 + 법적 링크를 포함하는 풍성한 구조로 확장 |
| Function UX Effect | 메인화면 진입 시 바로 검색/필터/공연 카드가 보여 탐색 효율 향상. 푸터에서 서비스 정보와 데이터 출처를 신뢰감 있게 제공 |
| Core Value | 콘텐츠 우선 레이아웃으로 사용자 경험 개선 + SEO 크롤링 유지 + 데이터 출처 투명성 확보 |

## Context Anchor

| Key | Value |
|-----|-------|
| WHY | 메인화면 상단의 중복 UI와 긴 설명문이 콘텐츠 접근성을 저하시킴 |
| WHO | PickShow 방문자 (공연 검색 사용자 + SEO 크롤러) |
| RISK | SEO 랭킹 하락 가능성 (h1/설명문 위치 변경) |
| SUCCESS | 메인 상단 간결화 + SEO 지표 유지 + 푸터 정보 충실 |
| SCOPE | page.tsx (메인), Footer.tsx, 관련 CSS |

---

## 1. Background

현재 메인화면 `(main)/page.tsx` 구조:
- `<header>`: h1 "공연 예매처 통합 검색" + 250자+ 서비스 설명 `<p>` + 장르별 바로가기 `<nav>` (8개 링크)
- `<SearchClient>`: GenreFilter 칩 (동일 장르 목록) + 필터 + 공연 카드

문제:
1. 장르가 "바로가기 링크"와 "GenreFilter 칩" 2곳에 중복
2. SEO 설명문이 화면 상단을 차지하여 모바일에서 특히 스크롤 부담
3. 푸터가 저작권 + 법적 링크만 있어 단순함

## 2. Requirements

### FR-01: 메인 상단 간결화
- `page.tsx`의 `<header>` 영역에서 장르별 바로가기 `<nav>` 제거
- `page.tsx`의 `<header>` 영역에서 서비스 설명 `<p>` 제거
- h1 "공연 예매처 통합 검색"은 visually-hidden 클래스로 시각적 숨김 처리
  - 크롤러와 스크린리더는 읽을 수 있음
  - CSS: `sr-only` (Tailwind 기본 제공)

### FR-02: 푸터 확장
- 푸터를 다단 구조로 리디자인:
  - **서비스 설명 섹션**: PickShow 로고 + 서비스 설명 텍스트 (기존 page.tsx의 설명문 이동)
  - **장르별 바로가기 섹션**: `/genre/{slug}` 링크 목록 (기존 page.tsx에서 이동)
  - **데이터 출처 섹션**: "공연 정보: KOPIS(공연예술통합전산망)" 텍스트 + KOPIS 사이트 링크
  - **법적 링크 섹션**: 개인정보처리방침, 이용약관 (기존 유지)
  - **저작권 표시**: 기존 유지

### FR-03: SEO 유지
- 푸터의 서비스 설명에 h1 태그 적용 (페이지당 h1 하나 유지)
  - 단, visually-hidden으로 메인 상단에 배치하므로 푸터에는 h2 또는 일반 텍스트
  - 크롤러는 상단의 visually-hidden h1을 읽음
- 장르별 링크는 `<nav>` + `aria-label`로 시맨틱 유지
- 내부 링크 구조 유지 (link juice 보존)

### FR-04: 무한 스크롤 자동 로딩 제한 (푸터 접근성)
- 무한 스크롤이 N페이지(기본 5) 이후 자동 로딩을 중단
- "더보기" 버튼을 표시하여 수동 로드로 전환
- 자동 로딩 중단 시 푸터가 자연스럽게 노출됨 (Instagram 방식)
- InfiniteScroll 컴포넌트에 `autoLoadPages` prop 추가
- SearchClient에서 현재 로드된 페이지 수를 추적하여 전달

## 3. Out of Scope

- Header 컴포넌트 변경 (검색바, 네비게이션 메뉴)
- GenreFilter 칩 UI 변경
- 다른 페이지 (장르 상세, 커뮤니티 등)

## 4. Technical Approach

### 변경 파일:
| File | Action | Description |
|------|--------|-------------|
| `src/app/(main)/page.tsx` | Modify | header 영역 간결화 (설명/장르링크 제거, h1 sr-only) |
| `src/components/layout/Footer.tsx` | Modify | 다단 구조 푸터로 확장 |
| `src/components/ui/InfiniteScroll.tsx` | Modify | autoLoadPages prop 추가, 초과 시 "더보기" 버튼 표시 |
| `src/components/performance/SearchClient.tsx` | Modify | 로드된 페이지 수 추적, InfiniteScroll에 전달 |

### 푸터 레이아웃 (모바일 → 데스크톱):
```
Mobile (1열 세로 스택):
┌─────────────────────────┐
│ PickShow 로고 + 설명     │
├─────────────────────────┤
│ 장르별 공연 예매처        │
│ 뮤지컬 | 연극 | 콘서트... │
├─────────────────────────┤
│ 데이터 출처: KOPIS       │
├─────────────────────────┤
│ 개인정보 | 이용약관       │
│ (c) 2026 PickShow        │
└─────────────────────────┘

Desktop (그리드):
┌──────────────┬──────────────┬──────────────┐
│ PickShow     │ 장르별       │ 안내         │
│ 로고 + 설명  │ 공연 예매처  │ 개인정보     │
│              │ 뮤지컬 예매  │ 이용약관     │
│              │ 연극 예매    │              │
│              │ 콘서트 예매  │ 데이터 출처  │
│              │ ...          │ KOPIS 링크   │
├──────────────┴──────────────┴──────────────┤
│ (c) 2026 PickShow. All rights reserved.    │
└────────────────────────────────────────────┘
```

## 5. Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| SEO 랭킹 하락 (h1 위치 변경) | Medium | visually-hidden h1 유지 + 푸터에 시맨틱 마크업 + 내부 링크 구조 보존. 배포 후 GSC 모니터링 |
| 크롤러가 푸터 콘텐츠 가중치를 낮게 봄 | Low | 장르 링크는 내부 링크이므로 위치보다 존재 여부가 중요. h1은 상단에 유지 |
| 모바일 푸터가 너무 길어짐 | Low | 장르 링크를 flex-wrap으로 컴팩트하게 배치 |

## 6. Success Criteria

| ID | Criteria | Measurement |
|----|----------|-------------|
| SC-01 | 메인 상단에서 서비스 설명/장르 바로가기가 보이지 않음 | 시각적 확인 |
| SC-02 | h1이 DOM에 존재하고 sr-only 클래스 적용 | DOM 검사 |
| SC-03 | 푸터에 서비스 설명, 장르 링크, KOPIS 출처, 법적 링크 모두 표시 | 시각적 확인 |
| SC-04 | 장르 링크 클릭 시 `/genre/{slug}` 페이지로 정상 이동 | 기능 테스트 |
| SC-05 | 모바일/데스크톱 반응형 레이아웃 정상 동작 | 반응형 확인 |
| SC-06 | Lighthouse SEO 점수 유지 (현재 대비 하락 없음) | Lighthouse 측정 |
| SC-07 | 5페이지 이후 자동 로딩 중단, "더보기" 버튼 표시 | 스크롤 테스트 |
| SC-08 | "더보기" 버튼 아래에 푸터가 보임 | 시각적 확인 |
