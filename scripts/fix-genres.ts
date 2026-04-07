// 장르 보정 스크립트 — etc로 잘못 분류된 공연을 KOPIS 목록 API 기반으로 수정
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { fetchPerformanceList, mapGenreToCode } from "../src/lib/kopis";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // 1. etc 공연의 kopisId Set
  const etcPerfs = await prisma.performance.findMany({
    where: { genre: "etc" },
    select: { id: true, kopisId: true },
  });
  const etcKopisMap = new Map(etcPerfs.map((p) => [p.kopisId, p.id]));
  console.log(`etc 공연: ${etcPerfs.length}건`);

  // 2. KOPIS 목록 API에서 전체 장르 매핑 수집
  const genreFixes = new Map<string, string>(); // DB id -> new genre code

  const today = new Date();
  const ranges = [
    { back: 365, forward: 0 },
    { back: 0, forward: 365 },
  ];

  for (const range of ranges) {
    const stdate = fmt(addDays(today, -range.back));
    const eddate = fmt(addDays(today, range.forward));
    console.log(`\n조회: ${stdate} ~ ${eddate}`);

    for (let page = 1; page <= 100; page++) {
      const list = await fetchPerformanceList({ stdate, eddate, cpage: page, rows: 100 });
      if (list.length === 0) break;

      for (const item of list) {
        const dbId = etcKopisMap.get(item.mt20id);
        if (dbId && item.genrenm) {
          const newGenre = mapGenreToCode(item.genrenm);
          if (newGenre !== "etc") {
            genreFixes.set(dbId, newGenre);
          }
        }
      }

      if (page % 10 === 0) {
        console.log(`  page ${page}: 보정 대상 ${genreFixes.size}건`);
      }
    }
  }

  console.log(`\n장르 보정 대상: ${genreFixes.size}건`);

  // 3. DB 업데이트
  let updated = 0;
  for (const [id, genre] of genreFixes) {
    await prisma.performance.update({ where: { id }, data: { genre } });
    updated++;
  }

  // 4. 결과 확인
  const result: { genre: string; count: number }[] = await prisma.$queryRawUnsafe(
    "SELECT genre, COUNT(*)::int AS count FROM performances GROUP BY genre ORDER BY count DESC"
  );
  console.log(`\n보정 완료: ${updated}건 수정`);
  console.log("\n=== 보정 후 장르 분포 ===");
  result.forEach((r) => console.log(`${String(r.count).padStart(5)} ${r.genre}`));

  await prisma.$disconnect();
}

function fmt(d: Date) {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

function addDays(d: Date, days: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

main().catch((e) => { console.error(e); process.exit(1); });
