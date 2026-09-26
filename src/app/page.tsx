import Link from 'next/link';
import { ArrowRight, Globe2, Fingerprint, Layers3, Terminal } from 'lucide-react';
import { Brand, Mark } from '@/components/ui/Brand';
import { currentUser } from '@/server/auth';
export default async function Landing() {
  const user = await currentUser();
  return (
    <main className="landing">
      <header className="site-header">
        <Link href="/" aria-label="PROJECT ROOT 홈">
          <Brand />
        </Link>
        <div className="header-right">
          <span className="eyebrow subtle">A BROWSER-BASED CYBER MYSTERY</span>
          <Link href={user ? '/game' : '/login'} className="text-link">
            {user ? `${user.displayName} · 워크스테이션` : '로그인'} <ArrowRight size={15} />
          </Link>
        </div>
      </header>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="status-dot" /> A NEW PERSPECTIVE ON WHAT REMAINS
          </p>
          <h1>
            TRACE THE
            <br />
            SIGNAL.
            <br />
            <span>FIND THE ROOT.</span>
          </h1>
          <p className="hero-description">
            모든 시스템은 흔적을 남긴다.
            <br />
            웹과 기록, 그 사이에 숨겨진 연결을 따라
            <br className="desktop-break" /> 사건의 근원을 찾아가는 사이버 미스터리.
          </p>
          <Link className="button primary hero-cta" href={user ? '/game' : '/intro'}>
            {user ? '워크스테이션 켜기' : '시작하기'} <ArrowRight size={18} />
          </Link>
          <span className="cta-note">당신의 브라우저가 워크스테이션이 됩니다.</span>
        </div>
        <div className="signal-art" aria-hidden="true">
          <div className="art-grid" />
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="orbit orbit-three" />
          <div className="axis axis-x" />
          <div className="axis axis-y" />
          <div className="orbit-label label-top">SIGNAL ORIGIN / UNKNOWN</div>
          <div className="signal-core">
            <Mark />
            <span>ROOT</span>
          </div>
          <div className="signal-point point-one" />
          <div className="signal-point point-two" />
          <div className="signal-note">
            <span>01 / CONNECTION ESTABLISHED</span>
            <strong>Every trace has a beginning.</strong>
            <div className="signal-bars">
              {Array.from({ length: 36 }, (_, i) => (
                <i key={i} style={{ height: `${8 + ((i * 17 + 13) % 30)}px` }} />
              ))}
            </div>
          </div>
          <span className="art-coordinate">37.5665° N — 126.9780° E</span>
        </div>
      </section>
      <section className="feature-strip" aria-label="게임 소개">
        {[
          {
            icon: Globe2,
            n: '01',
            title: 'Explore the web',
            copy: '웹과 공개 기록 속에 남겨진 단서를 탐색하세요.',
          },
          {
            icon: Terminal,
            n: '02',
            title: 'Follow the traces',
            copy: '가상 Linux 워크스테이션에서 시스템의 흔적을 읽으세요.',
          },
          {
            icon: Layers3,
            n: '03',
            title: 'Connect the evidence',
            copy: '흩어진 정보를 연결하고 사건의 근원에 다가가세요.',
          },
        ].map(({ icon: Icon, n, title, copy }) => (
          <article key={n}>
            <span className="feature-number">{n}</span>
            <Icon size={21} />
            <h2>{title}</h2>
            <p>{copy}</p>
          </article>
        ))}
      </section>
      <footer className="site-footer">
        <span>
          <Fingerprint size={14} /> PROJECT ROOT / INTERACTIVE FICTION
        </span>
        <span>THE ANSWERS ARE IN THE DETAILS.</span>
        <span>ENTRY BUILD — 0.1</span>
      </footer>
    </main>
  );
}
