// Design Ref: §4.3 — DELETE /api/auth/withdraw (회원탈퇴 + 개인정보 파기)
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { withdrawSchema } from "@/features/auth/schema";
import { withdrawUser, ValidationError, NotFoundError } from "@/features/auth/service";

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다" } },
      { status: 401 }
    );
  }

  const body = await request.json();
  const parsed = withdrawSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "입력값이 올바르지 않습니다" } },
      { status: 400 }
    );
  }

  try {
    await withdrawUser(session.user.id, parsed.data.password);
    return NextResponse.json({ data: { message: "회원 탈퇴가 완료되었습니다." } });
  } catch (e) {
    if (e instanceof ValidationError) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: e.message } },
        { status: 400 }
      );
    }
    if (e instanceof NotFoundError) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: e.message } },
        { status: 404 }
      );
    }
    throw e;
  }
}
