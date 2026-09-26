'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Brand } from '@/components/ui/Brand';
const slides = [
  { line: 'Every system leaves a trace.', sub: '모든 시스템은 흔적을 남긴다.' },
  {
    line: 'Every account. Every request.\nEvery mistake.',
    sub: '계정 하나, 요청 하나. 그리고 작은 실수까지.',
  },
  {
    line: 'Most people never notice them.\nYou will.',
    sub: '대부분은 그 흔적을 지나친다. 당신은 다를 것이다.',
  },
  {
    line: 'Your perspective matters.',
    sub: 'PROJECT ROOT의 조사 워크스테이션이 준비되었습니다.\n당신의 첫 번째 연결을 시작하세요.',
  },
];
export function Intro() {
  const [step, setStep] = useState(0);
  const router = useRouter();
  useEffect(() => {
    try {
      if (localStorage.getItem('root_intro_completed') === 'true') router.replace('/register');
    } catch {}
  }, [router]);
  const next = useCallback(() => {
    if (step < slides.length - 1) setStep((s) => s + 1);
    else {
      try {
        localStorage.setItem('root_intro_completed', 'true');
      } catch {}
      router.push('/register');
    }
  }, [step, router]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.key === 'Enter' &&
        !e.repeat &&
        !(e.target instanceof HTMLAnchorElement) &&
        !(e.target instanceof HTMLButtonElement)
      ) {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next]);
  return (
    <main className="intro-screen">
      <header className="site-header">
        <Link href="/">
          <Brand />
        </Link>
        <span className="eyebrow subtle">ORIENTATION / {String(step + 1).padStart(2, '0')}</span>
      </header>
      <section className="intro-content" key={step}>
        <span className="eyebrow">A DIFFERENT WAY TO SEE.</span>
        <h1>{slides[step].line}</h1>
        <p>{slides[step].sub}</p>
        <button className={step === 3 ? 'button primary' : 'continue-button'} onClick={next}>
          {step === 3 ? 'CREATE YOUR IDENTITY' : '계속하기'} <ArrowRight size={18} />
          {step < 3 && <kbd>ENTER ↵</kbd>}
        </button>
      </section>
      <footer className="intro-footer">
        <div className="step-indicator">
          {slides.map((_, i) => (
            <span key={i} className={i <= step ? 'active' : ''} />
          ))}
        </div>
        <span className="eyebrow subtle">PROJECT ROOT / GETTING STARTED</span>
      </footer>
    </main>
  );
}
