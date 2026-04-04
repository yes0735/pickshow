// Design Ref: §4.3 — 내가 본 공연 zod 검증
import { z } from "zod";

export const createMyPerformanceSchema = z.object({
  performanceId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  review: z.string().max(200).optional(),
  seatInfo: z.string().max(100).optional(),
  ticketSite: z.string().optional(),
  viewedAt: z.string().optional(),
});

export const updateMyPerformanceSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  review: z.string().max(200).optional(),
  seatInfo: z.string().max(100).optional(),
  ticketSite: z.string().optional(),
  viewedAt: z.string().optional(),
});

export type CreateMyPerformanceInput = z.infer<typeof createMyPerformanceSchema>;
export type UpdateMyPerformanceInput = z.infer<typeof updateMyPerformanceSchema>;
