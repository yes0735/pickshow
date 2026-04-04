// Gap Fix: F-1 — 찜 등록/해제 토글 버튼
"use client";

import { useSession } from "next-auth/react";
import { useFavorites, useToggleFavorite } from "@/features/favorite/hooks";
import { useRouter } from "next/navigation";

interface Props {
  performanceId: string;
  size?: "sm" | "md";
}

export default function FavoriteButton({ performanceId, size = "sm" }: Props) {
  const { data: session } = useSession();
  const { data: favorites } = useFavorites();
  const { add, remove } = useToggleFavorite();
  const router = useRouter();

  const favorite = favorites?.find((f) => f.performanceId === performanceId);
  const isFavorited = !!favorite;
  const isLoading = add.isPending || remove.isPending;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!session?.user) {
      router.push("/login");
      return;
    }

    if (isFavorited && favorite) {
      remove.mutate(favorite.id);
    } else {
      add.mutate(performanceId);
    }
  };

  const sizeClass = size === "md" ? "w-9 h-9" : "w-7 h-7";

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`${sizeClass} flex items-center justify-center rounded-full transition-colors ${
        isFavorited
          ? "bg-pink text-white hover:bg-pink-dark"
          : "bg-white/80 text-text-muted hover:text-pink-dark hover:bg-white"
      } disabled:opacity-50`}
      title={isFavorited ? "찜 해제" : "찜 등록"}
    >
      <svg
        width={size === "md" ? 18 : 14}
        height={size === "md" ? 18 : 14}
        fill={isFavorited ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}
