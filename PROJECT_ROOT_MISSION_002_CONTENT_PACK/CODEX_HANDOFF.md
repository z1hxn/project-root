# Codex Handoff

이 pack은 콘텐츠 생성 시간을 줄이기 위한 완성 fixture다.

## 우선순위

1. `PROJECT_ROOT_MISSION_002_REWORK.md`를 전체 요구사항으로 읽는다.
2. `README.md`의 정답 설계를 유지한다.
3. Documentation/log/web fixture 내용을 그대로 게임 데이터에 연결한다.
4. 콘텐츠를 다시 쓰는 데 시간을 쓰지 말고 시스템 구현에 집중한다.
5. 한 실행에서 범위가 너무 크면 아래 phase 순서대로 진행하고 완료 상태를 프로젝트의 TODO에 기록한다.

### Phase 1
Shared VirtualFileSystem / VirtualNetwork / VirtualPackageManager 기반 정리.

### Phase 2
Dolphin Network + Documentation + dev-files.root.internal shares.

### Phase 3
Konsole package state + 가상 APT + smbclient 동작 연결.

### Phase 4
MISSION 002 UI, logs, evidence, Incident Report 검증.

### Phase 5
Index 제거, Google 기반 검색 경험, GitHub/Threads Virtual Web, service-level 404, Firefox loading state.

### Phase 6
통합 테스트 및 persistence/routing/state 버그 수정.

각 phase에서 기존 기능을 깨뜨리지 말고 테스트 후 다음 단계로 진행한다.
