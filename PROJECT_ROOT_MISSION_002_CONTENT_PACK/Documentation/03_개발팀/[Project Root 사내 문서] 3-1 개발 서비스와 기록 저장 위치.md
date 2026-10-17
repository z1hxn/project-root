# [Project Root 사내 문서] 3-1 개발 서비스와 기록 저장 위치

문서 번호: PR-DEV-3-1 | 담당: 개발 인프라팀 | 적용일: 2026-09-12 | 개정: 2.6 | 등급: 사내

## 서비스 개요
개발팀은 문서 배포, 소스 및 빌드 작업, 중앙 운영 기록을 서로 다른 서비스로 나누어 관리한다. 서비스 주소는 내부 DNS 기준이며, 호스트가 보인다는 것만으로 모든 공유에 접근할 수 있는 것은 아니다. 아래 표는 신규 구성원이 서비스의 역할을 이해하기 위한 목록이다.

| 호스트 | 역할 | 주요 자료 |
| --- | --- | --- |
| `docs.root.internal` | 운영 문서 배포 | 표준 절차와 변경 공지 |
| `dev-files.root.internal` | 개발 파일 서비스 | 공개 협업 자료, 제한된 프로젝트 자료, 읽기 전용 운영 기록 |
| `build.root.internal` | 빌드 인프라 | runner와 산출물 처리 |
| `archive.root.internal` | 장기 보존 | 보존 기한이 지난 묶음 자료 |

## 개발 파일 서비스
`dev-files.root.internal`은 SMB 공유를 제공한다. `public`은 공용 협업 파일, `projects`는 프로젝트 담당자 전용 작업 공간, `logs`는 사건 재구성과 장애 분석에 쓰는 읽기 전용 기록이다. `projects`에 대한 거부 응답은 해당 공유의 권한 정책이며, `logs`의 접근 방법과 무관하다. 접속 대상은 `//dev-files.root.internal/공유이름` 형식으로 적는다.

`logs` 공유에는 원본 생성 시스템에 따라 다음과 같이 디렉터리를 나눈다.

| 경로 | 보관 내용 | 대표 생성원 |
| --- | --- | --- |
| `auth/` | 일자별 사용자·서비스 인증 이벤트 | 개발 포털, Git 게이트웨이, 저장소 접근 계층 |
| `application/` | API 요청, 예약 작업, 백그라운드 작업 | project-index, scheduler, worker |
| `build/` | 빌드 runner 실행 및 배포 이력 | nightly build, deploy pipeline |
| `system/` | 저장 장치 점검과 유지보수 이벤트 | storage 운영 작업 |

인증 기록은 `auth/auth-YYYY-MM-DD.log` 패턴으로 보관한다. 예약 작업의 실제 실행 여부는 `application/scheduler.log`와 `build/build-runner.log`를 함께 대조한다. API 요청의 후속 흔적은 `application/api.log`에서 볼 수 있다. 날짜만 같다는 이유로 서로 다른 세션을 묶지 않으며, 인증 기록의 `session`과 서비스 기록의 `actor`, `source`, 시각을 나란히 적는다.

## 열람 경계
중앙 기록은 Dolphin에 마운트되어 있지 않다. 관리형 KDE 이미지의 SMB KIO worker가 제공되지 않으므로 Dolphin의 네트워크 위치에서 서버를 탐색하는 방식은 사용하지 않는다. 사내 Kerberos 세션을 이용하는 승인된 명령행 도구로 필요한 파일만 작업 사본으로 받아 로컬에서 연다. 익명 접속은 허용하지 않는다. 도구 사용과 오류 대응은 3-2를 참고한다. 사건별로 제공된 내보내기 폴더는 검토 편의를 위한 발췌본이며, 중앙 `logs` 공유의 전체 기록과 범위가 다를 수 있다.

관련 문서: 2-1 관리형 워크스테이션, 3-2 SMB 클라이언트, 4-1 기록 보존.
