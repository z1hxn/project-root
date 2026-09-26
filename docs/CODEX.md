# PROJECT ROOT — Codex Implementation Brief

## 역할

당신은 **PROJECT ROOT**라는 브라우저 기반 사이버 미스터리 게임의 첫 번째 플레이 가능한 프론트엔드 흐름을 구현한다.

이번 작업의 목표는 게임 전체를 만드는 것이 아니다.

**사이트 첫 방문 → 게임 소개 → 세계관 인트로 → 계정 생성 → 첫 부팅 → OS 초기 등록 → Desktop 진입 → 안내/사건 관리 앱 자동 실행**까지 하나의 완성도 높은 사용자 경험으로 구현한다.

---

# 1. 가장 중요한 제품 방향

PROJECT ROOT는 일반적인 웹사이트처럼 보여서는 안 된다.

랜딩 페이지 이후부터는 사용자가 실제 가상 컴퓨터에 들어가는 듯한 느낌을 받아야 한다.

다만 흔한 해킹 게임처럼 다음 요소를 남발하지 않는다.

- Matrix 스타일 초록색 코드 비
- 모든 UI에 네온 효과
- 의미 없는 랜덤 코드
- 과도한 glitch
- skull 아이콘
- `HACKING...` 같은 유치한 연출

전체적인 인상은 다음과 같다.

> 깔끔하고 현대적이며 실제로 존재할 법한 보안/조사 플랫폼 + 점차 드러나는 미스터리

---

# 2. 이번 구현 범위

반드시 다음 흐름을 구현한다.

```text
/ 또는 Landing
    ↓
PROJECT ROOT 소개
    ↓
Start
    ↓
Interactive Intro
    ↓
Create Account
    ↓
Boot Sequence
    ↓
First-time Setup
    ↓
Desktop
    ↓
Guide / Case App automatically opens
```

첫 번째 실제 사건의 조사 콘텐츠는 이번 범위에서 제외한다.

단, 이후 사건 시스템을 쉽게 붙일 수 있도록 구조를 설계한다.

---

# 3. Landing Page

첫 방문자는 PROJECT ROOT를 소개하는 랜딩 페이지를 본다.

필수 요소:

- `PROJECT ROOT` 워드마크
- 짧은 tagline
- 게임 소개
- 핵심 특징 2~4개
- 메인 `시작하기` CTA

페이지는 지나치게 긴 마케팅 사이트처럼 만들지 않는다.

스크롤을 조금 사용할 수 있지만 첫 화면에서 프로젝트의 정체와 시작 버튼이 명확해야 한다.

카피는 사이버 미스터리 게임임을 알 수 있게 하되 후반 스토리를 스포일러하지 않는다.

예시 톤:

> TRACE THE SIGNAL. FIND THE ROOT.

> 웹과 시스템에 남겨진 흔적을 직접 추적하고 사건의 근원을 찾아라.

문구는 필요하다면 자연스럽게 개선해도 된다.

---

# 4. Interactive Intro

랜딩 페이지에서 시작하기를 누르면 세계관 인트로로 전환한다.

이 화면은 일반적인 설명 페이지가 아니다.

어두운 전체화면에서 짧은 텍스트가 단계별로 나타난다.

사용자는 다음 방법으로 진행할 수 있다.

- `Enter`
- 화면의 continue indicator/button

각 단계는 한두 문장 정도로 짧게 유지한다.

예시 흐름:

```text
Every system leaves a trace.

[ENTER]
```

```text
Every account. Every request. Every mistake.

[ENTER]
```

```text
Most people never notice them.

You will.

[ENTER]
```

이후 PROJECT ROOT에 합류한다는 최소한의 설정을 전달한다.

중요:

- 플레이어를 관찰하고 있다는 후반 반전을 공개하지 않는다.
- 조직의 악의적인 목적을 암시하는 노골적인 문장을 넣지 않는다.
- 처음에는 정상적인 사이버 조사/분석 시스템처럼 느껴져야 한다.

마지막에는 `시작하기` 또는 `CREATE YOUR IDENTITY`와 같은 명확한 CTA를 표시한다.

---

# 5. Account Creation

게임 서비스 계정과 가상 OS 사용자 계정은 동일하다.

사용자에게 계정을 두 번 만들게 하지 않는다.

필드:

- Username
- Email
- Password
- Confirm Password

필수 UX:

- client-side validation
- username validation
- email validation
- password confirmation
- loading state
- readable error messages

백엔드가 아직 없다면 MVP에서는 로컬 상태/스토리지를 사용해도 된다.

단, 인증 계층을 나중에 실제 API로 교체하기 쉽게 분리한다.

비밀번호를 localStorage 등에 평문으로 저장하지 않는다. 백엔드가 없는 프로토타입이라면 실제 비밀번호 자체를 지속 저장하지 말고 가입 완료 여부와 안전한 프로필 정보만 저장한다.

저장할 프로필 예시:

```ts
interface UserProfile {
  username: string;
  email: string;
  displayName?: string;
  createdAt: string;
  setupCompleted: boolean;
}
```

---

# 6. Boot Sequence

계정 생성이 성공하면 즉시 일반적인 대시보드로 보내지 않는다.

가상 컴퓨터가 처음 부팅되는 전체화면 시퀀스를 보여준다.

PROJECT ROOT 로고를 절제해서 사용한다.

예시 메시지:

```text
PROJECT ROOT

Initializing workspace...
Loading user profile...
Connecting services...
Preparing desktop...
```

메시지는 순차적으로 나타난다.

부팅은 너무 오래 걸리면 안 된다.

약 3~6초 정도의 체감 시간을 목표로 하되 개발 중 쉽게 조정할 수 있도록 한다.

애니메이션 감소 설정(`prefers-reduced-motion`)도 고려한다.

---

# 7. First-time OS Setup

계정 생성 과정에서 username/email을 이미 입력했으므로 다시 입력시키지 않는다.

첫 설정 화면에서는 프로필을 확인하고 가상 OS를 준비하는 정도로 구성한다.

MVP에서 가능한 항목:

- Username 표시
- Email 표시
- Display name 선택 또는 확인
- 기본 테마 선택(optional)
- Continue

불필요한 설정 단계는 만들지 않는다.

목표는 OS에 처음 들어간다는 느낌을 주는 것이지 설치 마법사를 길게 만드는 것이 아니다.

완료하면 `setupCompleted = true`로 저장한다.

---

# 8. Desktop

설정 완료 후 가상 OS Desktop을 렌더링한다.

이 화면은 일반적인 웹 대시보드가 아니라 데스크톱 환경처럼 보여야 한다.

필수 구성:

- wallpaper/background
- system bar 또는 dock
- 현재 시간
- user indicator
- network/status indicator
- app icons
- application windows

초기 앱:

1. Cases / Guide
2. Browser
3. Terminal
4. Mail
5. Files
6. Settings

앱 아이콘은 하나의 일관된 디자인 시스템을 사용한다.

외부 브랜드(Firefox, Chrome, Gmail 등)의 로고를 그대로 사용하지 않는다.

---

# 9. Window System

최소한의 window manager를 만든다.

앱 창은 다음을 지원하는 구조로 설계한다.

- open
- close
- focus
- z-index ordering
- drag

가능하다면 다음도 지원한다.

- minimize
- maximize

하지만 창 시스템 구현 때문에 전체 첫 경험의 완성도가 떨어진다면 open/close/focus/drag를 먼저 완성한다.

컴포넌트는 재사용 가능해야 한다.

예시:

```text
Desktop
 ├─ SystemBar
 ├─ DesktopIcons
 └─ WindowManager
      ├─ AppWindow
      ├─ AppWindow
      └─ ...
```

---

# 10. Cases / Guide App

Desktop에 처음 들어오면 이 앱을 **자동으로 연다.**

별도의 튜토리얼 앱과 노트 앱을 만들지 않는다.

향후 이 앱 하나에서 사건과 조사 정보를 관리한다.

탭 구조를 미리 준비한다.

```text
CASE
INTEL
ACCOUNTS
EVIDENCE
HINT
```

이번 MVP에서는 모든 기능을 구현할 필요는 없다.

첫 실행 시 CASE 화면에 다음과 비슷한 환영 콘텐츠를 표시한다.

```text
Welcome, {username}.

Your workspace is ready.

This console will contain your assigned cases,
collected intelligence and evidence.
```

그 아래에서 OS의 기본 사용법을 아주 짧게 알려준다.

예:

- Browser — 웹과 공개 정보를 조사
- Terminal — 시스템과 네트워크 조사
- Cases — 목표와 발견한 정보 관리

긴 튜토리얼 팝업을 연속으로 띄우지 않는다.

마지막 부분에는 향후 첫 사건을 받을 영역을 만들어 둔다.

예:

```text
CASE 001

No assignment received yet.
```

또는 개발용으로 `Awaiting assignment...`를 사용할 수 있다.

---

# 11. Other Apps — 이번 단계

Browser, Terminal, Mail, Files, Settings는 아이콘과 창을 열 수 있는 정도까지 구현한다.

내용은 placeholder여도 된다.

단순 `TODO` 텍스트 대신 실제 제품처럼 보이는 최소 UI를 만든다.

예:

### Browser

- tab bar
- address/search bar
- empty/new tab state

### Terminal

```text
PROJECT ROOT TERMINAL

{username}@root:~$
```

입력 UI까지 만들어도 좋지만 실제 명령 시스템은 다음 단계다.

### Mail

- inbox layout
- empty state 또는 welcome/system message

### Files

- sidebar
- `/home/{username}` 같은 기본 구조

### Settings

- account/profile
- appearance placeholder

---

# 12. State / Persistence

새로고침했을 때 매번 랜딩부터 시작하면 안 된다.

최소 상태:

```ts
hasAccount
userProfile
setupCompleted
introCompleted
```

예상 동작:

### 신규 사용자

```text
Landing → Intro → Signup → Boot → Setup → Desktop
```

### 가입했지만 Setup 미완료

```text
Boot/Setup
```

### 기존 사용자

```text
Desktop
```

개발 편의를 위해 상태 초기화 기능을 Settings 또는 개발 환경에 제공해도 된다.

---

# 13. Architecture

기존 프로젝트의 기술 스택과 구조가 있다면 그것을 우선 존중한다.

먼저 repository를 분석하고 현재 프레임워크, routing, styling 방식을 파악한 뒤 구현한다.

불필요하게 프로젝트 전체를 갈아엎지 않는다.

새 프로젝트라면 권장 구조 예시는 다음과 같다.

```text
src/
  apps/
    cases/
    browser/
    terminal/
    mail/
    files/
    settings/

  components/
    desktop/
    window/
    ui/

  features/
    auth/
    intro/
    onboarding/

  stores/

  lib/

  routes/
```

UI와 게임 상태 로직을 지나치게 한 파일에 몰아넣지 않는다.

---

# 14. Visual Direction

키워드:

- minimal
- dark
- professional
- restrained
- mysterious
- operating system
- security workstation

컬러는 거의 무채색 기반으로 시작하고 하나의 accent color를 사용한다.

과도한 glow를 피한다.

타이포그래피는 읽기 쉬운 sans-serif를 기본으로 한다.

터미널/시스템 정보에만 monospace를 사용한다.

모든 텍스트를 monospace로 만들지 않는다.

둥근 모서리는 현대적이되 지나치게 모바일 앱처럼 보이지 않도록 한다.

---

# 15. Interaction Quality

다음 부분에 특히 신경 쓴다.

- hover/focus states
- keyboard navigation
- Enter로 intro 진행
- 자연스러운 route/screen transition
- window opening animation
- button loading states
- form validation feedback
- responsive layout
- `prefers-reduced-motion`

애니메이션은 분위기를 만드는 데 사용하되 사용자를 기다리게 하는 장식이 되어서는 안 된다.

---

# 16. Do Not

이번 구현에서 하지 말 것:

- 실제 외부 시스템을 대상으로 하는 침투 기능
- 실제 credential 수집
- 실제 네트워크 스캐닝
- 첫 사건 전체 구현
- 복잡한 가상 인터넷 구현
- 실제 SSH/nmap 등 실행
- 과도한 lore 노출
- 후반 반전 스포일러
- 외부 유명 서비스의 로고/브랜드를 그대로 복제

보안 관련 게임플레이는 이후에도 PROJECT ROOT 내부의 가상 시스템/샌드박스로 한정한다.

---

# 17. Acceptance Criteria

작업 완료 전 직접 전체 흐름을 테스트한다.

신규 상태에서:

1. 랜딩 페이지가 정상적으로 표시된다.
2. Start를 누르면 intro가 시작된다.
3. Enter로 intro를 끝까지 진행할 수 있다.
4. 계정 생성 폼이 정상적으로 검증된다.
5. 가입 완료 후 boot sequence가 실행된다.
6. first-time setup이 열린다.
7. setup 완료 후 Desktop이 나타난다.
8. Desktop에 기본 앱 아이콘이 존재한다.
9. Cases/Guide 앱이 자동으로 열린다.
10. 다른 기본 앱도 열고 닫을 수 있다.
11. 새로고침해도 사용자 상태가 유지된다.
12. 기존 사용자는 불필요하게 onboarding을 반복하지 않는다.
13. 브라우저 콘솔에 치명적인 오류가 없다.
14. 주요 화면이 일반적인 노트북/데스크톱 해상도에서 깨지지 않는다.

---

# 18. 구현 순서 권장

1. 기존 repository 분석
2. app routing/state 구조 결정
3. Landing
4. Intro
5. Signup
6. persistence
7. Boot
8. Setup
9. Desktop shell
10. Window manager
11. Cases/Guide
12. placeholder apps
13. transitions/polish
14. 전체 신규 사용자 흐름 테스트
15. 새로고침/재방문 흐름 테스트

기능만 연결한 와이어프레임 수준에서 끝내지 말고, **첫 실행 경험 자체가 PROJECT ROOT의 분위기를 전달할 정도로 시각적 완성도를 갖추는 것**을 목표로 한다.
