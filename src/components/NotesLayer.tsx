import { useState, useCallback } from "react";
import { useNotes } from "../contexts/NotesContext";
import Note3DMesh from "./Note3DMesh";
import { NoteTextOverlay } from "./NoteTextOverlay";

/**
 * 노트 레이어
 * WebGL Mesh 렌더링 + HTML 텍스트 입력 오버레이
 */
const NotesLayer: React.FC = () => {
  const { notes } = useNotes();
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  const handleSelect = useCallback((id: string | null) => {
    setSelectedNoteId(id);
  }, []);

  const handleCloseOverlay = useCallback(() => {
    setSelectedNoteId(null);
  }, []);

  const selectedNote = notes.find((n) => n.id === selectedNoteId);

  return (
    <>
      {/* WebGL Mesh 렌더링 */}
      {notes.map((n) => (
        <Note3DMesh
          key={n.id}
          note={n}
          onSelect={handleSelect}
          isSelected={n.id === selectedNoteId}
        />
      ))}

      {/* HTML 텍스트 입력 오버레이 (선택된 노트만) */}
      {selectedNote && (
        <NoteTextOverlay note={selectedNote} onClose={handleCloseOverlay} />
      )}
    </>
  );
};

export default NotesLayer;
