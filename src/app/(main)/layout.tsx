// Design Ref: §5.1 — 메인 레이아웃 (Header + 필터 사이드바 + 콘텐츠 + Footer)
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function MainLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <div className="flex-1">{children}</div>
      {modal}
      <Footer />
    </>
  );
}
