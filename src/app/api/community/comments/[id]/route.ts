// Design Ref: §4.1 — DELETE /api/community/comments/[id]
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { deleteComment } from "@/features/community/service";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  try {
    await deleteComment(id, session?.user?.id ?? undefined, body.anonymousPassword);
    return NextResponse.json({ data: { message: "삭제되었습니다" } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "NOT_FOUND") return NextResponse.json({ error: { code: "NOT_FOUND", message: "댓글을 찾을 수 없습니다" } }, { status: 404 });
    if (msg === "FORBIDDEN") return NextResponse.json({ error: { code: "FORBIDDEN", message: "권한이 없습니다" } }, { status: 403 });
    throw e;
  }
}
