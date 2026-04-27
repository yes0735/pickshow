// Design Ref: 4 — Footer 3단 그리드 (Brand + Genre + Info + Copyright)
// Plan SC: FR-02 (푸터 확장), FR-03 (SEO 유지)
import Link from "next/link";
import { GENRE_SLUGS, getGenreMeta } from "@/lib/seo/slug";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-bg-secondary">
      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* 3단 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand Section */}
          <div>
            <p className="text-lg font-bold mb-2">
              <span className="text-mint-dark">Pick</span>
              <span className="text-pink-dark">Show</span>
            </p>
            <p className="text-xs text-text-muted leading-relaxed">
              PickShow는 뮤지컬, 연극, 콘서트, 클래식, 무용, 국악, 아동 가족
              공연 등 국내에서 열리는 주요 공연 정보를 한 곳에서 검색하고,
              인터파크, 예스24, 티켓링크, 멜론티켓, 놀유니버스, NHN티켓링크 등
              주요 예매처로 바로 이동할 수 있는 공연 예매처 통합 검색
              서비스입니다.
            </p>
          </div>

          {/* Genre Section */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-3">
              장르별 공연 예매
            </p>
            <nav aria-label="장르별 바로가기">
              <ul className="space-y-1.5">
                {GENRE_SLUGS.map((slug) => {
                  const meta = getGenreMeta(slug);
                  if (!meta) return null;
                  return (
                    <li key={slug}>
                      <Link
                        href={`/genre/${slug}`}
                        className="text-xs text-text-muted hover:text-text-secondary transition-colors"
                      >
                        {meta.label} 예매
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>

          {/* Info Section */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-3">안내</p>
            <ul className="space-y-1.5">
              <li>
                <Link
                  href="/privacy"
                  className="text-xs text-text-muted hover:text-text-secondary transition-colors"
                >
                  개인정보처리방침
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-xs text-text-muted hover:text-text-secondary transition-colors"
                >
                  이용약관
                </Link>
              </li>
            </ul>
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-text-muted mb-1">
                공연 정보: KOPIS(공연예술통합전산망)
              </p>
              <a
                href="https://www.kopis.or.kr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-mint-dark hover:underline"
              >
                kopis.or.kr
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-6 border-t border-border text-center">
          <p className="text-xs text-text-muted">
            &copy; {new Date().getFullYear()} PickShow. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
