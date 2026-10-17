# SMB Troubleshooting

SMB resource 접근 문제가 있을 때 확인할 항목:

- hostname/share 이름 오타
- Samba client utilities 설치 여부
- 사건용 read-only credential 사용 여부
- 해당 share에 대한 권한

`public`에 접근된다는 사실이 `projects` 또는 `logs` 권한을 의미하지는 않는다.
