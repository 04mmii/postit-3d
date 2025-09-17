import { useEffect, useMemo, useRef } from "react";
import type { CSS3DObject } from "three/examples/jsm/renderers/CSS3DRenderer";
import { useNotes } from "../contexts/NotesContext";
import { useThree } from "../contexts/ThreeContext";
import { Note3D } from "../components/Note3D";
import { useDrag } from "../hooks/useDrag";

export const NotesLayer = () => {
  const { notes, updateNote } = useNotes();
  const { camera, renderer } = useThree();
  const objects = useRef<CSS3DObject[]>([]);

  const drag = useMemo(
    () =>
      useDrag({
        camera,
        surface: renderer.domElement,
        onDrop: (o) => {
          const id = (o as any).userData?.noteId as string | undefined;
          if (!id) return;
          const { x, y } = o.position;
          updateNote(id, { position: { x, y, z: 0 } });
        },
      }),
    [camera, renderer.domElement, updateNote]
  );

  const handleReady = (obj: CSS3DObject) => {
    if (!objects.current.includes(obj)) {
      objects.current.push(obj);
      drag.bind(obj); // 추가되자마자 한 번만 바인딩
    }
  };

  useEffect(() => {
    const ids = new Set(notes.map((n) => n.id));
    objects.current = objects.current.filter((o) =>
      ids.has((o as any).userData?.noteId as string)
    );
  }, [notes]);

  return (
    <>
      {notes.map((n) => (
        <Note3D key={n.id} note={n} onObjectReady={handleReady} />
      ))}
    </>
  );
};
