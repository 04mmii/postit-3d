import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { Note } from "../types/note";

type NotesCtx = {
  notes: Note[];
  addNote: (note: Note) => void;
  updateNote: (id: string, patch: Partial<Note>) => void;
  deleteNote: (id: string) => void;
};

const Ctx = createContext<NotesCtx | null>(null);

export const NotesProvider: React.FC<React.PropsWithChildren<{}>> = ({
  children,
}) => {
  const readyRef = useRef(false);
  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const raw = localStorage.getItem("notes");
      return raw ? (JSON.parse(raw) as Note[]) : [];
    } catch {
      return [];
    }
  });

  // 로컬스토리지 저장 (초기 로드 직후 저장 방지)
  useEffect(() => {
    if (!readyRef.current) {
      readyRef.current = true;
      return;
    }
    localStorage.setItem("notes", JSON.stringify(notes));
  }, [notes]);

  const addNote = useCallback((note: Note) => {
    // 순서/키는 유지, 뒤에만 추가
    setNotes((prev) => [...prev, { ...note }]);
  }, []);

  const updateNote = useCallback((id: string, patch: Partial<Note>) => {
    // ✱ 절대 정렬/필터/새 id 생성 금지
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)));
  }, []);

  const deleteNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return (
    <Ctx.Provider value={{ notes, addNote, updateNote, deleteNote }}>
      {children}
    </Ctx.Provider>
  );
};

export const useNotes = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useNotes must be used within NotesProvider");
  return v;
};
