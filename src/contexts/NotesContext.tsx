import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import * as THREE from "three";
import type { Note } from "../types/note";

const LS_KEY = "postit-notes-v1";
const loadNotes = (): Note[] => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};
const saveNotes = (notes: Note[]) => {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(notes));
  } catch {}
};

export type NotesCtx = {
  notes: Note[];
  addNote: (partial?: Partial<Note>) => void;
  updateNote: (id: string, patch: Partial<Note>) => void;
  deleteNote: (id: string) => void;
};

const Ctx = createContext<NotesCtx | null>(null);
export const useNotes = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useNotes inside provider");
  return v;
};

const uid = () => Math.random().toString(36).slice(2, 9);
const rand = (min: number, max: number) => Math.random() * (max - min) + min;

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const [notes, setNotes] = useState<Note[]>(() => loadNotes());
  const persist = useCallback(
    (up: (prev: Note[]) => Note[]) =>
      setNotes((p) => {
        const n = up(p);
        saveNotes(n);
        return n;
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
        rotationZ: partial?.rotationZ ?? THREE.MathUtils.degToRad(rand(-6, 6)),
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

  const deleteNote = useCallback(
    (id: string) => {
      persist((prev) => prev.filter((n) => n.id !== id));
    },
    [persist]
  );

  const value = useMemo(
    () => ({ notes, addNote, updateNote, deleteNote }),
    [notes, addNote, updateNote, deleteNote]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
