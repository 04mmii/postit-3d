// src/components/NotesLayer.tsx
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useNotes } from "../contexts/NotesContext";
import { useThree } from "../contexts/ThreeContext";
import type { CSS3DObject } from "three/examples/jsm/renderers/CSS3DRenderer";
import { Note3D } from "./Note3D";

export function NotesLayer() {
  const { notes, updateNote } = useNotes();
  const { camera, renderer } = useThree();

  const objectsRef = useRef<CSS3DObject[]>([]);

  // 드래그 계산에 쓰는 유틸 벡터/플레인들 (재사용으로 GC 줄임)
  const raycasterRef = useRef(new THREE.Raycaster());
  const pointerRef = useRef(new THREE.Vector2());
  const planeRef = useRef(new THREE.Plane());
  const normalRef = useRef(new THREE.Vector3());
  const hitRef = useRef(new THREE.Vector3());
  const offsetRef = useRef(new THREE.Vector3());
  const draggingRef = useRef<CSS3DObject | null>(null);

  // 화면 좌표 → NDC
  const setPointerFromEvent = (e: PointerEvent) => {
    const rect = renderer.domElement.getBoundingClientRect();
    pointerRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointerRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  };

  // 각 오브젝트에 포인터 핸들러 부착
  useEffect(() => {
    // 새로 마운트된 객체들에만 부착할 수 있도록 한 번 초기화
    objectsRef.current.forEach((obj) => {
      const el = (obj as any).element as HTMLElement;
      if (!el || (el as any).__dragBound) return;

      el.style.cursor = "grab";
      (el as any).__dragBound = true;

      const onDown = (e: PointerEvent) => {
        // textarea 편집 중일 땐 드래그 막기
        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
        if (tag === "textarea" || (e.target as HTMLElement)?.isContentEditable)
          return;

        e.preventDefault();
        el.style.cursor = "grabbing";
        draggingRef.current = obj;

        // 드래그 평면: 카메라를 바라보는 평면을 오브젝트 위치에 생성
        camera.getWorldDirection(normalRef.current);
        planeRef.current.setFromNormalAndCoplanarPoint(
          normalRef.current,
          obj.position
        );

        setPointerFromEvent(e);
        raycasterRef.current.setFromCamera(pointerRef.current, camera);
        // 처음 눌렀을 때의 교차점과 오프셋
        raycasterRef.current.ray.intersectPlane(
          planeRef.current,
          hitRef.current
        );
        offsetRef.current.copy(obj.position).sub(hitRef.current);

        // z를 살짝 띄워서 보드 위에
        obj.position.z = 20;

        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp, { once: true });
      };

      const onMove = (e: PointerEvent) => {
        const obj = draggingRef.current;
        if (!obj) return;
        setPointerFromEvent(e);
        raycasterRef.current.setFromCamera(pointerRef.current, camera);
        if (
          raycasterRef.current.ray.intersectPlane(
            planeRef.current,
            hitRef.current
          )
        ) {
          obj.position.copy(hitRef.current).add(offsetRef.current);
        }
      };

      const onUp = () => {
        const obj = draggingRef.current;
        draggingRef.current = null;
        el.style.cursor = "grab";
        window.removeEventListener("pointermove", onMove);

        if (!obj) return;
        // 드래그 끝난 좌표 저장
        const p = obj.position;
        const id = (obj as any).userData?.noteId as string | undefined;
        if (id) updateNote(id, { position: { x: p.x, y: p.y, z: 0 } }); // z는 원래 높이로
        obj.position.z = 0;
      };

      el.addEventListener("pointerdown", onDown);
    });
  }, [notes, camera, renderer, updateNote]);

  // 노트 목록이 바뀌면 수집 배열 초기화 → onObjectReady가 다시 채움
  useEffect(() => {
    objectsRef.current = [];
  }, [notes.length]);

  const handleReady = (obj: CSS3DObject) => {
    // Note3D에서 userData.noteId 세팅돼 있어야 함
    objectsRef.current.push(obj);
  };

  return (
    <>
      {notes.map((n) => (
        <Note3D key={n.id} note={n} onObjectReady={handleReady} />
      ))}
    </>
  );
}
