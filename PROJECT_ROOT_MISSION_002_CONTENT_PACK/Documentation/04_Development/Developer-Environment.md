# Developer Environment

개발자는 표준 workstation과 내부 개발 서비스를 사용한다. 사용자 interactive session과 자동화 서비스는 가능한 한 별도 계정으로 구분한다.

일반적인 interactive 개발 접근은 사내 workstation에서 발생한다. CI/build 작업은 `svc-*` 형식의 service account 및 runner host에서 발생할 수 있다.

야간 시간대의 이벤트 자체는 이상 징후가 아니다. build runner, backup, scheduled maintenance의 경우 정상적으로 심야 기록이 생성된다.
