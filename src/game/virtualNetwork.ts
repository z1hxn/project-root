import content from './mission002-content.json';
import type { GameFile } from './filesystem';
import { CASE_EXPORT_ROOT, buildEvidence, buildEvidenceFiles } from './cases';

export const NETWORK_ROOT = '/network';
export const LOG_SHARE = 'dev-files.root.internal';
const stamp = '2026-09-26T00:00:00.000Z';
export const logFiles: Record<string, string> = content.logs;
export const documentationFiles: Record<string, string> = {
  ...content.Documentation,
  '03_Network/SMB-Access.md': `${content.Documentation['03_Network/SMB-Access.md']}\nMISSION 003의 승인된 읽기 전용 logs 공유 예시:\n\n    sudo apt install smbclient\n    smbclient //dev-files.root.internal/logs -N\n\n접속한 smb 프롬프트에서 ls, cd auth, get auth-2026-09-24.log처럼 파일을 열람하고 Downloads로 가져올 수 있다. 같은 방식으로 09/26 인증 기록과 build 기록을 비교한다. 이 명령은 PROJECT ROOT의 가상 내부망에서만 동작한다.\n`,
};
export function virtualNetworkFiles(): GameFile[] {
  const dirs = new Set<string>([
    NETWORK_ROOT,
    `${NETWORK_ROOT}/PROJECT ROOT`,
    `${NETWORK_ROOT}/PROJECT ROOT/Documentation`,
    `${NETWORK_ROOT}/PROJECT ROOT/Case Exports`,
    CASE_EXPORT_ROOT,
    `${NETWORK_ROOT}/PROJECT ROOT/Shared`,
    `${NETWORK_ROOT}/PROJECT ROOT/Shared/Team`,
    `${NETWORK_ROOT}/PROJECT ROOT/Internal Services`,
    ...['docs.root.internal', LOG_SHARE, 'build.root.internal', 'archive.root.internal'].map(
      (host) => `${NETWORK_ROOT}/PROJECT ROOT/Internal Services/${host}`,
    ),
    ...['public', 'projects', 'logs'].map(
      (share) => `${NETWORK_ROOT}/PROJECT ROOT/Internal Services/${LOG_SHARE}/${share}`,
    ),
  ]);
  const files: GameFile[] = [];
  for (const [relative, text] of Object.entries(documentationFiles)) {
    const path = `${NETWORK_ROOT}/PROJECT ROOT/Documentation/${relative}`;
    for (let part = path.slice(1).split('/').slice(0, -1), i = 1; i <= part.length; i++)
      dirs.add('/' + part.slice(0, i).join('/'));
    files.push({ path, kind: 'file', content: text, modified: stamp });
  }
  const caseContents: Record<string, string> = {
    [buildEvidence.runner]: logFiles['build/build-runner.log'],
    [buildEvidence.schedule]: logFiles['application/scheduler.log'],
    [buildEvidence.auth]: logFiles['auth/auth-2026-09-26.log'].split('\n').filter((line) => line.includes('svc-build')).join('\n') + '\n',
  };
  for (const [id, path] of Object.entries(buildEvidenceFiles))
    files.push({ path, kind: 'file', content: caseContents[id], modified: stamp });
  files.push({
    path: `${NETWORK_ROOT}/PROJECT ROOT/Shared/Team/September-Notes.txt`,
    kind: 'file',
    content: '9월 정기 회의: 자료 보존 기간 및 공동 작업 공간 정리.\n',
    modified: stamp,
  });
  files.push({
    path: `${NETWORK_ROOT}/PROJECT ROOT/Shared/Team/Office-Schedule.txt`,
    kind: 'file',
    content: '월요일 10:00 팀 정기 점검\n금요일 17:00 주간 기록 정리\n',
    modified: stamp,
  });
  files.push({
    path: `${NETWORK_ROOT}/PROJECT ROOT/Internal Services/${LOG_SHARE}/public/README.txt`,
    kind: 'file',
    content: '개발 파일 저장소의 공개 공유 영역입니다.\n',
    modified: stamp,
  });
  files.push({
    path: `${NETWORK_ROOT}/PROJECT ROOT/Internal Services/${LOG_SHARE}/projects/Access.txt`,
    kind: 'file',
    content: '현재 분석가 계정은 projects 공유에 접근할 수 없습니다.\n',
    modified: stamp,
  });
  files.push({
    path: `${NETWORK_ROOT}/PROJECT ROOT/Internal Services/${LOG_SHARE}/logs/Access.txt`,
    kind: 'file',
    content:
      '사건 분석가에게 읽기 전용 SMB 권한이 부여되었습니다. 로그 열람 및 다운로드에는 Samba client utilities를 사용하세요.\n',
    modified: stamp,
  });
  return [
    ...[...dirs].map((path): GameFile => ({ path, kind: 'directory', modified: stamp })),
    ...files,
  ];
}
export function smbDirectory(path: string): string[] {
  const normalized = path.replace(/^\/+|\/+$/g, '');
  const names = new Set<string>();
  for (const file of Object.keys(logFiles)) {
    if (normalized && !file.startsWith(normalized + '/')) continue;
    const tail = normalized ? file.slice(normalized.length + 1) : file;
    if (tail) names.add(tail.split('/')[0] + (tail.includes('/') ? '/' : ''));
  }
  if (!normalized) {
    names.add('deploy/');
    names.add('archive/');
  }
  return [...names].sort();
}
