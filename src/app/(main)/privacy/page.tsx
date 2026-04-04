// Design Ref: §8.4 + FR-14 — 개인정보처리방침 페이지
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보처리방침",
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">개인정보처리방침</h1>

      <div className="prose prose-sm max-w-none space-y-6 text-sm leading-relaxed text-text-secondary">
        <section>
          <h2 className="text-base font-semibold text-foreground">1. 수집하는 개인정보 항목</h2>
          <p>PickShow는 서비스 제공을 위해 다음의 개인정보를 수집합니다.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>필수 항목</strong>: 이메일 주소, 비밀번호(암호화 저장), 닉네임</li>
            <li><strong>소셜 로그인 시</strong>: 소셜 계정 식별자, 이름(닉네임)</li>
            <li><strong>자동 수집</strong>: 접속 IP, 접속 일시, 쿠키</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">2. 개인정보의 수집 및 이용 목적</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>회원 가입 및 관리: 본인 확인, 서비스 이용</li>
            <li>서비스 제공: 공연 찜, 내가 본 공연, 커뮤니티 기능</li>
            <li>서비스 개선: 이용 통계, 서비스 품질 향상</li>
            <li>광고 제공: Google AdSense를 통한 맞춤형 광고 (쿠키 기반)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">3. 개인정보의 보유 및 이용 기간</h2>
          <p>
            회원 탈퇴 시 개인정보를 즉시 파기합니다.
            단, 관련 법령에 의해 보존할 필요가 있는 경우 해당 기간 동안 보관합니다.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>전자상거래 등에서의 소비자 보호에 관한 법률: 계약 또는 청약철회 등에 관한 기록 (5년)</li>
            <li>통신비밀보호법: 접속 로그 기록 (3개월)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">4. 개인정보의 파기</h2>
          <p>
            회원 탈퇴 시 이메일, 비밀번호, 소셜 연동 정보는 즉시 파기됩니다.
            찜 목록, 내가 본 공연 기록은 삭제됩니다.
            게시글 및 댓글의 작성자 정보는 &quot;탈퇴회원&quot;으로 대체됩니다.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">5. 제3자 제공</h2>
          <p>
            PickShow는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다.
            다만, Google AdSense 광고 서비스를 위해 쿠키가 수집될 수 있으며,
            이는 Google의 개인정보처리방침에 따릅니다.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">6. 쿠키 사용</h2>
          <p>
            PickShow는 Google AdSense를 통한 광고 제공을 위해 쿠키를 사용합니다.
            이용자는 웹 브라우저 설정을 통해 쿠키 저장을 거부할 수 있으며,
            사이트 접속 시 표시되는 쿠키 동의 배너에서 동의/거부를 선택할 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">7. 안전성 확보 조치</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>비밀번호 bcrypt 암호화 저장</li>
            <li>JWT 토큰 httpOnly 쿠키 저장 및 만료 관리</li>
            <li>데이터베이스 SSL/TLS 암호화 통신</li>
            <li>XSS, CSRF 방어 조치</li>
            <li>로그인 시도 Rate Limiting</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">8. 정보주체의 권리</h2>
          <p>이용자는 언제든지 다음의 권리를 행사할 수 있습니다.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>개인정보 열람 요구</li>
            <li>개인정보 정정 및 삭제 요구</li>
            <li>개인정보 처리 정지 요구</li>
            <li>회원 탈퇴 (설정 &gt; 회원 탈퇴)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">9. 시행일</h2>
          <p>이 개인정보처리방침은 2026년 4월 4일부터 시행됩니다.</p>
        </section>
      </div>
    </div>
  );
}
