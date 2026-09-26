'use client';
import { useState } from 'react';
import { Compass, Check, ArrowUpRight, History, RotateCcw } from 'lucide-react';
import { useWorkspace } from '@/features/workspace/context';
import { explorationMission, investigationMission } from '@/game/missions';
import { OFFICIAL_URL, PROFILE_URL, THREAD_URL } from '@/game/world';
import { NativeDialog } from '@/components/ui/Native';
export function MissionCard() {
  const { profile, openApp, submitReport } = useWorkspace();
  const stage = profile.gameProgress.stage;
  const mission = stage === 0 ? explorationMission : investigationMission;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function report(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setBusy(true);
    setError('');
    try {
      await submitReport(String(data.get('handle')), [
        String(data.get('source1')),
        String(data.get('source2')),
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : '보고서 제출 실패');
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      className={`root-assignment assigned-mission ${stage === 2 ? 'mission-completed' : ''}`}
      aria-label="현재 임무"
    >
      <div className="root-assignment-header">
        <span>
          <span className="mission-live-dot" />
          {stage === 2 ? '조사 완료' : '현재 배정된 임무'}
        </span>
        <small>{mission.code}</small>
      </div>
      <div className="mission-content">
        <div className="mission-emblem">
          {stage === 2 ? <Check size={38} /> : <Compass size={38} strokeWidth={1.5} />}
        </div>
        <div className="mission-copy">
          <span className="mission-tag">
            {stage === 2
              ? '보고서 승인 완료'
              : `배정 완료 · ${stage === 0 ? '첫' : '두'} 번째 임무`}
          </span>
          <h2>{mission.title}</h2>
          <p>
            {stage === 2
              ? '서로 다른 공개 기록에서 동일한 인물과 계정을 확인했습니다. 확인 가능한 두 출처를 남긴 조사 보고서가 승인되었습니다.'
              : mission.description}
          </p>
        </div>
      </div>
      <div className="mission-objective">
        <strong>{stage === 2 ? '확인된 사실' : '지금 할 일'}</strong>
        <p>{stage === 2 ? '윤서하 · 해온 데이터 연구소 · 공개 계정 seoha_y' : mission.objective}</p>
        {stage === 0 && (
          <small className="mission-next-clue">
            Firefox에서 프로젝트 루트 공식 사이트({OFFICIAL_URL.replace('https://', '')})를
            방문하세요. Index에서 “프로젝트루트”로 검색해도 찾을 수 있습니다.
          </small>
        )}
      </div>
      {stage === 1 && (
        <form className="mission-report" onSubmit={report}>
          <h3>조사 보고서</h3>
          <p>같은 사람의 활동임을 뒷받침하는 공개 계정과 두 출처를 제출하세요.</p>
          <label>
            공개 사용자명
            <input
              name="handle"
              aria-label="조사한 공개 사용자명"
              required
              maxLength={80}
              placeholder="이름이 아닌 사용자명"
            />
          </label>
          <label>
            첫 번째 출처
            <input name="source1" aria-label="첫 번째 조사 출처" required placeholder="https://…" />
          </label>
          <label>
            두 번째 출처
            <input name="source2" aria-label="두 번째 조사 출처" required placeholder="https://…" />
          </label>
          {error && <p role="alert">{error}</p>}
          <button className="root-btn" disabled={busy}>
            {busy ? '검증 중…' : '조사 보고서 제출'}
          </button>
        </form>
      )}
      <footer className="mission-actions">
        <span>
          <span className="mission-live-dot" />
          {stage === 2 ? '완료 · 다음 임무 대기' : mission.status}
        </span>
        {stage !== 2 && (
          <button onClick={() => openApp(stage === 0 ? 'files' : 'browser')}>
            {stage === 0 ? '컴퓨터 탐색하기' : 'Firefox에서 조사하기'}
            <ArrowUpRight size={16} />
          </button>
        )}
      </footer>
    </section>
  );
}
export function MissionHistory() {
  const { profile, rollbackMission } = useWorkspace();
  const progress = profile.gameProgress;
  const [target, setTarget] = useState<0 | 1 | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <>
      <span className="root-overline">MISSION HISTORY</span>
      <h1>임무 이력</h1>
      <p className="root-description">배정된 임무를 확인하고 원하는 시점에서 다시 조사하세요.</p>
      <div className="mission-history">
        {[explorationMission, ...(progress.highestStage >= 1 ? [investigationMission] : [])].map(
          (mission, i) => (
            <article key={mission.id}>
              <div>
                <History size={20} />
                <small>{mission.code}</small>
                <span>
                  {progress.stage === i
                    ? '현재 진행 중'
                    : progress.stage > i
                      ? '완료'
                      : progress.highestStage > i
                        ? '이전에 완료'
                        : '이전에 배정'}
                </span>
              </div>
              <h2>{mission.title}</h2>
              <p>{mission.description}</p>
              <button
                className="root-btn"
                aria-label={`${mission.code}로 돌아가기`}
                onClick={() => {
                  setTarget(i as 0 | 1);
                  setError('');
                }}
              >
                <RotateCcw size={15} />이 임무로 돌아가기
              </button>
            </article>
          ),
        )}
      </div>
      {target !== null && (
        <NativeDialog
          title="이전 임무로 돌아가기"
          onClose={() => {
            if (!busy) setTarget(null);
          }}
        >
          <div className="kwrite-dialog-body">
            <p>
              <strong>
                {target === 0 ? explorationMission.title : investigationMission.title}
              </strong>
              부터 다시 진행합니다.
            </p>
            <p>
              현재 진행 및 보고서 승인 상태를 되돌리고 조사 페이지 방문 기록을 초기화합니다. 임무
              이력, 개인 파일·메모와 브라우저 방문 기록은 유지됩니다.
            </p>
            {error && <p role="alert">{error}</p>}
          </div>
          <footer>
            <button className="native-button" disabled={busy} onClick={() => setTarget(null)}>
              취소
            </button>
            <button
              className="native-button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await rollbackMission(target);
                  setTarget(null);
                } catch (e) {
                  setError(e instanceof Error ? e.message : '되돌리기 실패');
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? '되돌리는 중…' : '임무 되돌리기'}
            </button>
          </footer>
        </NativeDialog>
      )}
    </>
  );
}
export function MissionHints() {
  const { profile } = useWorkspace();
  const [count, setCount] = useState(0);
  const hints =
    profile.gameProgress.stage === 0
      ? [
          'Firefox의 바로가기에서 단체의 공식 사이트를 찾아보세요.',
          'Index에 프로젝트루트 또는 project root를 검색해 보세요.',
          '공식 사이트 주소는 projectroot.kro.kr입니다.',
        ]
      : [
          '같은 이름만으로 동일한 사람이라고 단정하지 말고 소속과 활동 분야도 확인하세요.',
          'Index에서 윤서하를 검색하고 공개 프로필과 커뮤니티 글을 비교하세요.',
          'Profile의 공개 사용자명과 Threads 글의 작성자·자기소개를 비교한 뒤 두 페이지 주소를 보고서에 남기세요.',
        ];
  return (
    <>
      <span className="root-overline">INVESTIGATION HINTS</span>
      <h1>조사 힌트</h1>
      <p className="root-description">필요할 때 한 단계씩 확인하세요.</p>
      <div className="mission-history">
        {hints.slice(0, count).map((hint, i) => (
          <article key={hint}>
            <small>HINT 0{i + 1}</small>
            <p>{hint}</p>
          </article>
        ))}
      </div>
      <button
        className="root-btn"
        disabled={count === hints.length}
        onClick={() => setCount(count + 1)}
      >
        다음 힌트 보기
      </button>
    </>
  );
}
export function MissionRecords({ kind }: { kind: string }) {
  const { profile } = useWorkspace();
  return (
    <>
      <span className="root-overline">VERIFIED RECORDS</span>
      <h1>
        {kind === 'intel' ? '조사 정보' : kind === 'accounts' ? '발견한 계정' : '증거 보관함'}
      </h1>
      {profile.gameProgress.stage === 2 ? (
        <div className="mission-history">
          <article>
            <small>MISSION 002 · 보고서로 확인됨</small>
            <h2>윤서하 · seoha_y</h2>
            <p>
              해온 데이터 연구소의 공개 데이터 아카이브 연구원. 프로필의 사용자명과 커뮤니티
              작성자의 자기소개·소속이 일치합니다.
            </p>
            <p>
              {PROFILE_URL}
              <br />
              {THREAD_URL}
            </p>
          </article>
        </div>
      ) : (
        <p className="root-description">
          조사 보고서에서 검증한 정보가 이곳에 정리됩니다. 조사 중 떠오른 생각은 텍스트 파일로
          자유롭게 메모하세요.
        </p>
      )}
    </>
  );
}
