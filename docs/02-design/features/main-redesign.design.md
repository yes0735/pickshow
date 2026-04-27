# Design: main-redesign (메인화면 디자인 변경)

- Feature: main-redesign
- Created: 2026-04-27
- Phase: Design
- Architecture: Option C (Pragmatic)

## Context Anchor

| Key | Value |
|-----|-------|
| WHY | 메인화면 상단의 중복 UI와 긴 설명문이 콘텐츠 접근성을 저하시킴 |
| WHO | PickShow 방문자 (공연 검색 사용자 + SEO 크롤러) |
| RISK | SEO 랭킹 하락 가능성 (h1/설명문 위치 변경) |
| SUCCESS | 메인 상단 간결화 + SEO 지표 유지 + 푸터 정보 충실 |
| SCOPE | page.tsx (메인), Footer.tsx |

---

## 1. Overview

메인화면 `page.tsx`의 `<header>` 영역을 간결화하고, 제거된 콘텐츠(서비스 설명, 장르 링크)를 `Footer.tsx`로 이동. 푸터에 KOPIS 데이터 출처를 추가하여 다단 구조로 확장한다.

선택된 설계: **Option C (Pragmatic)** — 2개 파일만 수정, Footer 내부에서 섹션별 구조화, 서브컴포넌트 분리 없음.

## 2. File Changes

| File | Action | Lines (Before/After) |
|------|--------|---------------------|
| `src/app/(main)/page.tsx` | Modify | 174 -> ~155 |
| `src/components/layout/Footer.tsx` | Modify | 21 -> ~85 |

## 3. page.tsx Changes (FR-01)

### Before (line 132~167):
```tsx
<header className="mb-6">
  <h1>공연 예매처 통합 검색</h1>
  <p>PickShow는 뮤지컬·연극·콘서트...</p>
  <nav aria-label="장르별 바로가기">
    {GENRE_SLUGS.map(...)}
  </nav>
</header>
```

### After:
```tsx
<header className="mb-6">
  <h1 className="sr-only">공연 예매처 통합 검색</h1>
</header>
```

### 변경 사항:
1. `<h1>` — `sr-only` 클래스 추가 (visually-hidden, 크롤러/스크린리더만 읽음)
2. `<p>` 서비스 설명 — 전체 삭제 (푸터로 이동)
3. `<nav>` 장르 바로가기 — 전체 삭제 (푸터로 이동)
4. `import { GENRE_SLUGS, getGenreMeta }` — 제거 (더 이상 page.tsx에서 미사용)
5. `<header className="mb-6">` — mb 값 축소 또는 유지 (h1만 남으므로 mb-2 정도)

## 4. Footer.tsx Changes (FR-02, FR-03)

### 구조 (3단 그리드 + 하단 저작권):

```
Desktop (md:grid-cols-3):
┌──────────────────┬──────────────────┬──────────────────┐
│ [Brand Section]  │ [Genre Section]  │ [Info Section]   │
│                  │                  │                  │
│ PickShow 로고    │ 장르별 공연 예매  │ 안내             │
│ 서비스 설명 텍스트│ 뮤지컬 예매      │ 개인정보처리방침 │
│ (text-xs muted)  │ 연극 예매        │ 이용약관         │
│                  │ 콘서트 예매      │                  │
│                  │ 클래식 예매      │ 데이터 출처      │
│                  │ 무용 예매        │ KOPIS 링크       │
│                  │ 국악 예매        │                  │
│                  │ 기타 예매        │                  │
├──────────────────┴──────────────────┴──────────────────┤
│ (c) 2026 PickShow. All rights reserved.               │
└───────────────────────────────────────────────────────┘

Mobile (1열 스택, gap-8):
  Brand -> Genre -> Info -> Copyright
```

### 코드 구조:
```tsx
import Link from "next/link";
import { GENRE_SLUGS, getGenreMeta } from "@/lib/seo/slug";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-bg-secondary">
      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* 3단 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand Section */}
          <div>
            <p className="text-lg font-bold mb-2">
              <span className="text-mint-dark">Pick</span>
              <span className="text-pink-dark">Show</span>
            </p>
            <p className="text-xs text-text-muted leading-relaxed">
              {서비스 설명 텍스트 - page.tsx에서 이동}
            </p>
          </div>

          {/* Genre Section */}
          <div>
            <p className="text-sm font-semibold mb-3">장르별 공연 예매</p>
            <nav aria-label="장르별 바로가기">
              <ul className="space-y-1.5">
                {GENRE_SLUGS.map(slug => (
                  <li key={slug}>
                    <Link href={`/genre/${slug}`}>{label} 예매</Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Info Section */}
          <div>
            <p className="text-sm font-semibold mb-3">안내</p>
            <ul className="space-y-1.5">
              <li><Link href="/privacy">개인정보처리방침</Link></li>
              <li><Link href="/terms">이용약관</Link></li>
            </ul>
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-text-muted">
                공연 정보: KOPIS(공연예술통합전산망)
              </p>
              <a href="https://www.kopis.or.kr" target="_blank" rel="noopener noreferrer">
                kopis.or.kr
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-6 border-t border-border text-center">
          <p className="text-xs text-text-muted">
            (c) {year} PickShow. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
```

## 5. SEO Considerations

| 항목 | 처리 |
|------|------|
| h1 태그 | page.tsx에 `sr-only`로 유지. 크롤러가 DOM 순서상 먼저 읽음 |
| 서비스 설명 | 푸터 Brand 섹션에 `<p>` 태그로 배치. 크롤러가 읽을 수 있음 |
| 장르 내부 링크 | 푸터 `<nav>` + `<ul>/<li>/<Link>`로 시맨틱 유지. link juice 보존 |
| KOPIS 출처 | 외부 링크 `rel="noopener noreferrer"` + `target="_blank"` |

## 6. Styling Guide

| Element | Classes |
|---------|---------|
| Footer container | `border-t border-border bg-bg-secondary` (기존 유지) |
| Inner wrapper | `max-w-7xl mx-auto px-4 py-10` (패딩 확대) |
| Grid | `grid grid-cols-1 md:grid-cols-3 gap-8` |
| Section title | `text-sm font-semibold text-foreground mb-3` |
| Section links | `text-xs text-text-muted hover:text-text-secondary transition-colors` |
| Brand description | `text-xs text-text-muted leading-relaxed` |
| KOPIS link | `text-xs text-mint-dark hover:underline` |
| Copyright | `text-xs text-text-muted text-center` |

## 7. Data Dependencies

| Data | Source | Used In |
|------|--------|---------|
| GENRE_SLUGS | `@/lib/seo/slug` | Footer (장르 링크 생성) |
| getGenreMeta | `@/lib/seo/slug` | Footer (장르 label 조회) |

Footer는 Server Component로 유지 (기존과 동일). `GENRE_SLUGS`는 정적 상수이므로 클라이언트 번들에 포함되지 않음.

## 8. Test Plan

| TC | Description | Expected |
|----|-------------|----------|
| TC-01 | 메인 페이지 접속 | h1이 DOM에 존재하지만 화면에 보이지 않음 |
| TC-02 | 메인 상단 영역 | 서비스 설명과 장르 바로가기가 표시되지 않음 |
| TC-03 | 푸터 Brand 섹션 | PickShow 로고 + 서비스 설명 표시 |
| TC-04 | 푸터 장르 링크 | 7개 장르 링크 표시, 클릭 시 `/genre/{slug}` 이동 |
| TC-05 | 푸터 KOPIS 출처 | 텍스트 + kopis.or.kr 링크 표시, 새 탭 열림 |
| TC-06 | 푸터 법적 링크 | 개인정보처리방침, 이용약관 링크 정상 |
| TC-07 | 반응형 (모바일) | 1열 세로 스택 레이아웃 |
| TC-08 | 반응형 (데스크톱) | 3열 그리드 레이아웃 |
| TC-09 | 다른 페이지 푸터 | 모든 페이지에서 동일한 풍성한 푸터 표시 |

## 9. Implementation Guide

### 11.1 Implementation Order

| Step | File | Task |
|------|------|------|
| 1 | `Footer.tsx` | 다단 구조 푸터로 확장 (Brand + Genre + Info + Copyright) |
| 2 | `page.tsx` | header 간결화 (h1 sr-only, 설명/장르 제거, 미사용 import 정리) |
| 3 | 확인 | 로컬 서버에서 시각적 확인 + DOM 검사 |

### 11.2 Key Notes
- Footer.tsx는 Server Component 유지 (`"use client"` 불필요)
- 서비스 설명 텍스트는 page.tsx에서 복사 (동일 내용)
- GENRE_SLUGS import를 page.tsx에서 제거, Footer.tsx에 추가

### 11.3 Session Guide

이 작업은 단일 세션으로 완료 가능 (2개 파일, ~100줄 변경).

| Module | Files | Description |
|--------|-------|-------------|
| module-1 | Footer.tsx, page.tsx | 전체 구현 (단일 세션) |
