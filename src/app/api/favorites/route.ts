// Design Ref: §4.1 — GET/POST /api/favorites (찜 목록, 등록)
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getFavorites, addFavorite } from "@/features/favorite/service";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다" } },
      { status: 401 }
    );
  }

  const data = await getFavorites(session.user.id);
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다" } },
      { status: 401 }
    );
  }

  const { performanceId } = await request.json();
  if (!performanceId) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "performanceId가 필요합니다" } },
      { status: 400 }
    );
  }

  try {
    const data = await addFavorite(session.user.id, performanceId);
    return NextResponse.json({ data }, { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.message === "CONFLICT") {
      return NextResponse.json(
        { error: { code: "CONFLICT", message: "이미 찜한 공연입니다" } },
        { status: 409 }
      );
    }
    throw e;
  }
}
