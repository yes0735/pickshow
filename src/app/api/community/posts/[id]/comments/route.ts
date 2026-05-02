// GET/POST /api/community/posts/[id]/comments
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createComment, getCommentsByPostId } from "@/features/community/service";
import { createCommentSchema } from "@/features/community/schema";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id: postId } = await params;
  const page = Number(request.nextUrl.searchParams.get("page") ?? "1");
  const limit = Number(request.nextUrl.searchParams.get("limit") ?? "10");
  const viewerIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-real-ip")
    ?? undefined;

  const result = await getCommentsByPostId(postId, { page, limit, viewerIp, viewerId: session?.user?.id });
  return NextResponse.json(result);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id: postId } = await params;
  const body = await request.json();
  const parsed = createCommentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "입력값이 올바르지 않습니다" } },
      { status: 400 }
    );
  }

  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? request.headers.get("x-real-ip")
      ?? undefined;
    const data = await createComment(
      postId,
      parsed.data,
      session?.user?.id ?? undefined,
      session?.user?.name ?? undefined,
      ip
    );
    return NextResponse.json({ data }, { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "게시글을 찾을 수 없습니다" } },
        { status: 404 }
      );
    }
    throw e;
  }
}
