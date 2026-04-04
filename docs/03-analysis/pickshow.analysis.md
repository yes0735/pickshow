# PickShow Gap Analysis Report

> **Date**: 2026-04-04
> **Method**: Static Analysis (Design vs Implementation)
> **Formula**: (Structural x 0.2) + (Functional x 0.4) + (Contract x 0.4)

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 공연 예매처를 찾는 번거로움 해소 |
| **WHO** | 공연 관람을 즐기는 일반 사용자 |
| **RISK** | KOPIS API 의존성 |
| **SUCCESS** | 검색→예매 연결 3초 이내, 배치 가동률 99% |
| **SCOPE** | Phase 1 전체 (module-1~5) |

---

## Overall Scores

| Category | Score | Status |
|----------|:-----:|:------:|
| Structural Match | **93%** | PASS |
| Functional Depth | **82%** | WARN |
| API Contract | **95%** | PASS |
| **Overall** | **89%** | < 90% → Iteration 필요 |

---

## Important Gaps (7)

| # | Category | Description | Fix |
|---|----------|-------------|-----|
| F-1 | Functional | FavoriteButton 미구현 — 카드/모달에 찜 버튼 없음 | FavoriteButton 컴포넌트 추출, 카드+모달에 배치 |
| F-2 | Functional | MyPerfButton 미구현 — 모달에 내가본공연 등록 버튼 없음 | MyPerfButton 컴포넌트 추출, 모달에 배치 |
| F-3 | Functional | AdSlot 미배치 — 컴포넌트 있지만 검색결과/모달에 사용 안 함 | 검색 5번째 후 + 모달 하단에 AdSlot 배치 |
| F-6 | Functional | 내가본공연 등록/수정 폼 없음 | My Performances 페이지에 등록 폼 추가 |
| F-8 | Functional | 모바일 필터 시트 미구현 — FilterSidebar가 lg:hidden | 모바일 바텀시트 추가 |
| SEC-1 | Security | DOMPurify 미사용 — 게시판 XSS 방어 | 게시글 내용 렌더링 시 sanitize 적용 |
| SEC-2 | Security | Rate Limiting 미구현 — proxy.ts/middleware 없음 | middleware.ts에 rate limit 로직 추가 |

## Minor Gaps (9)

| # | Description |
|---|-------------|
| S-1 | not-found.tsx 커스텀 404 페이지 없음 |
| S-2 | 8개 컴포넌트 인라인 구현 (별도 파일 미추출) |
| S-3 | public/ads.txt placeholder만 존재 |
| F-4 | 가격 필터: 슬라이더 대신 숫자 입력 |
| F-5 | 날짜 필터: DatePicker 대신 native input |
| F-7 | 게시글 수정 버튼 없음 (삭제만) |
| F-9 | 검색 디바운스 없음 |
| C-1~3 | PUT/DELETE 3개 엔드포인트 클라이언트 호출 없음 |
| SEC-3 | JWT 단일 토큰 (Access+Refresh 분리 안 됨) |

## Plan Success Criteria

| FR | Status |
|----|:------:|
| FR-01~04 (검색/모달/뷰/스크롤) | Met (Minor UI 차이) |
| FR-05 (인증) | Met |
| FR-06 (찜) | Partial — API 완료, UI 미배치 |
| FR-07~08 (커뮤니티) | Met |
| FR-09 (내가본공연) | Partial — 등록 폼 미구현 |
| FR-10~11 (배치/코드) | Met |
| FR-12 (SEO) | Met |
| FR-13 (AdSense) | Partial — 슬롯 미배치 |
| FR-14~18 (보안/법적) | Met |

**Success Rate**: 13/18 Met, 5/18 Partial, 0/18 Not Met
