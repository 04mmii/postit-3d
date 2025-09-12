import { useEffect, useRef } from "react";
import { CSS3DObject } from "three/examples/jsm/renderers/CSS3DRenderer";
import { useThree } from "../contexts/ThreeContext";

export function Board() {
  const { scene } = useThree();
  const boardRef = useRef<CSS3DObject | null>(null);

  useEffect(() => {
    const el = document.createElement("div");
    el.className = [
      "relative",
      "w-[1200px]",
      "h-[700px]",
      "rounded-board",
      "border-[8px]",
      "border-postit-frame",
      "shadow-board",
      "bg-postit-cork",
      "bg-[radial-gradient(rgba(0,0,0,.05)_1px,transparent_1px)]",
      "[background-size:10px_10px]",
    ].join(" ");

    const guides = document.createElement("div");
    guides.style.position = "absolute";
    guides.style.inset = "20px";
    guides.style.display = "grid";
    guides.style.gridTemplateColumns = "1fr 1fr 1fr";
    guides.style.gap = "20px";
    ["오늘", "이번주", "완료"].forEach((title) => {
      const col = document.createElement("div");
      col.style.border = "2px dashed rgba(0,0,0,.15)";
      col.style.borderRadius = "16px";
      col.style.position = "relative";
      const label = document.createElement("div");
      label.textContent = title;
      label.style.position = "absolute";
      label.style.top = "-14px";
      label.style.left = "14px";
      label.style.padding = "2px 8px";
      label.style.borderRadius = "8px";
      label.style.fontSize = "12px";
      label.style.background = "rgba(255,255,255,.8)";
      label.style.boxShadow = "0 2px 6px rgba(0,0,0,.1)";
      col.appendChild(label);
      guides.appendChild(col);
    });
    el.appendChild(guides);

    const obj = new CSS3DObject(el);
    obj.position.set(0, 0, -50);
    boardRef.current = obj;
    scene.add(obj);

    return () => {
      if (boardRef.current) scene.remove(boardRef.current);
      boardRef.current = null;
    };
  }, [scene]);

  return null;
}
