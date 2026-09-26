'use client';
import { useCallback, useEffect, useReducer, useRef, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { playNotification } from '@/lib/sound';
import {
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Wifi,
  WifiOff,
  Volume2,
  VolumeX,
  Bell,
  BellOff,
  Bluetooth,
  Clipboard,
  Sun,
  Monitor,
  Search,
  Power,
  LogOut,
  RotateCw,
  LockKeyhole,
  Star,
  Grid2X2,
  Globe2,
  BriefcaseBusiness,
  Settings as SettingsIcon,
  Folder,
  Pin,
  X,
  Check,
  ArrowRight,
  Trash2,
} from 'lucide-react';
import { AppWindow } from '@/components/windows/AppWindow';
import { initialWindows, windowReducer } from '@/components/windows/state';
import { applications, type AppId } from './apps';
import { AppIcon, PlasmaLogo } from './AppIcon';
import { DesktopSurface } from './DesktopSurface';
import { AppContent } from '@/apps/AppContent';
import { WorkspaceContext, type SessionAction } from '@/features/workspace/context';
import { homePath, initialFiles, type GameFile } from '@/game/filesystem';
import { wallpapers, type OSSettings } from '@/lib/os-settings';
import { api } from '@/lib/api';
import { NativeDialog } from '@/components/ui/Native';
import type { UserProfile } from '@/types/user';
function Calendar({ timezone }: { timezone: string }) {
  const [now] = useState(() => {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    }).formatToParts(new Date());
    const value = (type: string) => Number(parts.find((part) => part.type === type)?.value);
    return new Date(value('year'), value('month') - 1, value('day'));
  });
  const [month, setMonth] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const offset = (month.getDay() + 6) % 7;
  return (
    <div className="plasma-calendar">
      <header>
        <button
          aria-label="이전 달"
          onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
        >
          <ChevronLeft size={17} />
        </button>
        <strong>{month.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}</strong>
        <button
          aria-label="다음 달"
          onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
        >
          <ChevronRight size={17} />
        </button>
      </header>
      <div>
        {['월', '화', '수', '목', '금', '토', '일'].map((d) => (
          <b key={d}>{d}</b>
        ))}
        {Array.from({ length: offset }, (_, i) => (
          <span key={`s${i}`} />
        ))}
        {Array.from({ length: days }, (_, i) => (
          <span
            key={i}
            className={
              month.getMonth() === now.getMonth() &&
              month.getFullYear() === now.getFullYear() &&
              i + 1 === now.getDate()
                ? 'today'
                : ''
            }
          >
            {i + 1}
          </span>
        ))}
      </div>
      <footer>
        {timezone}
        <button onClick={() => setMonth(new Date(now.getFullYear(), now.getMonth(), 1))}>
          오늘
        </button>
      </footer>
    </div>
  );
}
export function Desktop({
  profile,
  onProfile,
  onRestart,
}: {
  profile: UserProfile;
  onProfile: (profile: UserProfile) => void;
  onRestart: () => void;
}) {
  const router = useRouter();
  const [windows, dispatch] = useReducer(windowReducer, initialWindows);
  const settings = profile.osSettings;
  const [desktop, setDesktop] = useState(0);
  const [clock, setClock] = useState(new Date());
  const [launcher, setLauncher] = useState(false);
  const [category, setCategory] = useState('Favorites');
  const [search, setSearch] = useState('');
  const [runner, setRunner] = useState(false);
  const [runnerQuery, setRunnerQuery] = useState('');
  const [tray, setTray] = useState<string | null>(null);
  const [trayVolume, setTrayVolume] = useState(settings.volume);
  const [notifications, setNotifications] = useState<{ id: number; text: string; time: string }[]>(
    [],
  );
  const [toast, setToast] = useState<string | null>(null);
  const [sessionDialog, setSessionDialog] = useState<SessionAction | null>(null);
  const [power, setPower] = useState<'on' | 'locked' | 'off'>('on');
  const [password, setPassword] = useState('');
  const [sessionError, setSessionError] = useState('');
  const [busy, setBusy] = useState(false);
  const [settingsPage, setSettingsPage] = useState('quick');
  const [files, setFiles] = useState<GameFile[]>(() => initialFiles(profile.username));
  const [filesLoaded, setFilesLoaded] = useState(false);
  const [fileLocation, setFileLocation] = useState(homePath(profile.username));
  const [clipboard, setClipboard] = useState<{ paths: string[]; cut: boolean } | null>(null);
  const [panelMenu, setPanelMenu] = useState(false);
  const [overview, setOverview] = useState(false);
  const latest = useRef({ settings, onProfile });
  latest.current = { settings, onProfile };
  const visibleWindows = windows.filter((w) => !w.minimized && w.desktop === desktop);
  const active = visibleWindows.reduce<(typeof windows)[number] | null>(
    (a, w) => (!a || w.z + (w.above ? 10000 : 0) > a.z + (a.above ? 10000 : 0) ? w : a),
    null,
  );
  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000);
    try {
      if (sessionStorage.getItem(`root-power:${profile.username}`) === 'off') setPower('off');
    } catch {}
    return () => clearInterval(timer);
  }, [profile.username]);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(`root-files-v2:${profile.username}`) || 'null');
      if (
        Array.isArray(saved) &&
        saved.length < 2000 &&
        saved.every(
          (f) =>
            typeof f.path === 'string' &&
            f.path.startsWith('/') &&
            ['file', 'directory'].includes(f.kind) &&
            typeof f.modified === 'string' &&
            (f.content === undefined || typeof f.content === 'string'),
        )
      )
        setFiles(saved);
    } catch {}
    setFilesLoaded(true);
  }, [profile.username]);
  useEffect(() => {
    if (filesLoaded)
      try {
        localStorage.setItem(`root-files-v2:${profile.username}`, JSON.stringify(files));
      } catch {
        setToast('파일을 이 브라우저에 저장하지 못했습니다. 저장 공간을 확인하세요.');
      }
  }, [files, filesLoaded, profile.username]);
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  useEffect(() => {
    if (desktop >= settings.virtualDesktops) {
      setDesktop(0);
      for (const w of windows)
        if (w.desktop >= settings.virtualDesktops)
          dispatch({ type: 'desktop', id: w.id, desktop: 0 });
    }
  }, [settings.virtualDesktops, desktop, windows]);
  const notify = useCallback((message: string) => {
    setNotifications((n) =>
      [
        {
          id: Date.now(),
          text: message,
          time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        },
        ...n,
      ].slice(0, 50),
    );
    if (!latest.current.settings.doNotDisturb) {
      setToast(latest.current.settings.notificationPreviews ? message : '새 알림이 있습니다.');
      playNotification(latest.current.settings);
    }
  }, []);
  const saveSettings = useCallback(async (next: OSSettings) => {
    const updated = await api<UserProfile>('/api/settings', 'PUT', next);
    latest.current.onProfile(updated);
  }, []);
  function updateSetting<K extends keyof OSSettings>(key: K, value: OSSettings[K]) {
    saveSettings({ ...settings, [key]: value }).catch((e) =>
      notify(e instanceof Error ? e.message : '설정 저장 실패'),
    );
  }
  function openApp(id: AppId) {
    const existing = windows.find((w) => w.id === id);
    if (existing) setDesktop(existing.desktop);
    dispatch({ type: 'open', id, desktop });
    setLauncher(false);
    setRunner(false);
    setOverview(false);
  }
  function sessionAction(action: SessionAction) {
    setLauncher(false);
    setTray(null);
    setSessionError('');
    if (action === 'lock') {
      setPower('locked');
      setPassword('');
    } else setSessionDialog(action);
  }
  useEffect(() => {
    if (settings.lockAfter === '0' || power !== 'on') return;
    let timer: ReturnType<typeof setTimeout>;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(
        () => {
          setPower('locked');
          setPassword('');
        },
        Number(settings.lockAfter) * 60000,
      );
    };
    reset();
    window.addEventListener('pointerdown', reset);
    window.addEventListener('keydown', reset);
    window.addEventListener('pointermove', reset);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('pointerdown', reset);
      window.removeEventListener('keydown', reset);
      window.removeEventListener('pointermove', reset);
    };
  }, [settings.lockAfter, power]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (power !== 'on') return;
      if (e.key === 'Escape') {
        setLauncher(false);
        setRunner(false);
        setTray(null);
        setPanelMenu(false);
        setOverview(false);
      }
      if (e.altKey && e.code === 'Space') {
        e.preventDefault();
        setRunner((v) => !v);
      }
      if (e.ctrlKey && e.altKey) {
        const k = e.key.toLowerCase();
        if (['t', 'l', 'd', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault();
        if (k === 't') openApp('terminal');
        if (k === 'l') sessionAction('lock');
        if (k === 'd') dispatch({ type: 'showDesktop', restore: visibleWindows.length === 0 });
        if (k === 'arrowleft')
          setDesktop((d) => (d + settings.virtualDesktops - 1) % settings.virtualDesktops);
        if (k === 'arrowright') setDesktop((d) => (d + 1) % settings.virtualDesktops);
      }
      if (e.altKey && e.key === 'F4' && active) {
        e.preventDefault();
        dispatch({ type: 'close', id: active.id });
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [power, windows, desktop, settings.virtualDesktops, active]);
  async function confirmSession() {
    setBusy(true);
    setSessionError('');
    try {
      if (sessionDialog === 'logout') {
        await api('/api/auth/logout', 'POST');
        router.replace('/login');
        router.refresh();
      } else if (sessionDialog === 'restart') {
        setSessionDialog(null);
        onRestart();
      } else if (sessionDialog === 'shutdown') {
        try {
          sessionStorage.setItem(`root-power:${profile.username}`, 'off');
        } catch {}
        setPower('off');
        setSessionDialog(null);
      }
    } catch (e) {
      setSessionError(e instanceof Error ? e.message : '세션을 종료하지 못했습니다.');
    } finally {
      setBusy(false);
    }
  }
  async function unlock(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setSessionError('');
    try {
      await api('/api/auth/login', 'POST', { username: profile.username, password });
      setPassword('');
      setPower('on');
    } catch (e) {
      setSessionError(e instanceof Error ? e.message : '잠금 해제 실패');
    } finally {
      setBusy(false);
    }
  }
  const wallpaper = wallpapers.find((w) => w.id === settings.wallpaper)!;
  const time = new Intl.DateTimeFormat('ko-KR', {
    timeZone: settings.timezone,
    hour: '2-digit',
    minute: '2-digit',
    second: settings.showSeconds ? '2-digit' : undefined,
    hour12: !settings.clock24h,
  }).format(clock);
  const date = new Intl.DateTimeFormat('ko-KR', {
    timeZone: settings.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(clock);
  const css = {
    '--os-accent': settings.accent,
    '--os-font-size': `${settings.fontSize}px`,
    '--app-scale': (settings.fontSize / 13) * (Number(settings.scale) / 100),
    '--os-font': `'${settings.fontFamily}', 'Noto Sans KR', sans-serif`,
    '--panel-height': `${settings.panelHeight}px`,
    '--anim-duration': `${settings.animationSpeed * 100}ms`,
    '--wallpaper': wallpaper.image ? `url("${wallpaper.image}")` : 'none',
    '--wallpaper-color': settings.backgroundColor,
  } as CSSProperties;
  const apps = applications.filter(
    (a) =>
      (category === 'Favorites' || category === 'All' || a.category === category) &&
      `${a.name} ${a.subtitle}`.toLowerCase().includes(search.toLowerCase()),
  );
  const runnerResults = applications.filter((a) =>
    `${a.name} ${a.subtitle} ${a.id}`.toLowerCase().includes(runnerQuery.toLowerCase()),
  );
  if (power === 'off')
    return (
      <main className="powered-off">
        <button
          onClick={() => {
            try {
              sessionStorage.removeItem(`root-power:${profile.username}`);
            } catch {}
            onRestart();
          }}
        >
          <Power size={38} />
          <span>워크스테이션 켜기</span>
        </button>
        <p>전원이 꺼졌습니다.</p>
      </main>
    );
  return (
    <WorkspaceContext.Provider
      value={{
        profile,
        onProfile,
        settings,
        saveSettings,
        openApp,
        sessionAction,
        files,
        setFiles,
        notify,
        settingsPage,
        setSettingsPage,
        fileLocation,
        setFileLocation,
        clipboard,
        setClipboard,
      }}
    >
      <main
        className={`plasma-workspace theme-${settings.theme} panel-${settings.panelPosition} ${settings.panelFloating ? 'floating-panel' : ''} ${settings.animationSpeed === 0 ? 'no-motion' : ''} ${settings.wallpaper === 'midnight' ? 'night-wallpaper' : ''}`}
        style={css}
        onPointerDown={(e) => {
          if (!(e.target as HTMLElement).closest('.plasma-launcher,.plasma-launcher-button'))
            setLauncher(false);
          if (!(e.target as HTMLElement).closest('.tray-popup,.tray-button')) setTray(null);
          if (!(e.target as HTMLElement).closest('.panel-context')) setPanelMenu(false);
        }}
      >
        <div className="plasma-wallpaper" />
        <DesktopSurface onRunner={() => setRunner(true)} />
        {windows.map((w) => (
          <AppWindow
            key={w.id}
            state={w}
            visible={w.desktop === desktop}
            active={w.id === active?.id}
            dispatch={dispatch}
          >
            <AppContent id={w.id} />
          </AppWindow>
        ))}
        {overview && (
          <div className="plasma-overview">
            <header>
              <h2>가상 데스크톱</h2>
              <button onClick={() => setOverview(false)} aria-label="개요 닫기">
                <X size={22} />
              </button>
            </header>
            <div>
              {Array.from({ length: settings.virtualDesktops }, (_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setDesktop(i);
                    setOverview(false);
                  }}
                  className={desktop === i ? 'active' : ''}
                >
                  <div>
                    {windows
                      .filter((w) => w.desktop === i)
                      .map((w) => (
                        <span key={w.id}>
                          <AppIcon id={w.id} size={25} />
                          {applications.find((a) => a.id === w.id)?.name}
                        </span>
                      ))}
                  </div>
                  <strong>데스크톱 {i + 1}</strong>
                </button>
              ))}
            </div>
          </div>
        )}
        {launcher && (
          <section className="plasma-launcher" aria-label="프로그램 실행 메뉴">
            <header>
              <PlasmaLogo size={25} />
              <span>응용 프로그램</span>
              <label>
                <Search size={15} />
                <input
                  autoFocus
                  aria-label="프로그램 검색"
                  placeholder="검색…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
              <button
                onClick={() => {
                  setSettingsPage('desktop');
                  openApp('settings');
                }}
                aria-label="실행 메뉴 설정"
              >
                <SettingsIcon size={16} />
              </button>
            </header>
            <div className="launcher-body">
              <aside>
                {[
                  { id: 'Favorites', label: '즐겨찾기', icon: Star },
                  { id: 'All', label: '모든 프로그램', icon: Grid2X2 },
                  { id: 'Internet', label: '인터넷', icon: Globe2 },
                  { id: 'Office', label: '사무용 도구', icon: BriefcaseBusiness },
                  { id: 'System', label: '시스템', icon: SettingsIcon },
                  { id: 'Places', label: '위치', icon: Folder },
                ].map((c) => (
                  <button
                    className={category === c.id ? 'selected' : ''}
                    key={c.id}
                    onClick={() => setCategory(c.id)}
                  >
                    <c.icon size={17} />
                    {c.label}
                  </button>
                ))}
              </aside>
              <div className="launcher-app-grid">
                {category === 'Places'
                  ? ['Desktop', 'Documents', 'Downloads', 'Pictures'].map((folder) => (
                      <button
                        key={folder}
                        onClick={() => {
                          setFileLocation(homePath(profile.username) + '/' + folder);
                          openApp('files');
                        }}
                      >
                        <img src="/assets/icons/folder.svg" alt="" width={45} height={45} />
                        <span>{folder}</span>
                      </button>
                    ))
                  : apps.map((a) => (
                      <button key={a.id} onClick={() => openApp(a.id)} title={a.subtitle}>
                        <AppIcon id={a.id} size={45} />
                        <span>{a.name}</span>
                      </button>
                    ))}
                {!apps.length && category !== 'Places' && <p>일치하는 프로그램이 없습니다.</p>}
              </div>
            </div>
            <footer>
              <button onClick={() => setCategory(category === 'Places' ? 'Favorites' : 'Places')}>
                <Folder size={16} />
                위치
              </button>
              <span />
              <button onClick={() => sessionAction('lock')}>
                <LockKeyhole size={16} />
                잠금
              </button>
              <button onClick={() => sessionAction('restart')}>
                <RotateCw size={16} />
                다시 시작
              </button>
              <button onClick={() => sessionAction('shutdown')}>
                <Power size={16} />
                종료
              </button>
            </footer>
          </section>
        )}
        {runner && (
          <section className="krunner" aria-label="KRunner">
            <div>
              <Search size={22} />
              <input
                autoFocus
                aria-label="실행할 프로그램"
                placeholder="검색하거나 명령을 입력하세요…"
                value={runnerQuery}
                onChange={(e) => setRunnerQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && runnerResults[0]) openApp(runnerResults[0].id);
                }}
              />
              <button aria-label="KRunner 닫기" onClick={() => setRunner(false)}>
                <X size={18} />
              </button>
            </div>
            <ul>
              {runnerResults.map((a) => (
                <li key={a.id}>
                  <button onClick={() => openApp(a.id)}>
                    <AppIcon id={a.id} size={29} />
                    <span>
                      {a.name}
                      <small>{a.subtitle}</small>
                    </span>
                    <kbd>Enter ↵</kbd>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
        <footer
          className="plasma-panel"
          aria-label="데스크톱 패널"
          onContextMenu={(e) => {
            e.preventDefault();
            setPanelMenu(true);
          }}
        >
          <button
            className={`plasma-launcher-button ${launcher ? 'active' : ''}`}
            aria-label="프로그램 실행 메뉴"
            aria-expanded={launcher}
            onClick={() => {
              setLauncher(!launcher);
              setSearch('');
            }}
          >
            <PlasmaLogo size={29} />
          </button>
          <div className="virtual-desktop-pager" aria-label="가상 데스크톱">
            {Array.from({ length: settings.virtualDesktops }, (_, i) => (
              <button
                key={i}
                className={desktop === i ? 'active' : ''}
                onClick={() => setDesktop(i)}
                aria-label={`데스크톱 ${i + 1}`}
              >
                <span>{i + 1}</span>
                {windows.filter((w) => w.desktop === i && !w.minimized).length > 0 && <i />}
              </button>
            ))}
          </div>
          <div className="plasma-tasks">
            {(['settings', 'files', 'browser', 'terminal', 'mail', 'root'] as AppId[]).map((id) => {
              const app = applications.find((a) => a.id === id)!;
              const state = windows.find((w) => w.id === id);
              return (
                <button
                  key={id}
                  aria-label={`${app.name} 실행 또는 복원`}
                  title={app.name}
                  className={`${state ? 'running' : ''} ${active?.id === id ? 'active' : ''}`}
                  onClick={() => {
                    if (active?.id === id) dispatch({ type: 'minimize', id });
                    else openApp(id);
                  }}
                >
                  <AppIcon id={id} size={31} />
                  <span />
                </button>
              );
            })}
          </div>
          <div className="panel-spacer" />
          <div className="plasma-system-tray">
            <button
              className="tray-button"
              title="클립보드"
              aria-label="클립보드"
              onClick={() => setTray(tray === 'clipboard' ? null : 'clipboard')}
            >
              <Clipboard size={18} />
            </button>
            <button
              className="tray-button"
              title="알림"
              aria-label="알림"
              onClick={() => setTray(tray === 'notifications' ? null : 'notifications')}
            >
              {settings.doNotDisturb ? <BellOff size={18} /> : <Bell size={18} />}
            </button>
            <button
              className="tray-button"
              title="오디오 음량"
              aria-label="오디오 음량"
              onClick={() => {
                setTrayVolume(settings.volume);
                setTray(tray === 'volume' ? null : 'volume');
              }}
            >
              {settings.muted || settings.volume === 0 ? (
                <VolumeX size={19} />
              ) : (
                <Volume2 size={19} />
              )}
            </button>
            <button
              className="tray-button"
              title="네트워크"
              aria-label="네트워크"
              onClick={() => setTray(tray === 'network' ? null : 'network')}
            >
              {settings.wifi && !settings.airplaneMode ? <Wifi size={19} /> : <WifiOff size={19} />}
            </button>
            <button
              className="tray-button"
              title="숨겨진 아이콘"
              aria-label="숨겨진 아이콘"
              onClick={() => setTray(tray === 'more' ? null : 'more')}
            >
              <ChevronUp size={18} />
            </button>
          </div>
          <button
            className="panel-clock tray-button"
            aria-label="달력 열기"
            onClick={() => setTray(tray === 'calendar' ? null : 'calendar')}
          >
            <time>{time}</time>
            {settings.showDate && <span>{date}</span>}
          </button>
          <button
            className="show-desktop-button"
            aria-label="바탕화면 보기"
            title="바탕화면 보기"
            onClick={() => dispatch({ type: 'showDesktop', restore: visibleWindows.length === 0 })}
          >
            <Monitor size={19} />
          </button>
        </footer>
        {panelMenu && (
          <div className="native-context panel-context">
            <button
              onClick={() => {
                setSettingsPage('desktop');
                openApp('settings');
                setPanelMenu(false);
              }}
            >
              <SettingsIcon size={16} />
              패널 편집…
            </button>
            <button
              onClick={() => {
                setOverview(true);
                setPanelMenu(false);
              }}
            >
              <Grid2X2 size={16} />
              가상 데스크톱 개요
            </button>
          </div>
        )}
        {tray && (
          <section className={`tray-popup tray-${tray}`}>
            <header>
              <strong>
                {
                  {
                    volume: '오디오 음량',
                    network: '네트워크',
                    calendar: '날짜 및 시간',
                    notifications: '알림',
                    more: '상태 및 알림',
                    clipboard: '클립보드',
                  }[tray]
                }
              </strong>
              <button aria-label="트레이 닫기" onClick={() => setTray(null)}>
                <X size={16} />
              </button>
            </header>
            {tray === 'calendar' ? (
              <Calendar timezone={settings.timezone} />
            ) : tray === 'volume' ? (
              <>
                <div className="tray-device">
                  <Volume2 size={27} />
                  <span>
                    내장 오디오 아날로그 스테레오<small>스피커</small>
                  </span>
                </div>
                <div className="tray-volume">
                  <button
                    aria-label="음소거 전환"
                    onClick={() => updateSetting('muted', !settings.muted)}
                  >
                    {settings.muted ? <VolumeX size={21} /> : <Volume2 size={21} />}
                  </button>
                  <input
                    aria-label="트레이 음량"
                    type="range"
                    min={0}
                    max={100}
                    value={trayVolume}
                    onChange={(e) => setTrayVolume(Number(e.target.value))}
                    onPointerUp={() => updateSetting('volume', trayVolume)}
                    onKeyUp={() => updateSetting('volume', trayVolume)}
                  />
                  <span>{trayVolume}%</span>
                </div>
                <button
                  className="tray-link"
                  onClick={() => {
                    setSettingsPage('sound');
                    openApp('settings');
                    setTray(null);
                  }}
                >
                  오디오 장치 설정…
                </button>
              </>
            ) : tray === 'network' ? (
              <>
                <div className="tray-toggles">
                  <label>
                    <input
                      type="checkbox"
                      checked={settings.wifi}
                      onChange={(e) => updateSetting('wifi', e.target.checked)}
                    />
                    Wi-Fi
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={settings.airplaneMode}
                      onChange={(e) => updateSetting('airplaneMode', e.target.checked)}
                    />
                    비행기 모드
                  </label>
                </div>
                <div className="tray-network">
                  <Wifi size={29} />
                  <span>
                    <strong>ROOT-Internal</strong>
                    <small>
                      {settings.wifi && !settings.airplaneMode
                        ? '연결됨 · 신호 강도 100%'
                        : '연결 끊김'}
                    </small>
                  </span>
                  <LockKeyhole size={15} />
                </div>
                <p>내부 워크스테이션 네트워크</p>
                <button
                  className="tray-link"
                  onClick={() => {
                    setSettingsPage('network');
                    openApp('settings');
                    setTray(null);
                  }}
                >
                  네트워크 설정…
                </button>
              </>
            ) : tray === 'notifications' ? (
              <>
                <label className="tray-toggles">
                  <input
                    type="checkbox"
                    checked={settings.doNotDisturb}
                    onChange={(e) => updateSetting('doNotDisturb', e.target.checked)}
                  />
                  방해 금지
                </label>
                <div className="notification-list">
                  {notifications.length ? (
                    notifications.map((n) => (
                      <article key={n.id}>
                        <AppIcon id="root" size={22} />
                        <div>
                          <small>워크스테이션 · {n.time}</small>
                          <p>{n.text}</p>
                        </div>
                        <button
                          aria-label="알림 삭제"
                          onClick={() => setNotifications((v) => v.filter((x) => x.id !== n.id))}
                        >
                          <X size={14} />
                        </button>
                      </article>
                    ))
                  ) : (
                    <div className="tray-empty">
                      <Bell size={38} strokeWidth={1} />
                      <p>알림 없음</p>
                    </div>
                  )}
                </div>
                <button className="tray-link" onClick={() => setNotifications([])}>
                  모두 지우기
                </button>
              </>
            ) : tray === 'clipboard' ? (
              <>
                <p className="tray-clipboard-text">
                  {clipboard?.paths.length
                    ? clipboard.paths.map((p) => p.split('/').pop()).join('\n')
                    : '클립보드가 비어 있습니다.'}
                </p>
                <button className="tray-link" onClick={() => setClipboard(null)}>
                  클립보드 비우기
                </button>
              </>
            ) : (
              <div className="tray-more-grid">
                <button
                  onClick={() => updateSetting('bluetooth', !settings.bluetooth)}
                  className={settings.bluetooth ? 'active' : ''}
                >
                  <Bluetooth size={24} />
                  블루투스<small>{settings.bluetooth ? '켜짐' : '꺼짐'}</small>
                </button>
                <button
                  onClick={() => updateSetting('nightLight', !settings.nightLight)}
                  className={settings.nightLight ? 'active' : ''}
                >
                  <Sun size={24} />
                  야간 색상<small>{settings.nightLight ? '켜짐' : '꺼짐'}</small>
                </button>
                <button onClick={() => sessionAction('lock')}>
                  <LockKeyhole size={24} />
                  화면 잠금
                </button>
                <button
                  onClick={() => {
                    setTray(null);
                    setOverview(true);
                  }}
                >
                  <Grid2X2 size={24} />
                  데스크톱 개요
                </button>
              </div>
            )}
          </section>
        )}
        {toast && (
          <div className="plasma-toast" role="status">
            <AppIcon id="root" size={29} />
            <div>
              <strong>워크스테이션</strong>
              <p>{toast}</p>
            </div>
            <button aria-label="알림 닫기" onClick={() => setToast(null)}>
              <X size={15} />
            </button>
          </div>
        )}
        <div
          className="display-brightness"
          style={{ background: `rgba(0,0,0,${(100 - settings.brightness) / 140})` }}
        />
        <div
          className="display-nightlight"
          style={{ opacity: settings.nightLight ? settings.warmth / 180 : 0 }}
        />
        {power === 'locked' && (
          <section className="plasma-lock">
            <div className="lock-time">
              <h1>{time}</h1>
              <p>{date}</p>
            </div>
            <form onSubmit={unlock}>
              <div className="lock-avatar">{profile.displayName.slice(0, 1)}</div>
              <h2>{profile.displayName}</h2>
              <label>
                <input
                  autoFocus
                  type="password"
                  aria-label="잠금 해제 비밀번호"
                  autoComplete="current-password"
                  placeholder="비밀번호"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button aria-label="잠금 해제" disabled={busy}>
                  <ArrowRight size={22} />
                </button>
              </label>
              {sessionError && <p role="alert">{sessionError}</p>}
              <span>
                <LockKeyhole size={13} />
                세션이 잠겼습니다.
              </span>
            </form>
            <footer>
              <button
                onClick={() => {
                  sessionAction('logout');
                }}
              >
                세션 로그아웃
              </button>
            </footer>
          </section>
        )}
        {sessionDialog && (
          <NativeDialog
            title={
              sessionDialog === 'logout'
                ? '로그아웃'
                : sessionDialog === 'restart'
                  ? '다시 시작'
                  : '컴퓨터 종료'
            }
            onClose={() => {
              if (!busy) setSessionDialog(null);
            }}
          >
            <div className="session-confirm">
              <Power size={45} strokeWidth={1} />
              <h2>
                {sessionDialog === 'logout'
                  ? '현재 세션에서 로그아웃할까요?'
                  : sessionDialog === 'restart'
                    ? '워크스테이션을 다시 시작할까요?'
                    : '워크스테이션을 종료할까요?'}
              </h2>
              <p>
                저장된 파일과 설정은 유지됩니다. 열려 있는 앱의 저장하지 않은 내용은 사라질 수
                있습니다.
              </p>
              {sessionError && (
                <p role="alert" className="native-error">
                  {sessionError}
                </p>
              )}
            </div>
            <footer>
              <button
                className="native-button"
                disabled={busy}
                onClick={() => setSessionDialog(null)}
              >
                취소
              </button>
              <button
                className="native-button apply-button"
                disabled={busy}
                onClick={confirmSession}
              >
                {busy
                  ? '처리 중…'
                  : sessionDialog === 'logout'
                    ? '로그아웃'
                    : sessionDialog === 'restart'
                      ? '다시 시작'
                      : '종료'}
              </button>
            </footer>
          </NativeDialog>
        )}
      </main>
    </WorkspaceContext.Provider>
  );
}
