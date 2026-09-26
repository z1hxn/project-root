# PROJECT ROOT

브라우저 안에서 동작하는 사이버 미스터리 워크스테이션. Next.js App Router, TypeScript, React, PostgreSQL, Prisma를 사용합니다.

## 로컬 실행

Node.js 22.17 이상이 필요합니다.

```sh
npm ci
cp .env.example .env
npm run db:generate
npm run db:start
```

DB 터미널을 유지하고 다른 터미널에서 실행합니다.

```sh
npm run db:migrate
npm run dev
```

기본 주소: http://127.0.0.1:3000. 기존 개발 서버가 있으면 해당 서버를 사용합니다. DB는 `127.0.0.1:54329`에만 바인딩하고 `.data/postgres`에 영구 저장합니다. `.env.example`의 DB 자격정보는 로컬 개발 전용입니다. 자체 PostgreSQL/Supabase PostgreSQL로 옮길 때는 `DATABASE_URL`을 변경하고 동일한 마이그레이션을 적용합니다.

## 최초 실행과 로그인

랜딩 → 인트로 → 계정 생성 → Plasma 부팅 → 사용자 확인 → Project Root 세계관 안내 → 조사 워크스페이스.

기존 사용자도 로그인과 `/game` 새 진입 시 부팅 화면을 거칩니다. 세계관 안내 완료 여부는 DB에 저장하며, Project Root의 **세계관 안내**에서 다시 재생할 수 있습니다. 안내에는 조직·역할·조사 도구·플레이 방향을 담았으며 후반 스토리와 첫 사건은 노출하지 않습니다.

## 데스크톱

KDE Plasma 6 / Breeze 레이아웃과 공식 KDE 자산을 바탕으로 구성했습니다.

- 하단/상단 패널, 프로그램 실행 메뉴, 앱 검색, KRunner
- 가상 데스크톱, 개요, 바탕화면 보기
- 네트워크·음량·알림·클립보드·야간 색상 트레이와 달력
- 창 이동·크기 조절·최소화·최대화·복원·가장자리 스냅
- 제목 표시줄 우클릭: 항상 위, 접기, 다른 데스크톱으로 이동
- 아이콘 드래그·격자 정렬·위치 잠금·다중 선택·영역 선택·위치 저장
- 빈 공간/아이콘별 우클릭 메뉴, 새 폴더·텍스트 파일, 복사·잘라내기·붙여넣기·이름 변경·휴지통·속성
- 계정명은 패널에 표시하지 않습니다.

## 프로그램

### Project Root

기존 Cases를 대체하는 독립된 내부 조사 앱입니다. 사건·정보·발견한 계정·증거·힌트와 **내 프로필**, 세계관 안내, 로그아웃, 종료를 포함합니다. 시스템 설정과 프로필을 분리했습니다.

### Firefox

Proton 계열 UI: 탭, 탭 닫기/추가, 사생활 보호 탭, 주소창, 보안 정보, 북마크 도구 모음, 뒤로/앞으로, 새로 고침, 방문 기록, 북마크 추가/삭제, 다운로드, 브라우저 메뉴, 확대/축소, 페이지 찾기, 모양 설정.

`portal.root` 인트라넷, `index.root` 검색과 안내 문서 다운로드를 제공합니다. 외부 사이트를 실제로 로드하지 않으며 내부 주소가 아닌 경우 Firefox 스타일 오류 화면이 나옵니다. OS의 네트워크 설정이 내부 브라우징에 반영됩니다. 사생활 보호 탭은 방문 기록에 저장되지 않습니다.

### Dolphin

메뉴·도구 모음·경로 표시줄, 위치 패널, 아이콘/간단히/자세히 보기, 검색, 숨김 파일, 정보 패널, 분할 보기, 폴더 이동, 새 폴더/파일, 이름 변경, 복사·잘라내기·붙여넣기, 휴지통, 속성, 텍스트 열기/수정/저장. Firefox와 Konsole, 바탕화면의 파일을 공유합니다.

### Konsole

Debian bash 스타일 세션, 여러 탭, 출력 검색, 글꼴·색상 프로필, 기록 이동, 경로 완성. `help`, `whoami`, `hostname`, `uname`, `date`, `pwd`, `ls`, `cd`, `cat`, `mkdir`, `touch`, `echo >`, `rm`, `mv`, `history`, `clear`는 공통 가상 파일 시스템을 조작합니다. 실제 호스트의 셸은 실행하지 않습니다.

### KMail

폴더 트리, 메시지 목록, 읽기 창, 검색, 읽음/별표, 보관·삭제, 답장 작성, 임시 보관함. 현재 발신 서비스는 연결하지 않았으며 작성한 메일은 임시 저장할 수 있습니다.

### 시스템 설정

Breeze 설정 UI에 17개 설정 페이지를 제공합니다. 계정 프로필을 편집하는 화면이 아닙니다.

- Breeze / Breeze Dark / Breeze Twilight, 강조 색상, KDE 배경/단색
- UI 글꼴과 크기, 인터페이스 배율, 애니메이션
- 패널 위치·높이·떠 있는 패널, 아이콘 표시·크기, 가상 데스크톱 수
- 단일/더블 클릭, 포커스 정책, 창 조작과 단축키 안내
- 출력 음량·음소거·스피커 테스트, 알림·방해 금지
- 가상 Wi-Fi·비행기 모드·블루투스 상태
- 화면 밝기·야간 색상, 자동 잠금
- 시계 12/24시간·초·날짜·시간대

설정은 적용 버튼으로 서버에 저장합니다. 트레이 변경은 즉시 저장합니다. 물리 디바이스를 제어하지 않으며 디스플레이 효과와 연결 상태는 게임 환경에 한정됩니다. 블루투스 주변 장치는 아직 없습니다.

## 저장 및 세션

PostgreSQL: 계정, scrypt 해시, HttpOnly 세션, 최초 설정 완료, 세계관 안내 완료, OS 설정.

브라우저의 사용자별 localStorage: 가상 파일, 아이콘 위치, Firefox 기록/북마크, 메일 상태. 이 데이터는 현재 기기에서만 유지됩니다. DB 기반 GameSave로 통합하는 것은 후속 작업입니다. 창 배치와 저장하지 않은 편집 내용은 메모리 상태입니다.

로그아웃은 서버 세션을 해제합니다. 종료는 가상 컴퓨터 전원 화면으로 전환하며 같은 탭을 새로고침해도 전원 상태를 유지합니다. 전원 켜기/다시 시작은 부팅을 재생합니다. 잠금 해제는 서버에서 현재 계정 비밀번호를 검증합니다.

## 로고

기존 초록 네모·북동쪽 화살표를 그대로 내보냈습니다.

- `public/brand/project-root-mark.png` — 1024×1024
- `public/brand/project-root-mark-512.png` — 512×512
- `public/brand/project-root-mark-256.png` — 256×256
- `public/brand/project-root-mark.svg` — 원본 벡터

색상: 배경 `#c6d995`, 화살표 `#1b2215`. 모서리 바깥은 투명합니다. 새 Project Root 앱 아이콘에도 동일한 로고를 사용합니다.

KDE 배경·아이콘, Firefox 아이콘과 폰트의 출처·라이선스는 `public/assets/ATTRIBUTION.md`에 정리했습니다.

## 코드 구조

```text
src/app/                    페이지, 인증·프로필·OS 설정 API, 스타일
src/components/desktop/     Plasma 셸, 패널, 바탕화면·아이콘
src/components/windows/     KWin 스타일 창과 상태 reducer
src/components/ui/Native    메뉴·대화상자·설정 컨트롤
src/features/onboarding/    부팅·초기 설정·세계관 안내
src/features/workspace/     앱 공유 컨텍스트
src/apps/                   Project Root, Firefox, Dolphin, Konsole, KMail, Settings
src/game/filesystem.ts      공통 VFS 및 가상 명령 처리
src/lib/os-settings.ts      설정 스키마·기본값
src/server/                 인증·해시·DB·요청 검증
prisma/                     DB 스키마 및 마이그레이션
```

## 검증

```sh
npm run typecheck
npm test
npm run build
# DB와 개발 서버가 실행 중인 상태
npx playwright install chromium
npm run test:e2e
# 다른 포트 사용 시
TEST_BASE_URL=http://127.0.0.1:3001 npm run test:e2e
```

E2E는 테스트 전용 `qa_` 계정을 생성하고 종료 시 해당 계정만 삭제합니다. 스크린샷은 `test-results/`에 저장됩니다.

전체 KDE 또는 실제 Firefox 엔진을 구동하는 것은 아닙니다. 게임에 필요한 UI와 동작을 웹으로 재현합니다. 첫 사건, 외부 인터넷, 실제 OS 하드웨어 제어와 메일 발신은 이번 구현에 포함되지 않습니다. 다중 서버 운영 전에는 공유 rate limiter와 계정 복구·이메일 검증 등을 추가해야 합니다.
