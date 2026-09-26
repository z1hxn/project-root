'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Eye, EyeOff, Power, UserRound } from 'lucide-react';
import { PlasmaLogo } from '@/components/desktop/AppIcon';
import { wallpapers } from '@/lib/os-settings';
import { api } from '@/lib/api';
import type { UserProfile } from '@/types/user';
export function OSLogin({ profile, onUnlock }: { profile: UserProfile; onUnlock: () => void }) {
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const wallpaper = wallpapers.find((w) => w.id === profile.osSettings.wallpaper);
  async function login(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api('/api/auth/unlock', 'POST', { password });
      setPassword('');
      onUnlock();
    } catch (e) {
      setError(e instanceof Error ? e.message : '로그인하지 못했습니다.');
      setBusy(false);
    }
  }
  return (
    <main
      className="sddm-login"
      aria-label="OS 로그인"
      style={{
        backgroundImage: wallpaper?.image ? `url(${wallpaper.image})` : undefined,
        backgroundColor: profile.osSettings.backgroundColor,
      }}
    >
      <header>
        <PlasmaLogo size={24} /> Plasma <span>Debian GNU/Linux</span>
      </header>
      <form onSubmit={login}>
        <div className="sddm-avatar">
          <UserRound size={62} strokeWidth={1.3} />
        </div>
        <h1>{profile.displayName}</h1>
        <p>{profile.username}</p>
        <div className="sddm-password">
          <input
            aria-label="OS 로그인 비밀번호"
            aria-describedby="os-password-hint"
            type={show ? 'text' : 'password'}
            autoComplete="current-password"
            autoFocus
            required
            maxLength={128}
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            aria-label={show ? '비밀번호 숨기기' : '비밀번호 표시'}
            onClick={() => setShow(!show)}
          >
            {show ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
          <button disabled={busy} aria-label="OS 로그인" type="submit">
            <ArrowRight size={20} />
          </button>
        </div>
        <small id="os-password-hint">Project Root 계정 비밀번호를 입력하세요.</small>
        {error && (
          <p className="sddm-error" role="alert">
            {error}
          </p>
        )}
        {busy && <p role="status">로그인 중…</p>}
      </form>
      <footer>
        <span>데스크톱 세션: Plasma</span>
        <Link href="/">
          <Power size={17} /> 종료
        </Link>
      </footer>
    </main>
  );
}
