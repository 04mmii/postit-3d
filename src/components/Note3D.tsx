import { memo, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { CSS3DObject } from "three/examples/jsm/renderers/CSS3DRenderer";
import type { Note } from "../types/note";
import { useThree } from "../contexts/ThreeContext";
import { useNotes } from "../contexts/NotesContext";

type Props = { note: Note };

// 색
const colorOf = (c: any) =>
  c === "yellow"
    ? "#FFF9C4"
    : c === "pink"
      ? "#F8BBD0"
      : c === "mint"
        ? "#B2EBF2"
        : "#FFF9C4";

// DOM 한 번만 생성
function buildNoteElement(note: Note) {
  const wrap = document.createElement("div");
  Object.assign(wrap.style, {
    position: "relative",
    width: "220px",
    height: "220px",
    transformStyle: "preserve-3d",
    backfaceVisibility: "hidden",
    pointerEvents: "auto",
    userSelect: "none",
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
  card.appendChild(cardInner);

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
    pointerEvents: "auto",
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

  const buttons = document.createElement("div");
  Object.assign(buttons.style, { display: "flex", gap: "6px" });

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
      pointerEvents: "auto",
    });
    // drag 이벤트로 안 올라가게 최소 차단
    btn.addEventListener("pointerdown", (e) => e.stopPropagation(), {
      capture: true,
    });
    return btn;
  };

  const rotBtn = mkBtn("↻", "살짝 기울이기");
  const delBtn = mkBtn("🗑️", "삭제");
  buttons.appendChild(rotBtn);
  buttons.appendChild(delBtn);

  footer.appendChild(date);
  footer.appendChild(buttons);

  cardInner.appendChild(tape);
  cardInner.appendChild(textarea);
  cardInner.appendChild(footer);

  requestAnimationFrame(() => {
    shadow.style.boxShadow = "0 18px 30px rgba(0,0,0,.2201)";
  });

  return { wrap, cardInner, textarea, delBtn, rotBtn };
}

const Note3DBase = ({ note }: Props) => {
  const { scene, camera, mountEl } = useThree();
  const { updateNote, removeNote } = useNotes();

  const composingRef = useRef(false);

  // CSS DOM
  const { obj, cardInner, textarea, delBtn, rotBtn } = useMemo(() => {
    const dom = buildNoteElement(note);
    const obj = new CSS3DObject(dom.wrap);
    return { obj, ...dom };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 개별 그룹 (다른 메모와 절대 공유 X)
  const group = useMemo(() => new THREE.Group(), []);

  // 장면 등록
  useEffect(() => {
    group.add(obj);
    group.position.set(
      note.position?.x ?? 0,
      note.position?.y ?? 0,
      note.position?.z ?? 0
    );
    group.rotation.set(0, 0, note.rotationZ ?? 0);
    (group as any).userData.noteId = note.id;

    scene.add(group);
    return () => {
      scene.remove(group);
    };
  }, [group, obj, scene, note.id]); // 위치/회전은 아래 동기화 useEffect에서 반영

  // note -> view 동기화 (IME 중엔 text 덮어쓰기 금지)
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

  // 입력 (IME 안전)
  useEffect(() => {
    const onCompStart = () => (composingRef.current = true);
    const onCompEnd = () => {
      composingRef.current = false;
      updateNote(note.id, { text: textarea.value });
    };
    const onInput = (e: Event) => {
      e.stopPropagation();
      if (!composingRef.current) updateNote(note.id, { text: textarea.value });
    };

    textarea.addEventListener("compositionstart", onCompStart);
    textarea.addEventListener("compositionend", onCompEnd);
    textarea.addEventListener("input", onInput);
    return () => {
      textarea.removeEventListener("compositionstart", onCompStart);
      textarea.removeEventListener("compositionend", onCompEnd);
      textarea.removeEventListener("input", onInput);
    };
  }, [note.id, textarea, updateNote]);

  // 버튼 (삭제/회전)
  useEffect(() => {
    const onDelete = (e: Event) => {
      e.stopPropagation();
      removeNote(note.id);
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
  }, [delBtn, rotBtn, note.id, note.rotationZ, removeNote, updateNote]);

  // === 개별 드래그 (다른 메모에 영향 없음) ===
  useEffect(() => {
    const isUI = (t: EventTarget | null) =>
      t instanceof HTMLTextAreaElement ||
      (t instanceof HTMLElement && t.closest("button"));

    let dragging = false;
    let sx = 0,
      sy = 0;
    const startPos = new THREE.Vector3();

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      if (isUI(e.target)) return;
      dragging = true;
      sx = e.clientX;
      sy = e.clientY;
      startPos.copy(group.position);
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp, { once: true });
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - sx;
      const dy = e.clientY - sy;

      const distance = Math.abs(camera.position.z - group.position.z);
      const fovRad = (camera.fov * Math.PI) / 180;
      const worldPerPixelY =
        (2 * Math.tan(fovRad / 2) * distance) / (mountEl?.clientHeight || 1);
      const worldPerPixelX = worldPerPixelY * (camera.aspect || 1);

      group.position.x = startPos.x + dx * worldPerPixelX;
      group.position.y = startPos.y - dy * worldPerPixelY;
    };

    const onPointerUp = () => {
      if (!dragging) return;
      dragging = false;
      window.removeEventListener("pointermove", onPointerMove);
      const p = group.position;
      updateNote(note.id, {
        position: { x: p.x, y: p.y, z: p.z },
        rotationZ: group.rotation.z,
      });
    };

    obj.element.addEventListener("pointerdown", onPointerDown);
    return () => {
      obj.element.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [obj.element, group, camera, mountEl, note.id, updateNote]);

  return null;
};

// 텍스트는 비교에서 제외 (IME/커서 보존)
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
  );
};

export const Note3D = memo(Note3DBase, areEqual);
