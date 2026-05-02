// Swagger UI 페이지 — /api-docs (개발환경에서만 접근 가능)
"use client";

import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";
import { openApiSpec } from "@/lib/swagger";

export default function ApiDocsPage() {
  if (process.env.NODE_ENV === "production") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-text-muted">이 페이지는 개발환경에서만 접근 가능합니다.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <SwaggerUI spec={openApiSpec} />
    </div>
  );
}
