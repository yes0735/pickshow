// Design Ref: §2.2 + §5.1 — 홈 검색 페이지 (RSC shell + Client island)
// Plan SC: FR-01 (초기 20건 SSR), FR-04 (canonical)
//
// 이 파일은 Server Component다. 이전에는 "use client"였으나 SEO 크롤러가 빈 페이지를
// 받는 문제를 해결하기 위해 RSC로 전환되었다.
// - URL searchParams를 서버에서 파싱
// - searchPerformances()를 직접 호출하여 React Query를 prefetch
// - <h1>, <p> 설명 텍스트는 서버 렌더 (크롤러가 즉시 읽음)
// - 인터랙션 로직은 <SearchClient> Client island로 분리
import type { Metadata } from "next";
import Link from "next/link";
import {
  HydrationBoundary,
  dehydrate,
  QueryClient,
} from "@tanstack/react-query";
import { searchPerformances } from "@/features/search/service";
import SearchClient from "@/components/performance/SearchClient";
import { GENRE_SLUGS, getGenreMeta } from "@/lib/seo/slug";
import type { SearchFilters } from "@/types/performance";
import type { SortOption } from "@/types/common";

// Plan SC: FR-01 — 홈 SSR 초기 카드 20건 (크롤러 인덱스 최대화)
const INITIAL_PAGE_SIZE = 20;

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

type UrlSearchParams = Record<string, string | string[] | undefined>;

function single(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function multi(value: string | string[] | undefined): string[] | undefined {
  if (!value) return undefined;
  const raw = Array.isArray(value) ? value : value.split(",");
  const filtered = raw.filter(Boolean);
  return filtered.length > 0 ? filtered : undefined;
}

function num(value: string | string[] | undefined): number | undefined {
  const s = single(value);
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

function parseUrlFilters(sp: UrlSearchParams): SearchFilters {
  const statusFromUrl = multi(sp.status);
  return {
    q: single(sp.q),
    genre: multi(sp.genre),
    // 기본값: 공연중 (기존 Zustand defaultFilters와 일치)
    status: statusFromUrl ?? ["ongoing"],
    startDate: single(sp.startDate),
    endDate: single(sp.endDate),
    minPrice: num(sp.minPrice),
    maxPrice: num(sp.maxPrice),
    ageLimit: multi(sp.ageLimit),
    ticketSite: multi(sp.ticketSite),
    venue: single(sp.venue),
  };
}

function parseSort(sp: UrlSearchParams): SortOption {
  const s = single(sp.sort);
  if (s === "price_asc" || s === "price_desc" || s === "title") return s;
  return "title";
}

/**
 * SearchFilters (Zustand 형태) → searchPerformances service가 요구하는 flat 파라미터로 변환.
 * 클라이언트 `buildSearchParams`와 동일한 인코딩 규칙 (배열 → 콤마 조인).
 */
function filtersToServiceParams(
  filters: SearchFilters,
  sort: SortOption,
  limit: number,
) {
  return {
    q: filters.q,
    genre: filters.genre?.join(","),
    status: filters.status?.join(","),
    startDate: filters.startDate,
    endDate: filters.endDate,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    ageLimit: filters.ageLimit?.join(","),
    ticketSite: filters.ticketSite?.join(","),
    venue: filters.venue,
    sort,
    limit,
    cursor: undefined as string | undefined,
  };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<UrlSearchParams>;
}) {
  const sp = await searchParams;
  const initialFilters = parseUrlFilters(sp);
  const initialSort = parseSort(sp);

  // Plan SC: FR-01 — 서버에서 첫 페이지 prefetch (크롤러가 즉시 카드 인덱스 가능)
  const queryClient = new QueryClient();

  try {
    await queryClient.prefetchInfiniteQuery({
      queryKey: ["performances", initialFilters, initialSort],
      queryFn: async () =>
        searchPerformances(
          filtersToServiceParams(initialFilters, initialSort, INITIAL_PAGE_SIZE),
        ),
      initialPageParam: undefined as string | undefined,
      // 단일 페이지만 prefetch (무한스크롤 2페이지 이후는 클라이언트 책임, 페이지당 10건)
      pages: 1,
      getNextPageParam: (lastPage) =>
        lastPage.pagination.hasNext
          ? lastPage.pagination.cursor ?? undefined
          : undefined,
    });
  } catch {
    // DB 연결 실패 등: prefetch 없이도 Client가 빈 상태로 fallback 렌더
  }

  const dehydratedState = dehydrate(queryClient);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Plan SC: FR-01, Gap I2 — 크롤러가 읽을 SEO 헤더 (h1 + 250자+ description) */}
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-3">
          공연 예매처 통합 검색
        </h1>
        <p className="text-sm text-text-muted leading-relaxed max-w-3xl">
          PickShow는 뮤지컬·연극·콘서트·클래식·무용·국악·아동 가족 공연 등 국내에서 열리는
          주요 공연 정보를 한 곳에서 검색하고, 인터파크·예스24·티켓링크·멜론티켓·놀유니버스·
          NHN티켓링크 등 주요 예매처로 바로 이동할 수 있는 공연 예매처 통합 검색 서비스입니다.
          관심있는 공연을 장르·공연장·공연 기간·가격·관람연령·예매처별로 자유롭게 필터링하고,
          대학로 소극장부터 예술의전당·세종문화회관 대극장까지 모든 공연의 출연진, 러닝타임,
          가격 정보를 한눈에 비교한 후 원하는 예매 사이트에서 즉시 예매하세요.
        </p>

        {/* Gap C2 — 롱테일 랜딩 페이지 internal link (link juice 전달 + SEO 본문) */}
        <nav aria-label="장르별 바로가기" className="mt-4">
          <p className="text-xs text-text-muted mb-2">장르별 공연 예매처</p>
          <div className="flex flex-wrap gap-2">
            {GENRE_SLUGS.map((slug) => {
              const meta = getGenreMeta(slug);
              if (!meta) return null;
              return (
                <Link
                  key={slug}
                  href={`/genre/${slug}`}
                  className="inline-flex items-center px-3 py-1.5 rounded-full border border-border text-xs text-text-secondary bg-white hover:bg-bg-secondary hover:border-mint-dark transition-colors"
                >
                  {meta.label} 예매
                </Link>
              );
            })}
          </div>
        </nav>
      </header>

      <HydrationBoundary state={dehydratedState}>
        <SearchClient initialFilters={initialFilters} initialSort={initialSort} />
      </HydrationBoundary>
    </div>
  );
}
