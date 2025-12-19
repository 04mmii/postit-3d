import { memo, useEffect, useRef, useMemo } from "react";
import * as THREE from "three";
import type { Note } from "../types/note";
import { useThree } from "../contexts/ThreeContext";
import { useNotes } from "../contexts/NotesContext";
import { createNoteTexture, updateNoteTexture } from "../utils/createNoteTexture";

type Props = {
  note: Note;
  onSelect: (id: string | null) => void;
  isSelected: boolean;
};

// z-index 관리
let __zCounter = 1;

/**
 * 굴곡진 포스트잇 Geometry 생성
 * 하단이 살짝 들린 효과
 */
function createCurledPlaneGeometry(
  width: number,
  height: number,
  curlAmount: number,
  segments = 16
): THREE.PlaneGeometry {
  const geometry = new THREE.PlaneGeometry(width, height, segments, segments);
  const positions = geometry.attributes.position;

  for (let i = 0; i < positions.count; i++) {
    const y = positions.getY(i);
    // 상단(접착부분)은 평평하게, 하단으로 갈수록 들림
    const normalizedY = (y + height / 2) / height; // 0(하단) ~ 1(상단)
    // 하단이 들리도록 (상단은 0, 하단은 curlAmount)
    const curl = Math.pow(1 - normalizedY, 2) * curlAmount;
    positions.setZ(i, curl);
  }

  positions.needsUpdate = true;
  geometry.computeVertexNormals();

  return geometry;
}

const Note3DMeshBase: React.FC<Props> = ({ note, onSelect, isSelected }) => {
  const { scene, camera, raycaster, mountEl, getMouseNDC, registerMesh, unregisterMesh } = useThree();
  const { updateNote } = useNotes();

  const meshRef = useRef<THREE.Mesh | null>(null);
  const textureRef = useRef<THREE.CanvasTexture | null>(null);
  const baseZ = useRef(note.position?.z ?? 10);
  const liftedZ = useRef(35);

  // 포스트잇 크기
  const noteWidth = 180;
  const noteHeight = 180;

  // 랜덤 굴곡량 (생성 시 한 번만)
  const curlAmount = useMemo(() => Math.random() * 8 + 5, []);

  // Mesh 생성
  useEffect(() => {
    // 텍스처 생성 (고해상도)
    const texture = createNoteTexture(note.text ?? "", note.color, note.completed ?? false, 512, 512);
    textureRef.current = texture;

    // 굴곡진 Geometry
    const geometry = createCurledPlaneGeometry(noteWidth, noteHeight, curlAmount);

    // 재질 (선명한 색상 유지)
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide,
    });

    // Mesh 생성
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.position.set(
      note.position?.x ?? 0,
      note.position?.y ?? 0,
      baseZ.current
    );
    mesh.rotation.z = note.rotationZ ?? 0;

    // userData에 노트 ID 저장 (Raycaster에서 식별용)
    mesh.userData.noteId = note.id;

    meshRef.current = mesh;
    scene.add(mesh);
    registerMesh(mesh, note.id);

    return () => {
      scene.remove(mesh);
      unregisterMesh(note.id);
      geometry.dispose();
      material.dispose();
      texture.dispose();
    };
  }, [scene, note.id, note.color, curlAmount, registerMesh, unregisterMesh]);

  // 위치/회전 업데이트
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    mesh.position.x = note.position?.x ?? 0;
    mesh.position.y = note.position?.y ?? 0;
    mesh.rotation.z = note.rotationZ ?? 0;
    baseZ.current = note.position?.z ?? 10;
  }, [note.position, note.rotationZ]);

  // 텍스트/완료상태 업데이트
  useEffect(() => {
    const texture = textureRef.current;
    if (!texture) return;
    updateNoteTexture(texture, note.text ?? "", note.color, note.completed ?? false);
  }, [note.text, note.color, note.completed]);

  // 드래그 및 클릭 이벤트
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || !mountEl) return;

    let isDragging = false;
    let dragStarted = false;
    let pointerId: number | null = null;
    const startMouse = new THREE.Vector2();
    const startPos = new THREE.Vector3();
    const dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const intersection = new THREE.Vector3();

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      if (isDragging) return; // 이미 드래그 중이면 무시

      const mouse = getMouseNDC(e);
      raycaster.setFromCamera(mouse, camera);

      const intersects = raycaster.intersectObject(mesh);
      if (intersects.length === 0) return;

      e.stopPropagation();

      // 클릭 감지
      isDragging = true;
      dragStarted = false;
      pointerId = e.pointerId;
      startMouse.set(e.clientX, e.clientY);
      startPos.copy(mesh.position);

      // z-index 올리기
      mesh.position.z = baseZ.current + 0.01 * (++__zCounter);

      // 드래그 평면 설정
      dragPlane.setFromNormalAndCoplanarPoint(
        new THREE.Vector3(0, 0, 1),
        mesh.position
      );

      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging || e.pointerId !== pointerId) return;

      const dx = e.clientX - startMouse.x;
      const dy = e.clientY - startMouse.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // 5픽셀 이상 움직이면 드래그 시작
      if (!dragStarted && distance > 5) {
        dragStarted = true;
        // 들어올리기
        mesh.position.z = liftedZ.current;
        onSelect(null); // 선택 해제 (편집 모드 종료)
      }

      if (dragStarted) {
        const mouse = getMouseNDC(e);
        raycaster.setFromCamera(mouse, camera);

        if (raycaster.ray.intersectPlane(dragPlane, intersection)) {
          mesh.position.x = intersection.x;
          mesh.position.y = intersection.y;
        }
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!isDragging || e.pointerId !== pointerId) return;

      if (!dragStarted) {
        // 드래그 안 하고 클릭만 한 경우 -> 선택 (편집 모드)
        console.log("Note clicked:", note.id);
        onSelect(note.id);
      } else {
        // 드래그 완료 -> 위치 저장
        mesh.position.z = baseZ.current;
        updateNote(note.id, {
          position: {
            x: mesh.position.x,
            y: mesh.position.y,
            z: baseZ.current,
          },
        });
      }

      isDragging = false;
      dragStarted = false;
      pointerId = null;
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    mountEl.addEventListener("pointerdown", onPointerDown);

    return () => {
      mountEl.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [mountEl, camera, raycaster, getMouseNDC, note.id, updateNote, onSelect]);

  // 선택 시 강조 효과 (MeshBasicMaterial용)
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const material = mesh.material as THREE.MeshBasicMaterial;
    if (isSelected) {
      material.opacity = 0.9;
      material.transparent = true;
    } else {
      material.opacity = 1.0;
      material.transparent = false;
    }
  }, [isSelected]);

  return null;
};

// 메모이제이션
const areEqual = (prev: Props, next: Props) => {
  const a = prev.note;
  const b = next.note;
  return (
    a.id === b.id &&
    a.text === b.text &&
    a.color === b.color &&
    a.completed === b.completed &&
    a.rotationZ === b.rotationZ &&
    a.position?.x === b.position?.x &&
    a.position?.y === b.position?.y &&
    a.position?.z === b.position?.z &&
    prev.isSelected === next.isSelected
  );
};

const Note3DMesh = memo(Note3DMeshBase, areEqual);
export default Note3DMesh;
