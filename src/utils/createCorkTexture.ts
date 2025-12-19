import * as THREE from "three";

/**
 * 절차적 코르크 보드 텍스처 생성
 * Canvas API를 사용하여 실시간으로 텍스처 생성
 */
export function createCorkTexture(
  width = 512,
  height = 512
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  // 기본 코르크 색상
  ctx.fillStyle = "#c4a574";
  ctx.fillRect(0, 0, width, height);

  // 코르크 입자 효과
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    // 랜덤 노이즈 추가
    const noise = (Math.random() - 0.5) * 30;
    data[i] = Math.min(255, Math.max(0, data[i] + noise)); // R
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise * 0.8)); // G
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise * 0.5)); // B
  }

  ctx.putImageData(imageData, 0, 0);

  // 코르크 패턴 점들
  for (let i = 0; i < 800; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = Math.random() * 3 + 1;
    const alpha = Math.random() * 0.15 + 0.05;

    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = Math.random() > 0.5
      ? `rgba(90, 60, 30, ${alpha})`
      : `rgba(200, 170, 130, ${alpha})`;
    ctx.fill();
  }

  // 미세한 선 패턴 (코르크 결)
  ctx.strokeStyle = "rgba(100, 70, 40, 0.08)";
  ctx.lineWidth = 0.5;
  for (let i = 0; i < 100; i++) {
    const x1 = Math.random() * width;
    const y1 = Math.random() * height;
    const length = Math.random() * 20 + 5;
    const angle = Math.random() * Math.PI;
    const x2 = x1 + Math.cos(angle) * length;
    const y2 = y1 + Math.sin(angle) * length;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 2);

  return texture;
}

/**
 * 코르크 보드 범프맵 생성
 */
export function createCorkBumpMap(
  width = 256,
  height = 256
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  // 기본 회색
  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, width, height);

  // 범프 노이즈
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 60;
    const value = 128 + noise;
    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
  }

  ctx.putImageData(imageData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 2);

  return texture;
}
