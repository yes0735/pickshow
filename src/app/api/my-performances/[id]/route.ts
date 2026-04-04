// Design Ref: §4.1 — PUT/DELETE /api/my-performances/[id]
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateMyPerformance, deleteMyPerformance } from "@/features/my-performance/service";
import { updateMyPerformanceSchema } from "@/features/my-performance/schema";

export async function PUT(
  request: Request,
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
  const body = await request.json();
  const parsed = updateMyPerformanceSchema.safeParse(body);
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
    await updateMyPerformance(session.user.id, id, parsed.data);
    return NextResponse.json({ data: { message: "수정되었습니다" } });
  } catch (e) {
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "찾을 수 없습니다" } },
        { status: 404 }
      );
    }
    throw e;
  }
}

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
    await deleteMyPerformance(session.user.id, id);
    return NextResponse.json({ data: { message: "삭제되었습니다" } });
  } catch (e) {
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "찾을 수 없습니다" } },
        { status: 404 }
      );
    }
    throw e;
  }
}
