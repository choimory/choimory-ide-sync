# 목차

- [개요](#개요)
- [작업 완료 요약](#작업-완료-요약)
  - [답변](#답변)
  - [변경 사항](#변경-사항)
    - [보관 버튼](#보관-버튼)
    - [메시지](#메시지)
    - [문서](#문서)
  - [반영 방법](#반영-방법)
  - [검증 결과](#검증-결과)

---

# 개요

- `sidebar-kanban`, `sidebar-group` 플러그인의 카드 보관(📦) 버튼이 첫 클릭에 "보관?" 확인 상태로 바뀌고 4초 안에 재클릭해야 보관되던 동작을, 한 번 클릭으로 바로 보관되도록 변경함.
- 계획: plan1.md, 구현 내역: task1.md

---

# 작업 완료 요약

> 칸반이랑 그룹 플러그인에서 보관버튼 누르면 보관할건지 물어보는 버튼으로 한번 변경되는데 그런거 엇ㅂ이 바로 처리됐으면 좋겠음

## 답변

두 플러그인의 보관 버튼에서 확인 단계를 제거하여 한 번 클릭 즉시 보관되도록 변경했고, 사용자가 Paseo에서 동작을 확인함.

## 변경 사항

### 보관 버튼

- `paseo/plugins/sidebar-kanban/client/archive-button.tsx`, `paseo/plugins/sidebar-group/client/archive-button.tsx` (동일 복사본)
- 상태 `idle/confirm/busy` → `busy` 단일 플래그
- `CONFIRM_MS` 타이머, 빨간 "보관?" 표시, 불필요한 import 제거
- 클릭 즉시 `paseo.workspaces.ref(workspaceRef).archive()` 호출, 보관 중엔 비활성화, 실패 시 토스트 후 재시도 가능
- ⋮ 메뉴의 보관 항목은 원래 즉시 보관이라 변경 없음

### 메시지

- 두 플러그인 `client/messages.ts`에서 미사용 `archive.confirm` 키(en/ko) 제거

### 문서

- 두 플러그인 `OVERVIEW.md`: "두 번 눌러야 보관됩니다" → "한 번 누르면 바로 보관됩니다"
- `README.md`: "📦 버튼: 두 번 눌러야 보관 (4초 안에 재클릭)." → "📦 버튼: 한 번 누르면 바로 보관."

## 반영 방법

- 플러그인은 저장소 폴더를 직접 실행하므로 Paseo 재시작은 불필요
- `paseo plugin reload sidebar-kanban`, `paseo plugin reload sidebar-group`으로 반영
- `paseo` CLI가 PATH에 없으면 `%LOCALAPPDATA%\Programs\Paseo\resources\bin\paseo.cmd` 사용

## 검증 결과

- 사용자가 Paseo에서 한 번 클릭 즉시 보관되는 동작을 확인함
- `tsc --noEmit` 타입 체크는 node가 없는 환경이라 실행하지 않음
