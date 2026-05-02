// 상세 페이지에서 현재 공연의 장르를 document에 힌트로 남겨
// Header가 카테고리 탭 active 표시에 사용
"use client";

import { useEffect } from "react";

export default function ActiveGenreHint({ genre }: { genre: string }) {
  useEffect(() => {
    document.documentElement.dataset.activeGenre = genre;
    return () => {
      delete document.documentElement.dataset.activeGenre;
    };
  }, [genre]);

  return null;
}
