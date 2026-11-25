# choimory-ide-sync
여러 기기에서 사용하는 IDE들의 설정파일 관리

## 목차
- [Paseo](#paseo)
  - [동기화 대상](#동기화-대상)
  - [제외 대상 (올리면 안 됨)](#제외-대상-올리면-안-됨)
  - [주의사항](#주의사항)

---

## Paseo

### 동기화 대상

| 저장소 경로 | 원본 경로 (Windows) | 내용 |
|---|---|---|
| `paseo/config.json` | `~/.paseo/config.json` | 데몬 설정 (listen 주소, MCP 주입, CORS, relay 등) |
| `paseo/desktop-settings.json` | `%APPDATA%/Paseo/desktop-settings.json` | 데스크톱 앱 설정 (릴리스 채널, 알림, 데몬 관리) |

`.gitignore`에서 `paseo/` 폴더는 허용 목록 방식이라 위 두 파일 외에는 추적되지 않음.

### 제외 대상 (올리면 안 됨)

**`~/.paseo/`**

| 파일/폴더 | 이유 |
|---|---|
| `daemon-keypair.json` | 데몬 키쌍. `secretKeyB64` 비밀키 포함 (릴레이 페어링용) |
| `local-credential` | 로컬 인증 토큰 |
| `server-id`, `cli-client-id` | 기기 고유 ID. 공유 시 기기 간 충돌 |
| `paseo.pid`, `daemon.log` | 런타임 상태 / 로그 (작업 내용 포함 가능) |
| `agents/`, `agent-requests/`, `creations/`, `projects/` | 에이전트 기록, 기기별 작업공간 경로 |
| `models/`, `runtime/`, `terminal-worker/`, `desktop-attachments/`, `schedules/` | 다운로드 모델 / 런타임 / 캐시 |

**`%APPDATA%/Paseo/`**

| 파일/폴더 | 이유 |
|---|---|
| `Cache`, `Code Cache`, `GPUCache`, `Dawn*Cache` 등 | Electron 캐시 |
| `IndexedDB`, `Local Storage`, `Session Storage`, `Network`, `WebStorage` | 로그인 세션 등 민감 데이터 가능 |
| `.updaterId` | 기기 고유 ID |
| `window-state.json` | 창 위치 (기기마다 다름) |

### 주의사항
- `config.json`은 현재 비밀값이 없으나, relay 등 기능을 켜면 토큰이 추가될 수 있으므로 **커밋 전 내용 확인**.
