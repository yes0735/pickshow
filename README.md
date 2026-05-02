# PickShow (픽쇼)

> 공연 예매처 통합 검색 서비스 — 공연정보를 검색하고 예매사이트로 바로 연결

[![Deploy with Vercel](https://vercel.com/button)](https://pickshow.vercel.app)

**Production**: https://pickshow.vercel.app
**Swagger API Docs**: https://pickshow.vercel.app/api-docs
**GitHub**: https://github.com/yes0735/pickshow

---

## 서비스 소개

공연을 예매하려면 어떤 플랫폼(인터파크, YES24, 멜론티켓 등)에서 판매하는지 일일이 찾아봐야 합니다. **PickShow**는 KOPIS(공연예술통합전산망) 공공 데이터를 기반으로 9,600건+ 공연 정보를 통합 검색하고, 해당 공연의 예매처 링크를 한 곳에서 바로 연결해주는 서비스입니다.

---

## 주요 기능

### 1. 메인 홈

- 카테고리별 공연중인 공연 5개씩 카드 노출 (SSR + ISR 1시간)
- HomeHero: 서비스 소개 + 통합 검색바 + 최근 검색어
- 모바일: 카테고리별 가로 스크롤, 데스크톱: 5열 그리드
- 카테고리 "더보기" → 장르별 페이지 이동

### 2. 공연 검색

- 전용 검색 페이지 (`/search`) — 최근 검색어 + 추천 검색어 + 인라인 결과
- 장르별 카테고리 페이지 (`/genre/{slug}`)
- 상세 필터: 공연상태, 가격대, 날짜, 관람연령, 예매처, 공연장소
- 카드뷰 / 리스트뷰 전환 + 정렬 + 무한 스크롤

### 3. 공연 상세

- URL: `/genre/{장르}/{공연ID}` (카테고리 내 상세)
- 포스터 + 핵심 정보 가로 2열 레이아웃 (모바일: 세로)
- 출연진, 줄거리, 예매처 바로가기 링크
- 찜 / 내공연 / 공유 버튼
- SSR + ISR + Event JSON-LD + BreadcrumbList
- 기존 `/performance/[id]` URL 자동 리다이렉트

### 4. 찜 / 내공연

- **찜**: 로컬스토리지 기반, 카드 뷰 그리드 + 하트/내공연 아이콘
- **내공연**: 관람일, 좌석, 별점, 한줄 리뷰, 예매처 기록
  - 통계 카드 (올해 관람 수, 선호 장르, 선호 예매처)
  - 다가오는 공연 / 최근 본 공연 섹션 분리 (관람일 기준)
  - 5개씩 페이징

### 5. 커뮤니티 게시판

- 익명 게시판 (닉네임 + 비밀번호 기반, 카테고리: 홍보/정보/구함)
- IP 기반 작성자 식별 — 댓글 `익명_N` 번호 + 글쓴이 표시
- 같은 IP만 수정/삭제 버튼 노출 (서버에서 `canManage` 플래그)
- 게시글/댓글 작성 시 IP 주소 자동 저장
- 댓글 구분선, 페이지네이션

### 6. 배치 작업

- KST 00:00 — 공연 상태 자동 업데이트 (공연중/예정/종료)
- KST 01:00 — KOPIS 신규 공연 증분 동기화
- Resend 메일 알림 (배치 성공/실패)
- 수동 전체 동기화: `npx tsx scripts/full-sync.ts`

### 7. PWA

- Web App Manifest (standalone 모드)
- 서비스워커 (오프라인 캐시)
- 홈 화면 추가 지원 (192x192, 512x512 아이콘)

### 8. SEO + 광고

- Lighthouse SEO 100점
- `generateMetadata` — 페이지별 동적 메타 태그
- `sitemap.ts` — 공연 데이터 기반 동적 사이트맵
- JSON-LD: Event, BreadcrumbList, ItemList, WebSite, Organization
- 동적 OG 이미지 (`/og/performance/[id]`)
- Google AdSense 광고 (쿠키 동의 기반)
- Google Analytics 4

### 9. 기타

- 개인정보처리방침 (로컬스토리지 기반 안내)
- 문의하기 페이지
- BackToTop 플로팅 버튼
- 반응형 디자인 (모바일/태블릿/데스크톱)
- 전 페이지 Breadcrumb 통일

---

## 기술 스택

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2 (App Router, RSC, Turbopack) |
| Language | TypeScript 5 (strict mode) |
| Styling | Tailwind CSS 4 (`@theme inline` 토큰, 파스텔 민트+핑크) |
| Font | Pretendard Variable (next/font self-host) |
| State | Zustand 5 (클라이언트) + TanStack Query 5 (서버) |
| ORM | Prisma 7 + @prisma/adapter-pg |
| Database | PostgreSQL (Neon Serverless) |
| Auth | Auth.js v5 (이메일 + Google + Kakao) |
| Validation | Zod 4 |
| Security | bcrypt (비밀번호), DOMPurify (XSS), IP 기반 작성자 식별 |
| SEO | JSON-LD, sitemap, OG Image, Lighthouse SEO 100 |
| Ads | Google AdSense (쿠키 동의 기반) |
| Analytics | Google Analytics 4 |
| Email | Resend (배치 알림) |
| PWA | manifest.ts + Service Worker |
| Deploy | Vercel (Cron Jobs, ISR) |
| Data | KOPIS 공연예술통합전산망 Open API |
| API Docs | Swagger UI (`/api-docs`) |

---

## 시작하기

### 사전 준비

- Node.js 20+
- PostgreSQL (Neon 권장)
- KOPIS API Key ([발급](https://www.kopis.or.kr/por/cs/openapi/openApiInfo.do))

### 설치

```bash
git clone https://github.com/yes0735/pickshow.git
cd pickshow
npm install
```

### 환경 변수

```bash
cp .env.example .env
```

```env
DATABASE_URL="postgresql://..."
KOPIS_API_KEY="your-kopis-api-key"
NEXTAUTH_SECRET="openssl rand -base64 32"
CRON_SECRET="your-cron-secret"

# 소셜 로그인 (선택)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
KAKAO_CLIENT_ID=""
KAKAO_CLIENT_SECRET=""

# 광고/분석 (선택)
NEXT_PUBLIC_GA_ID=""
NEXT_PUBLIC_GA_MEASUREMENT_ID=""
NEXT_PUBLIC_SITE_URL="http://localhost:3000"

# 배치 메일 알림 (선택)
RESEND_API_KEY=""
```

### DB 마이그레이션 + Seed

```bash
npx prisma migrate dev --name init
npx tsx prisma/seed.ts
```

### KOPIS 데이터 동기화

```bash
# 전체 동기화 (최초 1회, ~30분 소요)
npx tsx scripts/full-sync.ts
```

### 개발 서버

```bash
npm run dev
```

http://localhost:3000 에서 확인

---

## 프로젝트 구조

```
pickshow/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # 로그인/회원가입
│   │   ├── (main)/             # 메인 레이아웃
│   │   │   ├── genre/[slug]/   # 카테고리 리스트
│   │   │   │   └── [id]/       # 공연 상세
│   │   │   ├── search/         # 검색 페이지
│   │   │   ├── community/      # 커뮤니티 게시판
│   │   │   ├── my/             # 찜, 내공연
│   │   │   ├── contact/        # 문의하기
│   │   │   └── privacy/        # 개인정보처리방침
│   │   ├── api/                # API Route Handlers
│   │   ├── api-docs/           # Swagger UI
│   │   └── og/                 # 동적 OG 이미지
│   ├── components/
│   │   ├── home/               # HomeHero
│   │   ├── performance/        # Card, ListItem, Filter, StatusBadge 등
│   │   ├── layout/             # Header, Footer, ActiveGenreHint
│   │   └── ui/                 # BackToTop, InfiniteScroll, CookieConsent
│   ├── features/               # 비즈니스 로직 모듈
│   │   ├── search/             # 검색 (service, schema, hooks)
│   │   ├── community/          # 게시판 (service, schema)
│   │   ├── favorite/           # 찜 (hooks)
│   │   └── batch/              # KOPIS 배치 동기화
│   ├── lib/                    # 인프라 (prisma, auth, kopis, seo, notify)
│   └── types/                  # TypeScript 타입
├── prisma/
│   ├── schema.prisma           # DB 스키마 (7 모델)
│   └── seed.ts                 # 공통코드 시드
├── public/
│   └── sw.js                   # PWA Service Worker
└── vercel.json                 # Vercel Cron Jobs
```

---

## API 문서

Swagger UI: https://pickshow.vercel.app/api-docs

### 주요 API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/performances` | 공연 검색 (필터, 정렬, 페이징) |
| GET | `/api/performances/[id]` | 공연 상세 |
| GET | `/api/common-codes` | 공통코드 (필터 옵션) |
| GET/POST | `/api/community/posts` | 게시판 (목록/작성) |
| GET/POST | `/api/community/posts/[id]/comments` | 댓글 (목록/작성) |
| GET | `/api/cron/sync-performances` | KOPIS 배치 동기화 |
| GET | `/api/cron/update-statuses` | 공연 상태 업데이트 |

---

## 라이선스

MIT
