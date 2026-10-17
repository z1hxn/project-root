'use client';
import Link from 'next/link';
import { ArrowRight, Power, UserRound } from 'lucide-react';
import { PlasmaLogo } from '@/components/desktop/AppIcon';
import { wallpapers } from '@/lib/os-settings';
import type { UserProfile } from '@/types/user';

export function OSLogin({ profile, onUnlock }: { profile: UserProfile; onUnlock: () => void }) {
  const wallpaper = wallpapers.find((w) => w.id === profile.osSettings.wallpaper);
  return <main className="sddm-login" aria-label="OS 로그인" style={{ backgroundImage: wallpaper?.image ? `url(${wallpaper.image})` : undefined, backgroundColor: profile.osSettings.backgroundColor }}>
    <header><PlasmaLogo size={24} /> Plasma <span>Debian GNU/Linux</span></header>
    <section className="sddm-entry" aria-labelledby="sddm-name">
      <div className="sddm-avatar"><UserRound size={62} strokeWidth={1.3} /></div>
      <h1 id="sddm-name">{profile.displayName}</h1>
      <p>{profile.username}</p>
      <button className="sddm-enter" type="button" onClick={onUnlock}>워크스테이션 열기 <ArrowRight size={19} /></button>
      <small>PROJECT ROOT 계정으로 연결되었습니다.</small>
    </section>
    <footer><span>데스크톱 세션: Plasma</span><Link href="/"><Power size={17} /> 종료</Link></footer>
  </main>;
}
