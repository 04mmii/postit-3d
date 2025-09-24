import { useEffect, useMemo, useRef } from "react";
import { useThree } from "../contexts/ThreeContext";
import { useNotes } from "../contexts/NotesContext";
import { Note3D } from "./Note3D";
import { DragControls } from "three/examples/jsm/controls/DragControls";
import type { CSS3DObject } from "three/examples/jsm/renderers/CSS3DRenderer";

export function NotesLayer() {
  const { notes, updateNote } = useNotes();
  const { camera, renderer } = useThree();

  const objectsRef = useRef<CSS3DObject[]>([]);
  const controlsRef = useRef<DragControls | null>(null);

  // ✅ 노트 "ID만" 키로 사용 → 텍스트 변경에는 반응하지 않음
  const idsKey = useMemo(() => notes.map((n) => n.id).join(","), [notes]);

  // ✅ DragControls는 추가/삭제(ID 변화)에만 재생성
  useEffect(() => {
    controlsRef.current?.dispose();
    if (objectsRef.current.length === 0) return;

    const controls = new DragControls(
      objectsRef.current,
      camera,
      renderer.domElement
    );

    controls.addEventListener("dragstart", (ev: any) => {
      document.body.style.userSelect = "none";
      ev.object.position.z = 20;
    });

    controls.addEventListener("dragend", (ev: any) => {
      document.body.style.userSelect = "";
      const id = ev.object.userData.noteId as string;
      const p = ev.object.position;
      const rotZ = ev.object.rotation.z;
      updateNote(id, {
        position: { x: p.x, y: p.y, z: p.z },
        rotationZ: rotZ,
      });
    });

    controlsRef.current = controls;
    return () => controls.dispose();
  }, [idsKey, camera, renderer, updateNote]);

  // ✅ textarea에 포커스 들어오면 드래그 완전 비활성화, 포커스 빠지면 활성화
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

  // Note3D가 전달하는 CSS3DObject 모으기
  useEffect(() => {
    objectsRef.current = []; // ID 변경 시에만 초기화
  }, [idsKey]);

  const handleReady = (obj: CSS3DObject) => {
    if (!objectsRef.current.includes(obj)) {
      objectsRef.current.push(obj);
    }
  };

  return (
    <>
      {notes.map((n) => (
        <Note3D key={n.id} note={n} onObjectReady={handleReady} />
      ))}
    </>
  );
}
