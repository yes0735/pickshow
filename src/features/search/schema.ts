// Design Ref: §4.3 — 검색 API zod 검증 스키마
import { z } from "zod";

export const searchParamsSchema = z.object({
  q: z.string().optional(),
  genre: z.string().optional(),
  status: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  ageLimit: z.string().optional(),
  ticketSite: z.string().optional(),
  venue: z.string().optional(),
  sort: z.enum(["title", "date_desc", "price_asc", "price_desc"]).optional().default("title"),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).optional().default(10),
});

export type SearchParams = z.infer<typeof searchParamsSchema>;
