// Design Ref: §2.2 — Vercel Cron 배치 (매일 KST 01:00 = UTC 16:00)
// Plan SC: FR-10 KOPIS 배치 동기화
import { NextRequest, NextResponse } from "next/server";
import { syncPerformancesFromKopis } from "@/features/batch/service";

export async function POST(request: NextRequest) {
  // CRON_SECRET 검증
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Invalid CRON_SECRET" } },
      { status: 401 }
    );
  }

  try {
    const result = await syncPerformancesFromKopis();
    return NextResponse.json({
      data: { message: `Synced ${result.totalSynced} performances` },
    });
  } catch (e) {
    console.error("Batch sync failed:", e);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "배치 동기화에 실패했습니다" } },
      { status: 500 }
    );
  }
}
