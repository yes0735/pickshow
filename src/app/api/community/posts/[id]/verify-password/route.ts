// Design Ref: §4.1 — POST /api/community/posts/[id]/verify-password
// 익명 게시글 수정 전 비밀번호만 사전 검증 (수정 페이지 게이트)
import { NextResponse } from "next/server";
import { verifyPostPassword } from "@/features/community/service";
import { verifyPasswordSchema } from "@/features/community/schema";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = verifyPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "비밀번호를 입력해주세요",
        },
      },
      { status: 400 },
    );
  }

  try {
    const valid = await verifyPostPassword(id, parsed.data.anonymousPassword);
    if (!valid) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "비밀번호가 일치하지 않습니다" } },
        { status: 403 },
      );
    }
    return NextResponse.json({ data: { valid: true } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "NOT_FOUND")
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "게시글을 찾을 수 없습니다" } },
        { status: 404 },
      );
    if (msg === "FORBIDDEN")
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "권한이 없습니다" } },
        { status: 403 },
      );
    throw e;
  }
}
