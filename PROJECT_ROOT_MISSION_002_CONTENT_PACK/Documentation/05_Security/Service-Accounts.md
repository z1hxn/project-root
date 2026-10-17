# Service Accounts

자동화 계정은 `svc-` prefix를 사용한다.

현재 주요 계정:

- `svc-build` — CI build runner
- `svc-deploy` — 승인된 deployment automation
- `svc-backup` — nightly storage backup

이 계정들은 야간에도 정상적으로 동작할 수 있다. 일반 사용자 계정과 동일한 기준으로 시간대만 보고 이상으로 분류하지 않는다.
