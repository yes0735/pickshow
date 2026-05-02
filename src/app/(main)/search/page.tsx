// 검색 페이지 — useSearchParams를 Suspense로 감싸야 빌드 시 프리렌더 가능
import { Suspense } from "react";
import SearchPageClient from "./SearchPageClient";

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-12">
        <div className="h-12 rounded-full bg-bg-secondary animate-pulse mb-6" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-8 rounded-lg bg-bg-secondary animate-pulse" />
          ))}
        </div>
      </div>
    }>
      <SearchPageClient />
    </Suspense>
  );
}
