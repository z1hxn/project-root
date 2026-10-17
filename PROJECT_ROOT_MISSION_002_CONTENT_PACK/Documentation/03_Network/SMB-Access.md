# SMB Access from Linux

일부 내부 파일 서비스는 SMB를 사용한다. KDE/Dolphin에서 지원되는 리소스는 GUI로 탐색할 수 있지만, 로그 검토나 파일 목록 확인처럼 반복적인 작업에는 CLI가 더 편리할 수 있다.

Debian에서 SMB/CIFS 공유를 다루는 표준 Samba client package는 **`smbclient`** 이다.

패키지가 없는 워크스테이션에서는 승인된 APT 절차로 설치한다. 설치 절차는 `02_Workstation/Package-Installation.md`를 참고한다.

사건용 credential이 별도로 할당된 경우 개인 계정 대신 사건 범위에 지정된 read-only credential을 사용한다. 인증정보를 문서에 복사해 저장하지 않는다.
