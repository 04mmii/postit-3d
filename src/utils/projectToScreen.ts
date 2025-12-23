import * as THREE from "three";

/**
 * 3D 월드 좌표를 2D 스크린 좌표로 변환
 *
 * @param position - 3D 월드 좌표 (Vector3)
 * @param camera - PerspectiveCamera
 * @param container - 렌더링 컨테이너 요소
 * @returns 스크린 좌표 { x, y }
 */
export function projectToScreen(
  position: THREE.Vector3,
  camera: THREE.PerspectiveCamera,
  container: HTMLElement
): { x: number; y: number } {
  const vector = position.clone();
  vector.project(camera);

  return {
    x: ((vector.x + 1) / 2) * container.clientWidth,
    y: ((-vector.y + 1) / 2) * container.clientHeight,
  };
}

/**
 * 2D 스크린 좌표를 3D 월드 좌표로 변환 (특정 Z 평면에서)
 *
 * @param screenX - 스크린 X 좌표
 * @param screenY - 스크린 Y 좌표
 * @param camera - PerspectiveCamera
 * @param container - 렌더링 컨테이너 요소
 * @param targetZ - 목표 Z 평면 (기본값: 0)
 * @returns 월드 좌표 Vector3
 */
export function unprojectToWorld(
  screenX: number,
  screenY: number,
  camera: THREE.PerspectiveCamera,
  container: HTMLElement,
  targetZ = 0
): THREE.Vector3 {
  const ndcX = (screenX / container.clientWidth) * 2 - 1;
  const ndcY = -(screenY / container.clientHeight) * 2 + 1;

  const vector = new THREE.Vector3(ndcX, ndcY, 0.5);
  vector.unproject(camera);

  const dir = vector.sub(camera.position).normalize();
  const distance = (targetZ - camera.position.z) / dir.z;

  return camera.position.clone().add(dir.multiplyScalar(distance));
}
