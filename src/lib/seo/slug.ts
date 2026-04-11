// Design Ref: §3.2 Genre/Venue Slug 매핑 — Plan SC: FR-09, FR-10 (롱테일 랜딩 페이지)
// 주의: DB의 `genre` 컬럼은 이미 영문 슬러그(musical/theater/concert/...)로 저장되어 있음.
// 따라서 genre slug는 DB 값과 1:1 매핑되며 별도 변환이 필요 없다.
// venue는 한글 → 안정적 slug로 변환해야 한다.

export type GenreSlug =
  | "musical"
  | "theater"
  | "concert"
  | "classic"
  | "dance"
  | "korean"
  | "etc";

export interface GenreMeta {
  slug: GenreSlug;
  label: string;
  description: string;
  /** `<h1>` 아래에 렌더되는 본문 설명 (200자+) */
  longDescription: string;
}

/**
 * 장르 메타데이터 — `/genre/[slug]` 랜딩 페이지와 sitemap의 single source of truth.
 * DB의 `performance.genre` 값과 키가 정확히 일치해야 한다.
 */
export const GENRE_META: Record<GenreSlug, GenreMeta> = {
  musical: {
    slug: "musical",
    label: "뮤지컬",
    description: "국내외 뮤지컬 공연 예매처 통합 검색",
    longDescription:
      "PickShow는 국내외 뮤지컬 공연을 한 곳에서 검색하고 인터파크, 티켓링크, 예스24 등 주요 예매처로 바로 이동할 수 있는 통합 검색 서비스입니다. 브로드웨이·웨스트엔드 라이선스 대형 뮤지컬부터 창작 뮤지컬, 오프브로드웨이 소극장까지 — 관심있는 뮤지컬의 공연장, 공연 기간, 출연진, 가격, 예매처를 한눈에 확인하세요.",
  },
  theater: {
    slug: "theater",
    label: "연극",
    description: "대학로부터 대극장까지 연극 예매처 통합 검색",
    longDescription:
      "PickShow는 대학로 소극장 연극부터 국립극단, 예술의전당 대극장 연극까지 국내 모든 연극 공연을 한 곳에서 검색할 수 있는 통합 예매처 검색 서비스입니다. 관람하고 싶은 연극의 공연 정보, 출연진, 러닝타임, 연령 제한, 가격, 예매 사이트를 비교하고 원하는 예매처로 바로 이동하세요.",
  },
  concert: {
    slug: "concert",
    label: "콘서트",
    description: "K-POP·내한 콘서트 예매처 통합 검색",
    longDescription:
      "K-POP 아티스트 투어, 내한 공연, 단독 콘서트, 페스티벌까지 — PickShow에서 관심있는 모든 콘서트의 예매 정보를 한눈에 확인하세요. 공연 일정, 공연장, 티켓 가격, 예매 사이트(인터파크, 멜론티켓, YES24 등)를 비교하고 가장 편리한 예매처로 바로 이동할 수 있습니다.",
  },
  classic: {
    slug: "classic",
    label: "클래식",
    description: "클래식 콘서트·오페라 예매처 통합 검색",
    longDescription:
      "클래식 음악 공연을 사랑하는 관객을 위한 통합 예매처 검색. 교향악단 정기 연주회부터 독주회, 실내악, 오페라, 발레 동반 공연까지 — 예술의전당, 롯데콘서트홀, 세종문화회관을 비롯한 전국 주요 공연장의 클래식 공연 일정과 예매처를 한눈에 확인하세요.",
  },
  dance: {
    slug: "dance",
    label: "무용",
    description: "발레·현대무용 공연 예매처 통합 검색",
    longDescription:
      "국립발레단, 유니버설발레단, 국립현대무용단 등 국내 최정상 무용단의 공연부터 해외 발레단 내한 공연까지 — PickShow에서 모든 무용 공연의 일정, 공연장, 예매처 정보를 통합 검색할 수 있습니다. 클래식 발레, 현대 무용, 컨템포러리 댄스 등 원하는 장르의 공연을 쉽게 찾아보세요.",
  },
  korean: {
    slug: "korean",
    label: "국악",
    description: "국악·전통예술 공연 예매처 통합 검색",
    longDescription:
      "국립국악원, 국립국악관현악단, 국립창극단 등이 선보이는 판소리, 민요, 가야금·거문고 독주회, 창극, 퓨전 국악 공연까지 — PickShow에서 한국 전통예술 공연의 일정과 예매처를 한 번에 검색하세요. 공연장, 출연진, 가격 정보를 확인하고 원하는 예매 사이트로 바로 이동할 수 있습니다.",
  },
  etc: {
    slug: "etc",
    label: "기타",
    description: "복합·기타 장르 공연 예매처 통합 검색",
    longDescription:
      "아동·가족 공연, 마술쇼, 서커스, 복합 장르 공연 등 다양한 형태의 공연 예매 정보를 PickShow에서 한 곳에 모아 보여드립니다. 공연 일정, 공연장, 가격, 예매처까지 한눈에 확인하고 원하는 예매 사이트로 바로 이동하세요.",
  },
};

export const GENRE_SLUGS: GenreSlug[] = Object.keys(GENRE_META) as GenreSlug[];

export function isGenreSlug(value: string): value is GenreSlug {
  return value in GENRE_META;
}

export function getGenreMeta(slug: string): GenreMeta | null {
  return isGenreSlug(slug) ? GENRE_META[slug] : null;
}

export function genreLabel(slug: string): string {
  return getGenreMeta(slug)?.label ?? slug;
}

/**
 * 공연장 이름을 SEO-friendly URL slug로 변환한다.
 * - 한글 이름은 그대로 보존 (Google은 UTF-8 한글 URL을 잘 인덱스함)
 * - 공백/구두점 → 하이픈
 * - 괄호 안 내용(부가 설명) 제거
 * - idempotent: 동일 입력 → 동일 출력
 * - DB 조회 없이 순수 함수로 동작 (sitemap/랜딩 페이지에서 대량 호출)
 *
 * 예:
 *   "세종문화회관"            → "세종문화회관"
 *   "예술의전당 (오페라극장)"  → "예술의전당"
 *   "LG Arts Center"          → "lg-arts-center"
 *   "롯데콘서트홀"             → "롯데콘서트홀"
 *   "KBS홀 (여의도)"           → "kbs홀"
 */
export function venueToSlug(venue: string): string {
  const normalized = venue.trim().normalize("NFC");
  if (!normalized) return "unknown";

  const cleaned = normalized
    // 괄호 안 내용 제거: "예술의전당 (오페라극장)" → "예술의전당 "
    .replace(/\([^)]*\)/g, "")
    .replace(/\[[^\]]*\]/g, "")
    // 여러 종류의 공백/구분자를 하나의 하이픈으로
    .replace(/[\s·,／/‧\u2219]+/g, "-")
    // 문장부호 제거 (한글/영문/숫자/하이픈만 유지)
    .replace(/[^\p{L}\p{N}\-]/gu, "")
    // 중복 하이픈 → 1개
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  return cleaned || "unknown";
}
