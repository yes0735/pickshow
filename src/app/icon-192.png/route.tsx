// PWA icon 192x192
import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 192,
          height: 192,
          borderRadius: 38,
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
            fontSize: 56,
            fontWeight: 900,
            letterSpacing: "-2px",
          }}
        >
          <span style={{ color: "white" }}>P</span>
          <span style={{ color: "#FFF0F3" }}>S</span>
        </div>
        <span style={{ fontSize: 15, color: "white", fontWeight: 600, marginTop: -4 }}>
          PickShow
        </span>
      </div>
    ),
    { width: 192, height: 192 }
  );
}
