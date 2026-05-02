// 메인 홈 — Hero + 카테고리별 공연중 5개씩 SSR
import type { Metadata } from "next";
import Link from "next/link";
import HomeHero from "@/components/home/HomeHero";
import PerformanceCard from "@/components/performance/PerformanceCard";
import { searchPerformances } from "@/features/search/service";
import { GENRE_SLUGS, GENRE_META } from "@/lib/seo/slug";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export const revalidate = 3600;

const PER_GENRE = 5;

export default async function HomePage() {
  // 카테고리별 공연중 5개씩 병렬 조회
  const genreResults = await Promise.all(
    GENRE_SLUGS.map(async (slug) => {
      try {
        const result = await searchPerformances({
          genre: slug,
          status: "ongoing",
          sort: "title",
          limit: PER_GENRE,
          cursor: undefined,
        });
        return { slug, label: GENRE_META[slug].label, performances: result.data };
      } catch {
        return { slug, label: GENRE_META[slug].label, performances: [] };
      }
    }),
  );

  // 공연이 있는 카테고리만 표시
  const sections = genreResults.filter((s) => s.performances.length > 0);

  return (
    <>
      <HomeHero />

      <div className="max-w-7xl mx-auto px-4 pb-10">
        {sections.length === 0 && (
          <div className="text-center py-20">
            <p className="text-text-muted text-lg">공연 정보를 불러오는 중입니다</p>
          </div>
        )}

        {sections.map((section) => (
          <section key={section.slug} className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <span className="w-1 h-4 rounded-full bg-mint-dark inline-block" />
                {section.label}
              </h2>
              <Link
                href={`/genre/${section.slug}`}
                className="text-xs text-text-muted hover:text-mint-dark transition-colors"
              >
                더보기
              </Link>
            </div>
            {/* 모바일: 가로 스크롤 / 데스크톱: 5열 그리드 */}
            <div className="flex gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-3 lg:grid-cols-5 md:gap-4 md:overflow-visible md:pb-0 scrollbar-hide">
              {section.performances.map((p) => (
                <div key={p.id} className="w-40 shrink-0 md:w-auto">
                  <PerformanceCard performance={p} />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
