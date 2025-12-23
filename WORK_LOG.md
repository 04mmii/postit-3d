# Postit-3D 작업 기록

## 프로젝트 목표
CSS3DRenderer 기반 포스트잇 앱을 **WebGLRenderer**로 전환하여 포트폴리오에서 Three.js 실력을 어필할 수 있도록 함

---

## 작업 내역

### 1. WebGL 기반 3D 전환
**Before (기존)**
- CSS3DRenderer (DOM을 3D 공간에 배치)
- CSS box-shadow로 그림자
- DOM 기반 textarea 입력

**After (전환 후)**
- WebGLRenderer (진짜 3D 렌더링)
- 실시간 조명 + 그림자
- 3D Mesh + CanvasTexture
- HTML 오버레이로 텍스트 입력

### 2. 파일 구조 변경

**삭제된 파일:**
- `src/components/Note3D.tsx` (CSS3D 기반)
- `src/components/Board.tsx` (CSS3D 기반)

**신규 생성:**
- `src/components/Board3D.tsx` - 코르크 보드 3D Mesh
- `src/components/Note3DMesh.tsx` - 포스트잇 3D Mesh
- `src/components/NoteTextOverlay.tsx` - HTML 텍스트 입력 오버레이
- `src/utils/createNoteTexture.ts` - CanvasTexture로 텍스트/체크박스 렌더링
- `src/utils/createCorkTexture.ts` - 절차적 코르크 텍스처 생성
- `src/utils/animate.ts` - 애니메이션 유틸

**수정된 파일:**
- `src/contexts/ThreeContext.tsx` - WebGLRenderer + 조명 + Raycaster
- `src/components/NotesLayer.tsx` - 3D Mesh 컴포넌트 연동
- `src/utils/colors.ts` - 80% 투명도 버전 추가
- `src/types/note.ts` - completed 필드 추가

---

### 3. UI/UX 수정사항

#### 3-1. 보드 위치 조정
- 보드가 상단까지 올라가는 문제 → 상단에 갭 추가
- `group.position.y = -60` 설정

#### 3-2. 포스트잇 색상
- 블러/그늘 효과 제거 → 선명한 지정 컬러 사용
- `MeshStandardMaterial` → `MeshBasicMaterial`로 변경
- `colors.ts`의 지정 컬러 사용:
  ```typescript
  yellow: "#FFEB74"
  pink: "#FFC3D1"
  mint: "#BFF3E0"
  ```

#### 3-3. 완료 체크박스 추가
- 포스트잇에 체크박스 UI 추가
- 완료 시 취소선 효과
- 체크박스 크기: 42px

#### 3-4. 텍스트 크기 증가
- 메인 텍스트: 35px → **48px**
- 플레이스홀더: 30px → **40px**
- 날짜: 11px → **22px** (bold)
- 줄 간격: 42px → **52px**

#### 3-5. 텍스트 입력 오버레이
- 투명 배경 → 80% 투명도 포스트잇 색상 배경
- 포스트잇 위에 겹쳐서 직접 수정하는 느낌
- `COLORS_80` 추가:
  ```typescript
  yellow: "rgba(255, 235, 116, 0.8)"
  pink: "rgba(255, 195, 209, 0.8)"
  mint: "rgba(191, 243, 224, 0.8)"
  ```

---

### 4. 버그 수정

#### 4-1. MeshBasicMaterial emissive 오류
- `MeshBasicMaterial`에는 `emissive` 속성이 없음
- 선택 효과를 `opacity`로 변경

#### 4-2. 카드 겹침 클릭 버그
**문제:** 겹친 카드 클릭 시 여러 카드가 동시에 선택됨

**해결:**
- 전역 드래그 잠금 (`__globalDragLock`) 추가
- 레이캐스트로 모든 메시 검사 후 최상위 카드만 반응
- 클릭된 카드가 맨 위로 올라오도록 z-index 관리

```typescript
// 모든 메시에 대해 레이캐스트
const allMeshes = getAllMeshes();
const allIntersects = raycaster.intersectObjects(allMeshes);

// 가장 위에 있는 카드만 선택
if (allIntersects[0].object !== mesh) return;
```

---

## 기술 스택 & 포트폴리오 어필 포인트

1. **WebGLRenderer** - 진짜 3D 렌더링
2. **MeshBasicMaterial** - 선명한 색상 유지
3. **CanvasTexture** - 동적 텍스트 렌더링
4. **절차적 텍스처** - Canvas로 코르크/종이 생성
5. **Raycaster** - 3D 공간 마우스 피킹
6. **하이브리드 렌더링** - WebGL + HTML 오버레이 통합
7. **커스텀 Geometry** - 버텍스 조작으로 굴곡 효과

---

## Git 커밋 기록

```
b8cdc93 카드 겹침 클릭 버그 수정
c698149 WebGL 기반 3D 포스트잇으로 전환
ce20231 오류 수정
```

---

## 배포
- **플랫폼:** Vercel
- **자동 배포:** git push 시 자동 빌드/배포
- **Repository:** https://github.com/04mmii/postit-3d.git
