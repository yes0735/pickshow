# PickShow Design Document

> **Summary**: KOPIS 공연정보 기반 예매처 통합 검색 + 찜/리뷰/커뮤니티 반응형 웹앱 설계
>
> **Project**: PickShow (픽쇼)
> **Author**: kyungheelee
> **Date**: 2026-04-04
> **Status**: Draft
> **Planning Doc**: [pickshow.plan.md](../../01-plan/features/pickshow.plan.md)

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

## Design Anchor

| Category | Tokens |
|----------|--------|
| **Colors** | primary-mint: `#A8E6CF`, primary-pink: `#FFB7C5`, bg: `#FEFEFE`, text: `#333333`, accent: `#7EC8A0`, border: `#E8E8E8` |
| **Typography** | Pretendard (본문), sizes: 12/14/16/20/24/32px |
| **Spacing** | 4px grid, card-gap: 16px, section: 24px, page-padding: 16px(mobile) / 24px(desktop) |
| **Radius** | default: `8px`, card: `12px`, button: `8px`, modal: `16px` |
| **Tone** | 파스텔 봄 느낌, 밝고 깔끔, 민트+핑크 그라데이션 포인트 |
| **Layout** | 데스크톱: 사이드바 필터(240px) + 메인 콘텐츠, 모바일: 풀폭 + 필터 시트 |

---

## 1. Overview

### 1.1 Design Goals

- KOPIS 공연 데이터를 효율적으로 검색·표시하는 반응형 UI
- SEO 친화적 구조 (SSR + Parallel Routes 모달 + JSON-LD)
- 기능별 모듈 분리로 확장 가능한 코드 구조 (Phase 2 Admin, 앱 확장 대비)
- 개인정보보호법 준수 보안 아키텍처

### 1.2 Design Principles

- **Pragmatic Balance**: app/은 라우트+렌더링만, features/에 비즈니스 로직 위임
- **Server First**: 기본 Server Component, 인터랙션 필요한 부분만 'use client'
- **API 분리**: Route Handler는 검증+위임만, 실제 로직은 features/*/service.ts

---

## 2. Architecture Options

### 2.0 Architecture Comparison

| Criteria | Option A: Flat Simple | Option B: Clean Arch | Option C: Pragmatic |
|----------|:-:|:-:|:-:|
| **Approach** | 모든 로직 app/ 내 | 4레이어 완전 분리 | features/ 기능 분리 |
| **New Files** | ~50 | ~120 | ~80 |
| **Complexity** | Low | High | Medium |
| **Maintainability** | Medium | High | High |
| **Effort** | Low | High | Medium |
| **Risk** | 규모 커지면 스파게티 | 오버엔지니어링 | Balanced |

**Selected**: Option C — Pragmatic Balance
**Rationale**: Dynamic 레벨에 적합. features/ 기반 모듈 분리로 확장성 확보하면서 과도한 추상화 없이 실용적.

### 2.1 Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser (Client)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │  Zustand  │  │ TanStack │  │  Auth.js │  │ react-hook-   │  │
│  │  (Filter  │  │  Query   │  │ (Session)│  │ form + zod    │  │
│  │   State)  │  │ (Cache)  │  │          │  │               │  │
│  └──────────┘  └────┬─────┘  └──────────┘  └───────────────┘  │
└──────────────────────┼──────────────────────────────────────────┘
                       │ fetch
┌──────────────────────┼──────────────────────────────────────────┐
│              Next.js App Router (Server)                         │
│  ┌───────────┐  ┌────┴───────┐  ┌───────────┐  ┌────────────┐ │
│  │  proxy.ts  │  │ API Route  │  │  Server   │  │  Vercel    │ │
│  │ (Rate      │  │ Handlers   │  │ Components│  │  Cron Jobs │ │
│  │  Limit)    │  │ (Thin)     │  │ (SSR/ISR) │  │            │ │
│  └───────────┘  └────┬───────┘  └──────┬────┘  └─────┬──────┘ │
│                      │                  │              │        │
│  ┌───────────────────┴──────────────────┴──────────────┘       │
│  │              features/*/service.ts (Business Logic)          │
│  └──────────────────────┬──────────────────────────────┘       │
│                         │                                       │
│  ┌──────────┐  ┌───────┴──────┐  ┌────────────┐               │
│  │  Auth.js  │  │   Prisma     │  │ KOPIS API  │               │
│  │  (lib/)   │  │   (lib/)     │  │ Client     │               │
│  └──────────┘  └───────┬──────┘  └────────────┘               │
└──────────────────────────┼──────────────────────────────────────┘
                           │
                  ┌────────┴────────┐
                  │  Neon Postgres   │
                  │  (Vercel MKT)    │
                  └─────────────────┘
```

### 2.2 Data Flow

```
[공연 검색 흐름]
User Input → SearchBar → Zustand(filters) → TanStack Query
  → GET /api/performances?q=&genre=&... → features/search/service.ts
  → Prisma query (performances + common_codes) → JSON Response
  → 카드/리스트 렌더링 → 무한스크롤(Intersection Observer)

[공연 상세 모달]
카드 클릭 → Parallel Route (@modal) → URL 변경 (/performance/[id])
  → Server Component (SSR) → generateMetadata (SEO) → JSON-LD
  → 예매처 링크 목록 → 외부 사이트 이동

[배치 흐름]
Vercel Cron (01:00 KST) → POST /api/cron/sync-performances
  → CRON_SECRET 검증 → features/batch/service.ts
  → KOPIS API 호출 → 데이터 변환 → Prisma upsert
  → 공연상태 자동 업데이트 (시작일 기준)
```

### 2.3 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| Search Page | TanStack Query, Zustand | 필터 상태 + 서버 캐시 |
| Performance Modal | Parallel Routes | SEO 친화 모달 (URL 변경) |
| Auth | Auth.js, Prisma | 이메일/소셜 로그인, JWT |
| Community | Auth, Prisma | 게시판 CRUD, 댓글 |
| Favorites | Auth, Prisma | 로그인 사용자 찜 |
| My Performance | Auth, Prisma | 내가 본 공연 기록 |
| Batch | Vercel Cron, KOPIS Client | 일일 데이터 동기화 |
| AdSense | next/script | 광고 슬롯 렌더링 |
| SEO | generateMetadata, sitemap.ts | 크롤러 + 소셜 미디어 |

---

## 3. Data Model

### 3.1 Entity Definition

```typescript
// 사용자
interface User {
  id: string;                // UUID
  email: string;             // 암호화 저장
  password: string | null;   // bcrypt 해싱 (소셜 로그인은 null)
  nickname: string;
  provider: 'email' | 'google' | 'kakao';
  providerId: string | null; // 소셜 계정 ID
  agreeTerms: boolean;       // 이용약관 동의
  agreePrivacy: boolean;     // 개인정보 동의
  agreeMarketing: boolean;   // 마케팅 동의 (선택)
  isDeleted: boolean;        // 소프트 삭제 (탈퇴)
  createdAt: Date;
  updatedAt: Date;
}

// 공연정보 (KOPIS 데이터)
interface Performance {
  id: string;                // UUID
  kopisId: string;           // KOPIS 고유 ID (unique)
  title: string;             // 공연명
  genre: string;             // 장르 코드 (common_codes FK)
  startDate: Date;           // 공연 시작일
  endDate: Date;             // 공연 종료일
  venue: string;             // 공연장소
  venueAddress: string;      // 공연장 주소
  status: string;            // 공연상태 코드 (예정/공연중/완료)
  posterUrl: string | null;  // 포스터 이미지 URL
  price: string;             // 가격 정보 (텍스트)
  minPrice: number | null;   // 최소 가격 (정렬용)
  maxPrice: number | null;   // 최대 가격
  ageLimit: string;          // 관람연령
  runtime: string | null;    // 공연시간
  cast: string | null;       // 출연진
  synopsis: string | null;   // 줄거리
  ticketUrls: Json;          // 예매처 URL 목록 [{name, url}]
  createdAt: Date;
  updatedAt: Date;
}

// 찜
interface Favorite {
  id: string;
  userId: string;            // FK → User
  performanceId: string;     // FK → Performance
  createdAt: Date;
}

// 내가 본 공연
interface MyPerformance {
  id: string;
  userId: string;            // FK → User
  performanceId: string;     // FK → Performance
  rating: number;            // 별점 1~5
  review: string | null;     // 한줄 리뷰
  seatInfo: string | null;   // 좌석 정보
  ticketSite: string | null; // 예매처 코드
  viewedAt: Date | null;     // 관람 날짜
  createdAt: Date;
  updatedAt: Date;
}

// 게시판 글
interface BoardPost {
  id: string;
  boardType: 'anonymous' | 'member'; // 익명/회원
  category: string;          // 홍보/정보/구함/양도
  title: string;
  content: string;
  authorId: string | null;   // FK → User (익명은 null)
  authorNickname: string;    // 작성자 닉네임 (익명: 직접입력, 회원: User.nickname)
  anonymousPassword: string | null; // 익명글 비밀번호 (bcrypt)
  viewCount: number;
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// 댓글
interface BoardComment {
  id: string;
  postId: string;            // FK → BoardPost
  authorId: string | null;   // FK → User
  authorNickname: string;
  content: string;
  anonymousPassword: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// 공통코드
interface CommonCode {
  id: string;
  group: string;             // 그룹: genre, status, price_range, age_limit, ticket_site, venue
  code: string;              // 코드값
  label: string;             // 표시명
  sortOrder: number;         // 정렬순서
  isActive: boolean;
}
```

### 3.2 Entity Relationships

```
[User] 1 ──── N [Favorite] N ──── 1 [Performance]
  │
  ├── 1 ──── N [MyPerformance] N ──── 1 [Performance]
  │
  ├── 1 ──── N [BoardPost]
  │                 │
  │                 └── 1 ──── N [BoardComment]
  │
  └── 1 ──── N [BoardComment]

[CommonCode] ←── filter lookup ──── [Performance]
```

### 3.3 Database Schema (Prisma)

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
}

model User {
  id              String   @id @default(uuid())
  email           String   @unique
  password        String?
  nickname        String
  provider        String   @default("email") // email | google | kakao
  providerId      String?
  agreeTerms      Boolean  @default(false)
  agreePrivacy    Boolean  @default(false)
  agreeMarketing  Boolean  @default(false)
  isDeleted       Boolean  @default(false)
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  favorites       Favorite[]
  myPerformances  MyPerformance[]
  boardPosts      BoardPost[]
  boardComments   BoardComment[]

  @@map("users")
}

model Performance {
  id           String   @id @default(uuid())
  kopisId      String   @unique @map("kopis_id")
  title        String
  genre        String
  startDate    DateTime @map("start_date")
  endDate      DateTime @map("end_date")
  venue        String
  venueAddress String   @default("") @map("venue_address")
  status       String   @default("upcoming")
  posterUrl    String?  @map("poster_url")
  price        String   @default("")
  minPrice     Int?     @map("min_price")
  maxPrice     Int?     @map("max_price")
  ageLimit     String   @default("") @map("age_limit")
  runtime      String?
  cast         String?
  synopsis     String?
  ticketUrls   Json     @default("[]") @map("ticket_urls")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  favorites       Favorite[]
  myPerformances  MyPerformance[]

  @@index([genre])
  @@index([status])
  @@index([startDate])
  @@index([minPrice])
  @@index([title])
  @@map("performances")
}

model Favorite {
  id            String      @id @default(uuid())
  userId        String      @map("user_id")
  performanceId String      @map("performance_id")
  createdAt     DateTime    @default(now()) @map("created_at")

  user          User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  performance   Performance @relation(fields: [performanceId], references: [id], onDelete: Cascade)

  @@unique([userId, performanceId])
  @@map("favorites")
}

model MyPerformance {
  id            String      @id @default(uuid())
  userId        String      @map("user_id")
  performanceId String      @map("performance_id")
  rating        Int         @default(0)
  review        String?
  seatInfo      String?     @map("seat_info")
  ticketSite    String?     @map("ticket_site")
  viewedAt      DateTime?   @map("viewed_at")
  createdAt     DateTime    @default(now()) @map("created_at")
  updatedAt     DateTime    @updatedAt @map("updated_at")

  user          User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  performance   Performance @relation(fields: [performanceId], references: [id], onDelete: Cascade)

  @@unique([userId, performanceId])
  @@map("my_performances")
}

model BoardPost {
  id                String   @id @default(uuid())
  boardType         String   @map("board_type") // anonymous | member
  category          String
  title             String
  content           String
  authorId          String?  @map("author_id")
  authorNickname    String   @map("author_nickname")
  anonymousPassword String?  @map("anonymous_password")
  viewCount         Int      @default(0) @map("view_count")
  commentCount      Int      @default(0) @map("comment_count")
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")

  author            User?    @relation(fields: [authorId], references: [id], onDelete: SetNull)
  comments          BoardComment[]

  @@index([boardType, category])
  @@index([createdAt])
  @@map("board_posts")
}

model BoardComment {
  id                String   @id @default(uuid())
  postId            String   @map("post_id")
  authorId          String?  @map("author_id")
  authorNickname    String   @map("author_nickname")
  content           String
  anonymousPassword String?  @map("anonymous_password")
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")

  post              BoardPost @relation(fields: [postId], references: [id], onDelete: Cascade)
  author            User?     @relation(fields: [authorId], references: [id], onDelete: SetNull)

  @@index([postId])
  @@map("board_comments")
}

model CommonCode {
  id        String  @id @default(uuid())
  group     String
  code      String
  label     String
  sortOrder Int     @default(0) @map("sort_order")
  isActive  Boolean @default(true) @map("is_active")

  @@unique([group, code])
  @@index([group])
  @@map("common_codes")
}
```

---

## 4. API Specification

### 4.1 Endpoint List

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/performances` | 공연 검색 (필터, 정렬, 페이징) | No |
| GET | `/api/performances/[id]` | 공연 상세 | No |
| GET | `/api/common-codes` | 공통코드 조회 (필터 옵션) | No |
| POST | `/api/auth/register` | 이메일 회원가입 | No |
| POST | `/api/auth/[...nextauth]` | Auth.js 핸들러 (로그인/소셜) | No |
| DELETE | `/api/auth/withdraw` | 회원 탈퇴 + 개인정보 파기 | Required |
| GET | `/api/favorites` | 내 찜 목록 | Required |
| POST | `/api/favorites` | 찜 등록 | Required |
| DELETE | `/api/favorites/[id]` | 찜 해제 | Required |
| GET | `/api/my-performances` | 내가 본 공연 목록 | Required |
| POST | `/api/my-performances` | 내가 본 공연 등록 | Required |
| PUT | `/api/my-performances/[id]` | 내가 본 공연 수정 | Required |
| DELETE | `/api/my-performances/[id]` | 내가 본 공연 삭제 | Required |
| GET | `/api/community/posts` | 게시글 목록 (boardType, category 필터) | No |
| GET | `/api/community/posts/[id]` | 게시글 상세 + 댓글 | No |
| POST | `/api/community/posts` | 게시글 작성 | Conditional |
| PUT | `/api/community/posts/[id]` | 게시글 수정 | Conditional |
| DELETE | `/api/community/posts/[id]` | 게시글 삭제 | Conditional |
| POST | `/api/community/posts/[id]/comments` | 댓글 작성 | Conditional |
| DELETE | `/api/community/comments/[id]` | 댓글 삭제 | Conditional |
| POST | `/api/cron/sync-performances` | KOPIS 배치 동기화 | CRON_SECRET |

> **Conditional Auth**: 회원 게시판은 로그인 필수, 익명 게시판은 닉네임+비밀번호

### 4.2 공통 응답 형식

```typescript
// 성공
{ data: T, pagination?: { page: number, total: number, hasNext: boolean } }

// 에러
{ error: { code: string, message: string, details?: Record<string, string[]> } }
```

### 4.3 주요 API 상세

#### `GET /api/performances`

```typescript
// Query Parameters
{
  q?: string;           // 통합 검색어 (제목, 출연진)
  genre?: string;       // 장르 코드
  status?: string;      // 공연상태 코드
  startDate?: string;   // 시작일 (YYYY-MM-DD)
  endDate?: string;     // 종료일
  minPrice?: number;    // 최소 가격
  maxPrice?: number;    // 최대 가격
  ageLimit?: string;    // 관람연령
  ticketSite?: string;  // 예매처
  venue?: string;       // 공연장소
  sort?: 'date' | 'price_asc' | 'price_desc';  // 정렬
  cursor?: string;      // 무한스크롤 커서
  limit?: number;       // 페이지 크기 (기본 10)
}

// Response 200
{
  data: Performance[],
  pagination: { cursor: string | null, hasNext: boolean, total: number }
}
```

#### `POST /api/auth/register`

```typescript
// Request Body (zod validated)
{
  email: string;        // 이메일 형식 검증
  password: string;     // 최소 8자, 영문+숫자
  nickname: string;     // 2~20자
  agreeTerms: true;     // 필수
  agreePrivacy: true;   // 필수
  agreeMarketing?: boolean; // 선택
}

// Response 201
{ data: { id: string, email: string, nickname: string } }

// Error 409: 이미 가입된 이메일
```

#### `DELETE /api/auth/withdraw`

```typescript
// Request Body
{ password: string }  // 본인 확인 (소셜 로그인은 생략)

// 처리 흐름:
// 1. User.isDeleted = true, email/password/providerId 파기
// 2. Favorites, MyPerformances 삭제
// 3. BoardPost/BoardComment의 authorNickname → "탈퇴회원"
// 4. Session/JWT 무효화

// Response 200
{ data: { message: "회원 탈퇴가 완료되었습니다." } }
```

---

## 5. UI/UX Design

### 5.1 Screen Layout

```
┌──────────────────────────────────────────────────────────┐
│  Header: [Logo] [━━━━━━ 통합검색 ━━━━━━] [로그인/마이]   │
├──────────────────────────────────────────────────────────┤
│          │                                               │
│  필터     │  메인 콘텐츠                                   │
│  사이드바 │  ┌────────────────────────────────┐           │
│  (240px) │  │ [카드뷰|리스트뷰] [정렬▼]       │           │
│          │  ├────────────────────────────────┤           │
│  장르     │  │ ┌──────┐ ┌──────┐ ┌──────┐   │           │
│  공연기간 │  │ │ Card │ │ Card │ │ Card │   │           │
│  공연상태 │  │ └──────┘ └──────┘ └──────┘   │           │
│  가격대   │  │ ┌──────┐ ┌──────┐ ┌──────┐   │           │
│  관람연령 │  │ │ Card │ │ Card │ │ Card │   │           │
│  예매처   │  │ └──────┘ └──────┘ └──────┘   │           │
│  공연장소 │  │          [AdSense]             │           │
│          │  │ ┌──────┐ ┌──────┐ ┌──────┐   │           │
│  [AdSense]│  │ │ Card │ │ Card │ │ Card │   │           │
│          │  │ └──────┘ └──────┘ └──────┘   │           │
│          │  │     ∞ 무한스크롤 로딩 ...       │           │
│          │  └────────────────────────────────┘           │
├──────────────────────────────────────────────────────────┤
│  Footer: 개인정보처리방침 | 이용약관 | 쿠키 설정           │
└──────────────────────────────────────────────────────────┘

[모바일 Layout]
┌──────────────────┐
│ [☰] [Logo] [🔍]  │
├──────────────────┤
│ [필터 시트 열기▼]  │
├──────────────────┤
│ [카드|리스트] [정렬]│
│ ┌──────────────┐ │
│ │    Card      │ │
│ └──────────────┘ │
│ ┌──────────────┐ │
│ │    Card      │ │
│ └──────────────┘ │
│   [AdSense]      │
│ ┌──────────────┐ │
│ │    Card      │ │
│ └──────────────┘ │
│   ∞ 무한스크롤    │
└──────────────────┘
```

### 5.2 User Flow

```
[비로그인 사용자]
메인(검색) → 필터 적용 → 공연 카드 클릭 → 상세 모달(URL 변경)
  → 예매처 링크 클릭 → 외부 사이트 이동

[로그인 사용자]
메인 → 로그인(/login) → 메인(찜 버튼 활성화)
  → 찜 등록 → 마이페이지(/my/favorites)
  → 내가 본 공연 등록(/my/performances)
  → 커뮤니티(/community/member)

[회원가입]
로그인 페이지 → 회원가입 → 동의 체크(필수/선택) → 가입 완료 → 자동 로그인

[회원 탈퇴]
마이페이지 → 설정 → 회원 탈퇴 → 비밀번호 확인 → 탈퇴 완료 → 메인
```

### 5.3 Component List

| Component | Location | Responsibility |
|-----------|----------|----------------|
| `Header` | components/layout/ | 로고, 통합검색, 로그인/마이페이지 링크 |
| `Footer` | components/layout/ | 법적 페이지 링크, 저작권 |
| `SearchBar` | components/layout/ | 통합검색 입력, 디바운스 |
| `FilterSidebar` | components/performance/ | 7종 필터 UI (데스크톱: 사이드바, 모바일: 시트) |
| `PerformanceCard` | components/performance/ | 공연 카드 (포스터, 제목, 기간, 가격, 찜) |
| `PerformanceList` | components/performance/ | 공연 리스트 행 |
| `ViewToggle` | components/performance/ | 카드뷰/리스트뷰 전환 |
| `SortSelect` | components/performance/ | 정렬 셀렉트박스 |
| `PerformanceModal` | components/performance/ | 공연 상세 모달 (Parallel Routes) |
| `TicketLinkList` | components/performance/ | 예매처 링크 목록 |
| `FavoriteButton` | components/performance/ | 찜 등록/해제 토글 |
| `MyPerfButton` | components/performance/ | 내가 본 공연 등록 버튼 |
| `InfiniteScroll` | components/ui/ | Intersection Observer 기반 무한스크롤 |
| `PostList` | components/community/ | 게시글 목록 |
| `PostForm` | components/community/ | 게시글 작성/수정 폼 |
| `CommentList` | components/community/ | 댓글 목록 |
| `AdSlot` | components/ads/ | AdSense 광고 슬롯 |
| `CookieConsent` | components/ui/ | 쿠키 동의 배너 |
| `LoginForm` | components/auth/ | 이메일/소셜 로그인 폼 |
| `RegisterForm` | components/auth/ | 회원가입 폼 (동의 체크 포함) |

### 5.4 Page UI Checklist

#### 메인 검색 페이지 (`/`)

- [ ] SearchBar: 통합검색 입력창 (placeholder: "공연명, 출연진 검색")
- [ ] FilterSidebar: 장르 체크박스 (뮤지컬/연극/콘서트/클래식/무용/국악/기타)
- [ ] FilterSidebar: 공연기간 날짜 범위 선택 (DatePicker)
- [ ] FilterSidebar: 공연상태 라디오 (전체/공연예정/공연중/공연완료)
- [ ] FilterSidebar: 가격대 범위 슬라이더 (0~50만원+)
- [ ] FilterSidebar: 관람연령 체크박스 (전체관람/12세/15세/19세)
- [ ] FilterSidebar: 예매처 체크박스 (인터파크/YES24/멜론/티켓링크 등)
- [ ] FilterSidebar: 공연장소 검색 입력
- [ ] ViewToggle: 카드뷰/리스트뷰 전환 버튼
- [ ] SortSelect: 정렬 (날짜순/가격낮은순/가격높은순)
- [ ] PerformanceCard: 포스터, 제목, 기간, 장소, 가격, 찜버튼, 내가본공연버튼
- [ ] InfiniteScroll: 10개씩 로딩, 스켈레톤 UI
- [ ] AdSlot: 검색결과 5번째 항목 후 인피드 광고
- [ ] 결과 없음: "검색 결과가 없습니다" 빈 상태

#### 공연 상세 모달 (`/performance/[id]`)

- [ ] 공연 포스터 이미지 (큰 사이즈)
- [ ] 공연명, 장르, 공연기간, 공연장소, 관람연령, 러닝타임
- [ ] 가격 정보
- [ ] 출연진 정보
- [ ] 줄거리/소개
- [ ] TicketLinkList: 예매처 목록 (버튼 형태, 클릭 시 새 탭)
- [ ] FavoriteButton: 찜 등록/해제 (로그인 시)
- [ ] MyPerfButton: 내가 본 공연 등록 (로그인 시)
- [ ] 공유 버튼 (URL 복사)
- [ ] AdSlot: 모달 하단 디스플레이 배너
- [ ] 닫기 버튼 (X)

#### 로그인 페이지 (`/login`)

- [ ] 이메일 입력 + 비밀번호 입력
- [ ] 로그인 버튼
- [ ] Google 소셜 로그인 버튼
- [ ] Kakao 소셜 로그인 버튼
- [ ] 회원가입 링크

#### 회원가입 페이지 (`/register`)

- [ ] 이메일, 비밀번호, 비밀번호 확인, 닉네임 입력
- [ ] 필수 동의: 이용약관 동의 (링크), 개인정보처리방침 동의 (링크)
- [ ] 선택 동의: 마케팅 수신 동의
- [ ] 전체 동의 체크박스
- [ ] 가입 버튼 (필수 동의 미완료 시 비활성화)

#### 마이페이지 — 찜 목록 (`/my/favorites`)

- [ ] 찜한 공연 카드 목록
- [ ] 찜 해제 버튼
- [ ] 빈 상태: "찜한 공연이 없습니다"

#### 마이페이지 — 내가 본 공연 (`/my/performances`)

- [ ] 내가 본 공연 카드 목록 (별점, 한줄리뷰 표시)
- [ ] 등록 버튼
- [ ] 수정/삭제 버튼
- [ ] 등록 폼: 공연 선택, 별점(1~5 별), 한줄리뷰, 좌석정보, 예매처 선택

#### 커뮤니티 — 게시판 (`/community/[type]`)

- [ ] 탭: 익명게시판 / 회원게시판
- [ ] 카테고리 필터: 전체/홍보/정보/구함 (회원: +양도)
- [ ] 게시글 목록 (제목, 작성자, 날짜, 조회수, 댓글수)
- [ ] 글쓰기 버튼
- [ ] 페이지네이션 (게시판은 전통 페이징)
- [ ] AdSlot: 목록 사이 인피드 광고

#### 커뮤니티 — 게시글 상세 (`/community/[type]/[id]`)

- [ ] 제목, 작성자, 날짜, 조회수
- [ ] 본문 내용
- [ ] 수정/삭제 버튼 (본인 글만)
- [ ] 댓글 목록 (작성자, 내용, 날짜)
- [ ] 댓글 작성 폼
- [ ] AdSlot: 본문 하단 디스플레이 배너

---

## 6. Error Handling

### 6.1 Error Code Definition

| Code | Message | Cause | Handling |
|------|---------|-------|----------|
| 400 | 입력값이 올바르지 않습니다 | Zod 유효성 검증 실패 | fieldErrors 표시 |
| 401 | 로그인이 필요합니다 | 미인증 접근 | 로그인 페이지 리다이렉트 |
| 403 | 권한이 없습니다 | 다른 사용자 리소스 접근 | 에러 토스트 |
| 404 | 찾을 수 없습니다 | 존재하지 않는 리소스 | 404 페이지 |
| 409 | 이미 존재합니다 | 중복 데이터 (이메일, 찜) | 에러 메시지 표시 |
| 429 | 요청이 너무 많습니다 | Rate limit 초과 | 재시도 안내 |
| 500 | 서버 오류가 발생했습니다 | 내부 오류 | 에러 페이지 + 로그 |

### 6.2 Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "입력값이 올바르지 않습니다",
    "details": {
      "fieldErrors": {
        "email": ["이메일 형식이 올바르지 않습니다"],
        "password": ["비밀번호는 8자 이상이어야 합니다"]
      }
    }
  }
}
```

---

## 7. Security Considerations

- [x] 비밀번호 bcrypt 해싱 (salt rounds ≥ 10)
- [x] JWT Access 15min + Refresh 7d (httpOnly secure 쿠키)
- [x] DB SSL/TLS (Neon 기본)
- [x] XSS 방어 — 게시판 입력 DOMPurify sanitize
- [x] CSRF 방어 — Auth.js 내장 토큰
- [x] Rate Limiting — proxy.ts에서 Upstash Ratelimit
- [x] 입력 유효성 — 모든 API에 zod 스키마 검증
- [x] 회원 탈퇴 시 개인정보 즉시 파기
- [x] 쿠키 동의 배너 (AdSense)
- [x] 개인정보처리방침 + 이용약관 페이지

---

## 8. Test Plan

### 8.1 Test Scope

| Type | Target | Tool | Phase |
|------|--------|------|-------|
| L1: API Tests | 모든 API 엔드포인트 상태코드/응답 형태 | curl / Vitest | Do |
| L2: UI Action Tests | 페이지별 인터랙션 (필터, 폼, 찜) | Playwright | Do |
| L3: E2E Scenario Tests | 사용자 시나리오 (검색→상세→찜, 가입→로그인→게시글) | Playwright | Do |

### 8.2 L1: API Test Scenarios

| # | Endpoint | Method | Test Description | Expected |
|---|----------|--------|-----------------|----------|
| 1 | /api/performances | GET | 기본 검색 반환 | 200, data array, pagination |
| 2 | /api/performances?genre=musical | GET | 장르 필터 적용 | 200, 결과 감소 |
| 3 | /api/performances?sort=price_asc | GET | 가격순 정렬 | 200, minPrice 오름차순 |
| 4 | /api/performances/[id] | GET | 상세 조회 | 200, ticketUrls 포함 |
| 5 | /api/favorites | POST | 미인증 찜 시도 | 401 |
| 6 | /api/favorites | POST | 인증 후 찜 등록 | 201 |
| 7 | /api/favorites | POST | 중복 찜 | 409 |
| 8 | /api/auth/register | POST | 유효한 가입 | 201 |
| 9 | /api/auth/register | POST | 중복 이메일 | 409 |
| 10 | /api/auth/register | POST | 필수 동의 미체크 | 400 |
| 11 | /api/community/posts | POST | 익명 글 작성 | 201 |
| 12 | /api/cron/sync-performances | POST | CRON_SECRET 없이 | 401 |

### 8.3 L2: UI Action Test Scenarios

| # | Page | Action | Expected Result |
|---|------|--------|----------------|
| 1 | 메인 | 로드 | 검색바, 필터, 카드 10개 표시 |
| 2 | 메인 | 장르 필터 클릭 | 결과 갱신, 카드 수 변경 |
| 3 | 메인 | 카드 클릭 | 모달 열림, URL 변경 |
| 4 | 메인 | 뷰 전환 | 카드↔리스트 전환 |
| 5 | 메인 | 스크롤 하단 | 추가 10개 로딩 |
| 6 | 모달 | 예매처 링크 클릭 | 새 탭 열림 |
| 7 | 로그인 | 유효한 로그인 | 메인 리다이렉트 |
| 8 | 회원가입 | 필수 동의 미체크 | 가입 버튼 비활성화 |
| 9 | 찜 목록 | 찜 해제 | 목록에서 제거 |

### 8.4 L3: E2E Scenario Test Scenarios

| # | Scenario | Steps | Success Criteria |
|---|----------|-------|-----------------|
| 1 | 비로그인 검색→예매 | 메인→검색→필터→카드→모달→예매처 링크 | 전체 플로우 동작, URL 변경됨 |
| 2 | 회원가입→찜 | 가입→동의→로그인→메인→찜→마이 | 찜 목록에 표시 |
| 3 | 내가 본 공연 | 로그인→상세→내가본공연 등록→마이 | 리뷰+별점 표시 |
| 4 | 커뮤니티 | 로그인→회원게시판→글작성→댓글 | 글+댓글 목록 표시 |
| 5 | 회원탈퇴 | 로그인→마이→탈퇴→메인 | 로그아웃됨, 게시글 "탈퇴회원" |

### 8.5 Seed Data Requirements

| Entity | Minimum Count | Key Fields Required |
|--------|:------------:|---------------------|
| Performance | 50 | title, genre, dates, ticketUrls(1+), minPrice |
| CommonCode | 40+ | 장르 7개, 상태 3개, 가격대 5개, 연령 4개, 예매처 5개, 장소 10+ |
| User | 3 | email(test), google, kakao 각 1명 |
| BoardPost | 10 | 익명 5개 + 회원 5개, 카테고리 분산 |

---

## 9. Clean Architecture

### 9.1 Layer Structure

| Layer | Responsibility | Location |
|-------|---------------|----------|
| **Presentation** | 페이지 렌더링, 사용자 입력 처리 | `src/app/`, `src/components/` |
| **Application** | 비즈니스 로직, 데이터 변환, 유효성 검증 | `src/features/*/service.ts`, `src/features/*/schema.ts` |
| **Domain** | 엔티티 타입, 비즈니스 규칙 | `src/types/` |
| **Infrastructure** | DB 클라이언트, 외부 API, 인증 | `src/lib/` |

### 9.2 Dependency Rules

```
Presentation (app/, components/)
  → Application (features/*/service.ts)
    → Domain (types/)
    → Infrastructure (lib/prisma, lib/kopis, lib/auth)
```

### 9.3 This Feature's Layer Assignment

| Component | Layer | Location |
|-----------|-------|----------|
| SearchPage, PerformanceModal | Presentation | `src/app/(main)/` |
| PerformanceCard, FilterSidebar | Presentation | `src/components/performance/` |
| searchService, favoriteService | Application | `src/features/search/service.ts` |
| performanceSchema (zod) | Application | `src/features/search/schema.ts` |
| Performance, User, BoardPost types | Domain | `src/types/` |
| prisma, kopisClient, auth config | Infrastructure | `src/lib/` |

---

## 10. Coding Convention Reference

### 10.1 Naming Conventions

| Target | Rule | Example |
|--------|------|---------|
| Components | PascalCase | `PerformanceCard`, `FilterSidebar` |
| Functions | camelCase | `searchPerformances()`, `toggleFavorite()` |
| Constants | UPPER_SNAKE_CASE | `MAX_PAGE_SIZE`, `KOPIS_BASE_URL` |
| Types | PascalCase | `Performance`, `BoardPost` |
| Files (component) | PascalCase.tsx | `PerformanceCard.tsx` |
| Files (utility) | camelCase.ts | `searchService.ts` |
| Folders | kebab-case | `my-performances/`, `board-comments/` |
| DB columns | snake_case | `created_at`, `board_type` |
| API paths | kebab-case | `/api/my-performances`, `/api/common-codes` |

### 10.2 Environment Variables

| Variable | Prefix | Scope |
|----------|--------|-------|
| `DATABASE_URL` | - | Server |
| `NEXTAUTH_SECRET` | - | Server |
| `GOOGLE_CLIENT_ID` | - | Server |
| `KAKAO_CLIENT_ID` | - | Server |
| `KOPIS_API_KEY` | - | Server |
| `CRON_SECRET` | - | Server |
| `NEXT_PUBLIC_GA_ID` | NEXT_PUBLIC_ | Client |

---

## 11. Implementation Guide

### 11.1 File Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (main)/
│   │   ├── @modal/(.)performance/[id]/page.tsx  # Intercepting Route
│   │   ├── performance/[id]/page.tsx             # Direct URL (SEO)
│   │   ├── layout.tsx                            # 검색+필터 레이아웃
│   │   └── page.tsx                              # 메인 검색
│   ├── community/
│   │   ├── [type]/
│   │   │   ├── [id]/page.tsx                     # 게시글 상세
│   │   │   ├── write/page.tsx                    # 글쓰기
│   │   │   └── page.tsx                          # 게시판 목록
│   │   └── page.tsx                              # 커뮤니티 메인
│   ├── my/
│   │   ├── favorites/page.tsx
│   │   ├── performances/page.tsx
│   │   └── settings/page.tsx                     # 회원탈퇴 포함
│   ├── privacy/page.tsx
│   ├── terms/page.tsx
│   ├── api/                                      # Route Handlers
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── auth/register/route.ts
│   │   ├── auth/withdraw/route.ts
│   │   ├── performances/route.ts
│   │   ├── performances/[id]/route.ts
│   │   ├── favorites/route.ts
│   │   ├── favorites/[id]/route.ts
│   │   ├── my-performances/route.ts
│   │   ├── my-performances/[id]/route.ts
│   │   ├── community/posts/route.ts
│   │   ├── community/posts/[id]/route.ts
│   │   ├── community/posts/[id]/comments/route.ts
│   │   ├── community/comments/[id]/route.ts
│   │   ├── common-codes/route.ts
│   │   └── cron/sync-performances/route.ts
│   ├── sitemap.ts
│   ├── robots.ts
│   ├── layout.tsx                                # Root layout
│   └── not-found.tsx
├── components/
│   ├── ui/                    # InfiniteScroll, CookieConsent, Skeleton 등
│   ├── performance/           # PerformanceCard, FilterSidebar, Modal 등
│   ├── community/             # PostList, PostForm, CommentList
│   ├── auth/                  # LoginForm, RegisterForm
│   ├── layout/                # Header, Footer, SearchBar
│   └── ads/                   # AdSlot
├── features/
│   ├── search/
│   │   ├── service.ts         # searchPerformances(), getPerformanceDetail()
│   │   ├── schema.ts          # zod validation schemas
│   │   └── hooks.ts           # useSearchPerformances(), useFilters()
│   ├── auth/
│   │   ├── service.ts         # register(), withdraw()
│   │   └── schema.ts
│   ├── favorite/
│   │   ├── service.ts         # toggleFavorite(), getFavorites()
│   │   └── hooks.ts
│   ├── my-performance/
│   │   ├── service.ts         # addMyPerformance(), getMyPerformances()
│   │   └── schema.ts
│   ├── community/
│   │   ├── service.ts         # createPost(), getComments()
│   │   └── schema.ts
│   └── batch/
│       └── service.ts         # syncFromKopis(), updateStatuses()
├── lib/
│   ├── prisma.ts              # Prisma client singleton
│   ├── auth.ts                # Auth.js config (providers, callbacks)
│   ├── kopis.ts               # KOPIS API client (XML→JSON 변환)
│   ├── seo.ts                 # JSON-LD helpers, metadata utils
│   └── utils.ts               # 공통 유틸 (formatDate, formatPrice 등)
├── types/
│   ├── performance.ts
│   ├── user.ts
│   ├── community.ts
│   └── common.ts              # ApiResponse, Pagination 등
└── styles/
    └── globals.css            # Tailwind + 테마 변수
```

### 11.2 Implementation Order

1. [ ] **프로젝트 초기화**: Next.js + Tailwind + Prisma + Auth.js 세팅
2. [ ] **DB 스키마**: Prisma schema 작성 + 마이그레이션 + seed
3. [ ] **공통 인프라**: lib/ (prisma, auth, kopis, seo, utils)
4. [ ] **공통 UI**: components/ui/ + layout/ (Header, Footer, 테마)
5. [ ] **공연 검색**: features/search + API + 메인 페이지 + 필터
6. [ ] **공연 상세 모달**: Parallel Routes + SEO (generateMetadata, JSON-LD)
7. [ ] **인증**: Auth.js 설정 + 로그인/회원가입 + proxy.ts
8. [ ] **찜 기능**: features/favorite + API + UI
9. [ ] **내가 본 공연**: features/my-performance + API + 마이페이지
10. [ ] **커뮤니티**: features/community + API + 게시판 UI
11. [ ] **배치**: features/batch + Vercel Cron + KOPIS 연동
12. [ ] **AdSense + 쿠키 동의**: ads 컴포넌트 + 배너
13. [ ] **법적 페이지**: privacy, terms, 회원탈퇴
14. [ ] **SEO 마무리**: sitemap.ts, robots.ts, OG 이미지
15. [ ] **테스트 + 배포**: Vitest + Playwright + Vercel 배포

### 11.3 Session Guide

#### Module Map

| Module | Scope Key | Description | Estimated Turns |
|--------|-----------|-------------|:---------------:|
| 프로젝트 초기화 + DB | `module-1` | Next.js 세팅, Prisma 스키마, seed, 공통 lib | 40-50 |
| 공연 검색 + 상세 | `module-2` | 검색 API, 필터, 카드/리스트, 모달(Parallel Routes), SEO | 50-60 |
| 인증 + 찜 + 내가본공연 | `module-3` | Auth.js, 로그인/가입, 찜 CRUD, 내가본공연 CRUD | 50-60 |
| 커뮤니티 + 배치 | `module-4` | 게시판/댓글 CRUD, KOPIS 배치, Vercel Cron | 40-50 |
| AdSense + 보안 + 배포 | `module-5` | 광고, 쿠키 동의, 법적 페이지, 탈퇴, sitemap, 배포 | 30-40 |

#### Recommended Session Plan

| Session | Phase | Scope | Turns |
|---------|-------|-------|:-----:|
| Session 1 | Plan + Design | 전체 (완료) | 30-35 |
| Session 2 | Do | `--scope module-1` | 40-50 |
| Session 3 | Do | `--scope module-2` | 50-60 |
| Session 4 | Do | `--scope module-3` | 50-60 |
| Session 5 | Do | `--scope module-4` | 40-50 |
| Session 6 | Do | `--scope module-5` | 30-40 |
| Session 7 | Check + Report | 전체 | 30-40 |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-04 | Initial draft — Option C Pragmatic Balance | kyungheelee |
