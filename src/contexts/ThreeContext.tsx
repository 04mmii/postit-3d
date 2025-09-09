import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import type { Scene, PerspectiveCamera } from "three";
import { CSS3DRenderer } from "three/examples/jsm/renderers/CSS3DRenderer";

export type ThreeCtx = {
  scene: Scene;
  camera: PerspectiveCamera;
  renderer: CSS3DRenderer;
  mountEl: HTMLDivElement | null;
};

const ThreeContext = createContext<ThreeCtx | null>(null);
export const useThree = () => {
  const ctx = useContext(ThreeContext);
  if (!ctx) throw new Error("useThree must be used inside <ThreeRoot>");
  return ctx;
};

export function ThreeRoot({ children }: { children: React.ReactNode }) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [ctx, setCtx] = useState<ThreeCtx | null>(null);

  useEffect(() => {
    const mount = mountRef.current!;
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      45,
      mount.clientWidth / mount.clientHeight,
      1,
      5000
    );
    camera.position.set(0, 0, 1000);

    const renderer = new CSS3DRenderer();
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.inset = "0";
    renderer.domElement.style.pointerEvents = "auto";
    mount.appendChild(renderer.domElement);

    setCtx({ scene, camera, renderer, mountEl: mount });

    let raf = 0;
    const loop = () => {
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    loop();

    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      renderer.domElement.remove();
      scene.clear();
      setCtx(null);
    };
  }, []);

  return (
    <div ref={mountRef} style={{ position: "absolute", inset: 0 }}>
      {ctx && (
        <ThreeContext.Provider value={ctx}>{children}</ThreeContext.Provider>
      )}
    </div>
  );
}
