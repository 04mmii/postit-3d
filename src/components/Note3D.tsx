import { useEffect, useMemo, useRef } from "react";
import { CSS3DObject } from "three/examples/jsm/renderers/CSS3DRenderer";
import type { Note } from "../types/note";
import { useThree } from "../contexts/ThreeContext";
import { useNotes } from "../contexts/NotesContext";

type Props = {
  note: Note;
  onObjectReady?: (obj: CSS3DObject) => void;
};

/** 색상 헬퍼 */
const colorOf = (c: any) =>
  c === "yellow"
    ? "#FFF9C4" // 파스텔 옐로우
    : c === "pink"
      ? "#F8BBD0" // 파스텔 핑크
      : c === "mint"
        ? "#B2EBF2" // 파스텔 민트
        : "#FFF9C4";

/** DOM 생성 */
const buildNoteElement = (note: Note) => {
  const wrap = document.createElement("div");
  wrap.className = "note3d-root";
  Object.assign(wrap.style, {
    position: "relative",
    width: "220px",
    height: "220px",
    transform: "translateZ(0)",
    WebkitFontSmoothing: "antialiased",
    willChange: "transform",
    transformStyle: "preserve-3d",
    backfaceVisibility: "hidden",
    boxShadow: `
      0 4px 6px rgba(0,0,0,.1),
      0 10px 15px rgba(0,0,0,.15),
      0 18px 30px rgba(0,0,0,.2)
    `,
    transition: "transform .2s ease, box-shadow .2s ease",
  });

  const card = document.createElement("div");
  Object.assign(card.style, {
    width: "100%",
    height: "100%",
    position: "relative",
  });

  const cardInner = document.createElement("div");
  Object.assign(cardInner.style, {
    width: "100%",
    height: "100%",
    borderRadius: "10px 0 0 0",
    padding: "14px",
    background: colorOf(note.color),
    boxShadow: "0 18px 30px rgba(0,0,0,.22)",
    transition: "transform .25s ease",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  });
  card.appendChild(cardInner);

  // ✅ 그림자 (위쪽 잘라서 없음)
  const shadow = document.createElement("div");
  Object.assign(shadow.style, {
    position: "absolute",
    inset: "0",
    borderRadius: "10px 0 0 0",
    pointerEvents: "none",
    boxShadow: "0 18px 30px rgba(0,0,0,.22)",
    webkitMaskImage: "linear-gradient(#0000 0 26px, #000 26px)",
    maskImage: "linear-gradient(#0000 0 26px, #000 26px)",
    zIndex: "0",
  });
  wrap.appendChild(shadow);
  wrap.appendChild(card);

  // ✅ 테이프
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

  // ✅ textarea
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

  // ✅ footer
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
      fontSize: "14px",
      cursor: "pointer",
      border: "1px solid #ccc",
      boxShadow: "0 2px 4px rgba(0,0,0,.15)",
      transition: "background .2s ease, transform .15s ease",
    });
    btn.onmouseenter = () => (btn.style.transform = "scale(1.1)");
    btn.onmouseleave = () => (btn.style.transform = "scale(1)");
    return btn;
  };

  const rotBtn = mkBtn("↻", "살짝 기울이기");
  const delBtn = mkBtn("🗑️", "삭제");
  right.appendChild(rotBtn);
  right.appendChild(delBtn);
  footer.appendChild(right);

  // ✅ 올바른 append 순서
  cardInner.appendChild(tape);
  cardInner.appendChild(textarea);
  cardInner.appendChild(footer);

  // 첫 프레임에 강제 리페인트
  requestAnimationFrame(() => {
    shadow.style.boxShadow = "0 18px 30px rgba(0,0,0,.2201)";
  });

  return { wrap, card, cardInner, textarea, delBtn, rotBtn, tape };
};

export const Note3D = ({ note, onObjectReady }: Props) => {
  const { scene } = useThree();
  const { updateNote, removeNote } = useNotes();

  const composingRef = useRef(false);
  const dirtyRef = useRef(false);
  const saveTimer = useRef<number | null>(null);

  const { obj, card, cardInner, textarea, delBtn, rotBtn, tape } =
    useMemo(() => {
      const { wrap, card, cardInner, textarea, delBtn, rotBtn, tape } =
        buildNoteElement(note);
      const obj = new CSS3DObject(wrap);
      return { obj, card, cardInner, textarea, delBtn, rotBtn, tape };
    }, []);

  useEffect(() => {
    scene.add(obj);
    onObjectReady?.(obj);
    return () => {
      scene.remove(obj);
    };
  }, [obj, scene, onObjectReady]);

  // note 반영
  useEffect(() => {
    if (!composingRef.current && textarea.value !== (note.text ?? "")) {
      textarea.value = note.text ?? "";
    }
    card.style.background = colorOf(note.color);
    if (note.position) {
      obj.position.set(
        note.position.x ?? 0,
        note.position.y ?? 0,
        note.position.z ?? 0
      );
    }
    obj.rotation.set(0, 0, note.rotationZ ?? 0);
  }, [note, obj, card, textarea]);

  const rotationRef = useRef<number>(note.rotationZ ?? 0);
  useEffect(() => {
    rotationRef.current = note.rotationZ ?? 0;
  }, [note.rotationZ]);

  // 입력 이벤트
  useEffect(() => {
    const stopBub = (e: Event) => e.stopPropagation();
    textarea.addEventListener("pointerdown", stopBub, { capture: true });

    const flush = () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
      if (!dirtyRef.current) return;
      dirtyRef.current = false;
      updateNote(note.id, { text: textarea.value });
    };

    const onCompositionStart = () => {
      composingRef.current = true;
    };

    const onCompositionEnd = () => {
      composingRef.current = false;
      dirtyRef.current = false; // ✅ 조합 종료 후 dirty 초기화
      updateNote(note.id, { text: textarea.value });
    };

    const onInput = (e: Event) => {
      e.stopPropagation();
      dirtyRef.current = true;

      if (!composingRef.current) {
        updateNote(note.id, { text: textarea.value });
        dirtyRef.current = false; // ✅ 영어 입력은 바로 저장 후 dirty 해제
      }
    };

    textarea.addEventListener("compositionstart", onCompositionStart);
    textarea.addEventListener("compositionend", onCompositionEnd);
    textarea.addEventListener("input", onInput);

    return () => {
      textarea.removeEventListener("pointerdown", stopBub);
      textarea.removeEventListener("compositionstart", onCompositionStart);
      textarea.removeEventListener("compositionend", onCompositionEnd);
      textarea.removeEventListener("input", onInput);
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [note.id, textarea, updateNote]);

  // 버튼
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

  return null;
};
