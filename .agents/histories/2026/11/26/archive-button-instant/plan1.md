# 목차

- [개요](#개요)
- [보관 버튼 확인 단계 제거](#보관-버튼-확인-단계-제거)
  - [답변](#답변)
  - [현재 동작](#현재-동작)
  - [변경 계획](#변경-계획)
    - [archive-button.tsx](#archive-buttontsx)
    - [messages.ts](#messagests)
    - [문서](#문서)
  - [확인 필요 사항](#확인-필요-사항)
  - [검증 방법](#검증-방법)

---

# 개요

- `sidebar-kanban`, `sidebar-group` 플러그인의 카드 보관(📦) 버튼은 첫 클릭 시 "보관?" 확인 상태로 바뀌고, 4초 안에 한 번 더 눌러야 보관됨.
- 확인 단계 없이 한 번 클릭으로 바로 보관되도록 변경해야 함.
- `archive-button.tsx`는 두 플러그인에 **복사본**으로 들어 있으므로 양쪽 모두 동일하게 수정.
- ⋮ 메뉴(`workspace-menu.tsx`)의 "보관" 항목은 이미 확인 없이 바로 보관하므로 변경 대상 아님.

---

# 보관 버튼 확인 단계 제거

> 칸반이랑 그룹 플러그인에서 보관버튼 누르면 보관할건지 물어보는 버튼으로 한번 변경되는데 그런거 엇ㅂ이 바로 처리됐으면 좋겠음

## 답변

두 플러그인의 `client/archive-button.tsx`(내용 완전 동일)에서 `idle → confirm → busy` 3단계 상태를 `idle → busy` 2단계로 줄이면 됨. 서버 코드나 API 호출 방식은 그대로.

## 현재 동작

- 파일: `paseo/plugins/sidebar-kanban/client/archive-button.tsx`, `paseo/plugins/sidebar-group/client/archive-button.tsx`
- `stage: "idle" | "confirm" | "busy"`
  - 첫 클릭: `idle → confirm` (빨간 배경 + "보관?" 텍스트 표시)
  - `CONFIRM_MS = 4000` 타이머 후 자동으로 `idle` 복귀
  - `confirm` 상태에서 재클릭: `busy` → `paseo.workspaces.ref(workspaceRef).archive()` 호출
  - 성공 시 워크스페이스가 목록에서 빠지면서 카드가 사라짐, 실패 시 토스트 + `idle` 복귀
- 사용처: kanban `client/board.tsx:178`, group `client/map.tsx:300`

## 변경 계획

### archive-button.tsx

- `stage` 타입을 `"idle" | "busy"`로 축소 (또는 `busy: boolean`)
- `CONFIRM_MS` 상수와 confirm 타이머 `useEffect` 제거 (`useEffect` import도 제거)
- `onPress`: `busy`면 무시, 아니면 바로 `busy`로 바꾸고 `archive()` 호출
- 렌더링에서 `armed` 관련 분기 제거
  - 배경: 눌림 시 `surface2`, 평소 투명
  - 아이콘 색: 항상 `foregroundMuted`
  - "보관?" 텍스트 제거, `paddingHorizontal` 고정
  - `accessibilityLabel`: `${t("archive.label")}: ${title}` 고정
- 컴포넌트 주석을 "한 번 클릭으로 보관"으로 수정
- 두 플러그인 파일을 동일하게 수정 (복사본 유지)

### messages.ts

- `archive.confirm` 키("Archive?", "보관?")가 더 이상 쓰이지 않음 → 두 플러그인의 en/ko 모두에서 제거

### 문서

- `README.md:38` "📦 버튼: 두 번 눌러야 보관 (4초 안에 재클릭)." → 한 번 클릭으로 바로 보관
- 두 플러그인 `OVERVIEW.md:7` "각 카드의 보관 버튼은 두 번 눌러야 보관됩니다." → 한 번 누르면 바로 보관
- README는 작업 마무리 단계에서 반영

## 확인 필요 사항

- 오클릭 대비책: 확인 단계가 없어지면 실수로 눌러도 바로 보관됨. 보관은 삭제가 아니라 Paseo에서 복원 가능하므로 단순 제거로 진행하는 것을 권장. (토스트에 "실행 취소" 버튼을 다는 방안도 있으나, 플러그인 클라이언트 API에서 보관 취소를 지원하는지 별도 확인이 필요해서 이번 범위에서는 제외)
- 버전: 두 플러그인 `package.json` 버전이 `0.0.0`이라 버전 변경은 하지 않음

## 검증 방법

- 각 플러그인 디렉토리에서 타입 체크 (`tsc --noEmit`)
- Paseo에서 플러그인 리로드 후 칸반/그룹 화면에서 📦 한 번 클릭 → 카드가 바로 사라지는지 확인
