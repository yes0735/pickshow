// Design Ref: §2.2 — KOPIS 배치 동기화 + 공연상태 자동 업데이트
// Plan SC: FR-10 매일 01:00 공연데이터 동기화
import { prisma } from "@/lib/prisma";
import {
  fetchPerformanceList,
  fetchPerformanceDetail,
  parseKopisDate,
  mapGenreToCode,
  mapStatusToCode,
  parsePriceRange,
} from "@/lib/kopis";

export async function syncPerformancesFromKopis() {
  const today = new Date();
  const stdate = formatKopisDate(today); // 오늘부터
  const eddate = formatKopisDate(addDays(today, 180)); // 180일 후까지

  let totalSynced = 0;
  let totalSkipped = 0;
  let page = 1;
  const maxPages = 20;

  // 기존 DB의 kopisId Set 로드 (빠른 중복 체크)
  const existingKopisIds = new Set(
    (await prisma.performance.findMany({ select: { kopisId: true } })).map(
      (p) => p.kopisId
    )
  );

  while (page <= maxPages) {
    const list = await fetchPerformanceList({
      stdate,
      eddate,
      cpage: page,
      rows: 100,
    });

    if (list.length === 0) break;

    for (const item of list) {
      // 증분 처리: 이미 DB에 있으면 스킵 (상세 API 호출 안 함)
      if (existingKopisIds.has(item.mt20id)) {
        totalSkipped++;
        continue;
      }

      try {
        const detail = await fetchPerformanceDetail(item.mt20id);
        if (!detail) continue;

        const priceRange = parsePriceRange(detail.pcseguidance);
        const ticketUrls = detail.relates.relate
          .filter((r) => r.relateurl)
          .map((r) => ({ name: r.relatenm, url: r.relateurl }));

        await prisma.performance.upsert({
          where: { kopisId: item.mt20id },
          update: {
            title: detail.prfnm,
            genre: mapGenreToCode(detail.genrenm),
            startDate: parseKopisDate(detail.prfpdfrom),
            endDate: parseKopisDate(detail.prfpdto),
            venue: detail.fcltynm,
            venueAddress: detail.area,
            status: mapStatusToCode(detail.prfstate),
            posterUrl: detail.poster || null,
            price: detail.pcseguidance,
            minPrice: priceRange.min,
            maxPrice: priceRange.max,
            ageLimit: detail.prfage,
            runtime: detail.prfruntime || null,
            cast: detail.prfcast || null,
            synopsis: detail.sty || null,
            ticketUrls,
          },
          create: {
            kopisId: item.mt20id,
            title: detail.prfnm,
            genre: mapGenreToCode(detail.genrenm),
            startDate: parseKopisDate(detail.prfpdfrom),
            endDate: parseKopisDate(detail.prfpdto),
            venue: detail.fcltynm,
            venueAddress: detail.area,
            status: mapStatusToCode(detail.prfstate),
            posterUrl: detail.poster || null,
            price: detail.pcseguidance,
            minPrice: priceRange.min,
            maxPrice: priceRange.max,
            ageLimit: detail.prfage,
            runtime: detail.prfruntime || null,
            cast: detail.prfcast || null,
            synopsis: detail.sty || null,
            ticketUrls,
          },
        });

        totalSynced++;
      } catch (e) {
        console.error(`Failed to sync ${item.mt20id}:`, e);
      }
    }

    page++;
  }

  // 공연상태 자동 업데이트: 시작일이 지난 공연 → 공연중, 종료일이 지난 공연 → 공연완료
  await updatePerformanceStatuses();

  return { totalSynced, totalSkipped };
}

export async function updatePerformanceStatuses() {
  const now = new Date();

  // 공연예정 → 공연중 (시작일 <= 오늘 && 종료일 >= 오늘)
  const toOngoing = await prisma.performance.updateMany({
    where: {
      status: "upcoming",
      startDate: { lte: now },
      endDate: { gte: now },
    },
    data: { status: "ongoing" },
  });

  // 공연중/공연예정 → 공연완료 (종료일 < 오늘)
  const toCompleted = await prisma.performance.updateMany({
    where: {
      status: { in: ["upcoming", "ongoing"] },
      endDate: { lt: now },
    },
    data: { status: "completed" },
  });

  return {
    toOngoing: toOngoing.count,
    toCompleted: toCompleted.count,
  };
}

function formatKopisDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
