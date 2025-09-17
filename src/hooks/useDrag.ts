// src/hooks/useDrag.ts
import * as THREE from "three";
import type { CSS3DObject } from "three/examples/jsm/renderers/CSS3DRenderer";

type Params = {
  camera: THREE.PerspectiveCamera;
  surface: HTMLElement; // 보통 renderer.domElement
  onDrop?: (obj: CSS3DObject) => void; // 드래그 끝나고 좌표 저장 등
};

export const useDrag = ({ camera, surface, onDrop }: Params) => {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const plane = new THREE.Plane();
  const normal = new THREE.Vector3();
  const hit = new THREE.Vector3();
  const offset = new THREE.Vector3();

  let dragging: CSS3DObject | null = null;

  const setPointer = (e: PointerEvent) => {
    const rect = surface.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  };

  const bind = (obj: CSS3DObject) => {
    const el = (obj as any).element as HTMLElement;
    if (!el || (el as any).__dragBound) return;
    (el as any).__dragBound = true;
    el.style.cursor = "grab";

    const onDown = (e: PointerEvent) => {
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName?.toLowerCase();
      if (tag === "textarea" || t?.isContentEditable) return; // 입력 중 드래그 방지

      e.preventDefault();
      el.style.cursor = "grabbing";
      dragging = obj;

      // 카메라가 바라보는 평면을, 현재 오브젝트 위치에 생성
      camera.getWorldDirection(normal);
      plane.setFromNormalAndCoplanarPoint(normal, obj.position);

      // 첫 포인터 기준 교차점과 오프셋 계산
      setPointer(e);
      raycaster.setFromCamera(pointer, camera);
      raycaster.ray.intersectPlane(plane, hit);
      offset.copy(obj.position).sub(hit);

      // 보드 위로 살짝 띄우기
      obj.position.z = Math.max(obj.position.z, 20);

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp, { once: true });
    };

    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      setPointer(e);
      raycaster.setFromCamera(pointer, camera);
      if (raycaster.ray.intersectPlane(plane, hit)) {
        dragging.position.copy(hit).add(offset);
      }
    };

    const onUp = () => {
      el.style.cursor = "grab";
      window.removeEventListener("pointermove", onMove);

      const obj = dragging;
      dragging = null;
      if (!obj) return;

      obj.position.z = 0; // 원래 높이로
      onDrop?.(obj); // 좌표 저장 등 콜백
    };

    el.addEventListener("pointerdown", onDown);
  };

  return { bind };
};
