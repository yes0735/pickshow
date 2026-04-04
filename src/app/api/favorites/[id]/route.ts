// Design Ref: §4.1 — DELETE /api/favorites/[id] (찜 해제)
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { removeFavorite } from "@/features/favorite/service";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다" } },
      { status: 401 }
    );
  }

  const { id } = await params;

  try {
    await removeFavorite(session.user.id, id);
    return NextResponse.json({ data: { message: "찜이 해제되었습니다" } });
  } catch (e) {
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "찜을 찾을 수 없습니다" } },
        { status: 404 }
      );
    }
    throw e;
  }
}
