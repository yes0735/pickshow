# PickShow (픽쇼)

> 공연 예매처 통합 검색 서비스 — 공연정보를 검색하고 예매사이트로 바로 연결

**Production**: https://pickshow.vercel.app

---

## 서비스 소개

공연을 예매하려면 어떤 플랫폼(인터파크, YES24, 멜론티켓 등)에서 판매하는지 일일이 찾아봐야 합니다.

**PickShow**는 KOPIS(공연예술통합전산망) 공공 데이터를 기반으로 **9,600건 이상의 공연 정보**를 통합 검색하고, 해당 공연의 예매처 링크를 한 곳에서 바로 연결해주는 서비스입니다.

---

## 주요 기능

### 메인 홈
- 카테고리별(뮤지컬/연극/콘서트/클래식/무용/국악/기타) 공연중인 공연 5개씩 노출
- 서비스 소개 + 통합 검색바 + 최근 검색어
- 모바일: 가로 스크롤 / 데스크톱: 5열 그리드

### 공연 검색
- 전용 검색 페이지 — 최근 검색어 + 추천 검색어 + 인라인 결과
- 장르별 카테고리 페이지
- 상세 필터: 공연상태, 가격대, 날짜, 관람연령, 예매처, 공연장소
- 카드뷰 / 리스트뷰 전환, 정렬, 무한 스크롤

### 공연 상세
- 포스터 + 핵심 정보(기간, 장소, 가격, 연령, 러닝타임) 가로 배치
- 출연진, 줄거리, 예매처 바로가기 링크
- 찜 / 내공연 / 공유 버튼
- SEO 최적화 (SSR + ISR + Event JSON-LD + BreadcrumbList)

### 찜
- 로컬스토리지 기반 (회원가입 불필요)
- 카드 뷰 그리드 + 하트/내공연 아이콘

### 내공연
- 관람일, 좌석, 별점, 한줄 리뷰, 예매처 기록
- 통계 카드 (올해 관람 수, 선호 장르, 선호 예매처)
- 다가오는 공연 / 최근 본 공연 섹션 분리 + 페이징

### 커뮤니티 게시판
- 익명 게시판 (카테고리: 홍보/정보/구함)
- IP 기반 작성자 식별 — 댓글 `익명_N` 번호 + 글쓴이 표시
- 같은 IP만 수정/삭제 가능

### 배치 작업
- 매일 KST 00:00 — 공연 상태 자동 업데이트
- 매일 KST 01:00 — KOPIS 신규 공연 증분 동기화
- 배치 결과 메일 알림 (Resend)

### PWA
- 홈 화면 추가 지원 (standalone 모드)
- 서비스워커 오프라인 캐시

### SEO + 광고
- Lighthouse SEO 100점
- JSON-LD (Event, BreadcrumbList, ItemList, WebSite)
- 동적 사이트맵, 동적 OG 이미지
- Google AdSense, Google Analytics 4

---

## 기술 스택

### Frontend
| 기술 | 버전 | 용도 |
|------|------|------|
| Next.js | 16.2 | App Router, RSC, SSR/ISR |
| React | 19 | UI |
| TypeScript | 5 | 타입 안정성 |
| Tailwind CSS | 4 | 스타일링 (파스텔 민트+핑크 테마) |
| Zustand | 5 | 클라이언트 상태 (필터, 뷰모드) |
| TanStack Query | 5 | 서버 상태 / 캐싱 / 무한스크롤 |
| Pretendard | Variable | 한글 웹폰트 (self-host) |

### Backend
| 기술 | 버전 | 용도 |
|------|------|------|
| Prisma | 7 | ORM + 마이그레이션 |
| PostgreSQL | Neon | 서버리스 DB |
| Zod | 4 | 입력값 검증 |
| bcryptjs | 3 | 비밀번호 암호화 |

### 인프라
| 기술 | 용도 |
|------|------|
| Vercel | 배포 + Cron Jobs + ISR |
| Turbopack | 개발 서버 번들러 |
| Resend | 배치 알림 메일 |
| KOPIS API | 공연 데이터 소스 |

---

## 시작하기

### 사전 준비

- Node.js 20+
- PostgreSQL (Neon 권장)
- KOPIS API Key ([발급](https://www.kopis.or.kr/por/cs/openapi/openApiInfo.do))

### 설치 및 실행

```bash
git clone https://github.com/yes0735/pickshow.git
cd pickshow
npm install

# 환경변수 설정
cp .env.example .env

# DB 마이그레이션
npx prisma migrate dev --name init
npx tsx prisma/seed.ts

# KOPIS 전체 동기화 (최초 1회)
npx tsx scripts/full-sync.ts

# 개발 서버
npm run dev
```

### 환경 변수

```env
DATABASE_URL="postgresql://..."
KOPIS_API_KEY="your-kopis-api-key"
NEXTAUTH_SECRET="your-secret"
CRON_SECRET="your-cron-secret"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"

# 선택
RESEND_API_KEY=""
NEXT_PUBLIC_GA_MEASUREMENT_ID=""
```

---

## 프로젝트 구조

```
pickshow/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (main)/             # 메인 레이아웃
│   │   │   ├── genre/[slug]/   # 카테고리 리스트
│   │   │   │   └── [id]/       # 공연 상세
│   │   │   ├── search/         # 검색 페이지
│   │   │   ├── community/      # 게시판
│   │   │   ├── my/             # 찜, 내공연
│   │   │   ├── contact/        # 문의하기
│   │   │   └── privacy/        # 개인정보처리방침
│   │   ├── api/                # API Routes
│   │   └── og/                 # 동적 OG 이미지
│   ├── components/             # UI 컴포넌트
│   ├── features/               # 비즈니스 로직
│   ├── lib/                    # 인프라 유틸리티
│   └── types/                  # TypeScript 타입
├── prisma/                     # DB 스키마 + 마이그레이션
├── public/                     # 정적 파일 + SW
└── vercel.json                 # Cron Jobs
```

---

## 라이선스

MIT
