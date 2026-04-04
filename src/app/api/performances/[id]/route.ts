// Design Ref: §4.1 — GET /api/performances/[id] (상세 조회)
import { NextResponse } from "next/server";
import { getPerformanceById } from "@/features/search/service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const performance = await getPerformanceById(id);

  if (!performance) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "공연을 찾을 수 없습니다" } },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: performance });
}
