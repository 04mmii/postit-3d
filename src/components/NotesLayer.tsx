import { Fragment } from "react";
import { useNotes } from "../contexts/NotesContext";
import { Note3D } from "./Note3D";

export function NotesLayer() {
  const { notes } = useNotes();

  return (
    <Fragment>
      {notes.map((n, i) => (
        <Note3D key={`note-${n.id ?? `${n.createdAt}-${i}`}`} note={n} />
      ))}
    </Fragment>
  );
}
