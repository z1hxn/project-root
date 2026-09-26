'use client';
import { useState } from 'react';
import { ArrowLeft, ArrowRight, Globe2, Network, Monitor, Search, Check } from 'lucide-react';
import { RootIcon } from '@/components/desktop/AppIcon';
const chapters = [
  {
    label: '01 / THE WORLD',
    icon: Globe2,
    title: '지워진 것에도 흔적은 남습니다.',
    text: '사람과 기업, 그리고 수많은 서비스가 연결된 세계. 사건은 화면 밖에서 일어나지만, 그 흔적은 이메일과 웹페이지, 계정과 서버의 기록 속에 남습니다.',
    detail: '당신은 그 기록을 읽고, 서로 관계없어 보이는 정보를 연결하는 조사관입니다.',
  },
  {
    label: '02 / PROJECT ROOT',
    icon: Network,
    title: '당신의 관점이 필요한 곳.',
    text: 'PROJECT ROOT는 디지털 흔적을 분석하는 조사 조직입니다. 당신은 새로 합류한 분석가로서 사건을 배정받고, 공개 정보와 허가된 시스템을 조사하게 됩니다.',
    detail: '누가, 언제, 어디에서. 그리고 왜. 가정과 사실을 구분하고, 증거로 설명하세요.',
  },
  {
    label: '03 / YOUR WORKSTATION',
    icon: Monitor,
    title: '업무에 필요한 도구는 여기 있습니다.',
    text: '지급된 Debian 워크스테이션에서 Firefox로 웹을 탐색하고, Konsole로 기록을 읽고, Dolphin으로 자료를 관리하세요. KMail에는 동료의 연락과 사건 안내가 도착합니다.',
    detail:
      'Project Root 앱은 사건의 목표, 수집한 정보와 증거를 한곳에 모읍니다. 내 프로필과 세션 종료도 이곳에서 관리합니다.',
  },
  {
    label: '04 / YOUR FIRST STEP',
    icon: Search,
    title: '정답보다, 연결을 찾으세요.',
    text: '사건은 무엇을 조사해야 하는지 알려줍니다. 어떤 경로로 답에 도달할지는 당신에게 달려 있습니다. 작은 사용자명 하나, 오래된 문서 한 줄이 다음 단서가 될 수 있습니다.',
    detail:
      '아직 첫 사건은 배정되지 않았습니다. 그동안 워크스테이션을 익혀 두세요. 이 안내는 Project Root의 “세계관 안내”에서 다시 볼 수 있습니다.',
  },
];
export function WorldBriefing({
  onComplete,
  onClose,
  replay = false,
}: {
  onComplete: () => Promise<void>;
  onClose?: () => void;
  replay?: boolean;
}) {
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const chapter = chapters[step];
  const Icon = chapter.icon;
  async function next() {
    if (step < chapters.length - 1) {
      setStep(step + 1);
      return;
    }
    setBusy(true);
    try {
      await onComplete();
    } catch {
      setError('안내 완료 상태를 저장하지 못했습니다. 다시 시도해 주세요.');
      setBusy(false);
    }
  }
  return (
    <section className="root-briefing" aria-label="세계관 안내">
      <header>
        <span>
          <RootIcon size={28} /> PROJECT ROOT
        </span>
        <small>NEW ANALYST ORIENTATION</small>
      </header>
      <div className="briefing-scene">
        <div className="briefing-orbit" />
        <Icon size={64} strokeWidth={1} />
        <span>{chapter.label}</span>
      </div>
      <div className="briefing-copy" key={step}>
        <span className="root-overline">{chapter.label}</span>
        <h1>{chapter.title}</h1>
        <p>{chapter.text}</p>
        <p>{chapter.detail}</p>
      </div>
      {error && (
        <p className="native-error" role="alert">
          {error}
        </p>
      )}
      <footer>
        <div className="briefing-progress">
          {chapters.map((_, i) => (
            <span key={i} className={i <= step ? 'active' : ''} />
          ))}
        </div>
        <div>
          {replay && onClose && (
            <button className="root-btn subtle-btn" onClick={onClose}>
              닫기
            </button>
          )}
          {step > 0 && (
            <button className="root-btn" onClick={() => setStep(step - 1)}>
              <ArrowLeft size={15} />
              이전
            </button>
          )}
          <button className="root-btn primary-root" disabled={busy} onClick={next}>
            {busy ? '저장 중…' : step === chapters.length - 1 ? '안내 마치기' : '계속'}
            {step === chapters.length - 1 ? <Check size={16} /> : <ArrowRight size={16} />}
          </button>
        </div>
      </footer>
    </section>
  );
}
