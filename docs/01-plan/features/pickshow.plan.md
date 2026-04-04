# PickShow Planning Document

> **Summary**: 공연 예매 플랫폼 연결 서비스 — KOPIS 공연정보 기반으로 예매처를 검색·연결하고, 찜/리뷰/커뮤니티 기능을 제공하는 반응형 웹앱
>
> **Project**: PickShow (픽쇼)
> **Author**: kyungheelee
> **Date**: 2026-04-04
> **Status**: Draft

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | 공연을 예매하려면 어떤 플랫폼(인터파크, YES24, 멜론티켓 등)에서 판매하는지 일일이 찾아봐야 하는 번거로움이 있음 |
| **Solution** | KOPIS 공공 데이터를 활용하여 공연정보를 통합 검색하고, 해당 공연의 예매처 링크를 한 곳에서 바로 연결해주는 서비스 |
| **Function/UX Effect** | 검색 한 번으로 공연정보 + 예매처 연결, 찜·내가 본 공연·리뷰·커뮤니티까지 공연 생활 원스톱 경험. SEO 최적화로 검색 유입 극대화 |
| **Core Value** | 공연 예매의 진입 장벽을 없애고, 공연 팬들의 기록·소통 허브가 되는 것. AdSense 수익 모델 + 앱 확장 가능 구조 |

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 공연 예매처를 찾는 번거로움 해소 — 통합 검색 + 예매처 바로 연결 |
| **WHO** | 공연(뮤지컬, 연극, 콘서트 등) 관람을 즐기는 일반 사용자 |
| **RISK** | KOPIS API 의존성 (API 장애 시 서비스 불가), 데이터 정합성 |
| **SUCCESS** | 공연 검색→예매처 연결 3초 이내, 일일 배치 정상 가동률 99%, 찜/리뷰 기능 정상 동작 |
| **SCOPE** | Phase 1: 검색+예매연결+찜+커뮤니티+내가본공연+SEO+AdSense (Admin 제외, 앱은 Phase 2+) |

---

## 1. Overview

### 1.1 Purpose

공연 관람객이 원하는 공연을 검색하면 해당 공연의 예매처(인터파크, YES24, 멜론티켓 등)로 바로 이동할 수 있도록 연결해주는 서비스. 추가로 공연 찜, 내가 본 공연 기록, 리뷰/별점, 커뮤니티 게시판을 통해 공연 팬들의 종합 플랫폼 역할을 한다.

### 1.2 Background

- 공연 예매 플랫폼이 다양하여(인터파크, YES24, 멜론티켓, 티켓링크 등) 특정 공연이 어디서 판매되는지 찾기 어려움
- KOPIS(공연예술통합전산망)에서 공연정보를 공공 API로 제공하며, 예매처 정보도 포함됨
- 기존에 이를 깔끔하게 연결해주는 전용 서비스가 부족

### 1.3 Related Documents

- KOPIS 오픈 API: https://www.kopis.or.kr/por/cs/openapi/openApiInfo.do
- Design: `docs/02-design/features/pickshow.design.md` (작성 예정)

---

## 2. Scope

### 2.1 In Scope (Phase 1)

- [x] 공연정보 통합 검색 (장르/기간/상태/가격/연령/예매처/장소 필터)
- [x] 공연 상세 + 예매처 사이트 연결 (비로그인 가능)
- [x] 회원가입/로그인 (이메일+비밀번호 + Google/Kakao 소셜 로그인, JWT)
- [x] 공연 찜 등록/해제
- [x] 익명 커뮤니티 게시판 (카테고리: 홍보, 정보, 구함) + 댓글
- [x] 회원 커뮤니티 게시판 (카테고리: 홍보, 정보, 양도, 구함) + 댓글
- [x] 내가 본 공연 관리 (목록, 리뷰/별점, 한줄메모, 좌석입력, 예매처 선택)
- [x] KOPIS 배치 동기화 (매일 01:00) + 공연상태 자동 업데이트
- [x] 공통코드 관리 (장르, 공연상태, 가격대, 관람연령, 예매처, 공연장소)
- [x] SEO 최적화 (meta tags, sitemap.xml, robots.txt, OG 태그, JSON-LD 구조화 데이터)
- [x] Google AdSense 광고 연동 (배너/네이티브 광고 수익화)
- [x] 개인정보보안: 개인정보처리방침, 이용약관, 동의 체크, 회원탈퇴/파기, 쿠키 동의 배너

### 2.2 Out of Scope

- Admin 관리자 페이지 (Phase 2)
- 네이티브 앱 전환 (Phase 2+ — 방식 미정: PWA / React Native / WebView 중 추후 결정)
- 결제/티켓 구매 기능 (예매처로 연결만)
- 푸시 알림 / 알림 기능
- Google Ads 광고주용 캠페인 (현재는 AdSense 수익만)
- 블로그/콘텐츠 마케팅 (고급 SEO)

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | 공연정보 검색: 키워드 통합검색 + 7종 필터(장르/기간/상태/가격대/연령/예매처/장소) | High | Pending |
| FR-02 | 공연 상세 모달: 모달 오픈 시 URL 변경 (SEO), 예매처 외부링크 연결 | High | Pending |
| FR-03 | 뷰 전환: 카드형/리스트형 선택, 정렬(날짜순/가격낮은순/가격높은순) | High | Pending |
| FR-04 | 무한스크롤: 페이지당 10개, Intersection Observer 기반 | Medium | Pending |
| FR-05 | 회원가입/로그인: 이메일+비밀번호, Google OAuth, Kakao OAuth, JWT 토큰 | High | Pending |
| FR-06 | 공연 찜: 로그인 사용자 찜 등록/해제, 찜 목록 조회 | High | Pending |
| FR-07 | 익명 게시판: 비로그인 글 작성(닉네임+비밀번호), 카테고리(홍보/정보/구함), 댓글 | Medium | Pending |
| FR-08 | 회원 게시판: 로그인 필수, 카테고리(홍보/정보/양도/구함), 댓글 | Medium | Pending |
| FR-09 | 내가 본 공연: 등록/목록/삭제, 한줄 리뷰+별점(1~5), 좌석 입력, 예매처 선택 | Medium | Pending |
| FR-10 | KOPIS 배치: 매일 01:00 공연데이터 동기화, 공연시작일 기준 상태 자동 업데이트 | High | Pending |
| FR-11 | 공통코드: 장르/공연상태/가격대/관람연령/예매처/공연장소 DB 코드 관리 | Medium | Pending |
| FR-12 | SEO: 페이지별 meta tags, OG 태그, JSON-LD(Event 스키마), sitemap.xml 자동생성, robots.txt | High | Pending |
| FR-13 | Google AdSense: 광고 스크립트 삽입, 검색결과/상세/게시판 페이지 광고 슬롯 배치, ads.txt | Medium | Pending |
| FR-14 | 개인정보처리방침 페이지: 수집항목, 목적, 보유기간, 파기절차, 제3자 제공(Google 광고 쿠키) 명시 | High | Pending |
| FR-15 | 이용약관 페이지: 서비스 이용 조건, 면책사항 | High | Pending |
| FR-16 | 회원가입 동의: 필수(이용약관, 개인정보처리방침) / 선택(마케팅) 분리 체크박스 | High | Pending |
| FR-17 | 회원 탈퇴: 탈퇴 기능 + 개인정보 즉시 파기 + 게시글 작성자 "탈퇴회원" 처리 | High | Pending |
| FR-18 | 쿠키 동의 배너: AdSense 쿠키 사용 고지 + 동의/거부 선택 | Medium | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | 검색 결과 응답 < 500ms (캐시 적중 시 < 200ms) | Vercel Analytics |
| Performance | LCP < 2.5s, FID < 100ms, CLS < 0.1 | Lighthouse / Web Vitals |
| SEO | 공연 상세 모달에서 URL 변경 → 크롤러 접근 가능, JSON-LD Event 스키마 적용 | Google Search Console |
| SEO | sitemap.xml 자동 생성, robots.txt 설정, OG 이미지 동적 생성 | Google Search Console |
| Security | 비밀번호 bcrypt 해싱 (salt rounds ≥ 10) | 코드 리뷰 |
| Security | JWT Access Token 만료 15분 + Refresh Token 7일, httpOnly 쿠키 저장 | 코드 리뷰 |
| Security | DB 연결 SSL/TLS 암호화 (Neon 기본 지원) | 연결 설정 확인 |
| Security | 이메일 등 개인정보 컬럼 AES-256 암호화 또는 해싱 검토 | 코드 리뷰 |
| Security | XSS 방어 (게시판 입력 sanitize), CSRF 방어 (Auth.js 내장) | 보안 테스트 |
| Security | Rate limiting — 로그인 시도 5회/분, API 100회/분 | 미들웨어 로그 |
| Compliance | 개인정보보호법 제29조 안전성 확보 조치 준수 | 체크리스트 검증 |
| Compliance | 회원 탈퇴 시 개인정보 즉시 파기 (또는 법정 보유기간 후 파기) | 기능 테스트 |
| Availability | 배치 정상 가동률 99% | 로그 모니터링 |
| Responsive | 모바일(360px~) / 태블릿(768px~) / 데스크톱(1280px~) | 브라우저 테스트 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] 모든 Functional Requirements (FR-01 ~ FR-18) 구현 완료
- [ ] 공연 검색 → 예매처 연결 플로우 E2E 동작
- [ ] JWT 로그인/회원가입 + 소셜 로그인 동작
- [ ] KOPIS 배치 동기화 정상 동작
- [ ] 반응형 디자인 (모바일/태블릿/데스크톱) 검증
- [ ] 찜/내가본공연/커뮤니티 CRUD ���상 동작
- [ ] 개인정보처리방침 + 이용약관 페이지 완료
- [ ] 회원가입 동의 체크박스 (필수/선택 분리) 동작
- [ ] 회원 탈퇴 + 개인정보 파기 동작
- [ ] 쿠키 동의 배너 동작

### 4.2 Quality Criteria

- [ ] TypeScript strict mode 사용
- [ ] ESLint + Prettier 설정 완료
- [ ] Vercel 배포 성공
- [ ] Core Web Vitals 기준 충족
- [ ] Google Search Console 등록 및 sitemap 제출 완료
- [ ] AdSense 승인 및 광고 슬롯 정상 노출

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| KOPIS API 장애/변경 | High | Medium | 마지막 성공 배치 데이터 캐시 유지, 배치 실패 시 재시도 로직 |
| KOPIS API 일일 호출 제한 | Medium | Medium | 배치로 DB에 저장 후 서비스는 자체 DB 조회, API 직접 호출 최소화 |
| 소셜 로그인 OAuth 설정 복잡도 | Medium | Medium | NextAuth.js(Auth.js) 활용으로 간소화 |
| PostgreSQL 공연데이터 증가에 따른 성능 | Medium | Low | 인덱스 설계, 페이지네이션(커서 기반) 적용 |
| 예매처 URL 변경/만료 | Low | Medium | KOPIS 배치에서 URL도 함께 업데이트 |
| AdSense 승인 거절 | Medium | Medium | 충분한 콘텐츠(공연 데이터) 확보 후 신청, 정책 준수 사전 검토 |
| SEO 크롤링 지연 (SPA 특성) | Medium | Low | SSR/ISR 활용으로 크롤러 접근 보장, Next.js metadata API 활용 |
| 개인정보 유출 사고 | High | Low | bcrypt 해싱, DB 암호화, SSL, Rate limiting, 접근 로그 기록 |
| 개인정보보호법 위반 | High | Low | 개인정보처리방침 사전 작성, 동의 절차 구현, 탈퇴/파기 기능 |

---

## 6. Impact Analysis

> 신규 프로젝트이므로 기존 코드베이스에 대한 영향 없음.

### 6.1 Changed Resources

| Resource | Type | Change Description |
|----------|------|--------------------|
| performances | DB Table (신규) | 공연정보 테이블 — KOPIS 데이터 저장 |
| users | DB Table (신규) | 회원 정보 + 소셜 계정 연동 |
| favorites | DB Table (신규) | 찜 목록 |
| my_performances | DB Table (신규) | 내가 본 공연 (리뷰/별점/좌석/예매처) |
| board_posts | DB Table (신규) | 게시판 글 (익명/회원 통합) |
| board_comments | DB Table (신규) | 댓글 |
| common_codes | DB Table (신규) | 공통코드 (장르/상태/가격대/연령/예매처/장소) |

### 6.2 Current Consumers

신규 프로젝트 — 기존 소비자 없음.

### 6.3 Verification

- [x] 신규 프로젝트로 기존 코드 영향 없음

---

## 7. Architecture Considerations

### 7.1 Project Level Selection

| Level | Characteristics | Recommended For | Selected |
|-------|-----------------|-----------------|:--------:|
| **Starter** | Simple structure | Static sites, portfolios | ☐ |
| **Dynamic** | Feature-based modules, BaaS integration | Web apps with backend, SaaS MVPs | ☑ |
| **Enterprise** | Strict layer separation, DI, microservices | High-traffic systems | ☐ |

### 7.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| Framework | Next.js App Router | **Next.js 16 (App Router)** | SSR + SEO + API Routes 통합 |
| Rendering | SSR + SSG | **SSR (기본) + ISR (공연목록)** | 공연 데이터는 배치 갱신 → ISR 적합, 개인화 페이지는 SSR |
| State Management | Context / Zustand | **Zustand** | 경량, 찜/필터 등 클라이언트 상태 관리에 적합 |
| API Client | fetch / react-query | **TanStack Query + fetch** | 캐싱, 무한스크롤, 서버 상태 관리 |
| Form Handling | react-hook-form | **react-hook-form + zod** | 로그인/회원가입/리뷰 폼 유효성 검증 |
| Styling | Tailwind CSS | **Tailwind CSS** | 사용자 요구사항, 반응형 유틸리티 |
| Auth | NextAuth / custom | **Auth.js (NextAuth v5)** | Google/Kakao OAuth + JWT + Credentials 통합 |
| ORM | Prisma / Drizzle | **Prisma** | PostgreSQL 지원, 마이그레이션 관리 용이 |
| Database | PostgreSQL | **Neon Postgres (Vercel Marketplace)** | Serverless PostgreSQL, Vercel 네이티브 통합 |
| Batch | node-cron / Vercel Cron | **Vercel Cron Jobs** | vercel.json 설정으로 간편, 서버리스 호환 |
| Testing | Vitest / Playwright | **Vitest + Playwright** | 단위/E2E 분리 |
| SEO | Next.js metadata API | **generateMetadata + JSON-LD + sitemap.ts** | App Router 네이티브 SEO, 공연별 동적 메타 |
| Ads | Google AdSense | **@next/third-parties + Script** | AdSense 스크립트 삽입, 광고 슬롯 컴포넌트화 |
| App 확장 | PWA / React Native / WebView | **미정 (Phase 2+)** | 웹 완성 후 결정, API 분리 구조로 확장 대비 |

### 7.3 Clean Architecture Approach

```
Selected Level: Dynamic

Folder Structure Preview:
pickshow/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # 로그인/회원가입 라우트 그룹
│   │   ├── (main)/             # 메인 레이아웃 (검색/필터/목록)
│   │   │   ├── @modal/         # Parallel Routes — 공연 상세 모달 (URL 변경)
│   │   │   └── page.tsx        # 메인 검색 페이지
│   │   ├── community/          # 커뮤니티 게시판
│   │   ├── my/                 # 마이페이지 (찜, 내가본공연)
│   │   ├── privacy/            # 개인정보처리방침
│   │   ├── terms/              # 이용약관
│   │   ├── api/                # API Route Handlers
│   │   │   ├── auth/           # Auth.js 핸들러
│   │   │   ├── performances/   # 공연 검색 API
│   │   │   ├── favorites/      # 찜 API
│   │   │   ├── my-performances/# 내가본공연 API
│   │   │   ├── community/      # 게시판 API
│   │   │   └── cron/           # 배치 API (Vercel Cron)
│   │   └── layout.tsx          # 루트 레이아웃
│   ├── components/             # 공통 UI 컴포넌트
│   │   ├── ui/                 # 기본 UI (Button, Modal, Card 등)
│   │   ├── performance/        # 공연 관련 컴포넌트
│   │   ├── community/          # 게시판 컴포넌트
│   │   ├── layout/             # Header, Footer, Sidebar
│   │   └── ads/                # AdSense 광고 슬롯 컴포넌트
│   ├── features/               # 기능별 모듈
│   │   ├── auth/               # 인증 로직
│   │   ├── search/             # 검색/필터 로직
│   │   ├── favorite/           # 찜 로직
│   │   ├── my-performance/     # 내가본공연 로직
│   │   └── community/          # 커뮤니티 로직
│   ├── lib/                    # 유틸리티
│   │   ├── prisma.ts           # Prisma 클라이언트
│   │   ├── kopis.ts            # KOPIS API 클라이언트
│   │   ├── auth.ts             # Auth.js 설정
│   │   └── seo.ts              # SEO 유틸 (JSON-LD 생성, 메타 헬퍼)
│   ├── types/                  # TypeScript 타입 정의
│   └── styles/                 # 글로벌 스타일, 테마 변수
├── prisma/
│   ├── schema.prisma           # DB 스키마
│   └── seed.ts                 # 공통코드 시드 데이터
├── public/
│   ├── ads.txt                 # AdSense 인증 파일
│   ├── robots.txt              # 크롤러 접근 제어
│   └── ...                     # 정적 파일
├── .env.local                  # 로컬 환경변수
├── next.config.ts              # Next.js 설정
├── tailwind.config.ts          # Tailwind 설정 (민트+핑크 테마)
└── vercel.json                 # Vercel 설정 (Cron Jobs)
```

---

## 8. Privacy & Security Architecture

### 8.1 개인정보보호법 (PIPA) 준수 체크리스트

| 조항 | 요구사항 | 구현 방안 |
|------|----------|----------|
| 제15조 (수집·이용) | 최소 수집 원칙, 목적 명시 | 이메일, 비밀번호, 닉네임만 수집. 수집 목적 개인정보처리방침에 명시 |
| 제22조 (동의) | 필수/선택 동의 분리 | 회원가입 시 필수(이용약관, 개인정보) / 선택(마케팅) 체크박스 분리 |
| 제21조 (파기) | 목적 달성 시 파기 | 탈퇴 시 즉시 파기. 법정 보존 의무 데이터(전자상거래법 5년 등)만 별도 보관 후 파기 |
| 제29조 (안전조치) | 기술적·관리적 보호 | bcrypt, SSL/TLS, 접근 로그, Rate limiting |
| 제30조 (처리방침) | 공개 의무 | `/privacy` 페이지에 개인정보처리방침 공개 |

### 8.2 기술적 보안 조치

| 영역 | 조치 | 구현 |
|------|------|------|
| **비밀번호** | bcrypt 해싱 (salt rounds ≥ 10) | Auth.js Credentials provider 내 처리 |
| **JWT** | Access Token 15분 + Refresh Token 7일 (httpOnly 쿠키) | Auth.js JWT strategy + 쿠키 설정 |
| **DB 통신** | SSL/TLS 암호화 | Neon Postgres 기본 `sslmode=require` |
| **개인정보 암호화** | 이메일 AES-256 암호화 검토 (검색 필요 시 해시 인덱스) | Prisma middleware 또는 DB 레벨 암호화 |
| **XSS 방어** | 게시판 HTML 입력 sanitize | `DOMPurify` 또는 `sanitize-html` 적용 |
| **CSRF 방어** | Auth.js 내장 CSRF 토큰 | 기본 설정 유지 |
| **Rate Limiting** | 로그인 5회/분, API 100회/분 | Next.js proxy.ts + Upstash Ratelimit 또는 커스텀 미들웨어 |
| **접근 로그** | 개인정보 접근 기록 | API 레벨 로깅 (누가, 언제, 어떤 데이터 접근) |

### 8.3 회원 탈퇴 처리 흐름

```
회원 탈퇴 요청
  → 비밀번호 재확인 (본인 인증)
  → 개인정보 즉시 파기 (이메일, 비밀번호, 소셜 연동 정보)
  → 찜 목록, 내가 본 공연 데이터 삭제
  → 게시글/댓글 작성자 → "탈퇴회원" 치환 (콘텐츠는 유지)
  → JWT 토큰 무효화 (Refresh Token 삭제)
```

### 8.4 법적 페이지 구성

| 페이지 | 경로 | 내용 |
|--------|------|------|
| 개인정보처리방침 | `/privacy` | 수집항목, 목적, 보유기간, 파기, 제3자 제공(Google 쿠키), 정보주체 권리 |
| 이용약관 | `/terms` | 서비스 이용 조건, 지적재산권, 면책사항, 분쟁해결 |
| 쿠키 정책 | 배너 내 상세 링크 | AdSense/Analytics 쿠키 사용 고지, 동의/거부 |

---

## 9. Convention Prerequisites

### 8.1 Existing Project Conventions

- [ ] `CLAUDE.md` — 작성 예정
- [ ] ESLint configuration — Next.js 기본 + 커스텀 규칙
- [ ] Prettier configuration — 작성 예정
- [ ] TypeScript configuration — strict mode

### 8.2 Conventions to Define/Verify

| Category | Current State | To Define | Priority |
|----------|---------------|-----------|:--------:|
| **Naming** | missing | 컴포넌트: PascalCase, 함수: camelCase, DB: snake_case | High |
| **Folder structure** | missing | Dynamic 레벨 구조 (위 7.3 참조) | High |
| **Import order** | missing | 외부→내부→타입→스타일 순서 | Medium |
| **Environment variables** | missing | NEXT_PUBLIC_ 접두어 규칙 | High |
| **Error handling** | missing | API: 통일된 에러 응답 형식 `{ error, message, code }` | Medium |
| **API 응답 형식** | missing | `{ data, error, pagination }` 통일 | Medium |

### 8.3 Environment Variables Needed

| Variable | Purpose | Scope | To Be Created |
|----------|---------|-------|:-------------:|
| `DATABASE_URL` | Neon PostgreSQL 연결 문자열 | Server | ☐ |
| `NEXTAUTH_SECRET` | Auth.js JWT 서명 시크릿 | Server | ☐ |
| `NEXTAUTH_URL` | Auth.js 콜백 URL | Server | ☐ |
| `GOOGLE_CLIENT_ID` | Google OAuth 클라이언트 ID | Server | ☐ |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 시크릿 | Server | ☐ |
| `KAKAO_CLIENT_ID` | Kakao OAuth 앱 키 | Server | ☐ |
| `KAKAO_CLIENT_SECRET` | Kakao OAuth 시크릿 | Server | ☐ |
| `KOPIS_API_KEY` | KOPIS 오픈 API 인증 키 | Server | ☐ |
| `CRON_SECRET` | Vercel Cron Job 인증 시크릿 | Server | ☐ |
| `NEXT_PUBLIC_GA_ID` | Google AdSense 게시자 ID (ca-pub-xxx) | Client | ☐ |

### 8.4 Pipeline Integration

| Phase | Status | Document Location | Command |
|-------|:------:|-------------------|---------|
| Phase 1 (Schema) | ☐ | `docs/01-plan/schema.md` | `/phase-1-schema` |
| Phase 2 (Convention) | ☐ | `docs/01-plan/conventions.md` | `/phase-2-convention` |

---

## 9. SEO Strategy

### 9.1 페이지별 SEO 적용

| 페이지 | meta title 패턴 | JSON-LD | OG Image |
|--------|----------------|---------|----------|
| 메인 (검색) | "PickShow — 공연 예매처 통합 검색" | WebSite 스키마 | 정적 OG 이미지 |
| 공연 상세 | "{공연명} 예매처 — PickShow" | Event 스키마 (공연명, 날짜, 장소, 가격) | 동적 OG (공연 포스터) |
| 커뮤니티 글 | "{글 제목} — PickShow 커뮤니티" | Article 스키마 | 정적 OG |
| 마이페이지 | noindex 처리 | - | - |

### 9.2 기술 구현

- `generateMetadata()` — App Router 네이티브, 페이지별 동적 메타 태그
- `sitemap.ts` — 공연 데이터 기반 동적 sitemap 자동 생성
- `robots.ts` — 크롤러 접근 제어 (마이페이지, API 제외)
- JSON-LD — Event 스키마로 Google Rich Results 노출 (공연명, 일시, 장소, 가격)
- `@vercel/og` 또는 Satori — 공연 포스터 기반 동적 OG 이미지 생성
- Canonical URL — 모달 URL과 상세 페이지 URL 통일

### 9.3 Google Search Console

- sitemap.xml 제출
- 인덱싱 상태 모니터링
- Core Web Vitals 성능 추적

---

## 10. Google AdSense Strategy

### 10.1 광고 슬롯 배치

| 위치 | 광고 형태 | 페이지 |
|------|----------|--------|
| 검색결과 목록 사이 (5번째 항목 후) | 인피드 광고 | 메인 검색 |
| 공연 상세 모달 하단 | 디스플레이 배너 | 공연 상세 |
| 게시판 목록 사이 | 인피드 광고 | 커뮤니티 |
| 게시글 본문 하단 | 디스플레이 배너 | 게시글 상세 |
| 사이드바 (데스크톱) | 디스플레이 배너 | 전체 |

### 10.2 구현 방식

- `@next/third-parties` 또는 `next/script` — AdSense 스크립트 로드 (afterInteractive)
- `<AdSlot />` 공통 컴포넌트 — 위치별 광고 단위 ID 전달
- `ads.txt` — `public/ads.txt`에 Google 게시자 인증 파일
- 모바일에서는 광고 밀도 조절 (UX 우선)
- 로딩 성능: 광고 스크립트는 페이지 렌더 후 지연 로드

### 10.3 AdSense 승인 조건 대비

- 충분한 콘텐츠 확보 (KOPIS 배치로 공연 데이터 1,000건+ 확보 후 신청)
- 개인정보처리방침, 이용약관 페이지 필요
- 네비게이션, 연락처 정보 명시

---

## 11. App Extension Strategy (Phase 2+)

### 11.1 현재 결정 사항

- 앱 전환 방식: **미정** (웹 완성 후 결정)
- 후보: PWA / React Native (Expo) / WebView 앱

### 11.2 앱 확장을 위한 현재 설계 고려사항

| 고려사항 | 현재 적용 | 앱 확장 시 이점 |
|----------|----------|----------------|
| API Route Handlers 분리 | REST API 형태로 구현 | 앱에서 동일 API 호출 가능 |
| JWT 토큰 인증 | Auth.js + JWT | 앱에서 토큰 기반 인증 재사용 |
| 비즈니스 로직 features/ 분리 | UI와 로직 분리 | 앱에서 로직 재사용 가능 |
| 반응형 웹앱 | 모바일 최적화 완료 | PWA 전환 시 즉시 적용 가능 |

### 11.3 PWA 준비 사항 (가장 빠른 전환 경로)

- `manifest.json` — 앱 아이콘, 테마색, 시작 URL
- Service Worker — Next.js PWA 플러그인 (`next-pwa` 또는 `@serwist/next`)
- 현재 Phase 1에서는 PWA 미적용, 구조만 대비

---

## 12. Next Steps

1. [ ] Design 문서 작성 (`/pdca design pickshow`)
2. [ ] DB 스키마 설계 (Prisma schema)
3. [ ] 프로젝트 초기 세팅 (Next.js + Tailwind + Prisma + Auth.js)
4. [ ] KOPIS API 연동 테스트
5. [ ] 구현 시작

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-04 | Initial draft | kyungheelee |
| 0.2 | 2026-04-04 | SEO, Google AdSense, App Extension Strategy 추가 (Plan Plus) | kyungheelee |
| 0.3 | 2026-04-04 | 개인정보보안 요구사항 추가 (FR-14~18, §8 Privacy & Security) | kyungheelee |
