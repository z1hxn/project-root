# Account Policy

사용자 계정과 service account는 용도를 구분한다.

- 일반 사용자 계정: interactive login 및 사용자 작업
- `svc-*`: 자동화/서비스 전용

interactive 계정이 평소와 다른 source host 또는 평소 사용하지 않던 service에서 사용된 경우 그 사실만으로 사고를 확정하지 말고 이전 baseline과 변경 기록을 함께 검토한다.

사용자가 부재 중이라는 사실 역시 단독으로 계정 탈취를 증명하지 않는다.
