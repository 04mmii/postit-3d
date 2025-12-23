import { useEffect, useRef, useCallback } from "react";
import * as THREE from "three";

export type ParallaxConfig = {
  /** 기본 카메라 위치 */
  basePosition?: { x: number; y: number; z: number };
  /** X축 시차 강도 */
  parallaxStrengthX?: number;
  /** Y축 시차 강도 */
  parallaxStrengthY?: number;
  /** 보간 속도 (0~1, 작을수록 부드러움) */
  lerpFactor?: number;
  /** 드래그 중 시차 비활성화 여부 */
  disableOnDrag?: boolean;
};

const defaultConfig: ParallaxConfig = {
  basePosition: { x: 0, y: 0, z: 1000 },
  parallaxStrengthX: 25,
  parallaxStrengthY: 15,
  lerpFactor: 0.04,
  disableOnDrag: true,
};

/**
 * 마우스 움직임에 따른 카메라 시차 효과 훅
 *
 * @param camera - Three.js PerspectiveCamera
 * @param mountEl - 마운트 요소
 * @param config - 시차 설정
 */
export function useParallaxCamera(
  camera: THREE.PerspectiveCamera | null,
  mountEl: HTMLElement | null,
  config: ParallaxConfig = {}
) {
  const mergedConfig = { ...defaultConfig, ...config };
  const isDraggingRef = useRef(false);
  const targetOffsetRef = useRef({ x: 0, y: 0 });
  const currentOffsetRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);

  const updateCameraPosition = useCallback(() => {
    if (!camera) return;

    const { basePosition, lerpFactor } = mergedConfig;

    // 부드러운 보간
    currentOffsetRef.current.x +=
      (targetOffsetRef.current.x - currentOffsetRef.current.x) * lerpFactor!;
    currentOffsetRef.current.y +=
      (targetOffsetRef.current.y - currentOffsetRef.current.y) * lerpFactor!;

    camera.position.x = basePosition!.x + currentOffsetRef.current.x;
    camera.position.y = basePosition!.y + currentOffsetRef.current.y;
    camera.position.z = basePosition!.z;
    camera.lookAt(0, 0, 0);
  }, [camera, mergedConfig]);

  useEffect(() => {
    if (!mountEl || !camera) return;

    const { parallaxStrengthX, parallaxStrengthY, disableOnDrag } = mergedConfig;

    const onMouseMove = (e: MouseEvent) => {
      if (disableOnDrag && isDraggingRef.current) return;

      const rect = mountEl.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      targetOffsetRef.current.x = x * parallaxStrengthX!;
      targetOffsetRef.current.y = -y * parallaxStrengthY!;
    };

    const onMouseDown = () => {
      isDraggingRef.current = true;
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    const onMouseLeave = () => {
      targetOffsetRef.current = { x: 0, y: 0 };
      isDraggingRef.current = false;
    };

    mountEl.addEventListener("mousemove", onMouseMove);
    mountEl.addEventListener("mousedown", onMouseDown);
    mountEl.addEventListener("mouseup", onMouseUp);
    mountEl.addEventListener("mouseleave", onMouseLeave);

    // 애니메이션 루프
    const loop = () => {
      updateCameraPosition();
      rafRef.current = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(rafRef.current);
      mountEl.removeEventListener("mousemove", onMouseMove);
      mountEl.removeEventListener("mousedown", onMouseDown);
      mountEl.removeEventListener("mouseup", onMouseUp);
      mountEl.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [mountEl, camera, mergedConfig, updateCameraPosition]);

  return {
    isDragging: isDraggingRef.current,
    resetOffset: () => {
      targetOffsetRef.current = { x: 0, y: 0 };
    },
  };
}
