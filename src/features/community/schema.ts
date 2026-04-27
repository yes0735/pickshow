// Design Ref: §4.1 — 게시판/댓글 zod 검증
import { z } from "zod";

export const createPostSchema = z.object({
  boardType: z.enum(["anonymous", "member"]),
  category: z.enum(["promotion", "info", "wanted", "transfer"]),
  title: z.string().min(1, "제목을 입력해주세요").max(100),
  content: z.string().min(1, "내용을 입력해주세요").max(5000),
  // 익명 게시판 전용
  authorNickname: z.string().min(1).max(20).optional(),
  anonymousPassword: z.string().min(4).max(20).optional(),
});

export const updatePostSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  content: z.string().min(1).max(5000).optional(),
  anonymousPassword: z.string().optional(), // 익명글 수정 시 비밀번호 확인
});

export const createCommentSchema = z.object({
  content: z.string().min(1, "댓글을 입력해주세요").max(1000),
  authorNickname: z.string().min(1).max(20).optional(),
  anonymousPassword: z.string().min(4).max(20).optional(),
});

export const updateCommentSchema = z.object({
  content: z.string().min(1, "댓글을 입력해주세요").max(1000),
  anonymousPassword: z.string().optional(), // 익명 댓글 수정 시 비밀번호 확인
});

export const verifyPasswordSchema = z.object({
  anonymousPassword: z.string().min(1, "비밀번호를 입력해주세요"),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
export type VerifyPasswordInput = z.infer<typeof verifyPasswordSchema>;
