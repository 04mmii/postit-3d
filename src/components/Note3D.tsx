// src/components/Note3D.tsx
import { useRef, useEffect, useMemo } from "react";
import { CSS3DObject } from "three/examples/jsm/renderers/CSS3DRenderer";
import type { Note } from "../types/note";
import { useThree } from "../contexts/ThreeContext";
import { useNotes } from "../contexts/NotesContext";

type Props = {
  note: Note;
  onObjectReady?: (obj: CSS3DObject) => void;
};

/** 내부 카드 DOM 생성 (루트 transform은 건드리지 않음) */
const buildNoteElement = (note: Note) => {
  const wrap = document.createElement("div");
  // CSS3D 루트: transform은 CSS3DRenderer가 관리하므로 직접 셋하지 않음
  wrap.className = "note3d-root";
  wrap.style.position = "relative";
  wrap.style.width = "220px";
  wrap.style.height = "220px";
  wrap.style.userSelect = "none";
  wrap.style.transformStyle = "preserve-3d";
  wrap.style.backfaceVisibility = "hidden";

  // 카드(실제 스타일은 이쪽에만 적용)
  const card = document.createElement("div");
  card.dataset.role = "card";
  card.style.width = "100%";
  card.style.height = "100%";
  card.style.borderRadius = "10px";
  card.style.boxShadow = "0 12px 30px rgba(0,0,0,.25)";
  card.style.padding = "14px";
  card.style.display = "flex";
  card.style.flexDirection = "column";
  card.style.gap = "8px";
  card.style.background = colorOf(note.color);
  // 기울기 표현(선택): 루트가 아니라 카드에만
  card.style.rotate = `${note.rotationZ ?? 0}rad`;
  wrap.appendChild(card);

  // 테이프
  const tape = document.createElement("div");
  tape.style.alignSelf = "center";
  tape.style.width = "90px";
  tape.style.height = "20px";
  tape.style.background = "rgba(255,255,255,.7)";
  tape.style.boxShadow = "0 2px 8px rgba(0,0,0,.2)";
  tape.style.borderRadius = "4px";
  tape.style.marginTop = "-6px";
  card.appendChild(tape);

  // 텍스트 입력
  const textarea = document.createElement("textarea");
  textarea.value = note.text ?? "";
  textarea.placeholder = "할 일을 적어보세요…";
  textarea.style.flex = "1";
  textarea.style.border = "none";
  textarea.style.outline = "none";
  textarea.style.resize = "none";
  textarea.style.background = "transparent";
  textarea.style.fontSize = "16px";
  textarea.style.lineHeight = "1.4";
  textarea.style.fontFamily =
    "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";
  card.appendChild(textarea);

  // 푸터
  const footer = document.createElement("div");
  footer.style.display = "flex";
  footer.style.alignItems = "center";
  footer.style.justifyContent = "space-between";

  const date = document.createElement("span");
  date.textContent = new Date(
    note.createdAt ?? Date.now()
  ).toLocaleDateString();
  date.style.fontSize = "12px";
  date.style.opacity = ".7";
  footer.appendChild(date);

  card.appendChild(footer);

  return { wrap, card, textarea };
};

const colorOf = (c: any) =>
  c === "yellow"
    ? "#FFEB74"
    : c === "pink"
      ? "#FFC3D1"
      : c === "mint"
        ? "#BFF3E0"
        : "#FFEB74";

export const Note3D = ({ note, onObjectReady }: Props) => {
  const { scene } = useThree();
  const { updateNote } = useNotes();

  const composingRef = useRef(false);

  // 엘리먼트 + CSS3DObject를 한 번만 생성
  const { obj, card, textarea } = useMemo(() => {
    const { wrap, card, textarea } = buildNoteElement(note);
    const obj = new CSS3DObject(wrap);
    // 드래그 훅에서 식별용
    (obj as any).userData.noteId = note.id;
    return { obj, card, textarea };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 최초 1회 생성

  // 마운트/언마운트: 씬 추가/제거
  useEffect(() => {
    scene.add(obj);
    onObjectReady?.(obj);
    return () => {
      scene.remove(obj);
    };
  }, [obj, scene, onObjectReady]);

  // note 변경 시 DOM/오브젝트에 반영
  useEffect(() => {
    // 텍스트 반영
    if (textarea.value !== (note.text ?? "")) textarea.value = note.text ?? "";

    // 카드 색상/기울기 반영
    card.style.background = colorOf(note.color);
    card.style.rotate = `${note.rotationZ ?? 0}rad`;

    // 3D 좌표/회전 반영(루트 transform은 CSS3D 관리, 오브젝트 회전은 OK)
    if (note.position) {
      obj.position.set(
        note.position.x ?? 0,
        note.position.y ?? 0,
        note.position.z ?? 0
      );
    }
    obj.rotation.set(0, 0, note.rotationZ ?? 0);
  }, [note, obj, card, textarea]);

  // 입력 이벤트 → 즉시 저장(필요시 디바운스 가능)
  useEffect(() => {
    const onInput = (e: Event) => {
      e.stopPropagation();
      updateNote(note.id, { text: textarea.value });
    };
    textarea.addEventListener("input", onInput);
    return () => textarea.removeEventListener("input", onInput);
  }, [note.id, textarea, updateNote]);

  // note 변경 적용 (조합 중엔 값 강제 세팅 금지)
  useEffect(() => {
    if (!composingRef.current && textarea.value !== (note.text ?? "")) {
      textarea.value = note.text ?? "";
    }
    card.style.background = colorOf(note.color);
    card.style.rotate = `${note.rotationZ ?? 0}rad`;
    if (note.position)
      obj.position.set(
        note.position.x ?? 0,
        note.position.y ?? 0,
        note.position.z ?? 0
      );
    obj.rotation.set(0, 0, note.rotationZ ?? 0);
  }, [note, obj, card, textarea]);

  // ✅ IME 대응 + 드래그 충돌 방지
  useEffect(() => {
    const onCompositionStart = () => {
      composingRef.current = true;
    };
    const onCompositionEnd = () => {
      composingRef.current = false;
      updateNote(note.id, { text: textarea.value });
    };
    const onInput = (e: Event) => {
      e.stopPropagation(); // 드래그 로직과 충돌 방지
      if (!composingRef.current) {
        updateNote(note.id, { text: (e.target as HTMLTextAreaElement).value });
      }
    };
    const onKeyDown = (e: KeyboardEvent) => e.stopPropagation(); // 드래그/단축키와 충돌 방지

    textarea.addEventListener("compositionstart", onCompositionStart);
    textarea.addEventListener("compositionend", onCompositionEnd);
    textarea.addEventListener("input", onInput);
    textarea.addEventListener("keydown", onKeyDown);
    return () => {
      textarea.removeEventListener("compositionstart", onCompositionStart);
      textarea.removeEventListener("compositionend", onCompositionEnd);
      textarea.removeEventListener("input", onInput);
      textarea.removeEventListener("keydown", onKeyDown);
    };
  }, [note.id, textarea, updateNote]);

  return null; // CSS3DObject로만 렌더
};
