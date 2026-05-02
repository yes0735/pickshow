// Design Ref: §2.2 — Vercel Cron 배치 (매일 KST 01:00 = UTC 16:00)
// Plan SC: FR-10 KOPIS 배치 동기화
import { NextRequest, NextResponse } from "next/server";
import { syncPerformancesFromKopis } from "@/features/batch/service";
import { notifyBatchResult } from "@/lib/notify";

export async function GET(request: NextRequest) {
  // CRON_SECRET 검증 (Vercel Cron은 GET + Authorization 헤더로 호출)
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Invalid CRON_SECRET" } },
      { status: 401 }
    );
  }

  try {
    const result = await syncPerformancesFromKopis();
    const summary = `신규 ${result.totalSynced}건 동기화, ${result.totalSkipped}건 스킵`;
    await notifyBatchResult({ jobName: "KOPIS 공연 동기화", success: true, summary });
    return NextResponse.json({
      data: {
        message: `Synced ${result.totalSynced} new, skipped ${result.totalSkipped} existing`,
        synced: result.totalSynced,
        skipped: result.totalSkipped,
      },
    });
  } catch (e) {
    console.error("Batch sync failed:", e);
    await notifyBatchResult({
      jobName: "KOPIS 공연 동기화",
      success: false,
      summary: "배치 동기화 실패",
      error: e instanceof Error ? e.message : String(e),
    });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "배치 동기화에 실패했습니다" } },
      { status: 500 }
    );
  }
}
