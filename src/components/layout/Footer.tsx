// Footer — 컴팩트 1단 구조
import Link from "next/link";
import { GENRE_SLUGS, getGenreMeta } from "@/lib/seo/slug";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-white">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 브랜드 + 설명 */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
          <div className="min-w-0">
            <p className="text-base font-bold mb-1">
              <span className="text-mint-dark">Pick</span>
              <span className="text-pink-dark">Show</span>
            </p>
            <p className="text-[11px] text-text-muted leading-relaxed max-w-lg">
              공연 정보를 한 곳에서 검색하고, 원하는 예매처로 바로 이동할 수 있는 공연 예매처 통합 검색 서비스입니다.
            </p>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-text-muted shrink-0">
            <Link href="/privacy" className="hover:text-text-secondary transition-colors">개인정보처리방침</Link>
            <span className="text-border">|</span>
            <Link href="/contact" className="hover:text-text-secondary transition-colors">문의하기</Link>
          </div>
        </div>

        {/* 장르 링크 (가로 나열) */}
        <nav aria-label="장르별 바로가기" className="flex flex-wrap gap-x-4 gap-y-1 mb-4">
          {GENRE_SLUGS.map((slug) => {
            const meta = getGenreMeta(slug);
            if (!meta) return null;
            return (
              <Link
                key={slug}
                href={`/genre/${slug}`}
                className="text-[11px] text-text-muted hover:text-mint-dark transition-colors"
              >
                {meta.label}
              </Link>
            );
          })}
        </nav>

        {/* 하단: 출처 + 저작권 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pt-4 border-t border-border-light text-[11px] text-text-muted">
          <p>
            공연 정보:{" "}
            <a
              href="https://www.kopis.or.kr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-mint-dark hover:underline"
            >
              KOPIS(공연예술통합전산망)
            </a>
          </p>
          <p>&copy; {new Date().getFullYear()} PickShow</p>
        </div>
      </div>
    </footer>
  );
}
