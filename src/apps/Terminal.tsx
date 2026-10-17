'use client';
import { useEffect, useRef, useState } from 'react';
import { Plus, X, Copy, Clipboard, SplitSquareHorizontal, Search } from 'lucide-react';
import { useWorkspace } from '@/features/workspace/context';
import {
  runCommand,
  homePath,
  directoryEntries,
  resolvePath,
  basename,
  parentPath,
  makeDirectory,
  writeFile,
} from '@/game/filesystem';
import { LOG_SHARE, logFiles, publicShareFiles, smbListing, smbTransferMessage } from '@/game/virtualNetwork';
import { NativeMenuBar, NativeDialog } from '@/components/ui/Native';
interface TerminalSession {
  id: number;
  cwd: string;
  lines: { command: string; prompt: string; output: string }[];
  history: string[];
  smbPath?: string;
  smbShare?: 'logs' | 'public';
  smbLocalPath?: string;
  smbPrompt?: boolean;
  smbRecurse?: boolean;
  smbMask?: string;
  smbPending?: string[];
}
const smbHelp: Record<string, string> = {
  ls: '<mask> list the contents of the current directory',
  dir: '<mask> list the contents of the current directory',
  cd: '<directory> change the current remote directory',
  pwd: 'show current remote directory',
  lcd: '[directory] change the current local directory',
  get: '<remote file> [local file] get a file',
  mget: '<mask> get all matching files',
  more: '<file> view a remote file',
  allinfo: '<file> show file information',
  prompt: 'toggle prompting for mget and mput',
  recurse: 'toggle directory recursion for mget and mput',
  mask: '<mask> set mask for recursive operations',
  history: 'display command history',
  exit: 'terminate the connection',
  quit: 'terminate the connection',
  put: '<local file> [remote file] put a file',
  mput: '<mask> put all matching files',
  mkdir: '<directory> create a directory',
  rmdir: '<directory> remove a directory',
  rm: '<mask> remove matching files',
  rename: '<old name> <new name> rename a file',
};
const smbHelpList = `  ls             dir            lcd            cd             pwd
  get            mget           put            mput           rename
  more           mask           del            rm             mkdir
  md             rmdir          rd             prompt         recurse
  allinfo        quit           exit           help           ?
  history`;
function matchesSmbPattern(name: string, pattern: string) {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.');
  return new RegExp(`^${escaped}$`, 'i').test(name);
}
function saveSmbDownload(files: ReturnType<typeof directoryEntries>, destination: string, content: string) {
  let next = files;
  const missing: string[] = [];
  let folder = parentPath(destination);
  while (!next.some((file) => file.path === folder && file.kind === 'directory')) {
    missing.unshift(folder);
    folder = parentPath(folder);
  }
  for (const path of missing) next = makeDirectory(next, path);
  return writeFile(next, destination, content);
}
export function TerminalApp() {
  const { profile, files, setFiles, installPackage, recordEvidence } = useWorkspace();
  const home = homePath(profile.username);
  const [sessions, setSessions] = useState<TerminalSession[]>([
    { id: 1, cwd: home, lines: [], history: [] },
  ]);
  const [active, setActive] = useState(1);
  const [command, setCommand] = useState('');
  const [index, setIndex] = useState(-1);
  const [font, setFont] = useState(13);
  const [scheme, setScheme] = useState('black');
  const [split, setSplit] = useState(false);
  const [search, setSearch] = useState(false);
  const [query, setQuery] = useState('');
  const [dialog, setDialog] = useState(false);
  const [processingSessions, setProcessingSessions] = useState<number[]>([]);
  const processingRef = useRef<Set<number>>(new Set());
  const input = useRef<HTMLInputElement>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const seq = useRef(1);
  const session = sessions.find((s) => s.id === active)!;
  const processing = processingSessions.includes(active);
  const cwd = session.cwd === home ? '~' : session.cwd.replace(home, '~');
  const prompt =
    session.smbPending?.length
      ? `Get file ${basename(session.smbPending[0])}? `
      : session.smbPath === undefined
      ? `${profile.username}@workstation:${cwd}$`
      : `smb: \\${session.smbPath ? session.smbPath.replace(/\//g, '\\') + '\\' : ''}>`;
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'nearest' });
  }, [session.lines]);
  useEffect(() => {
    if (!processing) input.current?.focus();
  }, [processing, active]);
  function add() {
    const id = ++seq.current;
    setSessions((s) => [...s, { id, cwd: home, lines: [], history: [] }]);
    setActive(id);
    setCommand('');
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!command.trim() || processingRef.current.has(active)) return;
    const history = [...session.history, command];
    let smbPath = session.smbPath;
    let smbShare = session.smbShare || 'logs';
    const shareFiles = smbShare === 'logs' ? logFiles : publicShareFiles;
    let smbLocalPath = session.smbLocalPath || `${home}/Downloads`;
    let smbPrompt = session.smbPrompt ?? true;
    let smbRecurse = session.smbRecurse ?? false;
    let smbMask = session.smbMask || '*';
    let smbPending = session.smbPending || [];
    let downloadedPaths: string[] = [];
    let result: ReturnType<typeof runCommand>;
    if (smbPath !== undefined && smbPending.length) {
      const path = smbPending[0];
      const answer = command.trim().toLowerCase();
      if (answer === 'y' || answer === 'yes') {
        const relative = smbRecurse ? path.slice(smbPath ? smbPath.length + 1 : 0) : basename(path);
        const destination = `${smbLocalPath}/${relative}`;
        if (!destination.startsWith(home + '/')) result = { output: `NT_STATUS_ACCESS_DENIED opening local file ${destination}`, cwd: session.cwd, files };
        else {
          result = { output: smbTransferMessage(path, relative, shareFiles), cwd: session.cwd, files: saveSmbDownload(files, destination, shareFiles[path]), evidence: smbShare === 'logs' ? path : undefined };
          if (smbShare === 'logs') downloadedPaths = [path];
        }
        smbPending = smbPending.slice(1);
      } else if (answer === 'n' || answer === 'no') {
        result = { output: '', cwd: session.cwd, files };
        smbPending = smbPending.slice(1);
      } else result = { output: 'Please answer y or n.', cwd: session.cwd, files };
    } else if (smbPath !== undefined) {
      const [rawOperation, ...args] = command.trim().match(/"[^"]*"|'[^']*'|\S+/g)?.map((part) => part.replace(/^['"]|['"]$/g, '')) || [];
      const operation = rawOperation.toLowerCase();
      const remote = (input: string) => resolvePath(input.replace(/\\/g, '/'), `/${smbPath}`, '/').slice(1);
      if (['quit', 'exit'].includes(operation)) {
        smbPath = undefined;
        result = { output: '', cwd: session.cwd, files };
      } else if (operation === 'pwd') result = { output: `Current directory is \\\\${LOG_SHARE}\\${smbShare}\\${smbPath ? smbPath.replace(/\//g, '\\') + '\\' : ''}`, cwd: session.cwd, files };
      else if (operation === 'help' || operation === '?')
        result = { output: args[0] ? `HELP ${args[0]}:\n\t${smbHelp[args[0]] || 'Unknown command'}` : smbHelpList, cwd: session.cwd, files };
      else if (operation === 'history')
        result = { output: history.map((item, i) => `${i + 1}  ${item}`).join('\n'), cwd: session.cwd, files };
      else if (operation === 'lcd') {
        const next = args[0] ? resolvePath(args[0], smbLocalPath, home) : smbLocalPath;
        if (!files.some((file) => file.path === next && file.kind === 'directory'))
          result = { output: `lcd: ${next}: No such directory`, cwd: session.cwd, files };
        else {
          smbLocalPath = next;
          result = { output: `the local directory is now ${smbLocalPath}`, cwd: session.cwd, files };
        }
      } else if (operation === 'prompt' || operation === 'recurse') {
        if (operation === 'prompt') smbPrompt = !smbPrompt;
        else smbRecurse = !smbRecurse;
        result = { output: operation === 'prompt' ? `prompting is now ${smbPrompt ? 'on' : 'off'}` : `directory recursion is now ${smbRecurse ? 'on' : 'off'}`, cwd: session.cwd, files };
      } else if (operation === 'mask') {
        smbMask = args[0] || '*';
        result = { output: '', cwd: session.cwd, files };
      }
      else if (operation === 'cd') {
        const next = remote(args[0] || '.');
        if (
          next &&
          !Object.keys(shareFiles).some((p) => p.startsWith(next + '/'))
        )
          result = { output: 'NT_STATUS_OBJECT_PATH_NOT_FOUND', cwd: session.cwd, files };
        else {
          smbPath = next;
          result = { output: args[0] ? '' : `Current directory is \\\\${LOG_SHARE}\\${smbShare}\\${smbPath ? smbPath.replace(/\//g, '\\') + '\\' : ''}`, cwd: session.cwd, files };
        }
      } else if (operation === 'ls' || operation === 'dir')
        result = {
          output: args[0]?.includes('*') || args[0]?.includes('?')
            ? smbListing(smbPath, args[0], shareFiles)
            : smbListing(remote(args[0] || '.'), '*', shareFiles),
          cwd: session.cwd,
          files,
        };
      else if (operation === 'get') {
        const path = remote(args[0] || '');
        const content = shareFiles[path];
        const localName = args[1] || basename(path);
        const destination = resolvePath(localName, smbLocalPath, home);
        if (smbShare === 'logs' && content !== undefined && destination.startsWith(home + '/') && files.some((file) => file.path === resolvePath('..', destination, home) && file.kind === 'directory')) downloadedPaths = [path];
        result =
          content === undefined
            ? { output: `NT_STATUS_OBJECT_NAME_NOT_FOUND opening remote file \\${path.replace(/\//g, '\\')}`, cwd: session.cwd, files }
            : !destination.startsWith(home + '/') || !files.some((file) => file.path === resolvePath('..', destination, home) && file.kind === 'directory')
              ? { output: `get: local destination unavailable: ${destination}`, cwd: session.cwd, files }
            : {
                output: smbTransferMessage(path, localName, shareFiles),
                cwd: session.cwd,
                files: writeFile(files, destination, content),
                evidence: smbShare === 'logs' ? path : undefined,
              };
      } else if (operation === 'more' || operation === 'allinfo') {
        const path = remote(args[0] || '');
        const content = shareFiles[path];
        result = { output: content === undefined ? `NT_STATUS_OBJECT_NAME_NOT_FOUND getting file \\${path}` : operation === 'more' ? content : `altname: ${basename(path)}\ncreate_time:    Sat Sep 26 00:00:00 2026 KST\naccess_time:    Sat Sep 26 00:00:00 2026 KST\nwrite_time:     Sat Sep 26 00:00:00 2026 KST\nchange_time:    Sat Sep 26 00:00:00 2026 KST\nattributes: A (20)\nstream: [::$DATA], ${content.length} bytes`, cwd: session.cwd, files };
      } else if (operation === 'mget') {
        const pattern = args[0] || '*';
        const matches = Object.keys(shareFiles).filter((path) => {
          const parent = path.slice(0, path.lastIndexOf('/'));
          if (!smbRecurse) return parent === smbPath && matchesSmbPattern(basename(path), pattern);
          if (parent === smbPath) return matchesSmbPattern(basename(path), smbMask) && matchesSmbPattern(basename(path), pattern);
          const relative = parent.slice(smbPath ? smbPath.length + 1 : 0);
          return parent.startsWith(smbPath ? smbPath + '/' : '') && matchesSmbPattern(relative.split('/')[0], pattern) && matchesSmbPattern(basename(path), smbMask);
        });
        if (smbPrompt) {
          smbPending = matches;
          result = { output: '', cwd: session.cwd, files };
        } else if (!smbLocalPath.startsWith(home + '/')) {
          result = { output: `NT_STATUS_ACCESS_DENIED opening local directory ${smbLocalPath}`, cwd: session.cwd, files };
        } else {
          let nextFiles = files;
          for (const path of matches) {
            const relative = smbRecurse ? path.slice(smbPath ? smbPath.length + 1 : 0) : basename(path);
            nextFiles = saveSmbDownload(nextFiles, `${smbLocalPath}/${relative}`, shareFiles[path]);
          }
          if (smbShare === 'logs') downloadedPaths = matches;
          result = { output: matches.map((path) => smbTransferMessage(path, smbRecurse ? path.slice(smbPath ? smbPath.length + 1 : 0) : basename(path), shareFiles)).join('\n'), cwd: session.cwd, files: nextFiles, evidence: smbShare === 'logs' ? matches[0] : undefined };
        }
      } else if (['put', 'mput', 'mkdir', 'md', 'rmdir', 'rd', 'del', 'rm', 'rename'].includes(operation)) {
        result = { output: `NT_STATUS_ACCESS_DENIED ${['put', 'mput'].includes(operation) ? 'opening remote file' : 'on remote operation'} \\${remote(args[0] || '')}`, cwd: session.cwd, files };
      } else
        result = { output: `Unknown command: ${operation}. Type help.`, cwd: session.cwd, files };
    } else
      result = runCommand(
        command,
        session.cwd,
        files,
        profile.username,
        history,
        profile.gameProgress.installedPackages,
      );
    if (result.enterSmb) {
      smbPath = '';
      smbShare = result.enterShare || 'logs';
    }
    const nextSmbPath = smbPath;
    const progressive =
      /^(?:sudo\s+)?apt(?:-get)?\s+(?:update|install)\b/.test(command);
    const outputSteps = result.output.split('\n');
    if (progressive) {
      processingRef.current.add(active);
      setProcessingSessions([...processingRef.current]);
    }
    setSessions((s) =>
      s.map((x) =>
        x.id === active
          ? {
              ...x,
              cwd: result.cwd,
              smbPath: nextSmbPath,
              smbShare,
              smbLocalPath,
              smbPrompt,
              smbRecurse,
              smbMask,
              smbPending,
              history: history.slice(-200),
              lines: result.clear
                ? []
                : [
                    ...x.lines.slice(-199),
                    { command, prompt, output: progressive ? '' : result.output },
                  ],
            }
          : x,
      ),
    );
    setCommand('');
    setIndex(-1);
    if (progressive) {
      let shown = '';
      for (const step of outputSteps) {
        await new Promise<void>((resolve) =>
          setTimeout(
            resolve,
            result.installPackage
              ? 450 + Math.random() * 350
              : result.evidence
                ? 350 + Math.random() * 300
                : 300 + Math.random() * 250,
          ),
        );
        shown += (shown ? '\n' : '') + step;
        const output = shown;
        setSessions((s) =>
          s.map((x) =>
            x.id === active
              ? {
                  ...x,
                  lines: x.lines.map((line, i) =>
                    i === x.lines.length - 1 ? { ...line, output } : line,
                  ),
                }
              : x,
          ),
        );
      }
    }
    if (result.files !== files) setFiles(result.files);
    try {
      if (result.installPackage) await installPackage();
      for (const path of downloadedPaths.length ? downloadedPaths : result.evidences?.length ? result.evidences : result.evidence ? [result.evidence] : [])
        await recordEvidence(path);
    } catch (error) {
      setSessions((s) =>
        s.map((x) =>
          x.id === active
            ? {
                ...x,
                lines: [
                  ...x.lines,
                  {
                    command: '',
                    prompt: '',
                    output: error instanceof Error ? error.message : '진행 상태 저장 실패',
                  },
                ],
              }
            : x,
        ),
      );
    }
    processingRef.current.delete(active);
    setProcessingSessions([...processingRef.current]);
  }
  function key(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const i = index < 0 ? session.history.length - 1 : Math.max(0, index - 1);
      setIndex(i);
      setCommand(session.history[i] || '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const i = index + 1;
      setIndex(i >= session.history.length ? -1 : i);
      setCommand(session.history[i] || '');
    } else if (e.ctrlKey && e.key === 'l') {
      e.preventDefault();
      setSessions((s) => s.map((x) => (x.id === active ? { ...x, lines: [] } : x)));
    } else if (e.ctrlKey && e.key === 'c') {
      e.preventDefault();
      setCommand('');
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const word = command.split(' ').pop() || '';
      const path = resolvePath(word || '.', session.cwd, home);
      const parent = word.includes('/') ? path.slice(0, path.lastIndexOf('/')) : session.cwd;
      const matches = directoryEntries(files, parent, true).filter((f) =>
        basename(f.path).startsWith(word.split('/').pop() || ''),
      );
      if (matches.length === 1)
        setCommand(
          command.slice(0, command.length - word.length) +
            (word.includes('/') ? word.slice(0, word.lastIndexOf('/') + 1) : '') +
            basename(matches[0].path) +
            (matches[0].kind === 'directory' ? '/' : ''),
        );
    }
  }
  return (
    <div className="konsole">
      <NativeMenuBar
        menus={{
          파일: [
            { label: '새 탭', shortcut: 'Ctrl+Shift+T', action: add },
            {
              label: '현재 탭 닫기',
              action: () => {
                if (sessions.length > 1) {
                  setSessions((s) => s.filter((x) => x.id !== active));
                  setActive(sessions.find((s) => s.id !== active)!.id);
                }
              },
            },
          ],
          편집: [
            {
              label: '복사',
              action: () => {
                const text = window.getSelection()?.toString();
                if (text) navigator.clipboard?.writeText(text).catch(() => {});
              },
            },
            {
              label: '붙여넣기',
              action: () =>
                navigator.clipboard
                  ?.readText()
                  .then(setCommand)
                  .catch(() => input.current?.focus()),
            },
            {
              label: '모두 선택',
              action: () => {
                const range = document.createRange();
                const el = bottom.current?.parentNode;
                if (el) {
                  range.selectNodeContents(el);
                  window.getSelection()?.removeAllRanges();
                  window.getSelection()?.addRange(range);
                }
              },
            },
          ],
          보기: [
            { label: '보기 나누기', action: () => setSplit(!split) },
            { label: '글꼴 확대', action: () => setFont((f) => Math.min(24, f + 1)) },
            { label: '글꼴 축소', action: () => setFont((f) => Math.max(10, f - 1)) },
            { label: '검색', action: () => setSearch(!search) },
          ],
          설정: [{ label: '현재 프로필 편집…', action: () => setDialog(true) }],
          도움말: [
            {
              label: '사용 가능한 명령',
              action: () => {
                setCommand('help');
                input.current?.focus();
              },
            },
          ],
        }}
      />
      <div className="konsole-tabbar">
        {sessions.map((s) => (
          <div className={s.id === active ? 'active' : ''} key={s.id}>
            <button
              onClick={() => {
                setActive(s.id);
                setCommand('');
              }}
            >
              ▣ {s.cwd.replace(home, '~')} : bash
            </button>
            {sessions.length > 1 && (
              <button
                aria-label="터미널 탭 닫기"
                onClick={() => {
                  setSessions((v) => v.filter((x) => x.id !== s.id));
                  if (active === s.id) setActive(sessions.find((x) => x.id !== s.id)!.id);
                }}
              >
                <X size={12} />
              </button>
            )}
          </div>
        ))}
        <button aria-label="터미널 새 탭" onClick={add}>
          <Plus size={16} />
        </button>
      </div>
      <div className={`konsole-panes scheme-${scheme}`} style={{ fontSize: font }}>
        <div className="konsole-screen" onClick={() => input.current?.focus()}>
          <p>Linux workstation 6.12.0-amd64 #1 SMP PREEMPT_DYNAMIC Debian x86_64</p>
          <p className="konsole-welcome">
            The programs included with the Debian GNU/Linux system are free software;
            <br />
            the exact distribution terms for each program are described in the
            <br />
            individual files in /usr/share/doc/*/copyright.
            <br />
            <br />
            Debian GNU/Linux comes with ABSOLUTELY NO WARRANTY, to the extent
            <br />
            permitted by applicable law.
          </p>
          {session.lines
            .filter((line) => !query || `${line.command} ${line.output}`.includes(query))
            .map((line, i) => (
              <div key={i}>
                <div className="command-line">
                  <span className="shell-prompt">{line.prompt}</span> {line.command}
                </div>
                <pre>{line.output}</pre>
              </div>
            ))}
          {processing ? (
            <p role="status" className="konsole-processing">
              작업을 진행하고 있습니다…
            </p>
          ) : (
            <form onSubmit={submit}>
              <label className="shell-prompt" htmlFor="konsole-command">
                {prompt}
              </label>
              <input
                ref={input}
                id="konsole-command"
                aria-label="터미널 명령어"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyDown={key}
                autoComplete="off"
                spellCheck={false}
                maxLength={1000}
              />
            </form>
          )}
          <div ref={bottom} />
        </div>
        {split && (
          <div className="konsole-split-info">
            <p>세션 정보</p>
            <pre>{`USER=${profile.username}\nSHELL=/bin/bash\nHOME=${home}\nPWD=${session.cwd}\nTERM=xterm-256color\nLANG=ko_KR.UTF-8`}</pre>
            <button onClick={() => setSplit(false)}>분할 보기 닫기</button>
          </div>
        )}
      </div>
      {search && (
        <div className="konsole-search">
          <Search size={15} />
          <input
            aria-label="터미널 출력 검색"
            placeholder="출력 검색…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            onClick={() => {
              setSearch(false);
              setQuery('');
            }}
          >
            <X size={15} />
          </button>
        </div>
      )}
      <footer className="native-status">
        <span>{processing ? '실행 중…' : '기본 프로필'}</span>
        <span>UTF-8 · bash · {session.cwd}</span>
      </footer>
      {dialog && (
        <NativeDialog title="프로필 편집 — Konsole" onClose={() => setDialog(false)}>
          <div className="dialog-body">
            <h3>모양</h3>
            <label>
              색 구성표
              <select value={scheme} onChange={(e) => setScheme(e.target.value)}>
                <option value="black">검정 바탕에 흰색</option>
                <option value="breeze">Breeze</option>
                <option value="solarized">Solarized Dark</option>
              </select>
            </label>
            <label>
              글꼴 크기
              <input
                type="number"
                min={10}
                max={24}
                value={font}
                onChange={(e) => setFont(Math.max(10, Math.min(24, Number(e.target.value))))}
              />
            </label>
          </div>
          <footer>
            <button className="native-button" onClick={() => setDialog(false)}>
              확인
            </button>
          </footer>
        </NativeDialog>
      )}
    </div>
  );
}
