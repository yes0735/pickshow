// Design Ref: §4.1 — GET/PUT/DELETE /api/community/posts/[id]
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPostDetail, updatePost, deletePost } from "@/features/community/service";
import { updatePostSchema } from "@/features/community/schema";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id } = await params;
  const post = await getPostDetail(id);

  if (!post) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "게시글을 찾을 수 없습니다" } },
      { status: 404 }
    );
  }

  // 수정/삭제 가능 여부: 회원이면 authorId, 익명이면 IP 비교
  const viewerIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-real-ip")
    ?? undefined;
  const canManage = session?.user?.id
    ? post.authorId === session.user.id
    : !!(viewerIp && post.ipAddress && viewerIp === post.ipAddress);

  return NextResponse.json({ data: { ...post, canManage } });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id } = await params;
  const body = await request.json();
  const parsed = updatePostSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "입력값이 올바르지 않습니다" } },
      { status: 400 }
    );
  }

  try {
    await updatePost(id, parsed.data, session?.user?.id ?? undefined);
    return NextResponse.json({ data: { message: "수정되었습니다" } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "NOT_FOUND") return NextResponse.json({ error: { code: "NOT_FOUND", message: "게시글을 찾을 수 없습니다" } }, { status: 404 });
    if (msg === "FORBIDDEN") return NextResponse.json({ error: { code: "FORBIDDEN", message: "권한이 없습니다" } }, { status: 403 });
    throw e;
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  try {
    await deletePost(id, session?.user?.id ?? undefined, body.anonymousPassword);
    return NextResponse.json({ data: { message: "삭제되었습니다" } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "NOT_FOUND") return NextResponse.json({ error: { code: "NOT_FOUND", message: "게시글을 찾을 수 없습니다" } }, { status: 404 });
    if (msg === "FORBIDDEN") return NextResponse.json({ error: { code: "FORBIDDEN", message: "권한이 없습니다" } }, { status: 403 });
    throw e;
  }
}
