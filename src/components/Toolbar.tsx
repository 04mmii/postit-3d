import { useNotes } from "../contexts/NotesContext";

export function Toolbar() {
  const { addNote } = useNotes();
  return (
    <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-auto font-sans">
      <div className="flex gap-2">
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => addNote()}
            className="px-3 py-2 rounded-xl shadow bg-black text-white"
          >
            + 새 메모
          </button>
          <button
            onClick={() => addNote({ color: "yellow" })}
            className="px-3 py-2 rounded-xl shadow bg-postit-yellow text-black"
          >
            노랑
          </button>
          <button
            onClick={() => addNote({ color: "pink" })}
            className="px-3 py-2 rounded-xl shadow bg-postit-pink text-black"
          >
            핑크
          </button>
          <button
            onClick={() => addNote({ color: "mint" })}
            className="px-3 py-2 rounded-xl shadow bg-postit-mint text-black"
          >
            민트
          </button>
        </div>
      </div>
      <div className="opacity-80 text-xs">
        Drag: 포스트잇 이동 • ↻: 랜덤 기울기 • 자동저장
      </div>
    </div>
  );
}
