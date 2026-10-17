'use client';
import { useEffect, useState } from 'react';
import { Desktop } from '@/components/desktop/Desktop';
import { PlasmaLogo } from '@/components/desktop/AppIcon';
import { OSLogin } from './OSLogin';
import type { UserProfile } from '@/types/user';

export const BOOT_STEP_MS = 700;
const messages = [
  '워크스테이션 연결 중…',
  '사용자 환경을 불러오는 중…',
  'Plasma 데스크톱을 시작하는 중…',
  '조사 공간을 준비하는 중…',
];

export function Workstation({ initialProfile }: { initialProfile: UserProfile }) {
  const [profile, setProfile] = useState(initialProfile);
  const [phase, setPhase] = useState<'boot' | 'login' | 'desktop'>('boot');
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (phase !== 'boot') return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = setInterval(() => setStep((current) => current + 1), reduced ? 180 : BOOT_STEP_MS);
    return () => clearInterval(timer);
  }, [phase]);
  useEffect(() => {
    if (phase === 'boot' && step >= messages.length) setPhase('login');
  }, [step, phase]);
  if (phase === 'login') return <OSLogin profile={profile} onUnlock={() => setPhase('desktop')} />;
  if (phase === 'desktop') return <Desktop profile={profile} onProfile={setProfile} onRestart={() => { setStep(0); setPhase('boot'); }} />;
  return <main className="plasma-splash" aria-label="워크스테이션 부팅">
    <div className="splash-brand"><PlasmaLogo size={94} /><h1>Plasma</h1><div className="splash-spinner" /><p role="status">{messages[Math.min(step, messages.length - 1)]}</p></div>
    <footer><span>Debian GNU/Linux</span><small>KDE Plasma Desktop</small></footer>
  </main>;
}
