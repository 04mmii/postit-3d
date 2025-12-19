import type { Note } from "../types/note";
export const COLORS: Record<Note["color"], string> = {
  yellow: "#FFEB74",
  pink: "#FFC3D1",
  mint: "#BFF3E0",
};

// 80% 투명도 버전 (오버레이용)
export const COLORS_80: Record<Note["color"], string> = {
  yellow: "rgba(255, 235, 116, 0.8)",
  pink: "rgba(255, 195, 209, 0.8)",
  mint: "rgba(191, 243, 224, 0.8)",
};
