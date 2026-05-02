// 기존 /performance/[id] URL 호환 — /genre/[slug]/[id]로 리다이렉트
import { redirect } from "next/navigation";
import { getPerformanceById } from "@/features/search/service";

export default async function PerformanceRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const performance = await getPerformanceById(id);

  if (!performance) {
    redirect("/");
  }

  redirect(`/genre/${performance.genre}/${performance.id}`);
}
