// Design Ref: §4.3 — 회원가입/로그인 zod 검증
import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("이메일 형식이 올바르지 않습니다"),
  password: z
    .string()
    .min(8, "비밀번호는 8자 이상이어야 합니다")
    .regex(/[a-zA-Z]/, "영문을 포함해야 합니다")
    .regex(/[0-9]/, "숫자를 포함해야 합니다"),
  nickname: z
    .string()
    .min(2, "닉네임은 2자 이상이어야 합니다")
    .max(20, "닉네임은 20자 이하여야 합니다"),
  agreeTerms: z.literal(true, { error: "이용약관 동의가 필요합니다" }),
  agreePrivacy: z.literal(true, { error: "개인정보처리방침 동의가 필요합니다" }),
  agreeMarketing: z.boolean().optional().default(false),
});

export const withdrawSchema = z.object({
  password: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
