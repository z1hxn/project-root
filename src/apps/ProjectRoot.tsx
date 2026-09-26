'use client';
import { useState } from 'react';
import {
  BriefcaseBusiness,
  Network,
  KeyRound,
  Files,
  Lightbulb,
  BookOpen,
  UserRound,
  LogOut,
  Power,
  ArrowUpRight,
  Search,
  Radio,
  Check,
  Play,
  ShieldCheck,
} from 'lucide-react';
import { useWorkspace } from '@/features/workspace/context';
import { AppIcon, RootIcon } from '@/components/desktop/AppIcon';
import { WorldBriefing } from '@/features/onboarding/WorldBriefing';
import { api } from '@/lib/api';
import type { UserProfile } from '@/types/user';
const sections = [
  { id: 'case', name: '사건', label: 'CASE', icon: BriefcaseBusiness },
  { id: 'intel', name: '조사 정보', label: 'INTEL', icon: Network },
  { id: 'accounts', name: '발견한 계정', label: 'ACCOUNTS', icon: KeyRound },
  { id: 'evidence', name: '증거 보관함', label: 'EVIDENCE', icon: Files },
  { id: 'hint', name: '힌트', label: 'HINT', icon: Lightbulb },
];
export function ProjectRoot() {
  const { profile, onProfile, openApp, sessionAction } = useWorkspace();
  const [section, setSection] = useState('case');
  const [briefing, setBriefing] = useState(!profile.briefingCompleted);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  async function complete() {
    const updated = await api<UserProfile>('/api/profile', 'PATCH', { briefingCompleted: true });
    onProfile(updated);
    setBriefing(false);
  }
  async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setNotice('');
    try {
      onProfile(
        await api<UserProfile>('/api/profile', 'PATCH', {
          displayName: String(new FormData(e.currentTarget).get('displayName')),
        }),
      );
      setNotice('프로필을 저장했습니다.');
    } catch (e) {
      setNotice(e instanceof Error ? e.message : '저장 실패');
    } finally {
      setBusy(false);
    }
  }
  if (briefing)
    return (
      <WorldBriefing
        replay={profile.briefingCompleted}
        onClose={() => setBriefing(false)}
        onComplete={complete}
      />
    );
  const current = sections.find((s) => s.id === section);
  return (
    <div className="root-app">
      <aside className="root-sidebar">
        <div className="root-app-brand">
          <RootIcon size={31} />
          <span>
            Project Root<small>INVESTIGATION PLATFORM</small>
          </span>
        </div>
        <p className="root-nav-label">WORKSPACE</p>
        <nav>
          {sections.map(({ id, name, label, icon: Icon }) => (
            <button
              key={id}
              className={section === id ? 'active' : ''}
              onClick={() => setSection(id)}
            >
              <Icon size={17} />
              {name}
              <small>{label === 'CASE' ? '01' : ''}</small>
            </button>
          ))}
        </nav>
        <div className="root-sidebar-bottom">
          <button onClick={() => setBriefing(true)}>
            <BookOpen size={17} />
            세계관 안내
            <Play size={12} />
          </button>
          <button
            className={section === 'profile' ? 'active' : ''}
            onClick={() => setSection('profile')}
          >
            <UserRound size={17} />내 프로필
          </button>
          <div className="root-session-actions">
            <button onClick={() => sessionAction('logout')}>
              <LogOut size={15} />
              로그아웃
            </button>
            <button onClick={() => sessionAction('shutdown')}>
              <Power size={15} />
              종료
            </button>
          </div>
          <div className="root-profile-foot">
            <span>{profile.displayName.slice(0, 1).toUpperCase()}</span>
            <div>
              <strong>{profile.displayName}</strong>
              <small>Analyst · Workspace 01</small>
            </div>
            <i />
          </div>
        </div>
      </aside>
      <div className="root-main">
        <header className="root-toolbar">
          <span>
            {section === 'profile' ? '내 프로필' : current?.name}
            <span>/</span>
            {section === 'profile' ? 'ACCOUNT' : current?.label}
          </span>
          <span>
            <ShieldCheck size={14} /> 내부 워크스페이스
          </span>
        </header>
        <div className="root-scroll">
          {section === 'case' ? (
            <>
              <div className="root-page-heading">
                <div>
                  <span className="root-overline">GETTING STARTED</span>
                  <h1>환영합니다, {profile.displayName}님.</h1>
                  <p>모든 조사는 작은 연결에서 시작됩니다.</p>
                </div>
                <span className="root-status">
                  <i />
                  업무 준비 완료
                </span>
              </div>
              <div className="root-assignment">
                <div className="root-assignment-header">
                  <span>현재 배정된 사건</span>
                  <small>CASE 001</small>
                </div>
                <div className="root-assignment-body">
                  <Radio size={34} strokeWidth={1.4} />
                  <h2>새로운 사건을 기다리고 있습니다.</h2>
                  <p>
                    사건이 배정되면 목표와 관련 자료가 이곳에 표시됩니다.
                    <br />
                    그동안 도구를 익히고 당신의 워크스테이션을 준비하세요.
                  </p>
                  <span>AWAITING ASSIGNMENT</span>
                </div>
              </div>
              <h3 className="root-section-title">당신의 조사 도구</h3>
              <div className="root-tools">
                {(
                  [
                    {
                      id: 'browser',
                      title: '웹에서 찾기',
                      copy: 'Firefox로 공개된 기록을 살펴보세요.',
                    },
                    {
                      id: 'terminal',
                      title: '기록 읽기',
                      copy: 'Konsole에서 파일과 시스템을 탐색하세요.',
                    },
                    {
                      id: 'files',
                      title: '자료 정리하기',
                      copy: 'Dolphin에서 조사 자료를 관리하세요.',
                    },
                  ] as const
                ).map((a) => (
                  <button key={a.id} onClick={() => openApp(a.id)}>
                    <AppIcon id={a.id} size={32} />
                    <strong>{a.title}</strong>
                    <p>{a.copy}</p>
                    <ArrowUpRight size={15} />
                  </button>
                ))}
              </div>
              <button className="root-orientation-card" onClick={() => setBriefing(true)}>
                <BookOpen size={21} />
                <span>
                  <strong>PROJECT ROOT에 처음 오셨나요?</strong>
                  <small>세계관과 조사관의 역할을 다시 살펴보세요.</small>
                </span>
                <span>
                  안내 다시 보기 <ArrowUpRight size={15} />
                </span>
              </button>
            </>
          ) : section === 'profile' ? (
            <>
              <span className="root-overline">YOUR IDENTITY</span>
              <h1>내 프로필</h1>
              <p className="root-description">PROJECT ROOT에서 사용하는 조사관 정보입니다.</p>
              <div className="root-profile-card">
                <div className="root-avatar">{profile.displayName.slice(0, 1).toUpperCase()}</div>
                <h2>{profile.displayName}</h2>
                <span>ANALYST</span>
              </div>
              <form className="root-profile-form" onSubmit={saveProfile}>
                <label>
                  표시 이름
                  <input
                    name="displayName"
                    defaultValue={profile.displayName}
                    required
                    maxLength={32}
                  />
                </label>
                <label>
                  사용자명
                  <input value={profile.username} readOnly />
                </label>
                <label>
                  이메일
                  <input value={profile.email} readOnly />
                </label>
                <p>가입일 · {new Date(profile.createdAt).toLocaleDateString('ko-KR')}</p>
                {notice && <p role="status">{notice}</p>}
                <button className="root-btn primary-root" disabled={busy}>
                  {busy ? (
                    '저장 중…'
                  ) : (
                    <>
                      <Check size={15} />
                      프로필 저장
                    </>
                  )}
                </button>
              </form>
              <div className="root-session-card">
                <h3>워크스테이션 세션</h3>
                <p>
                  로그아웃하면 계정 연결이 해제됩니다. 종료하면 가상 워크스테이션의 전원을 끕니다.
                </p>
                <button className="root-btn" onClick={() => sessionAction('logout')}>
                  <LogOut size={15} />
                  로그아웃
                </button>
                <button className="root-btn" onClick={() => sessionAction('shutdown')}>
                  <Power size={15} />
                  워크스테이션 종료
                </button>
              </div>
            </>
          ) : (
            <>
              <span className="root-overline">{current?.label}</span>
              <h1>{current?.name}</h1>
              <div className="root-empty">
                <Search size={42} strokeWidth={1} />
                <h2>
                  {section === 'hint'
                    ? '첫 사건이 배정되면 안내가 제공됩니다.'
                    : '아직 수집된 정보가 없습니다.'}
                </h2>
                <p>
                  조사 중 발견한{' '}
                  {section === 'intel'
                    ? '인물과 도메인, 기록'
                    : section === 'accounts'
                      ? '게임 속 계정 정보'
                      : section === 'evidence'
                        ? '문서와 로그'
                        : '단서에 따라 단계별 힌트'}
                  가 이곳에 모입니다.
                </p>
                <small>AWAITING ASSIGNMENT</small>
              </div>
            </>
          )}
        </div>
        <footer className="root-footer">
          <span>PROJECT ROOT · INTERNAL</span>
          <span>
            연결됨 <i />
          </span>
        </footer>
      </div>
    </div>
  );
}
