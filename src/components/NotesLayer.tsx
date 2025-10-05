import React from "react";
import { useNotes } from "../contexts/NotesContext";
import { Note3D } from "./Note3D";

const NotesLayer: React.FC = () => {
  const { notes } = useNotes();

  return (
    <>
      {notes.map((n) => (
        <Note3D key={n.id} note={n} />
      ))}
    </>
  );
};

export default NotesLayer;
