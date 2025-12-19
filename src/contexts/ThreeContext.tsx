import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import * as THREE from "three";

export type ThreeCtx = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  raycaster: THREE.Raycaster;
  mountEl: HTMLDivElement | null;
  getMouseNDC: (e: MouseEvent | PointerEvent) => THREE.Vector2;
  registerMesh: (mesh: THREE.Mesh, id: string) => void;
  unregisterMesh: (id: string) => void;
  getMeshById: (id: string) => THREE.Mesh | undefined;
  getAllMeshes: () => THREE.Mesh[];
};

const Ctx = createContext<ThreeCtx | null>(null);

export const useThree = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useThree must be used inside <ThreeRoot>");
  return v;
};

export const ThreeRoot = ({ children }: { children: React.ReactNode }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const meshMapRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const [ctx, setCtx] = useState<ThreeCtx | null>(null);

  // Mesh 등록/해제 함수들
  const registerMesh = useCallback((mesh: THREE.Mesh, id: string) => {
    meshMapRef.current.set(id, mesh);
  }, []);

  const unregisterMesh = useCallback((id: string) => {
    meshMapRef.current.delete(id);
  }, []);

  const getMeshById = useCallback((id: string) => {
    return meshMapRef.current.get(id);
  }, []);

  const getAllMeshes = useCallback(() => {
    return Array.from(meshMapRef.current.values());
  }, []);

  useEffect(() => {
    const mount = mountRef.current!;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf7f4ed);

    // === 카메라 설정 ===
    const camera = new THREE.PerspectiveCamera(
      45,
      mount.clientWidth / mount.clientHeight,
      1,
      5000
    );
    camera.position.set(0, 0, 1000);

    // === Raycaster ===
    const raycaster = new THREE.Raycaster();

    // === 마우스 NDC 변환 ===
    const getMouseNDC = (e: MouseEvent | PointerEvent): THREE.Vector2 => {
      const rect = mount.getBoundingClientRect();
      return new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
    };

    // === 조명 설정 ===
    // 환경광 (전체적으로 부드럽게)
    const ambientLight = new THREE.AmbientLight(0xfff8e7, 0.6);
    scene.add(ambientLight);

    // 메인 조명 (좌상단, 그림자 생성)
    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(-300, 400, 600);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.set(2048, 2048);
    mainLight.shadow.camera.near = 100;
    mainLight.shadow.camera.far = 2000;
    mainLight.shadow.camera.left = -800;
    mainLight.shadow.camera.right = 800;
    mainLight.shadow.camera.top = 600;
    mainLight.shadow.camera.bottom = -600;
    mainLight.shadow.bias = -0.001;
    mainLight.shadow.normalBias = 0.02;
    scene.add(mainLight);

    // 보조 조명 (우하단, 부드러운 필)
    const fillLight = new THREE.DirectionalLight(0xffeedd, 0.3);
    fillLight.position.set(200, -100, 400);
    scene.add(fillLight);

    // === WebGL Renderer ===
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
    });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // 톤매핑 제거 (색상 변형 방지)
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.inset = "0";
    mount.appendChild(renderer.domElement);

    // === 카메라 시차 효과 ===
    const baseCameraPos = { x: 0, y: 0, z: 1000 };
    let targetOffsetX = 0;
    let targetOffsetY = 0;
    let currentOffsetX = 0;
    let currentOffsetY = 0;
    let isDragging = false;

    const onMouseMove = (e: MouseEvent) => {
      if (isDragging) return;
      const rect = mount.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      targetOffsetX = x * 25;
      targetOffsetY = -y * 15;
    };

    const onMouseDown = () => {
      isDragging = true;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onMouseLeave = () => {
      targetOffsetX = 0;
      targetOffsetY = 0;
      isDragging = false;
    };

    mount.addEventListener("mousemove", onMouseMove);
    mount.addEventListener("mousedown", onMouseDown);
    mount.addEventListener("mouseup", onMouseUp);
    mount.addEventListener("mouseleave", onMouseLeave);

    setCtx({
      scene,
      camera,
      renderer,
      raycaster,
      mountEl: mount,
      getMouseNDC,
      registerMesh,
      unregisterMesh,
      getMeshById,
      getAllMeshes,
    });

    // === 렌더 루프 ===
    let raf = 0;
    const loop = () => {
      // 부드러운 카메라 보간
      currentOffsetX += (targetOffsetX - currentOffsetX) * 0.04;
      currentOffsetY += (targetOffsetY - currentOffsetY) * 0.04;

      camera.position.x = baseCameraPos.x + currentOffsetX;
      camera.position.y = baseCameraPos.y + currentOffsetY;
      camera.position.z = baseCameraPos.z;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    loop();

    // === 리사이즈 핸들러 ===
    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      mount.removeEventListener("mousemove", onMouseMove);
      mount.removeEventListener("mousedown", onMouseDown);
      mount.removeEventListener("mouseup", onMouseUp);
      mount.removeEventListener("mouseleave", onMouseLeave);
      renderer.domElement.remove();
      renderer.dispose();
      scene.clear();
      meshMapRef.current.clear();
      setCtx(null);
    };
  }, [registerMesh, unregisterMesh, getMeshById, getAllMeshes]);

  return (
    <div ref={mountRef} style={{ position: "absolute", inset: 0 }}>
      {ctx && <Ctx.Provider value={ctx}>{children}</Ctx.Provider>}
    </div>
  );
};
