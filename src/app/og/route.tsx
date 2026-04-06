// 메인 사이트 OG 이미지 (1200x630)
import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #A8E6CF 0%, #FEFEFE 50%, #FFB7C5 100%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* 로고 */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            fontSize: 80,
            fontWeight: 800,
            letterSpacing: "-2px",
            marginBottom: 20,
          }}
        >
          <span style={{ color: "#7EC8A0" }}>Pick</span>
          <span style={{ color: "#FF8FA3" }}>Show</span>
        </div>

        {/* 설명 */}
        <div
          style={{
            fontSize: 28,
            color: "#666666",
            fontWeight: 500,
            marginBottom: 40,
          }}
        >
          공연 예매처 통합 검색 서비스
        </div>

        {/* 키워드 태그 */}
        <div style={{ display: "flex", gap: 12 }}>
          {["뮤지컬", "연극", "콘서트", "클래식"].map((tag) => (
            <div
              key={tag}
              style={{
                padding: "8px 20px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.7)",
                border: "1px solid #E8E8E8",
                fontSize: 18,
                color: "#333333",
                fontWeight: 500,
              }}
            >
              {tag}
            </div>
          ))}
        </div>

        {/* 하단 */}
        <div
          style={{
            position: "absolute",
            bottom: 30,
            fontSize: 16,
            color: "#999999",
          }}
        >
          pickshow.vercel.app
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
