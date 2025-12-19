import * as THREE from "three";
import type { NoteColor } from "../types/note";
import { COLORS } from "./colors";

// 색상별 접착 부분 색상 (지정 컬러보다 살짝 진한)
const adhesiveColorMap: Record<NoteColor, string> = {
  yellow: "#E6D466", // FFEB74 보다 살짝 진한
  pink: "#E6B0BC", // FFC3D1 보다 살짝 진한
  mint: "#A6D9C6", // BFF3E0 보다 살짝 진한
};

/**
 * 체크박스 그리기
 */
function drawCheckbox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  checked: boolean
) {
  // 체크박스 배경
  ctx.fillStyle = checked ? "#4CAF50" : "rgba(255,255,255,0.9)";
  ctx.strokeStyle = checked ? "#388E3C" : "rgba(0,0,0,0.3)";
  ctx.lineWidth = 2;

  // 둥근 사각형
  const radius = 4;
  ctx.beginPath();
  ctx.roundRect(x, y, size, size, radius);
  ctx.fill();
  ctx.stroke();

  // 체크 표시
  if (checked) {
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(x + size * 0.2, y + size * 0.5);
    ctx.lineTo(x + size * 0.4, y + size * 0.7);
    ctx.lineTo(x + size * 0.8, y + size * 0.25);
    ctx.stroke();
  }
}

/**
 * 포스트잇 텍스처 생성
 */
export function createNoteTexture(
  text: string,
  color: NoteColor,
  completed: boolean = false,
  width = 256,
  height = 256
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  const baseColor = COLORS[color];
  const adhesiveColor = adhesiveColorMap[color];

  // === 배경색 (선명한 단색) ===
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, width, height);

  // === 접착 부분 (상단 15%) ===
  const adhesiveHeight = height * 0.15;
  const gradient = ctx.createLinearGradient(0, 0, 0, adhesiveHeight);
  gradient.addColorStop(0, adhesiveColor);
  gradient.addColorStop(0.7, adhesiveColor);
  gradient.addColorStop(1, baseColor);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, adhesiveHeight);

  // 접착 경계선
  ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, adhesiveHeight);
  ctx.lineTo(width, adhesiveHeight);
  ctx.stroke();

  // === 체크박스 ===
  const checkboxSize = 42;
  const checkboxX = 18;
  const checkboxY = adhesiveHeight + 18;
  drawCheckbox(ctx, checkboxX, checkboxY, checkboxSize, completed);

  // === 텍스트 렌더링 ===
  const textStartX = checkboxX + checkboxSize + 16;
  const textStartY = adhesiveHeight + 20;
  const padding = 16;
  const lineHeight = 52;
  const maxWidth = width - textStartX - padding;

  if (text) {
    // 완료 시 취소선 효과
    ctx.fillStyle = completed ? "rgba(0, 0, 0, 0.5)" : "#000000";
    ctx.font = "bold 48px ui-sans-serif, system-ui, -apple-system, sans-serif";
    ctx.textBaseline = "top";

    const lines = wrapText(ctx, text, maxWidth);
    lines.forEach((line, index) => {
      const y = textStartY + index * lineHeight;
      if (y < height - padding - 30) {
        ctx.fillText(line, textStartX, y);

        // 취소선
        if (completed) {
          const textWidth = ctx.measureText(line).width;
          ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(textStartX, y + lineHeight / 2);
          ctx.lineTo(textStartX + textWidth, y + lineHeight / 2);
          ctx.stroke();
        }
      }
    });
  } else {
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.font = "40px ui-sans-serif, system-ui, -apple-system, sans-serif";
    ctx.textBaseline = "top";
    ctx.fillText("클릭하여 입력...", textStartX, textStartY);
  }

  // === 날짜 (하단) ===
  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.font = "bold 30px ui-sans-serif, system-ui, sans-serif";
  ctx.textBaseline = "bottom";
  ctx.fillText(new Date().toLocaleDateString(), 18, height - 14);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  return texture;
}

/**
 * 텍스트 줄바꿈 처리
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const lines: string[] = [];
  const paragraphs = text.split("\n");

  for (const paragraph of paragraphs) {
    if (!paragraph) {
      lines.push("");
      continue;
    }

    const words = paragraph.split("");
    let currentLine = "";

    for (const char of words) {
      const testLine = currentLine + char;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = char;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }
  }

  return lines;
}

/**
 * 텍스처 업데이트
 */
export function updateNoteTexture(
  texture: THREE.CanvasTexture,
  text: string,
  color: NoteColor,
  completed: boolean = false
): void {
  const canvas = texture.image as HTMLCanvasElement;
  const ctx = canvas.getContext("2d")!;
  const width = canvas.width;
  const height = canvas.height;

  const baseColor = COLORS[color];
  const adhesiveColor = adhesiveColorMap[color];

  // 배경색
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, width, height);

  // 접착 부분
  const adhesiveHeight = height * 0.15;
  const gradient = ctx.createLinearGradient(0, 0, 0, adhesiveHeight);
  gradient.addColorStop(0, adhesiveColor);
  gradient.addColorStop(0.7, adhesiveColor);
  gradient.addColorStop(1, baseColor);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, adhesiveHeight);

  ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, adhesiveHeight);
  ctx.lineTo(width, adhesiveHeight);
  ctx.stroke();

  // 체크박스
  const checkboxSize = 42;
  const checkboxX = 18;
  const checkboxY = adhesiveHeight + 18;
  drawCheckbox(ctx, checkboxX, checkboxY, checkboxSize, completed);

  // 텍스트
  const textStartX = checkboxX + checkboxSize + 16;
  const textStartY = adhesiveHeight + 20;
  const padding = 16;
  const lineHeight = 52;
  const maxWidth = width - textStartX - padding;

  if (text) {
    ctx.fillStyle = completed ? "rgba(0, 0, 0, 0.5)" : "#000000";
    ctx.font = "bold 48px ui-sans-serif, system-ui, -apple-system, sans-serif";
    ctx.textBaseline = "top";

    const lines = wrapText(ctx, text, maxWidth);
    lines.forEach((line, index) => {
      const y = textStartY + index * lineHeight;
      if (y < height - padding - 30) {
        ctx.fillText(line, textStartX, y);

        if (completed) {
          const textWidth = ctx.measureText(line).width;
          ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(textStartX, y + lineHeight / 2);
          ctx.lineTo(textStartX + textWidth, y + lineHeight / 2);
          ctx.stroke();
        }
      }
    });
  } else {
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.font = "40px ui-sans-serif, system-ui, -apple-system, sans-serif";
    ctx.textBaseline = "top";
    ctx.fillText("클릭하여 입력...", textStartX, textStartY);
  }

  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.font = "bold 22px ui-sans-serif, system-ui, sans-serif";
  ctx.textBaseline = "bottom";
  ctx.fillText(new Date().toLocaleDateString(), 18, height - 14);

  texture.needsUpdate = true;
}
