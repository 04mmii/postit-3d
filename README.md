# Post-it 3D

브라우저에서 포스트잇을 3D 공간에 붙이고, 드래그하고, 메모를 남길 수 있는 웹앱입니다.
React + TypeScript + Three.js (CSS3D) 기반으로, IME(한글) 입력 안정성, 개별 카드 드래그, 로컬스토리지 자동 저장에 초점을 맞췄습니다.

## ![alt text](image.png)


## Features

- 새 메모 생성 (색상: 노랑/핑크/민트)
- 텍스트 편집 (한글 IME 조합 중 외부 덮어쓰기 방지)
- 카드 개별 드래그 (다중 카드 충돌/동시 이동 방지)
- 버튼 액션: 기울이기(↻), 삭제(🗑️)
- 자동 저장 (LocalStorage)
- 반응형 캔버스 / 리사이즈 대응

## Tech Stack

- React + TypeScript
- Three.js – CSS3DRenderer
- Vite (dev/build)
- Tailwind (스타일 유틸)
- ESLint / Prettier

## Scripts

| 명령어            | 설명                  |
| ----------------- | --------------------- |
| `npm run dev`     | 개발 서버 (Vite)      |
| `npm run build`   | 프로덕션 번들 생성    |
| `npm run preview` | 빌드 결과 로컬 프리뷰 |
| `npm run lint`    | ESLint 검사           |
| `npm run format`  | Prettier 포맷         |


## 📁 프로젝트 구조(요지)

src/
  components/
    Board.tsx          # 배경 보드
    NotesLayer.tsx     # 메모 목록/드래그 관리
    Note3D.tsx         # 단일 메모(3D DOM)
    Toolbar.tsx        # 상단 툴바(추가/색상)
  contexts/
    ThreeContext.tsx   # scene/camera/renderer 제공
    NotesContext.tsx   # 노트 CRUD + localStorage
  types/
    note.ts            # Note 타입
  App.tsx
  main.tsx

- ThreeContext: three.js Scene, Camera, CSS3DRenderer를 만들고 렌더 루프 관리
- NotesContext: notes 배열을 관리하고 localStorage에 동기화
- Note3D: DOM을 만들어 CSS3DObject로 감싸고, 그룹(THREE.Group)을 드래그/회전/편집 이벤트와 연결
- NotesLayer: 여러 Note3D를 렌더링하고, 드래그/저장 타이밍을 제어

## 🧩 구현 메모

- CSS3DRenderer: <div>, <textarea> 같은 실제 DOM을 3D 공간에 배치합니다.
- 드래그: 화면 픽셀 → 월드 좌표 변환해서 그룹 위치를 갱신하고, pointerup에 최종 위치를 저장합니다.
- IME(한글): compositionstart/end 이벤트로 조합 중에는 저장을 지연합니다.
- 이벤트 충돌 방지: 버튼과 텍스트영역은 캡처 단계에서 stopPropagation()으로 드래그 시작을 막습니다.
- 퍼시스턴스: NotesContext가 notes 상태를 localStorage에 자동으로 저장합니다.
