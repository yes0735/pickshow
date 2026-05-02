// Design Ref: §4.1 — 커뮤니티 게시판/댓글 비즈니스 로직
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type {
  CreatePostInput,
  UpdatePostInput,
  CreateCommentInput,
  UpdateCommentInput,
} from "./schema";

// 게시글 목록 (전통 페이지네이션)
export async function getPosts(params: {
  boardType: string;
  category?: string;
  page?: number;
  limit?: number;
}) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const where = {
    boardType: params.boardType,
    ...(params.category ? { category: params.category } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.boardPost.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        boardType: true,
        category: true,
        title: true,
        authorNickname: true,
        viewCount: true,
        commentCount: true,
        createdAt: true,
      },
    }),
    prisma.boardPost.count({ where }),
  ]);

  return {
    data: items.map((i) => ({ ...i, createdAt: i.createdAt.toISOString() })),
    pagination: { page, totalPages: Math.ceil(total / limit), total },
  };
}

// 게시글 상세 (댓글 별도 조회)
export async function getPostDetail(id: string) {
  const post = await prisma.boardPost.findUnique({
    where: { id },
  });

  if (!post) return null;

  // 조회수 증가
  await prisma.boardPost.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
  });

  return {
    ...post,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  };
}

// 댓글 페이징 조회 — IP 기반 익명 번호 + 글쓴이 판별
export async function getCommentsByPostId(postId: string, params?: { page?: number; limit?: number; viewerIp?: string; viewerId?: string }) {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 10;
  const viewerIp = params?.viewerIp;
  const viewerId = params?.viewerId;

  // 전체 댓글의 IP/authorId를 등장 순서대로 가져와 익명 번호 매핑 생성
  const [post, allComments, items, total] = await Promise.all([
    prisma.boardPost.findUnique({ where: { id: postId }, select: { ipAddress: true, authorId: true } }),
    prisma.boardComment.findMany({
      where: { postId },
      orderBy: { createdAt: "asc" },
      select: { ipAddress: true, authorId: true },
    }),
    prisma.boardComment.findMany({
      where: { postId },
      orderBy: { createdAt: "asc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        authorNickname: true,
        authorId: true,
        ipAddress: true,
        content: true,
        createdAt: true,
      },
    }),
    prisma.boardComment.count({ where: { postId } }),
  ]);

  // IP/authorId → 익명 번호 매핑 (등장 순서, 글쓴이 제외)
  // IP/authorId → 익명 번호 매핑 (등장 순서, 글쓴이 제외)
  const anonMap = new Map<string, number>();
  let anonCounter = 0;
  for (const c of allComments) {
    const key = c.authorId ?? c.ipAddress ?? "";
    if (!key) continue;
    const isWriter = c.authorId && post?.authorId
      ? c.authorId === post.authorId
      : !!(c.ipAddress && post?.ipAddress && c.ipAddress === post.ipAddress);
    if (isWriter) continue;
    if (!anonMap.has(key)) {
      anonCounter++;
      anonMap.set(key, anonCounter);
    }
  }

  return {
    data: items.map((c) => {
      const isWriter = c.authorId && post?.authorId
        ? c.authorId === post.authorId
        : !!(c.ipAddress && post?.ipAddress && c.ipAddress === post.ipAddress);
      const key = c.authorId ?? c.ipAddress ?? "";
      const anonNumber = anonMap.get(key);
      const displayName = isWriter
        ? "글쓴이"
        : anonNumber
          ? `익명_${anonNumber}`
          : c.authorNickname;
      // 댓글 수정/삭제 가능 여부: 회원이면 authorId, 익명이면 IP 비교
      const canManage = viewerId
        ? c.authorId === viewerId
        : !!(viewerIp && c.ipAddress && viewerIp === c.ipAddress);
      return {
        id: c.id,
        authorNickname: displayName,
        authorId: c.authorId,
        content: c.content,
        createdAt: c.createdAt.toISOString(),
        isWriter,
        canManage,
      };
    }),
    pagination: { page, totalPages: Math.ceil(total / limit), total },
  };
}

// 게시글 작성
export async function createPost(input: CreatePostInput, userId?: string, userNickname?: string, ipAddress?: string) {
  const data: Parameters<typeof prisma.boardPost.create>[0]["data"] = {
    boardType: input.boardType,
    category: input.category,
    title: input.title,
    content: input.content,
    authorNickname: "",
    ipAddress: ipAddress ?? null,
  };

  if (input.boardType === "anonymous") {
    data.authorNickname = input.authorNickname ?? "익명";
    if (input.anonymousPassword) {
      data.anonymousPassword = await bcrypt.hash(input.anonymousPassword, 10);
    }
  } else {
    if (!userId) throw new Error("UNAUTHORIZED");
    data.authorId = userId;
    data.authorNickname = userNickname ?? "회원";
  }

  const post = await prisma.boardPost.create({ data });
  return { id: post.id };
}

// 게시글 수정
export async function updatePost(id: string, input: UpdatePostInput, userId?: string) {
  const post = await prisma.boardPost.findUnique({ where: { id } });
  if (!post) throw new Error("NOT_FOUND");

  // 권한 확인
  if (post.boardType === "anonymous") {
    if (post.anonymousPassword && input.anonymousPassword) {
      const valid = await bcrypt.compare(input.anonymousPassword, post.anonymousPassword);
      if (!valid) throw new Error("FORBIDDEN");
    } else if (post.anonymousPassword) {
      throw new Error("FORBIDDEN");
    }
  } else {
    if (!userId || post.authorId !== userId) throw new Error("FORBIDDEN");
  }

  await prisma.boardPost.update({
    where: { id },
    data: {
      ...(input.title && { title: input.title }),
      ...(input.content && { content: input.content }),
    },
  });
}

// 게시글 삭제
export async function deletePost(id: string, userId?: string, anonymousPassword?: string) {
  const post = await prisma.boardPost.findUnique({ where: { id } });
  if (!post) throw new Error("NOT_FOUND");

  if (post.boardType === "anonymous") {
    if (post.anonymousPassword && anonymousPassword) {
      const valid = await bcrypt.compare(anonymousPassword, post.anonymousPassword);
      if (!valid) throw new Error("FORBIDDEN");
    } else if (post.anonymousPassword) {
      throw new Error("FORBIDDEN");
    }
  } else {
    if (!userId || post.authorId !== userId) throw new Error("FORBIDDEN");
  }

  await prisma.boardPost.delete({ where: { id } });
}

// 댓글 작성
export async function createComment(
  postId: string,
  input: CreateCommentInput,
  userId?: string,
  userNickname?: string,
  ipAddress?: string
) {
  const post = await prisma.boardPost.findUnique({ where: { id: postId } });
  if (!post) throw new Error("NOT_FOUND");

  const data: Parameters<typeof prisma.boardComment.create>[0]["data"] = {
    postId,
    content: input.content,
    authorNickname: "",
    ipAddress: ipAddress ?? null,
  };

  if (userId) {
    data.authorId = userId;
    data.authorNickname = userNickname ?? "회원";
  } else {
    data.authorNickname = input.authorNickname ?? "익명";
    if (input.anonymousPassword) {
      data.anonymousPassword = await bcrypt.hash(input.anonymousPassword, 10);
    }
  }

  const [comment] = await prisma.$transaction([
    prisma.boardComment.create({ data }),
    prisma.boardPost.update({
      where: { id: postId },
      data: { commentCount: { increment: 1 } },
    }),
  ]);

  return { id: comment.id };
}

// 댓글 수정
export async function updateComment(
  id: string,
  input: UpdateCommentInput,
  userId?: string,
) {
  const comment = await prisma.boardComment.findUnique({ where: { id } });
  if (!comment) throw new Error("NOT_FOUND");

  // 권한 확인
  if (comment.authorId) {
    // 회원 댓글: 본인만
    if (!userId || comment.authorId !== userId) throw new Error("FORBIDDEN");
  } else {
    // 익명 댓글: 비밀번호 검증
    if (!comment.anonymousPassword) throw new Error("FORBIDDEN");
    if (!input.anonymousPassword) throw new Error("FORBIDDEN");
    const valid = await bcrypt.compare(
      input.anonymousPassword,
      comment.anonymousPassword,
    );
    if (!valid) throw new Error("FORBIDDEN");
  }

  await prisma.boardComment.update({
    where: { id },
    data: { content: input.content },
  });
}

// 댓글 삭제
export async function deleteComment(id: string, userId?: string, anonymousPassword?: string) {
  const comment = await prisma.boardComment.findUnique({ where: { id } });
  if (!comment) throw new Error("NOT_FOUND");

  if (comment.authorId) {
    if (!userId || comment.authorId !== userId) throw new Error("FORBIDDEN");
  } else if (comment.anonymousPassword && anonymousPassword) {
    const valid = await bcrypt.compare(anonymousPassword, comment.anonymousPassword);
    if (!valid) throw new Error("FORBIDDEN");
  } else if (comment.anonymousPassword) {
    throw new Error("FORBIDDEN");
  }

  await prisma.$transaction([
    prisma.boardComment.delete({ where: { id } }),
    prisma.boardPost.update({
      where: { id: comment.postId },
      data: { commentCount: { decrement: 1 } },
    }),
  ]);
}

// 게시글 비밀번호 검증 (수정 페이지 진입 게이트)
export async function verifyPostPassword(
  id: string,
  password: string,
): Promise<boolean> {
  const post = await prisma.boardPost.findUnique({
    where: { id },
    select: { boardType: true, anonymousPassword: true },
  });
  if (!post) throw new Error("NOT_FOUND");
  if (post.boardType !== "anonymous") throw new Error("FORBIDDEN");
  if (!post.anonymousPassword) return false;
  return bcrypt.compare(password, post.anonymousPassword);
}
