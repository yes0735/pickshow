// Design Ref: §4.3 + §8.3 — 회원가입, 회원탈퇴+파기 로직
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { RegisterInput } from "./schema";

export async function registerUser(input: RegisterInput) {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existing) {
    throw new ConflictError("이미 가입된 이메일입니다");
  }

  const hashedPassword = await bcrypt.hash(input.password, 10);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      password: hashedPassword,
      nickname: input.nickname,
      provider: "email",
      agreeTerms: input.agreeTerms,
      agreePrivacy: input.agreePrivacy,
      agreeMarketing: input.agreeMarketing ?? false,
    },
  });

  return { id: user.id, email: user.email, nickname: user.nickname };
}

// Plan SC: FR-17 회원탈퇴 + 개인정보 즉시 파기
export async function withdrawUser(userId: string, password?: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.isDeleted) {
    throw new NotFoundError("사용자를 찾을 수 없습니다");
  }

  // 이메일 가입 사용자는 비밀번호 확인
  if (user.provider === "email" && user.password) {
    if (!password) throw new ValidationError("비밀번호를 입력해주세요");
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw new ValidationError("비밀번호가 올바르지 않습니다");
  }

  // 트랜잭션으로 파기 처리
  await prisma.$transaction([
    // 1. 개인정보 파기 (이메일, 비밀번호, 소셜 연동)
    prisma.user.update({
      where: { id: userId },
      data: {
        email: `deleted_${userId}@pickshow.kr`,
        password: null,
        providerId: null,
        nickname: "탈퇴회원",
        isDeleted: true,
      },
    }),
    // 2. 찜 목록 삭제
    prisma.favorite.deleteMany({ where: { userId } }),
    // 3. 내가 본 공연 삭제
    prisma.myPerformance.deleteMany({ where: { userId } }),
    // 4. 게시글 작성자 "탈퇴회원" 처리
    prisma.boardPost.updateMany({
      where: { authorId: userId },
      data: { authorNickname: "탈퇴회원" },
    }),
    // 5. 댓글 작성자 "탈퇴회원" 처리
    prisma.boardComment.updateMany({
      where: { authorId: userId },
      data: { authorNickname: "탈퇴회원" },
    }),
  ]);
}

// Custom error classes
export class ConflictError extends Error {
  code = "CONFLICT" as const;
}
export class NotFoundError extends Error {
  code = "NOT_FOUND" as const;
}
export class ValidationError extends Error {
  code = "VALIDATION_ERROR" as const;
}
