'use client';
import { useEffect, useRef, useState } from 'react';
import { FilePlus, FolderOpen, Save, Search, WrapText, X } from 'lucide-react';
import { NativeDialog, NativeMenuBar, ToolButton } from '@/components/ui/Native';
import { useWorkspace } from '@/features/workspace/context';
import { basename, homePath, resolvePath, writeFile } from '@/game/filesystem';
export function TextEditor() {
  const {
    profile,
    files,
    setFiles,
    editorDocument: doc,
    setEditorDocument: setDoc,
    editorRequest,
    clearEditorRequest,
    notify: workspaceNotify,
  } = useWorkspace();
  const notify = (message: string) => workspaceNotify(message, 'editor');
  const [modal, setModal] = useState<'open' | 'save' | 'discard' | 'overwrite' | null>(null);
  const [path, setPath] = useState('');
  const [error, setError] = useState('');
  const [find, setFind] = useState(false);
  const [query, setQuery] = useState('');
  const [wrap, setWrap] = useState(false);
  const [scroll, setScroll] = useState(0);
  const [size, setSize] = useState(14);
  const [cursor, setCursor] = useState(0);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const pending = useRef<(() => void) | null>(null);
  const lastRequest = useRef<number | null>(null);
  const dirty = doc.text !== doc.saved;
  const home = homePath(profile.username);
  function load(path: string) {
    const file = files.find((f) => f.path === path && f.kind === 'file');
    if (!file) {
      setError('파일을 찾을 수 없습니다.');
      return;
    }
    setDoc({ path, text: file.content || '', saved: file.content || '' });
    setModal(null);
    setError('');
    setCursor(0);
  }
  function guard(action: () => void) {
    if (dirty) {
      pending.current = action;
      setModal('discard');
    } else action();
  }
  useEffect(() => {
    if (editorRequest && lastRequest.current !== editorRequest.id) {
      lastRequest.current = editorRequest.id;
      if (editorRequest.path !== doc.path) guard(() => load(editorRequest.path));
      else if (!dirty) load(editorRequest.path);
      clearEditorRequest();
    }
  }, [editorRequest]);
  function newFile() {
    guard(() => {
      setDoc({ path: null, text: '', saved: '' });
      setCursor(0);
      setError('');
      setModal(null);
    });
  }
  function openDialog() {
    guard(() => {
      setPath(home + '/Documents/');
      setError('');
      setModal('open');
    });
  }
  function saveAs() {
    setPath(doc.path || home + '/Documents/메모.txt');
    setError('');
    setModal('save');
  }
  function save(target = doc.path, overwrite = false) {
    if (!target) {
      saveAs();
      return;
    }
    try {
      target = resolvePath(target, home, home);
      if (!target.startsWith(home + '/')) throw Error('개인 파일은 홈 폴더 안에 저장하세요.');
      if (doc.text.length > 100000) throw Error('파일은 100,000자까지 저장할 수 있습니다.');
      const existing = files.find((f) => f.path === target);
      if (
        existing?.kind === 'file' &&
        !overwrite &&
        (target !== doc.path || existing.content !== doc.saved)
      ) {
        const destination = target;
        pending.current = () => save(destination, true);
        setModal('overwrite');
        return;
      }
      setFiles(writeFile(files, target, doc.text));
      setDoc({ ...doc, path: target, saved: doc.text });
      setModal(null);
      setError('');
      notify(`${basename(target)} 저장됨`);
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장 실패');
    }
  }
  function findNext() {
    if (!query) return;
    const el = textarea.current!;
    let at = doc.text.toLowerCase().indexOf(query.toLowerCase(), el.selectionEnd);
    if (at < 0) at = doc.text.toLowerCase().indexOf(query.toLowerCase());
    if (at >= 0) {
      el.focus();
      el.setSelectionRange(at, at + query.length);
      setCursor(at);
    } else setError('일치하는 텍스트가 없습니다.');
  }
  const line = doc.text.slice(0, cursor).split('\n');
  return (
    <div
      className="kwrite"
      onKeyDown={(e) => {
        if (e.ctrlKey || e.metaKey) {
          const key = e.key.toLowerCase();
          if (['s', 'o', 'n', 'f'].includes(key)) {
            e.preventDefault();
            e.stopPropagation();
            if (key === 's') {
              if (e.shiftKey) saveAs();
              else save();
            }
            if (key === 'o') openDialog();
            if (key === 'n') newFile();
            if (key === 'f') setFind(true);
          }
        }
      }}
    >
      <NativeMenuBar
        menus={{
          파일: [
            { label: '새 문서', shortcut: 'Ctrl+N', action: newFile },
            { label: '열기…', shortcut: 'Ctrl+O', action: openDialog },
            { label: '저장', shortcut: 'Ctrl+S', action: () => save() },
            { label: '다른 이름으로 저장…', shortcut: 'Ctrl+Shift+S', action: saveAs },
          ],
          편집: [
            {
              label: '모두 선택',
              shortcut: 'Ctrl+A',
              action: () => {
                textarea.current?.focus();
                textarea.current?.select();
              },
            },
            { label: '찾기', shortcut: 'Ctrl+F', action: () => setFind(true) },
          ],
          보기: [
            {
              label: wrap ? '자동 줄 바꿈 끄기' : '자동 줄 바꿈 켜기',
              action: () => setWrap(!wrap),
            },
            { label: '글자 확대', action: () => setSize(Math.min(24, size + 1)) },
            { label: '글자 축소', action: () => setSize(Math.max(11, size - 1)) },
          ],
        }}
      />
      <div className="kwrite-toolbar">
        <ToolButton label="새 문서" onClick={newFile}>
          <FilePlus size={21} />
        </ToolButton>
        <ToolButton label="파일 열기" onClick={openDialog}>
          <FolderOpen size={21} />
        </ToolButton>
        <ToolButton label="파일 저장" onClick={() => save()}>
          <Save size={21} />
        </ToolButton>
        <span className="toolbar-separator" />
        <ToolButton label="텍스트 찾기" onClick={() => setFind(!find)}>
          <Search size={19} />
        </ToolButton>
        <ToolButton label="자동 줄 바꿈" active={wrap} onClick={() => setWrap(!wrap)}>
          <WrapText size={21} />
        </ToolButton>
        <span className="kwrite-path">{doc.path || '새 문서'}</span>
      </div>
      <div className="kwrite-tab">
        {dirty ? '● ' : ''}
        {doc.path ? basename(doc.path) : '제목 없음'}
        <small>{dirty ? '수정됨' : '저장됨'}</small>
      </div>
      {find && (
        <form
          className="kwrite-find"
          onSubmit={(e) => {
            e.preventDefault();
            findNext();
          }}
        >
          <Search size={15} />
          <input
            aria-label="편집기 찾기"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="native-button">다음 찾기</button>
          <button type="button" aria-label="찾기 닫기" onClick={() => setFind(false)}>
            <X size={16} />
          </button>
        </form>
      )}
      {error && (
        <p className="native-error" role="alert">
          {error}
        </p>
      )}
      <div className="kwrite-document">
        <div className="kwrite-gutter" aria-hidden="true">
          {!wrap && (
            <pre style={{ fontSize: size, transform: `translateY(-${scroll}px)` }}>
              {doc.text
                .split('\n')
                .map((_, i) => i + 1)
                .join('\n')}
            </pre>
          )}
        </div>
        <textarea
          ref={textarea}
          onScroll={(e) => setScroll(e.currentTarget.scrollTop)}
          aria-label="파일 내용"
          spellCheck={false}
          wrap={wrap ? 'soft' : 'off'}
          style={{ fontSize: size }}
          value={doc.text}
          onChange={(e) => {
            setDoc({ ...doc, text: e.target.value });
            setCursor(e.target.selectionStart);
          }}
          onSelect={(e) => setCursor(e.currentTarget.selectionStart)}
          onKeyDown={(e) => {
            if (e.key === 'Tab') {
              e.preventDefault();
              const el = e.currentTarget;
              const at = el.selectionStart;
              setDoc({
                ...doc,
                text: doc.text.slice(0, at) + '  ' + doc.text.slice(el.selectionEnd),
              });
              requestAnimationFrame(() => {
                el.selectionStart = el.selectionEnd = at + 2;
              });
            }
          }}
        />
      </div>
      <footer className="native-status">
        <span>
          줄 {line.length}, 열 {line[line.length - 1].length + 1} · {doc.text.length}자
        </span>
        <span>초안 자동 복구 · UTF-8 · 일반 텍스트</span>
      </footer>
      {modal && (
        <NativeDialog
          title={
            modal === 'open'
              ? '파일 열기'
              : modal === 'save'
                ? '다른 이름으로 저장'
                : modal === 'overwrite'
                  ? '파일 덮어쓰기'
                  : '저장하지 않은 변경 내용'
          }
          onClose={() => setModal(null)}
        >
          {modal === 'open' || modal === 'save' ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (modal === 'open') load(resolvePath(path, home, home));
                else save(path);
              }}
            >
              <div className="kwrite-dialog-body">
                <label>
                  파일 경로
                  <input
                    autoFocus
                    aria-label="텍스트 파일 경로"
                    required
                    value={path}
                    onChange={(e) => setPath(e.target.value)}
                  />
                </label>
                {modal === 'open' && (
                  <div className="kwrite-file-list">
                    {files
                      .filter(
                        (f) =>
                          f.kind === 'file' &&
                          f.path.startsWith(home + '/') &&
                          !f.path.endsWith('.desktop'),
                      )
                      .map((f) => (
                        <button
                          type="button"
                          key={f.path}
                          onClick={() => setPath(f.path)}
                          onDoubleClick={() => load(f.path)}
                        >
                          {f.path.slice(home.length + 1)}
                        </button>
                      ))}
                  </div>
                )}
                {error && <p role="alert">{error}</p>}
              </div>
              <footer>
                <button type="button" className="native-button" onClick={() => setModal(null)}>
                  취소
                </button>
                <button className="native-button">{modal === 'open' ? '열기' : '저장'}</button>
              </footer>
            </form>
          ) : (
            <>
              <div className="kwrite-dialog-body">
                <p>
                  {modal === 'overwrite'
                    ? '같은 이름의 파일이 있거나 다른 앱에서 파일이 변경되었습니다. 현재 내용으로 덮어쓸까요?'
                    : '저장하지 않은 변경 내용을 버리고 계속할까요? 내용을 보관하려면 취소한 뒤 먼저 저장하세요.'}
                </p>
              </div>
              <footer>
                <button className="native-button" onClick={() => setModal(null)}>
                  취소
                </button>
                <button
                  className="native-button"
                  onClick={() => {
                    setModal(null);
                    pending.current?.();
                    pending.current = null;
                  }}
                >
                  {modal === 'overwrite' ? '덮어쓰기' : '변경 내용 버리기'}
                </button>
              </footer>
            </>
          )}
        </NativeDialog>
      )}
    </div>
  );
}
