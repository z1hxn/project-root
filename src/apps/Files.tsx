'use client';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Home,
  ChevronRight,
  Search,
  LayoutGrid,
  List,
  ListTree,
  PanelRight,
  SplitSquareHorizontal,
  Menu,
  FolderPlus,
  FileText,
  Copy,
  Scissors,
  Clipboard,
  Trash2,
  Info,
  Edit3,
  Folder,
  HardDrive,
  Network,
  Download,
  Music,
  Image,
  Film,
  Eye,
  X,
  Save,
  Check,
} from 'lucide-react';
import { useWorkspace } from '@/features/workspace/context';
import {
  basename,
  directoryEntries,
  homePath,
  parentPath,
  makeDirectory,
  writeFile,
  renameFile,
  moveToTrash,
  assertMutablePaths,
  trashPath,
  pasteFiles,
  type GameFile,
} from '@/game/filesystem';
import { NativeMenuBar, NativeDialog, ToolButton } from '@/components/ui/Native';
import { AppIcon } from '@/components/desktop/AppIcon';
import { applications, type AppId } from '@/components/desktop/apps';
export function fileApp(file: GameFile): AppId | undefined {
  const id = file.content?.match(/^X-Root-App=(.+)$/m)?.[1];
  return applications.find((a) => a.id === id)?.id;
}
export function FileIcon({ file, size = 48 }: { file: GameFile; size?: number }) {
  const app = fileApp(file);
  return app ? (
    <AppIcon id={app} size={size} />
  ) : file.kind === 'directory' ? (
    <img src="/assets/icons/folder.svg" width={size} height={size} alt="" draggable={false} />
  ) : (
    <FileText size={size} strokeWidth={1} className="document-file-icon" />
  );
}
export function Files() {
  const {
    profile,
    files,
    setFiles,
    settings,
    openApp,
    openText,
    fileLocation,
    setFileLocation,
    clipboard,
    setClipboard,
    notify: workspaceNotify,
  } = useWorkspace();
  const notify = (message: string) => workspaceNotify(message, 'files');
  const home = homePath(profile.username);
  const [path, setPath] = useState(fileLocation || home);
  const [backStack, setBackStack] = useState<string[]>([]);
  const [forwardStack, setForwardStack] = useState<string[]>([]);
  const [view, setView] = useState<'icons' | 'compact' | 'details'>('icons');
  const [hidden, setHidden] = useState(settings.showHiddenFiles);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [editingPath, setEditingPath] = useState(false);
  const [address, setAddress] = useState(path);
  const [selected, setSelected] = useState<string[]>([]);
  const [sort, setSort] = useState('name');
  const [info, setInfo] = useState(true);
  const [split, setSplit] = useState(false);
  const [context, setContext] = useState<{ x: number; y: number } | null>(null);
  const [modal, setModal] = useState<'folder' | 'text' | 'rename' | 'properties' | null>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [iconSize, setIconSize] = useState(48);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (fileLocation && fileLocation !== path) {
      setPath(fileLocation);
      setSelected([]);
    }
  }, [fileLocation]);
  useEffect(() => {
    if (!context) return;
    const close = () => setContext(null);
    window.addEventListener('pointerdown', close);
    return () => window.removeEventListener('pointerdown', close);
  }, [context]);
  let entries = directoryEntries(files, path, hidden).filter((f) =>
    basename(f.path).toLowerCase().includes(query.toLowerCase()),
  );
  if (sort === 'modified')
    entries = [...entries].sort((a, b) => b.modified.localeCompare(a.modified));
  if (sort === 'type') entries = [...entries].sort((a, b) => a.kind.localeCompare(b.kind));
  const current = files.find((f) => f.path === selected[0]);
  function go(next: string) {
    if (!files.some((f) => f.path === next && f.kind === 'directory')) {
      setError('폴더를 찾을 수 없습니다.');
      return;
    }
    setBackStack((v) => [...v, path]);
    setForwardStack([]);
    setPath(next);
    setFileLocation(next);
    setAddress(next);
    setSelected([]);
    setQuery('');
    setError('');
  }
  function open(file: GameFile) {
    const app = fileApp(file);
    if (app) openApp(app);
    else if (file.kind === 'directory') go(file.path);
    else openText(file.path);
  }
  function select(e: React.MouseEvent, file: GameFile) {
    if (e.ctrlKey || e.metaKey)
      setSelected((v) =>
        v.includes(file.path) ? v.filter((p) => p !== file.path) : [...v, file.path],
      );
    else setSelected([file.path]);
    if (settings.clickMode === 'single' && !e.ctrlKey && !e.metaKey) open(file);
  }
  function startModal(type: typeof modal) {
    setModal(type);
    setName(
      type === 'rename' && current
        ? basename(current.path)
        : type === 'folder'
          ? '새 폴더'
          : '새 문서.txt',
    );
    setContext(null);
    setError('');
  }
  function remove() {
    try {
      assertMutablePaths(selected);
      if (path === trashPath(profile.username)) {
        setFiles(
          files.filter((f) => !selected.some((p) => f.path === p || f.path.startsWith(p + '/'))),
        );
      } else setFiles(moveToTrash(files, selected, profile.username));
      setSelected([]);
      setContext(null);
    } catch (e) {
      setContext(null);
      setError(e instanceof Error ? e.message : '삭제할 수 없습니다.');
    }
  }
  function paste() {
    if (!clipboard) return;
    try {
      setFiles(pasteFiles(files, clipboard.paths, path, clipboard.cut));
      if (clipboard.cut) setClipboard(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : '붙여넣기 실패');
    }
    setContext(null);
  }
  function commit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (!name.trim() || name.includes('/') || name === '.' || name === '..')
        throw Error('올바른 이름을 입력하세요.');
      const next = path + '/' + name.trim();
      if (modal === 'folder') setFiles(makeDirectory(files, next));
      if (modal === 'text') {
        if (files.some((f) => f.path === next)) throw Error('같은 이름이 이미 있습니다.');
        setFiles(writeFile(files, next, ''));
      }
      if (modal === 'rename' && current) setFiles(renameFile(files, current.path, next));
      setModal(null);
      setSelected([next]);
    } catch (e) {
      setError(e instanceof Error ? e.message : '변경 실패');
    }
  }
  const places = [
    { name: '홈', path: home, icon: Home },
    { name: '바탕화면', path: home + '/Desktop', icon: LayoutGrid },
    { name: '문서', path: home + '/Documents', icon: FileText },
    { name: '다운로드', path: home + '/Downloads', icon: Download },
    { name: '음악', path: home + '/Music', icon: Music },
    { name: '사진', path: home + '/Pictures', icon: Image },
    { name: '동영상', path: home + '/Videos', icon: Film },
    { name: '휴지통', path: trashPath(profile.username), icon: Trash2 },
  ];
  return (
    <div
      className="dolphin"
      ref={ref}
      tabIndex={-1}
      onKeyDown={(e) => {
        if ((e.target as HTMLElement).matches('input,textarea')) return;
        if (e.key === 'F2' && current) {
          e.preventDefault();
          startModal('rename');
        }
        if (e.key === 'Delete' && selected.length) {
          e.preventDefault();
          remove();
        }
        if (e.ctrlKey && e.key === 'h') {
          e.preventDefault();
          setHidden(!hidden);
        }
        if (e.ctrlKey && e.key === 'l') {
          e.preventDefault();
          setEditingPath(true);
          setAddress(path);
        }
        if (e.ctrlKey && e.key === 'a') {
          e.preventDefault();
          setSelected(entries.map((f) => f.path));
        }
        if (e.ctrlKey && ['c', 'x'].includes(e.key)) {
          e.preventDefault();
          setClipboard({ paths: selected, cut: e.key === 'x' });
        }
        if (e.ctrlKey && e.key === 'v') {
          e.preventDefault();
          paste();
        }
      }}
    >
      <NativeMenuBar
        menus={{
          파일: [
            { label: '새 폴더…', shortcut: 'F10', action: () => startModal('folder') },
            { label: '새 텍스트 파일…', action: () => startModal('text') },
            { label: '속성', shortcut: 'Alt+Enter', action: () => startModal('properties') },
          ],
          편집: [
            {
              label: '잘라내기',
              shortcut: 'Ctrl+X',
              action: () => setClipboard({ paths: selected, cut: true }),
              disabled: !selected.length,
            },
            {
              label: '복사',
              shortcut: 'Ctrl+C',
              action: () => setClipboard({ paths: selected, cut: false }),
              disabled: !selected.length,
            },
            { label: '붙여넣기', shortcut: 'Ctrl+V', action: paste, disabled: !clipboard },
            {
              label: '이름 바꾸기…',
              shortcut: 'F2',
              action: () => startModal('rename'),
              disabled: !current,
            },
            {
              label: '휴지통으로 이동',
              shortcut: 'Delete',
              action: remove,
              disabled: !selected.length,
            },
          ],
          보기: [
            { label: '아이콘 보기', action: () => setView('icons') },
            { label: '간단히 보기', action: () => setView('compact') },
            { label: '자세히 보기', action: () => setView('details') },
            {
              label: hidden ? '숨김 파일 숨기기' : '숨김 파일 표시',
              shortcut: 'Ctrl+H',
              action: () => setHidden(!hidden),
            },
            { label: '정보 패널', action: () => setInfo(!info) },
          ],
          이동: [
            { label: '홈', action: () => go(home) },
            { label: '상위 폴더', action: () => go(parentPath(path)) },
            {
              label: '위치 입력',
              shortcut: 'Ctrl+L',
              action: () => {
                setAddress(path);
                setEditingPath(true);
              },
            },
          ],
          도구: [{ label: '터미널 열기', action: () => openApp('terminal') }],
          설정: [{ label: '시스템 설정', action: () => openApp('settings') }],
          도움말: [
            {
              label: 'Dolphin 정보',
              action: () => {
                setSelected([]);
                startModal('properties');
              },
            },
          ],
        }}
      />
      <div className="dolphin-toolbar">
        <ToolButton
          label="뒤로"
          disabled={!backStack.length}
          onClick={() => {
            const prev = backStack.at(-1)!;
            setForwardStack((s) => [path, ...s]);
            setBackStack((s) => s.slice(0, -1));
            setPath(prev);
            setFileLocation(prev);
            setSelected([]);
          }}
        >
          <ArrowLeft size={20} />
        </ToolButton>
        <ToolButton
          label="앞으로"
          disabled={!forwardStack.length}
          onClick={() => {
            const next = forwardStack[0];
            setBackStack((s) => [...s, path]);
            setForwardStack((s) => s.slice(1));
            setPath(next);
            setFileLocation(next);
            setSelected([]);
          }}
        >
          <ArrowRight size={20} />
        </ToolButton>
        <ToolButton label="상위 폴더" disabled={path === '/'} onClick={() => go(parentPath(path))}>
          <ArrowUp size={20} />
        </ToolButton>
        <span className="toolbar-separator" />
        {(['icons', 'compact', 'details'] as const).map((v, i) => {
          const Icon = [LayoutGrid, List, ListTree][i];
          return (
            <ToolButton
              key={v}
              label={['아이콘 보기', '간단히 보기', '자세히 보기'][i]}
              active={view === v}
              onClick={() => setView(v)}
            >
              <Icon size={20} />
            </ToolButton>
          );
        })}
        <span className="toolbar-spacer" />
        <ToolButton label="분할 보기" active={split} onClick={() => setSplit(!split)}>
          <SplitSquareHorizontal size={19} />
        </ToolButton>
        <ToolButton label="정보 패널" active={info} onClick={() => setInfo(!info)}>
          <PanelRight size={19} />
        </ToolButton>
        <ToolButton label="파일 검색" active={searching} onClick={() => setSearching(!searching)}>
          <Search size={20} />
        </ToolButton>
        <ToolButton label="새 폴더" onClick={() => startModal('folder')}>
          <FolderPlus size={20} />
        </ToolButton>
      </div>
      <div className="dolphin-location">
        <Home size={16} />
        {editingPath ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              go(address);
              setEditingPath(false);
            }}
          >
            <input
              autoFocus
              aria-label="폴더 위치"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onBlur={() => setEditingPath(false)}
            />
          </form>
        ) : (
          <div
            className="breadcrumbs"
            onDoubleClick={() => {
              setAddress(path);
              setEditingPath(true);
            }}
          >
            <button onClick={() => go(home)}>홈</button>
            {(path.startsWith(home) ? path.slice(home.length) : path)
              .split('/')
              .filter(Boolean)
              .map((part, i, all) => (
                <span key={i}>
                  <ChevronRight size={14} />
                  <button
                    onClick={() =>
                      go((path.startsWith(home) ? home : '') + '/' + all.slice(0, i + 1).join('/'))
                    }
                  >
                    {part}
                  </button>
                </span>
              ))}
          </div>
        )}
        <button title="정렬 순서" onClick={() => setSort(sort === 'name' ? 'modified' : 'name')}>
          {sort === 'name' ? '이름순' : '수정한 날짜순'}
          <ChevronRight size={12} />
        </button>
      </div>
      {searching && (
        <label className="dolphin-search">
          <Search size={16} />
          <input
            autoFocus
            aria-label="파일 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="현재 폴더에서 검색…"
          />
          <button
            onClick={() => {
              setSearching(false);
              setQuery('');
            }}
          >
            <X size={15} />
          </button>
        </label>
      )}
      <div className="dolphin-body">
        <aside className="dolphin-places">
          <h3>위치</h3>
          {places.map((p) => (
            <button
              key={p.path}
              className={path === p.path ? 'selected' : ''}
              onClick={() => go(p.path)}
            >
              <p.icon size={17} />
              {p.name}
            </button>
          ))}
          <h3>원격</h3>
          <button
            onClick={() => {
              setError('사용 가능한 원격 공유가 없습니다.');
            }}
          >
            <Network size={17} />
            네트워크
          </button>
          <h3>장치</h3>
          <button className={path === '/' ? 'selected' : ''} onClick={() => go('/')}>
            <HardDrive size={17} />
            루트
          </button>
        </aside>
        <div
          className={`dolphin-files ${view}`}
          onContextMenu={(e) => {
            e.preventDefault();
            setContext({
              x: Math.min(e.clientX, innerWidth - 230),
              y: Math.min(e.clientY, innerHeight - 370),
            });
          }}
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) setSelected([]);
          }}
        >
          {view === 'details' && (
            <div className="file-details-head">
              <button onClick={() => setSort('name')}>이름</button>
              <span>크기</span>
              <span>유형</span>
              <button onClick={() => setSort('modified')}>수정한 날짜</button>
            </div>
          )}
          {entries.map((f) => (
            <button
              key={f.path}
              draggable
              className={`file-entry ${selected.includes(f.path) ? 'selected' : ''}`}
              onClick={(e) => select(e, f)}
              onDoubleClick={() => {
                if (settings.clickMode === 'double') open(f);
              }}
              onContextMenu={() => setSelected((v) => (v.includes(f.path) ? v : [f.path]))}
              onDragStart={(e) => {
                e.dataTransfer.setData(
                  'application/x-root-files',
                  JSON.stringify(selected.includes(f.path) ? selected : [f.path]),
                );
              }}
              onDragOver={(e) => {
                if (f.kind === 'directory') e.preventDefault();
              }}
              onDrop={(e) => {
                e.preventDefault();
                try {
                  const paths = JSON.parse(e.dataTransfer.getData('application/x-root-files'));
                  setFiles(pasteFiles(files, paths, f.path, true));
                } catch (e) {
                  setError(e instanceof Error ? e.message : '이동할 수 없습니다.');
                }
              }}
            >
              <FileIcon file={f} size={view === 'icons' ? iconSize : 20} />
              <span className="file-name">{basename(f.path).replace(/\.desktop$/, '')}</span>
              {view === 'details' && (
                <>
                  <span>{f.kind === 'directory' ? '—' : `${f.content?.length || 0} B`}</span>
                  <span>
                    {f.kind === 'directory'
                      ? '폴더'
                      : f.path.endsWith('.desktop')
                        ? '데스크톱 파일'
                        : '텍스트 문서'}
                  </span>
                  <span>{new Date(f.modified).toLocaleDateString('ko-KR')}</span>
                </>
              )}
            </button>
          ))}
          {!entries.length && (
            <div className="dolphin-empty">
              <Folder size={52} strokeWidth={1} />
              <span>{query ? '일치하는 항목이 없습니다.' : '폴더가 비어 있습니다.'}</span>
            </div>
          )}
        </div>
        {split && (
          <div className="dolphin-secondary">
            <header>홈</header>
            {directoryEntries(files, home).map((f) => (
              <button key={f.path} onClick={() => open(f)}>
                <FileIcon file={f} size={28} />
                {basename(f.path)}
              </button>
            ))}
          </div>
        )}
        {info && (
          <aside className="dolphin-info">
            {current ? (
              <>
                <FileIcon file={current} size={90} />
                <h3>{basename(current.path).replace(/\.desktop$/, '')}</h3>
                <p>{current.kind === 'directory' ? '폴더' : '파일'}</p>
                <dl>
                  <dt>수정한 날짜</dt>
                  <dd>{new Date(current.modified).toLocaleDateString('ko-KR')}</dd>
                  <dt>크기</dt>
                  <dd>
                    {current.kind === 'directory'
                      ? `${directoryEntries(files, current.path, true).length}개 항목`
                      : `${current.content?.length || 0}바이트`}
                  </dd>
                  <dt>위치</dt>
                  <dd>{parentPath(current.path)}</dd>
                </dl>
              </>
            ) : (
              <>
                <img src="/assets/icons/folder.svg" alt="" width={86} height={86} />
                <h3>{path === home ? '홈' : basename(path)}</h3>
                <p>{entries.length}개 항목</p>
                <small>파일을 선택하면 정보를 표시합니다.</small>
              </>
            )}
          </aside>
        )}
      </div>
      {error && !modal && (
        <p role="alert" className="native-inline-error">
          {error}
          <button onClick={() => setError('')}>
            <X size={13} />
          </button>
        </p>
      )}
      <footer className="native-status">
        <span>
          {selected.length
            ? `${selected.length}개 선택됨`
            : `${entries.filter((f) => f.kind === 'directory').length}개 폴더, ${entries.filter((f) => f.kind === 'file').length}개 파일`}
        </span>
        <div>
          <span>아이콘 크기</span>
          <input
            aria-label="파일 아이콘 크기"
            type="range"
            min={32}
            max={80}
            value={iconSize}
            onChange={(e) => setIconSize(Number(e.target.value))}
          />
          <HardDrive size={13} />
          <span>워크스테이션</span>
        </div>
      </footer>
      {context && (
        <div
          className="native-context"
          style={{ left: context.x, top: context.y }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {current && (
            <button
              onClick={() => {
                open(current);
                setContext(null);
              }}
            >
              열기
            </button>
          )}
          <button onClick={() => startModal('folder')}>
            <FolderPlus size={16} />새 폴더…
          </button>
          <button onClick={() => startModal('text')}>
            <FileText size={16} />
            텍스트 파일…
          </button>
          <hr />
          <button
            disabled={!selected.length}
            onClick={() => {
              setClipboard({ paths: selected, cut: false });
              setContext(null);
            }}
          >
            <Copy size={15} />
            복사<kbd>Ctrl+C</kbd>
          </button>
          <button
            disabled={!selected.length}
            onClick={() => {
              setClipboard({ paths: selected, cut: true });
              setContext(null);
            }}
          >
            <Scissors size={15} />
            잘라내기<kbd>Ctrl+X</kbd>
          </button>
          <button disabled={!clipboard} onClick={paste}>
            <Clipboard size={15} />
            붙여넣기<kbd>Ctrl+V</kbd>
          </button>
          <hr />
          <button disabled={!current} onClick={() => startModal('rename')}>
            <Edit3 size={15} />
            이름 바꾸기<kbd>F2</kbd>
          </button>
          <button disabled={!selected.length} onClick={remove}>
            <Trash2 size={15} />
            {path === trashPath(profile.username) ? '영구 삭제' : '휴지통으로 이동'}
          </button>
          <hr />
          <button onClick={() => startModal('properties')}>
            <Info size={15} />
            속성
          </button>
        </div>
      )}
      {modal && (
        <NativeDialog
          title={
            modal === 'properties'
              ? '속성 — Dolphin'
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
                <FileIcon
                  file={current ?? { path, kind: 'directory', modified: new Date().toISOString() }}
                  size={64}
                />
                <h3>{current ? basename(current.path) : path}</h3>
                <dl className="system-details">
                  <dt>유형</dt>
                  <dd>{current?.kind === 'file' ? '파일' : '폴더'}</dd>
                  <dt>위치</dt>
                  <dd>{current?.path ?? path}</dd>
                  <dt>소유자</dt>
                  <dd>{profile.username}</dd>
                  <dt>권한</dt>
                  <dd>{current?.kind === 'file' ? 'rw-r--r--' : 'rwxr-xr-x'}</dd>
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
                    autoFocus
                    aria-label="항목 이름"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    maxLength={80}
                  />
                </label>
                {error && (
                  <p className="native-error" role="alert">
                    {error}
                  </p>
                )}
              </div>
              <footer>
                <button type="button" className="native-button" onClick={() => setModal(null)}>
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
    </div>
  );
}
