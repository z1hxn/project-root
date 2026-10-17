'use client';
import { useState } from 'react';
import {
  BriefcaseBusiness,
  FolderOpen,
  Lightbulb,
  BookOpen,
  UserRound,
  LogOut,
  Power,
  ArrowUpRight,
  Check,
  Play,
  ShieldCheck,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { useWorkspace } from '@/features/workspace/context';
import { AppIcon, RootIcon } from '@/components/desktop/AppIcon';
import { WorldBriefing } from '@/features/onboarding/WorldBriefing';
import { MissionCard, MissionHistory, MissionHints, MissionRecords } from './MissionPanel';
import { explorationMission } from '@/game/missions';
import { api } from '@/lib/api';
import type { UserProfile } from '@/types/user';
const sections = [
  { id: 'case', name: '임무', icon: BriefcaseBusiness },
  { id: 'records', name: '조사 자료', icon: FolderOpen },
  { id: 'hint', name: '힌트', icon: Lightbulb },
];
export function ProjectRoot() {
  const {
    profile,
    onProfile,
    openApp,
    sessionAction,
    fullscreenActive,
    toggleFullscreen,
    notify: workspaceNotify,
  } = useWorkspace();
  const notify = (message: string) => workspaceNotify(message, 'root');
  const [section, setSection] = useState('case');
  const [briefing, setBriefing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  async function complete() {
    const updated = await api<UserProfile>('/api/profile', 'PATCH', { briefingCompleted: true });
    onProfile(updated);
    setBriefing(false);
    if (!profile.briefingCompleted)
      notify(
        `Project Root · 새 임무: ${explorationMission.title}. ${explorationMission.description}`,
      );
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
            Project Root<small>조사 워크스페이스</small>
          </span>
        </div>
        <p className="root-nav-label">메뉴</p>
        <nav>
          {sections.map(({ id, name, icon: Icon }) => (
            <button
              key={id}
              className={section === id ? 'active' : ''}
              onClick={() => setSection(id)}
            >
              <Icon size={17} />
              {name}
            </button>
          ))}
        </nav>
        <div className="root-sidebar-bottom">
          <button onClick={() => void toggleFullscreen()} aria-pressed={fullscreenActive}>
            {fullscreenActive ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
            {fullscreenActive ? '전체 화면 종료' : '전체 화면으로 보기'}
          </button>
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
              <small>조사관 · 워크스테이션</small>
            </div>
            <i />
          </div>
        </div>
      </aside>
      <div className="root-main">
        <header className="root-toolbar">
          <span>
            {section === 'profile' ? '내 프로필' : current?.name}
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
                  <span className="root-overline">조사 워크스페이스</span>
                  <h1>내 임무</h1>
                  <p>진행 중인 조사와 이전에 제출한 판단을 한곳에서 확인하세요.</p>
                </div>
                <span className="root-status">
                  <i />
                  {profile.gameProgress.stage === 5 ? '조사 완료' : profile.gameProgress.pendingStage ? '다음 임무 준비 중' : '조사 진행 중'}
                </span>
              </div>
              <MissionCard />
              <MissionHistory />
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
                    {
                      id: 'editor',
                      title: '메모 남기기',
                      copy: 'KWrite에 관찰과 판단을 기록하세요.',
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
            </>
          ) : section === 'hint' ? (
            <MissionHints key={profile.gameProgress.stage} />
          ) : section === 'records' ? (
            <MissionRecords />
          ) : section === 'profile' ? (
            <>
              <span className="root-overline">내 계정</span>
              <h1>내 프로필</h1>
              <p className="root-description">PROJECT ROOT에서 사용하는 조사관 정보입니다.</p>
              <div className="root-profile-card">
                <div className="root-avatar">{profile.displayName.slice(0, 1).toUpperCase()}</div>
                <h2>{profile.displayName}</h2>
                <span>조사관</span>
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
          ) : null}
        </div>
        <footer className="root-footer">
          <span>PROJECT ROOT · 조사 워크스페이스</span>
          <span>
            연결됨 <i />
          </span>
        </footer>
      </div>
    </div>
  );
}
