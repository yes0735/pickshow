// Design Ref: §4.1 — 내가 본 공연 CRUD
import { prisma } from "@/lib/prisma";
import type { CreateMyPerformanceInput, UpdateMyPerformanceInput } from "./schema";

export async function getMyPerformances(userId: string) {
  const items = await prisma.myPerformance.findMany({
    where: { userId },
    include: {
      performance: {
        select: { id: true, title: true, posterUrl: true, venue: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return items.map((item) => ({
    id: item.id,
    performanceId: item.performanceId,
    rating: item.rating,
    review: item.review,
    seatInfo: item.seatInfo,
    ticketSite: item.ticketSite,
    viewedAt: item.viewedAt?.toISOString() ?? null,
    createdAt: item.createdAt.toISOString(),
    performance: item.performance,
  }));
}

export async function addMyPerformance(userId: string, input: CreateMyPerformanceInput) {
  const existing = await prisma.myPerformance.findUnique({
    where: { userId_performanceId: { userId, performanceId: input.performanceId } },
  });

  if (existing) throw new Error("CONFLICT");

  const item = await prisma.myPerformance.create({
    data: {
      userId,
      performanceId: input.performanceId,
      rating: input.rating,
      review: input.review ?? null,
      seatInfo: input.seatInfo ?? null,
      ticketSite: input.ticketSite ?? null,
      viewedAt: input.viewedAt ? new Date(input.viewedAt) : null,
    },
  });

  return { id: item.id };
}

export async function updateMyPerformance(
  userId: string,
  id: string,
  input: UpdateMyPerformanceInput
) {
  const item = await prisma.myPerformance.findUnique({ where: { id } });
  if (!item || item.userId !== userId) throw new Error("NOT_FOUND");

  await prisma.myPerformance.update({
    where: { id },
    data: {
      ...(input.rating !== undefined && { rating: input.rating }),
      ...(input.review !== undefined && { review: input.review }),
      ...(input.seatInfo !== undefined && { seatInfo: input.seatInfo }),
      ...(input.ticketSite !== undefined && { ticketSite: input.ticketSite }),
      ...(input.viewedAt !== undefined && { viewedAt: new Date(input.viewedAt) }),
    },
  });
}

export async function deleteMyPerformance(userId: string, id: string) {
  const item = await prisma.myPerformance.findUnique({ where: { id } });
  if (!item || item.userId !== userId) throw new Error("NOT_FOUND");

  await prisma.myPerformance.delete({ where: { id } });
}
