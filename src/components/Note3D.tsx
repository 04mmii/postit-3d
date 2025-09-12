import { useEffect, useRef } from "react";
import * as THREE from "three";
import { CSS3DObject } from "three/examples/jsm/renderers/CSS3DRenderer";
import type { Note } from "../types/note";
import { useThree } from "../contexts/ThreeContext";
import { useNotes } from "../contexts/NotesContext";
import { COLORS } from "../utils/colors";

export function Note3D({
  note,
  onObjectReady,
}: {
  note: Note;
  onObjectReady?: (obj: CSS3DObject) => void;
}) {
  const { scene } = useThree();
  const objRef = useRef<CSS3DObject | null>(null);
  const elRef = useRef<HTMLDivElement | null>(null);
  const { updateNote, deleteNote } = useNotes();

  useEffect(() => {
    const el = buildNoteElement(note, updateNote, deleteNote);
    elRef.current = el;

    const obj = new CSS3DObject(el);
    obj.position.set(note.position.x, note.position.y, note.position.z);
    obj.rotation.set(0, 0, note.rotationZ);
    (obj as any).userData.noteId = note.id;

    objRef.current = obj;
    scene.add(obj);
    onObjectReady?.(obj);

    return () => {
      if (objRef.current) scene.remove(objRef.current);
      objRef.current = null;
    };
  }, []);

  useEffect(() => {
    const obj = objRef.current;
    const el = elRef.current;
    if (!obj || !el) return;

    el.style.background = COLORS[note.color];
    const ta = el.querySelector("textarea") as HTMLTextAreaElement | null;
    if (ta && ta.value !== note.text) ta.value = note.text;

    const doneBtn = el.querySelector(
      "button[data-role=done]"
    ) as HTMLButtonElement | null;
    if (doneBtn) doneBtn.textContent = note.done ? "✅" : "⬜";

    obj.rotation.set(0, 0, note.rotationZ);
    obj.position.set(note.position.x, note.position.y, note.position.z);
  }, [note]);

  return null;
}

function buildNoteElement(
  note: Note,
  updateNote: (id: string, partial: Partial<Note>) => void,
  deleteNote: (id: string) => void
) {
  const wrap = document.createElement("div");
  wrap.className = "relative w-[220px] h-[220px] select-none";
  wrap.style.transformStyle = "preserve-3d";
  wrap.style.backfaceVisibility = "hidden";

  // 내부 카드 래퍼 생성 (색/그림자/레이아웃)
  const card = document.createElement("div");
  card.dataset.role = "card";
  card.className = [
    "w-full",
    "h-full",
    "rounded-card",
    "shadow-card",
    "p-3",
    "flex",
    "flex-col",
    "gap-2",
  ].join(" ");
  const colorClass: Record<Note["color"], string> = {
    yellow: "bg-postit-yellow",
    pink: "bg-postit-pink",
    mint: "bg-postit-mint",
  };
  card.classList.add(colorClass[note.color]);
  wrap.appendChild(card);

  const tape = document.createElement("div");
  tape.className =
    "self-center w-[90px] h-5 bg-white/70 shadow-md rounded mt-[-6px]";
  card.appendChild(tape);

  const textarea = document.createElement("textarea");
  textarea.value = note.text;
  textarea.placeholder = "할 일을 적어보세요…";
  textarea.className =
    "flex-1 border-0 outline-none resize-none bg-transparent text-[16px] leading-[1.4]";
  card.appendChild(textarea);
  textarea.addEventListener("input", (e) => {
    const text = (e.target as HTMLTextAreaElement).value;
    updateNote(note.id, { text });
  });
  textarea.addEventListener("dblclick", () => textarea.focus());

  const footer = document.createElement("div");
  footer.className = "flex items-center justify-between";

  const date = document.createElement("span");
  date.textContent = new Date(note.createdAt).toLocaleDateString();
  date.className = "text-[12px] opacity-70";

  const right = document.createElement("div");
  right.className = "flex gap-1.5";

  const doneBtn = document.createElement("button");
  doneBtn.dataset.role = "done";
  doneBtn.textContent = note.done ? "✅" : "⬜";
  doneBtn.title = "완료 토글";
  doneBtn.className =
    "w-7 h-7 rounded bg-black text-white shadow cursor-pointer";
  doneBtn.addEventListener("click", () =>
    updateNote(note.id, { done: !note.done })
  );

  const rotateBtn = document.createElement("button");
  rotateBtn.textContent = "↻";
  rotateBtn.title = "살짝 회전";
  rotateBtn.className =
    "w-7 h-7 rounded bg-black text-white shadow cursor-pointer";
  rotateBtn.addEventListener("click", () =>
    updateNote(note.id, {
      rotationZ: THREE.MathUtils.degToRad(Math.random() * 12 - 6),
    })
  );

  const delBtn = document.createElement("button");
  delBtn.textContent = "🗑️";
  delBtn.title = "삭제";
  delBtn.className =
    "w-7 h-7 rounded bg-black text-white shadow cursor-pointer";
  delBtn.addEventListener("click", () => deleteNote(note.id));

  right.appendChild(doneBtn);
  right.appendChild(rotateBtn);
  right.appendChild(delBtn);

  footer.appendChild(date);
  footer.appendChild(right);

  wrap.appendChild(textarea);
  wrap.appendChild(footer);

  return wrap;
}

function styleIconButton(btn: HTMLButtonElement) {
  btn.style.border = "none";
  btn.style.background = "#000";
  btn.style.color = "#fff";
  btn.style.width = "28px";
  btn.style.height = "28px";
  btn.style.borderRadius = "8px";
  btn.style.cursor = "pointer";
  btn.style.boxShadow = "0 4px 10px rgba(0,0,0,.2)";
}
