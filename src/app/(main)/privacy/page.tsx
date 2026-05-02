// 개인정보처리방침 — 회원가입 없음, 로컬스토리지 기반 서비스
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "개인정보처리방침 | PickShow",
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <>
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-text-muted mb-4">
          <Link href="/" className="hover:text-mint-dark transition-colors">홈</Link>
          <span>›</span>
          <span className="text-text-secondary">개인정보처리방침</span>
        </nav>
      </div>
      <div className="max-w-3xl mx-auto px-4 pb-12">
        <h1 className="text-xl font-bold mb-6">개인정보처리방침</h1>

        <div className="bg-white rounded-2xl border border-border p-5 sm:p-8 space-y-6 text-sm leading-relaxed text-text-secondary">
          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">1. 개요</h2>
            <p>
              PickShow(이하 &quot;서비스&quot;)는 공연 예매처 통합 검색 서비스로, 별도의 회원가입 절차 없이
              이용할 수 있습니다. 본 방침은 서비스 이용 과정에서 수집되는 정보의 처리에 관한 사항을 안내합니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">2. 수집하는 정보</h2>
            <p className="mb-2">PickShow는 회원가입을 요구하지 않으며, 최소한의 정보만 처리합니다.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>로컬스토리지 저장 정보</strong>: 찜 목록, 내가 본 공연 기록, 최근 검색어 — 이용자의 브라우저에만 저장되며 서버로 전송되지 않습니다.</li>
              <li><strong>게시판 이용 시</strong>: 게시글·댓글 작성 시 IP 주소가 자동 수집됩니다 (작성자 식별 및 악용 방지 목적).</li>
              <li><strong>자동 수집</strong>: 서비스 접속 시 접속 IP, 접속 일시, 브라우저 정보가 서버 로그에 기록될 수 있습니다.</li>
              <li><strong>쿠키</strong>: Google AdSense 광고 제공을 위해 제3자 쿠키가 사용됩니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">3. 정보의 이용 목적</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>서비스 제공: 공연 검색, 예매처 연결</li>
              <li>게시판 운영: 게시글·댓글의 작성자 식별, 악성 이용 방지</li>
              <li>서비스 개선: 접속 통계, 서비스 품질 향상</li>
              <li>광고 제공: Google AdSense를 통한 광고 (쿠키 기반)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">4. 로컬스토리지 안내</h2>
            <p>
              찜 목록, 내가 본 공연, 최근 검색어 등의 데이터는 이용자의 웹 브라우저 로컬스토리지에 저장됩니다.
              이 데이터는 서버로 전송되지 않으며, 브라우저 데이터 삭제 시 함께 삭제됩니다.
              다른 기기나 브라우저에서는 해당 정보가 공유되지 않습니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">5. 개인정보의 보유 및 파기</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>게시판 IP 주소</strong>: 게시글·댓글 삭제 시 함께 파기됩니다.</li>
              <li><strong>서버 접속 로그</strong>: 통신비밀보호법에 따라 최대 3개월 보관 후 파기합니다.</li>
              <li><strong>로컬스토리지</strong>: 이용자가 직접 삭제하거나 브라우저 데이터 초기화 시 삭제됩니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">6. 제3자 제공 및 쿠키</h2>
            <p>
              PickShow는 이용자의 개인정보를 제3자에게 제공하지 않습니다.
              다만, Google AdSense 광고 서비스를 위해 쿠키가 수집될 수 있으며,
              이는 <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-mint-dark hover:underline">Google의 개인정보처리방침</a>에 따릅니다.
              이용자는 브라우저 설정에서 쿠키 저장을 거부할 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">7. 안전성 확보 조치</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>게시판 비밀번호 bcrypt 암호화 저장</li>
              <li>데이터베이스 SSL/TLS 암호화 통신</li>
              <li>XSS, CSRF 방어 조치</li>
              <li>HTTPS 전송 암호화</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">8. 이용자의 권리</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>게시글·댓글 삭제를 통한 IP 정보 삭제</li>
              <li>브라우저 로컬스토리지 삭제를 통한 저장 데이터 초기화</li>
              <li>브라우저 쿠키 설정을 통한 광고 쿠키 거부</li>
              <li>기타 문의: <a href="mailto:slaqmtm0735@gmail.com" className="text-mint-dark hover:underline">slaqmtm0735@gmail.com</a></li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">9. 공연 정보 출처</h2>
            <p>
              PickShow의 공연 정보는 KOPIS(공연예술통합전산망)의 공공데이터를 활용하며,
              예매처 링크는 해당 예매 사이트로의 연결만 제공합니다.
              실제 예매 및 결제는 각 예매처에서 이루어지며, PickShow는 예매 과정에서의 개인정보 처리에 관여하지 않습니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">10. 시행일</h2>
            <p>이 개인정보처리방침은 2026년 5월 3일부터 시행됩니다.</p>
          </section>
        </div>
      </div>
    </>
  );
}
