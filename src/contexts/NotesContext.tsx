import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Note } from "../types/note";

/** 안전한 ID 생성기 */
function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return (crypto as any).randomUUID();
  }
  return `n_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** 로드/추가 시 노트를 표준 형태로 보정 */
function normalize(note: Partial<Note>): Note {
  return {
    id: note.id || makeId(),
    text: note.text ?? "",
    color: (note.color as Note["color"]) ?? "yellow",
    rotationZ: note.rotationZ ?? 0,
    position: note.position ?? { x: 0, y: 0, z: 0 },
    createdAt: note.createdAt ?? Date.now(),
  };
}

/** 중복 ID가 있으면 새 ID로 바꿔서 충돌 제거 */
function dedupeIds(notes: Note[]): Note[] {
  const seen = new Set<string>();
  return notes.map((n) => {
    let id = n.id;
    if (!id || seen.has(id)) id = makeId();
    seen.add(id);
    return { ...n, id };
  });
}

type NotesCtx = {
  notes: Note[];
  addNote: (partial?: Partial<Note>) => void;
  updateNote: (id: string, patch: Partial<Note>) => void;
  removeNote: (id: string) => void;
  /** 기존 코드 호환용 별칭 */
  deleteNote: (id: string) => void;
};

const Ctx = createContext<NotesCtx | null>(null);

export const NotesProvider: React.FC<React.PropsWithChildren<{}>> = ({
  children,
}) => {
  const readyRef = useRef(false);

  // 초기 로드
  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const raw = localStorage.getItem("notes");
      const arr = raw ? (JSON.parse(raw) as any[]) : [];
      const normalized = Array.isArray(arr) ? arr.map(normalize) : [];
      return dedupeIds(normalized);
    } catch {
      return [];
    }
  });

  // 변경 → 저장 (초기 1회 저장은 skip)
  useEffect(() => {
    if (!readyRef.current) {
      readyRef.current = true;
      return;
    }
    try {
      localStorage.setItem("notes", JSON.stringify(notes));
    } catch {
      // 저장 실패는 조용히 무시 (용량/권한 문제 등)
    }
  }, [notes]);

  const addNote = useCallback((partial?: Partial<Note>) => {
    setNotes((prev) => [...prev, normalize(partial ?? {})]);
  }, []);

  const updateNote = useCallback((id: string, patch: Partial<Note>) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? normalize({ ...n, ...patch }) : n))
    );
  }, []);

  const removeNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // 기존 코드 호환: deleteNote 별칭 제공
  const deleteNote = removeNote;

  const value = useMemo(
    () => ({ notes, addNote, updateNote, removeNote, deleteNote }),
    [notes, addNote, updateNote, removeNote]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useNotes = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useNotes must be used within NotesProvider");
  return v;
};
