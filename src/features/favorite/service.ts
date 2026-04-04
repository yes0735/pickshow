// Design Ref: §4.1 — 찜 비즈니스 로직 (toggle, list)
import { prisma } from "@/lib/prisma";

export async function getFavorites(userId: string) {
  const favorites = await prisma.favorite.findMany({
    where: { userId },
    include: {
      performance: {
        select: {
          id: true,
          title: true,
          posterUrl: true,
          venue: true,
          startDate: true,
          endDate: true,
          minPrice: true,
          maxPrice: true,
          status: true,
          genre: true,
          ticketUrls: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return favorites.map((f) => ({
    id: f.id,
    performanceId: f.performanceId,
    createdAt: f.createdAt.toISOString(),
    performance: {
      ...f.performance,
      startDate: f.performance.startDate.toISOString(),
      endDate: f.performance.endDate.toISOString(),
      ticketUrls: f.performance.ticketUrls as { name: string; url: string }[],
    },
  }));
}

export async function addFavorite(userId: string, performanceId: string) {
  const existing = await prisma.favorite.findUnique({
    where: { userId_performanceId: { userId, performanceId } },
  });

  if (existing) {
    throw new Error("CONFLICT");
  }

  const favorite = await prisma.favorite.create({
    data: { userId, performanceId },
  });

  return { id: favorite.id, performanceId };
}

export async function removeFavorite(userId: string, favoriteId: string) {
  const favorite = await prisma.favorite.findUnique({
    where: { id: favoriteId },
  });

  if (!favorite || favorite.userId !== userId) {
    throw new Error("NOT_FOUND");
  }

  await prisma.favorite.delete({ where: { id: favoriteId } });
}

export async function isFavorited(userId: string, performanceId: string) {
  const favorite = await prisma.favorite.findUnique({
    where: { userId_performanceId: { userId, performanceId } },
  });
  return !!favorite;
}
