'use client';
import { useState } from 'react';
import { Camera, Grid2X2, Mic, Search, X } from 'lucide-react';
import { searchWorld } from '@/game/world';
const tabs = [
  ['ai', 'AI 모드'],
  ['all', '전체'],
  ['isch', '이미지'],
  ['vid', '동영상'],
  ['nws', '뉴스'],
  ['shop', '쇼핑'],
  ['lcl', '지도'],
] as const;
export function GoogleSearch({
  query,
  category,
  value,
  setValue,
  navigate,
  dark,
}: {
  query: string;
  category: string;
  value: string;
  setValue: (value: string) => void;
  navigate: (url: string) => void;
  dark: boolean;
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [appsOpen, setAppsOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const results = searchWorld(query);
  const logo = dark ? '/assets/google-logo-light.png' : '/assets/google-logo.png';
  const search = (text: string, tab = 'all') =>
    navigate(
      `https://www.google.com/search?q=${encodeURIComponent(text)}${tab === 'all' ? '' : `&tbm=${tab}`}`,
    );
  const searchBox = (
    <form
      className="google-search-box"
      onSubmit={(e) => {
        e.preventDefault();
        search(value);
      }}
    >
      <Search size={20} className="google-search-icon" />
      <input
        aria-label="Google 검색"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoComplete="off"
        spellCheck={false}
      />
      {value && (
        <button
          type="button"
          title="검색어 지우기"
          aria-label="검색어 지우기"
          onClick={() => setValue('')}
        >
          <X size={19} />
        </button>
      )}
      <span className="google-search-divider" />
      <button
        type="button"
        title="음성 검색"
        aria-label="음성 검색"
        onClick={() => setVoiceOpen(true)}
      >
        <Mic size={19} />
      </button>
      <button
        type="button"
        title="이미지로 검색"
        aria-label="이미지로 검색"
        onClick={() => search(value, 'isch')}
      >
        <Camera size={19} />
      </button>
      <button title="검색" aria-label="검색">
        <Search size={20} />
      </button>
    </form>
  );
  return (
    <div className={`google-page ${dark ? 'dark' : ''} ${query ? 'has-results' : ''}`}>
      {query ? (
        <>
          <header className="google-results-header">
            <button
              className="google-header-logo"
              aria-label="Google 홈"
              onClick={() => navigate('https://www.google.com')}
            >
              <img src={logo} alt="Google" />
            </button>
            {searchBox}
            <button
              className="google-apps-button"
              title="Google 앱"
              aria-label="Google 앱"
              onClick={() => setAppsOpen(!appsOpen)}
            >
              <Grid2X2 size={19} />
            </button>
            {appsOpen && (
              <div className="google-app-menu">
                <button
                  onClick={() => {
                    navigate('https://www.google.com');
                    setAppsOpen(false);
                  }}
                >
                  검색
                </button>
                <button
                  onClick={() => {
                    search(query, 'isch');
                    setAppsOpen(false);
                  }}
                >
                  이미지
                </button>
                <button
                  onClick={() => {
                    search(query, 'nws');
                    setAppsOpen(false);
                  }}
                >
                  뉴스
                </button>
              </div>
            )}
          </header>
          <nav className="google-tabs" aria-label="Google 검색 유형">
            {tabs.map(([key, label]) => (
              <button
                key={key}
                className={category === key ? 'selected' : ''}
                onClick={() => search(query, key)}
              >
                {label}
              </button>
            ))}
            <button className="google-more" onClick={() => setMoreOpen(!moreOpen)}>
              더보기 ▾
            </button>
            <button className="google-tools" onClick={() => setToolsOpen(!toolsOpen)}>
              도구 ▾
            </button>
          </nav>
          {moreOpen && (
            <div className="google-secondary-menu">
              <button onClick={() => search(query, 'bks')}>도서</button>
              <button onClick={() => search(query, 'flt')}>항공편</button>
            </div>
          )}
          {toolsOpen && (
            <div className="google-secondary-menu">
              <span>모든 언어</span>
              <span>기간 제한 없음</span>
              <span>모든 검색결과</span>
            </div>
          )}
          <main className="google-results-body">
            <small className="google-count">
              검색결과 약 {results.length.toLocaleString('ko-KR')}개
            </small>
            {category === 'ai' ? (
              <div className="google-empty-category">
                <h2>AI 모드</h2>
                <p>
                  이 워크스테이션의 가상 웹 기록에서는 AI 응답을 제공하지 않습니다. 아래의 일반
                  검색결과에서 출처를 직접 확인하세요.
                </p>
                <button onClick={() => search(query)}>전체 검색결과 보기</button>
              </div>
            ) : category === 'isch' ? (
              <div className="google-image-results">
                {results.length ? (
                  results.map((result, i) => (
                    <button key={`${result.url}-${i}`} onClick={() => navigate(result.url)}>
                      <span className="google-image-preview">
                        {result.url.includes('projectroot.kro.kr') ? (
                          <img src="/brand/project-root-mark.svg" alt="" />
                        ) : result.url.includes('github.com') ? (
                          'GitHub'
                        ) : result.url.includes('threads.net') ? (
                          'Threads'
                        ) : (
                          '웹'
                        )}
                      </span>
                      <strong>{result.title}</strong>
                      <small>{new URL(result.url).hostname}</small>
                    </button>
                  ))
                ) : (
                  <p>검색어와 일치하는 이미지 결과가 없습니다.</p>
                )}
              </div>
            ) : ['vid', 'nws', 'shop', 'lcl', 'bks', 'flt'].includes(category) ? (
              <div className="google-empty-category">
                <h2>
                  {tabs.find(([key]) => key === category)?.[1] ||
                    (category === 'bks' ? '도서' : '항공편')}{' '}
                  검색결과
                </h2>
                <p>이 검색어에 대한 표시 가능한 결과가 없습니다.</p>
                <button onClick={() => search(query)}>전체 검색결과 보기</button>
              </div>
            ) : results.length ? (
              <div className="google-web-results">
                {results.map((result, i) => (
                  <article key={`${result.url}-${i}`}>
                    <div className="google-result-source">
                      <span className="google-result-favicon">
                        {result.url.includes('projectroot.kro.kr') ? (
                          <img src="/brand/project-root-mark.svg" alt="" />
                        ) : result.url.includes('github.com') ? (
                          '◉'
                        ) : result.url.includes('threads.net') ? (
                          '◎'
                        ) : (
                          '◌'
                        )}
                      </span>
                      <span>
                        <strong>
                          {result.url.includes('projectroot.kro.kr')
                            ? 'PROJECT ROOT'
                            : result.url.includes('github.com')
                              ? 'GitHub'
                              : result.url.includes('threads.net')
                                ? 'Threads'
                                : new URL(result.url).hostname}
                        </strong>
                        <small>{result.url}</small>
                      </span>
                      <button aria-label="결과 옵션" title="결과 옵션">
                        ⋮
                      </button>
                    </div>
                    <button className="google-result-title" onClick={() => navigate(result.url)}>
                      {result.title}
                    </button>
                    <p>{result.description}</p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="google-no-results">
                <h2>검색어와 일치하는 결과가 없습니다.</h2>
                <p>맞춤법을 확인하거나 다른 검색어로 검색해 보세요.</p>
              </div>
            )}
          </main>
        </>
      ) : (
        <main className="google-home">
          <img src={logo} alt="Google" className="google-home-logo" />
          {searchBox}
          <div className="google-home-actions">
            <button onClick={() => search(value)}>Google 검색</button>
            <button onClick={() => search(value)}>I&apos;m Feeling Lucky</button>
          </div>
          <p>
            Google 제공 서비스: <button onClick={() => {}}>한국어</button>　
            <button onClick={() => {}}>English</button>
          </p>
        </main>
      )}
      {!query && (
        <footer className="google-footer">
          <span>대한민국</span>
          <div>
            <span>Google 정보</span>
            <span>광고</span>
            <span>비즈니스</span>
            <span>검색의 원리</span>
            <span>개인정보처리방침</span>
            <span>약관</span>
            <span>설정</span>
          </div>
        </footer>
      )}
      {voiceOpen && (
        <div className="google-voice-dialog" role="dialog" aria-label="음성 검색">
          <div>
            <Mic size={29} />
            <h2>음성 검색</h2>
            <p>이 워크스테이션에서는 마이크를 사용할 수 없습니다.</p>
            <button onClick={() => setVoiceOpen(false)}>닫기</button>
          </div>
        </div>
      )}
    </div>
  );
}
