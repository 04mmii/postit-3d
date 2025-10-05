import {
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
  removeNote: (id: string) => void; // ← 통일
};

const Ctx = createContext<NotesCtx | null>(null);

export const NotesProvider: React.FC<React.PropsWithChildren<{}>> = ({
  children,
}) => {
  const didLoadRef = useRef(false);
  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const raw = localStorage.getItem("notes");
      return raw ? (JSON.parse(raw) as Note[]) : [];
    } catch {
      return [];
    }
  });

  // 저장 (최초 렌더 직후엔 저장 패스)
  useEffect(() => {
    if (!didLoadRef.current) {
      didLoadRef.current = true;
      return;
    }
    localStorage.setItem("notes", JSON.stringify(notes));
  }, [notes]);

  const addNote = useCallback((note: Note) => {
    setNotes((prev) => [...prev, { ...note }]);
  }, []);

  const updateNote = useCallback((id: string, patch: Partial<Note>) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)));
  }, []);

  const removeNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((n) => n.id === id));
  }, []);

  return (
    <Ctx.Provider value={{ notes, addNote, updateNote, removeNote }}>
      {children}
    </Ctx.Provider>
  );
};

export const useNotes = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useNotes must be used within NotesProvider");
  return v;
};
