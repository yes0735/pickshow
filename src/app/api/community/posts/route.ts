// Design Ref: §4.1 — GET/POST /api/community/posts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPosts, createPost } from "@/features/community/service";
import { createPostSchema } from "@/features/community/schema";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const boardType = sp.get("boardType") ?? "anonymous";
  const category = sp.get("category") ?? undefined;
  const page = sp.get("page") ? Number(sp.get("page")) : 1;

  const result = await getPosts({ boardType, category, page });
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const session = await auth();
  const body = await request.json();
  const parsed = createPostSchema.safeParse(body);

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

  // 회원 게시판은 로그인 필수
  if (parsed.data.boardType === "member" && !session?.user?.id) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다" } },
      { status: 401 }
    );
  }

  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? request.headers.get("x-real-ip")
      ?? undefined;
    const data = await createPost(
      parsed.data,
      session?.user?.id ?? undefined,
      session?.user?.name ?? undefined,
      ip
    );
    return NextResponse.json({ data }, { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다" } },
        { status: 401 }
      );
    }
    throw e;
  }
}
