// Design Ref: §3.1 — BoardPost, BoardComment entities

export type BoardType = "anonymous" | "member";

export type BoardCategory = "promotion" | "info" | "wanted" | "transfer";

export interface BoardPost {
  id: string;
  boardType: BoardType;
  category: BoardCategory;
  title: string;
  content: string;
  authorId: string | null;
  authorNickname: string;
  viewCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface BoardComment {
  id: string;
  postId: string;
  authorId: string | null;
  authorNickname: string;
  content: string;
  createdAt: string;
}

export interface MyPerformance {
  id: string;
  performanceId: string;
  rating: number;
  review: string | null;
  seatInfo: string | null;
  ticketSite: string | null;
  viewedAt: string | null;
  performance?: {
    title: string;
    posterUrl: string | null;
    venue: string;
  };
}
