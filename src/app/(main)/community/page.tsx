// Design Ref: §5.4 — 커뮤니티 메인 (익명/회원 게시판 탭)
import Link from "next/link";
import { redirect } from "next/navigation";

export default function CommunityPage() {
  redirect("/community/anonymous");
}
