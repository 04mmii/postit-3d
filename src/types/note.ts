export type Note = {
  id: string;
  text: string;
  color: "yellow" | "pink" | "mint";
  position: { x: number; y: number; z: number };
  rotationZ: number;
  createdAt: number;
  done?: boolean;
};
