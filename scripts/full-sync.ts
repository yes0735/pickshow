// 수동 전체 동기화 스크립트
// 실행: npx tsx scripts/full-sync.ts
// 옵션: DAYS_BACK=365 DAYS_FORWARD=365 npx tsx scripts/full-sync.ts
import "dotenv/config";
import { fullSyncPerformancesFromKopis } from "../src/features/batch/service";

async function main() {
  const daysBack = Number(process.env.DAYS_BACK ?? 365);
  const daysForward = Number(process.env.DAYS_FORWARD ?? 365);
  const maxPages = Number(process.env.MAX_PAGES ?? 100);

  console.log("KOPIS Full Sync 시작");
  console.log(
    `기간: ${daysBack}일 전 ~ ${daysForward}일 후, maxPages: ${maxPages}`
  );
  console.log("─────────────────────────────");

  const startTime = Date.now();
  const result = await fullSyncPerformancesFromKopis({
    daysBack,
    daysForward,
    maxPages,
  });
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log("─────────────────────────────");
  console.log("Full Sync 완료");
  console.log(`  신규 동기화: ${result.totalSynced}건`);
  console.log(`  스킵 (기존):  ${result.totalSkipped}건`);
  console.log(`  에러:         ${result.totalErrors}건`);
  console.log(`  소요 시간:    ${duration}초`);

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
