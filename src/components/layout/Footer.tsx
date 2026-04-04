// Design Ref: §5.3 — Footer: 법적 페이지 링크, 저작권
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-bg-secondary">
      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-text-muted">
        <p>&copy; {new Date().getFullYear()} PickShow. All rights reserved.</p>
        <nav className="flex gap-4">
          <Link href="/privacy" className="hover:text-text-secondary transition-colors">
            개인정보처리방침
          </Link>
          <Link href="/terms" className="hover:text-text-secondary transition-colors">
            이용약관
          </Link>
        </nav>
      </div>
    </footer>
  );
}
