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
    ? "#FFEB74"
    : c === "pink"
      ? "#FFC3D1"
      : c === "mint"
        ? "#BFF3E0"
        : "#FFEB74";

/** 내부 카드 DOM 생성 (루트 transform은 건드리지 않음) */
const buildNoteElement = (note: Note) => {
  const wrap = document.createElement("div");
  wrap.className = "note3d-root";
  Object.assign(wrap.style, {
    position: "relative",
    width: "220px",
    height: "220px",
    transform: "translateZ(0)", // ✅ 레이어 승격
    WebkitFontSmoothing: "antialiased", // 가독성(선택)
    willChange: "transform", // 힌트(선택)
    transformStyle: "preserve-3d",
    backfaceVisibility: "hidden",
    filter: "drop-shadow(0 18px 30px rgba(0,0,0,.22))",
  });

  // 카드
  const card = document.createElement("div");
  card.dataset.role = "card";
  Object.assign(card.style, {
    width: "100%",
    height: "100%",
    borderRadius: "10px 0 0 0",
    padding: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    background: colorOf(note.color),
    backgroundImage:
      "linear-gradient(180deg, rgba(255,255,255,.45), rgba(255,255,255,0))," +
      "radial-gradient(rgba(0,0,0,0.035) 1px, transparent 1px)",
    backgroundSize: "auto, 3px 3px",
    backgroundBlendMode: "multiply",
    boxShadow:
      "inset 0 1px 0 rgba(0,0,0,.06), inset 0 -8px 20px rgba(0,0,0,.06), 0 18px 30px rgba(0,0,0,.22)",
    filter: "contrast(1.01) saturate(.98)",
  });
  wrap.appendChild(card);

  // 테이프
  const tape = document.createElement("div");
  Object.assign(tape.style, {
    alignSelf: "center",
    width: "90px",
    height: "20px",
    background:
      "linear-gradient(180deg, rgba(255,255,255,.85), rgba(255,255,255,.65))",
    boxShadow: "0 2px 8px rgba(0,0,0,.2)",
    borderRadius: "4px 0 0 0",
    marginTop: "-6px",
    /* 반투명+multiply로 종이 위에 붙은 느낌 */
    mixBlendMode: "multiply",
    opacity: ".9",
    transform: "rotate(" + ((Math.random() - 0.5) * 4).toFixed(2) + "deg)",
  });
  card.appendChild(tape);

  // 텍스트 입력
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
  card.appendChild(textarea);

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

  // 우측 액션
  const right = document.createElement("div");
  Object.assign(right.style, { display: "flex", gap: "6px" });

  const mkBtn = (label: string, title: string) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = label;
    btn.title = title;
    btn.dataset.nodrag = "1"; // 드래그 훅에서 무시할 표식
    Object.assign(btn.style, {
      width: "28px",
      height: "28px",
      borderRadius: "6px",
      background: "#000",
      color: "#fff",
      cursor: "pointer",
      border: "none",
      boxShadow: "0 2px 6px rgba(0,0,0,.2)",
    });
    return btn;
  };

  const rotBtn = mkBtn("↻", "살짝 기울이기");
  const delBtn = mkBtn("🗑️", "삭제");

  right.appendChild(rotBtn);
  right.appendChild(delBtn);
  footer.appendChild(right);
  card.appendChild(footer); // 한 번만 append

  return { wrap, card, textarea, delBtn, rotBtn };
};

export const Note3D = ({ note, onObjectReady }: Props) => {
  const { scene } = useThree();
  const { updateNote, removeNote } = useNotes();

  // IME(한글) 조합 플래그 & 저장 제어
  const composingRef = useRef(false);
  const dirtyRef = useRef(false);
  const saveTimer = useRef<number | null>(null);

  // 한 번만 생성
  const { obj, card, textarea, delBtn, rotBtn } = useMemo(() => {
    const { wrap, card, textarea, delBtn, rotBtn } = buildNoteElement(note);
    const obj = new CSS3DObject(wrap);
    (obj as any).userData.noteId = note.id;
    return { obj, card, textarea, delBtn, rotBtn };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 최초 1회

  // 씬 add/remove
  useEffect(() => {
    scene.add(obj);
    onObjectReady?.(obj);
    return () => {
      scene.remove(obj);
    };
  }, [obj, scene, onObjectReady]);

  // note 변화 반영 (조합 중엔 textarea 값 강제 덮어쓰기 금지)
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

  // 입력/조합/포커스 이벤트 (조합 끝 또는 blur 때만 저장)
  useEffect(() => {
    const stopBub = (e: Event) => e.stopPropagation();
    textarea.addEventListener("pointerdown", stopBub, { capture: true });
    textarea.addEventListener("mousedown", stopBub, { capture: true });
    textarea.addEventListener("click", stopBub, { capture: true });

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
      obj.rotation.set(0, 0, 0);
    };

    const onCompositionEnd = () => {
      composingRef.current = false;
      flush(); // 조합 종료 시 한 번 저장
      obj.rotation.set(0, 0, rotationRef.current);
    };

    const onInput = (e: Event) => {
      e.stopPropagation();
      dirtyRef.current = true; // 내용 변경만 표시, 저장은 하지 않음
    };

    // const onBlur = () => {
    //   flush();
    //   obj.rotation.set(0, 0, rotationRef.current);
    // };

    return () => {
      textarea.removeEventListener("pointerdown", stopBub, {
        capture: true,
      } as any);
      textarea.removeEventListener("mousedown", stopBub, {
        capture: true,
      } as any);
      textarea.removeEventListener("click", stopBub, { capture: true } as any);
      textarea.removeEventListener("compositionstart", onCompositionStart);
      textarea.removeEventListener("compositionend", onCompositionEnd);
      textarea.removeEventListener("input", onInput);
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [note.id, textarea, updateNote]);

  // 버튼 핸들러
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

  useEffect(() => {
    const el = (obj.element as HTMLElement) || null;
    if (!el) return;

    const onEnter = () => {
      // 조합 중/포커스 중이면 연출 생략 (IME 안정)
      if (composingRef.current || document.activeElement === textarea) return;
      card.style.transition = "transform .15s ease";
      card.style.transform = "translateZ(0) scale(1.02)";
    };
    const onLeave = () => {
      card.style.transform = "";
    };

    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [obj, card, textarea]);

  return null; // CSS3DObject로만 렌더
};
