# PROJECT ROOT — System & Mission 002 Rework

> Codex implementation brief

## 핵심 방향

현재 PROJECT ROOT의 시스템과 MISSION 002를 함께 개편한다.

MISSION 002의 핵심은 윤서하의 신원 확인이 아니라 **PROJECT ROOT 내부 개발 환경에서 발견된 비정상 접근 기록을 조사하는 것**이다.

플레이 흐름:

`Project Root → Dolphin → 내부 문서 → Terminal → 내부망 → 로그 분석 → Firefox → 공개 기록 교차검증 → Incident Report`

기존 KDE Plasma 스타일, Firefox, Dolphin, Konsole, Project Root 앱, Virtual File System과 디자인 언어는 유지한다.

모든 내부 host, credential, account, log는 게임 내부의 허구 데이터다. Terminal의 네트워크 명령은 PROJECT ROOT Virtual Network에만 작동하며 실제 임의의 외부 서버로 연결하지 않는다.

---

## 1. MISSION 002 — 비정상 접근 기록

**CASE TYPE**  
Internal Access Review

**STATUS**  
ACTIVE

**SEVERITY**  
UNDER REVIEW

**SUBJECT**  
윤서하

**EVENT**  
Unusual authentication activity

### 사건 설명

PROJECT ROOT 내부 개발 환경에서 평소와 다른 인증 활동이 감지되었습니다.

해당 기록은 내부 분석 담당자 윤서하에게 할당된 계정과 연관되어 있습니다. 그러나 윤서하는 최근 72시간 동안 정상적인 내부 활동이 확인되지 않고 있습니다.

현재 확보된 정보만으로 해당 접근이 정상 작업, 자동 프로세스, 기록 오류 또는 승인되지 않은 접근 중 무엇인지 판단할 수 없습니다.

내부 기록을 확보하고 기존 활동과 비교하여 해당 이벤트의 성격을 확인하십시오.

### Objectives

- [ ] 내부 기록 위치 확인
- [ ] 기록 접근에 필요한 도구 확인
- [ ] 인증 기록 확보
- [ ] 정상 기록과 비정상 기록 비교
- [ ] 관련 계정 및 의심 이벤트 확인
- [ ] 공개 기록으로 타임라인 교차검증
- [ ] Incident Report 제출

Mission UI에서 서버 주소, share 이름, 필요한 패키지, 정확한 로그 파일, 필요한 명령어, 윤서하의 공개 계정을 직접 알려주지 않는다.

---

## 2. 조사 흐름

```text
MISSION 확인
→ Dolphin
→ Network / 내부 문서
→ 서버·프로토콜·도구 정보 수집
→ 필요한 Linux package 판단
→ Konsole
→ package 설치
→ PROJECT ROOT Virtual Network 접속
→ 내부 파일과 로그 탐색
→ 인증 기록 발견
→ 정상 기록과 비교
→ false positive 배제
→ 윤서하 관련 의심 이벤트 식별
→ Firefox
→ Google / 공개 웹서비스 조사
→ 공개 활동과 내부 로그 시간 비교
→ Project Root
→ Incident Report
```

정답으로 향하는 전용 버튼이나 일직선 링크 체인을 만들지 않는다. 동시에 억지 보물찾기도 피한다.

---

## 3. Dolphin — Network

Dolphin sidebar의 **네트워크**를 실제 게임 기능으로 확장한다.

```text
Network
└── PROJECT ROOT
    ├── Documentation
    ├── Shared
    └── Internal Services
```

Documentation은 내부 기술 문서 저장소다. Shared에는 미션과 무관한 업무 자료도 존재한다. Internal Services에는 개발/빌드/스토리지 리소스가 표시되며 일부는 인증이나 별도 도구가 필요하다.

Dolphin과 Terminal은 반드시 동일한 Virtual Network / Virtual File System state를 바라봐야 한다.

---

## 4. Internal Documentation

```text
Documentation/
├── 01_Getting_Started/
├── 02_Workstation/
├── 03_Network/
├── 04_Development/
├── 05_Security/
├── 06_Troubleshooting/
└── Archive/
```

예시 문서:

```text
Workstation-Setup.pdf
Network-Resources.txt
SMB-Access.md
Remote-Access.md
Package-Installation.md
Developer-Environment.md
Incident-Log-Locations.md
VPN-Troubleshooting.md
Account-Policy.md
Password-Reset.md
Legacy-Services.md
```

필요한 정보를 한 파일에 몰아넣지 않는다.

`Network-Resources.txt`에서는 예를 들어 다음 내부 리소스의 역할과 hostname을 확인할 수 있다.

```text
Documentation        docs.root.internal
Development Storage  dev-files.root.internal
Build Storage        build.root.internal
Archive              archive.root.internal
```

`SMB-Access.md`에서는 일부 내부 파일 서비스가 SMB를 사용하며 Linux workstation에서 Samba client utilities를 사용한다는 일반적인 운영 정보를 제공한다.

`Package-Installation.md`에서는 승인된 Debian package를 APT로 설치하는 일반적인 절차를 설명한다.

문서에 “다음 단서는 여기 있습니다” 같은 게임식 표현을 쓰지 않는다.

---

## 5. 실제 존재하는 기술 기반

이번 미션의 기술은 실제 존재하는 것을 기반으로 한다.

- Debian GNU/Linux
- KDE Plasma
- Dolphin
- Konsole
- Firefox
- SMB
- Samba
- `smbclient`
- APT

실제 기술의 이름과 일반적인 사용 감각을 참고하되 실제 네트워크에 연결하지 않고 PROJECT ROOT Virtual Network가 동작을 시뮬레이션한다.

---

## 6. Virtual Package Manager

초기에는 `smbclient`가 설치되어 있지 않다.

설치 전 실행하면 Debian 환경처럼 자연스러운 command-not-found 상태를 표시한다.

가상 환경에서 패키지를 설치할 때 실제 package-manager UX와 비슷한 진행 출력을 보여준다.

```text
Reading package lists...
Building dependency tree...
The following NEW packages will be installed:
...
Setting up smbclient ...
```

설치 상태는 Game State에 저장한다.

```ts
installedPackages: {
  smbclient: true
}
```

설치 후 `which smbclient`, version 확인 등 기본 상태 확인도 일관되게 동작시킨다.

실제 사용자 컴퓨터에는 아무것도 설치하지 않는다.

---

## 7. 접근 권한

비밀번호를 아무 문서에 평문으로 숨겨두는 퍼즐은 만들지 않는다.

MISSION 002 배정 시 사건 조사를 위한 read-only analyst access가 플레이어에게 부여되는 구조를 사용한다.

플레이어는 내부 문서를 통해 어디에 접근해야 하는지, 어떤 프로토콜인지, 어떤 도구가 필요한지, 도구를 어떻게 준비하는지를 알아낸다.

---

## 8. Virtual SMB Network

`dev-files.root.internal` 같은 내부 host를 구현한다.

예시 share:

```text
public
projects
logs
```

일부 share는 접근 가능하고 일부는 권한이 없다. `logs`는 사건용 read-only 권한으로 접근 가능하다.

Terminal의 네트워크 명령은 arbitrary hostname/IP로 실제 연결하지 않는다. 등록된 Virtual Network host만 해석한다.

Terminal에서 게임 내부 파일을 Downloads로 가져오면 Dolphin에서도 같은 파일이 실제로 보여야 한다.

---

## 9. Log Storage

`logs/answer.txt` 같은 구조는 금지한다.

```text
logs/
├── auth/
│   ├── auth-2026-09-23.log
│   ├── auth-2026-09-24.log
│   ├── auth-2026-09-25.log
│   └── auth-2026-09-26.log
├── application/
│   ├── api.log
│   ├── worker.log
│   └── scheduler.log
├── build/
│   ├── build-runner.log
│   └── deploy-history.log
├── deploy/
├── archive/
└── system/
```

대부분은 정상 기록이며 미션과 직접 관계없는 로그도 충분히 존재해야 한다.

---

## 10. 로그 분석이 메인 퍼즐

인증 로그는 예를 들어 다음 필드를 사용한다.

```text
timestamp
account
service
source
result
session
method
```

윤서하 계정의 과거 정상 기록을 여러 개 만들고, 정상 기록은 시간대, workstation, service, authentication pattern 등에 일관성을 갖게 한다.

이후 특정 이벤트에서 일부 패턴이 달라진다.

- 평소와 다른 시간
- 평소와 다른 internal source
- 평소 사용하지 않던 service
- session pattern 차이

로그에 `HACKER`, `ATTACK`, `SUSPICIOUS USER` 같은 정답성 문구는 절대 넣지 않는다.

플레이어가 정상 기록과 비교해 이상성을 판단해야 한다.

---

## 11. False Positive

최소 하나 이상의 그럴듯한 false positive를 넣는다.

예:

- scheduled backup
- build runner
- automated deployment
- service account
- nightly maintenance

처음에는 이상해 보이지만 관련 문서나 다른 로그를 확인하면 정상 자동 작업임을 알 수 있게 한다.

즉 `새벽 이벤트 = 공격`으로 판단할 수 없게 한다.

---

## 12. 공개 조사는 후반 교차검증

공개 조사는 전체 미션의 중심이 아니라 후반부 corroboration 단계다.

내부 로그에서 먼저 account, 마지막 정상 session, 의심 session, 관련 project/service, timestamp를 확보한다.

그 후 Firefox에서 공개 기록을 조사해 **내부 로그의 시점과 윤서하의 알려진 공개 활동이 모순되는지** 확인한다.

공개 기록만으로 계정 탈취나 침입을 확정하지 않는다.

---

## 13. Index 제거 — Google로 변경

현재 자체 검색엔진 `Index`를 제거한다.

Firefox의 기본 검색 경험을 **Google** 기반으로 변경한다.

검색 페이지와 address-bar 검색 모두 Google 기반 경험을 사용한다.

단, PROJECT ROOT의 허구 인물/사건 데이터를 실제 Google 서버에 전송해서 미션을 해결하는 구조로 만들지 않는다. 게임에 필요한 허구 검색 결과는 Virtual Web/Search 데이터 계층에서 제공한다.

일반적인 실제 웹 탐색과 게임의 허구 검색 결과를 기술적으로 분리한다.

기존 bookmark, homepage, search-provider에서도 Index를 제거한다.

---

## 14. 가상 `Profile` 서비스 제거

현재 `Profile` / `profile.root` 서비스는 완전히 제거한다.

LinkedIn 비슷한 자체 가상 브랜드를 새로 만들지 않는다.

공개 경력이나 개발 활동이 필요하다면 실제 존재하는 서비스의 종류를 사용한다.

예:

- **LinkedIn** — 공개 경력/소속 정보가 실제로 필요한 경우
- **GitHub** — 개발자 공개 프로필, repository, commit, issue, release 등의 활동
- **Threads** — 공개 소셜 게시물
- 일반 공개 웹사이트/블로그

MISSION 002에서 굳이 모든 서비스를 사용하게 만들 필요는 없다.

실제 서비스 이름을 사용하더라도 윤서하 등 허구 인물의 게임용 계정/게시물은 Virtual Web 안에서 재현된 허구 데이터이며 실제 사람이나 실제 계정을 조사 대상으로 사용하지 않는다.

---

## 15. GitHub

윤서하의 공개 개발/데이터 활동이 필요하다면 GitHub를 활용한다.

활용 가능한 공개 흔적:

- profile activity
- repository
- commit timestamp
- issue
- release
- README
- public project information

GitHub 한 페이지에 정답을 노골적으로 적지 않는다.

필요한 경우 다음과 같은 자연스러운 route 구조를 지원한다.

```text
github.com/
github.com/<user>
github.com/<user>/<repo>
```

MISSION과 관계없는 repository와 activity도 존재하게 한다.

---

## 16. Threads를 완전한 서비스처럼 구현

현재처럼 윤서하 관련 프로필 하나만 있는 미션용 페이지로 만들지 않는다.

최소한 다음 화면을 구현한다.

- Home
- Search
- User Profile
- Post
- Replies
- User Not Found
- Post Not Found

여러 사용자와 게시물을 추가한다. 개발, 음악, 사진, 일상, 오픈소스, Linux, 데이터, 디자인 등 미션과 관계없는 콘텐츠가 대부분이어야 한다.

---

## 17. Web Routing / 404 수정

현재 Virtual Web의 중요한 문제를 수정한다.

도메인 자체는 존재하지만 특정 user/page가 존재하지 않을 경우 Firefox 자체 네트워크 오류를 보여주면 안 된다.

### Domain 자체가 없음

Firefox 스타일의 DNS/server error.

### Domain은 있지만 route/user/post가 없음

해당 웹서비스 자체의 Not Found UI.

예:

```text
User not found

The profile you're looking for doesn't exist.
```

서비스의 정상 header/navigation은 그대로 표시한다.

### Authentication required

해당 서비스의 로그인/권한 UI.

### Internal service unavailable

서비스 자체 unavailable/error UI.

### Valid route

정상 페이지.

이 원칙을 GitHub, Threads, LinkedIn 등 구현되는 모든 Virtual Web service에 공통 적용한다.

---

## 18. Virtual Web을 미션 URL 모음처럼 만들지 말 것

각 서비스는 최소한 다음 개념을 갖는다.

```ts
service
routes
users
content
search
navigation
notFound
```

각 서비스의 `/` route도 실제로 존재해야 한다.

특정 미션 URL을 벗어나는 순간 Firefox 오류가 뜨는 구조를 제거한다.

미션과 관계없는 콘텐츠를 충분히 추가해서 **이 사이트가 사건 하나를 위해 존재한다는 느낌**을 없앤다.

---

## 19. Firefox 로딩 시스템

현재처럼 페이지가 즉시 전환되지 않게 한다.

모든 navigation에 짧은 loading state를 적용하고 고정 delay가 아니라 범위 내 랜덤 지연을 사용한다.

예시:

```text
cached/local       100–350ms
normal virtual web 300–1000ms
heavier page       500–1400ms
internal service   150–700ms
```

실제 플레이 테스트 후 UX에 맞게 조절한다.

구현 요소:

- tab loading indicator
- loading state
- title update timing
- favicon update timing
- address-bar navigation state
- browser history
- back/forward
- cache-like faster revisit

빠르게 여러 navigation이 발생했을 때 이전 request가 늦게 완료되어 최신 페이지를 덮어쓰지 않도록 cancellation 또는 navigation ID를 구현한다.

---

## 20. Google 검색 경험

Firefox address bar 검색과 Google homepage 검색은 같은 검색 계층을 사용한다.

MISSION 관련 검색 결과가 한두 개만 나오지 않게 한다.

윤서하를 검색한다면 예를 들어:

- 관련 GitHub activity
- 관련 Threads 기록
- 동명이인
- 비슷한 username
- 관련 없는 부분 일치
- 오래된 결과
- 일반 웹페이지

등을 섞는다.

정답 결과를 항상 첫 번째에 두지 않는다.

검색 결과의 title, URL, snippet, date가 플레이어 판단에 도움이 되게 한다.

---

## 21. Hint System

### HINT 1
사건 화면에 필요한 정보가 전부 있는 것은 아닙니다. 워크스테이션에 제공된 내부 자료를 확인해보세요.

### HINT 2
Dolphin은 로컬 파일만 탐색하는 도구가 아닙니다. 사이드바의 네트워크 항목도 확인해보세요.

### HINT 3
내부 문서에는 서버 위치뿐 아니라 서비스 접근 방식도 정리되어 있습니다.

### HINT 4
파일 저장소가 사용하는 프로토콜을 확인한 뒤 Linux에서 해당 프로토콜을 다루는 도구를 찾아보세요.

### HINT 5
SMB 파일 서비스에는 Samba client utilities를 사용할 수 있습니다. 패키지 관련 내부 문서도 확인해보세요.

### HINT 6
개발 파일 서버의 기록 중 인증과 관련된 로그를 찾아보세요.

### HINT 7
이상해 보이는 기록 하나만 보지 말고 같은 계정의 이전 정상 기록과 비교하세요.

### HINT 8
새벽에 실행된 이벤트가 모두 사용자 접근인 것은 아닙니다. 자동 작업과 사용자 세션을 구분하세요.

### HINT 9
윤서하 계정의 마지막 정상 세션과 이후 세션의 source/service 차이를 확인하세요.

### HINT 10
내부 기록에서 확인한 타임라인을 공개 활동 기록과 비교해보세요.

힌트 사용량은 `mission002HintsUsed`로 Game State에 저장한다.

---

## 22. Incident Report

기존의 `공개 사용자명 + URL 두 개` 보고서는 제거한다.

최종 제출은 사건 조사 결과 중심으로 변경한다.

### Account
조사 대상 account.

### Suspicious Event
발견한 log event.

### Last Known Normal Activity
마지막 정상 활동.

### Internal Evidence
확보한 내부 log/evidence.

### Public Corroboration
Firefox 조사에서 확보한 공개 기록.

### Assessment

- 정상 활동으로 판단
- 추가 확인 필요
- 승인되지 않은 접근 가능성
- 판단 불가

### Analyst Note
판단 근거를 짧게 작성.

MISSION 002에서 확보 가능한 증거보다 강한 결론을 요구하지 않는다.

적절한 결론이 `승인되지 않은 접근 가능성이 있으며 추가 조사가 필요하다` 정도라면 거기서 끝낸다.

---

## 23. Mission Completion

```text
INVESTIGATION COMPLETE

MISSION 002
비정상 접근 기록

ACCOUNT
윤서하

EVENT
2026-09-26 02:14
Unusual Authentication

INTERNAL RECORD
VERIFIED

PUBLIC TIMELINE
CORROBORATED

ASSESSMENT
REQUIRES FURTHER REVIEW
```

하단:

```text
확인된 기록이 사건 검토 대상으로 등록되었습니다.

추가 분석을 위해 관련 내부 접근 기록이 보존되었습니다.

● 조사 완료 · 다음 임무 대기
```

이번 미션에서는 정확히 누가 접근했는지, 실제 계정 탈취인지, 윤서하에게 무슨 일이 있었는지, 사건의 배후가 무엇인지는 밝히지 않는다.

---

## 24. Shared State Architecture

Dolphin, Konsole, Firefox, Project Root가 각각 독립된 하드코딩 데이터로 동작하면 안 된다.

공통 state/service layer를 사용한다.

```text
VirtualFileSystem
VirtualNetwork
VirtualPackageManager
VirtualWeb
MissionState
EvidenceState
BrowserState
```

예:

1. Terminal에서 내부 서버의 파일을 게임 속 Downloads로 가져온다.
2. VirtualFileSystem이 변경된다.
3. Dolphin에서 같은 파일이 보인다.
4. 파일을 열어 내용을 확인할 수 있다.
5. Evidence로 등록하면 Project Root도 같은 artifact를 참조한다.

앱들이 하나의 컴퓨터를 공유하고 있다는 느낌이 나야 한다.

---

## 25. Final Playtest

정답을 모르는 플레이어 관점에서 처음부터 테스트한다.

```text
Project Root
→ MISSION 002
→ Dolphin
→ Network
→ Documentation
→ 여러 문서 조사
→ 개발 파일 서버 파악
→ SMB 사용 확인
→ smbclient 필요성 확인
→ package 문서 확인
→ Konsole
→ 가상 package 설치
→ Virtual SMB resource 접근
→ 여러 share/file 조사
→ auth logs 발견
→ 정상 기록 분석
→ false positive 배제
→ 윤서하 계정의 비정상 이벤트 식별
→ timestamp 확보
→ Firefox
→ Google
→ GitHub / Threads 등 공개 기록 조사
→ 공개 활동과 내부 로그 타임라인 비교
→ Project Root
→ Incident Report
→ 검증
→ MISSION COMPLETE
```

함께 테스트할 것:

- dead links
- route mismatch
- service-level 404
- Firefox-level network errors
- browser history
- loading race conditions
- Terminal/Dolphin filesystem consistency
- package-state persistence
- mission-state persistence
- report-state persistence
- reload 후 save 복구
- evidence 중복 등록
- 잘못 제출한 뒤 입력값 유지

---

## 26. Design Principle

이번 개편은 단순히 미션 단계를 늘리는 작업이 아니다.

플레이어가 다음과 같이 실제 워크스테이션을 사용하는 사고 과정을 경험해야 한다.

```text
뭘 조사해야 하지?
→ 관련 자료가 어디 있지?
→ 이 서버는 뭘 쓰지?
→ 어떤 도구가 필요하지?
→ 어떻게 준비하지?
→ 어떤 기록을 봐야 하지?
→ 이 기록은 정말 이상한가?
→ 정상 기록과 뭐가 다르지?
→ 공개 기록과도 맞아떨어지나?
→ 현재 증거로 어디까지 결론 내릴 수 있지?
```

게임이 답을 버튼으로 직접 제공하지 않는다.

반대로 필요한 정보가 억지로 숨겨져 있어서도 안 된다.

각 문서, 서버, 파일, 로그, 웹페이지에는 그 세계 안에서 존재할 현실적인 이유가 있어야 한다.

MISSION과 관계없는 문서, 파일, 로그, 사용자, repository, 게시물도 충분히 존재하게 만들어 PROJECT ROOT의 세계가 현재 사건보다 훨씬 크다는 인상을 준다.

현재 완성된 KDE Plasma / Firefox / Dolphin / Konsole / Project Root 디자인을 유지하면서 시스템을 확장하라.
