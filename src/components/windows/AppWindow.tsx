'use client';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ChevronDown, ChevronUp, X, Check, ArrowLeft, ArrowRight, Pin } from 'lucide-react';
import { applications } from '@/components/desktop/apps';
import { basename, homePath } from '@/game/filesystem';
import { AppIcon } from '@/components/desktop/AppIcon';
import { useWorkspace } from '@/features/workspace/context';
import { clampPosition, type WindowAction, type WindowState } from './state';
export function AppWindow({
  state,
  active,
  visible,
  dispatch,
  children,
}: {
  state: WindowState;
  active: boolean;
  visible: boolean;
  dispatch: React.Dispatch<WindowAction>;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const drag = useRef<{
    dx: number;
    dy: number;
    restore?: boolean;
    startX?: number;
    startY?: number;
    ratio?: number;
  } | null>(null);
  const resize = useRef<{
    x: number;
    y: number;
    width: number;
    height: number;
    left: number;
    top: number;
    edge: string;
  } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [snapPreview, setSnapPreview] = useState<'left' | 'right' | 'top' | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const { settings, profile, fileLocation, editorDocument } = useWorkspace();
  const app = applications.find((a) => a.id === state.id)!;
  useEffect(() => {
    const fit = () => {
      const el = ref.current;
      if (!el || state.maximized || state.minimized || state.snap) return;
      const rect = el.getBoundingClientRect();
      const pos = clampPosition(state.x, state.y, rect.width, rect.height, innerWidth, innerHeight);
      if (pos.x !== state.x || pos.y !== state.y) dispatch({ type: 'move', id: state.id, ...pos });
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [state.x, state.y, state.id, state.maximized, state.minimized, state.snap, dispatch]);
  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    window.addEventListener('pointerdown', close);
    window.addEventListener('blur', close);
    return () => {
      window.removeEventListener('pointerdown', close);
      window.removeEventListener('blur', close);
    };
  }, [menu]);
  const act = (type: 'close' | 'minimize' | 'maximize' | 'shade' | 'above') => {
    dispatch({ type, id: state.id });
    setMenu(null);
  };
  const style: CSSProperties = {
    left: state.x,
    top: state.y,
    width: state.width,
    height: state.shaded ? 30 : state.height,
    zIndex: state.z + (state.above ? 10000 : 0),
    display: !visible || state.minimized ? 'none' : undefined,
  };
  function move(x: number, y: number) {
    const r = ref.current!.getBoundingClientRect();
    dispatch({
      type: 'move',
      id: state.id,
      ...clampPosition(x, y, r.width, r.height, innerWidth, innerHeight),
    });
  }
  return (
    <>
      <section
        ref={ref}
        data-app={state.id}
        aria-label={`${app.name} 창`}
        className={`kwin-window ${active ? 'active' : ''} ${state.maximized ? 'maximized' : ''} ${state.snap ? 'snapped ' + state.snap : ''} ${state.shaded ? 'shaded' : ''} ${dragging ? 'moving' : ''}`}
        style={style}
        onPointerEnter={() => {
          if (settings.focusMode === 'follow' && !active) dispatch({ type: 'focus', id: state.id });
        }}
        onPointerDown={() => {
          if (!active) dispatch({ type: 'focus', id: state.id });
        }}
        onFocusCapture={() => {
          if (!active) dispatch({ type: 'focus', id: state.id });
        }}
      >
        <header
          className="kwin-titlebar"
          tabIndex={0}
          aria-label={`${app.name} 창 이동: Alt와 방향키`}
          onContextMenu={(e) => {
            e.preventDefault();
            setMenu({
              x: Math.min(e.clientX, innerWidth - 245),
              y: Math.min(e.clientY, innerHeight - 350),
            });
          }}
          onKeyDown={(e) => {
            if (e.altKey && e.key.startsWith('Arrow') && !state.maximized) {
              e.preventDefault();
              move(
                state.x + (e.key === 'ArrowRight' ? 20 : e.key === 'ArrowLeft' ? -20 : 0),
                state.y + (e.key === 'ArrowDown' ? 20 : e.key === 'ArrowUp' ? -20 : 0),
              );
            }
          }}
          onDoubleClick={(e) => {
            if (!(e.target as HTMLElement).closest('button')) act('maximize');
          }}
          onPointerDown={(e) => {
            if (e.button !== 0 || (e.target as HTMLElement).closest('button')) return;
            const r = ref.current!.getBoundingClientRect();
            drag.current = {
              dx: e.clientX - r.left,
              dy: e.clientY - r.top,
              restore: state.maximized || !!state.snap,
              startX: e.clientX,
              startY: e.clientY,
              ratio: (e.clientX - r.left) / r.width,
            };
            setDragging(true);
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (!drag.current) return;
            if (drag.current.restore) {
              if (
                Math.hypot(e.clientX - drag.current.startX!, e.clientY - drag.current.startY!) < 5
              )
                return;
              const width = Math.min(state.width, innerWidth - 8);
              const height = Math.min(state.height, innerHeight - 62);
              const pos = clampPosition(
                e.clientX - width * drag.current.ratio!,
                e.clientY - 15,
                width,
                height,
                innerWidth,
                innerHeight,
              );
              if (state.maximized) dispatch({ type: 'maximize', id: state.id });
              else dispatch({ type: 'snap', id: state.id, side: null });
              dispatch({ type: 'move', id: state.id, ...pos });
              drag.current = { dx: e.clientX - pos.x, dy: 15 };
              return;
            }
            move(e.clientX - drag.current.dx, e.clientY - drag.current.dy);
            setSnapPreview(
              e.clientX < 18
                ? 'left'
                : e.clientX > innerWidth - 18
                  ? 'right'
                  : e.clientY < 12
                    ? 'top'
                    : null,
            );
          }}
          onPointerUp={() => {
            if (snapPreview === 'top') act('maximize');
            else if (snapPreview) dispatch({ type: 'snap', id: state.id, side: snapPreview });
            drag.current = null;
            setDragging(false);
            setSnapPreview(null);
          }}
          onPointerCancel={() => {
            drag.current = null;
            setDragging(false);
            setSnapPreview(null);
          }}
        >
          <button
            className="window-app-menu"
            aria-label={`${app.name} 창 메뉴`}
            onClick={(e) => setMenu({ x: e.clientX, y: e.clientY + 12 })}
          >
            <AppIcon id={state.id} size={17} />
          </button>
          <span className="window-caption">
            {state.id === 'editor'
              ? `${editorDocument.text !== editorDocument.saved ? '● ' : ''}${editorDocument.path ? basename(editorDocument.path) : '제목 없음'} — KWrite`
              : state.id === 'terminal'
                ? '~ : bash — Konsole'
                : state.id === 'files'
                  ? `${fileLocation === homePath(profile.username) ? '홈' : basename(fileLocation) || '루트'} — Dolphin`
                  : state.id === 'settings'
                    ? '시스템 설정'
                    : app.name}
            {state.above && <Pin size={11} />}
          </span>
          <div className="kwin-controls">
            <button aria-label={`${app.name} 최소화`} onClick={() => act('minimize')}>
              <ChevronDown size={15} />
            </button>
            <button
              aria-label={`${app.name} ${state.maximized ? '복원' : '최대화'}`}
              onClick={() => act('maximize')}
            >
              <ChevronUp
                size={15}
                style={{ transform: state.maximized ? 'rotate(180deg)' : undefined }}
              />
            </button>
            <button
              className="kwin-close"
              aria-label={`${app.name} 닫기`}
              onClick={() => act('close')}
            >
              <X size={15} />
            </button>
          </div>
        </header>
        <div className="native-window-content">{children}</div>
        {!state.maximized &&
          !state.snap &&
          !state.shaded &&
          ['right', 'bottom', 'left', 'bottom-right', 'bottom-left'].map((edge) => (
            <div
              key={edge}
              className={`resize-handle resize-${edge}`}
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const r = ref.current!.getBoundingClientRect();
                resize.current = {
                  x: e.clientX,
                  y: e.clientY,
                  width: r.width,
                  height: r.height,
                  left: r.left,
                  top: r.top,
                  edge,
                };
                e.currentTarget.setPointerCapture(e.pointerId);
              }}
              onPointerMove={(e) => {
                const r = resize.current;
                if (!r) return;
                const dx = e.clientX - r.x,
                  dy = e.clientY - r.y;
                const left = r.edge.includes('left');
                const width =
                  r.edge === 'bottom'
                    ? r.width
                    : Math.max(
                        Math.min(420, innerWidth),
                        Math.min(
                          innerWidth - (left ? Math.max(0, r.left + dx) : r.left),
                          r.width + (left ? -dx : dx),
                        ),
                      );
                const height = r.edge.includes('bottom')
                  ? Math.max(260, Math.min(innerHeight - r.top - 62, r.height + dy))
                  : r.height;
                dispatch({
                  type: 'resize',
                  id: state.id,
                  width,
                  height,
                  x: left ? r.left + r.width - width : r.left,
                });
              }}
              onPointerUp={() => {
                resize.current = null;
              }}
              onPointerCancel={() => {
                resize.current = null;
              }}
            />
          ))}
      </section>
      {snapPreview && <div className={`snap-preview ${snapPreview}`} />}
      {menu && (
        <div
          className="native-context window-context"
          style={{ left: menu.x, top: menu.y }}
          onPointerDown={(e) => e.stopPropagation()}
          role="menu"
        >
          <div className="context-heading">{app.name}</div>
          <button onClick={() => act('minimize')}>최소화</button>
          <button onClick={() => act('maximize')}>{state.maximized ? '복원' : '최대화'}</button>
          <button
            onClick={() => {
              dispatch({ type: 'snap', id: state.id, side: 'left' });
              setMenu(null);
            }}
          >
            <ArrowLeft size={14} />
            왼쪽 절반에 배치
          </button>
          <button
            onClick={() => {
              dispatch({ type: 'snap', id: state.id, side: 'right' });
              setMenu(null);
            }}
          >
            <ArrowRight size={14} />
            오른쪽 절반에 배치
          </button>
          <hr />
          <button onClick={() => act('above')}>
            {state.above ? <Check size={14} /> : <span />}항상 위에 표시
          </button>
          <button onClick={() => act('shade')}>제목 표시줄만 표시</button>
          {Array.from({ length: settings.virtualDesktops }, (_, i) => (
            <button
              key={i}
              onClick={() => {
                dispatch({ type: 'desktop', id: state.id, desktop: i });
                setMenu(null);
              }}
            >
              데스크톱 {i + 1}로 이동 {state.desktop === i && <Check size={13} />}
            </button>
          ))}
          <hr />
          <button onClick={() => act('close')}>
            <X size={14} />
            닫기 <kbd>Alt+F4</kbd>
          </button>
        </div>
      )}
    </>
  );
}
