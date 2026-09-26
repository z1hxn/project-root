export interface GameFile {
  path: string;
  kind: 'directory' | 'file';
  content?: string;
  modified: string;
}
export const homePath = (username: string) => `/home/${username}`;
export function initialFiles(username: string): GameFile[] {
  const home = homePath(username);
  const modified = '2026-09-26T00:00:00.000Z';
  return [
    ...[
      '/',
      '/home',
      home,
      `${home}/Desktop`,
      `${home}/Documents`,
      `${home}/Downloads`,
      `${home}/Pictures`,
      `${home}/Music`,
      `${home}/Videos`,
      `${home}/.config`,
      `${home}/.local`,
      `${home}/.local/share`,
      `${home}/.local/share/Trash`,
      `${home}/.local/share/Trash/files`,
      '/etc',
      '/tmp',
    ].map((path) => ({ path, kind: 'directory' as const, modified })),
    ...[
      { id: 'root', name: 'Project Root' },
      { id: 'browser', name: 'Firefox' },
      { id: 'files', name: 'Dolphin' },
      { id: 'terminal', name: 'Konsole' },
      { id: 'mail', name: 'KMail' },
      { id: 'settings', name: '시스템 설정' },
      { id: 'editor', name: 'KWrite' },
    ].map((a) => ({
      path: `${home}/Desktop/${a.name}.desktop`,
      kind: 'file' as const,
      modified,
      content: `[Desktop Entry]\nType=Application\nName=${a.name}\nX-Root-App=${a.id}\n`,
    })),
    {
      path: `${home}/Documents/Welcome.txt`,
      kind: 'file',
      modified,
      content: `PROJECT ROOT — 워크스테이션 안내\n\n${username}님, 환영합니다.\n\nProject Root에서 사건과 조사 정보를 관리합니다.\nFirefox: 공개 웹 기록 탐색\nDolphin: 수집한 파일 관리\nKonsole: 시스템 기록 조사\nKMail: 내부 연락 확인\n\n첫 사건이 배정될 때까지 환경을 둘러보세요.\n`,
    },
    {
      path: `${home}/.bashrc`,
      kind: 'file',
      modified,
      content: '# ~/.bashrc\nexport SHELL=/bin/bash\nexport LANG=ko_KR.UTF-8\n',
    },
    {
      path: '/etc/os-release',
      kind: 'file',
      modified,
      content:
        'PRETTY_NAME="Debian GNU/Linux 13 (trixie)"\nNAME="Debian GNU/Linux"\nID=debian\nVERSION_ID="13"\n',
    },
  ];
}
export function resolvePath(input: string, cwd: string, home: string) {
  const raw = input.startsWith('~')
    ? home + input.slice(1)
    : input.startsWith('/')
      ? input
      : `${cwd}/${input}`;
  const parts: string[] = [];
  for (const p of raw.split('/')) {
    if (p === '..') parts.pop();
    else if (p && p !== '.') parts.push(p);
  }
  return '/' + parts.join('/');
}
export function parentPath(path: string) {
  return path.slice(0, path.lastIndexOf('/')) || '/';
}
export function basename(path: string) {
  return path.split('/').pop() || '/';
}
export function directoryEntries(files: GameFile[], path: string, hidden = false) {
  return files
    .filter(
      (f) =>
        f.path !== path &&
        parentPath(f.path) === path &&
        (hidden || !basename(f.path).startsWith('.')),
    )
    .sort((a, b) =>
      a.kind !== b.kind ? (a.kind === 'directory' ? -1 : 1) : a.path.localeCompare(b.path),
    );
}
export function writeFile(files: GameFile[], path: string, content: string): GameFile[] {
  if (files.find((f) => f.path === path)?.kind === 'directory') throw Error('대상은 폴더입니다.');
  if (!files.some((f) => f.path === parentPath(path) && f.kind === 'directory'))
    throw Error('상위 폴더가 없습니다.');
  return [
    ...files.filter((f) => f.path !== path),
    { path, kind: 'file', content: content.slice(0, 100000), modified: new Date().toISOString() },
  ];
}
export function makeDirectory(files: GameFile[], path: string): GameFile[] {
  if (files.some((f) => f.path === path)) throw Error('같은 이름이 이미 있습니다.');
  if (!files.some((f) => f.path === parentPath(path) && f.kind === 'directory'))
    throw Error('상위 폴더가 없습니다.');
  return [...files, { path, kind: 'directory', modified: new Date().toISOString() }];
}
export function isProtectedPath(path: string) {
  return (
    ['/', '/home', '/etc', '/tmp'].includes(path) ||
    /^\/home\/[^/]+(?:\/(?:Desktop|Documents|Downloads|Pictures|Music|Videos|\.config|\.local(?:\/share(?:\/Trash(?:\/files)?)?)?))?$/.test(
      path,
    )
  );
}
export function assertMutablePaths(paths: string[]) {
  const protectedPath = paths.find(isProtectedPath);
  if (protectedPath)
    throw Error(
      `“${basename(protectedPath)}”은 워크스테이션의 기본 폴더입니다. 삭제하거나 이동하거나 이름을 바꿀 수 없습니다. 폴더 안의 개인 파일은 정리할 수 있습니다.`,
    );
}
export function repairSystemDirectories(files: GameFile[], username: string): GameFile[] {
  const required = initialFiles(username).filter((f) => f.kind === 'directory');
  return [
    ...files.filter((f) => !required.some((dir) => dir.path === f.path && f.kind !== 'directory')),
    ...required.filter((dir) => !files.some((f) => f.path === dir.path && f.kind === 'directory')),
  ];
}
export function renameFile(files: GameFile[], path: string, target: string) {
  assertMutablePaths([path]);
  if (target.startsWith(path + '/')) throw Error('폴더를 자기 자신 안에 넣을 수 없습니다.');
  if (files.some((f) => f.path === target)) throw Error('같은 이름이 이미 있습니다.');
  return files.map((f) =>
    f.path === path || f.path.startsWith(path + '/')
      ? { ...f, path: target + f.path.slice(path.length) }
      : f,
  );
}
export function runCommand(
  command: string,
  cwd: string,
  files: GameFile[],
  username: string,
  history: string[],
): { output: string; cwd: string; files: GameFile[]; clear?: boolean } {
  const home = homePath(username);
  const tokens =
    command.match(/"[^"]*"|'[^']*'|\S+/g)?.map((t) => t.replace(/^['"]|['"]$/g, '')) ?? [];
  const [cmd, ...args] = tokens;
  const path = resolvePath(args.find((a) => !a.startsWith('-')) || '.', cwd, home);
  let output = '';
  try {
    switch (cmd) {
      case 'help':
        output =
          'GNU bash — workstation\n\nNavigation: pwd, ls [-la], cd [path]\nFiles: cat, mkdir, touch, echo [text] > [file], rm, mv\nSession: whoami, hostname, uname, date, history, clear\n\n파일 변경은 Dolphin에도 반영됩니다.';
        break;
      case 'pwd':
        output = cwd;
        break;
      case 'whoami':
        output = username;
        break;
      case 'hostname':
        output = 'workstation';
        break;
      case 'uname':
        output = args.includes('-a')
          ? 'Linux workstation 6.12.0-amd64 #1 SMP PREEMPT_DYNAMIC Debian x86_64 GNU/Linux'
          : 'Linux';
        break;
      case 'date':
        output = new Date().toString();
        break;
      case 'clear':
        return { output: '', cwd, files, clear: true };
      case 'ls': {
        const entry = files.find((f) => f.path === path);
        if (!entry) throw Error('No such file or directory');
        const list =
          entry.kind === 'directory'
            ? directoryEntries(
                files,
                path,
                args.some((a) => a.includes('a')),
              )
            : [entry];
        output = list
          .map((f) =>
            args.some((a) => a.includes('l'))
              ? `${f.kind === 'directory' ? 'drwxr-xr-x' : '-rw-r--r--'}  1 ${username} ${username}  ${String(f.content?.length ?? 4096).padStart(5)}  Sep 26 09:00  ${basename(f.path)}`
              : basename(f.path) + (f.kind === 'directory' ? '/' : ''),
          )
          .join(args.some((a) => a.includes('l')) ? '\n' : '  ');
        break;
      }
      case 'cd': {
        const target = args.length ? path : home;
        if (!files.some((f) => f.path === target && f.kind === 'directory'))
          throw Error('No such directory');
        cwd = target;
        break;
      }
      case 'cat': {
        const f = files.find((f) => f.path === path);
        if (!f || f.kind !== 'file') throw Error('No such file');
        output = f.content || '';
        break;
      }
      case 'echo': {
        const arrow = args.indexOf('>');
        if (arrow >= 0) {
          const dest = resolvePath(args[arrow + 1] || '', cwd, home);
          if (!dest.startsWith(home + '/')) throw Error('Permission denied');
          files = writeFile(files, dest, args.slice(0, arrow).join(' ') + '\n');
        } else output = args.join(' ');
        break;
      }
      case 'mkdir':
      case 'touch': {
        if (!args.length) throw Error('missing operand');
        if (!path.startsWith(home + '/')) throw Error('Permission denied');
        files =
          cmd === 'mkdir'
            ? makeDirectory(files, path)
            : writeFile(files, path, files.find((f) => f.path === path)?.content || '');
        break;
      }
      case 'rm': {
        assertMutablePaths([path]);
        if (!args.length || !path.startsWith(home + '/')) throw Error('Permission denied');
        const f = files.find((f) => f.path === path);
        if (!f) throw Error('No such file');
        if (f.kind === 'directory') throw Error('Is a directory');
        files = files.filter((f) => f.path !== path);
        break;
      }
      case 'mv': {
        if (args.length !== 2) throw Error('expected source and destination');
        const dest = resolvePath(args[1], cwd, home);
        if (!path.startsWith(home + '/') || !dest.startsWith(home + '/'))
          throw Error('Permission denied');
        if (!files.some((f) => f.path === path)) throw Error('No such file');
        if (!files.some((f) => f.path === parentPath(dest) && f.kind === 'directory'))
          throw Error('Destination directory does not exist');
        files = renameFile(files, path, dest);
        break;
      }
      case 'history':
        output = history.map((h, i) => `${String(i + 1).padStart(4)}  ${h}`).join('\n');
        break;
      case undefined:
        break;
      default:
        output = `bash: ${cmd}: command not found`;
    }
  } catch (e) {
    output = `${cmd}: ${e instanceof Error ? e.message : 'operation failed'}`;
  }
  return { output, cwd, files };
}
export const trashPath = (username: string) => `${homePath(username)}/.local/share/Trash/files`;
export function moveToTrash(files: GameFile[], paths: string[], username: string) {
  assertMutablePaths(paths);
  let next = files;
  for (const path of paths) {
    if (!path.startsWith(homePath(username) + '/'))
      throw Error('이 위치의 항목은 삭제할 수 없습니다.');
    let target = trashPath(username) + '/' + basename(path);
    let i = 1;
    while (next.some((f) => f.path === target))
      target = trashPath(username) + '/' + basename(path) + ` (${i++})`;
    next = renameFile(next, path, target);
  }
  return next;
}
export function pasteFiles(files: GameFile[], paths: string[], destination: string, cut: boolean) {
  if (cut) assertMutablePaths(paths);
  if (!files.some((f) => f.path === destination && f.kind === 'directory'))
    throw Error('대상 폴더가 없습니다.');
  let next = [...files];
  for (const path of paths) {
    const original = next.find((f) => f.path === path);
    if (!original) continue;
    if (destination === path || destination.startsWith(path + '/'))
      throw Error('폴더를 자기 자신 안에 넣을 수 없습니다.');
    if (cut && parentPath(path) === destination) continue;
    let target = destination + '/' + basename(path);
    let n = 1;
    while (next.some((f) => f.path === target))
      target = destination + '/' + basename(path) + ` (${n++})`;
    const tree = next.filter((f) => f.path === path || f.path.startsWith(path + '/'));
    if (cut) next = next.filter((f) => !tree.includes(f));
    next.push(
      ...tree.map((f) => ({
        ...f,
        path: target + f.path.slice(path.length),
        modified: new Date().toISOString(),
      })),
    );
  }
  return next;
}
