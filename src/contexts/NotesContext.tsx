import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { Note } from "../types/note";

const LS_KEY = "postit-notes-v1";

const loadNotes = (): Note[] => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveNotes = (notes: Note[]) => {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(notes));
  } catch {
    /* ignore */
  }
};

export type NotesCtx = {
  notes: Note[];
  addNote: (partial?: Partial<Note>) => void;
  updateNote: (id: string, patch: Partial<Note>) => void;
  removeNote: (id: string) => void; // ← 이름 통일
};

const Ctx = createContext<NotesCtx | null>(null);

export const useNotes = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useNotes must be used inside <NotesProvider>");
  return v;
};

// utils
const uid = () => Math.random().toString(36).slice(2, 9);
const rand = (min: number, max: number) => Math.random() * (max - min) + min;
const degToRad = (d: number) => (d * Math.PI) / 180;

export const NotesProvider = ({ children }: { children: ReactNode }) => {
  const [notes, setNotes] = useState<Note[]>(() => loadNotes());

  // setNotes + 저장을 한 번에
  const persist = useCallback(
    (updater: (prev: Note[]) => Note[]) =>
      setNotes((prev) => {
        const next = updater(prev);
        saveNotes(next);
        return next;
      }),
    []
  );

  const addNote = useCallback(
    (partial?: Partial<Note>) => {
      const note: Note = {
        id: uid(),
        text: partial?.text ?? "",
        color: (partial?.color as Note["color"]) ?? "yellow",
        position: partial?.position ?? {
          x: rand(-400, 400),
          y: rand(-200, 200),
          z: 0,
        },
        rotationZ: partial?.rotationZ ?? degToRad(rand(-6, 6)),
        createdAt: Date.now(),
        done: false,
      };
      persist((prev) => [...prev, note]);
    },
    [persist]
  );

  const updateNote = useCallback(
    (id: string, patch: Partial<Note>) => {
      persist((prev) =>
        prev.map((n) => (n.id === id ? { ...n, ...patch } : n))
      );
    },
    [persist]
  );

  const removeNote = useCallback(
    (id: string) => {
      persist((prev) => prev.filter((n) => n.id !== id));
    },
    [persist]
  );

  const value = useMemo(
    () => ({ notes, addNote, updateNote, removeNote }),
    [notes, addNote, updateNote, removeNote]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};
