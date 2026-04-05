// Vercel Cron: 매일 KST 00:00 (UTC 15:00) — 공연 상태 자동 업데이트
// startDate/endDate 기준으로 upcoming → ongoing → completed 전환
import { NextRequest, NextResponse } from "next/server";
import { updatePerformanceStatuses } from "@/features/batch/service";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Invalid CRON_SECRET" } },
      { status: 401 }
    );
  }

  try {
    const result = await updatePerformanceStatuses();
    return NextResponse.json({
      data: {
        message: `Updated ${result.toOngoing} to ongoing, ${result.toCompleted} to completed`,
        toOngoing: result.toOngoing,
        toCompleted: result.toCompleted,
      },
    });
  } catch (e) {
    console.error("Status update batch failed:", e);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "상태 업데이트에 실패했습니다" } },
      { status: 500 }
    );
  }
}
