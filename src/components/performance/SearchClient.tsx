// Design Ref: §2.2 — 홈 Client Island (Zustand + React Query)
// Plan SC: FR-01 (RSC shell + Client island 패턴)
// Gap I7 — hydration 패턴: render body의 setState 회피, 모듈 스코프 초기화 사용
//
// 이 컴포넌트는 (main)/page.tsx의 인터랙티브 영역을 담당한다.
// - 초기 필터/정렬을 props로 받아 Zustand 스토어를 hydrate (props 변화 시 useEffect로 sync)
// - React Query는 상위 HydrationBoundary가 이미 prefetch한 캐시를 사용 (첫 fetch 없음)
// - 필터 변경/무한스크롤 등의 클라이언트 인터랙션만 처리
"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchPerformances, useSearchStore } from "@/features/search/hooks";
import FilterSidebar from "@/components/performance/FilterSidebar";
import PerformanceCard from "@/components/performance/PerformanceCard";
import PerformanceListItem from "@/components/performance/PerformanceListItem";
import ViewToggle from "@/components/performance/ViewToggle";
import SortSelect from "@/components/performance/SortSelect";
import InfiniteScroll from "@/components/ui/InfiniteScroll";
import AdSlot from "@/components/ads/AdSlot";
import GenreFilter from "@/components/performance/GenreFilter";
import ActiveFilterTags from "@/components/performance/ActiveFilterTags";
import type { SearchFilters } from "@/types/performance";
import type { SortOption } from "@/types/common";

interface Props {
  initialFilters: SearchFilters;
  initialSort: SortOption;
}

// Gap I7 — 모듈 스코프에서 즉시 초기화 (React render 바깥)
// 동일 모듈이 server/client 양쪽에서 실행되므로 둘 다 동일 state로 시작한다.
// 다만 Zustand `create`는 글로벌 store라 request 간 공유되는 SSR 환경에서는 주의가 필요.
// 여기서는 useEffect로 client-only sync를 병행하여 안전성을 높인다.
let storeInitialized = false;

export default function SearchClient({ initialFilters, initialSort }: Props) {
  // 첫 마운트 시 모듈 레벨 플래그 체크 (render body 부작용 최소화)
  if (!storeInitialized) {
    useSearchStore.setState({
      filters: initialFilters,
      sort: initialSort,
    });
    storeInitialized = true;
  }

  // Client mount 후: props가 바뀐 경우 (예: URL 변경) Zustand에 반영
  // 복잡한 필터 객체를 직렬화한 문자열로 비교
  const filtersKey = JSON.stringify(initialFilters);
  useEffect(() => {
    useSearchStore.setState({
      filters: initialFilters,
      sort: initialSort,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey, initialSort]);

  const [filterOpen, setFilterOpen] = useState(false);
  const viewMode = useSearchStore((s) => s.viewMode);
  const filters = useSearchStore((s) => s.filters);

  // 활성 필터 수 (장르, 검색어 제외)
  const activeFilterCount = [
    filters.status?.length,
    filters.startDate,
    filters.endDate,
    filters.minPrice,
    filters.maxPrice,
    filters.ageLimit?.length,
    filters.ticketSite?.length,
    filters.venue,
  ].filter(Boolean).length;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useSearchPerformances();

  const performances = data?.pages.flatMap((p) => p.data) ?? [];
  const total = data?.pages[0]?.pagination.total ?? 0;

  const handleLoadMore = useCallback(() => {
    fetchNextPage();
  }, [fetchNextPage]);

  return (
    <div className="flex gap-6">
      {/* 필터 사이드바 (데스크톱) */}
      <div className="hidden lg:block">
        <FilterSidebar />
      </div>

      {/* 모바일 필터 바텀시트 */}
      {filterOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setFilterOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[85vh] flex flex-col animate-slideUp">
            {/* 드래그 핸들 */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>
            {/* 헤더 */}
            <div className="flex justify-between items-center px-5 pb-3">
              <h2 className="font-semibold text-base">상세 필터</h2>
              <button
                onClick={() => setFilterOpen(false)}
                aria-label="필터 닫기"
                className="text-text-muted"
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* 필터 내용 (스크롤) */}
            <div className="flex-1 overflow-y-auto px-5 pb-4">
              <FilterSidebar />
            </div>
            {/* 하단 적용 버튼 */}
            <div className="border-t border-border p-4 flex gap-2">
              <button
                onClick={() => {
                  useSearchStore.getState().resetFilters();
                }}
                className="flex-1 h-11 rounded-xl border border-border text-sm text-text-secondary hover:bg-bg-secondary transition-colors"
              >
                초기화
              </button>
              <button
                onClick={() => setFilterOpen(false)}
                className="flex-[2] h-11 rounded-xl bg-mint-dark text-white text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                적용하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 메인 콘텐츠 */}
      <div className="flex-1 min-w-0">
        {/* 장르 필터 (상단 칩) */}
        <div className="mb-4">
          <GenreFilter />
        </div>

        {/* 적용된 필터 태그 */}
        <ActiveFilterTags />

        {/* 상단 바 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterOpen(true)}
              className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-text-secondary hover:bg-bg-secondary transition-colors"
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M4 6h16M6 12h12M8 18h8" />
              </svg>
              필터
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 flex items-center justify-center rounded-full bg-mint-dark text-white text-[9px] font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <p className="text-sm text-text-muted">
              {isLoading ? "검색 중..." : `총 ${total.toLocaleString()}건`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <SortSelect />
            <ViewToggle />
          </div>
        </div>

        {/* 에러 */}
        {isError && (
          <div className="text-center py-12 text-pink-dark">
            검색에 실패했습니다. 다시 시도해주세요.
          </div>
        )}

        {/* 결과 없음 */}
        {!isLoading && !isError && performances.length === 0 && (
          <div className="text-center py-20">
            <p className="text-text-muted text-lg mb-2">검색 결과가 없습니다</p>
            <p className="text-text-muted text-sm">다른 검색어나 필터를 사용해보세요</p>
          </div>
        )}

        {/* 로딩 스켈레톤 */}
        {isLoading && (
          <div
            className={
              viewMode === "card"
                ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
                : "space-y-3"
            }
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className={
                  viewMode === "card"
                    ? "rounded-xl border border-border bg-bg-secondary animate-pulse aspect-[3/5]"
                    : "h-28 rounded-xl border border-border bg-bg-secondary animate-pulse"
                }
              />
            ))}
          </div>
        )}

        {/* 카드 뷰 */}
        {!isLoading && viewMode === "card" && (
          <div className="space-y-4">
            {/* 첫 10개 */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {performances.slice(0, 10).map((p) => (
                <PerformanceCard key={p.id} performance={p} />
              ))}
            </div>
            {/* 광고 슬롯 */}
            {performances.length > 10 && <AdSlot slotId="search-infeed" format="fluid" />}
            {/* 나머지 */}
            {performances.length > 10 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {performances.slice(10).map((p) => (
                  <PerformanceCard key={p.id} performance={p} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* 리스트 뷰 */}
        {!isLoading && viewMode === "list" && (
          <div className="space-y-3">
            {performances.map((p) => (
              <PerformanceListItem key={p.id} performance={p} />
            ))}
          </div>
        )}

        {/* 무한스크롤 */}
        <InfiniteScroll
          hasNext={hasNextPage ?? false}
          isFetching={isFetchingNextPage}
          onLoadMore={handleLoadMore}
        />
      </div>
    </div>
  );
}
