// Design Ref: §8.4 + FR-15 — 이용약관 페이지
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "이용약관",
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">이용약관</h1>

      <div className="prose prose-sm max-w-none space-y-6 text-sm leading-relaxed text-text-secondary">
        <section>
          <h2 className="text-base font-semibold text-foreground">제1조 (목적)</h2>
          <p>
            이 약관은 PickShow(이하 &quot;서비스&quot;)가 제공하는 공연 예매처 통합 검색 서비스의
            이용 조건 및 절차에 관한 사항을 규정합니다.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">제2조 (서비스의 내용)</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>KOPIS 공공 데이터 기반 공연정보 검색</li>
            <li>공연 예매처 사이트 연결 (외부 사이트로 이동)</li>
            <li>공연 찜 및 내가 본 공연 기록 관리</li>
            <li>커뮤니티 게시판 (익명/회원)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">제3조 (회원가입 및 탈퇴)</h2>
          <p>
            회원가입 시 이용약관 및 개인정보처리방침에 대한 동의가 필요합니다.
            회원은 언제든지 설정 페이지에서 탈퇴할 수 있으며,
            탈퇴 시 개인정보는 즉시 파기됩니다.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">제4조 (이용자의 의무)</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>타인의 개인정보를 도용하여 가입하지 않습니다</li>
            <li>서비스를 이용하여 불법 행위를 하지 않습니다</li>
            <li>커뮤니티에 타인을 비방하거나 허위 정보를 게시하지 않습니다</li>
            <li>서비스의 운영을 방해하는 행위를 하지 않습니다</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">제5조 (면책사항)</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              PickShow는 공연정보를 KOPIS 공공 데이터를 기반으로 제공하며,
              정보의 정확성을 보장하지 않습니다.
            </li>
            <li>
              예매처 링크는 외부 사이트로 연결되며, 해당 사이트에서 발생하는 문제에 대해
              PickShow는 책임을 지지 않습니다.
            </li>
            <li>
              서비스 이용 중 발생하는 이용자 간 분쟁에 대해 PickShow는 책임을 지지 않습니다.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">제6조 (지적재산권)</h2>
          <p>
            서비스 내 콘텐츠(로고, 디자인, 소프트웨어)에 대한 지적재산권은 PickShow에 있습니다.
            이용자가 게시한 게시글의 저작권은 해당 이용자에게 있습니다.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">제7조 (분쟁 해결)</h2>
          <p>
            서비스 이용과 관련하여 분쟁이 발생한 경우, 대한민국 법률에 따라 해결하며,
            관할 법원은 서울중앙지방법원으로 합니다.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">부칙</h2>
          <p>이 약관은 2026년 4월 4일부터 시행됩니다.</p>
        </section>
      </div>
    </div>
  );
}
