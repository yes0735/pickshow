// 게시판 테스트 데이터 등록
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const categories = ["promotion", "info", "wanted"];
const titles = [
  "뮤지컬 캣츠 할인 정보 공유합니다",
  "이번 주말 콘서트 같이 가실 분",
  "오페라의 유령 후기 남겨요",
  "클래식 공연 추천해주세요",
  "인터파크 예매 꿀팁",
  "연극 추천 부탁드려요",
  "공연장 좌석 후기",
  "티켓 가격 비교 정보",
  "뮤지컬 위키드 정보",
  "국악 공연 일정 공유",
  "어린이 공연 추천합니다",
  "발레 공연 후기",
  "콘서트 예매 오픈 정보",
  "공연장 주차 팁",
  "뮤지컬 배우 팬미팅 정보",
  "연극 할인 이벤트 안내",
  "공연 관람 에티켓",
  "좌석별 시야 후기",
  "단체 관람 할인 정보",
  "공연 굿즈 정보 공유",
];

const contents = [
  "자세한 내용은 아래 링크를 참고해주세요!",
  "관심 있으신 분은 댓글 남겨주세요~",
  "정말 좋은 공연이었어요. 강추합니다!",
  "가격대비 정말 만족스러웠습니다.",
  "다들 참고하세요! 유용한 정보입니다.",
];

const nicknames = [
  "공연러버", "뮤지컬팬", "클래식매니아", "연극덕후", "콘서트고수",
  "공연초보", "관람객A", "티켓헌터", "무대사랑", "예술인",
];

async function main() {
  const count = 55; // 55개 → 3페이지 (20/20/15)
  console.log(`게시판 테스트 데이터 ${count}건 등록 중...`);

  for (let i = 0; i < count; i++) {
    const cat = categories[i % categories.length];
    const title = titles[i % titles.length] + (i >= titles.length ? ` (${i + 1})` : "");
    const content = contents[i % contents.length];
    const nickname = nicknames[i % nicknames.length];

    await prisma.boardPost.create({
      data: {
        boardType: "anonymous",
        category: cat,
        title,
        content,
        authorNickname: nickname,
        anonymousPassword: null,
      },
    });
  }

  const total = await prisma.boardPost.count({ where: { boardType: "anonymous" } });
  console.log(`완료! 총 게시글: ${total}건 (${Math.ceil(total / 20)}페이지)`);

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
