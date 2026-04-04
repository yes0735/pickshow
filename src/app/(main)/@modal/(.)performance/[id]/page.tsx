// Design Ref: §5.4 — Intercepting Route 모달 (URL 변경 + SEO)
import { getPerformanceById } from "@/features/search/service";
import PerformanceModal from "@/components/performance/PerformanceModal";
import { notFound } from "next/navigation";

export default async function PerformanceModalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const performance = await getPerformanceById(id);

  if (!performance) notFound();

  return <PerformanceModal performance={performance} />;
}
