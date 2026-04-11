// Plan SC: FR-02 — next.config.ts remotePatterns 동기화
// next/image는 화이트리스트에 없는 호스트를 런타임 에러로 거부하므로,
// 포스터 URL이 등록되지 않은 도메인일 때 `unoptimized` prop으로 fallback 한다.

const EXACT_HOSTS = new Set<string>([
  "www.kopis.or.kr",
  "kopis.or.kr",
]);

const SUFFIX_HOSTS = [
  ".ticketlink.co.kr",
  ".interpark.com",
  ".melon.co.kr",
  ".yes24.com",
];

export function isOptimizableHost(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const { hostname } = new URL(url);
    if (EXACT_HOSTS.has(hostname)) return true;
    return SUFFIX_HOSTS.some((suffix) => hostname.endsWith(suffix));
  } catch {
    return false;
  }
}
