import { readProgress } from '@/game/missions';
import { readOSSettings } from '@/lib/os-settings';
import { createHash, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import type { User } from '@prisma/client';
import { db } from './db';
import type { UserProfile } from '@/types/user';
const COOKIE = 'root_session';
export const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');
export async function createSession(userId: string) {
  const token = randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14);
  await db.session.create({ data: { userId, tokenHash: tokenHash(token), expiresAt: expires } });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires,
  });
}
export async function currentUser() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { tokenHash: tokenHash(token) },
    include: { user: true },
  });
  return session && session.expiresAt > new Date() ? session.user : null;
}
export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { tokenHash: tokenHash(token) } });
  cookieStore.delete(COOKIE);
}
export function publicProfile(user: User): UserProfile {
  return {
    gameProgress: readProgress(user.gameProgress),
    osSettings: readOSSettings(user.osSettings),
    briefingCompleted: user.briefingCompleted,
    username: user.username,
    email: user.email,
    displayName: user.displayName,
    setupCompleted: user.setupCompleted,
    introCompleted: user.introCompleted,
    wallpaper: user.wallpaper,
    createdAt: user.createdAt.toISOString(),
  };
}
