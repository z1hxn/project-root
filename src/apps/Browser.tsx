'use client';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Home,
  ShieldCheck,
  LockKeyhole,
  Star,
  Download,
  Puzzle,
  Menu,
  Plus,
  X,
  Search,
  ChevronDown,
  PanelLeft,
  History,
  Bookmark,
  Settings as SettingsIcon,
  Printer,
  ZoomIn,
  ZoomOut,
  Folder,
  Globe2,
  ExternalLink,
  Info,
  FileText,
  Check,
  Shield,
  WifiOff,
} from 'lucide-react';
import { useWorkspace } from '@/features/workspace/context';
import { writeFile, homePath } from '@/game/filesystem';
import { ToolButton } from '@/components/ui/Native';
interface Tab {
  id: number;
  url: string;
  history: string[];
  index: number;
  private: boolean;
}
interface BookmarkItem {
  title: string;
  url: string;
}
const titleFor = (url: string) =>
  url === 'about:newtab'
    ? '새 탭'
    : url === 'about:preferences'
      ? '설정'
      : url.includes('index.root')
        ? 'Index — 검색'
        : url.includes('portal.root')
          ? 'Project Root · Intranet'
          : url === 'about:downloads'
            ? '다운로드'
            : url;
export function Browser() {
  const { profile, settings, files, setFiles, notify } = useWorkspace();
  const [tabs, setTabs] = useState<Tab[]>([
    { id: 1, url: 'about:newtab', history: ['about:newtab'], index: 0, private: false },
  ]);
  const [active, setActive] = useState(1);
  const [draft, setDraft] = useState('');
  const [menu, setMenu] = useState(false);
  const [panel, setPanel] = useState<'history' | 'bookmarks' | 'downloads' | 'extensions' | null>(
    null,
  );
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([
    { title: 'Project Root · Intranet', url: 'https://portal.root' },
    { title: 'Index', url: 'https://index.root' },
  ]);
  const [history, setHistory] = useState<BookmarkItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [find, setFind] = useState(false);
  const [findText, setFindText] = useState('');
  const [browserTheme, setBrowserTheme] = useState('system');
  const [showBookmarks, setShowBookmarks] = useState(true);
  const [addressFocus, setAddressFocus] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [pageSearch, setPageSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [addressError, setAddressError] = useState('');
  const address = useRef<HTMLInputElement>(null);
  const seq = useRef(1);
  const content = useRef<HTMLDivElement>(null);
  const activeTab = tabs.find((t) => t.id === active) ?? tabs[0];
  const offline = !settings.wifi || settings.airplaneMode;
  useEffect(() => {
    try {
      const data = JSON.parse(localStorage.getItem(`root-firefox:${profile.username}`) || 'null');
      if (data) {
        if (Array.isArray(data.bookmarks))
          setBookmarks(
            data.bookmarks
              .filter((x: BookmarkItem) => typeof x.title === 'string' && typeof x.url === 'string')
              .slice(0, 100),
          );
        if (Array.isArray(data.history)) setHistory(data.history.slice(0, 100));
      }
    } catch {}
    setLoaded(true);
  }, [profile.username]);
  useEffect(() => {
    if (loaded)
      try {
        localStorage.setItem(
          `root-firefox:${profile.username}`,
          JSON.stringify({ bookmarks, history }),
        );
      } catch {}
  }, [bookmarks, history, loaded, profile.username]);
  useEffect(() => {
    setDraft(activeTab.url === 'about:newtab' ? '' : activeTab.url);
    try {
      setPageSearch(new URL(activeTab.url).searchParams.get('q') || '');
    } catch {
      setPageSearch('');
    }
    setAddressError('');
  }, [activeTab.url, active]);
  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setLoading(false), 380);
    return () => clearTimeout(t);
  }, [loading]);
  function newTab(priv = false) {
    const id = ++seq.current;
    setTabs((t) => [
      ...t,
      { id, url: 'about:newtab', history: ['about:newtab'], index: 0, private: priv },
    ]);
    setActive(id);
    setMenu(false);
    setTimeout(() => address.current?.focus(), 0);
  }
  function closeTab(id: number) {
    if (tabs.length === 1) {
      setTabs([
        {
          id: ++seq.current,
          url: 'about:newtab',
          history: ['about:newtab'],
          index: 0,
          private: false,
        },
      ]);
      setActive(seq.current);
    } else {
      const index = tabs.findIndex((t) => t.id === id);
      setTabs(tabs.filter((t) => t.id !== id));
      if (active === id) setActive(tabs[index > 0 ? index - 1 : 1].id);
    }
  }
  function navigate(input: string) {
    let url = input.trim();
    if (!url) return;
    if (!url.startsWith('about:')) {
      if (!/^(https?:\/\/)/.test(url))
        url = /^[\w.-]+\.[\w.-]+(?:\/.*)?$/.test(url)
          ? `https://${url}`
          : `https://index.root/search?q=${encodeURIComponent(url)}`;
      try {
        const parsed = new URL(url);
        if (!['http:', 'https:'].includes(parsed.protocol)) throw Error();
      } catch {
        setAddressError('올바른 주소를 입력해 주세요.');
        return;
      }
    }
    setTabs((t) =>
      t.map((tab) =>
        tab.id === active
          ? {
              ...tab,
              url,
              history: [...tab.history.slice(0, tab.index + 1), url],
              index: tab.index + 1,
            }
          : tab,
      ),
    );
    if (!activeTab.private && !url.startsWith('about:'))
      setHistory((h) =>
        [{ title: titleFor(url), url }, ...h.filter((i) => i.url !== url)].slice(0, 100),
      );
    setDraft(url);
    setMenu(false);
    setAddressFocus(false);
    setLoading(true);
    setFindText('');
  }
  function back(delta: number) {
    setTabs((t) =>
      t.map((tab) => {
        const index = tab.index + delta;
        return tab.id === active && index >= 0 && index < tab.history.length
          ? { ...tab, index, url: tab.history[index] }
          : tab;
      }),
    );
  }
  function bookmark() {
    const exists = bookmarks.some((b) => b.url === activeTab.url);
    setBookmarks((b) =>
      exists
        ? b.filter((i) => i.url !== activeTab.url)
        : [...b, { title: titleFor(activeTab.url), url: activeTab.url }],
    );
  }
  function downloadGuide() {
    const path = `${homePath(profile.username)}/Downloads/Project-Root-Guide.txt`;
    setFiles(
      writeFile(
        files,
        path,
        'PROJECT ROOT\n\n조사관 안내\nFirefox에서 웹을 탐색하고, Dolphin에서 파일을 정리하고, Konsole에서 기록을 읽으세요.\n세계관 안내는 Project Root에서 다시 볼 수 있습니다.\n',
      ),
    );
    setPanel('downloads');
    notify('Project-Root-Guide.txt 다운로드 완료');
  }
  const matches = findText
    ? (content.current?.textContent || '').toLowerCase().split(findText.toLowerCase()).length - 1
    : 0;
  let host = '';
  let query = '';
  try {
    const u = new URL(activeTab.url);
    host = u.hostname;
    query = u.searchParams.get('q') || '';
  } catch {}
  const firefoxDark =
    browserTheme === 'dark' || (browserTheme === 'system' && settings.theme === 'breeze-dark');
  return (
    <div
      className={`firefox ${firefoxDark ? 'firefox-dark' : ''} ${activeTab.private ? 'private-window' : ''}`}
      onKeyDown={(e) => {
        if ((e.ctrlKey || e.metaKey) && ['l', 't', 'w', 'f', 'd'].includes(e.key.toLowerCase())) {
          e.preventDefault();
          e.stopPropagation();
          switch (e.key.toLowerCase()) {
            case 'l':
              address.current?.focus();
              address.current?.select();
              break;
            case 't':
              newTab(e.shiftKey);
              break;
            case 'w':
              closeTab(active);
              break;
            case 'f':
              setFind(true);
              break;
            case 'd':
              bookmark();
          }
        }
        if (e.key === 'Escape') {
          setMenu(false);
          setAddressFocus(false);
          setFind(false);
        }
        if (e.altKey && e.key === 'ArrowLeft') {
          e.preventDefault();
          back(-1);
        }
        if (e.altKey && e.key === 'ArrowRight') {
          e.preventDefault();
          back(1);
        }
      }}
    >
      <div className="firefox-tabs">
        <ToolButton
          label="사이드바 표시"
          active={!!panel}
          onClick={() => setPanel(panel ? null : 'history')}
        >
          <PanelLeft size={17} />
        </ToolButton>
        <div role="tablist" aria-label="Firefox 탭" className="firefox-tablist">
          {tabs.map((tab) => (
            <div key={tab.id} className={`firefox-tab ${tab.id === active ? 'active' : ''}`}>
              <button
                role="tab"
                aria-selected={tab.id === active}
                onClick={() => setActive(tab.id)}
              >
                {tab.private ? (
                  <Shield size={15} />
                ) : (
                  <img src="/assets/icons/firefox.png" alt="" width={16} height={16} />
                )}
                <span>{titleFor(tab.url)}</span>
              </button>
              <button aria-label={`${titleFor(tab.url)} 탭 닫기`} onClick={() => closeTab(tab.id)}>
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
        <ToolButton label="새 탭" onClick={() => newTab()}>
          <Plus size={18} />
        </ToolButton>
        <ToolButton
          label="열린 탭 목록"
          onClick={() => setPanel(panel === 'history' ? null : 'history')}
        >
          <ChevronDown size={17} />
        </ToolButton>
      </div>
      <div className="firefox-navigation">
        <ToolButton label="뒤로" disabled={activeTab.index === 0} onClick={() => back(-1)}>
          <ArrowLeft size={18} />
        </ToolButton>
        <ToolButton
          label="앞으로"
          disabled={activeTab.index === activeTab.history.length - 1}
          onClick={() => back(1)}
        >
          <ArrowRight size={18} />
        </ToolButton>
        <ToolButton label="새로 고침" onClick={() => setLoading(true)}>
          {loading ? <X size={18} /> : <RotateCw size={17} />}
        </ToolButton>
        <ToolButton label="홈" onClick={() => navigate('about:newtab')}>
          <Home size={17} />
        </ToolButton>
        <form
          className={`firefox-address ${addressFocus ? 'focused' : ''}`}
          onSubmit={(e) => {
            e.preventDefault();
            navigate(draft);
            address.current?.blur();
          }}
        >
          <button type="button" aria-label="추적 방지 정보" onClick={() => setPrivacy(!privacy)}>
            <ShieldCheck size={16} />
          </button>
          <LockKeyhole size={14} />
          <input
            ref={address}
            aria-label="Firefox 주소창"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onFocus={() => {
              setAddressFocus(true);
            }}
            onBlur={() => setTimeout(() => setAddressFocus(false), 150)}
            placeholder="Index 검색 또는 주소 입력"
            autoComplete="off"
            spellCheck={false}
          />
          {zoom !== 100 && (
            <button type="button" className="zoom-indicator" onClick={() => setZoom(100)}>
              {zoom}%
            </button>
          )}
          <button type="button" aria-label="현재 페이지 북마크" onClick={bookmark}>
            <Star
              size={17}
              fill={bookmarks.some((b) => b.url === activeTab.url) ? '#0060df' : 'none'}
              color={bookmarks.some((b) => b.url === activeTab.url) ? '#0060df' : undefined}
            />
          </button>
          {addressFocus && draft && (
            <div className="address-suggestions">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  navigate(draft);
                  address.current?.blur();
                }}
              >
                <Search size={16} />
                {draft}
                <span>검색 또는 이동 →</span>
              </button>
              {history
                .filter((h) => h.url.includes(draft))
                .slice(0, 5)
                .map((h) => (
                  <button
                    key={h.url}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => navigate(h.url)}
                  >
                    <History size={15} />
                    {h.title}
                    <small>{h.url}</small>
                  </button>
                ))}
            </div>
          )}
        </form>
        <ToolButton
          label="다운로드"
          onClick={() => setPanel(panel === 'downloads' ? null : 'downloads')}
        >
          <Download size={18} />
        </ToolButton>
        <ToolButton
          label="확장 기능"
          onClick={() => setPanel(panel === 'extensions' ? null : 'extensions')}
        >
          <Puzzle size={18} />
        </ToolButton>
        <ToolButton label="Firefox 메뉴" active={menu} onClick={() => setMenu(!menu)}>
          <Menu size={19} />
        </ToolButton>
      </div>
      {showBookmarks && (
        <div className="firefox-bookmarks">
          <button onClick={() => setPanel(panel === 'bookmarks' ? null : 'bookmarks')}>
            <Folder size={14} />
            북마크
          </button>
          {bookmarks.slice(0, 6).map((b) => (
            <button key={b.url} onClick={() => navigate(b.url)}>
              <Globe2 size={13} />
              {b.title}
            </button>
          ))}
          <button className="other-bookmarks" onClick={() => setPanel('bookmarks')}>
            기타 북마크
          </button>
        </div>
      )}
      {privacy && (
        <div className="firefox-privacy">
          <ShieldCheck size={25} />
          <div>
            <strong>향상된 추적 방지</strong>
            <p>이 창은 워크스테이션의 내부 사이트만 탐색합니다.</p>
          </div>
          <button onClick={() => setPrivacy(false)} aria-label="보안 정보 닫기">
            <X size={16} />
          </button>
        </div>
      )}
      {menu && (
        <div className="firefox-menu">
          <button onClick={() => newTab()}>
            <Plus size={17} />새 탭<kbd>Ctrl+T</kbd>
          </button>
          <button onClick={() => newTab(true)}>
            <Shield size={17} />새 사생활 보호 탭
          </button>
          <hr />
          <button
            onClick={() => {
              setPanel('bookmarks');
              setMenu(false);
            }}
          >
            <Bookmark size={17} />
            북마크
            <ChevronDown size={13} />
          </button>
          <button
            onClick={() => {
              setPanel('history');
              setMenu(false);
            }}
          >
            <History size={17} />
            방문 기록
          </button>
          <button
            onClick={() => {
              setPanel('downloads');
              setMenu(false);
            }}
          >
            <Download size={17} />
            다운로드
          </button>
          <hr />
          <div className="firefox-zoom">
            <span>확대/축소</span>
            <button aria-label="축소" onClick={() => setZoom(Math.max(50, zoom - 10))}>
              <ZoomOut size={17} />
            </button>
            <button onClick={() => setZoom(100)}>{zoom}%</button>
            <button aria-label="확대" onClick={() => setZoom(Math.min(200, zoom + 10))}>
              <ZoomIn size={17} />
            </button>
          </div>
          <button
            onClick={() => {
              setFind(true);
              setMenu(false);
            }}
          >
            <Search size={17} />
            페이지에서 찾기<kbd>Ctrl+F</kbd>
          </button>
          <hr />
          <button onClick={() => navigate('about:preferences')}>
            <SettingsIcon size={17} />
            설정
          </button>
          <button
            onClick={() => {
              setPanel('extensions');
              setMenu(false);
            }}
          >
            <Puzzle size={17} />
            확장 기능 및 테마
          </button>
          <button onClick={() => navigate('about:about')}>
            <Info size={17} />
            Firefox 정보
          </button>
        </div>
      )}
      <div className="firefox-workspace">
        {panel && (
          <aside className="firefox-sidepanel">
            <header>
              <strong>
                {
                  {
                    history: '방문 기록',
                    bookmarks: '북마크',
                    downloads: '다운로드',
                    extensions: '확장 기능',
                  }[panel]
                }
              </strong>
              <button aria-label="사이드바 닫기" onClick={() => setPanel(null)}>
                <X size={16} />
              </button>
            </header>
            {panel === 'history' ? (
              <>
                <button className="native-button" onClick={() => setHistory([])}>
                  방문 기록 삭제
                </button>
                {history.length ? (
                  history.map((h, i) => (
                    <button
                      className="browser-history-item"
                      key={i}
                      onClick={() => navigate(h.url)}
                    >
                      <Globe2 size={16} />
                      <span>
                        {h.title}
                        <small>{h.url}</small>
                      </span>
                    </button>
                  ))
                ) : (
                  <p>방문 기록이 없습니다.</p>
                )}
              </>
            ) : panel === 'bookmarks' ? (
              bookmarks.map((b) => (
                <div className="bookmark-entry" key={b.url}>
                  <button onClick={() => navigate(b.url)}>
                    <Star size={14} />
                    {b.title}
                  </button>
                  <button
                    aria-label={`${b.title} 북마크 삭제`}
                    onClick={() => setBookmarks((items) => items.filter((x) => x.url !== b.url))}
                  >
                    <X size={13} />
                  </button>
                </div>
              ))
            ) : panel === 'downloads' ? (
              <>
                {files
                  .filter((f) => f.kind === 'file' && f.path.includes('/Downloads/'))
                  .map((f) => (
                    <div className="download-item" key={f.path}>
                      <FileText size={25} />
                      <span>
                        {f.path.split('/').pop()}
                        <small>완료 · {f.content?.length || 0}바이트</small>
                      </span>
                      <Check size={15} />
                    </div>
                  ))}
                <p>다운로드한 파일은 Dolphin의 다운로드 폴더에 저장됩니다.</p>
              </>
            ) : (
              <div className="browser-panel-empty">
                <Puzzle size={35} />
                <p>설치된 확장 기능이 없습니다.</p>
              </div>
            )}
          </aside>
        )}
        <div className="firefox-page" ref={content} style={{ zoom: zoom / 100 }}>
          {loading && <div className="firefox-loading" />}
          {addressError && <p role="alert">{addressError}</p>}
          {activeTab.url === 'about:newtab' ? (
            <div className="firefox-newtab">
              <div className="firefox-wordmark">
                <img src="/assets/icons/firefox.png" alt="" width={82} height={82} />
                <h1>{activeTab.private ? '사생활 보호' : 'Firefox'}</h1>
              </div>
              <form
                className="firefox-search"
                onSubmit={(e) => {
                  e.preventDefault();
                  navigate(pageSearch);
                }}
              >
                <Search size={21} />
                <input
                  aria-label="웹 검색"
                  value={pageSearch}
                  onChange={(e) => setPageSearch(e.target.value)}
                  placeholder="웹 검색 또는 주소 입력"
                />
                <button aria-label="검색" type="submit">
                  <ArrowRight size={20} />
                </button>
              </form>
              <div className="firefox-shortcuts">
                {[
                  {
                    title: 'Project Root',
                    url: 'https://portal.root',
                    letter: 'R',
                    color: '#193b59',
                  },
                  { title: 'Index', url: 'https://index.root', letter: 'i', color: '#6847ed' },
                  {
                    title: '시작 안내',
                    url: 'https://portal.root/guide',
                    letter: '?',
                    color: '#158977',
                  },
                ].map((s) => (
                  <button key={s.title} onClick={() => navigate(s.url)}>
                    <span style={{ color: s.color }}>{s.letter}</span>
                    <small>{s.title}</small>
                  </button>
                ))}
              </div>
              {activeTab.private && (
                <p className="private-note">사생활 보호 탭의 방문 기록은 저장하지 않습니다.</p>
              )}
              <button className="newtab-customize" onClick={() => navigate('about:preferences')}>
                <SettingsIcon size={18} />
              </button>
            </div>
          ) : activeTab.url === 'about:preferences' ? (
            <div className="firefox-preferences">
              <h1>설정</h1>
              <h2>일반</h2>
              <p>Firefox를 원하는 방식으로 사용하세요.</p>
              <h3>웹사이트 모양</h3>
              <div className="firefox-theme-options">
                {[
                  ['system', '시스템 테마'],
                  ['light', '밝게'],
                  ['dark', '어둡게'],
                ].map(([v, l]) => (
                  <label key={v}>
                    <input
                      type="radio"
                      name="firefoxTheme"
                      checked={browserTheme === v}
                      onChange={() => setBrowserTheme(v)}
                    />
                    {l}
                  </label>
                ))}
              </div>
              <h3>북마크 도구 모음</h3>
              <label>
                <input
                  type="checkbox"
                  checked={showBookmarks}
                  onChange={(e) => setShowBookmarks(e.target.checked)}
                />
                항상 표시
              </label>
              <h3>방문 기록</h3>
              <button
                className="native-button"
                onClick={() => {
                  setHistory([]);
                  notify('Firefox 방문 기록을 삭제했습니다.');
                }}
              >
                방문 기록 지우기
              </button>
              <h3>기본 검색</h3>
              <p>Index · 워크스테이션 내부 검색</p>
            </div>
          ) : activeTab.url === 'about:about' ? (
            <div className="firefox-about">
              <img src="/assets/icons/firefox.png" width={95} height={95} alt="Firefox" />
              <h1>Firefox</h1>
              <p>Mozilla Firefox 데스크톱 UI를 기반으로 한 게임 내 브라우저</p>
              <p>PROJECT ROOT Virtual Web</p>
            </div>
          ) : offline ? (
            <div className="firefox-error">
              <WifiOff size={65} strokeWidth={1} />
              <h1>오프라인 상태입니다.</h1>
              <p>인터넷에 연결되어 있지 않습니다. 시스템 트레이에서 네트워크 연결을 확인하세요.</p>
              <button onClick={() => setLoading(true)}>다시 시도</button>
            </div>
          ) : host === 'portal.root' ? (
            <article className="intranet">
              <header>
                <strong>
                  ROOT <span>INTRANET</span>
                </strong>
                <span>Workspace services</span>
              </header>
              <div>
                <span>WELCOME TO YOUR WORKSPACE</span>
                <h1>
                  좋은 조사는
                  <br />
                  작은 질문에서 시작됩니다.
                </h1>
                <p>연결된 기록을 탐색하고, 그 안에 남은 흔적을 찾으세요.</p>
                <button onClick={downloadGuide}>
                  <Download size={16} />
                  워크스테이션 안내 다운로드
                </button>
              </div>
              <section>
                <h2>분석가를 위한 도구</h2>
                <p>
                  Firefox로 정보를 찾고, Konsole로 기록을 확인하세요. 자료는 Dolphin에 정리하고 조사
                  내용은 Project Root에서 관리합니다.
                </p>
                <button onClick={() => navigate('https://index.root')}>
                  Index 검색 열기 <ArrowRight size={15} />
                </button>
              </section>
            </article>
          ) : host === 'index.root' ? (
            <div className={`index-page ${query ? 'results' : ''}`}>
              <h1>
                Index<span>.</span>
              </h1>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  navigate(`https://index.root/search?q=${encodeURIComponent(pageSearch)}`);
                }}
              >
                <Search size={19} />
                <input
                  aria-label="Index 검색"
                  value={pageSearch}
                  onChange={(e) => setPageSearch(e.target.value)}
                  placeholder="사람, 기록, 연결을 찾아보세요."
                />
                <button type="submit">검색</button>
              </form>
              {query ? (
                <div className="index-results">
                  <small>“{query}” 검색 결과</small>
                  {/root|안내|work|조사|시작/i.test(query) ? (
                    <article>
                      <small>portal.root › guide</small>
                      <button onClick={() => navigate('https://portal.root/guide')}>
                        PROJECT ROOT — 워크스테이션 안내
                      </button>
                      <p>조사관을 위한 시작 안내와 업무용 도구를 확인하세요.</p>
                    </article>
                  ) : (
                    <>
                      <h2>일치하는 기록을 찾지 못했습니다.</h2>
                      <p>검색어의 철자를 확인하거나 다른 표현으로 검색해 보세요.</p>
                    </>
                  )}
                </div>
              ) : (
                <p>더 넓게 탐색하고, 더 깊게 연결하세요.</p>
              )}
            </div>
          ) : (
            <div className="firefox-error">
              <Globe2 size={66} strokeWidth={1} />
              <h1>서버를 찾을 수 없음</h1>
              <p>{host || activeTab.url} 서버에 연결할 수 없습니다.</p>
              <ul>
                <li>웹사이트 주소에 오타가 없는지 확인하세요.</li>
                <li>다른 페이지가 열리는지 확인하세요.</li>
                <li>워크스테이션에 연결된 내부 사이트인지 확인하세요.</li>
              </ul>
              <button onClick={() => setLoading(true)}>다시 시도</button>
            </div>
          )}
        </div>
      </div>
      {find && (
        <div className="firefox-find">
          <button aria-label="찾기 닫기" onClick={() => setFind(false)}>
            <X size={16} />
          </button>
          <input
            aria-label="페이지에서 찾기"
            autoFocus
            value={findText}
            onChange={(e) => setFindText(e.target.value)}
            placeholder="페이지에서 찾기"
          />
          <span>{findText ? `${matches}개 일치` : ''}</span>
          <small>대소문자 구분 안 함</small>
        </div>
      )}
    </div>
  );
}
