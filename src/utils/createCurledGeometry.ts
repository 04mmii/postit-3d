import * as THREE from "three";

/**
 * 굴곡진 포스트잇 Geometry 생성
 * 하단이 살짝 들린 효과를 주는 커스텀 PlaneGeometry
 *
 * @param width - 평면 너비
 * @param height - 평면 높이
 * @param curlAmount - 굴곡 정도 (값이 클수록 더 많이 들림)
 * @param segments - 세그먼트 수 (값이 클수록 부드러운 곡선)
 * @returns 버텍스가 조작된 PlaneGeometry
 */
export function createCurledPlaneGeometry(
  width: number,
  height: number,
  curlAmount: number,
  segments = 16
): THREE.PlaneGeometry {
  const geometry = new THREE.PlaneGeometry(width, height, segments, segments);
  const positions = geometry.attributes.position;

  for (let i = 0; i < positions.count; i++) {
    const y = positions.getY(i);
    // 상단(접착부분)은 평평하게, 하단으로 갈수록 들림
    const normalizedY = (y + height / 2) / height; // 0(하단) ~ 1(상단)
    // 하단이 들리도록 (상단은 0, 하단은 curlAmount)
    const curl = Math.pow(1 - normalizedY, 2) * curlAmount;
    positions.setZ(i, curl);
  }

  positions.needsUpdate = true;
  geometry.computeVertexNormals();

  return geometry;
}
