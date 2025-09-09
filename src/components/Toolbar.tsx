import React from "react";
import { useNotes } from "../contexts/NotesContext";
import { COLORS } from "../utils/colors";

export function Toolbar() {
  const { addNote } = useNotes();
  return (
    <div
      style={{
        position: "absolute",
        top: 12,
        left: 12,
        right: 12,
        display: "flex",
        gap: 8,
        alignItems: "center",
        justifyContent: "space-between",
        fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
        pointerEvents: "auto",
      }}
    >
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => addNote()} style={btnStyle}>
          + 새 메모
        </button>
        <button
          onClick={() => addNote({ color: "yellow" })}
          style={{ ...btnStyle, background: COLORS.yellow, color: "#111" }}
        >
          노랑
        </button>
        <button
          onClick={() => addNote({ color: "pink" })}
          style={{ ...btnStyle, background: COLORS.pink, color: "#111" }}
        >
          핑크
        </button>
        <button
          onClick={() => addNote({ color: "mint" })}
          style={{ ...btnStyle, background: COLORS.mint, color: "#111" }}
        >
          민트
        </button>
      </div>
      <div style={{ opacity: 0.8, fontSize: 12 }}>
        Drag: 포스트잇 이동 • ↻: 랜덤 기울기 • 자동저장
      </div>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: "10px 14px",
  background: "#111",
  color: "#fff",
  border: "none",
  borderRadius: 12,
  cursor: "pointer",
  boxShadow: "0 6px 16px rgba(0,0,0,.15)",
};
