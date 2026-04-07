// PickShow Apple Touch Icon (180x180) — 홈 화면 추가 시 아이콘
import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: 36,
          background: "linear-gradient(135deg, #1B7A4A 0%, #A8E6CF 50%, #FFB7C5 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            fontSize: 52,
            fontWeight: 900,
            letterSpacing: "-2px",
          }}
        >
          <span style={{ color: "white" }}>P</span>
          <span style={{ color: "#FFF0F3" }}>S</span>
        </div>
        <span style={{ fontSize: 14, color: "white", fontWeight: 600, marginTop: -4 }}>
          PickShow
        </span>
      </div>
    ),
    { ...size }
  );
}
