// Design Ref: §4.1 — GET /api/performances (검색, 필터, 정렬, 커서 페이징)
import { NextRequest, NextResponse } from "next/server";
import { searchParamsSchema } from "@/features/search/schema";
import { searchPerformances } from "@/features/search/service";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const raw = Object.fromEntries(searchParams.entries());

  const parsed = searchParamsSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "입력값이 올바르지 않습니다",
          details: { fieldErrors: parsed.error.flatten().fieldErrors },
        },
      },
      { status: 400 }
    );
  }

  const result = await searchPerformances(parsed.data);
  return NextResponse.json(result);
}
