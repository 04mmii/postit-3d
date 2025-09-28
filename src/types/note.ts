export type NoteColor = "yellow" | "pink" | "mint";

export type Note = {
  id: string;
  text?: string;
  color: NoteColor;
  createdAt?: number;
  position?: { x: number; y: number; z: number };
  rotationZ?: number;
};
