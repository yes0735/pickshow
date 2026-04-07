// 스크린샷 캡처 스크립트
// 실행: npx tsx scripts/screenshots.ts
import { chromium } from "playwright";
import path from "path";
import fs from "fs";

const BASE_URL = "http://localhost:3000";
const OUTPUT_DIR = path.resolve("docs/screenshots");

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function main() {
  const browser = await chromium.launch();

  // === 웹 (1280x800) ===
  const webCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const webPage = await webCtx.newPage();

  // 1. 웹 검색
  console.log("1/8 web-search...");
  await webPage.goto(BASE_URL, { waitUntil: "networkidle" });
  await webPage.waitForTimeout(2000);
  await webPage.screenshot({ path: path.join(OUTPUT_DIR, "web-search.png"), fullPage: false });

  // 2. 웹 상세 모달 — 첫 번째 카드 클릭
  console.log("2/8 web-detail...");
  const firstCard = webPage.locator('a[href^="/performance/"]').first();
  if (await firstCard.isVisible()) {
    await firstCard.click();
    await webPage.waitForTimeout(1500);
    await webPage.screenshot({ path: path.join(OUTPUT_DIR, "web-detail.png"), fullPage: false });
    await webPage.goBack({ waitUntil: "networkidle" });
    await webPage.waitForTimeout(1000);
  }

  // 3. 웹 필터
  console.log("3/8 web-filter...");
  await webPage.screenshot({ path: path.join(OUTPUT_DIR, "web-filter.png"), fullPage: false });

  await webCtx.close();

  // === 모바일 (375x812, iPhone) ===
  const mobileCtx = await browser.newContext({
    viewport: { width: 375, height: 812 },
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)",
    isMobile: true,
  });
  const mobilePage = await mobileCtx.newPage();

  // 4. 모바일 검색
  console.log("4/8 mobile-search...");
  await mobilePage.goto(BASE_URL, { waitUntil: "networkidle" });
  await mobilePage.waitForTimeout(2000);
  await mobilePage.screenshot({ path: path.join(OUTPUT_DIR, "mobile-search.png"), fullPage: false });

  // 5. 모바일 상세
  console.log("5/8 mobile-detail...");
  const mobileCard = mobilePage.locator('a[href^="/performance/"]').first();
  if (await mobileCard.isVisible()) {
    await mobileCard.click();
    await mobilePage.waitForTimeout(1500);
    await mobilePage.screenshot({ path: path.join(OUTPUT_DIR, "mobile-detail.png"), fullPage: false });
    await mobilePage.goBack({ waitUntil: "networkidle" });
    await mobilePage.waitForTimeout(1000);
  }

  // 6. 모바일 필터 바텀시트
  console.log("6/8 mobile-filter...");
  const filterBtn = mobilePage.locator("button", { hasText: "필터" }).first();
  if (await filterBtn.isVisible()) {
    await filterBtn.click();
    await mobilePage.waitForTimeout(800);
    await mobilePage.screenshot({ path: path.join(OUTPUT_DIR, "mobile-filter.png"), fullPage: false });
  }

  await mobileCtx.close();

  // === 로그인 / 회원가입 (모바일) ===
  const authCtx = await browser.newContext({
    viewport: { width: 375, height: 812 },
    isMobile: true,
  });
  const authPage = await authCtx.newPage();

  // 7. 로그인
  console.log("7/8 login...");
  await authPage.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
  await authPage.waitForTimeout(1000);
  await authPage.screenshot({ path: path.join(OUTPUT_DIR, "login.png"), fullPage: false });

  // 8. 회원가입
  console.log("8/8 register...");
  await authPage.goto(`${BASE_URL}/register`, { waitUntil: "networkidle" });
  await authPage.waitForTimeout(1000);
  await authPage.screenshot({ path: path.join(OUTPUT_DIR, "register.png"), fullPage: false });

  await authCtx.close();
  await browser.close();

  console.log("\n스크린샷 캡처 완료!");
  const files = fs.readdirSync(OUTPUT_DIR).filter((f) => f.endsWith(".png"));
  files.forEach((f) => {
    const size = (fs.statSync(path.join(OUTPUT_DIR, f)).size / 1024).toFixed(0);
    console.log(`  ${f} (${size}KB)`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
