# PROJECT ROOT — MISSION 002 Content Pack

이 폴더는 MISSION 002 「비정상 접근 기록」 구현용 완성 콘텐츠 팩이다.
Codex는 문서/로그/웹 콘텐츠를 새로 창작하지 말고 이 파일의 내용을 fixture/source-of-truth로 사용한다.

## Codex가 할 일
1. 기존 KDE/Firefox/Dolphin/Konsole/Project Root UI를 유지한다.
2. `Documentation/` 내용을 Virtual File System / Dolphin Network에 배치한다.
3. `logs/` 내용을 `dev-files.root.internal`의 read-only `logs` share에 배치한다.
4. `web/` fixture를 Firefox의 Virtual Web/Search 계층에 연결한다.
5. 실제 외부 SMB/SSH 등에 접속하지 않는다. 모든 내부 host는 Virtual Network에서만 처리한다.
6. 문구를 임의로 요약하거나 정답성 문구를 추가하지 않는다.
7. 구현 중 콘텐츠가 더 필요하면 우선 기존 파일을 재사용하고, 미션 해결에 필수인 경우에만 최소한으로 추가한다.

## 의도된 조사 흐름
Project Root → Dolphin/Network → Documentation → SMB/도구 파악 → Konsole → smbclient 설치 → dev-files.root.internal → logs → baseline 비교 → 09/26 의심 이벤트 → Firefox/Google → GitHub/Threads 공개 기록 → Incident Report.

## 정답 설계
- 대상 계정: `yseoha`
- 마지막 정상 interactive session: 2026-09-24 18:42 KST / `ws-17.root.internal` / `dev-portal`
- 의심 이벤트: 2026-09-26 02:14 KST / `ops-jump-03.root.internal` / `dev-portal`
- false positive: 2026-09-26 01:30 `svc-build` scheduled build runner activity
- 공개 타임라인: 윤서하의 마지막 확인 가능한 공개 활동은 2026-09-24 저녁으로 내부 정상 세션과 양립하며, 09/26 02:14 활동을 윤서하 본인이라고 확정할 공개 근거는 없음.
- 최종 판단: `승인되지 않은 접근 가능성 / 추가 확인 필요`

자세한 시스템 변경 요구사항은 `PROJECT_ROOT_MISSION_002_REWORK.md`를 따른다.
