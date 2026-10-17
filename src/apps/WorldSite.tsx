'use client';
import { ArrowRight, FileText, Globe2, ShieldCheck } from 'lucide-react';
import { RootIcon } from '@/components/desktop/AppIcon';
import { OFFICIAL_URL, worldPage } from '@/game/world';
import { CHANGELOG_URL, CURRENT_RECORD_URL, OLD_RECORD_URL } from '@/game/cases';
import fixture from '@/game/virtual-web-fixtures.json';
type Navigate = (url: string) => void;
export function WorldSite({
  kind,
  url,
  navigate,
}: {
  kind: 'official' | 'github' | 'threads' | 'not-found' | 'auth';
  url: string;
  navigate: Navigate;
}) {
  const page = worldPage(url);
  if (kind === 'official' && page?.url === CURRENT_RECORD_URL)
    return <article className="root-public-site"><header><button onClick={() => navigate(OFFICIAL_URL)}><RootIcon size={31} /><strong>PROJECT ROOT</strong></button></header><section className="public-section"><span>PUBLIC RECORDS / UPDATED 2026-09-24</span><h1>공개 기록 보존 안내</h1><p>공개 자료의 보존 안내를 새 주소로 옮겼습니다. 기존 자료는 삭제하지 않았으며 내용과 출처를 유지합니다.</p><p>이전 주소: {OLD_RECORD_URL}</p><p>현재 주소: {CURRENT_RECORD_URL}</p><button onClick={() => navigate(CHANGELOG_URL)}>공개 변경 이력 확인 →</button></section></article>;
  if (kind === 'official')
    return (
      <article className="root-public-site">
        <header>
          <button onClick={() => navigate(OFFICIAL_URL)}>
            <RootIcon size={31} />
            <strong>PROJECT ROOT</strong>
          </button>
          <nav>
            <a href="#about">단체 소개</a>
            <a href="#principles">조사 원칙</a>
            <a href="#partners">협력 소식</a>
            <button onClick={() => navigate(CURRENT_RECORD_URL)}>공개 자료</button>
          </nav>
        </header>
        <section className="public-hero">
          <div>
            <span>INDEPENDENT DIGITAL INVESTIGATION</span>
            <h1>
              기록을 읽고,
              <br />
              사실을 연결합니다.
            </h1>
            <p>PROJECT ROOT는 공개 정보와 허가된 기록을 분석하는 독립 조사 조직입니다.</p>
            <a href="#about">
              우리가 하는 일 <ArrowRight size={17} />
            </a>
          </div>
          <div className="public-diagram">
            <span>RECORD</span>
            <i />
            <RootIcon size={88} />
            <i />
            <span>CONTEXT</span>
          </div>
        </section>
        <section id="about" className="public-section">
          <span>01 / ABOUT US</span>
          <h2>하나의 기록만으로 결론 내리지 않습니다.</h2>
          <p>
            사람과 조직이 남긴 디지털 흔적에는 맥락이 있습니다. 우리는 공개된 웹 자료, 계정의 활동,
            문서와 시스템 기록을 교차 검토해 무엇이 실제로 일어났는지 설명합니다.
          </p>
          <div className="public-services">
            {[
              [Globe2, '공개 정보 조사', '웹과 공개 기록을 살펴봅니다.'],
              [FileText, '기록 분석', '시간과 출처를 확인합니다.'],
              [ShieldCheck, '검증 가능한 보고', '추측과 사실을 구분합니다.'],
            ].map(([Icon, title, copy]) => {
              const I = Icon as typeof Globe2;
              return (
                <div key={String(title)}>
                  <I size={25} />
                  <h3>{String(title)}</h3>
                  <p>{String(copy)}</p>
                </div>
              );
            })}
          </div>
        </section>
        <section id="principles" className="public-principles">
          <span>02 / OUR PRINCIPLES</span>
          <h2>신뢰는 조사 방법에서 시작됩니다.</h2>
          <div>
            <p>
              <b>01</b>
              <strong>범위를 지킵니다.</strong>공개 자료와 접근이 허가된 기록만 조사합니다.
            </p>
            <p>
              <b>02</b>
              <strong>출처를 남깁니다.</strong>다른 사람이 검증할 수 있게 기록합니다.
            </p>
            <p>
              <b>03</b>
              <strong>성급하게 단정하지 않습니다.</strong>확인된 사실과 가능성을 구분합니다.
            </p>
          </div>
        </section>
        <section id="partners" className="public-section">
          <span>03 / PARTNER NOTES</span>
          <h2>기록을 다루는 사람들과 함께합니다.</h2>
          <div className="public-partner">
            <div>
              <small>협력 기관</small>
              <h3>기록의 연결성과 보존</h3>
              <p>기관 간 협력과 공개 자료의 신뢰성을 연구합니다.</p>
            </div>
          </div>
        </section>
        <footer>
          <strong>PROJECT ROOT</strong>
          <span>Digital investigation, grounded in evidence.</span>
        </footer>
      </article>
    );
  if (page?.service === 'github')
    return (
      <GitHub
        url={url}
        navigate={navigate}
        notFound={kind === 'not-found'}
        auth={kind === 'auth'}
      />
    );
  if (page?.service === 'threads')
    return (
      <Threads
        url={url}
        navigate={navigate}
        notFound={kind === 'not-found'}
        auth={kind === 'auth'}
      />
    );
  if (kind === 'not-found')
    return (
      <article className="root-public-site">
        <header>
          <button onClick={() => navigate(OFFICIAL_URL)}>
            <RootIcon size={31} />
            <strong>PROJECT ROOT</strong>
          </button>
        </header>
        <section className="public-section">
          <h1>페이지를 찾을 수 없습니다.</h1>
          {url.includes('/resources/archive-guide') && <p>요청한 공개 자료 주소가 더 이상 이 위치에 없습니다. 자료 제목으로 검색하거나 공개 자료 목록을 확인해 주세요.</p>}
          <button onClick={() => navigate(OFFICIAL_URL)}>홈으로 돌아가기</button>
        </section>
      </article>
    );
  return (
    <div className="virtual-service">
      <h1>Page not found</h1>
    </div>
  );
}
function GitHub({
  url,
  navigate,
  notFound,
  auth,
}: {
  url: string;
  navigate: Navigate;
  notFound: boolean;
  auth: boolean;
}) {
  const parts = new URL(url).pathname.split('/').filter(Boolean);
  const handle = parts[0];
  const user = fixture.github.users[handle as keyof typeof fixture.github.users];
  const repo = fixture.github.repos[`${handle}/${parts[1]}` as keyof typeof fixture.github.repos];
  return (
    <div className="virtual-service github-service">
      <header>
        <button onClick={() => navigate('https://github.com')}>◉ GitHub</button>
        <button onClick={() => navigate('https://github.com')}>Explore</button>
        <button onClick={() => navigate('https://github.com')}>Repositories</button>
        <button onClick={() => navigate('https://github.com/login')}>Sign in</button>
      </header>
      {auth ? (
        <main className="virtual-auth">
          <h1>Sign in to GitHub</h1>
          <p>
            Public pages are available without signing in. This workspace does not provide a GitHub
            account.
          </p>
          <button onClick={() => navigate('https://github.com')}>Explore public content</button>
        </main>
      ) : notFound ? (
        <main>
          <h1>404 — Page not found</h1>
          <p>The page you&apos;re looking for doesn&apos;t exist.</p>
        </main>
      ) : parts.length === 0 ? (
        <main>
          <h1>Where the world builds software</h1>
          <p>Explore public projects and developers.</p>
          <div className="virtual-cards">
            {Object.entries(fixture.github.users).map(([name, u]) => (
              <button key={name} onClick={() => navigate(`https://github.com/${name}`)}>
                <strong>{u.name}</strong>
                <small>@{name}</small>
                <p>{u.bio}</p>
              </button>
            ))}
          </div>
        </main>
      ) : parts.length === 1 && user ? (
        <main>
          <div className="virtual-profile-head">
            <div className="virtual-avatar">{user.name.slice(0, 1)}</div>
            <div>
              <h1>{user.name}</h1>
              <p>@{handle}</p>
              <p>{user.bio}</p>
              {'location' in user && <small>{user.location}</small>}
            </div>
          </div>
          <nav>Overview　 Repositories　 Activity</nav>
          <h2>Public repositories</h2>
          <div className="virtual-cards">
            {user.repos.map((name) => (
              <button key={name} onClick={() => navigate(`https://github.com/${handle}/${name}`)}>
                <strong>{name}</strong>
                <p>
                  {fixture.github.repos[`${handle}/${name}` as keyof typeof fixture.github.repos]
                    ?.description || 'Public repository'}
                </p>
              </button>
            ))}
          </div>
          {'lastActivity' in user && (
            <p>
              Recent activity ·{' '}
              {new Date(user.lastActivity).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })} KST
            </p>
          )}
        </main>
      ) : repo ? (
        <main>
          <small>
            <button onClick={() => navigate(`https://github.com/${handle}`)}>{handle}</button> /{' '}
            {parts[1]}
          </small>
          <h1>{parts[1]}</h1>
          <p>{repo.description}</p>
          <nav>Code　 Issues　 Pull requests　 Actions</nav>
          <h2>Activity</h2>
          {repo.activity.map((item) => (
            <article key={item.message}>
              <strong>{item.type}</strong>
              <p>{item.message}</p>
              <small>
                {new Date(item.time).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })} KST
              </small>
            </article>
          ))}
        </main>
      ) : (
        <main>
          <h1>404 — Page not found</h1>
        </main>
      )}
    </div>
  );
}
function Threads({
  url,
  navigate,
  notFound,
  auth,
}: {
  url: string;
  navigate: Navigate;
  notFound: boolean;
  auth: boolean;
}) {
  const parsed = new URL(url);
  const parts = parsed.pathname.split('/').filter(Boolean);
  const handle = parts[0]?.replace(/^@/, '') || '';
  const user = fixture.threads.users[handle as keyof typeof fixture.threads.users];
  const post = user?.posts.find((p) => p.id === parts[2]);
  const query = parsed.searchParams.get('q') || '';
  return (
    <div className="virtual-service threads-service">
      <header>
        <button onClick={() => navigate('https://www.threads.net')}>◎ Threads</button>
        <button onClick={() => navigate('https://www.threads.net')}>Home</button>
        <button onClick={() => navigate('https://www.threads.net/search')}>Search</button>
        <button onClick={() => navigate('https://www.threads.net/login')}>Log in</button>
      </header>
      <main>
        {auth ? (
          <section className="virtual-auth">
            <h1>Log in to Threads</h1>
            <p>Public profiles and posts can be read without an account.</p>
            <button onClick={() => navigate('https://www.threads.net')}>Browse public posts</button>
          </section>
        ) : notFound ? (
          <>
            <h1>{parts.includes('post') ? 'Post not found' : 'User not found'}</h1>
            <p>The profile or post you&apos;re looking for doesn&apos;t exist.</p>
          </>
        ) : parts.length === 0 ? (
          <>
            <h1>Threads</h1>
            <p>공개된 대화와 사람들의 최신 글을 살펴보세요.</p>
            {Object.entries(fixture.threads.users).flatMap(([name, u]) =>
              u.posts
                .slice(0, 1)
                .map((p) => (
                  <Post
                    key={p.id}
                    handle={name}
                    name={u.displayName}
                    post={p}
                    navigate={navigate}
                  />
                )),
            )}
          </>
        ) : parts[0] === 'search' ? (
          <>
            <h1>Search</h1>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const input = new FormData(e.currentTarget).get('q');
                navigate(
                  `https://www.threads.net/search?q=${encodeURIComponent(String(input || ''))}`,
                );
              }}
            >
              <input name="q" defaultValue={query} aria-label="Threads 검색" placeholder="Search" />
              <button>검색</button>
            </form>
            {Object.entries(fixture.threads.users)
              .filter(
                ([name, u]) =>
                  !query ||
                  `${name} ${u.displayName} ${u.bio}`.toLowerCase().includes(query.toLowerCase()),
              )
              .map(([name, u]) => (
                <button
                  className="virtual-user-row"
                  key={name}
                  onClick={() => navigate(`https://www.threads.net/@${name}`)}
                >
                  <strong>{u.displayName}</strong>
                  <span>@{name}</span>
                  <p>{u.bio}</p>
                </button>
              ))}
            <h2>Posts</h2>
            {Object.entries(fixture.threads.users).flatMap(([name, u]) =>
              u.posts
                .filter(
                  (p) =>
                    !query ||
                    `${name} ${u.displayName} ${p.text}`
                      .toLowerCase()
                      .includes(query.toLowerCase()),
                )
                .map((p) => (
                  <Post
                    key={p.id}
                    handle={name}
                    name={u.displayName}
                    post={p}
                    navigate={navigate}
                  />
                )),
            )}
          </>
        ) : user ? (
          <>
            <div className="virtual-profile-head">
              <div className="virtual-avatar">{user.displayName.slice(0, 1)}</div>
              <div>
                <h1>{user.displayName}</h1>
                <p>@{handle}</p>
                <p>{user.bio}</p>
              </div>
            </div>
            <nav>Threads　 Replies　 Media</nav>
            {post ? (
              <>
                <Post handle={handle} name={user.displayName} post={post} navigate={navigate} />
                <h2>Replies</h2>
                <p>아직 표시할 답글이 없습니다.</p>
              </>
            ) : (
              user.posts.map((p) => (
                <Post
                  key={p.id}
                  handle={handle}
                  name={user.displayName}
                  post={p}
                  navigate={navigate}
                />
              ))
            )}
          </>
        ) : null}
      </main>
    </div>
  );
}
function Post({
  handle,
  name,
  post,
  navigate,
}: {
  handle: string;
  name: string;
  post: { id: string; time: string; text: string };
  navigate: Navigate;
}) {
  return (
    <article className="virtual-post">
      <button onClick={() => navigate(`https://www.threads.net/@${handle}`)}>
        <strong>{name}</strong> @{handle}
      </button>
      <small>{new Date(post.time).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })} KST</small>
      <p>{post.text}</p>
      <button onClick={() => navigate(`https://www.threads.net/@${handle}/post/${post.id}`)}>
        ♡　↗　답글 보기
      </button>
    </article>
  );
}
