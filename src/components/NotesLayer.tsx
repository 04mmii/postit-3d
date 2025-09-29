import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { DragControls } from "three/examples/jsm/controls/DragControls";
import { useThree } from "../contexts/ThreeContext";
import { useNotes } from "../contexts/NotesContext";
import { Note3D } from "./Note3D";

export function NotesLayer() {
  const { notes, updateNote } = useNotes();
  const { camera, renderer } = useThree();

  const pickersRef = useRef<THREE.Object3D[]>([]);
  const controlsRef = useRef<DragControls | null>(null);

  // 노트 ID만 묶어서 DragControls 재생성 트리거
  const idsKey = useMemo(() => notes.map((n) => n.id).join(","), [notes]);

  const rebuildControls = () => {
    controlsRef.current?.dispose();
    controlsRef.current = null;

    if (pickersRef.current.length === 0) return;

    const controls = new DragControls(
      pickersRef.current,
      camera,
      renderer.domElement
    );

    controls.addEventListener("drag", (ev: any) => {
      const picker = ev.object as THREE.Object3D;
      const group = picker.parent as THREE.Group;
      if (group) group.position.copy(picker.position);
    });

    controls.addEventListener("dragend", (ev: any) => {
      const picker = ev.object as THREE.Object3D;
      const group = picker.parent as THREE.Group;
      if (!group) return;
      group.position.copy(picker.position);
      const id = (picker as any).userData.noteId as string | undefined;
      if (!id) return;
      const p = group.position;
      const rz = group.rotation.z;
      updateNote(id, { position: { x: p.x, y: p.y, z: p.z }, rotationZ: rz });
    });

    controlsRef.current = controls;
  };

  // 노트 배열이 바뀌면 다시 수집
  useEffect(() => {
    pickersRef.current = [];
    controlsRef.current?.dispose();
    controlsRef.current = null;
    // 실제 컨트롤 생성은 picker가 채워진 뒤 (handleReady에서) 수행
  }, [idsKey]);

  // Note3D에서 picker 받아서 수집
  const handleReady = (picker: THREE.Object3D) => {
    if (!pickersRef.current.includes(picker)) {
      pickersRef.current.push(picker);
      rebuildControls(); // 하나 들어올 때마다 안전하게 재생성
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
