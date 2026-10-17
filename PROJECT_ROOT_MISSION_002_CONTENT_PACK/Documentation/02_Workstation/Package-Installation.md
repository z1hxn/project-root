# Package Installation

PROJECT ROOT Debian workstation은 승인된 패키지를 APT로 관리한다.

패키지 목록을 갱신한 뒤 필요한 패키지를 설치할 수 있다. 설치 전 패키지 이름과 용도를 확인한다. 사건 조사에 필요하지 않은 패키지는 추가하지 않는다.

표준 형식:

    sudo apt update
    sudo apt install <package>

설치 여부는 `which <command>` 또는 각 도구의 version 옵션으로 확인할 수 있다.

내부 파일 공유용 CLI가 필요한 경우 해당 프로토콜 문서에서 Debian package 이름을 먼저 확인한다.
