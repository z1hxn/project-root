import fixture from './virtual-web-fixtures.json';
import { CHANGELOG_URL, CURRENT_RECORD_URL } from './cases';
export const OFFICIAL_URL = 'https://projectroot.kro.kr';
export const GITHUB_URL = 'https://github.com/seoha-y';
export const THREADS_URL = 'https://www.threads.net/@seoha_y';
export interface WorldPage {
  url: string;
  title: string;
  description: string;
  kind: 'official' | 'github' | 'threads' | 'not-found' | 'google' | 'auth';
  service?: 'github' | 'threads';
}
export const normalizeSearch = (input: string) =>
  input
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, '');
export function worldPage(input: string): WorldPage | undefined {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return undefined;
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.port || url.username || url.password)
    return undefined;
  const host = url.hostname.toLowerCase();
  let path: string;
  try {
    path = decodeURIComponent(url.pathname).replace(/\/+$/, '') || '/';
  } catch {
    return undefined;
  }
  if (['projectroot.kro.kr', 'www.projectroot.kro.kr'].includes(host))
    return {
      url: path === '/records/archive-guide' ? CURRENT_RECORD_URL : OFFICIAL_URL,
      title: path === '/records/archive-guide' ? '공개 기록 보존 안내 — PROJECT ROOT' : 'PROJECT ROOT — 디지털 조사와 분석',
      description: path === '/records/archive-guide' ? '공개 자료 주소 변경과 보존 안내.' : '공개 정보와 허가된 기록을 바탕으로 사실을 연결하는 디지털 조사 조직.',
      kind: ['/', '/records/archive-guide'].includes(path) ? 'official' : 'not-found',
    };
  if (['google.com', 'www.google.com'].includes(host))
    return {
      url: `https://www.google.com${url.pathname}${url.search}`,
      title: url.searchParams.get('q') ? `${url.searchParams.get('q')} - Google 검색` : 'Google',
      description: 'Google 검색',
      kind: 'google',
    };
  if (host === 'github.com') {
    if (path === '/login')
      return {
        url: 'https://github.com/login',
        title: 'Sign in to GitHub',
        description: 'Authentication required',
        kind: 'auth',
        service: 'github',
      };
    if (path === '/')
      return {
        url: 'https://github.com',
        title: 'GitHub',
        description: 'Where the world builds software',
        kind: 'github',
        service: 'github',
      };
    const bits = path.slice(1).split('/');
    const user = fixture.github.users[bits[0] as keyof typeof fixture.github.users];
    const repo = fixture.github.repos[`${bits[0]}/${bits[1]}` as keyof typeof fixture.github.repos];
    if (bits.length === 1 && user)
      return {
        url: `https://github.com${path}`,
        title: `${user.name} (${bits[0]}) · GitHub`,
        description: user.bio,
        kind: 'github',
        service: 'github',
      };
    if (bits.length === 2 && repo)
      return {
        url: `https://github.com${path}`,
        title: `${bits[0]}/${bits[1]} · GitHub`,
        description: repo.description,
        kind: 'github',
        service: 'github',
      };
    return {
      url: `https://github.com${path}`,
      title: 'Not Found · GitHub',
      description: 'Page not found',
      kind: 'not-found',
      service: 'github',
    };
  }
  if (['threads.net', 'www.threads.net'].includes(host)) {
    if (path === '/login')
      return {
        url: 'https://www.threads.net/login',
        title: 'Log in · Threads',
        description: 'Authentication required',
        kind: 'auth',
        service: 'threads',
      };
    if (path === '/')
      return {
        url: 'https://www.threads.net',
        title: 'Threads',
        description: '공개 대화',
        kind: 'threads',
        service: 'threads',
      };
    if (path === '/search')
      return {
        url: `https://www.threads.net/search${url.search}`,
        title: 'Search · Threads',
        description: '사용자와 게시물 검색',
        kind: 'threads',
        service: 'threads',
      };
    const userName = path.match(/^\/@([^/]+)(?:\/post\/([^/]+))?$/);
    const user =
      userName && fixture.threads.users[userName[1] as keyof typeof fixture.threads.users];
    if (userName && user) {
      if (!userName[2] || user.posts.some((p) => p.id === userName[2]))
        return {
          url: `https://www.threads.net${path}`,
          title: `${user.displayName} (@${userName[1]}) · Threads`,
          description: user.bio,
          kind: 'threads',
          service: 'threads',
        };
    }
    return {
      url: `https://www.threads.net${path}`,
      title: 'Not Found · Threads',
      description: 'User or post not found',
      kind: 'not-found',
      service: 'threads',
    };
  }
  return undefined;
}
export function canonicalWorldUrl(input: string) {
  const p = worldPage(input);
  return p && !['not-found', 'google', 'auth'].includes(p.kind) ? p.url : null;
}
export function searchWorld(input: string): WorldPage[] {
  const q = normalizeSearch(input);
  if (!q) return [];
  if (/(보존안내|archiveguide|공개기록|옛주소|자료주소)/.test(q))
    return [
      { url: CURRENT_RECORD_URL, title: '공개 기록 보존 안내 — PROJECT ROOT', description: 'PROJECT ROOT 공식 자료 · 2026-09-24 갱신', kind: 'official' },
      { url: 'https://example.invalid/archive-guide', title: 'Archive Guide — 개인 블로그', description: '동명이지만 PROJECT ROOT와 관련 없는 오래된 글.', kind: 'not-found' },
      { url: CHANGELOG_URL, title: 'seoha-y/archive-index · GitHub', description: '공개 자료 주소 변경 이력과 색인 관리.', kind: 'github' },
    ];
  const official = /(프로젝트|루트|project|root|공식사이트)/i.test(input)
    ? [worldPage(OFFICIAL_URL)!]
    : [];
  const query =
    Object.entries(fixture.google.queries).find(([key]) => normalizeSearch(key) === q)?.[1] ||
    Object.entries(fixture.google.queries).find(([key]) => q.includes(normalizeSearch(key)))?.[1] ||
    [];
  const mixed = query.map((item) => ({
    url: item.url,
    title: item.title,
    description: item.snippet,
    kind: 'not-found' as const,
  }));
  const other = q.includes('윤서하')
    ? [
        {
          url: 'https://events.example.invalid/open-records-2025',
          title: 'Open Records Meetup 2025',
          description: '지난 행사 참가자 및 발표 자료.',
          kind: 'not-found' as const,
        },
      ]
    : [];
  return [
    ...(mixed.length > 2 ? [mixed[2], ...mixed.slice(0, 2), ...mixed.slice(3)] : mixed),
    ...other,
    ...official,
  ];
}
