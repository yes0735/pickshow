// 문의하기 페이지 — 애드센스 필수 요구사항
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "문의하기 | PickShow",
  description: "PickShow 서비스 관련 문의사항을 보내주세요.",
};

export default function ContactPage() {
  return (
    <>
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-text-muted mb-4">
          <Link href="/" className="hover:text-mint-dark transition-colors">홈</Link>
          <span>›</span>
          <span className="text-text-secondary">문의하기</span>
        </nav>
      </div>
      <div className="max-w-3xl mx-auto px-4 pb-12">
        <h1 className="text-xl font-bold mb-6">문의하기</h1>

        <div className="bg-white rounded-2xl border border-border p-6 sm:p-8">
          <p className="text-sm text-text-secondary mb-6 leading-relaxed">
            PickShow 서비스 이용 중 궁금한 점이나 건의사항이 있으시면 아래 이메일로 문의해 주세요.
            빠른 시일 내에 답변 드리겠습니다.
          </p>

          <div className="space-y-5">
            {/* 이메일 문의 */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-mint-light flex items-center justify-center shrink-0">
                <svg width="18" height="18" fill="none" stroke="var(--color-mint-dark)" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <path d="m22 6-10 7L2 6" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold mb-1">이메일 문의</p>
                <a
                  href="mailto:slaqmtm0735@gmail.com"
                  className="text-sm text-mint-dark hover:underline"
                >
                  slaqmtm0735@gmail.com
                </a>
              </div>
            </div>

            {/* 운영시간 */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-pink-light flex items-center justify-center shrink-0">
                <svg width="18" height="18" fill="none" stroke="var(--color-pink-dark)" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold mb-1">운영시간</p>
                <p className="text-sm text-text-secondary">평일 10:00 ~ 18:00 (주말·공휴일 휴무)</p>
              </div>
            </div>

            {/* 안내사항 */}
            <div className="mt-4 p-4 rounded-xl bg-bg-secondary text-xs text-text-muted leading-relaxed space-y-1">
              <p>• 문의 시 이메일 제목에 [PickShow 문의]를 포함해 주세요.</p>
              <p>• 공연 정보 관련 문의는 KOPIS(공연예술통합전산망)를 통해 확인 가능합니다.</p>
              <p>• 서비스 오류 신고, 광고 문의, 제휴 문의 모두 위 이메일로 보내주세요.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
