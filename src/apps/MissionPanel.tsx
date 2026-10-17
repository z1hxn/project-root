'use client';
import { useEffect, useState } from 'react';
import { ArrowUpRight, Check, Compass, History, RotateCcw } from 'lucide-react';
import { useWorkspace } from '@/features/workspace/context';
import { caseHints, caseMissions, buildEvidence, CHANGELOG_URL, CURRENT_RECORD_URL, OLD_RECORD_URL } from '@/game/cases';
import { GITHUB_URL, THREADS_URL } from '@/game/world';
import { NativeDialog } from '@/components/ui/Native';
import type { IncidentReport, LinkReport, BuildReport } from '@/game/missions';

const normalLog = 'auth/auth-2026-09-24.log';
const suspiciousLog = 'auth/auth-2026-09-26.log';
const automationLogs = ['build/build-runner.log', 'application/scheduler.log'];

function EvidenceSelect({ name, label, choices }: { name: string; label: string; choices: { value: string; label: string }[] }) {
  return <label>{label}<select name={name} aria-label={label} required defaultValue=""><option value="" disabled>확인한 자료에서 선택</option>{choices.map((choice) => <option key={choice.value} value={choice.value}>{choice.label}</option>)}</select></label>;
}

export function MissionCard() {
  const { profile, openApp, submitLinkReport, submitBuildReport, submitReport } = useWorkspace();
  const progress = profile.gameProgress;
  const stage = progress.stage;
  const mission = caseMissions[Math.min(stage, 3) - 1];
  const pending = progress.pendingStage !== null;
  const [now, setNow] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!pending) return;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [pending]);
  const secondsLeft = progress.nextMissionAt && now ? Math.max(0, Math.ceil((Date.parse(progress.nextMissionAt) - now) / 1000)) : 0;
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setBusy(true);
    setError('');
    try {
      if (stage === 1) {
        const report: LinkReport = {
          currentUrl: String(data.get('currentUrl') || ''),
          changeUrl: String(data.get('changeUrl') || ''),
          conclusion: String(data.get('conclusion')) as LinkReport['conclusion'],
          note: String(data.get('note') || ''),
        };
        await submitLinkReport(report);
      } else if (stage === 2) {
        const report: BuildReport = {
          classification: String(data.get('classification')) as BuildReport['classification'],
          note: String(data.get('note') || ''),
        };
        await submitBuildReport(report);
      } else if (stage === 3) {
        const report: IncidentReport = {
          normalEvidence: String(data.get('normalEvidence') || ''),
          suspiciousEvidence: String(data.get('suspiciousEvidence') || ''),
          automationEvidence: String(data.get('automationEvidence') || ''),
          publicCorroboration: String(data.get('publicCorroboration') || ''),
          assessment: String(data.get('assessment')) as IncidentReport['assessment'],
          analystNote: String(data.get('analystNote') || ''),
        };
        await submitReport(report);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '보고서를 제출하지 못했습니다.');
    } finally {
      setBusy(false);
    }
  }
  return <section className={`root-assignment assigned-mission ${stage === 4 || pending ? 'mission-completed' : ''}`} aria-label="현재 임무">
    <div className="root-assignment-header"><span><span className="mission-live-dot" />{stage === 4 ? '조사 완료' : pending ? '임무 완료' : '현재 배정된 임무'}</span><small>{mission.code}</small></div>
    <div className="mission-content"><div className="mission-emblem">{stage === 4 || pending ? <Check size={38} /> : <Compass size={38} strokeWidth={1.5} />}</div><div className="mission-copy"><span className="mission-tag">{stage === 4 ? 'INVESTIGATION COMPLETE' : pending ? 'MISSION COMPLETE · NEXT ASSIGNMENT PENDING' : '배정 완료 · 조사 진행 중'}</span><h2>{mission.title}</h2><p>{mission.description}</p></div></div>
    {!pending && <div className="mission-objective"><strong>{stage === 4 ? '조사 결과' : '지금 할 일'}</strong><p>{stage === 4 ? '확인된 기록을 보존했습니다. 계정의 실제 사용자는 확정되지 않았으며 추가 조사를 기다립니다.' : mission.objective}</p></div>}
    {!pending && stage === 1 && <div className="mission-objective"><strong>첫 자료</strong><p>KMail의 ‘공개 기록 보존 안내 주소 확인’ 메일에 자료 제목과 옛 주소가 있습니다.</p><button onClick={() => openApp('mail')}>KMail 열기 <ArrowUpRight size={15} /></button><p>옛 주소: {OLD_RECORD_URL}</p></div>}
    {!pending && stage === 2 && <div className="mission-objective"><strong>사건 범위</strong><p>2026-09-26 01:30 KST · svc-build. Dolphin의 Network에서 Case Exports → Build Alert 자료 세 개를 열어 비교하세요. Konsole 사용은 선택입니다.</p><button onClick={() => openApp('files')}>Dolphin 열기 <ArrowUpRight size={15} /></button></div>}
    {!pending && stage === 3 && <div className="mission-objective"><strong>조사 순서</strong><ol><li>Documentation에서 로그 위치와 SMB 접근 방식을 확인합니다.</li><li>Konsole에서 인증 로그의 정상 세션과 02:14 세션을 확보합니다.</li><li>01:30 자동 빌드와 구별하고 Firefox 공개 기록을 교차검증합니다.</li></ol><p>명령 예시는 Documentation에 있으며, 조사 힌트에서도 확인할 수 있습니다.</p><button onClick={() => openApp('files')}>내부 문서 보기 <ArrowUpRight size={15} /></button></div>}
    {stage === 4 ? <div className="mission-completion"><small>INVESTIGATION COMPLETE</small><h3>MISSION 003 · 비정상 접근 기록</h3><p>정상 기록, 의심 세션, 자동 작업, 공개 활동을 구분해 보고했습니다. 다음 임무를 기다리세요.</p></div> : pending ?
      <div className="mission-completion" role="status"><small>MISSION COMPLETE</small><h3>보고서가 승인되었습니다</h3><p>다음 임무 준비 중 · {secondsLeft > 0 ? `약 ${secondsLeft}초 후 배정됩니다.` : '곧 배정됩니다.'}</p></div> :
      <form className="mission-report" onSubmit={submit} key={stage}>
        <h3>{stage === 1 ? '공개 자료 확인 보고' : stage === 2 ? '운영 기록 분류 보고' : 'Incident Report'}</h3>
        {stage === 1 && <>
          <p>Firefox에서 실제로 열어 본 현재 자료와 변경 이력을 선택하세요.</p>
          <EvidenceSelect name="currentUrl" label="현재 공식 자료" choices={progress.visited.includes(CURRENT_RECORD_URL) ? [{ value: CURRENT_RECORD_URL, label: '공개 기록 보존 안내 · PROJECT ROOT' }] : []} />
          <EvidenceSelect name="changeUrl" label="공개 변경 이력" choices={progress.visited.includes(CHANGELOG_URL) ? [{ value: CHANGELOG_URL, label: 'seoha-y/archive-index · GitHub' }] : []} />
          <label>판단<select name="conclusion" aria-label="판단"><option>주소 이동/갱신</option><option>자료 삭제</option><option>판단 불가</option></select></label>
          <label>판단 근거<textarea name="note" aria-label="판단 근거" required minLength={8} placeholder="두 자료를 비교해 확인한 내용을 적으세요." /></label>
          <button type="button" onClick={() => openApp('browser')}>Firefox 열기 <ArrowUpRight size={15} /></button>
        </>}
        {stage === 2 && <>
          <p>확인한 기록: {Object.values(buildEvidence).filter((path) => progress.evidence.includes(path)).length}/3</p>
          <ul>{Object.values(buildEvidence).map((path) => <li key={path}>{progress.evidence.includes(path) ? '✓' : '○'} {path.split('/')[1]}</li>)}</ul>
          <label>분류<select name="classification" aria-label="분류"><option>예정된 자동 작업</option><option>사용자 접속</option><option>판단 불가</option></select></label>
          <label>판단 근거<textarea name="note" aria-label="판단 근거" required minLength={8} placeholder="계정, 인증 방식, 작업 시각과 runner를 비교하세요." /></label>
        </>}
        {stage === 3 && <>
          <p>가져온 내부 기록과 Firefox에서 확인한 공개 기록을 선택하세요. 날짜와 파일명을 다시 입력할 필요는 없습니다.</p>
          <EvidenceSelect name="normalEvidence" label="마지막 정상 활동 기록" choices={progress.evidence.includes(normalLog) ? [{ value: normalLog, label: normalLog }] : []} />
          <EvidenceSelect name="suspiciousEvidence" label="의심 세션 기록" choices={progress.evidence.includes(suspiciousLog) ? [{ value: suspiciousLog, label: suspiciousLog }] : []} />
          <EvidenceSelect name="automationEvidence" label="01:30 자동 작업 기록" choices={automationLogs.filter((path) => progress.evidence.includes(path)).map((path) => ({ value: path, label: path }))} />
          <EvidenceSelect name="publicCorroboration" label="공개 활동 기록" choices={[GITHUB_URL, THREADS_URL].filter((url) => progress.visited.includes(url)).map((url) => ({ value: url, label: url }))} />
          <label>판단<select name="assessment" aria-label="판단"><option>추가 확인 필요</option><option>승인되지 않은 접근 가능성</option><option>정상 활동으로 판단</option><option>판단 불가</option></select></label>
          <label>분석 메모<textarea name="analystNote" aria-label="분석 메모" required minLength={20} placeholder="정상 기록과 다른 점, 자동 작업과의 구분, 공개 기록으로 알 수 없는 점을 적으세요." /></label>
        </>}
        {error && <p role="alert">{error}</p>}
        <button className="root-btn" disabled={busy}>{busy ? '검증 중…' : '보고서 제출'}</button>
      </form>}
    <footer className="mission-actions"><span><span className="mission-live-dot" />{stage === 4 ? '완료 · 다음 임무 대기' : pending ? '완료 · 다음 임무 준비 중' : mission.status}</span></footer>
  </section>;
}

export function MissionHistory() {
  const { profile, rollbackMission } = useWorkspace();
  const progress = profile.gameProgress;
  const [target, setTarget] = useState<1 | 2 | 3 | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return <><span className="root-overline">MISSION HISTORY</span><h1>임무 이력</h1><p className="root-description">완료한 임무를 다시 조사할 수 있습니다.</p><div className="mission-history">{caseMissions.filter((_, index) => index + 1 <= progress.highestStage).map((mission, index) => <article key={mission.id}><div><History size={20} /><small>{mission.code}</small><span>{progress.stage === index + 1 ? progress.pendingStage ? '완료 · 다음 임무 준비 중' : '현재 진행 중' : progress.stage > index + 1 ? '완료' : '다시 조사 가능'}</span></div><h2>{mission.title}</h2><p>{mission.description}</p><button className="root-btn" onClick={() => { setTarget((index + 1) as 1 | 2 | 3); setError(''); }}><RotateCcw size={15} />이 임무로 돌아가기</button></article>)}</div>{target !== null && <NativeDialog title="임무 다시 조사" onClose={() => { if (!busy) setTarget(null); }}><div className="kwrite-dialog-body"><p>{caseMissions[target - 1].title}부터 다시 진행합니다. 개인 파일과 메모는 유지되며 이 임무의 조사 기록은 초기화됩니다.</p>{error && <p role="alert">{error}</p>}</div><footer><button className="native-button" disabled={busy} onClick={() => setTarget(null)}>취소</button><button className="native-button" disabled={busy} onClick={async () => { setBusy(true); try { await rollbackMission(target); setTarget(null); } catch (e) { setError(e instanceof Error ? e.message : '되돌리기 실패'); } finally { setBusy(false); } }}>{busy ? '처리 중…' : '다시 조사'}</button></footer></NativeDialog>}</>;
}

export function MissionHints() {
  const { profile, useHint } = useWorkspace();
  const stage = Math.min(profile.gameProgress.stage, 3) as 1 | 2 | 3;
  const count = profile.gameProgress.hintsUsed[String(stage) as '1' | '2' | '3'];
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return <><span className="root-overline">INVESTIGATION HINTS</span><h1>조사 힌트</h1><p className="root-description">{caseMissions[stage - 1].title} · 현재 임무의 힌트를 한 단계씩 확인하세요.</p><div className="mission-history">{caseHints[stage].slice(0, count).map((hint, index) => <article key={hint}><small>HINT {index + 1}</small><p>{hint}</p></article>)}</div>{error && <p role="alert">{error}</p>}<button className="root-btn" disabled={busy || !!profile.gameProgress.pendingStage || profile.gameProgress.stage === 4 || count >= caseHints[stage].length} onClick={async () => { setBusy(true); try { await useHint(); } catch (e) { setError(e instanceof Error ? e.message : '힌트를 열 수 없습니다.'); } finally { setBusy(false); } }}>다음 힌트 보기</button></>;
}

export function MissionRecords({ kind }: { kind: string }) {
  const { profile } = useWorkspace();
  const progress = profile.gameProgress;
  return <><span className="root-overline">VERIFIED RECORDS</span><h1>{kind === 'intel' ? '조사 정보' : kind === 'accounts' ? '발견한 계정' : '증거 보관함'}</h1><p className="root-description">조사 중 확보한 자료와 완료한 보고서입니다. 개인 메모는 KWrite에서 관리하세요.</p><div className="mission-history">{progress.reports.link && <article><small>MISSION 001 · 완료</small><h2>사라진 링크</h2><p>{progress.reports.link.conclusion} · {progress.reports.link.currentUrl}</p></article>}{progress.reports.build && <article><small>MISSION 002 · 완료</small><h2>새벽의 빌드 알림</h2><p>{progress.reports.build.classification}</p></article>}{progress.reports.incident && <article><small>MISSION 003 · 완료</small><h2>비정상 접근 기록</h2><p>{progress.reports.incident.assessment}</p><p>{progress.reports.incident.analystNote}</p></article>}{progress.evidence.map((path) => <article key={path}><small>확보한 내부 기록</small><p>{path}</p></article>)}</div></>;
}
