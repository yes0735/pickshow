// Vercel Cron: 매일 KST 00:00 (UTC 15:00) — 공연 상태 자동 업데이트
// startDate/endDate 기준으로 upcoming → ongoing → completed 전환
import { NextRequest, NextResponse } from "next/server";
import { updatePerformanceStatuses } from "@/features/batch/service";
import { notifyBatchResult } from "@/lib/notify";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Invalid CRON_SECRET" } },
      { status: 401 }
    );
  }

  try {
    const result = await updatePerformanceStatuses();
    const summary = `공연중 전환 ${result.toOngoing}건, 공연종료 전환 ${result.toCompleted}건`;
    await notifyBatchResult({ jobName: "공연 상태 업데이트", success: true, summary });
    return NextResponse.json({
      data: {
        message: `Updated ${result.toOngoing} to ongoing, ${result.toCompleted} to completed`,
        toOngoing: result.toOngoing,
        toCompleted: result.toCompleted,
      },
    });
  } catch (e) {
    console.error("Status update batch failed:", e);
    await notifyBatchResult({
      jobName: "공연 상태 업데이트",
      success: false,
      summary: "상태 업데이트 실패",
      error: e instanceof Error ? e.message : String(e),
    });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "상태 업데이트에 실패했습니다" } },
      { status: 500 }
    );
  }
}
