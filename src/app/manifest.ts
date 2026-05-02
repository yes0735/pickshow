// PWA Web App Manifest
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PickShow - 공연 예매처 통합 검색",
    short_name: "PickShow",
    description: "공연 정보를 한 곳에서 검색하고, 원하는 예매처로 바로 이동할 수 있는 공연 예매처 통합 검색 서비스",
    start_url: "/",
    display: "standalone",
    background_color: "#F8FAFB",
    theme_color: "#1B7A4A",
    orientation: "portrait-primary",
    categories: ["entertainment", "lifestyle"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
