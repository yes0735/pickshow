// 게시판 댓글 테스트 데이터 등록
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const comments = [
  "좋은 정보 감사합니다!",
  "저도 궁금했는데 감사해요~",
  "혹시 예매 링크 있을까요?",
  "완전 공감합니다 ㅎㅎ",
  "다음에도 좋은 글 부탁드려요",
  "오 이거 진짜 유용하네요",
  "저도 같이 가고 싶어요!",
  "후기 잘 읽었습니다",
  "가격이 좀 있네요...",
  "꿀팁 감사합니다!!",
  "다른 분들도 참고하세요",
  "이 공연 저도 봤는데 대박이었어요",
];

const nicknames = [
  "댓글러", "공연팬", "관람객B", "뮤덕", "익명이",
  "공연조아", "리뷰왕", "초보관객",
];

async function main() {
  // 게시글 목록 가져오기
  const posts = await prisma.boardPost.findMany({
    select: { id: true },
    orderBy: { createdAt: "desc" },
    take: 30, // 최근 30개 게시글에 댓글 달기
  });

  console.log(`${posts.length}개 게시글에 댓글 등록 중...`);

  let totalComments = 0;

  for (let i = 0; i < posts.length; i++) {
    // 각 게시글에 1~4개 댓글
    const commentCount = (i % 4) + 1;

    for (let j = 0; j < commentCount; j++) {
      const content = comments[(i * 3 + j) % comments.length];
      const nickname = nicknames[(i + j) % nicknames.length];

      await prisma.boardComment.create({
        data: {
          postId: posts[i].id,
          authorNickname: nickname,
          content,
          anonymousPassword: null,
        },
      });
      totalComments++;
    }

    // commentCount 업데이트
    await prisma.boardPost.update({
      where: { id: posts[i].id },
      data: { commentCount },
    });
  }

  console.log(`완료! 총 ${totalComments}건 댓글 등록`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
