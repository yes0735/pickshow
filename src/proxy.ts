// Gap Fix: SEC-2 — Rate Limiting middleware
// Design Ref: §7 Security — 로그인 5회/분, API 100회/분
import { NextRequest, NextResponse } from "next/server";

const rateLimit = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimit.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimit.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (entry.count >= limit) return false;

  entry.count++;
  return true;
}

// Periodic cleanup to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimit) {
    if (now > entry.resetTime) rateLimit.delete(key);
  }
}, 60000);

export default function proxy(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const path = request.nextUrl.pathname;

  // Rate limit login attempts: 5/min
  if (path.startsWith("/api/auth") && request.method === "POST") {
    if (!checkRateLimit(`auth:${ip}`, 5, 60000)) {
      return NextResponse.json(
        { error: { code: "RATE_LIMITED", message: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." } },
        { status: 429 }
      );
    }
  }

  // Rate limit API: 100/min
  if (path.startsWith("/api/")) {
    if (!checkRateLimit(`api:${ip}`, 100, 60000)) {
      return NextResponse.json(
        { error: { code: "RATE_LIMITED", message: "요청이 너무 많습니다." } },
        { status: 429 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
