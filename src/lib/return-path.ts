export function safeReturnPath(value: unknown, fallback = '/') {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.includes('\\'))
    return fallback;
  try {
    const parsed = new URL(value, 'https://project-root.invalid');
    return parsed.origin === 'https://project-root.invalid' ? `${parsed.pathname}${parsed.search}${parsed.hash}` : fallback;
  } catch {
    return fallback;
  }
}

export function authPath(mode: 'login' | 'register', next = '/') {
  return next === '/' ? `/${mode}` : `/${mode}?next=${encodeURIComponent(next)}`;
}
