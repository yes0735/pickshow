// Design Ref: §4.2 — 공통 응답 형식

export interface ApiResponse<T> {
  data: T;
  pagination?: Pagination;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: {
      fieldErrors?: Record<string, string[]>;
    };
  };
}

export interface Pagination {
  cursor: string | null;
  hasNext: boolean;
  total: number;
}

export interface PagePagination {
  page: number;
  totalPages: number;
  total: number;
}

export interface CommonCode {
  id: string;
  group: string;
  code: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
}

export type SortOption = "title" | "price_asc" | "price_desc";

export type ViewMode = "card" | "list";
