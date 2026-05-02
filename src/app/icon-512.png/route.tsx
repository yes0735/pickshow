// PWA icon 512x512
import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 512,
          height: 512,
          borderRadius: 102,
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
            fontSize: 148,
            fontWeight: 900,
            letterSpacing: "-6px",
          }}
        >
          <span style={{ color: "white" }}>P</span>
          <span style={{ color: "#FFF0F3" }}>S</span>
        </div>
        <span style={{ fontSize: 40, color: "white", fontWeight: 600, marginTop: -10 }}>
          PickShow
        </span>
      </div>
    ),
    { width: 512, height: 512 }
  );
}
