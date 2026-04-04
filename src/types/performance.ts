// Design Ref: §3.1 — Performance entity
export interface TicketUrl {
  name: string;
  url: string;
}

export interface Performance {
  id: string;
  kopisId: string;
  title: string;
  genre: string;
  startDate: string;
  endDate: string;
  venue: string;
  venueAddress: string;
  status: string;
  posterUrl: string | null;
  price: string;
  minPrice: number | null;
  maxPrice: number | null;
  ageLimit: string;
  runtime: string | null;
  cast: string | null;
  synopsis: string | null;
  ticketUrls: TicketUrl[];
  createdAt: string;
  updatedAt: string;
}

export interface SearchFilters {
  q?: string;
  genre?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  minPrice?: number;
  maxPrice?: number;
  ageLimit?: string;
  ticketSite?: string;
  venue?: string;
}
