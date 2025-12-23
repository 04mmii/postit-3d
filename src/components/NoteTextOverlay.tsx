import { useEffect, useRef, useState, useCallback } from "react";
import type { Note, NoteColor } from "../types/note";
import { useThree } from "../contexts/ThreeContext";
import { useNotes } from "../contexts/NotesContext";
import { COLORS_80 } from "../utils/colors";
import { projectToScreen } from "../utils/projectToScreen";
import { NoteActionButtons, CheckboxButton } from "./NoteActionButtons";

type Props = {
  note: Note;
  onClose: () => void;
};

const colorCycleOrder: NoteColor[] = ["yellow", "pink", "mint"];

/**
 * HTML 텍스트 입력 오버레이
 * 포스트잇 위에 투명하게 겹쳐서 직접 수정하는 것처럼 보임
 */
export const NoteTextOverlay: React.FC<Props> = ({ note, onClose }) => {
  const { camera, mountEl, getMeshById } = useThree();
  const { updateNote, removeNote } = useNotes();
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isComposing, setIsComposing] = useState(false);

  // 3D 위치 → 화면 위치 동기화
  const updatePosition = useCallback(() => {
    const mesh = getMeshById(note.id);
    if (!mesh || !mountEl) return;

    const screenPos = projectToScreen(mesh.position, camera, mountEl);
    setPosition({ x: screenPos.x, y: screenPos.y });
  }, [camera, mountEl, getMeshById, note.id]);

  // 위치 업데이트 (애니메이션 프레임)
  useEffect(() => {
    let raf: number;
    const loop = () => {
      updatePosition();
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [updatePosition]);

  // textarea에 포커스
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.focus();
      textarea.value = note.text ?? "";
      // 커서를 끝으로
      textarea.selectionStart = textarea.value.length;
      textarea.selectionEnd = textarea.value.length;
    }
  }, [note.text]);

  // 텍스트 변경 핸들러
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (!isComposing) {
        updateNote(note.id, { text: e.target.value });
      }
    },
    [note.id, updateNote, isComposing]
  );

  // IME 입력 지원
  const handleCompositionStart = () => setIsComposing(true);
  const handleCompositionEnd = (
    e: React.CompositionEvent<HTMLTextAreaElement>
  ) => {
    setIsComposing(false);
    updateNote(note.id, { text: (e.target as HTMLTextAreaElement).value });
  };

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  // ESC 키로 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // 완료 토글
  const handleToggleComplete = () => {
    updateNote(note.id, { completed: !note.completed });
  };

  // 색상 변경
  const handleColorChange = () => {
    const currentIndex = colorCycleOrder.indexOf(note.color);
    const nextIndex = (currentIndex + 1) % colorCycleOrder.length;
    updateNote(note.id, { color: colorCycleOrder[nextIndex] });
  };

  // 삭제
  const handleDelete = () => {
    removeNote(note.id);
    onClose();
  };

  // 포스트잇과 동일한 크기
  const noteWidth = 180;
  const noteHeight = 180;

  return (
    <div
      ref={containerRef}
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        position: "absolute",
        left: position.x - noteWidth / 2,
        top: position.y - noteHeight / 2,
        width: noteWidth,
        height: noteHeight,
        pointerEvents: "auto",
        zIndex: 1000,
      }}
    >
      {/* 포스트잇 컬러 배경 (80% 투명도) */}
      <div
        style={{
          width: "100%",
          height: "100%",
          background: COLORS_80[note.color],
          borderRadius: "4px",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        }}
      >
        {/* 상단 접착 부분 (클릭 가능 영역) */}
        <div style={{ height: "15%", flexShrink: 0 }} />

        {/* 체크박스 + 텍스트 입력 영역 */}
        <div
          style={{
            display: "flex",
            flex: 1,
            padding: "4px 10px",
            gap: "12px",
          }}
        >
          {/* 체크박스 */}
          <CheckboxButton
            checked={note.completed ?? false}
            onClick={handleToggleComplete}
          />

          {/* 텍스트 입력 - 투명 배경 */}
          <textarea
            ref={textareaRef}
            defaultValue={note.text ?? ""}
            onChange={handleChange}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            placeholder=""
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              resize: "none",
              background: "transparent",
              fontSize: "18px",
              fontWeight: "bold",
              lineHeight: "1.3",
              fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
              color: note.completed ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.85)",
              textDecoration: note.completed ? "line-through" : "none",
              caretColor: "#333",
            }}
          />
        </div>

        {/* 하단 액션 버튼 */}
        <NoteActionButtons
          onColorChange={handleColorChange}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
};
