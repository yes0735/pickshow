// 공연 상세 동적 OG 이미지 — 포스터 + 공연 정보
import { ImageResponse } from "next/og";
import { getPerformanceById } from "@/features/search/service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const performance = await getPerformanceById(id);

  if (!performance) {
    // 공연 없으면 기본 OG 이미지
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#FEFEFE",
            fontSize: 40,
            color: "#999",
          }}
        >
          공연을 찾을 수 없습니다
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }

  const startDate = new Date(performance.startDate);
  const endDate = new Date(performance.endDate);
  const dateStr = `${fmt(startDate)} ~ ${fmt(endDate)}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "linear-gradient(135deg, #f8fafb 0%, #FEFEFE 100%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* 왼쪽: 포스터 */}
        {performance.posterUrl && (
          <div
            style={{
              width: 400,
              height: 630,
              display: "flex",
              overflow: "hidden",
            }}
          >
            <img
              src={performance.posterUrl}
              alt=""
              width={400}
              height={630}
              style={{ objectFit: "cover" }}
            />
          </div>
        )}

        {/* 오른쪽: 정보 */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "40px 50px",
          }}
        >
          {/* 상태 뱃지 */}
          <div
            style={{
              display: "flex",
              marginBottom: 16,
            }}
          >
            <span
              style={{
                padding: "6px 16px",
                borderRadius: 999,
                background: "#A8E6CF",
                color: "#333",
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              {mapStatus(performance.status)}
            </span>
          </div>

          {/* 제목 */}
          <div
            style={{
              fontSize: 36,
              fontWeight: 800,
              color: "#333333",
              lineHeight: 1.3,
              marginBottom: 20,
              overflow: "hidden",
              display: "-webkit-box",
            }}
          >
            {performance.title}
          </div>

          {/* 장소 */}
          <div
            style={{
              fontSize: 20,
              color: "#666666",
              marginBottom: 8,
            }}
          >
            {performance.venue}
          </div>

          {/* 기간 */}
          <div
            style={{
              fontSize: 18,
              color: "#999999",
              marginBottom: 24,
            }}
          >
            {dateStr}
          </div>

          {/* 가격 */}
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: "#FF8FA3",
              marginBottom: 30,
            }}
          >
            {performance.price || "가격 미정"}
          </div>

          {/* PickShow 로고 */}
          <div style={{ display: "flex", alignItems: "baseline", fontSize: 24, fontWeight: 800 }}>
            <span style={{ color: "#7EC8A0" }}>Pick</span>
            <span style={{ color: "#FF8FA3" }}>Show</span>
            <span style={{ color: "#999", fontSize: 14, marginLeft: 12, fontWeight: 400 }}>
              공연 예매처 통합 검색
            </span>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}

function fmt(d: Date): string {
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function mapStatus(status: string): string {
  switch (status) {
    case "upcoming": return "공연예정";
    case "ongoing": return "공연중";
    case "completed": return "공연완료";
    default: return status;
  }
}
