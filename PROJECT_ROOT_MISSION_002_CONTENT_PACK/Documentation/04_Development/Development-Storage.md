# Development Storage

Development Storage는 `dev-files.root.internal`에서 제공된다. 주요 공유는 다음과 같다.

- `public` — 공용 개발 자료
- `projects` — 프로젝트 자료 (권한별 접근)
- `logs` — 중앙 수집 운영 기록 (승인된 분석 권한은 read-only)

파일 서비스는 SMB를 사용한다. Linux CLI 접근이 필요한 경우 Network 문서의 `SMB-Access.md`를 참고한다.

`logs` 아래 기록은 종류별 디렉터리로 나뉜다. 인증 이벤트는 `auth`, 애플리케이션 이벤트는 `application`, 빌드 자동화는 `build`에 저장된다.
