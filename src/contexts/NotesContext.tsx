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
  addNote: (init?: Partial<Note>) => void;
  updateNote: (id: string, patch: Partial<Note>) => void;
  removeNote: (id: string) => void;
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

  useEffect(() => {
    if (!readyRef.current) {
      readyRef.current = true;
      return;
    }
    localStorage.setItem("notes", JSON.stringify(notes));
  }, [notes]);

  const addNote = useCallback((init?: Partial<Note>) => {
    const id = crypto.randomUUID();
    const now = Date.now();
    const jitter = () => Math.round((Math.random() - 0.5) * 120);

    const n: Note = {
      id,
      text: "",
      color: init?.color ?? "yellow",
      createdAt: now,
      position: {
        x: init?.position?.x ?? jitter(),
        y: init?.position?.y ?? jitter(),
        z: 0,
      },
      rotationZ: init?.rotationZ ?? (Math.random() - 0.5) * 0.08,
    };
    setNotes((prev) => [...prev, n]);
  }, []);

  const updateNote = useCallback((id: string, patch: Partial<Note>) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)));
  }, []);

  const removeNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
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
