# PROJECT ROOT — Technical Stack

## 1. Overview

PROJECT ROOT는 **Next.js 기반 풀스택 웹 애플리케이션**으로 개발한다.

게임 전체가 브라우저에서 실행되며, 랜딩 페이지부터 계정 시스템, 게임 데이터, 가상 Linux 데스크톱, 사건 관리 시스템, 가상 인터넷까지 하나의 웹 애플리케이션 안에서 연결한다.

기본 기술 스택:

- Framework: Next.js
- Language: TypeScript
- UI: React
- Styling: CSS Modules / Global CSS
- Database: PostgreSQL
- ORM: Prisma
- Authentication: 자체 계정 시스템
- Deployment: 추후 결정

---

# 2. Frontend

## Next.js

Next.js App Router를 사용한다.

주요 페이지 구조 예시:

/  
/intro  
/login  
/register  
/game

`/game` 진입 이후에는 일반적인 웹페이지보다 하나의 데스크톱 애플리케이션처럼 동작하도록 한다.

게임 플레이 중 페이지 전체 새로고침과 URL 이동은 최소화한다.

---

## React

PROJECT ROOT의 게임 UI는 React 컴포넌트 기반으로 구성한다.

예상 구조:

App
├── Landing
├── Intro
├── Auth
└── Game
    ├── Desktop
    ├── SystemBar
    ├── WindowManager
    ├── Notifications
    └── Applications

게임 내 창은 실제 브라우저의 새 창이 아니라 React 내부 Window Manager가 관리한다.

각 앱은 독립적인 컴포넌트로 구성한다.

---

# 3. Game Desktop

플레이어가 사용하는 컴퓨터는 세계관상 실제 Linux 기반 워크스테이션이다.

기본 환경은 다음을 기준으로 한다.

- OS: Debian GNU/Linux
- Desktop Environment: KDE Plasma
- Terminal: Konsole
- File Manager: Dolphin

단, 실제 Debian VM을 플레이어마다 실행하는 것이 아니라 웹에서 필요한 동작을 시뮬레이션한다.

KDE/Linux의 동작 방식을 참고하되 게임 플레이에 필요하지 않은 기능까지 모두 구현하지 않는다.

PROJECT ROOT 전용 프로그램은 해당 Linux 워크스테이션에 설치된 사내 프로그램이라는 설정으로 구성한다.

---

# 4. Game Applications

초기 게임에서 필요한 주요 앱:

- Cases
- Browser
- Terminal
- Mail
- Files
- Settings

Linux 기본 프로그램을 사용할 수 있는 영역과 PROJECT ROOT에서 직접 구현해야 하는 영역을 구분한다.

## Cases

PROJECT ROOT의 핵심 전용 프로그램.

다음 정보를 관리한다.

- CASE
- INTEL
- ACCOUNTS
- EVIDENCE
- HINT

게임의 사건 진행 상태와 직접 연결된다.

## Browser

게임 내부 인터넷을 탐색하는 브라우저.

지원 목표:

- URL
- Back / Forward
- Refresh
- Tabs
- History
- Bookmarks
- Search
- Game websites

게임 내부 사이트와 실제 공개 웹서비스를 구분하여 처리할 수 있는 구조로 설계한다.

## Terminal

Linux 스타일의 가상 터미널.

초기 지원 명령 예시:

whoami
hostname
pwd
ls
cd
cat
clear
echo
history

향후 가상 네트워크 시스템이 구현되면 추가 명령을 확장한다.

Terminal은 실제 사용자의 컴퓨터에서 shell 명령을 실행하지 않는다.

모든 명령은 게임 내부의 가상 환경에서 처리한다.

## Mail

게임 내부 이메일 시스템.

사건 발생, NPC 연락, 첨부파일, 시스템 메시지 등에 사용한다.

## Files

게임에서 획득한 파일을 관리한다.

가상 파일 시스템과 연결한다.

---

# 5. Backend

Next.js의 Server 기능을 사용하여 초기 Backend를 구현한다.

별도의 Backend 서버는 초기 버전에서 두지 않는다.

주요 API 영역:

/api/auth
/api/user
/api/game
/api/cases
/api/evidence
/api/intel
/api/mail
/api/world

필요한 경우 Next.js Route Handler를 사용한다.

Backend에서는 다음을 처리한다.

- 회원가입
- 로그인
- 세션
- 사용자 정보
- 게임 진행도
- 사건 상태
- 발견한 정보
- 이메일
- 가상 웹 데이터
- 저장 데이터

클라이언트에서 전달된 게임 상태를 무조건 신뢰하지 않는다.

중요한 진행 상태와 계정 데이터는 서버에서 검증한다.

---

# 6. Database

Database는 PostgreSQL을 사용한다.

ORM은 Prisma를 사용한다.

초기 데이터 모델 예시:

User
GameProfile
GameSave
Case
CaseProgress
Intel
Evidence
Account
Mail
GameFile
WorldState

예:

User
├── id
├── username
├── email
├── passwordHash
├── createdAt
└── gameProfile

게임 서비스 계정과 게임 속 Linux 사용자 계정은 동일한 계정을 사용한다.

예:

username = jihan

/home/jihan

jihan@workstation:~$

---

# 7. Authentication

PROJECT ROOT 자체 계정 시스템을 구현한다.

가입 정보:

- Username
- Email
- Password

Password는 절대 평문으로 저장하지 않는다.

서버에서 안전한 password hashing을 적용한다.

인증 완료 후 사용자 세션을 생성한다.

게임 API는 현재 로그인한 사용자의 데이터만 접근할 수 있어야 한다.

---

# 8. Game State

게임에는 일반 UI State와 별도로 Game State가 존재한다.

Game State 예시:

player
caseProgress
intel
evidence
accounts
mail
files
browserHistory
terminalHistory
worldFlags

예:

worldFlags = {
  introCompleted: true,
  workstationInitialized: true,
  case001Started: false
}

Game State는 게임 전체에서 공유된다.

Browser에서 발생한 사건이 Cases에 영향을 주고,

Mail에서 받은 파일이 Files에 생성되고,

Terminal에서 발견한 정보가 Evidence에 연결되는 식으로 앱들이 서로 연결된다.

---

# 9. Save System

게임은 자동 저장을 기본으로 한다.

중요한 행동 이후 서버에 상태를 저장한다.

예:

- 사건 단계 변경
- 증거 발견
- Intel 등록
- 메일 확인
- 파일 획득
- 중요한 Terminal 이벤트
- 설정 변경

모든 마우스 움직임이나 창 위치까지 서버에 계속 저장하지 않는다.

UI 상태와 게임 진행 상태를 구분한다.

중요한 게임 진행 상태는 PostgreSQL에 저장한다.

일시적인 UI 상태는 브라우저에서 관리할 수 있다.

---

# 10. Virtual File System

실제 서버의 파일 시스템을 플레이어에게 직접 노출하지 않는다.

게임 내부에 별도의 Virtual File System을 구현한다.

예:

/
├── home
│   └── jihan
│       ├── Desktop
│       ├── Documents
│       └── Downloads
├── etc
├── var
│   └── log
└── tmp

파일에는 다음과 같은 정보를 저장할 수 있다.

- path
- name
- type
- content
- owner
- permissions
- createdAt
- modifiedAt

Terminal과 Files 앱은 동일한 Virtual File System을 사용한다.

따라서 Terminal에서 생성되거나 다운로드된 파일이 Files에서도 보여야 한다.

---

# 11. Virtual Internet

PROJECT ROOT에는 게임 전용 인터넷 계층을 구축한다.

가상 인터넷에는 다음이 포함될 수 있다.

- 검색 엔진
- 회사 사이트
- 개인 사이트
- 뉴스
- 커뮤니티
- 개발 플랫폼
- 파일 서버
- 내부 시스템

가상 사이트들은 서로 완전히 독립된 미션 화면으로 만들지 않는다.

공통 World Data를 기반으로 연결된 하나의 인터넷처럼 동작하도록 한다.

예:

NPC 한 명에게

username
email
employer
domain
accounts

등의 공통 데이터를 부여하고 여러 가상 서비스에서 같은 정보가 자연스럽게 연결되도록 한다.

---

# 12. Virtual Network

향후 Terminal 기반 조사 기능을 위해 Virtual Network 계층을 구축할 수 있다.

예:

VirtualHost
├── hostname
├── ip
├── services
├── files
├── users
└── permissions

Terminal에서 네트워크 관련 명령을 입력하면 실제 인터넷에 명령을 실행하는 것이 아니라 이 Virtual Network를 조회한다.

게임의 모든 보안/침투 관련 기능은 이 가상 환경 내부에서만 동작한다.

---

# 13. Real Web Integration

일부 실제 공개 웹서비스를 게임 플레이에 활용할 수 있다.

단, 실제 서비스와 PROJECT ROOT의 가상 서비스를 명확하게 구분한다.

예:

실제 공개 GitHub
→ 실제 웹

사건용 가상 코드 저장소
→ PROJECT ROOT Virtual Web

실제 서비스의 계정, 인증 또는 보안 시스템을 게임의 공격 대상으로 사용하지 않는다.

---

# 14. Security

PROJECT ROOT는 사이버 보안을 소재로 하기 때문에 게임 시스템과 실제 시스템의 경계를 명확하게 유지한다.

원칙:

1. Terminal 명령은 실제 서버 shell에서 직접 실행하지 않는다.
2. 플레이어 입력을 시스템 명령으로 그대로 전달하지 않는다.
3. Virtual File System과 실제 서버 파일 시스템을 분리한다.
4. Virtual Network와 실제 네트워크를 분리한다.
5. 비밀번호는 hash하여 저장한다.
6. API 요청의 권한을 서버에서 확인한다.
7. 사용자 입력은 검증한다.
8. 게임 내부 URL과 외부 URL을 구분한다.

---

# 15. Project Structure

초기 구조 예시:

src/
├── app/
│   ├── page.tsx
│   ├── intro/
│   ├── login/
│   ├── register/
│   ├── game/
│   └── api/
│
├── components/
│   ├── ui/
│   ├── desktop/
│   ├── windows/
│   └── apps/
│
├── game/
│   ├── engine/
│   ├── filesystem/
│   ├── terminal/
│   ├── network/
│   ├── browser/
│   └── world/
│
├── server/
│   ├── auth/
│   ├── database/
│   └── services/
│
├── lib/
│
└── types/

prisma/
├── schema.prisma
└── seed.ts

public/
└── assets/

---

# 16. Development Order

기능을 한꺼번에 구현하지 않는다.

### Phase 1 — Entry

Landing
→ Intro
→ Register
→ Login
→ Boot
→ Desktop

### Phase 2 — Desktop

Window Manager
→ System Bar
→ App Launcher
→ Cases
→ 기본 앱 실행

### Phase 3 — Game Engine

Game State
→ Save System
→ Virtual File System
→ Terminal

### Phase 4 — Internet

Browser
→ Virtual Websites
→ Search
→ History
→ Mail

### Phase 5 — Investigation

Case System
→ Intel
→ Evidence
→ Accounts
→ Hint System

### Phase 6 — Network

Virtual Hosts
→ Virtual Services
→ Network Commands
→ 사건과 연결

---

# 17. Initial Implementation Scope

첫 번째 버전에서는 다음까지만 구현한다.

Landing
→ 게임 소개
→ 세계관 Intro
→ 회원가입
→ 계정 생성
→ Linux Workstation 부팅 연출
→ Desktop
→ 기본 앱 표시
→ Cases/안내 앱 자동 실행

첫 단계에서는 완전한 Terminal, Browser, Mail, 사건 시스템을 구현하지 않는다.

중요한 목표는 **PROJECT ROOT에 가입한 뒤 실제 업무용 컴퓨터를 처음 지급받아 켜는 것 같은 경험**을 완성하는 것이다.



현재는 로컬 데이터베이스를 두고,
이후에 Supabase로 통합한다.