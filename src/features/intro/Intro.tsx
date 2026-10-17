'use client';
import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, FileSearch, LockKeyhole, Mail, Monitor, ShieldCheck } from 'lucide-react';
import { Brand } from '@/components/ui/Brand';
import { api } from '@/lib/api';
import type { UserProfile } from '@/types/user';

const scenes = [
  {
    label: '초대',
    title: 'PROJECT ROOT에\n오신 것을 환영합니다.',
    text: '당신은 지금부터 PROJECT ROOT의 새로운 조사관으로 활동합니다. 이 안내를 마치면 개인 워크스테이션이 준비됩니다.',
    icon: Mail,
  },
  {
    label: '조직 소개',
    title: '우리는 남겨진\n기록을 읽습니다.',
    text: 'PROJECT ROOT는 디지털 공간에 남은 정보와 기록을 수집하고 분석하는 조사 조직입니다. 공개 자료와 허가된 시스템의 기록을 대조해 드러나지 않은 사실을 확인합니다.',
    icon: FileSearch,
  },
  {
    label: '조사관의 역할',
    title: '이제 당신의\n조사가 시작됩니다.',
    text: '개인 워크스테이션에서 웹사이트를 탐색하고, 메일과 문서를 읽고, 서로 다른 자료를 비교하게 됩니다. 확인한 사실과 판단을 구분해 사건 보고서에 남겨 주세요.',
    icon: Monitor,
  },
  {
    label: '접근 안내',
    title: '한 가지 안내\n사항이 있습니다.',
    text: '일부 내부 기록은 현재 접근이 제한되어 있습니다. 해당 자료는 초기 조사 대상에 포함되지 않습니다.',
    icon: LockKeyhole,
  },
  {
    label: '워크스테이션 연결',
    title: '접속 준비가\n완료되었습니다.',
    text: '워크스테이션을 둘러보며 조사 도구를 익히세요. Firefox에서 PROJECT ROOT 공식 사이트를 확인하면 첫 조사 사건이 배정됩니다.',
    icon: ShieldCheck,
  },
] as const;

const connectionMessages = [
  '워크스테이션을 준비하고 있습니다.',
  '사용자 환경을 불러오는 중…',
  '접속 준비가 완료되었습니다.',
];
const delay = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

export function Intro({ displayName, replay = false }: { displayName: string; replay?: boolean }) {
  const [step, setStep] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectionStep, setConnectionStep] = useState(0);
  const [error, setError] = useState('');

  const complete = useCallback(async () => {
    if (connecting) return;
    setConnecting(true);
    setConnectionStep(0);
    setError('');
    try {
      if (!replay) await api<UserProfile>('/api/profile', 'PATCH', { introCompleted: true, briefingCompleted: true });
      setConnectionStep(1);
      await delay(650);
      setConnectionStep(2);
      await delay(750);
      window.location.replace('/game');
    } catch (e) {
      setError(e instanceof Error ? e.message : '진입 상태를 저장하지 못했습니다. 다시 시도해 주세요.');
      setConnecting(false);
    }
  }, [connecting, replay]);

  const next = useCallback(() => {
    if (connecting) return;
    if (step === 3 && !revealed) {
      setRevealed(true);
      return;
    }
    if (step < scenes.length - 1) {
      setStep((current) => current + 1);
      setRevealed(false);
    } else void complete();
  }, [step, revealed, connecting, complete]);

  useEffect(() => {
    if (connecting || step === scenes.length - 1) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (step === 3) {
      const revealTimer = window.setTimeout(() => setRevealed(true), 3900);
      const advanceTimer = window.setTimeout(() => setStep(4), 8700);
      return () => { window.clearTimeout(revealTimer); window.clearTimeout(advanceTimer); };
    }
    const timer = window.setTimeout(() => setStep((current) => current + 1), 5500);
    return () => window.clearTimeout(timer);
  }, [step, connecting]);

  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLButtonElement || event.target instanceof HTMLAnchorElement) return;
      if (event.key === 'Escape') { event.preventDefault(); void complete(); }
      else if (event.key === 'ArrowLeft' && !connecting) {
        event.preventDefault();
        setStep((current) => Math.max(0, current - 1));
        setRevealed(false);
      } else if (event.key === 'ArrowRight' || event.key === 'Enter') { event.preventDefault(); next(); }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [next, complete, connecting]);

  const scene = scenes[step];
  const Icon = scene.icon;
  return <main className={`story-intro ${connecting ? 'story-connecting' : ''}`} aria-label={replay ? '조사관 인트로 다시 보기' : '신규 조사관 인트로'}>
    <header className="story-header"><Brand /><button type="button" onClick={() => void complete()} disabled={connecting}>인트로 건너뛰기 <ArrowRight size={15} /></button></header>
    <div className="story-stage">
      <div className="story-copy" key={step} aria-live="polite">
        <span className="story-chapter">{String(step + 1).padStart(2, '0')} / {String(scenes.length).padStart(2, '0')} · {scene.label}</span>
        <h1>{scene.title}</h1>
        <p>{scene.text}</p>
        {step === 0 && <span className="story-name">{displayName} 조사관 · {replay ? '인트로 다시 보기' : '신규 합류'}</span>}
        {step === 3 && revealed && <p className="story-unknown">…그런데 이 기록은 왜 당신의 워크스테이션에 남아 있을까요?</p>}
      </div>
      <div className={`story-artifact story-artifact-${step}`} key={`artifact-${step}`} aria-hidden="true">
        <div className="story-artifact-bar"><span><Icon size={16} /> {['신규 조사관 안내', '조직 소개 자료', '개인 워크스테이션', '접근 권한 안내', '접속 준비'][step]}</span><i /><i /><i /></div>
        {step === 0 && <div className="story-artifact-content"><small>PROJECT ROOT · 신규 조사관 안내</small><strong>합류를 환영합니다.</strong><p>배정된 계정: {displayName}<br />역할: 디지털 기록 조사관</p><span className="artifact-signature">조사에 필요한 환경은 곧 제공됩니다.</span></div>}
        {step === 1 && <div className="story-artifact-content"><small>우리가 하는 일</small><div className="artifact-source"><span>01</span><strong>공개 자료 확인</strong></div><div className="artifact-source"><span>02</span><strong>시스템 기록 분석</strong></div><div className="artifact-source"><span>03</span><strong>서로 다른 출처 대조</strong></div><p>확인 가능한 기록을 바탕으로 사실을 설명합니다.</p></div>}
        {step === 2 && <div className="story-artifact-content"><small>조사관 계정 · 사용 권한 활성화</small><strong>당신의 조사 도구</strong><div className="artifact-tools"><span>메일</span><span>웹 탐색</span><span>자료 보관</span><span>기록 분석</span></div><p>자료를 열어 보고, 근거를 모아 보고서를 작성하세요.</p></div>}
        {step === 3 && <div className="story-artifact-content"><small>내부 안내 · 접근 권한</small><div className="artifact-restriction"><LockKeyhole size={23} /><strong>일부 기록 접근 제한</strong><p>현재 조사 범위에 포함되지 않습니다.</p></div>{revealed && <div className="artifact-unknown">발신자 정보 없음<br /><strong>이 기록은 왜 남아 있을까요?</strong></div>}</div>}
        {step === 4 && <div className="story-artifact-content artifact-workstation"><Monitor size={60} strokeWidth={1.25} /><strong>워크스테이션 연결 대기</strong><p>계정 확인 · 사용자 환경 · 조사 공간</p></div>}
      </div>
    </div>
    {connecting && <div className="story-transition" role="status"><Monitor size={32} /><strong>{connectionMessages[connectionStep]}</strong><span>곧 Plasma 로그인 화면으로 연결됩니다.</span><div className="connection-progress"><span style={{ width: `${((connectionStep + 1) / connectionMessages.length) * 100}%` }} /></div></div>}
    <footer className="story-footer"><div className="story-progress" aria-label={`인트로 ${step + 1}단계 / ${scenes.length}단계`}>{scenes.map((_, index) => <button key={index} aria-label={`${index + 1}번째 장면`} aria-current={step === index ? 'step' : undefined} onClick={() => { setStep(index); setRevealed(false); }} disabled={connecting}><span className={index <= step ? 'filled' : ''} /></button>)}</div><div className="story-controls">{step > 0 && <button type="button" disabled={connecting} onClick={() => { setStep((current) => current - 1); setRevealed(false); }}><ArrowLeft size={17} /> 이전</button>}<button type="button" className="story-next" disabled={connecting} onClick={next}>{step === scenes.length - 1 ? '워크스테이션 연결' : step === 3 && !revealed ? '안내 계속 읽기' : '다음 장면'} <ArrowRight size={18} /></button></div></footer>
    {error && <p className="story-error" role="alert">{error}</p>}
  </main>;
}
