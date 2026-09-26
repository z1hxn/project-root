'use client';
import { useEffect, useRef, useState } from 'react';
import {
  FolderPlus,
  FileText,
  Copy,
  Scissors,
  Clipboard,
  Edit3,
  Trash2,
  Info,
  Image,
  RefreshCw,
  LayoutGrid,
  Check,
  LockKeyhole,
  Terminal,
  ArrowUpRight,
} from 'lucide-react';
import { useWorkspace } from '@/features/workspace/context';
import {
  basename,
  directoryEntries,
  homePath,
  initialFiles,
  makeDirectory,
  writeFile,
  renameFile,
  moveToTrash,
  trashPath,
  pasteFiles,
  type GameFile,
} from '@/game/filesystem';
import { FileIcon, fileApp } from '@/apps/Files';
import { NativeDialog } from '@/components/ui/Native';
type Position = { x: number; y: number };
export function DesktopSurface({ onRunner }: { onRunner: () => void }) {
  const {
    profile,
    files,
    setFiles,
    settings,
    openApp,
    openText,
    notify: workspaceNotify,
    setFileLocation,
    clipboard,
    setClipboard,
    setSettingsPage,
  } = useWorkspace();
  const notify = (message: string) => workspaceNotify(message, 'files');
  const home = homePath(profile.username);
  const desktop = home + '/Desktop';
  const entries: GameFile[] = [
    { path: '$home', kind: 'directory', modified: '' },
    { path: '$trash', kind: 'directory', modified: '' },
    ...directoryEntries(files, desktop),
  ];
  const [saved, setSaved] = useState<Record<string, Position>>({});
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [menu, setMenu] = useState<{ x: number; y: number; item: boolean } | null>(null);
  const [grid, setGrid] = useState(true);
  const [locked, setLocked] = useState(false);
  const [modal, setModal] = useState<'folder' | 'text' | 'rename' | 'properties' | null>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [selection, setSelection] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [surfaceSize, setSurfaceSize] = useState({ width: 1400, height: 800 });
  const surface = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    start: Position;
    origins: Record<string, Position>;
    moved: boolean;
  } | null>(null);
  const marquee = useRef<Position | null>(null);
  const moved = useRef(false);
  const current = entries.find((f) => f.path === selected[0]);
  useEffect(() => {
    try {
      const data = JSON.parse(localStorage.getItem(`root-desktop:${profile.username}`) || '{}');
      if (data.positions && typeof data.positions === 'object') {
        const clean: Record<string, Position> = {};
        for (const [k, v] of Object.entries(data.positions)) {
          const p = v as Position;
          if (Number.isFinite(p.x) && Number.isFinite(p.y))
            clean[k] = { x: Math.max(0, p.x), y: Math.max(0, p.y) };
        }
        setSaved(clean);
      }
      setGrid(data.grid !== false);
      setLocked(!!data.locked);
    } catch {}
    setReady(true);
  }, [profile.username]);
  useEffect(() => {
    if (ready)
      try {
        localStorage.setItem(
          `root-desktop:${profile.username}`,
          JSON.stringify({ positions: saved, grid, locked }),
        );
      } catch {}
  }, [saved, grid, locked, ready, profile.username]);
  useEffect(() => {
    const resize = () => {
      if (surface.current)
        setSurfaceSize({
          width: surface.current.clientWidth,
          height: surface.current.clientHeight,
        });
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [settings.panelPosition, settings.panelHeight]);
  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    window.addEventListener('pointerdown', close);
    return () => window.removeEventListener('pointerdown', close);
  }, [menu]);
  const rows = Math.max(1, Math.floor((surfaceSize.height - 20) / 104));
  const position = (key: string, i: number) => ({
    x: Math.min(
      saved[key]?.x ?? 16 + Math.floor(i / rows) * 100,
      Math.max(0, surfaceSize.width - 96),
    ),
    y: Math.min(saved[key]?.y ?? 12 + (i % rows) * 104, Math.max(0, surfaceSize.height - 98)),
  });
  const label = (f: GameFile) =>
    f.path === '$home'
      ? '홈'
      : f.path === '$trash'
        ? '휴지통'
        : basename(f.path).replace(/\.desktop$/, '');
  function open(file: GameFile) {
    if (file.path === '$home' || file.path === '$trash') {
      setFileLocation(file.path === '$home' ? home : trashPath(profile.username));
      openApp('files');
      return;
    }
    const app = fileApp(file);
    if (app) openApp(app);
    else if (file.kind === 'file') openText(file.path);
    else {
      setFileLocation(file.path);
      openApp('files');
    }
  }
  function begin(type: typeof modal) {
    setModal(type);
    setName(
      type === 'rename' && current ? label(current) : type === 'folder' ? '새 폴더' : '새 문서.txt',
    );
    setMenu(null);
    setError('');
  }
  function commit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (!name.trim() || name.includes('/') || name === '.' || name === '..')
        throw Error('올바른 이름을 입력하세요.');
      const target =
        desktop +
        '/' +
        name.trim() +
        (modal === 'rename' && current?.path.endsWith('.desktop') ? '.desktop' : '');
      if (modal === 'folder') setFiles(makeDirectory(files, target));
      else if (modal === 'text') {
        if (files.some((f) => f.path === target)) throw Error('같은 이름이 있습니다.');
        setFiles(writeFile(files, target, ''));
      } else if (modal === 'rename' && current) {
        setFiles(renameFile(files, current.path, target));
        if (saved[current.path]) setSaved((p) => ({ ...p, [target]: p[current.path] }));
      }
      setModal(null);
      setSelected([target]);
    } catch (e) {
      setError(e instanceof Error ? e.message : '변경 실패');
    }
  }
  function remove() {
    if (selected.some((p) => p.startsWith('$'))) {
      notify('홈과 휴지통은 워크스테이션의 기본 폴더입니다. 삭제할 수 없습니다.');
      setMenu(null);
      return;
    }
    const paths = selected.filter((p) => !p.startsWith('$'));
    try {
      setFiles(moveToTrash(files, paths, profile.username));
    } catch (e) {
      notify(e instanceof Error ? e.message : '삭제할 수 없습니다.');
    }
    setSelected([]);
    setMenu(null);
  }
  function paste() {
    try {
      if (clipboard) {
        setFiles(pasteFiles(files, clipboard.paths, desktop, clipboard.cut));
        if (clipboard.cut) setClipboard(null);
      }
    } catch (e) {
      notify(e instanceof Error ? e.message : '붙여넣기 실패');
    }
    setMenu(null);
  }
  function arrange() {
    setSaved({});
    setMenu(null);
  }
  function restore() {
    const defaults = initialFiles(profile.username).filter(
      (f) => f.path.startsWith(desktop + '/') && f.path.endsWith('.desktop'),
    );
    setFiles([...files, ...defaults.filter((f) => !files.some((x) => x.path === f.path))]);
    setSaved({});
    setMenu(null);
  }
  return (
    <>
      <div
        ref={surface}
        className="plasma-desktop-surface"
        tabIndex={0}
        aria-label="바탕화면"
        onContextMenu={(e) => {
          e.preventDefault();
          if (e.target === e.currentTarget) setSelected([]);
          setMenu({
            x: Math.max(0, Math.min(e.clientX, innerWidth - 260)),
            y: Math.max(0, Math.min(e.clientY, innerHeight - 410)),
            item: !!(e.target as HTMLElement).closest('.plasma-desktop-icon'),
          });
        }}
        onKeyDown={(e) => {
          if (e.key === 'F2' && current && !current.path.startsWith('$')) {
            e.preventDefault();
            begin('rename');
          }
          if (e.key === 'Delete') {
            e.preventDefault();
            remove();
          }
          if (e.key === 'Enter' && current) open(current);
          if (e.key === 'Escape') {
            setMenu(null);
            setSelected([]);
          }
          if (e.ctrlKey && e.key === 'a') {
            e.preventDefault();
            setSelected(entries.map((f) => f.path));
          }
          if (e.ctrlKey && e.key === 'c') {
            e.preventDefault();
            setClipboard({ paths: selected.filter((p) => !p.startsWith('$')), cut: false });
          }
          if (e.ctrlKey && e.key === 'v') {
            e.preventDefault();
            paste();
          }
        }}
        onPointerDown={(e) => {
          if (e.target !== e.currentTarget || e.button !== 0) return;
          setSelected([]);
          surface.current?.focus();
          const r = e.currentTarget.getBoundingClientRect();
          marquee.current = { x: e.clientX - r.left, y: e.clientY - r.top };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!marquee.current) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const end = { x: e.clientX - rect.left, y: e.clientY - rect.top };
          const box = {
            x: Math.min(end.x, marquee.current.x),
            y: Math.min(end.y, marquee.current.y),
            width: Math.abs(end.x - marquee.current.x),
            height: Math.abs(end.y - marquee.current.y),
          };
          setSelection(box);
          setSelected(
            entries
              .filter((f, i) => {
                const p = position(f.path, i);
                return (
                  p.x + 90 >= box.x &&
                  p.x <= box.x + box.width &&
                  p.y + 90 >= box.y &&
                  p.y <= box.y + box.height
                );
              })
              .map((f) => f.path),
          );
        }}
        onPointerUp={() => {
          marquee.current = null;
          setSelection(null);
        }}
        onPointerCancel={() => {
          marquee.current = null;
          setSelection(null);
        }}
      >
        {settings.desktopIcons &&
          entries.map((file, i) => {
            const p = position(file.path, i);
            return (
              <button
                key={file.path}
                className={`plasma-desktop-icon ${selected.includes(file.path) ? 'selected' : ''}`}
                aria-label={label(file)}
                style={{ left: p.x, top: p.y }}
                onClick={(e) => {
                  if (moved.current) {
                    moved.current = false;
                    return;
                  }
                  if (e.ctrlKey || e.metaKey)
                    setSelected((s) =>
                      s.includes(file.path) ? s.filter((x) => x !== file.path) : [...s, file.path],
                    );
                  else setSelected([file.path]);
                  if (settings.clickMode === 'single' && !e.ctrlKey && !e.metaKey) open(file);
                }}
                onDoubleClick={() => {
                  if (settings.clickMode === 'double') open(file);
                }}
                onContextMenu={() => {
                  if (!selected.includes(file.path)) setSelected([file.path]);
                }}
                onPointerDown={(e) => {
                  if (e.button !== 0 || locked) return;
                  e.stopPropagation();
                  const keys = selected.includes(file.path) ? selected : [file.path];
                  if (!selected.includes(file.path) && !e.ctrlKey) setSelected([file.path]);
                  const origins: Record<string, Position> = {};
                  for (const key of keys)
                    origins[key] = position(
                      key,
                      entries.findIndex((f) => f.path === key),
                    );
                  drag.current = { start: { x: e.clientX, y: e.clientY }, origins, moved: false };
                  moved.current = false;
                  e.currentTarget.setPointerCapture(e.pointerId);
                }}
                onPointerMove={(e) => {
                  const d = drag.current;
                  if (!d) return;
                  const dx = e.clientX - d.start.x,
                    dy = e.clientY - d.start.y;
                  if (Math.abs(dx) + Math.abs(dy) < 5 && !d.moved) return;
                  d.moved = true;
                  moved.current = true;
                  setSaved((old) => {
                    const next = { ...old };
                    for (const [key, p] of Object.entries(d.origins))
                      next[key] = {
                        x: Math.max(0, Math.min(p.x + dx, surfaceSize.width - 96)),
                        y: Math.max(0, Math.min(p.y + dy, surfaceSize.height - 98)),
                      };
                    return next;
                  });
                }}
                onPointerUp={() => {
                  const d = drag.current;
                  if (d?.moved && grid)
                    setSaved((old) => {
                      const next = { ...old };
                      for (const key of Object.keys(d.origins)) {
                        const p = old[key];
                        if (p)
                          next[key] = {
                            x: Math.max(0, Math.round((p.x - 16) / 100) * 100 + 16),
                            y: Math.max(0, Math.round((p.y - 12) / 104) * 104 + 12),
                          };
                      }
                      return next;
                    });
                  drag.current = null;
                }}
                onPointerCancel={() => {
                  drag.current = null;
                }}
              >
                {file.path === '$home' || file.path === '$trash' ? (
                  <img
                    src={`/assets/icons/${file.path === '$home' ? 'home' : 'trash'}.svg`}
                    width={settings.iconSize}
                    height={settings.iconSize}
                    alt=""
                    draggable={false}
                  />
                ) : (
                  <FileIcon file={file} size={settings.iconSize} />
                )}
                <span>{label(file)}</span>
              </button>
            );
          })}
        {selection && (
          <div
            className="desktop-selection"
            style={{
              left: selection.x,
              top: selection.y,
              width: selection.width,
              height: selection.height,
            }}
          />
        )}
      </div>
      {menu && (
        <div
          className="native-context desktop-context"
          role="menu"
          style={{ left: menu.x, top: menu.y }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {menu.item && current ? (
            <>
              <button
                onClick={() => {
                  open(current);
                  setMenu(null);
                }}
              >
                <ArrowUpRight size={16} />
                열기
              </button>
              <hr />
              <button
                disabled={current.path.startsWith('$')}
                onClick={() => {
                  setClipboard({ paths: selected.filter((p) => !p.startsWith('$')), cut: false });
                  setMenu(null);
                }}
              >
                <Copy size={15} />
                복사<kbd>Ctrl+C</kbd>
              </button>
              <button
                disabled={current.path.startsWith('$')}
                onClick={() => {
                  setClipboard({ paths: selected.filter((p) => !p.startsWith('$')), cut: true });
                  setMenu(null);
                }}
              >
                <Scissors size={15} />
                잘라내기<kbd>Ctrl+X</kbd>
              </button>
              <button disabled={current.path.startsWith('$')} onClick={() => begin('rename')}>
                <Edit3 size={15} />
                이름 바꾸기…<kbd>F2</kbd>
              </button>
              <button disabled={current.path.startsWith('$')} onClick={remove}>
                <Trash2 size={15} />
                휴지통으로 이동<kbd>Delete</kbd>
              </button>
              <hr />
              <button onClick={() => begin('properties')}>
                <Info size={15} />
                속성
              </button>
            </>
          ) : (
            <>
              <button onClick={() => begin('folder')}>
                <FolderPlus size={16} />새 폴더…
              </button>
              <button onClick={() => begin('text')}>
                <FileText size={16} />
                텍스트 파일…
              </button>
              <button disabled={!clipboard?.paths.length} onClick={paste}>
                <Clipboard size={16} />
                붙여넣기<kbd>Ctrl+V</kbd>
              </button>
              <hr />
              <button onClick={arrange}>
                <LayoutGrid size={16} />
                이름순으로 정렬
              </button>
              <button
                onClick={() => {
                  setGrid(!grid);
                  setMenu(null);
                }}
              >
                {grid ? <Check size={16} /> : <span />}격자에 맞추기
              </button>
              <button
                onClick={() => {
                  setLocked(!locked);
                  setMenu(null);
                }}
              >
                {locked ? <Check size={16} /> : <LockKeyhole size={16} />}아이콘 위치 잠금
              </button>
              <button onClick={restore}>
                <RefreshCw size={16} />
                기본 바로가기 복원
              </button>
              <hr />
              <button
                onClick={() => {
                  setMenu(null);
                  onRunner();
                }}
              >
                <Terminal size={16} />
                명령 실행…<kbd>Alt+Space</kbd>
              </button>
              <button
                onClick={() => {
                  setSettingsPage('wallpaper');
                  openApp('settings');
                  setMenu(null);
                }}
              >
                <Image size={16} />
                바탕화면 및 배경 그림 설정…
              </button>
            </>
          )}
        </div>
      )}
      {modal && (
        <NativeDialog
          title={
            modal === 'properties'
              ? '속성'
              : modal === 'folder'
                ? '새 폴더'
                : modal === 'text'
                  ? '새 텍스트 파일'
                  : '이름 바꾸기'
          }
          onClose={() => setModal(null)}
        >
          {modal === 'properties' ? (
            <>
              <div className="dialog-body">
                {current && <FileIcon file={current} size={64} />}
                <h3>{current ? label(current) : '바탕화면'}</h3>
                <dl className="system-details">
                  <dt>유형</dt>
                  <dd>
                    {current?.path.endsWith('.desktop')
                      ? '프로그램 바로가기'
                      : current?.kind === 'directory'
                        ? '폴더'
                        : '파일'}
                  </dd>
                  <dt>위치</dt>
                  <dd>{current?.path.startsWith('$') ? home : current?.path}</dd>
                  <dt>소유자</dt>
                  <dd>{profile.username}</dd>
                  <dt>권한</dt>
                  <dd>읽기 및 쓰기</dd>
                </dl>
              </div>
              <footer>
                <button className="native-button" onClick={() => setModal(null)}>
                  확인
                </button>
              </footer>
            </>
          ) : (
            <form onSubmit={commit}>
              <div className="dialog-body">
                <label>
                  이름
                  <input
                    aria-label="항목 이름"
                    autoFocus
                    maxLength={80}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onFocus={(e) => e.target.select()}
                  />
                </label>
                {error && (
                  <p className="native-error" role="alert">
                    {error}
                  </p>
                )}
              </div>
              <footer>
                <button className="native-button" type="button" onClick={() => setModal(null)}>
                  취소
                </button>
                <button className="native-button apply-button" type="submit">
                  확인
                </button>
              </footer>
            </form>
          )}
        </NativeDialog>
      )}
    </>
  );
}
