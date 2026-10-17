export const OLD_RECORD_URL = 'https://projectroot.kro.kr/resources/archive-guide';
export const CURRENT_RECORD_URL = 'https://projectroot.kro.kr/records/archive-guide';
export const CHANGELOG_URL = 'https://github.com/seoha-y/archive-index';
export const CASE_EXPORT_ROOT = '/network/PROJECT ROOT/Case Exports/Build Alert';
export const buildEvidence = {
  runner: 'case/build-runner.log',
  schedule: 'case/scheduler.log',
  auth: 'case/auth-excerpt.log',
} as const;
export const buildEvidenceFiles: Record<string, string> = {
  [buildEvidence.runner]: `${CASE_EXPORT_ROOT}/build-runner.log`,
  [buildEvidence.schedule]: `${CASE_EXPORT_ROOT}/scheduler.log`,
  [buildEvidence.auth]: `${CASE_EXPORT_ROOT}/auth-excerpt.log`,
};
export function evidenceForFile(path: string) {
  return Object.entries(buildEvidenceFiles).find(([, file]) => file === path)?.[0];
}
export const caseMissions = [
  { id: 'orientation-001', code: 'MISSION 001', title: '워크스테이션 둘러보기', description: '첫 임무가 배정되었습니다. 컴퓨터를 자유롭게 탐색하며 조사 도구를 익혀 보세요.', objective: 'Firefox, Dolphin, Konsole과 KWrite를 자유롭게 열어 보세요. 모든 앱을 확인할 필요는 없습니다. 준비가 되면 Firefox에서 PROJECT ROOT 공식 사이트에 접속하세요.', status: '진행 중 · 환경 탐색' },
  { id: 'public-record-002', code: 'MISSION 002', title: '사라진 링크', description: '오래된 공개 자료 주소가 열리지 않습니다. 자료가 삭제됐는지, 새 주소로 옮겨졌는지 확인하세요.', objective: 'KMail의 요청을 읽고 Firefox에서 현재 공식 자료와 공개 변경 이력을 대조하세요.', status: '진행 중 · 공개 자료 조사' },
  { id: 'build-alert-003', code: 'MISSION 003', title: '새벽의 빌드 알림', description: '01:30의 접근 알림이 사람의 접속인지 예정된 자동 작업인지 확인하세요.', objective: 'Dolphin의 Network → PROJECT ROOT → Case Exports에서 작업·일정·인증 기록을 비교하세요.', status: '진행 중 · 운영 기록 조사' },
  { id: 'internal-access-004', code: 'MISSION 004', title: '비정상 접근 기록', description: '윤서하 계정의 02:14 접근이 평소 활동과 다른 이유를 조사하세요. 계정의 실제 사용자는 아직 알 수 없습니다.', objective: '내부 인증 기록의 기준선과 의심 세션을 비교하고 공개 기록으로 타임라인을 교차검증하세요.', status: '진행 중 · 내부 접근 조사' },
] as const;
export const caseHints: Record<1 | 2 | 3, string[]> = {
  1: [
    '옛 주소가 열리지 않는다는 사실만으로 자료가 삭제됐다고 판단할 수는 없습니다.',
    'KMail에 적힌 자료 제목으로 Firefox에서 검색하고 게시 주체를 확인해 보세요.',
    '현재 공식 자료와 GitHub의 archive-index 변경 이력에서 옛 주소를 비교하세요.',
  ],
  2: [
    '접근 시각과 계정 이름만으로 사용자의 로그인인지 알 수 없습니다.',
    'Dolphin의 Network → PROJECT ROOT → Case Exports → Build Alert에서 기록 세 개를 열어 보세요.',
    'svc-build의 인증 방식, nightly-build 일정, build-runner-02의 실행 기록을 비교하세요.',
  ],
  3: [
    '계정의 평소 접속 출발지와 인증 방식부터 비교해 보세요. 내부 문서의 개발팀·보안과 감사 분류가 도움이 됩니다.',
    '개발팀 3-1에는 운영 기록의 보관 위치가, 3-2에는 공유에 접근하는 명령행 도구의 사용법이 정리되어 있습니다.',
    '도구가 없다면 패키지 설치 문서를 참고하세요. `smbclient //dev-files.root.internal/logs --use-kerberos=required`로 들어가 인증 기록과 예약 작업 기록을 각각 확인할 수 있습니다.',
  ],
};
