// 내공연 등록/해제 — 로컬스토리지 기반 (체크 아이콘 + 입력 모달)
"use client";

import { useSyncExternalStore, useCallback, useState } from "react";

export interface MyPerfData {
  performanceId: string;
  viewedAt: string;
  seatInfo: string;
  rating: number;
  review: string;
  ticketSite: string;
}

const STORAGE_KEY = "pickshow-my-performances";

function getMyPerfs(): MyPerfData[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function setMyPerfs(data: MyPerfData[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  window.dispatchEvent(new Event("myperfs-changed"));
}

function subscribe(cb: () => void) {
  window.addEventListener("myperfs-changed", cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener("myperfs-changed", cb);
    window.removeEventListener("storage", cb);
  };
}

function getSnapshot() {
  return localStorage.getItem(STORAGE_KEY) || "[]";
}

function getServerSnapshot() {
  return "[]";
}

const TICKET_SITES = [
  "놀유니버스", "네이버N예약", "NHN티켓링크", "예스24",
  "멜론티켓", "플레이티켓", "타임티켓", "기타",
];

interface Props {
  performanceId: string;
  size?: "sm" | "md";
}

export default function MyPerfButton({ performanceId, size = "sm" }: Props) {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const allData: MyPerfData[] = JSON.parse(raw);
  const existing = allData.find((d) => d.performanceId === performanceId);
  const isChecked = !!existing;

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<Omit<MyPerfData, "performanceId">>({
    viewedAt: "",
    seatInfo: "",
    rating: 5,
    review: "",
    ticketSite: "",
  });

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (isChecked) {
        // 해제
        setMyPerfs(allData.filter((d) => d.performanceId !== performanceId));
      } else {
        // 등록 모달 열기
        setForm({
          viewedAt: new Date().toISOString().split("T")[0],
          seatInfo: "",
          rating: 5,
          review: "",
          ticketSite: "",
        });
        setShowModal(true);
      }
    },
    [isChecked, allData, performanceId]
  );

  const handleSave = () => {
    const newData: MyPerfData = { performanceId, ...form };
    setMyPerfs([...allData, newData]);
    setShowModal(false);
  };

  const sizeClass = size === "md" ? "w-9 h-9" : "w-7 h-7";

  return (
    <>
      <button
        onClick={handleClick}
        className={`${sizeClass} flex items-center justify-center rounded-full transition-colors ${
          isChecked
            ? "bg-mint-dark text-white"
            : "bg-white/80 text-text-muted hover:text-mint-dark hover:bg-white"
        }`}
        title={isChecked ? "내공연 해제" : "내공연 등록"}
      >
        <svg
          width={size === "md" ? 18 : 14}
          height={size === "md" ? 18 : 14}
          fill="none"
          stroke="currentColor"
          strokeWidth={isChecked ? "3" : "2"}
          viewBox="0 0 24 24"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </button>

      {/* 등록 모달 */}
      {showModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowModal(false);
          }}
        >
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="relative bg-white rounded-2xl w-full max-w-sm p-5 shadow-xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold">내공연 등록</h3>

            {/* 관람 날짜 */}
            <div>
              <label className="block text-xs text-text-secondary mb-1">관람 날짜</label>
              <input
                type="date"
                value={form.viewedAt}
                onClick={(e) => (e.target as HTMLInputElement).showPicker()}
                onChange={(e) => setForm((f) => ({ ...f, viewedAt: e.target.value }))}
                className="w-full h-10 px-3 rounded-xl border border-border text-sm focus:outline-none focus:border-mint-dark cursor-pointer"
              />
            </div>

            {/* 좌석 정보 */}
            <div>
              <label className="block text-xs text-text-secondary mb-1">좌석 정보</label>
              <input
                type="text"
                value={form.seatInfo}
                onChange={(e) => setForm((f) => ({ ...f, seatInfo: e.target.value }))}
                placeholder="예: 1층 A구역 3열 15번"
                className="w-full h-10 px-3 rounded-xl border border-border text-sm focus:outline-none focus:border-mint-dark"
              />
            </div>

            {/* 별점 */}
            <div>
              <label className="block text-xs text-text-secondary mb-1">별점</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, rating: n }))}
                    className={`text-2xl transition-colors ${
                      n <= form.rating ? "text-pink-dark" : "text-border"
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            {/* 한줄 리뷰 */}
            <div>
              <label className="block text-xs text-text-secondary mb-1">한줄 리뷰</label>
              <input
                type="text"
                value={form.review}
                onChange={(e) => setForm((f) => ({ ...f, review: e.target.value }))}
                placeholder="간단한 한줄 메모"
                maxLength={100}
                className="w-full h-10 px-3 rounded-xl border border-border text-sm focus:outline-none focus:border-mint-dark"
              />
            </div>

            {/* 예매처 선택 */}
            <div>
              <label className="block text-xs text-text-secondary mb-1">예매처</label>
              <div className="flex flex-wrap gap-1.5">
                {TICKET_SITES.map((site) => (
                  <button
                    key={site}
                    type="button"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        ticketSite: f.ticketSite === site ? "" : site,
                      }))
                    }
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                      form.ticketSite === site
                        ? "bg-mint-dark text-white"
                        : "bg-bg-secondary text-text-secondary hover:bg-border-light"
                    }`}
                  >
                    {site}
                  </button>
                ))}
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowModal(false);
                }}
                className="flex-1 h-11 rounded-xl border border-border text-sm text-text-secondary hover:bg-bg-secondary transition-colors"
              >
                취소
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSave();
                }}
                className="flex-[2] h-11 rounded-xl bg-mint-dark text-white text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                등록하기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// 전체 내공연 목록 hook
export function useAllMyPerfs(): MyPerfData[] {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return JSON.parse(raw);
}
