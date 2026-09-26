'use client';
import { useEffect, useRef, useState } from 'react';
import { Plus, X, Copy, Clipboard, SplitSquareHorizontal, Search } from 'lucide-react';
import { useWorkspace } from '@/features/workspace/context';
import { runCommand, homePath, directoryEntries, resolvePath, basename } from '@/game/filesystem';
import { NativeMenuBar, NativeDialog } from '@/components/ui/Native';
interface TerminalSession {
  id: number;
  cwd: string;
  lines: { command: string; prompt: string; output: string }[];
  history: string[];
}
export function TerminalApp() {
  const { profile, files, setFiles } = useWorkspace();
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
  const input = useRef<HTMLInputElement>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const seq = useRef(1);
  const session = sessions.find((s) => s.id === active)!;
  const cwd = session.cwd === home ? '~' : session.cwd.replace(home, '~');
  const prompt = `${profile.username}@workstation:${cwd}$`;
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'nearest' });
  }, [session.lines]);
  function add() {
    const id = ++seq.current;
    setSessions((s) => [...s, { id, cwd: home, lines: [], history: [] }]);
    setActive(id);
    setCommand('');
  }
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!command.trim()) return;
    const history = [...session.history, command];
    const result = runCommand(command, session.cwd, files, profile.username, history);
    setSessions((s) =>
      s.map((x) =>
        x.id === active
          ? {
              ...x,
              cwd: result.cwd,
              history: history.slice(-200),
              lines: result.clear
                ? []
                : [...x.lines.slice(-199), { command, prompt, output: result.output }],
            }
          : x,
      ),
    );
    if (result.files !== files) setFiles(result.files);
    setCommand('');
    setIndex(-1);
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
        <span>기본 프로필</span>
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
