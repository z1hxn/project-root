'use client';
import { useEffect, useState } from 'react';
import {
  Search,
  SlidersHorizontal,
  Mouse,
  Keyboard,
  Volume2,
  Monitor,
  Accessibility,
  Bluetooth,
  Wifi,
  Palette,
  Image,
  Type,
  Bell,
  PanelsTopLeft,
  Clock,
  LockKeyhole,
  Info,
  RotateCcw,
  Check,
  Sun,
  ExternalLink,
  Folder,
  ChevronRight,
} from 'lucide-react';
import { useWorkspace } from '@/features/workspace/context';
import { defaultOSSettings, wallpapers, type OSSettings } from '@/lib/os-settings';
import { SettingRow as Row } from '@/components/ui/Native';
import { PlasmaLogo, AppIcon } from '@/components/desktop/AppIcon';
const pages = [
  { id: 'quick', name: '빠른 설정', icon: SlidersHorizontal, group: '' },
  { id: 'mouse', name: '마우스 및 터치패드', icon: Mouse, group: '입력 및 출력' },
  { id: 'keyboard', name: '키보드 및 단축키', icon: Keyboard, group: '' },
  { id: 'sound', name: '소리', icon: Volume2, group: '' },
  { id: 'display', name: '디스플레이 및 모니터', icon: Monitor, group: '' },
  { id: 'accessibility', name: '접근성', icon: Accessibility, group: '' },
  { id: 'bluetooth', name: '블루투스', icon: Bluetooth, group: '연결된 장치' },
  { id: 'network', name: 'Wi-Fi 및 인터넷', icon: Wifi, group: '네트워크' },
  { id: 'wallpaper', name: '배경 그림', icon: Image, group: '모양 및 스타일' },
  { id: 'theme', name: '색상 및 테마', icon: Palette, group: '' },
  { id: 'fonts', name: '텍스트 및 글꼴', icon: Type, group: '' },
  { id: 'desktop', name: '바탕화면 및 패널', icon: PanelsTopLeft, group: '작업 공간' },
  { id: 'windows', name: '창 관리', icon: PanelsTopLeft, group: '' },
  { id: 'notifications', name: '알림', icon: Bell, group: '' },
  { id: 'lock', name: '화면 잠금', icon: LockKeyhole, group: '' },
  { id: 'datetime', name: '날짜 및 시간', icon: Clock, group: '시스템' },
  { id: 'about', name: '이 시스템 정보', icon: Info, group: '' },
];
function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (b: boolean) => void;
}) {
  return (
    <label className="native-check">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}
export function Settings() {
  const {
    settings,
    saveSettings,
    settingsPage,
    setSettingsPage,
    openApp,
    notify: workspaceNotify,
  } = useWorkspace();
  const notify = (message: string) => workspaceNotify(message, 'settings');
  const [draft, setDraft] = useState(settings);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  useEffect(() => setDraft(settings), [settings]);
  const page = pages.find((p) => p.id === settingsPage) ?? pages[0];
  const dirty = JSON.stringify(draft) !== JSON.stringify(settings);
  function set<K extends keyof OSSettings>(key: K, value: OSSettings[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
    setMessage('');
  }
  async function apply() {
    setBusy(true);
    setError('');
    try {
      await saveSettings(draft);
      setMessage('설정이 적용되었습니다.');
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장 실패');
    } finally {
      setBusy(false);
    }
  }
  function Themes() {
    return (
      <div className="theme-options">
        {(['breeze', 'breeze-dark', 'breeze-twilight'] as const).map((theme, i) => (
          <button
            key={theme}
            className={draft.theme === theme ? 'chosen' : ''}
            onClick={() => set('theme', theme)}
            aria-pressed={draft.theme === theme}
          >
            <div className={`theme-preview ${theme}`}>
              <div className="preview-window">
                <i />
                <div>
                  <span />
                  <span />
                  <span />
                </div>
              </div>
              <div className="preview-panel" />
            </div>
            <span>{['Breeze', 'Breeze Dark', 'Breeze Twilight'][i]}</span>
          </button>
        ))}
      </div>
    );
  }
  function Range({
    name,
    min = 0,
    max = 100,
    step = 1,
    value,
    onChange,
  }: {
    name: string;
    min?: number;
    max?: number;
    step?: number;
    value: number;
    onChange: (v: number) => void;
  }) {
    return (
      <div className="settings-range">
        <input
          aria-label={name}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <output>
          {value}
          {max === 100 ? '%' : ''}
        </output>
      </div>
    );
  }
  return (
    <div className="system-settings">
      <aside className="settings-nav">
        <label className="settings-search">
          <Search size={15} />
          <input
            aria-label="설정 검색"
            placeholder="검색…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <div className="settings-categories">
          {pages
            .filter((p) => p.name.includes(query) || p.id.includes(query.toLowerCase()))
            .map((p) => (
              <div key={p.id}>
                {p.group && (
                  <h3>
                    {p.group}
                    <span />
                  </h3>
                )}
                <button
                  className={page.id === p.id ? 'selected' : ''}
                  onClick={() => setSettingsPage(p.id)}
                >
                  <p.icon size={18} />
                  {p.name}
                  {['theme', 'windows', 'display'].includes(p.id) && <ChevronRight size={13} />}
                </button>
              </div>
            ))}
        </div>
      </aside>
      <section className="settings-page">
        <header>
          <page.icon size={22} />
          <h1>{page.name}</h1>
        </header>
        <div className="settings-page-body">
          {page.id === 'quick' && (
            <>
              <Row label="테마:">
                <Themes />
              </Row>
              <Row label="모양 설정:">
                <div className="settings-links">
                  <button className="native-button" onClick={() => setSettingsPage('wallpaper')}>
                    <Image size={15} />
                    배경 그림
                  </button>
                  <button className="native-button" onClick={() => setSettingsPage('theme')}>
                    <Palette size={15} />
                    색상 및 테마
                  </button>
                </div>
              </Row>
              <hr />
              <Row label="애니메이션 속도:">
                <Range
                  name="애니메이션 속도"
                  min={0}
                  max={3}
                  value={draft.animationSpeed}
                  onChange={(v) => set('animationSpeed', v)}
                />
                <div className="range-captions">
                  <span>없음</span>
                  <span>느리게</span>
                </div>
              </Row>
              <Row label="파일 및 폴더 클릭:">
                <label className="native-check">
                  <input
                    type="radio"
                    name="quick-click"
                    checked={draft.clickMode === 'double'}
                    onChange={() => set('clickMode', 'double')}
                  />
                  선택하기 <small>두 번 클릭하면 열립니다.</small>
                </label>
                <label className="native-check">
                  <input
                    type="radio"
                    name="quick-click"
                    checked={draft.clickMode === 'single'}
                    onChange={() => set('clickMode', 'single')}
                  />
                  열기
                </label>
              </Row>
              <hr />
              <Row label="자주 사용하는 설정:">
                <div className="quick-settings-grid">
                  {['display', 'desktop', 'sound', 'fonts', 'notifications', 'about'].map((id) => {
                    const p = pages.find((p) => p.id === id)!;
                    return (
                      <button
                        key={id}
                        className="native-button"
                        onClick={() => setSettingsPage(id)}
                      >
                        <p.icon size={15} />
                        {p.name}
                      </button>
                    );
                  })}
                </div>
              </Row>
            </>
          )}
          {page.id === 'theme' && (
            <>
              <h2>전역 테마</h2>
              <Themes />
              <h2>강조 색상</h2>
              <div className="accent-options">
                {['#3daee9', '#1abc9c', '#9b59b6', '#e74c3c', '#f39c12'].map((color) => (
                  <button
                    aria-label={`강조 색상 ${color}`}
                    key={color}
                    style={{ background: color }}
                    className={draft.accent === color ? 'selected' : ''}
                    onClick={() => set('accent', color as OSSettings['accent'])}
                  >
                    {draft.accent === color && <Check size={20} />}
                  </button>
                ))}
              </div>
              <div className="breeze-sample">
                <h3>미리 보기</h3>
                <button className="native-button" style={{ borderColor: draft.accent }}>
                  Breeze 버튼
                </button>
                <label className="native-check">
                  <input type="checkbox" checked readOnly style={{ accentColor: draft.accent }} />
                  선택된 항목
                </label>
                <span style={{ color: draft.accent }}>선택한 강조 색상이 적용됩니다.</span>
              </div>
            </>
          )}
          {page.id === 'wallpaper' && (
            <>
              <Row label="배경 유형:">
                <select
                  value={draft.wallpaper === 'solid' ? 'solid' : 'image'}
                  onChange={(e) =>
                    set('wallpaper', e.target.value === 'solid' ? 'solid' : 'scarlet-tree')
                  }
                >
                  <option value="image">이미지</option>
                  <option value="solid">단색</option>
                </select>
              </Row>
              <div className="wallpaper-gallery">
                {wallpapers.map((w) => (
                  <button
                    key={w.id}
                    className={draft.wallpaper === w.id ? 'selected' : ''}
                    onClick={() => set('wallpaper', w.id)}
                  >
                    <div
                      style={{
                        backgroundColor: draft.backgroundColor,
                        backgroundImage: w.image ? `url(${w.image})` : undefined,
                        filter: w.id === 'midnight' ? 'brightness(.4)' : undefined,
                      }}
                    />
                    <strong>{w.name}</strong>
                    <small>{w.author}</small>
                    {draft.wallpaper === w.id && <Check size={18} />}
                  </button>
                ))}
              </div>
              {draft.wallpaper === 'solid' && (
                <Row label="배경 색상:">
                  <input
                    type="color"
                    aria-label="배경 색상"
                    value={draft.backgroundColor}
                    onChange={(e) => set('backgroundColor', e.target.value)}
                  />
                </Row>
              )}
              <p className="settings-note">이미지는 화면을 채우도록 비율을 유지해 표시됩니다.</p>
            </>
          )}
          {page.id === 'fonts' && (
            <>
              <Row label="일반 글꼴:">
                <select
                  aria-label="일반 글꼴"
                  value={draft.fontFamily}
                  onChange={(e) => set('fontFamily', e.target.value as OSSettings['fontFamily'])}
                >
                  <option>Noto Sans</option>
                  <option>system-ui</option>
                </select>
              </Row>
              <Row label="글꼴 크기:">
                <Range
                  name="글꼴 크기"
                  min={11}
                  max={16}
                  value={draft.fontSize}
                  onChange={(v) => set('fontSize', v)}
                />
              </Row>
              <div
                className="font-sample"
                style={{ fontFamily: draft.fontFamily, fontSize: draft.fontSize }}
              >
                <h3>The quick brown fox jumps over the lazy dog.</h3>
                <p>모든 시스템은 흔적을 남깁니다. 0123456789</p>
              </div>
              <Row label="고정폭 글꼴:">
                <span>JetBrains Mono</span>
              </Row>
            </>
          )}
          {page.id === 'desktop' && (
            <>
              <h2>패널</h2>
              <Row label="위치:">
                <select
                  aria-label="패널 위치"
                  value={draft.panelPosition}
                  onChange={(e) =>
                    set('panelPosition', e.target.value as OSSettings['panelPosition'])
                  }
                >
                  <option value="bottom">아래쪽</option>
                  <option value="top">위쪽</option>
                </select>
              </Row>
              <Row label="높이:">
                <Range
                  name="패널 높이"
                  min={38}
                  max={64}
                  value={draft.panelHeight}
                  onChange={(v) => set('panelHeight', v)}
                />
              </Row>
              <Row label="스타일:">
                <Toggle
                  label="떠 있는 패널"
                  checked={draft.panelFloating}
                  onChange={(v) => set('panelFloating', v)}
                />
              </Row>
              <h2>바탕화면 아이콘</h2>
              <Row label="표시:">
                <Toggle
                  label="바탕화면에 아이콘 표시"
                  checked={draft.desktopIcons}
                  onChange={(v) => set('desktopIcons', v)}
                />
              </Row>
              <Row label="아이콘 크기:">
                <Range
                  name="아이콘 크기"
                  min={32}
                  max={64}
                  step={8}
                  value={draft.iconSize}
                  onChange={(v) => set('iconSize', v)}
                />
              </Row>
              <Row label="가상 데스크톱:">
                <select
                  aria-label="가상 데스크톱 수"
                  value={draft.virtualDesktops}
                  onChange={(e) => set('virtualDesktops', Number(e.target.value))}
                >
                  {[1, 2, 3, 4].map((n) => (
                    <option key={n} value={n}>
                      {n}개
                    </option>
                  ))}
                </select>
              </Row>
            </>
          )}
          {page.id === 'display' && (
            <>
              <div className="monitor-preview">
                <Monitor size={85} strokeWidth={1} />
                <span>Virtual-1</span>
                <small>워크스테이션 디스플레이</small>
              </div>
              <Row label="배율:">
                <select
                  aria-label="화면 배율"
                  value={draft.scale}
                  onChange={(e) => set('scale', e.target.value as OSSettings['scale'])}
                >
                  {['100', '110', '125'].map((n) => (
                    <option key={n} value={n}>
                      {n}%
                    </option>
                  ))}
                </select>
              </Row>
              <Row label="밝기:">
                <Range
                  name="밝기"
                  min={45}
                  value={draft.brightness}
                  onChange={(v) => set('brightness', v)}
                />
              </Row>
              <Row label="야간 색상:">
                <Toggle
                  label="야간 색상 사용"
                  checked={draft.nightLight}
                  onChange={(v) => set('nightLight', v)}
                />
              </Row>
              <Row label="색 온도:">
                <Range
                  name="야간 색상 강도"
                  max={60}
                  value={draft.warmth}
                  onChange={(v) => set('warmth', v)}
                />
              </Row>
              <p className="settings-note">이 설정은 게임 속 디스플레이에 적용됩니다.</p>
            </>
          )}
          {page.id === 'sound' && (
            <>
              <h2>출력 장치</h2>
              <div className="device-card">
                <Volume2 size={32} />
                <div>
                  <strong>내장 오디오 아날로그 스테레오</strong>
                  <p>스피커 · 기본 출력 장치</p>
                </div>
                <Check size={17} />
              </div>
              <Row label="출력 음량:">
                <Range name="출력 음량" value={draft.volume} onChange={(v) => set('volume', v)} />
              </Row>
              <Row label="">
                <Toggle label="음소거" checked={draft.muted} onChange={(v) => set('muted', v)} />
              </Row>
              <Row label="알림 소리:">
                <Toggle
                  label="시스템 알림 소리 재생"
                  checked={draft.systemSounds}
                  onChange={(v) => set('systemSounds', v)}
                />
              </Row>
              <Row label="출력 테스트:">
                <button
                  className="native-button"
                  onClick={() => {
                    if (draft.muted || draft.volume === 0) {
                      setMessage('음소거 상태입니다.');
                      return;
                    }
                    const a = new AudioContext();
                    const o = a.createOscillator(),
                      g = a.createGain();
                    o.connect(g);
                    g.connect(a.destination);
                    g.gain.setValueAtTime((draft.volume / 100) * 0.1, a.currentTime);
                    g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.3);
                    o.frequency.value = 660;
                    o.start();
                    o.stop(a.currentTime + 0.3);
                    o.onended = () => a.close();
                  }}
                >
                  스피커 테스트
                </button>
              </Row>
            </>
          )}
          {page.id === 'network' && (
            <>
              <Row label="무선 네트워크:">
                <Toggle label="Wi-Fi 사용" checked={draft.wifi} onChange={(v) => set('wifi', v)} />
              </Row>
              <Row label="비행기 모드:">
                <Toggle
                  label="모든 무선 연결 끄기"
                  checked={draft.airplaneMode}
                  onChange={(v) => set('airplaneMode', v)}
                />
              </Row>
              <div className="network-device">
                <Wifi size={30} />
                <div>
                  <h3>ROOT-Internal</h3>
                  <p>
                    {draft.wifi && !draft.airplaneMode ? '연결됨 · WPA3-Personal' : '연결 끊김'}
                  </p>
                </div>
                <span className="native-badge">가상 네트워크</span>
              </div>
              <dl className="system-details">
                <dt>인터페이스</dt>
                <dd>wlan0</dd>
                <dt>IPv4 주소</dt>
                <dd>{draft.wifi && !draft.airplaneMode ? '10.42.0.24' : '—'}</dd>
                <dt>게이트웨이</dt>
                <dd>10.42.0.1</dd>
                <dt>DNS</dt>
                <dd>10.42.0.1</dd>
                <dt>연결 프로필</dt>
                <dd>자동 연결</dd>
              </dl>
              <p className="settings-note">
                네트워크를 끄면 Firefox의 게임 내부 웹 연결이 중단됩니다.
              </p>
            </>
          )}
          {page.id === 'bluetooth' && (
            <>
              <Row label="블루투스:">
                <Toggle
                  label="블루투스 어댑터 켜기"
                  checked={draft.bluetooth}
                  onChange={(v) => set('bluetooth', v)}
                />
              </Row>
              <div className="settings-empty">
                <Bluetooth size={54} strokeWidth={1} />
                <h2>{draft.bluetooth ? '연결된 장치 없음' : '블루투스가 꺼져 있습니다.'}</h2>
                <p>
                  {draft.bluetooth
                    ? '이 워크스테이션에 등록된 가상 주변 장치가 없습니다.'
                    : '블루투스를 켜면 장치 상태를 확인할 수 있습니다.'}
                </p>
              </div>
            </>
          )}
          {page.id === 'mouse' && (
            <>
              <h2>파일 및 폴더 활성화</h2>
              <Row label="클릭 동작:">
                <select
                  aria-label="클릭 동작"
                  value={draft.clickMode}
                  onChange={(e) => set('clickMode', e.target.value as OSSettings['clickMode'])}
                >
                  <option value="double">두 번 클릭하여 열기</option>
                  <option value="single">한 번 클릭하여 열기</option>
                </select>
              </Row>
              <p className="settings-note">
                Dolphin과 바탕화면 아이콘에 적용됩니다. Ctrl+클릭으로 여러 항목을 선택하고
                드래그하여 이동할 수 있습니다.
              </p>
              <h2>바탕화면 조작</h2>
              <dl className="system-details">
                <dt>오른쪽 클릭</dt>
                <dd>상황에 맞는 메뉴</dd>
                <dt>드래그</dt>
                <dd>아이콘 이동 / 빈 공간에서 영역 선택</dd>
                <dt>F2</dt>
                <dd>선택한 항목 이름 변경</dd>
                <dt>Delete</dt>
                <dd>선택한 항목 제거</dd>
              </dl>
            </>
          )}
          {page.id === 'windows' && (
            <>
              <Row label="포커스 정책:">
                <select
                  aria-label="포커스 정책"
                  value={draft.focusMode}
                  onChange={(e) => set('focusMode', e.target.value as OSSettings['focusMode'])}
                >
                  <option value="click">클릭하여 포커스</option>
                  <option value="follow">마우스를 따라 포커스</option>
                </select>
              </Row>
              <h2>창 동작</h2>
              <dl className="system-details">
                <dt>제목 표시줄 두 번 클릭</dt>
                <dd>최대화 / 복원</dd>
                <dt>화면 왼쪽 / 오른쪽으로 드래그</dt>
                <dd>화면 절반에 창 맞추기</dd>
                <dt>화면 위로 드래그</dt>
                <dd>최대화</dd>
                <dt>창 가장자리 드래그</dt>
                <dd>크기 조절</dd>
                <dt>제목 표시줄 우클릭</dt>
                <dd>항상 위 / 접기 / 데스크톱 이동</dd>
              </dl>
            </>
          )}
          {page.id === 'notifications' && (
            <>
              <Row label="알림:">
                <Toggle
                  label="방해 금지"
                  checked={draft.doNotDisturb}
                  onChange={(v) => set('doNotDisturb', v)}
                />
              </Row>
              <Row label="표시 내용:">
                <Toggle
                  label="알림에 메시지 미리 보기 표시"
                  checked={draft.notificationPreviews}
                  onChange={(v) => set('notificationPreviews', v)}
                />
              </Row>
              <Row label="미리 보기:">
                <button
                  className="native-button"
                  onClick={() => notify('알림이 정상적으로 동작합니다.')}
                >
                  테스트 알림 보내기
                </button>
              </Row>
              <p className="settings-note">
                적용된 설정으로 알림이 표시됩니다. 방해 금지를 켜면 알림 센터에만 기록됩니다.
              </p>
            </>
          )}
          {page.id === 'lock' && (
            <>
              <Row label="자동으로 잠그기:">
                <select
                  aria-label="자동 잠금 시간"
                  value={draft.lockAfter}
                  onChange={(e) => set('lockAfter', e.target.value as OSSettings['lockAfter'])}
                >
                  <option value="0">사용 안 함</option>
                  {['1', '5', '15', '30'].map((v) => (
                    <option key={v} value={v}>
                      {v}분 동안 활동이 없을 때
                    </option>
                  ))}
                </select>
              </Row>
              <p className="settings-note">
                잠긴 화면은 현재 계정의 비밀번호로 해제합니다. 열려 있는 앱은 그대로 유지됩니다.
              </p>
            </>
          )}
          {page.id === 'datetime' && (
            <>
              <Row label="시간대:">
                <select
                  aria-label="시간대"
                  value={draft.timezone}
                  onChange={(e) => set('timezone', e.target.value as OSSettings['timezone'])}
                >
                  {['Asia/Seoul', 'UTC', 'America/New_York', 'Europe/Berlin', 'Asia/Tokyo'].map(
                    (t) => (
                      <option key={t}>{t}</option>
                    ),
                  )}
                </select>
              </Row>
              <Row label="시계 표시:">
                <Toggle
                  label="24시간 형식"
                  checked={draft.clock24h}
                  onChange={(v) => set('clock24h', v)}
                />
                <Toggle
                  label="초 표시"
                  checked={draft.showSeconds}
                  onChange={(v) => set('showSeconds', v)}
                />
                <Toggle
                  label="날짜 표시"
                  checked={draft.showDate}
                  onChange={(v) => set('showDate', v)}
                />
              </Row>
              <div className="clock-preview">
                {new Intl.DateTimeFormat('ko-KR', {
                  timeZone: draft.timezone,
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: !draft.clock24h,
                }).format(new Date())}
              </div>
            </>
          )}
          {page.id === 'keyboard' && (
            <>
              <h2>워크스테이션 단축키</h2>
              <table className="shortcuts-table">
                <thead>
                  <tr>
                    <th>동작</th>
                    <th>단축키</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['프로그램 실행 (KRunner)', 'Alt + Space'],
                    ['Konsole 열기', 'Ctrl + Alt + T'],
                    ['화면 잠금', 'Ctrl + Alt + L'],
                    ['바탕화면 보기', 'Ctrl + Alt + D'],
                    ['가상 데스크톱 전환', 'Ctrl + Alt + ← / →'],
                    ['창 닫기', 'Alt + F4'],
                    ['창 이동 (제목 표시줄 포커스)', 'Alt + 방향키'],
                    ['Firefox 주소창', 'Ctrl + L'],
                    ['Firefox 새 탭', 'Ctrl + T'],
                    ['Dolphin 이름 변경', 'F2'],
                  ].map(([a, b]) => (
                    <tr key={a}>
                      <td>{a}</td>
                      <td>
                        <kbd>{b}</kbd>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="settings-note">
                브라우저 또는 호스트 OS가 먼저 처리하는 단축키는 게임에 전달되지 않을 수 있습니다.
              </p>
            </>
          )}
          {page.id === 'accessibility' && (
            <>
              <Row label="텍스트 크기:">
                <Range
                  name="접근성 텍스트 크기"
                  min={11}
                  max={16}
                  value={draft.fontSize}
                  onChange={(v) => set('fontSize', v)}
                />
              </Row>
              <Row label="움직임 줄이기:">
                <Toggle
                  label="창 애니메이션 사용 안 함"
                  checked={draft.animationSpeed === 0}
                  onChange={(v) => set('animationSpeed', v ? 0 : 1)}
                />
              </Row>
              <p className="settings-note">
                호스트의 애니메이션 감소 설정도 자동으로 적용됩니다. 모든 앱의 버튼과 입력은
                키보드로 접근할 수 있습니다.
              </p>
            </>
          )}
          {page.id === 'about' && (
            <>
              <div className="about-plasma">
                <PlasmaLogo size={76} />
                <h1>Debian GNU/Linux</h1>
                <p>KDE Plasma</p>
              </div>
              <h2>소프트웨어</h2>
              <dl className="system-details">
                <dt>데스크톱</dt>
                <dd>KDE Plasma / Breeze</dd>
                <dt>플랫폼</dt>
                <dd>PROJECT ROOT Workstation</dd>
                <dt>터미널</dt>
                <dd>Konsole · bash</dd>
                <dt>파일 관리자</dt>
                <dd>Dolphin</dd>
                <dt>브라우저</dt>
                <dd>Mozilla Firefox</dd>
                <dt>세션</dt>
                <dd>가상 Linux 데스크톱</dd>
              </dl>
              <h2>내 계정</h2>
              <p>조사관 프로필과 로그아웃은 Project Root 앱에서 관리합니다.</p>
              <button className="native-button" onClick={() => openApp('root')}>
                <AppIcon id="root" size={18} />
                Project Root 열기
              </button>
            </>
          )}
        </div>
        <footer className="settings-apply">
          <button
            className="native-button"
            onClick={() => setDraft(defaultOSSettings)}
            disabled={busy}
          >
            <RotateCcw size={14} />
            기본값
          </button>
          <button
            className="native-button"
            disabled={!dirty || busy}
            onClick={() => setDraft(settings)}
          >
            초기화
          </button>
          <span role={error ? 'alert' : 'status'} className={error ? 'native-error' : ''}>
            {error || message}
          </span>
          <button className="native-button apply-button" disabled={!dirty || busy} onClick={apply}>
            <Check size={15} />
            {busy ? '적용 중…' : '적용'}
          </button>
        </footer>
      </section>
    </div>
  );
}
