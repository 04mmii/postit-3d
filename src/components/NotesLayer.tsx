import { useEffect, useRef } from "react";
import { useThree } from "../contexts/ThreeContext";
import { useNotes } from "../contexts/NotesContext";
import { Note3D } from "./Note3D";
import { DragControls } from "three/examples/jsm/controls/DragControls";
import * as THREE from "three";

export const NotesLayer: React.FC = () => {
  const { notes, updateNote } = useNotes();
  const { camera, renderer } = useThree();

  const objectsRef = useRef<THREE.Object3D[]>([]);
  const controlsRef = useRef<DragControls | null>(null);

  // DragControls 재생성
  const rebuildControls = () => {
    controlsRef.current?.dispose();
    controlsRef.current = null;

    if (objectsRef.current.length === 0) return;

    // ✅ 화면 위에 실제로 이벤트를 받는 엘리먼트로!
    const domForDrag =
      (document.querySelector(".css3d-container") as HTMLElement) || // ← CSS3D root (프로젝트에 맞게 셀렉터)
      renderer.domElement; // fallback
    const controls = new DragControls(objectsRef.current, camera, domForDrag);

    controls.addEventListener("dragstart", (ev: any) => {
      document.body.style.userSelect = "none";
      ev.object.position.z = (ev.object.position.z ?? 0) + 1;
    });

    controls.addEventListener("dragend", (ev: any) => {
      document.body.style.userSelect = "";
      // Note3D에서 picker.userData.noteId 를 심어줄 거라 바로 사용 가능
      const id = ev.object.userData.noteId as string | undefined;
      if (!id) return;
      const p = ev.object.position;
      const rz = ev.object.rotation.z;
      updateNote(id, { position: { x: p.x, y: p.y, z: p.z }, rotationZ: rz });
    });

    controlsRef.current = controls;
  };

  // 노트 목록 바뀌면 수집 초기화
  useEffect(() => {
    objectsRef.current = [];
    controlsRef.current?.dispose();
    controlsRef.current = null;
    // Note3D들이 onObjectReady로 객체들을 다시 밀어넣으면서 rebuildControls가 호출됨
  }, [notes]);

  // textarea 포커스 중에는 DragControls 비활성화
  useEffect(() => {
    const onFocusIn = (e: Event) => {
      if (e.target instanceof HTMLTextAreaElement) {
        if (controlsRef.current) (controlsRef.current as any).enabled = false;
      }
    };
    const onFocusOut = (e: Event) => {
      if (e.target instanceof HTMLTextAreaElement) {
        if (controlsRef.current) (controlsRef.current as any).enabled = true;
      }
    };
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  // Note3D가 넘겨주는 '픽커 Object3D' 수집
  const handleReady = (obj: THREE.Object3D) => {
    if (!objectsRef.current.includes(obj)) {
      objectsRef.current.push(obj);
      rebuildControls();
    }
  };

  return (
    <>
      {notes.map((n) => (
        <Note3D key={n.id} note={n} onObjectReady={handleReady} />
      ))}
    </>
  );
};
