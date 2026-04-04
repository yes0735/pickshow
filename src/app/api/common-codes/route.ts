// Design Ref: §4.1 — GET /api/common-codes (필터 옵션용 공통코드)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const group = request.nextUrl.searchParams.get("group");

  const where = group ? { group, isActive: true } : { isActive: true };

  const codes = await prisma.commonCode.findMany({
    where,
    orderBy: [{ group: "asc" }, { sortOrder: "asc" }],
  });

  return NextResponse.json({ data: codes });
}
