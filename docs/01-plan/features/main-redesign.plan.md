# Plan: main-redesign (메인화면 디자인 리뉴얼)

- Feature: main-redesign
- Created: 2026-04-27
- Updated: 2026-05-02 (디자인 핸드오프 반영)
- Phase: Plan
- Level: Dynamic
- Source: PickShow Design System Handoff (zip)

## Executive Summary

| 관점 | 내용 |
|------|------|
| Problem | 메인화면에 히어로 섹션, 카테고리 네비게이션, 최근 검색어가 없어 첫인상이 약하고 탐색 동선이 길다. 디자인 핸드오프 대비 6개 주요 Gap 존재 |
| Solution | HomeHero(제목+설명+통합검색바+최근검색어), Header 카테고리 탭, 모바일 드로어, BackToTop, 배경색 off-white 적용 |
| Function UX Effect | 검색 진입점 명확화, 카테고리 원클릭 탐색, 최근검색어 재사용으로 검색 효율 대폭 향상 |
| Core Value | 서비스 정체성 전달 + 탐색 효율 개선 = 첫 방문 이탈률 감소 |

## Context Anchor

| Key | Value |
|-----|-------|
| WHY | 디자인 핸드오프와 현재 구현 간 Gap 해소 - 메인화면 첫인상 및 탐색 동선 개선 |
| WHO | PickShow 방문자 (공연 검색 사용자, 모바일+데스크톱) |
| RISK | 기존 검색/필터 로직(Zustand+React Query) 깨지지 않도록 주의 |
| SUCCESS | 디자인 핸드오프 UI와 95%+ 일치 + 기존 기능 정상 동작 |
| SCOPE | 메인 홈 화면 + Header 리뉴얼 (커뮤니티/마이페이지 제외) |

---

## 1. Background

디자인 핸드오프 파일(`PickShow Design System-handoff.zip`) 분석 결과, 현재 구현과 6개 주요 Gap이 발견됨:

| 영역 | 디자인 핸드오프 | 현재 구현 | Gap |
|------|----------------|----------|-----|
| Hero 섹션 | 제목+설명+검색바+최근검색어 | 없음 (sr-only h1) | 신규 |
| Header Row 2 | 카테고리 탭 nav (메인/뮤지컬/연극...) + active 밑줄 | 없음 | 신규 |
| 검색바 위치 | Hero 내부 통합 (mint CTA 원형 버튼) | Header 하단 (별도 영역) | 위치+스타일 변경 |
| 최근 검색어 | 칩 형태로 검색바 하단 표시 | 없음 | 신규 |
| 모바일 카테고리 | 좌측 슬라이드 드로어 (280px) | 없음 | 신규 |
| BackToTop | 우측 하단 플로팅 버튼 | 없음 | 신규 |
| 배경색 | bg-secondary (#F8FAFB) | bg (#FEFEFE) | 변경 |

## 2. Requirements

### FR-01: HomeHero 섹션 (신규)
- h1 제목: "공연 정보를 한 곳에서, 예매처로 바로" (text-20 bold)
- 설명 텍스트: "PickShow는 공연 정보를 한 곳에서 검색하고, 원하는 예매처로 바로 이동할 수 있는 공연 예매처 통합 검색 서비스입니다." (text-13 secondary)
- 통합 검색바:
  - rounded-full, h-44, shadow-sm
  - 좌측 padding 20px, 우측 mint CTA 원형 버튼 (w-32 h-32)
  - 검색어 삭제 x-circle 버튼
- 최근 검색어:
  - localStorage 저장 (키: `ps_recents`, 최대 8개)
  - 칩 형태: rounded-full, bg-secondary, border
  - 개별 삭제(x) + "모두 지우기" 버튼
  - 클릭 시 해당 검색어로 검색 실행
- 검색 실행 시 Zustand store `setFilter("q", value)` 연동

### FR-02: Header 2단 구조 리뉴얼
- Row 1 (h-48):
  - 모바일: [hamburger] [PickShow 로고] ... [게시판][찜][내공연]
  - 데스크톱: [PickShow 로고] ... [게시판][찜][내공연]
- Row 2 (h-40, 데스크톱 md+ 전용):
  - 카테고리 탭: 메인 / 뮤지컬 / 연극 / 콘서트 / 클래식 / 무용 / 국악 / 기타
  - 활성 탭: text-mint-dark + font-semibold + border-bottom 2px mint-dark
  - 가로 스크롤 (좁은 화면)
- Header에서 검색바 제거 (Hero로 이동)
- 카테고리 탭 클릭 -> Zustand genre 필터 적용

### FR-03: 모바일 카테고리 드로어 (신규)
- 햄버거 아이콘 (lg:hidden) 클릭 시 좌측 슬라이드 드로어
- 드로어 너비 280px, slideInLeft 애니메이션 0.25s
- 카테고리 목록: 버튼 형태 (text-14, padding 10px 12px, rounded-lg)
- 활성 카테고리: bg-mint-light + text-mint-dark
- 오버레이 bg-black/50 + ESC 닫기

### FR-04: BackToTop 버튼 (신규)
- 스크롤 240px 이후 표시
- 우측 하단 고정 (right:16, bottom:16, z-40)
- white bg + border + shadow (0 4px 12px rgba(0,0,0,.12))
- arrow-up 아이콘 (18px)
- 클릭 시 smooth scroll to top

### FR-05: 배경색 변경
- body 배경: bg-secondary (#F8FAFB)로 변경
- 카드/모달은 white 유지 -> 자연스러운 구분

### FR-06: SearchClient 정리
- GenreFilter 칩 제거 (Header 카테고리 탭으로 대체)
- 기존 필터/정렬/무한스크롤 로직 유지

## 3. Out of Scope

- 커뮤니티 게시판 리디자인
- 마이페이지 리디자인
- 공연 상세 모달/페이지 (이미 별도 리뉴얼 완료)
- 인증 화면 (로그인/회원가입)

## 4. Technical Approach

### 수정/생성 파일

| File | Action | Description |
|------|--------|-------------|
| `src/app/globals.css` | Modify | body bg -> bg-secondary, slideInLeft/fadeIn 키프레임 추가 |
| `src/components/home/HomeHero.tsx` | Create | Hero 섹션 (Client Component - 검색+최근검색어) |
| `src/components/layout/Header.tsx` | Modify | 2단 구조 + 카테고리 탭 + 모바일 드로어 |
| `src/components/ui/BackToTop.tsx` | Create | 플로팅 스크롤 버튼 |
| `src/app/(main)/page.tsx` | Modify | HomeHero RSC 통합 |
| `src/app/(main)/layout.tsx` | Modify | BackToTop 추가 |
| `src/components/performance/SearchClient.tsx` | Modify | GenreFilter 제거 |

### 구현 순서
1. `globals.css` - 배경색 + 애니메이션 추가
2. `HomeHero.tsx` - Hero 섹션 생성
3. `Header.tsx` - 2단 구조 + 드로어 리뉴얼
4. `BackToTop.tsx` - 플로팅 버튼 생성
5. `page.tsx` - Hero 통합
6. `layout.tsx` - BackToTop 추가
7. `SearchClient.tsx` - GenreFilter 제거
8. 통합 테스트

## 5. Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| Zustand store 연동 깨짐 | High | Hero 검색바가 동일한 setFilter("q") 사용, 기존 API 변경 없음 |
| SSR prefetch 영향 | Medium | Hero는 Client Component지만 page.tsx의 React Query prefetch 로직 유지 |
| SEO 영향 | Low | h1은 Hero에 서버 렌더, 검색바만 Client island |
| 모바일 드로어 a11y | Low | aria-label + ESC + 오버레이 클릭 닫기 적용 |

## 6. Success Criteria

| ID | Criteria |
|----|----------|
| SC-01 | HomeHero: 제목+설명+검색바+최근검색어 정상 렌더 |
| SC-02 | Header 카테고리 탭: 클릭 시 장르 필터 적용, active 스타일 |
| SC-03 | 모바일 드로어: 햄버거 -> 드로어 열림/닫힘, 카테고리 선택 |
| SC-04 | BackToTop: 스크롤 후 표시, 클릭 시 상단 이동 |
| SC-05 | 최근 검색어: localStorage 저장/표시/개별삭제/전체삭제 |
| SC-06 | 기존 검색/필터/무한스크롤 정상 동작 |
| SC-07 | 배경색 off-white (#F8FAFB) 적용 |
| SC-08 | 디자인 핸드오프 UI와 95%+ 시각적 일치 |
