import content from './mission002-content.json';
import type { GameFile } from './filesystem';
import { CASE_EXPORT_ROOT, buildEvidence, buildEvidenceFiles } from './cases';

export const NETWORK_ROOT = '/network';
export const LOG_SHARE = 'dev-files.root.internal';
const stamp = '2026-09-26T00:00:00.000Z';
export const logFiles: Record<string, string> = content.logs;
export const publicShareFiles: Record<string, string> = {
  'README.txt': 'PROJECT ROOT 개발팀 공용 공유 영역\n\n팀 간 공개 가능한 작업 자료를 교환하는 공간입니다. 운영 기록은 이 공유에 보관하지 않습니다.\n',
  'team/Release-Notes.txt': '2026-09 개발 서비스 정기 배포 안내\n\n공용 자료와 서비스 변경 공지는 문서 배포 영역에서 확인하세요.\n',
};
export const documentationFiles: Record<string, string> = content.Documentation;
export const INTERNAL_SERVICES_ROOT = `${NETWORK_ROOT}/PROJECT ROOT/Internal Services`;
export function isDolphinSmbPath(path: string) {
  return path === INTERNAL_SERVICES_ROOT || path.startsWith(INTERNAL_SERVICES_ROOT + '/');
}
export function virtualNetworkFiles(): GameFile[] {
  const dirs = new Set<string>([
    NETWORK_ROOT,
    `${NETWORK_ROOT}/PROJECT ROOT`,
    `${NETWORK_ROOT}/PROJECT ROOT/Documentation`,
    `${NETWORK_ROOT}/PROJECT ROOT/Case Exports`,
    CASE_EXPORT_ROOT,
    `${NETWORK_ROOT}/PROJECT ROOT/Shared`,
    `${NETWORK_ROOT}/PROJECT ROOT/Shared/Team`,
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
  return [
    ...[...dirs].map((path): GameFile => ({ path, kind: 'directory', modified: stamp })),
    ...files,
  ];
}
export function smbDirectory(path: string, shareFiles: Record<string, string> = logFiles): string[] {
  const normalized = path.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
  const names = new Set<string>();
  for (const file of Object.keys(shareFiles)) {
    if (normalized && !file.startsWith(normalized + '/')) continue;
    const tail = normalized ? file.slice(normalized.length + 1) : file;
    if (tail) names.add(tail.split('/')[0] + (tail.includes('/') ? '/' : ''));
  }
  return [...names].sort();
}
export function smbListing(path: string, mask = '*', shareFiles: Record<string, string> = logFiles) {
  const normalized = path.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
  const names = smbDirectory(normalized, shareFiles).filter((name) => {
    const escaped = mask.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.');
    return new RegExp(`^${escaped}$`, 'i').test(name.replace(/\/$/, ''));
  });
  const folder = (name: string, directory: boolean, size = 0) =>
    `  ${name.padEnd(35)} ${directory ? 'D' : 'A'} ${String(size).padStart(8)}  Sat Sep 26 00:00:00 2026`;
  return [
    ...(mask === '*' ? [folder('.', true), folder('..', true)] : []),
    ...names.map((name) => {
      const directory = name.endsWith('/');
      const key = normalized ? `${normalized}/${name}` : name;
      return folder(name.replace(/\/$/, ''), directory, directory ? 0 : new TextEncoder().encode(shareFiles[key] || '').length);
    }),
    '',
    '                1048576 blocks of size 1024. 786432 blocks available',
  ].join('\n');
}
export function smbTransferMessage(path: string, localName: string, shareFiles: Record<string, string> = logFiles) {
  return `getting file ${path.replace(/\//g, '\\')} of size ${new TextEncoder().encode(shareFiles[path]).length} as ${localName} (512.0 kb/s) (average 512.0 kb/s)`;
}
