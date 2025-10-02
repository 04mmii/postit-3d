// src/components/Note3D.tsx
import { memo, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { CSS3DObject } from "three/examples/jsm/renderers/CSS3DRenderer";
import type { Note } from "../types/note";
import { useThree } from "../contexts/ThreeContext";
import { useNotes } from "../contexts/NotesContext";

type Props = { note: Note };

const colorOf = (c: any) =>
  c === "yellow"
    ? "#FFF9C4"
    : c === "pink"
      ? "#F8BBD0"
      : c === "mint"
        ? "#B2EBF2"
        : "#FFF9C4";

/** DOM만 한 번 생성 */
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

  const mkBtn = (label: string, title: string, action: "rotate" | "delete") => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = label;
    btn.title = title;
    btn.dataset.action = action; // ← 이벤트 위임용
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
    // 드래그로 안 끌려가게 pointerdown만 캡처에서 차단
    const stop = (e: Event) => e.stopPropagation();
    btn.addEventListener("pointerdown", stop, { capture: true });
    return btn;
  };

  const rotBtn = mkBtn("↻", "살짝 기울이기", "rotate");
  const delBtn = mkBtn("🗑️", "삭제", "delete");
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

  return { wrap, cardInner, textarea };
}

const Note3DBase = ({ note }: Props) => {
  const { scene, camera, mountEl } = useThree();
  const { updateNote, removeNote } = useNotes();

  const composingRef = useRef(false);

  // DOM/CSS3DObject 1회 생성
  const { obj, cardInner, textarea } = useMemo(() => {
    const dom = buildNoteElement(note);
    const obj = new CSS3DObject(dom.wrap);
    return { obj, ...dom };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 이동용 3D 그룹
  const group = useMemo(() => new THREE.Group(), []);

  // 장면 등록/해제
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
  }, [group, obj, scene, note.id, note.position, note.rotationZ]);

  // note → view 반영 (IME 중엔 텍스트 덮어쓰기 금지)
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

  // 입력(IME 완전 대응)
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

  // 버튼: 이벤트 위임 (삭제/회전 둘 다 여기서 처리)
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const btn = target.closest(
        "button[data-action]"
      ) as HTMLButtonElement | null;
      if (!btn) return;

      e.stopPropagation();
      const action = btn.dataset.action;

      if (action === "delete") {
        removeNote(note.id); // ✅ 확실히 호출
        return;
      }
      if (action === "rotate") {
        const jitter = (Math.random() - 0.5) * 0.2;
        updateNote(note.id, { rotationZ: (note.rotationZ ?? 0) + jitter });
        return;
      }
    };

    // 버튼 각각에 붙이지 않고, 최상위 요소에서 한 번만 듣는다
    obj.element.addEventListener("click", onClick);
    return () => {
      obj.element.removeEventListener("click", onClick);
    };
  }, [obj.element, note.id, note.rotationZ, removeNote, updateNote]);

  // 직접 드래그 (textarea/버튼 제외)
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

// 텍스트 변경은 비교에서 제외(IME/커서 보존)
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
