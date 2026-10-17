import {
  virtualNetworkFiles,
  logFiles,
  smbListing,
  smbTransferMessage,
  publicShareFiles,
  NETWORK_ROOT,
  LOG_SHARE,
  isDolphinSmbPath,
} from './virtualNetwork';
export interface GameFile {
  path: string;
  kind: 'directory' | 'file';
  content?: string;
  modified: string;
}
export const homePath = (username: string) => `/home/${username}`;
const desktopApps = [
  { id: 'root', name: 'Project Root' },
  { id: 'browser', name: 'Firefox' },
  { id: 'files', name: 'Dolphin' },
  { id: 'terminal', name: 'Konsole' },
  { id: 'mail', name: 'KMail' },
  { id: 'settings', name: '시스템 설정' },
  { id: 'editor', name: 'KWrite' },
];
const desktopAppNames = new Set(desktopApps.map((app) => `${app.name}.desktop`));
export function isProtectedDesktopApp(path: string) {
  const match = /^\/home\/[^/]+\/Desktop\/([^/]+)$/.exec(path);
  return !!match && desktopAppNames.has(match[1]);
}
export function initialFiles(username: string): GameFile[] {
  const home = homePath(username);
  const modified = '2026-09-26T00:00:00.000Z';
  return [
    ...virtualNetworkFiles(),
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
    ...desktopApps.map((a) => ({
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
  if (isProtectedDesktopApp(path)) throw Error('기본 앱 바로가기는 수정할 수 없습니다.');
  if (path === NETWORK_ROOT || path.startsWith(NETWORK_ROOT + '/'))
    throw Error('원격 자료는 읽기 전용입니다.');
  if (files.find((f) => f.path === path)?.kind === 'directory') throw Error('대상은 폴더입니다.');
  if (!files.some((f) => f.path === parentPath(path) && f.kind === 'directory'))
    throw Error('상위 폴더가 없습니다.');
  return [
    ...files.filter((f) => f.path !== path),
    { path, kind: 'file', content: content.slice(0, 100000), modified: new Date().toISOString() },
  ];
}
export function makeDirectory(files: GameFile[], path: string): GameFile[] {
  if (path === NETWORK_ROOT || path.startsWith(NETWORK_ROOT + '/'))
    throw Error('원격 자료는 읽기 전용입니다.');
  if (files.some((f) => f.path === path)) throw Error('같은 이름이 이미 있습니다.');
  if (!files.some((f) => f.path === parentPath(path) && f.kind === 'directory'))
    throw Error('상위 폴더가 없습니다.');
  return [...files, { path, kind: 'directory', modified: new Date().toISOString() }];
}
export function isProtectedPath(path: string) {
  return (
    isProtectedDesktopApp(path) ||
    path === NETWORK_ROOT ||
    path.startsWith(NETWORK_ROOT + '/') ||
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
      isProtectedDesktopApp(protectedPath)
        ? `“${basename(protectedPath).replace(/\.desktop$/, '')}”은 기본 앱 바로가기입니다. 삭제하거나 이동하거나 이름을 바꿀 수 없습니다.`
        : `“${basename(protectedPath)}”은 워크스테이션의 기본 폴더입니다. 삭제하거나 이동하거나 이름을 바꿀 수 없습니다. 폴더 안의 개인 파일은 정리할 수 있습니다.`,
    );
}
export function repairSystemDirectories(files: GameFile[], username: string): GameFile[] {
  const required = initialFiles(username).filter(
    (f) => f.kind === 'directory' || f.path.startsWith(NETWORK_ROOT + '/') || isProtectedDesktopApp(f.path),
  );
  return [
    ...files.filter(
      (f) =>
        !f.path.startsWith(`${NETWORK_ROOT}/PROJECT ROOT/Documentation/`) &&
        !isDolphinSmbPath(f.path) &&
        !required.some(
          (item) =>
            item.path === f.path &&
            (item.path.startsWith(NETWORK_ROOT + '/') || isProtectedDesktopApp(item.path) || f.kind !== item.kind),
        ),
    ),
    ...required.filter(
      (item) =>
        item.path.startsWith(NETWORK_ROOT + '/') ||
        isProtectedDesktopApp(item.path) ||
        !files.some((f) => f.path === item.path && f.kind === item.kind),
    ),
  ];
}
export function renameFile(files: GameFile[], path: string, target: string) {
  assertMutablePaths([path, target]);
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
  options: { smbclient?: boolean } = {},
): {
  output: string;
  cwd: string;
  files: GameFile[];
  clear?: boolean;
  installPackage?: 'smbclient';
  evidence?: string;
  evidences?: string[];
  enterSmb?: boolean;
  enterShare?: 'logs' | 'public';
} {
  const home = homePath(username);
  const tokens =
    command.match(/"[^"]*"|'[^']*'|\S+/g)?.map((t) => t.replace(/^['"]|['"]$/g, '')) ?? [];
  const [cmd, ...args] = tokens;
  const path = resolvePath(args.find((a) => !a.startsWith('-')) || '.', cwd, home);
  let output = '';
  try {
    if (/^(?:sudo\s+)?apt(?:-get)?\s+update\s*$/.test(command))
      return {
        output:
          'Hit:1 https://deb.debian.org/debian trixie InRelease\nGet:2 https://deb.debian.org/debian trixie/main amd64 Packages [9,600 kB]\nFetched 9,600 kB in 2s\nReading package lists... Done\nBuilding dependency tree... Done\nAll packages are up to date.',
        cwd,
        files,
      };
    if (/^(?:sudo\s+)?apt(?:-get)?\s+install\s+(?:-y\s+)?smbclient(?:\s+-y)?\s*$/.test(command))
      return {
        output: options.smbclient
          ? 'smbclient is already the newest version.'
          : 'Reading package lists... Done\nBuilding dependency tree... Done\nThe following NEW packages will be installed:\n  smbclient\nGet:1 https://deb.debian.org/debian trixie/main amd64 smbclient [450 kB]\nFetched 450 kB in 1s\nUnpacking smbclient ...\nSetting up smbclient ...',
        cwd,
        files,
        installPackage: 'smbclient',
      };
    if (cmd === 'which' && args[0] === 'smbclient')
      return { output: options.smbclient ? '/usr/bin/smbclient' : '', cwd, files };
    if (cmd === 'smbclient') {
      if (!options.smbclient) return { output: 'bash: smbclient: command not found', cwd, files };
      if (args.includes('--version') || args.includes('-V'))
        return { output: 'Version 4.22.0-Debian', cwd, files };
      const listHost = args.includes('-L') ? args[args.indexOf('-L') + 1] : undefined;
      const target = args.find((arg) => arg.startsWith('//')) || (listHost ? `//${listHost}` : undefined);
      const match = target?.match(/^\/\/([^/]+)(?:\/(\w+))?\/?$/);
      if (!match || match[1] !== LOG_SHARE)
        return {
          output: 'do_connect: Connection failed (Error NT_STATUS_BAD_NETWORK_NAME)',
          cwd,
          files,
        };
      if (!args.includes('--use-kerberos=required'))
        return { output: 'session setup failed: NT_STATUS_LOGON_FAILURE', cwd, files };
      if (args.includes('-L'))
        return {
          output:
            '\tSharename       Type      Comment\n\t---------       ----      -------\n\tpublic          Disk      Shared development resources\n\tprojects        Disk      Restricted project workspace\n\tlogs            Disk      Analyst read-only event records\n\tIPC$            IPC       IPC Service (PROJECT ROOT)\nSMB1 disabled -- no workgroup available',
          cwd,
          files,
        };
      const share = match[2];
      if (!share) return { output: 'smbclient: share name required', cwd, files };
      if (share === 'projects')
        return { output: 'tree connect failed: NT_STATUS_ACCESS_DENIED', cwd, files };
      if (share !== 'logs' && share !== 'public') return { output: 'tree connect failed: NT_STATUS_BAD_NETWORK_NAME', cwd, files };
      const shareFiles = share === 'logs' ? logFiles : publicShareFiles;
      if (!args.includes('-c'))
        return {
          output: 'Try "help" to get a list of possible commands.',
          cwd,
          files,
          enterSmb: true,
          enterShare: share,
        };
      const instruction = args[args.indexOf('-c') + 1] || 'ls';
      let remoteDir = '';
      let localDir = `${home}/Downloads`;
      const outputs: string[] = [];
      const evidences: string[] = [];
      for (const item of instruction.split(';').map((part) => part.trim()).filter(Boolean)) {
        const [op, ...parameters] = item.split(/\s+/);
        const targetPath = resolvePath((parameters[0] || '.').replace(/\\/g, '/'), '/' + remoteDir, '/').slice(1);
        if (op === 'cd') {
          if (targetPath && !Object.keys(shareFiles).some((name) => name.startsWith(targetPath + '/')))
            outputs.push(`NT_STATUS_OBJECT_PATH_NOT_FOUND: ${parameters[0]}`);
          else remoteDir = targetPath;
        } else if (op === 'ls' || op === 'dir') {
          const pattern = parameters[0] || '*';
          outputs.push(pattern.includes('*') || pattern.includes('?')
            ? smbListing(remoteDir, pattern, shareFiles)
            : smbListing(targetPath, '*', shareFiles));
        } else if (op === 'pwd') {
          outputs.push(`Current directory is \\\\${LOG_SHARE}\\${share}\\${remoteDir ? remoteDir.replace(/\//g, '\\') + '\\' : ''}`);
        } else if (op === 'lcd') {
          const next = parameters[0] ? resolvePath(parameters[0], localDir, home) : localDir;
          if (files.some((file) => file.path === next && file.kind === 'directory')) {
            localDir = next;
            outputs.push(`the local directory is now ${localDir}`);
          } else outputs.push(`lcd: ${next}: No such directory`);
        } else if (op === 'get') {
          const content = shareFiles[targetPath];
          if (content === undefined) outputs.push(`NT_STATUS_OBJECT_NAME_NOT_FOUND opening remote file \\${targetPath}`);
          else {
            const dest = resolvePath(parameters[1] || basename(targetPath), localDir, home);
            if (!dest.startsWith(home + '/') || !files.some((file) => file.path === parentPath(dest) && file.kind === 'directory'))
              outputs.push(`get: local destination unavailable: ${dest}`);
            else {
              files = writeFile(files, dest, content);
              outputs.push(smbTransferMessage(targetPath, parameters[1] || basename(dest), shareFiles));
              if (share === 'logs') evidences.push(targetPath);
            }
          }
        } else if (op === 'more') {
          outputs.push(shareFiles[targetPath] ?? `NT_STATUS_OBJECT_NAME_NOT_FOUND opening remote file \\${targetPath}`);
        } else if (op === 'exit' || op === 'quit') break;
        else outputs.push(`Unknown command: ${op}`);
      }
      return { output: outputs.join('\n'), cwd, files, evidence: evidences[0], evidences };
    }
    switch (cmd) {
      case 'help':
        output =
          'GNU bash — workstation\n\nNavigation: pwd, ls [-la], cd [path]\nFiles: cat, grep [-in], head, tail, mkdir, touch, echo [text] > [file], rm, mv\nPackages: apt update, apt install <package>, which <command>\nNetwork: installed client utilities may provide additional commands\nSession: whoami, hostname, uname, date, history, clear\n\n파일 변경은 Dolphin에도 반영됩니다.';
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
      case 'grep': {
        const values = args.filter((a) => !a.startsWith('-'));
        const needle = values.shift();
        if (!needle || !values.length) throw Error('usage: grep [-in] pattern file');
        const insensitive = args.some((a) => a.startsWith('-') && a.includes('i'));
        const numbered = args.some((a) => a.startsWith('-') && a.includes('n'));
        output = values
          .flatMap((value) => {
            const target = resolvePath(value, cwd, home);
            const matches = value.includes('*')
              ? files.filter(
                  (f) =>
                    f.kind === 'file' &&
                    f.path.startsWith(parentPath(target) + '/') &&
                    basename(f.path).endsWith(basename(value).replace('*', '')),
                )
              : files.filter((f) => f.path === target && f.kind === 'file');
            return matches.flatMap((f) =>
              (f.content || '').split('\n').flatMap((line, i) => {
                const hay = insensitive ? line.toLowerCase() : line;
                if (!hay.includes(insensitive ? needle.toLowerCase() : needle)) return [];
                return [
                  `${matches.length > 1 ? basename(f.path) + ':' : ''}${numbered ? i + 1 + ':' : ''}${line}`,
                ];
              }),
            );
          })
          .join('\n');
        break;
      }
      case 'head':
      case 'tail': {
        const countArg = args.find((a) => /^-[0-9]+$/.test(a));
        const count = Math.min(100, Number(countArg?.slice(1) || 10));
        const target = resolvePath(args.find((a) => !a.startsWith('-')) || '', cwd, home);
        const file = files.find((f) => f.path === target && f.kind === 'file');
        if (!file) throw Error('No such file');
        const lines = (file.content || '').trimEnd().split('\n');
        output = (cmd === 'head' ? lines.slice(0, count) : lines.slice(-count)).join('\n');
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
  if (destination === NETWORK_ROOT || destination.startsWith(NETWORK_ROOT + '/'))
    throw Error('원격 자료는 읽기 전용입니다.');
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
