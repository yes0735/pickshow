// Design Ref: §5.4 — 예매처 링크 목록 (버튼 형태, 클릭 시 새 탭)
import type { TicketUrl } from "@/types/performance";

interface Props {
  ticketUrls: TicketUrl[];
}

export default function TicketLinkList({ ticketUrls }: Props) {
  if (ticketUrls.length === 0) {
    return <p className="text-sm text-text-muted">예매처 정보가 없습니다</p>;
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">예매처</h3>
      <div className="flex flex-wrap gap-2">
        {ticketUrls.map((ticket, i) => (
          <a
            key={i}
            href={ticket.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-mint text-mint-dark text-sm font-medium hover:bg-mint hover:text-white transition-colors"
          >
            {ticket.name}
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" />
            </svg>
          </a>
        ))}
      </div>
    </div>
  );
}
