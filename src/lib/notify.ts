import { Resend } from "resend";

const ADMIN_EMAIL = "slaqmtm0735@gmail.com";

interface BatchResult {
  jobName: string;
  success: boolean;
  summary: string;
  error?: string;
}

export async function notifyBatchResult(result: BatchResult) {
  const subject = result.success
    ? `[Pickshow] ${result.jobName} 성공`
    : `[Pickshow] ${result.jobName} 실패`;

  const html = `
    <h2>${result.success ? "✅" : "❌"} ${result.jobName}</h2>
    <p><strong>시간:</strong> ${new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}</p>
    <p><strong>결과:</strong> ${result.summary}</p>
    ${result.error ? `<p><strong>에러:</strong> <code>${result.error}</code></p>` : ""}
  `;

  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set — skipping email notification");
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    await resend.emails.send({
      from: "Pickshow Batch <onboarding@resend.dev>",
      to: ADMIN_EMAIL,
      subject,
      html,
    });
  } catch (e) {
    console.error("Failed to send notification email:", e);
  }
}
