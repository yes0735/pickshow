// Design Ref: §4.3 — POST /api/auth/register (이메일 회원가입)
import { NextResponse } from "next/server";
import { registerSchema } from "@/features/auth/schema";
import { registerUser, ConflictError } from "@/features/auth/service";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = registerSchema.safeParse(body);

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
    const user = await registerUser(parsed.data);
    return NextResponse.json({ data: user }, { status: 201 });
  } catch (e) {
    if (e instanceof ConflictError) {
      return NextResponse.json(
        { error: { code: "CONFLICT", message: e.message } },
        { status: 409 }
      );
    }
    throw e;
  }
}
