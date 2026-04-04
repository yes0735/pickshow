// Design Ref: §4.1 — GET/POST /api/my-performances
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getMyPerformances, addMyPerformance } from "@/features/my-performance/service";
import { createMyPerformanceSchema } from "@/features/my-performance/schema";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다" } },
      { status: 401 }
    );
  }

  const data = await getMyPerformances(session.user.id);
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

  const body = await request.json();
  const parsed = createMyPerformanceSchema.safeParse(body);
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

  try {
    const data = await addMyPerformance(session.user.id, parsed.data);
    return NextResponse.json({ data }, { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.message === "CONFLICT") {
      return NextResponse.json(
        { error: { code: "CONFLICT", message: "이미 등록된 공연입니다" } },
        { status: 409 }
      );
    }
    throw e;
  }
}
