import { useEffect, useMemo, useRef } from "react";
import { CSS3DObject } from "three/examples/jsm/renderers/CSS3DRenderer";
import type { Note } from "../types/note";
import { useThree } from "../contexts/ThreeContext";
import { useNotes } from "../contexts/NotesContext";

type Props = {
  note: Note;
  onObjectReady?: (obj: CSS3DObject) => void;
};

const colorOf = (c: any) =>
  c === "yellow"
    ? "#FFF9C4"
    : c === "pink"
      ? "#F8BBD0"
      : c === "mint"
        ? "#B2EBF2"
        : "#FFF9C4";

/** DOM 생성: 실제로 쓰는 것만 반환 (불필요한 반환 제거) */
const buildNoteElement = (note: Note) => {
  const wrap = document.createElement("div");
  Object.assign(wrap.style, {
    position: "relative",
    width: "220px",
    height: "220px",
    transform: "translateZ(0)",
    WebkitFontSmoothing: "antialiased",
    transformStyle: "preserve-3d",
    backfaceVisibility: "hidden",
    boxShadow: `
      0 4px 6px rgba(0,0,0,.1),
      0 10px 15px rgba(0,0,0,.15),
      0 18px 30px rgba(0,0,0,.2)
    `,
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
    webkitMaskImage: "linear-gradient(#0000 0 26px, #000 26px)",
    maskImage: "linear-gradient(#0000 0 26px, #000 26px)",
    zIndex: "0",
  });

  wrap.appendChild(shadow);
  wrap.appendChild(card);

  // 테이프
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

  // 텍스트
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

  // 푸터
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

  // 올바른 순서로 부착
  cardInner.appendChild(tape);
  cardInner.appendChild(textarea);
  cardInner.appendChild(footer);

  // 초기 그림자 보장
  requestAnimationFrame(() => {
    shadow.style.boxShadow = "0 18px 30px rgba(0,0,0,.2201)";
  });

  // ✅ 실제로 쓰는 것만 반환 (card, tape 등 불필요한 반환 제거)
  return { wrap, cardInner, textarea, delBtn, rotBtn };
};

export const Note3D = ({ note, onObjectReady }: Props) => {
  const { scene, renderer } = useThree();
  const { updateNote, removeNote } = useNotes();

  const composingRef = useRef(false);

  // ✅ 반환이 바뀌었으니 구조분해도 맞춰서 (TS 경고 제거)
  const { obj, cardInner, textarea, delBtn, rotBtn } = useMemo(() => {
    const { wrap, cardInner, textarea, delBtn, rotBtn } =
      buildNoteElement(note);
    const obj = new CSS3DObject(wrap);
    (obj as any).userData.noteId = note.id;
    return { obj, cardInner, textarea, delBtn, rotBtn };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // DOM은 1회만 생성

  // 씬 add/remove
  useEffect(() => {
    scene.add(obj);
    onObjectReady?.(obj);
    return () => {
      scene.remove(obj);
    };
  }, [obj, scene, onObjectReady]);

  // note 변화 반영 (조합 중엔 값 덮어쓰지 않음)
  useEffect(() => {
    if (!composingRef.current && textarea.value !== (note.text ?? "")) {
      textarea.value = note.text ?? "";
    }
    cardInner.style.background = colorOf(note.color); // ✅ card → cardInner
    obj.position.set(
      note.position?.x ?? 0,
      note.position?.y ?? 0,
      note.position?.z ?? 0
    );
    obj.rotation.set(0, 0, note.rotationZ ?? 0);
  }, [note, obj, cardInner, textarea]);

  // 입력 이벤트 (IME 완전 대응 + DragControls 충돌 차단)
  useEffect(() => {
    const stopBub = (e: Event) => e.stopPropagation();
    textarea.addEventListener("pointerdown", stopBub, { capture: true } as any);
    textarea.addEventListener(
      "pointermove",
      stopBub as any,
      { capture: true } as any
    ); // 드래그 충돌 방지
    textarea.addEventListener("mousedown", stopBub, { capture: true } as any);
    textarea.addEventListener("click", stopBub, { capture: true } as any);

    const onCompositionStart = () => {
      composingRef.current = true;
    };
    const onCompositionEnd = () => {
      composingRef.current = false;
      updateNote(note.id, { text: textarea.value }); // 조합 끝 저장
    };
    const onInput = (e: Event) => {
      e.stopPropagation();
      if (!composingRef.current) {
        updateNote(note.id, { text: textarea.value }); // 일반 입력 즉시 저장
      }
    };

    const onFocus = () => {
      // 렌더러가 포인터를 가로채지 않도록
      (renderer.domElement as HTMLElement).style.pointerEvents = "none";
    };
    const onBlur = () => {
      (renderer.domElement as HTMLElement).style.pointerEvents = "auto";
    };

    textarea.addEventListener("focus", onFocus);
    textarea.addEventListener("blur", onBlur);

    textarea.addEventListener("compositionstart", onCompositionStart);
    textarea.addEventListener("compositionend", onCompositionEnd);
    textarea.addEventListener("input", onInput);

    return () => {
      textarea.removeEventListener("pointerdown", stopBub as any);
      textarea.removeEventListener("pointermove", stopBub as any);
      textarea.removeEventListener("mousedown", stopBub as any);
      textarea.removeEventListener("click", stopBub as any);
      textarea.removeEventListener("keydown", stopBub as any);
      textarea.removeEventListener("compositionstart", onCompositionStart);
      textarea.removeEventListener("compositionend", onCompositionEnd);
      textarea.removeEventListener("input", onInput);
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
      const jitter = (Math.random() - 0.5) * 0.2; // ±0.1rad
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
