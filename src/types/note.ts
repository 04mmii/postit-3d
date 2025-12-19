export type NoteColor = "yellow" | "pink" | "mint";

export type Note = {
  id: string;
  text?: string;
  color: NoteColor;
  createdAt?: number;
  position?: { x: number; y: number; z: number };
  rotationZ?: number;
  completed?: boolean;
};

/** 새 메모 기본값 생성기: addNote에서 이 함수로 항상 완전한 Note를 만든다 */
export const createNote = (init: Partial<Note> = {}): Note => {
  // 랜덤 시작 위치(대충 화면 중앙 근처), 약간의 기울기
  const rand = (r: number) => (Math.random() - 0.5) * r;
  return {
    id: init.id ?? crypto.randomUUID(),
    text: init.text ?? "",
    color: init.color ?? "yellow",
    createdAt: init.createdAt ?? Date.now(),
    position: init.position ?? { x: rand(800), y: rand(500), z: 0 },
    rotationZ: init.rotationZ ?? rand(0.3),
  };
};
