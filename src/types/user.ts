// Design Ref: §3.1 — User entity

export interface UserProfile {
  id: string;
  email: string;
  nickname: string;
  provider: "email" | "google" | "kakao";
  createdAt: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  nickname: string;
  agreeTerms: boolean;
  agreePrivacy: boolean;
  agreeMarketing?: boolean;
}
