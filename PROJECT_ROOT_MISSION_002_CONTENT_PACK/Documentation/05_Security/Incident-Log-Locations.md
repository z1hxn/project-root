# Incident Log Locations

중앙 개발 스토리지의 `logs` share에는 사건 검토에 필요한 read-only 로그가 수집된다.

- `auth/` — 사용자 및 서비스 인증 이벤트
- `application/` — API, worker, scheduler 이벤트
- `build/` — build runner 및 deploy 기록
- `system/` — 유지보수 및 시스템 이벤트

인증 사건은 먼저 `auth` 기록에서 대상 계정의 baseline을 확인한다. 의심 시각에 자동화 작업이 있었는지 판단하려면 build/application/system 기록을 교차 확인한다.

하나의 로그 한 줄만으로 결론을 내리지 않는다.
