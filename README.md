##Post-it 3D

브라우저에서 포스트잇을 3D 공간에 붙이고, 드래그하고, 메모를 남길 수 있는 웹앱입니다.
React + TypeScript + Three.js (CSS3D) 기반으로, IME(한글) 입력 안정성, 개별 카드 드래그, 로컬스토리지 자동 저장에 초점을 맞췄습니다.

## ![alt text](image.png)

#Features

- 새 메모 생성 (색상: 노랑/핑크/민트)
- 텍스트 편집 (한글 IME 조합 중 외부 덮어쓰기 방지)
- 카드 개별 드래그 (다중 카드 충돌/동시 이동 방지)
- 버튼 액션: 기울이기(↻), 삭제(🗑️)
- 자동 저장 (LocalStorage)
- 반응형 캔버스 / 리사이즈 대응

Tech Stack

- React + TypeScript
- Three.js – CSS3DRenderer
- Vite (dev/build)
- Tailwind (스타일 유틸)
- ESLint / Prettier

#Scripts

| 명령어            | 설명                  |
| ----------------- | --------------------- |
| `npm run dev`     | 개발 서버 (Vite)      |
| `npm run build`   | 프로덕션 번들 생성    |
| `npm run preview` | 빌드 결과 로컬 프리뷰 |
| `npm run lint`    | ESLint 검사           |
| `npm run format`  | Prettier 포맷         |
