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
  wrap.style.width = "220px";
  wrap.style.height = "220px";
  wrap.style.background = COLORS[note.color];
  wrap.style.borderRadius = "10px";
  wrap.style.boxShadow = "0 12px 30px rgba(0,0,0,.25)";
  wrap.style.padding = "14px";
  wrap.style.display = "flex";
  wrap.style.flexDirection = "column";
  wrap.style.gap = "8px";
  wrap.style.userSelect = "none";

  const tape = document.createElement("div");
  tape.style.alignSelf = "center";
  tape.style.width = "90px";
  tape.style.height = "20px";
  tape.style.background = "rgba(255,255,255,.7)";
  tape.style.boxShadow = "0 2px 8px rgba(0,0,0,.2)";
  tape.style.borderRadius = "4px";
  tape.style.marginTop = "-6px";
  wrap.appendChild(tape);

  const textarea = document.createElement("textarea");
  textarea.value = note.text;
  textarea.placeholder = "할 일을 적어보세요…";
  textarea.style.flex = "1";
  textarea.style.border = "none";
  textarea.style.outline = "none";
  textarea.style.resize = "none";
  textarea.style.background = "transparent";
  textarea.style.fontSize = "16px";
  textarea.style.lineHeight = "1.4";
  textarea.style.fontFamily =
    "'Pretendard', ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";
  textarea.addEventListener("input", (e) => {
    const text = (e.target as HTMLTextAreaElement).value;
    updateNote(note.id, { text });
  });
  textarea.addEventListener("dblclick", () => textarea.focus());

  const footer = document.createElement("div");
  footer.style.display = "flex";
  footer.style.justifyContent = "space-between";
  footer.style.alignItems = "center";

  const date = document.createElement("span");
  date.textContent = new Date(note.createdAt).toLocaleDateString();
  date.style.fontSize = "12px";
  date.style.opacity = ".7";

  const right = document.createElement("div");
  right.style.display = "flex";
  right.style.gap = "6px";

  const doneBtn = document.createElement("button");
  doneBtn.dataset.role = "done";
  doneBtn.textContent = note.done ? "✅" : "⬜";
  doneBtn.title = "완료 토글";
  styleIconButton(doneBtn);
  doneBtn.addEventListener("click", () =>
    updateNote(note.id, { done: !note.done })
  );

  const rotateBtn = document.createElement("button");
  rotateBtn.textContent = "↻";
  rotateBtn.title = "살짝 회전";
  styleIconButton(rotateBtn);
  rotateBtn.addEventListener("click", () =>
    updateNote(note.id, {
      rotationZ: THREE.MathUtils.degToRad(Math.random() * 12 - 6),
    })
  );

  const delBtn = document.createElement("button");
  delBtn.textContent = "🗑️";
  delBtn.title = "삭제";
  styleIconButton(delBtn);
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
