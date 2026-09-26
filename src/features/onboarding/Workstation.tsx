'use client';
import { useEffect, useState } from 'react';
import { Check, ArrowRight, LoaderCircle, Monitor } from 'lucide-react';
import { Desktop } from '@/components/desktop/Desktop';
import { PlasmaLogo } from '@/components/desktop/AppIcon';
import { OSLogin } from './OSLogin';
import { api } from '@/lib/api';
import type { UserProfile } from '@/types/user';
export const BOOT_STEP_MS = 700;
const messages = [
  'Starting Debian GNU/Linux…',
  'Loading user session…',
  'Starting Plasma desktop…',
  'Restoring your workspace…',
];
export function Workstation({ initialProfile }: { initialProfile: UserProfile }) {
  const [profile, setProfile] = useState(initialProfile);
  const [phase, setPhase] = useState<'boot' | 'login' | 'setup' | 'desktop'>('boot');
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (phase !== 'boot') return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = setInterval(() => setStep((s) => s + 1), reduced ? 180 : BOOT_STEP_MS);
    return () => clearInterval(timer);
  }, [phase]);
  useEffect(() => {
    if (phase === 'boot' && step >= messages.length) setPhase('login');
  }, [step, phase, profile.setupCompleted]);
  async function setup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const updated = await api<UserProfile>('/api/profile', 'PATCH', {
        displayName: String(new FormData(e.currentTarget).get('displayName')),
        setupCompleted: true,
      });
      setProfile(updated);
      setPhase('desktop');
    } catch (e) {
      setError(e instanceof Error ? e.message : '설정 저장 실패');
    } finally {
      setBusy(false);
    }
  }
  if (phase === 'login')
    return (
      <OSLogin
        profile={profile}
        onUnlock={() => setPhase(profile.setupCompleted ? 'desktop' : 'setup')}
      />
    );
  if (phase === 'desktop')
    return (
      <Desktop
        profile={profile}
        onProfile={setProfile}
        onRestart={() => {
          setStep(0);
          setPhase('boot');
        }}
      />
    );
  if (phase === 'boot')
    return (
      <main className="plasma-splash" aria-label="워크스테이션 부팅">
        <div className="splash-brand">
          <PlasmaLogo size={94} />
          <h1>Plasma</h1>
          <div className="splash-spinner" />
          <p role="status">{messages[Math.min(step, messages.length - 1)]}</p>
        </div>
        <footer>
          <span>Debian GNU/Linux</span>
          <small>KDE Plasma Desktop</small>
        </footer>
      </main>
    );
  return (
    <main className="plasma-setup">
      <section>
        <aside>
          <PlasmaLogo size={66} />
          <h1>환영합니다.</h1>
          <p>
            당신의 새 워크스테이션이
            <br />
            준비되었습니다.
          </p>
          <ol>
            <li className="done">
              <Check size={15} />
              계정 연결
            </li>
            <li className="active">워크스테이션 준비</li>
            <li>Project Root 안내</li>
          </ol>
          <small>Debian GNU/Linux · KDE Plasma</small>
        </aside>
        <div>
          <span className="setup-overline">WORKSTATION SETUP</span>
          <h2>당신의 자리를 확인하세요.</h2>
          <p>
            가입한 계정으로 이 워크스테이션을 사용합니다.
            <br />
            시작 후 PROJECT ROOT와 조사관의 역할을 안내해 드립니다.
          </p>
          <dl>
            <dt>사용자명</dt>
            <dd>{profile.username}</dd>
            <dt>이메일</dt>
            <dd>{profile.email}</dd>
            <dt>홈 디렉터리</dt>
            <dd>/home/{profile.username}</dd>
          </dl>
          <form onSubmit={setup}>
            <label>
              표시 이름
              <input
                name="displayName"
                aria-label="표시 이름"
                defaultValue={profile.displayName}
                required
                maxLength={32}
              />
            </label>
            {error && <p role="alert">{error}</p>}
            <button disabled={busy}>
              {busy ? (
                <LoaderCircle size={17} className="spin" />
              ) : (
                <>
                  워크스테이션 시작
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
