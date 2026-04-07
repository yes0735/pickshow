// PickShow 파비콘 — PS 로고 (민트+핑크)
import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: "linear-gradient(135deg, #1B7A4A 0%, #2B9E5E 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
        }}
      >
        <span
          style={{
            fontSize: 18,
            fontWeight: 900,
            color: "white",
            letterSpacing: "-1px",
          }}
        >
          P
        </span>
      </div>
    ),
    { ...size }
  );
}
