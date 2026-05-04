// 메인 레이아웃 — Header + 콘텐츠 + Footer + BottomTabBar(모바일)
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BackToTop from "@/components/ui/BackToTop";
import BottomTabBar from "@/components/layout/BottomTabBar";

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
      <div className="flex-1 pb-14 md:pb-0">{children}</div>
      {modal}
      <Footer />
      <BackToTop />
      <BottomTabBar />
    </>
  );
}
