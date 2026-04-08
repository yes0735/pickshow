// Design Ref: §8.5 — Seed Data Requirements (CommonCode 40+)
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const commonCodes = [
  // 장르
  { group: "genre", code: "musical", label: "뮤지컬", sortOrder: 1 },
  { group: "genre", code: "theater", label: "연극", sortOrder: 2 },
  { group: "genre", code: "concert", label: "콘서트", sortOrder: 3 },
  { group: "genre", code: "classic", label: "클래식", sortOrder: 4 },
  { group: "genre", code: "dance", label: "무용", sortOrder: 5 },
  { group: "genre", code: "korean", label: "국악", sortOrder: 6 },
  { group: "genre", code: "etc", label: "기타", sortOrder: 7 },

  // 공연상태
  { group: "status", code: "ongoing", label: "공연중", sortOrder: 1 },
  { group: "status", code: "upcoming", label: "공연예정", sortOrder: 2 },
  { group: "status", code: "completed", label: "공연종료", sortOrder: 3 },

  // 가격대
  { group: "price_range", code: "free", label: "무료", sortOrder: 1 },
  { group: "price_range", code: "under_30000", label: "3만원 이하", sortOrder: 2 },
  { group: "price_range", code: "30000_50000", label: "3~5만원", sortOrder: 3 },
  { group: "price_range", code: "50000_100000", label: "5~10만원", sortOrder: 4 },
  { group: "price_range", code: "over_100000", label: "10만원 이상", sortOrder: 5 },

  // 관람연령
  { group: "age_limit", code: "all", label: "전체관람가", sortOrder: 1 },
  { group: "age_limit", code: "12", label: "12세 이상", sortOrder: 2 },
  { group: "age_limit", code: "15", label: "15세 이상", sortOrder: 3 },
  { group: "age_limit", code: "19", label: "19세 이상", sortOrder: 4 },

  // 예매처 (KOPIS 실제 데이터 기반 — 상위 10개)
  { group: "ticket_site", code: "놀유니버스", label: "놀유니버스", sortOrder: 1 },
  { group: "ticket_site", code: "네이버N예약", label: "네이버N예약", sortOrder: 2 },
  { group: "ticket_site", code: "NHN티켓링크", label: "NHN티켓링크", sortOrder: 3 },
  { group: "ticket_site", code: "예스24", label: "예스24", sortOrder: 4 },
  { group: "ticket_site", code: "멜론티켓", label: "멜론티켓", sortOrder: 5 },
  { group: "ticket_site", code: "플레이티켓", label: "플레이티켓", sortOrder: 6 },
  { group: "ticket_site", code: "타임티켓", label: "타임티켓", sortOrder: 7 },
  { group: "ticket_site", code: "나눔티켓", label: "나눔티켓", sortOrder: 8 },
  { group: "ticket_site", code: "엔티켓", label: "엔티켓", sortOrder: 9 },
  { group: "ticket_site", code: "쿠팡", label: "쿠팡", sortOrder: 10 },
  { group: "ticket_site", code: "etc", label: "기타", sortOrder: 99 },

  // 게시판 카테고리 (익명)
  { group: "board_anonymous", code: "promotion", label: "홍보", sortOrder: 1 },
  { group: "board_anonymous", code: "info", label: "정보", sortOrder: 2 },
  { group: "board_anonymous", code: "wanted", label: "구함", sortOrder: 3 },

  // 게시판 카테고리 (회원)
  { group: "board_member", code: "promotion", label: "홍보", sortOrder: 1 },
  { group: "board_member", code: "info", label: "정보", sortOrder: 2 },
  { group: "board_member", code: "transfer", label: "양도", sortOrder: 3 },
  { group: "board_member", code: "wanted", label: "구함", sortOrder: 4 },
];

async function main() {
  console.log("Seeding common codes...");

  for (const code of commonCodes) {
    await prisma.commonCode.upsert({
      where: {
        group_code: { group: code.group, code: code.code },
      },
      update: { label: code.label, sortOrder: code.sortOrder },
      create: { ...code, isActive: true },
    });
  }

  console.log(`Seeded ${commonCodes.length} common codes.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
