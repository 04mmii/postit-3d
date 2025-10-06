import React, { memo, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { CSS3DObject } from "three/examples/jsm/renderers/CSS3DRenderer";
import type { Note } from "../types/note";
import { useThree } from "../contexts/ThreeContext";
import { useNotes } from "../contexts/NotesContext";

let __zCounter = 1;

type Props = { note: Note };

const colorOf = (c: any) =>
  c === "yellow"
    ? "#FFF9C4"
    : c === "pink"
      ? "#F8BBD0"
      : c === "mint"
        ? "#B2EBF2"
        : "#FFF9C4";

function buildNoteElement(note: Note) {
  const wrap = document.createElement("div");
  wrap.setAttribute("draggable", "false");
  Object.assign(wrap.style, {
    position: "relative",
    width: "220px",
    height: "220px",
    transformStyle: "preserve-3d",
    backfaceVisibility: "hidden",
    pointerEvents: "auto",
    userSelect: "none",
    touchAction: "none",
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
  textarea.setAttribute("draggable", "false");
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
    btn.setAttribute("draggable", "false");
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
    // 드래그 시작만 캡처에서 차단 (click 은 살린다)
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

const Note3DBase: React.FC<Props> = ({ note }) => {
  const { scene, camera, mountEl } = useThree();
  const { updateNote, removeNote } = useNotes();
  const composingRef = useRef(false);

  const { obj, cardInner, textarea, delBtn, rotBtn } = useMemo(() => {
    const dom = buildNoteElement(note);
    const obj = new CSS3DObject(dom.wrap);
    return { obj, ...dom };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const group = useMemo(() => new THREE.Group(), []);

  useEffect(() => {
    group.add(obj);
    group.position.set(
      note.position?.x ?? 0,
      note.position?.y ?? 0,
      note.position?.z ?? 0
    );
    group.rotation.set(0, 0, note.rotationZ ?? 0);
    scene.add(group);
    return () => void scene.remove(group);
  }, [group, obj, scene, note.position, note.rotationZ]);

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

  // 입력 저장(IME 완전 지원)
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

  // 버튼: click 으로 확실히 처리
  useEffect(() => {
    const onDelete = (e: MouseEvent) => {
      e.stopPropagation();
      // 1) 상태 제거
      removeNote(note.id);
      // 2) 혹시 상태 반영이 늦거나 실패해도 씬에서 즉시 제거 (겹침/클릭 막기)
      try {
        scene.remove(group);
        group.clear();
        // DOM도 안전하게 제거
        if (obj.element?.parentElement) {
          obj.element.parentElement.removeChild(obj.element);
        }
      } catch {}
    };

    const onRotate = (e: MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
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

  // 카드 하나만 드래그
  useEffect(() => {
    const isUI = (t: EventTarget | null) =>
      t instanceof HTMLTextAreaElement ||
      (t instanceof HTMLElement && t.closest("button"));

    let dragging = false;
    let pid: number | null = null;
    let pointerId: number | null = null;
    let sx = 0,
      sy = 0;
    const startPos = new THREE.Vector3();

    const cleanup = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      dragging = false;
      pid = null; // ⬅️ 해제
    };

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      if (isUI(e.target)) return;

      // 맨 앞으로 올리기 (CSS3D는 DOM 순서/ z-index에 영향 큼)
      try {
        // 시각적 최전면
        (obj.element as HTMLElement).style.zIndex = String(++__zCounter);
        // 살짝 띄워서 z-fighting 방지 (원근 반영)
        group.position.z += 0.001;
      } catch {}

      dragging = true;
      pid = e.pointerId;
      sx = e.clientX;
      sy = e.clientY;
      startPos.copy(group.position);
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onCancel);
    };

    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      if (pid !== null && e.pointerId !== pid) return;
      if (pointerId !== null && e.pointerId !== pointerId) return;
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

    const onUp = () => {
      if (pid !== null && e.pointerId !== pid) return;
      if (dragging) {
        const p = group.position;
        updateNote(note.id, {
          position: { x: p.x, y: p.y, z: p.z },
          rotationZ: group.rotation.z,
        });
      }
      cleanup();
    };

    const onCancel = () => cleanup();

    obj.element.addEventListener("pointerdown", onDown);
    return () => {
      obj.element.removeEventListener("pointerdown", onDown);
      cleanup();
    };
  }, [obj.element, group, camera, mountEl, note.id, updateNote]);

  return null;
};

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

const Note3D = memo(Note3DBase, areEqual);
export default Note3D;
