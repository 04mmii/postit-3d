import { memo, useEffect, useMemo, useRef } from "react";
import { CSS3DObject } from "three/examples/jsm/renderers/CSS3DRenderer";
import type { Note } from "../types/note";
import { useThree } from "../contexts/ThreeContext";
import { useNotes } from "../contexts/NotesContext";
import * as THREE from "three";

type Props = {
  note: Note;
  onObjectReady?: (obj: THREE.Object3D) => void;
};

const colorOf = (c: any) =>
  c === "yellow"
    ? "#FFF9C4"
    : c === "pink"
      ? "#F8BBD0"
      : c === "mint"
        ? "#B2EBF2"
        : "#FFF9C4";

/** DOM 빌드 (한 번만) */
const buildNoteElement = (note: Note) => {
  const wrap = document.createElement("div");
  Object.assign(wrap.style, {
    position: "relative",
    width: "220px",
    height: "220px",
    transformStyle: "preserve-3d",
    backfaceVisibility: "hidden",
  });

  const card = document.createElement("div");
  Object.assign(card.style, {
    position: "relative",
    width: "100%",
    height: "100%",
  });

  const cardInner = document.createElement("div");
  Object.assign(cardInner.style, {
    width: "100%",
    height: "100%",
    borderRadius: "10px 0 0 0",
    padding: "14px",
    background: colorOf(note.color),
    boxShadow: "0 18px 30px rgba(0,0,0,.22)",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  });
  card.appendChild(cardInner);

  // 상단 잘린 그림자
  const shadow = document.createElement("div");
  Object.assign(shadow.style, {
    position: "absolute",
    inset: "0",
    borderRadius: "10px 0 0 0",
    pointerEvents: "none",
    boxShadow: "0 18px 30px rgba(0,0,0,.22)",
    WebkitMaskImage: "linear-gradient(#0000 0 26px, #000 26px)",
    maskImage: "linear-gradient(#0000 0 26px, #000 26px)",
    zIndex: "0",
  });

  wrap.appendChild(shadow);
  wrap.appendChild(card);

  const tape = document.createElement("div");
  Object.assign(tape.style, {
    alignSelf: "center",
    width: "90px",
    height: "20px",
    background: "linear-gradient(180deg, #fff, rgba(255,255,255,.6))",
    boxShadow: "0 2px 4px rgba(0,0,0,.2)",
    opacity: ".85",
    borderRadius: "3px",
    marginTop: "-6px",
    mixBlendMode: "multiply",
    transform: `rotate(${((Math.random() - 0.5) * 4).toFixed(2)}deg)`,
  });

  const textarea = document.createElement("textarea");
  textarea.value = note.text ?? "";
  textarea.placeholder = "할 일을 적어보세요…";
  Object.assign(textarea.style, {
    flex: "1",
    border: "none",
    outline: "none",
    resize: "none",
    background: "transparent",
    fontSize: "16px",
    lineHeight: "1.4",
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
    userSelect: "text",
  });

  const footer = document.createElement("div");
  Object.assign(footer.style, {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  });

  const date = document.createElement("span");
  date.textContent = new Date(
    note.createdAt ?? Date.now()
  ).toLocaleDateString();
  Object.assign(date.style, { fontSize: "12px", opacity: ".7" });
  footer.appendChild(date);

  const right = document.createElement("div");
  Object.assign(right.style, { display: "flex", gap: "6px" });

  const mkBtn = (label: string, title: string) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = label;
    btn.title = title;
    btn.dataset.nodrag = "1";
    Object.assign(btn.style, {
      width: "28px",
      height: "28px",
      borderRadius: "50%",
      background: "#fff",
      color: "#333",
      border: "1px solid #ccc",
      cursor: "pointer",
    });
    return btn;
  };
  const rotBtn = mkBtn("↻", "살짝 기울이기");
  const delBtn = mkBtn("🗑️", "삭제");
  right.appendChild(rotBtn);
  right.appendChild(delBtn);
  footer.appendChild(right);

  cardInner.appendChild(tape);
  cardInner.appendChild(textarea);
  cardInner.appendChild(footer);

  // 초기 그림자 보장 트릭
  requestAnimationFrame(() => {
    shadow.style.boxShadow = "0 18px 30px rgba(0,0,0,.2201)";
  });

  return { wrap, cardInner, textarea, delBtn, rotBtn };
};

const Note3DBase = ({ note, onObjectReady }: Props) => {
  const { scene, renderer } = useThree();
  const { updateNote, deleteNote } = useNotes();

  const composingRef = useRef(false);
  const editingRef = useRef(false);

  const { obj, cardInner, textarea, delBtn, rotBtn } = useMemo(() => {
    const { wrap, cardInner, textarea, delBtn, rotBtn } =
      buildNoteElement(note);
    const obj = new CSS3DObject(wrap);
    (obj as any).userData.noteId = note.id;
    return { obj, cardInner, textarea, delBtn, rotBtn };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // DOM은 1회만

  const { group, picker } = useMemo(() => {
    const geo = new THREE.PlaneGeometry(220, 220);
    const mat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 });
    const picker = new THREE.Mesh(geo, mat);
    const group = new THREE.Group();
    group.add(picker);
    return { group, picker };
  }, []);

  useEffect(() => {
    // picker에도 noteId를 심어 둔다 (dragend에서 바로 가져다 쓰게)
    (picker as any).userData.noteId = note.id;

    group.add(obj); // CSS3DObject를 그룹에 붙이고
    group.position.set(
      note.position?.x ?? 0,
      note.position?.y ?? 0,
      note.position?.z ?? 0
    );
    group.rotation.set(0, 0, note.rotationZ ?? 0);

    scene.add(group);
    onObjectReady?.(picker); // ⬅️ DragControls는 picker를 잡게

    return () => {
      scene.remove(group);
    };
  }, [
    group,
    picker,
    obj,
    scene,
    onObjectReady,
    note.id,
    note.position,
    note.rotationZ,
  ]);

  // add/remove
  useEffect(() => {
    scene.add(obj);
    onObjectReady?.(obj);
    return () => void scene.remove(obj);
  }, [obj, scene, onObjectReady]);

  // note → view 반영 (편집 중이면 text 덮어쓰기 금지)
  useEffect(() => {
    if (!composingRef.current && textarea.value !== (note.text ?? "")) {
      textarea.value = note.text ?? "";
    }
    cardInner.style.background = colorOf(note.color);
    group.position.set(
      note.position?.x ?? 0,
      note.position?.y ?? 0,
      note.position?.z ?? 0
    );
    group.rotation.set(0, 0, note.rotationZ ?? 0);
  }, [note, group, cardInner, textarea]);

  // 입력/조합/포커스 (저장은 blur & compositionend 에서만)
  useEffect(() => {
    const el = textarea;

    const stop = (e: Event) => e.stopPropagation(); // DragControls로 버블 방지
    el.addEventListener("pointerdown", stop, { capture: true });
    el.addEventListener("pointermove", stop, { capture: true });
    el.addEventListener("mousedown", stop, { capture: true });
    el.addEventListener("click", stop, { capture: true });
    el.addEventListener("keydown", stop, { capture: true });

    const onFocus = () => {
      editingRef.current = true;
      (renderer.domElement as HTMLElement).style.pointerEvents = "none";
    };
    const onBlur = () => {
      editingRef.current = false;
      (renderer.domElement as HTMLElement).style.pointerEvents = "auto";
      if (!composingRef.current) {
        updateNote(note.id, { text: el.value });
      }
    };
    const onCompStart = () => {
      composingRef.current = true;
    };
    const onCompEnd = () => {
      composingRef.current = false;
      updateNote(note.id, { text: el.value });
    };
    const onInput = (e: Event) => {
      // 화면에만 반영 (이미 textarea.value로 보임). 저장은 blur/compEnd에서.
      e.stopPropagation();
    };

    el.addEventListener("focus", onFocus);
    el.addEventListener("blur", onBlur);
    el.addEventListener("compositionstart", onCompStart);
    el.addEventListener("compositionend", onCompEnd);
    el.addEventListener("input", onInput);

    return () => {
      el.removeEventListener(
        "pointerdown",
        stop as any,
        { capture: true } as any
      );
      el.removeEventListener(
        "pointermove",
        stop as any,
        { capture: true } as any
      );
      el.removeEventListener(
        "mousedown",
        stop as any,
        { capture: true } as any
      );
      el.removeEventListener("click", stop as any, { capture: true } as any);
      el.removeEventListener("keydown", stop as any, { capture: true } as any);

      el.removeEventListener("focus", onFocus);
      el.removeEventListener("blur", onBlur);
      el.removeEventListener("compositionstart", onCompStart);
      el.removeEventListener("compositionend", onCompEnd);
      el.removeEventListener("input", onInput);

      (renderer.domElement as HTMLElement).style.pointerEvents = "auto";
    };
  }, [note.id, textarea, updateNote, renderer.domElement]);

  // 버튼
  useEffect(() => {
    const onDelete = (e: Event) => {
      e.stopPropagation();
      deleteNote(note.id);
    };
    const onRotate = (e: Event) => {
      e.stopPropagation();
      const jitter = (Math.random() - 0.5) * 0.2;
      updateNote(note.id, { rotationZ: (note.rotationZ ?? 0) + jitter });
    };
    delBtn.addEventListener("click", onDelete);
    rotBtn.addEventListener("click", onRotate);
    return () => {
      delBtn.removeEventListener("click", onDelete);
      rotBtn.removeEventListener("click", onRotate);
    };
  }, [delBtn, rotBtn, note.id, note.rotationZ, deleteNote, updateNote]);

  return null;
};

// ✱ 텍스트 변화로는 리렌더 안 되게 (편집 중 커서/조합 보존)
const areEqual = (prev: Props, next: Props) => {
  const a = prev.note,
    b = next.note;
  return (
    a.id === b.id &&
    a.color === b.color &&
    a.rotationZ === b.rotationZ &&
    a.position?.x === b.position?.x &&
    a.position?.y === b.position?.y &&
    a.position?.z === b.position?.z
    // a.text 비교 의도적으로 제외!
  );
};

export const Note3D = memo(Note3DBase, areEqual);
