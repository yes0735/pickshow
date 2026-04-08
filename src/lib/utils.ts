// Design Ref: §9.1 Infrastructure Layer — 공통 유틸리티

export function formatDate(date: Date): string {
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

export function formatDateRange(start: Date, end: Date): string {
  return `${formatDate(start)} ~ ${formatDate(end)}`;
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("ko-KR").format(price) + "원";
}

export function formatPriceRange(
  minPrice: number | null,
  maxPrice: number | null
): string {
  if (minPrice === null && maxPrice === null) return "가격 미정";
  if (minPrice === 0 && (maxPrice === 0 || maxPrice === null)) return "무료";
  if (minPrice !== null && maxPrice !== null && minPrice === maxPrice) {
    return formatPrice(minPrice);
  }
  if (minPrice !== null && maxPrice !== null) {
    return `${formatPrice(minPrice)} ~ ${formatPrice(maxPrice)}`;
  }
  return minPrice !== null ? `${formatPrice(minPrice)}~` : `~${formatPrice(maxPrice!)}`;
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + "...";
}

export function getRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 7) return `${days}일 전`;
  return formatDate(date);
}

const GENRE_LABELS: Record<string, string> = {
  musical: "뮤지컬",
  theater: "연극",
  concert: "콘서트",
  classic: "클래식",
  dance: "무용",
  korean: "국악",
  etc: "기타",
};

export function genreLabel(code: string): string {
  return GENRE_LABELS[code] ?? code;
}
