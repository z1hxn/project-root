import { NextResponse } from 'next/server';
export function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try {
    const source = new URL(origin);
    // Next may normalize the internal URL to localhost; Host retains the public authority.
    const host = request.headers.get('host') || new URL(request.url).host;
    return (
      source.host === host &&
      ['http:', 'https:'].includes(source.protocol) &&
      source.origin === origin
    );
  } catch {
    return false;
  }
}
export const errorResponse = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status });
// Local MVP limit. Replace with a shared limiter before multi-instance deployment.
const attempts = new Map<string, { count: number; until: number }>();
export function rateLimited(key: string) {
  const now = Date.now();
  for (const [k, v] of attempts) if (v.until <= now) attempts.delete(k);
  const entry = attempts.get(key) ?? { count: 0, until: now + 60_000 };
  entry.count++;
  attempts.set(key, entry);
  return entry.count > 8;
}
