// 공연상태 뱃지 — 색상 통일 (명도대비 WCAG AA 통과)
interface Props {
  status: string;
  size?: "sm" | "md";
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  ongoing: {
    label: "공연중",
    className: "bg-mint-light text-mint-dark border border-mint-dark/20",
  },
  upcoming: {
    label: "공연예정",
    className: "bg-pink-light text-pink-dark border border-pink-dark/20",
  },
  completed: {
    label: "공연완료",
    className: "bg-bg-secondary text-text-muted border border-border",
  },
};

export default function StatusBadge({ status, size = "sm" }: Props) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    className: "bg-bg-secondary text-text-muted border border-border",
  };

  const sizeClass =
    size === "md"
      ? "px-2.5 py-1 text-xs"
      : "px-2 py-0.5 text-[10px]";

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${sizeClass} ${config.className}`}>
      {config.label}
    </span>
  );
}
