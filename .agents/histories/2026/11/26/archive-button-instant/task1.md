# 목차

- [개요](#개요)
- [보관 버튼 확인 단계 제거 구현](#보관-버튼-확인-단계-제거-구현)
  - [답변](#답변)
  - [archive-button.tsx](#archive-buttontsx)
  - [messages.ts](#messagests)
  - [OVERVIEW.md](#overviewmd)
  - [calendar.md](#calendarmd)
  - [검증](#검증)
    - [타입 체크](#타입-체크)
    - [동작 확인](#동작-확인)
  - [남은 작업](#남은-작업)

---

# 개요

- plan1.md 계획에 따라 `sidebar-kanban`, `sidebar-group` 플러그인의 보관(📦) 버튼에서 확인 단계를 제거함.
- 한 번 클릭으로 바로 `paseo.workspaces.ref(workspaceRef).archive()`를 호출하도록 변경.
- `archive-button.tsx`는 두 플러그인에 복사본으로 존재하므로 동일한 내용으로 양쪽 모두 수정.
- ⋮ 메뉴(`workspace-menu.tsx`)의 보관 항목은 원래 즉시 보관이므로 변경하지 않음.

---

# 보관 버튼 확인 단계 제거 구현

> 시작해줘

## 답변

계획대로 두 플러그인의 보관 버튼을 한 번 클릭 즉시 보관으로 변경하고, 쓰이지 않게 된 메시지 키와 문서 문구를 정리함. calendar는 TASK로 변경함.

## archive-button.tsx

- 대상
  - `paseo/plugins/sidebar-kanban/client/archive-button.tsx`
  - `paseo/plugins/sidebar-group/client/archive-button.tsx`
- 상태: `stage: "idle" | "confirm" | "busy"` → `busy: boolean`
- 제거
  - `CONFIRM_MS = 4000` 상수
  - confirm 상태 자동 해제 타이머 `useEffect`
  - 빨간 배경(`statusDanger`) + "보관?" 텍스트 표시
  - 불필요해진 `useEffect`, `Text` import
- `onPress`: `busy`면 무시 → 아니면 `busy = true` 후 바로 `archive()` 호출
  - 성공: 워크스페이스가 목록에서 빠지면서 카드가 사라짐
  - 실패: `archive.failed` 토스트 표시 후 `busy = false`로 복귀
- 렌더링
  - 배경: 눌림 시 `surface2`, 평소 투명
  - 아이콘 색: `foregroundMuted` 고정, `paddingHorizontal: 3` 고정
  - 보관 중: `disabled` + `opacity: 0.5`
  - `accessibilityLabel`: `${t("archive.label")}: ${title}` 고정
- 컴포넌트 주석: "Archives a workspace on its own host with a single press."

## messages.ts

- 두 플러그인 `client/messages.ts`에서 쓰이지 않게 된 `archive.confirm` 키 제거
  - en: `confirm: "Archive?"`
  - ko: `confirm: "보관?"`

## OVERVIEW.md

- 두 플러그인 `OVERVIEW.md:7`
  - 변경 전: "각 카드의 보관 버튼은 두 번 눌러야 보관됩니다."
  - 변경 후: "각 카드의 보관 버튼은 한 번 누르면 바로 보관됩니다."
- `README.md:38`은 작업 마무리 단계에서 반영 예정

## calendar.md

- `PLAN:칸반/그룹 플러그인 보관 버튼 즉시 처리(archive-button-instant)` → `TASK:...`로 변경

## 검증

### 타입 체크

- `tsc --noEmit` 실행 시도했으나 실행하지 못함
  - Bash / PowerShell 모두 `node`, `npx`가 PATH에 없음
  - 일반적인 설치 경로(`Program Files/nodejs`, nvm, volta, fnm)에서도 찾지 못함
- node가 있는 환경에서 각 플러그인 디렉토리에서 `npx tsc --noEmit` 실행 필요

### 동작 확인

- Paseo에서 두 플러그인 리로드 후 칸반/그룹 화면에서 📦 한 번 클릭 → 카드가 바로 사라지는지 확인 필요

## 남은 작업

- 타입 체크 및 실제 동작 확인
- 작업 마무리 시 done1.md 작성, calendar DONE 변경, `README.md:38` 문구 반영
