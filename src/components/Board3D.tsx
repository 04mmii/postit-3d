import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useThree } from "../contexts/ThreeContext";
import {
  createCorkTexture,
  createCorkBumpMap,
} from "../utils/createCorkTexture";

/**
 * 3D 코르크 보드 컴포넌트
 * WebGL Mesh로 렌더링되는 코르크 보드
 */
export const Board3D: React.FC = () => {
  const { scene } = useThree();
  const groupRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    const group = new THREE.Group();
    groupRef.current = group;

    // === 보드 위치 조정 (상단 갭) ===
    group.position.y = -40;

    // === 코르크 보드 본체 ===
    const boardWidth = 1200;
    const boardHeight = 650;
    const boardDepth = 20;

    // 텍스처 생성
    const corkTexture = createCorkTexture(512, 512);
    const corkBumpMap = createCorkBumpMap(256, 256);

    // 코르크 재질 (PBR)
    const corkMaterial = new THREE.MeshStandardMaterial({
      map: corkTexture,
      bumpMap: corkBumpMap,
      bumpScale: 2,
      roughness: 0.9,
      metalness: 0.0,
    });

    // 코르크 보드 Mesh
    const boardGeometry = new THREE.BoxGeometry(
      boardWidth,
      boardHeight,
      boardDepth
    );
    const boardMesh = new THREE.Mesh(boardGeometry, corkMaterial);
    boardMesh.position.z = -boardDepth / 2 - 5;
    boardMesh.receiveShadow = true;
    group.add(boardMesh);

    // === 프레임 ===
    const frameThickness = 15;
    const frameDepth = 15;

    // 프레임 재질 (어두운 나무)
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a3728,
      roughness: 0.7,
      metalness: 0.1,
    });

    // 상단 프레임
    const topFrame = new THREE.Mesh(
      new THREE.BoxGeometry(
        boardWidth + frameThickness * 2,
        frameThickness,
        frameDepth
      ),
      frameMaterial
    );
    topFrame.position.set(0, boardHeight / 2 + frameThickness / 2, 0);
    topFrame.castShadow = true;
    topFrame.receiveShadow = true;
    group.add(topFrame);

    // 하단 프레임
    const bottomFrame = new THREE.Mesh(
      new THREE.BoxGeometry(
        boardWidth + frameThickness * 2,
        frameThickness,
        frameDepth
      ),
      frameMaterial
    );
    bottomFrame.position.set(0, -boardHeight / 2 - frameThickness / 2, 0);
    bottomFrame.castShadow = true;
    bottomFrame.receiveShadow = true;
    group.add(bottomFrame);

    // 좌측 프레임
    const leftFrame = new THREE.Mesh(
      new THREE.BoxGeometry(frameThickness, boardHeight, frameDepth),
      frameMaterial
    );
    leftFrame.position.set(-boardWidth / 2 - frameThickness / 2, 0, 0);
    leftFrame.castShadow = true;
    leftFrame.receiveShadow = true;
    group.add(leftFrame);

    // 우측 프레임
    const rightFrame = new THREE.Mesh(
      new THREE.BoxGeometry(frameThickness, boardHeight, frameDepth),
      frameMaterial
    );
    rightFrame.position.set(boardWidth / 2 + frameThickness / 2, 0, 0);
    rightFrame.castShadow = true;
    rightFrame.receiveShadow = true;
    group.add(rightFrame);

    // === 프레임 모서리 장식 ===
    const cornerMaterial = new THREE.MeshStandardMaterial({
      color: 0x5c4a3a,
      roughness: 0.6,
      metalness: 0.2,
    });

    const corners = [
      {
        x: -boardWidth / 2 - frameThickness / 2,
        y: boardHeight / 2 + frameThickness / 2,
      },
      {
        x: boardWidth / 2 + frameThickness / 2,
        y: boardHeight / 2 + frameThickness / 2,
      },
      {
        x: -boardWidth / 2 - frameThickness / 2,
        y: -boardHeight / 2 - frameThickness / 2,
      },
      {
        x: boardWidth / 2 + frameThickness / 2,
        y: -boardHeight / 2 - frameThickness / 2,
      },
    ];

    corners.forEach(({ x, y }) => {
      const corner = new THREE.Mesh(
        new THREE.BoxGeometry(
          frameThickness + 4,
          frameThickness + 4,
          frameDepth + 2
        ),
        cornerMaterial
      );
      corner.position.set(x, y, 1);
      corner.castShadow = true;
      group.add(corner);
    });

    scene.add(group);

    return () => {
      scene.remove(group);
      // 텍스처 정리
      corkTexture.dispose();
      corkBumpMap.dispose();
      corkMaterial.dispose();
      frameMaterial.dispose();
      cornerMaterial.dispose();
      boardGeometry.dispose();
    };
  }, [scene]);

  return null;
};
