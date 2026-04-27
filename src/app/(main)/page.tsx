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
import {
  HydrationBoundary,
  dehydrate,
  QueryClient,
} from "@tanstack/react-query";
import { searchPerformances } from "@/features/search/service";
import SearchClient from "@/components/performance/SearchClient";
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
      {/* Plan SC: FR-01, SC-02 — h1 visually-hidden (크롤러/스크린리더만 읽음) */}
      <h1 className="sr-only">공연 예매처 통합 검색</h1>

      <HydrationBoundary state={dehydratedState}>
        <SearchClient initialFilters={initialFilters} initialSort={initialSort} />
      </HydrationBoundary>
    </div>
  );
}
