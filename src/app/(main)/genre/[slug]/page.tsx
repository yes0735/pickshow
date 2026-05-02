// Design Ref: §4 — 장르 랜딩 페이지 (RSC shell + SearchClient, genre 프리셋)
// Plan SC: FR-01 (SearchClient 통합), FR-02 (SEO sr-only), FR-04 (SSR prefetch)
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import {
  HydrationBoundary,
  dehydrate,
  QueryClient,
} from "@tanstack/react-query";
import { searchPerformances } from "@/features/search/service";
import SearchClient from "@/components/performance/SearchClient";
import {
  generateGenreMetadata,
  generateBreadcrumbJsonLd,
  generateItemListJsonLd,
  serializeJsonLd,
} from "@/lib/seo";
import { GENRE_SLUGS, getGenreMeta, isGenreSlug } from "@/lib/seo/slug";
import type { SearchFilters } from "@/types/performance";
import type { SortOption } from "@/types/common";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pickshow.kr";
const INITIAL_PAGE_SIZE = 20;

// Plan SC: FR-11 — ISR (1시간 TTL)
export const revalidate = 3600;

// 활성 장르 전부 정적 사전 생성
export function generateStaticParams() {
  return GENRE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return (
    generateGenreMetadata(slug) ?? {
      title: "장르를 찾을 수 없습니다",
    }
  );
}

export default async function GenreLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (!isGenreSlug(slug)) notFound();
  const meta = getGenreMeta(slug);
  if (!meta) notFound();

  // Plan SC: FR-01 — genre 프리셋 필터
  const initialFilters: SearchFilters = {
    genre: [slug],
    status: ["ongoing"],
  };
  const initialSort: SortOption = "title";

  // Plan SC: FR-04 — React Query prefetch (메인과 동일 패턴)
  const queryClient = new QueryClient();

  try {
    await queryClient.prefetchInfiniteQuery({
      queryKey: ["performances", initialFilters, initialSort],
      queryFn: async () =>
        searchPerformances({
          genre: slug,
          status: "ongoing",
          sort: initialSort,
          limit: INITIAL_PAGE_SIZE,
          cursor: undefined,
        }),
      initialPageParam: undefined as string | undefined,
      pages: 1,
      getNextPageParam: (lastPage) =>
        lastPage.pagination.hasNext
          ? lastPage.pagination.cursor ?? undefined
          : undefined,
    });
  } catch {
    // prefetch 실패 시 Client가 빈 상태로 fallback
  }

  // JSON-LD: prefetch 캐시에서 공연 데이터 추출
  const cachedData = queryClient.getQueryData<{
    pages: Array<{ data: Array<{ id: string; title: string; posterUrl: string | null; genre: string }> }>;
  }>(["performances", initialFilters, initialSort]);
  const performances = cachedData?.pages[0]?.data ?? [];

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: "홈", url: SITE_URL },
    { name: meta.label, url: `${SITE_URL}/genre/${meta.slug}` },
  ]);

  const itemListJsonLd =
    performances.length > 0
      ? generateItemListJsonLd({
          name: `${meta.label} 공연 목록`,
          description: meta.description,
          url: `${SITE_URL}/genre/${meta.slug}`,
          performances: performances.map((p) => ({
            id: p.id,
            title: p.title,
            posterUrl: p.posterUrl,
            genre: p.genre,
          })),
        })
      : null;

  const dehydratedState = dehydrate(queryClient);

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
      />
      {itemListJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(itemListJsonLd) }}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Plan SC: FR-02 — SEO sr-only (크롤러/스크린리더만 읽음) */}
        <h1 className="sr-only">{meta.label} 예매처 통합 검색</h1>
        <p className="sr-only">{meta.longDescription}</p>

        {/* Breadcrumb (시각적) */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-xs text-text-muted mb-4"
        >
          <Link href="/" className="hover:text-mint-dark transition-colors">
            홈
          </Link>
          <span>›</span>
          <span className="text-text-secondary">{meta.label}</span>
        </nav>

        {/* SearchClient with genre preset */}
        <HydrationBoundary state={dehydratedState}>
          <SearchClient
            initialFilters={initialFilters}
            initialSort={initialSort}
          />
        </HydrationBoundary>
      </div>
    </>
  );
}
