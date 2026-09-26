export const OFFICIAL_URL = 'https://projectroot.kro.kr';
export const PROFILE_URL = 'https://profile.root/seoha-yoon';
export const THREAD_URL = 'https://threads.root/t/archive-update';
export const worldPages = [
  {
    url: OFFICIAL_URL,
    title: 'PROJECT ROOT — 디지털 조사와 분석',
    description:
      '프로젝트 루트는 공개 정보와 허가된 기록을 바탕으로 사실을 연결하는 디지털 조사 조직입니다. 단체 소개, 조사 원칙과 협력 소식.',
    keywords: [
      '프로젝트루트',
      '프로젝트 루트',
      'project root',
      'projectroot',
      '루트',
      'root',
      '디지털 조사',
      '조사 조직',
      '공식사이트',
      '공식 사이트',
    ],
    kind: 'official',
  },
  {
    url: PROFILE_URL,
    title: '윤서하 — Profile',
    description: '해온 데이터 연구소 · 공개 데이터 아카이브 연구원. 경력, 활동 분야와 공개 계정.',
    keywords: [
      '윤서하',
      'seoha',
      'seoha_y',
      '해온',
      '해온 데이터 연구소',
      '연구원',
      '프로필',
      '공개 데이터',
    ],
    kind: 'profile',
  },
  {
    url: THREAD_URL,
    title: '공개 아카이브 색인 갱신 안내 — Threads',
    description:
      '공개 데이터 커뮤니티 · 해온 데이터 연구소 윤서하의 아카이브 갱신 소식과 기록 보존에 관한 논의.',
    keywords: ['윤서하', 'seoha', 'seoha_y', '해온', '공개 아카이브', '색인', '기록', '데이터'],
    kind: 'thread',
  },
] as const;
export function canonicalWorldUrl(input: string) {
  try {
    const url = new URL(input);
    if (!['http:', 'https:'].includes(url.protocol) || url.port || url.username || url.password)
      return null;
    const hostname =
      url.hostname === 'www.projectroot.kro.kr' ? 'projectroot.kro.kr' : url.hostname;
    const path = url.pathname.replace(/\/+$/, '');
    return worldPages.find((p) => p.url === `https://${hostname}${path}`)?.url || null;
  } catch {
    return null;
  }
}
export function worldPage(input: string) {
  const url = canonicalWorldUrl(input);
  return worldPages.find((p) => p.url === url);
}
export function normalizeSearch(input: string) {
  return input
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, '');
}
export function searchWorld(input: string) {
  const query = normalizeSearch(input);
  if (!query) return [];
  const terms = input
    .normalize('NFKC')
    .toLowerCase()
    .split(/\s+/)
    .map(normalizeSearch)
    .filter(Boolean);
  return worldPages
    .map((page) => {
      const keys = [page.title, page.url, ...page.keywords].map(normalizeSearch);
      const all = normalizeSearch([page.title, page.description, ...page.keywords].join(' '));
      const score = keys.some((k) => k === query)
        ? 100
        : keys.some((k) => k.includes(query))
          ? 60
          : terms.every((t) => all.includes(t))
            ? 30
            : 0;
      return { page, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.page);
}
