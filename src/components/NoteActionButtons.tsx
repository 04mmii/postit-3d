import React from "react";
import { COLORS } from "../utils/colors";

type Props = {
  onColorChange: () => void;
  onDelete: () => void;
};

/**
 * 노트 편집 시 하단에 표시되는 액션 버튼들
 * - 색상 변경
 * - 삭제
 */
export const NoteActionButtons: React.FC<Props> = ({
  onColorChange,
  onDelete,
}) => {
  return (
    <div
      style={{
        position: "absolute",
        bottom: "-40px",
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        gap: "8px",
        background: "rgba(255,255,255,0.95)",
        padding: "6px 12px",
        borderRadius: "20px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
      }}
    >
      {/* 색상 변경 버튼 */}
      <ColorChangeButton onClick={onColorChange} />

      {/* 삭제 버튼 */}
      <DeleteButton onClick={onDelete} />
    </div>
  );
};

/**
 * 색상 변경 버튼
 */
const ColorChangeButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    title="색상 변경"
    style={{
      width: "28px",
      height: "28px",
      borderRadius: "50%",
      border: "1px solid rgba(0,0,0,0.15)",
      background: `linear-gradient(135deg, ${COLORS.yellow} 0%, ${COLORS.pink} 50%, ${COLORS.mint} 100%)`,
      cursor: "pointer",
      transition: "transform 0.15s ease",
    }}
    onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
    onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
  />
);

/**
 * 삭제 버튼
 */
const DeleteButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    title="삭제"
    style={{
      width: "28px",
      height: "28px",
      borderRadius: "50%",
      border: "1px solid rgba(0,0,0,0.15)",
      background: "rgba(255,255,255,0.9)",
      cursor: "pointer",
      fontSize: "16px",
      color: "#d32f2f",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "all 0.15s ease",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = "scale(1.1)";
      e.currentTarget.style.background = "#ffebee";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = "scale(1)";
      e.currentTarget.style.background = "rgba(255,255,255,0.9)";
    }}
  >
    ×
  </button>
);

/**
 * 체크박스 버튼
 */
type CheckboxButtonProps = {
  checked: boolean;
  onClick: () => void;
};

export const CheckboxButton: React.FC<CheckboxButtonProps> = ({
  checked,
  onClick,
}) => (
  <button
    onClick={onClick}
    title={checked ? "완료 취소" : "완료 표시"}
    style={{
      width: "28px",
      height: "28px",
      minWidth: "28px",
      borderRadius: "6px",
      border: checked ? "2px solid #388E3C" : "2px solid rgba(0,0,0,0.25)",
      background: checked ? "#4CAF50" : "rgba(255,255,255,0.95)",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "18px",
      color: "#fff",
      fontWeight: "bold",
      padding: 0,
      marginTop: "2px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
      transition: "all 0.15s ease",
    }}
  >
    {checked ? "✓" : ""}
  </button>
);
