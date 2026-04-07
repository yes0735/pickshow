// 장르 보정 (상세 API) — etc 공연의 KOPIS 상세에서 genrenm 확인 후 수정
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { fetchPerformanceDetail, mapGenreToCode } from "../src/lib/kopis";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const etcPerfs = await prisma.performance.findMany({
    where: { genre: "etc" },
    select: { id: true, kopisId: true, title: true },
  });
  console.log(`etc 공연: ${etcPerfs.length}건 — 상세 API로 장르 보정 시작...\n`);

  let fixed = 0;
  let stillEtc = 0;
  let errors = 0;

  for (let i = 0; i < etcPerfs.length; i++) {
    const perf = etcPerfs[i];
    try {
      const detail = await fetchPerformanceDetail(perf.kopisId);
      if (!detail) { errors++; continue; }

      const newGenre = mapGenreToCode(detail.genrenm);
      if (newGenre !== "etc") {
        await prisma.performance.update({
          where: { id: perf.id },
          data: { genre: newGenre },
        });
        fixed++;
      } else {
        stillEtc++;
      }
    } catch {
      errors++;
    }

    if ((i + 1) % 100 === 0) {
      console.log(`  ${i + 1}/${etcPerfs.length} — 보정: ${fixed}, etc유지: ${stillEtc}, 에러: ${errors}`);
    }
  }

  const result: { genre: string; count: number }[] = await prisma.$queryRawUnsafe(
    "SELECT genre, COUNT(*)::int AS count FROM performances GROUP BY genre ORDER BY count DESC"
  );
  console.log(`\n보정 완료: ${fixed}건 수정, ${stillEtc}건 etc 유지, ${errors}건 에러`);
  console.log("\n=== 최종 장르 분포 ===");
  result.forEach((r) => console.log(`${String(r.count).padStart(5)} ${r.genre}`));

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
