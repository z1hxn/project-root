'use client';
import { useEffect, useState } from 'react';
import { ArrowUpRight, Check, Compass, FileText, FolderOpen, Globe2, History, RotateCcw } from 'lucide-react';
import { useWorkspace } from '@/features/workspace/context';
import { caseHints, caseMissions, buildEvidence, buildEvidenceFiles, CHANGELOG_URL, CURRENT_RECORD_URL, OLD_RECORD_URL } from '@/game/cases';
import { GITHUB_URL, OFFICIAL_URL, THREADS_URL, worldPage } from '@/game/world';
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
  const mission = caseMissions[Math.min(stage, 4) - 1];
  const pending = progress.pendingStage !== null;
  const [now, setNow] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
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
      if (stage === 2) {
        const report: LinkReport = {
          currentUrl: String(data.get('currentUrl') || ''),
          changeUrl: String(data.get('changeUrl') || ''),
          conclusion: String(data.get('conclusion')) as LinkReport['conclusion'],
          note: String(data.get('note') || ''),
        };
        await submitLinkReport(report);
      } else if (stage === 3) {
        const report: BuildReport = {
          classification: String(data.get('classification')) as BuildReport['classification'],
          note: String(data.get('note') || ''),
        };
        await submitBuildReport(report);
      } else if (stage === 4) {
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
      setReportOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : '보고서를 제출하지 못했습니다.');
    } finally {
      setBusy(false);
    }
  }
  return <section className={`root-assignment assigned-mission ${stage === 5 || pending ? 'mission-completed' : ''}`} aria-label="현재 임무">
    <div className="root-assignment-header"><span><span className="mission-live-dot" />{stage === 5 ? '조사 완료' : pending ? '임무 완료' : '현재 배정된 임무'}</span><small>{stage === 5 ? '다음 조사 대기' : mission.code}</small></div>
    <div className="mission-content"><div className="mission-emblem">{stage === 5 || pending ? <Check size={38} /> : <Compass size={38} strokeWidth={1.5} />}</div><div className="mission-copy"><span className="mission-tag">{stage === 5 ? '조사 완료' : pending ? stage === 1 ? '워크스테이션 확인 완료 · 다음 임무 준비 중' : '보고서 승인 · 다음 임무 준비 중' : '배정 완료 · 조사 진행 중'}</span><h2>{stage === 5 ? '현재 배정된 임무가 없습니다' : mission.title}</h2><p>{stage === 5 ? '지금까지 제출한 보고서는 아래 임무 이력에서 확인할 수 있습니다.' : mission.description}</p></div></div>
    {!pending && <div className="mission-objective">
      <strong>{stage === 5 ? '조사 결과' : '조사 안내'}</strong>
      <p>{stage === 5 ? '확인된 기록을 보존했습니다. 계정의 실제 사용자는 확정되지 않았으며 추가 조사를 기다립니다.' : mission.objective}</p>
      {stage === 1 && <><p>확인할 사이트: {OFFICIAL_URL}</p><p>Firefox에서 공식 사이트를 직접 열면 워크스테이션 확인이 완료됩니다.</p><button onClick={() => openApp('browser')}>Firefox 열기 <ArrowUpRight size={15} /></button></>}
      {stage === 2 && <><p>KMail의 ‘공개 기록 보존 안내 주소 확인’ 메일에 자료 제목과 옛 주소가 있습니다.</p><p>옛 주소: {OLD_RECORD_URL}</p><div className="mission-objective-actions"><button onClick={() => openApp('mail')}>KMail 열기 <ArrowUpRight size={15} /></button><button onClick={() => openApp('browser')}>Firefox 열기 <ArrowUpRight size={15} /></button></div></>}
      {stage === 3 && <><p>2026-09-26 01:30 KST · svc-build. Dolphin의 Network에서 Case Exports → Build Alert 자료 세 개를 열어 비교하세요. Konsole 사용은 선택입니다.</p><button onClick={() => openApp('files')}>Dolphin 열기 <ArrowUpRight size={15} /></button></>}
      {stage === 4 && <><p>같은 계정의 이전 활동, 해당 시각의 세션, 주변의 자동 작업을 분리해 기록하세요. 내부 기록의 보관 위치와 열람 기준은 사내 문서에서 확인할 수 있습니다.</p><button onClick={() => openApp('files')}>사내 문서 열기 <ArrowUpRight size={15} /></button></>}
    </div>}
    {pending && <div className="mission-completion" role="status"><small>임무 완료</small><h3>{stage === 1 ? '워크스테이션 확인을 마쳤습니다' : '보고서가 승인되었습니다'}</h3><p>다음 임무 준비 중 · {secondsLeft > 0 ? `약 ${secondsLeft}초 후 배정됩니다.` : '곧 배정됩니다.'}</p></div>}
    <footer className="mission-actions"><span><span className="mission-live-dot" />{stage === 5 ? '완료 · 다음 임무 대기' : pending ? '완료 · 다음 임무 준비 중' : mission.status}</span>{!pending && stage === 1 && <button onClick={() => openApp('browser')}><ArrowUpRight size={16} />Firefox에서 시작</button>}{!pending && stage > 1 && stage < 5 && <button onClick={() => { setError(''); setReportOpen(true); }}><FileText size={16} />보고서 작성</button>}</footer>
    {reportOpen && !pending && stage > 1 && stage < 5 && <NativeDialog title={`${mission.title} · 조사 보고서`} className="root-report-dialog" onClose={() => { if (!busy) setReportOpen(false); }}>
      <form className="mission-report" onSubmit={submit} key={stage}>
        <h3>{stage === 2 ? '공개 자료 확인 보고' : stage === 3 ? '운영 기록 분류 보고' : 'Incident Report'}</h3>
        {stage === 2 && <>
          <p>Firefox에서 실제로 열어 본 현재 자료와 변경 이력을 선택하세요.</p>
          <EvidenceSelect name="currentUrl" label="현재 공식 자료" choices={progress.visited.includes(CURRENT_RECORD_URL) ? [{ value: CURRENT_RECORD_URL, label: '공개 기록 보존 안내 · PROJECT ROOT' }] : []} />
          <EvidenceSelect name="changeUrl" label="공개 변경 이력" choices={progress.visited.includes(CHANGELOG_URL) ? [{ value: CHANGELOG_URL, label: 'seoha-y/archive-index · GitHub' }] : []} />
          <label>판단<select name="conclusion" aria-label="판단"><option>주소 이동/갱신</option><option>자료 삭제</option><option>판단 불가</option></select></label>
          <label>판단 근거<textarea name="note" aria-label="판단 근거" required minLength={8} placeholder="두 자료를 비교해 확인한 내용을 적으세요." /></label>
        </>}
        {stage === 3 && <>
          <p>확인한 기록: {Object.values(buildEvidence).filter((path) => progress.evidence.includes(path)).length}/3</p>
          <ul>{Object.values(buildEvidence).map((path) => <li key={path}>{progress.evidence.includes(path) ? '✓' : '○'} {path.split('/')[1]}</li>)}</ul>
          <label>분류<select name="classification" aria-label="분류"><option>예정된 자동 작업</option><option>사용자 접속</option><option>판단 불가</option></select></label>
          <label>판단 근거<textarea name="note" aria-label="판단 근거" required minLength={8} placeholder="계정, 인증 방식, 작업 시각과 runner를 비교하세요." /></label>
        </>}
        {stage === 4 && <>
          <p>가져온 내부 기록과 Firefox에서 확인한 공개 기록을 선택하세요. 날짜와 파일명을 다시 입력할 필요는 없습니다.</p>
          <EvidenceSelect name="normalEvidence" label="마지막 정상 활동 기록" choices={progress.evidence.includes(normalLog) ? [{ value: normalLog, label: normalLog }] : []} />
          <EvidenceSelect name="suspiciousEvidence" label="의심 세션 기록" choices={progress.evidence.includes(suspiciousLog) ? [{ value: suspiciousLog, label: suspiciousLog }] : []} />
          <EvidenceSelect name="automationEvidence" label="01:30 자동 작업 기록" choices={automationLogs.filter((path) => progress.evidence.includes(path)).map((path) => ({ value: path, label: path }))} />
          <EvidenceSelect name="publicCorroboration" label="공개 활동 기록" choices={[GITHUB_URL, THREADS_URL].filter((url) => progress.visited.includes(url)).map((url) => ({ value: url, label: url }))} />
          <label>판단<select name="assessment" aria-label="판단"><option>추가 확인 필요</option><option>승인되지 않은 접근 가능성</option><option>정상 활동으로 판단</option><option>판단 불가</option></select></label>
          <label>분석 메모<textarea name="analystNote" aria-label="분석 메모" required minLength={20} placeholder="정상 기록과 다른 점, 자동 작업과의 구분, 공개 기록으로 알 수 없는 점을 적으세요." /></label>
        </>}
        {error && <p role="alert">{error}</p>}
        <footer><button type="button" className="root-btn" disabled={busy} onClick={() => setReportOpen(false)}>취소</button><button className="root-btn primary-root" disabled={busy}>{busy ? '검증 중…' : '보고서 제출'}</button></footer>
      </form>
    </NativeDialog>}
  </section>;
}

export function MissionHistory() {
  const { profile, rollbackMission } = useWorkspace();
  const progress = profile.gameProgress;
  const [target, setTarget] = useState<1 | 2 | 3 | 4 | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const previous = caseMissions
    .map((mission, index) => ({ mission, stage: (index + 1) as 1 | 2 | 3 | 4 }))
    .filter(({ stage }) => stage <= progress.highestStage && stage !== progress.stage);

  return <section className="root-history-section" aria-labelledby="root-history-title">
    <div className="root-section-heading">
      <div><span className="root-overline">조사 이력</span><h2 id="root-history-title">이전에 배정된 임무</h2></div>
      <span>{previous.length}건</span>
    </div>
    {previous.length === 0 ? (
      <p className="root-records-empty">이전 임무는 이곳에 쌓입니다. 현재 임무를 마치면 제출한 보고서도 함께 확인할 수 있습니다.</p>
    ) : (
      <div className="root-history-list">
        {previous.map(({ mission, stage }) => {
          const report = stage === 2 ? progress.reports.link : stage === 3 ? progress.reports.build : stage === 4 ? progress.reports.incident : null;
          const reportNote = stage === 2 ? progress.reports.link?.note : stage === 3 ? progress.reports.build?.note : stage === 4 ? progress.reports.incident?.analystNote : null;
          return <article key={mission.id} className="root-history-item">
            <div className="root-history-icon"><History size={19} /></div>
            <div className="root-history-copy">
              <div className="root-history-meta"><small>{mission.code}</small><span>{stage === 1 && progress.highestStage > 1 ? '환경 탐색 완료' : report ? '보고서 제출됨' : '이전에 배정됨'}</span></div>
              <h3>{mission.title}</h3>
              <p>{mission.description}</p>
              {report && <details><summary>제출한 판단 보기</summary><p>{stage === 2 ? progress.reports.link?.conclusion : stage === 3 ? progress.reports.build?.classification : progress.reports.incident?.assessment}</p><p>{reportNote}</p></details>}
            </div>
            <button className="root-btn" onClick={() => { setTarget(stage); setError(''); }}><RotateCcw size={15} />다시 조사</button>
          </article>;
        })}
      </div>
    )}
    {target !== null && <NativeDialog title="임무 다시 조사" onClose={() => { if (!busy) setTarget(null); }}>
      <div className="kwrite-dialog-body"><p>{caseMissions[target - 1].title}부터 다시 진행합니다. 개인 파일과 메모는 유지되며 이 임무의 조사 기록은 초기화됩니다.</p>{error && <p role="alert">{error}</p>}</div>
      <footer><button className="native-button" disabled={busy} onClick={() => setTarget(null)}>취소</button><button className="native-button" disabled={busy} onClick={async () => { setBusy(true); try { await rollbackMission(target); setTarget(null); } catch (e) { setError(e instanceof Error ? e.message : '되돌리기 실패'); } finally { setBusy(false); } }}>{busy ? '처리 중…' : '다시 조사'}</button></footer>
    </NativeDialog>}
  </section>;
}

export function MissionHints() {
  const { profile, useHint } = useWorkspace();
  const missionStage = profile.gameProgress.stage;
  const stage = Math.min(Math.max(missionStage - 1, 1), 3) as 1 | 2 | 3;
  const count = profile.gameProgress.hintsUsed[String(stage + 1) as '2' | '3' | '4'];
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const unavailable = !!profile.gameProgress.pendingStage || missionStage === 1 || missionStage === 5;
  return <div className="root-hints-page">
    <span className="root-overline">조사 지원</span>
    <h1>힌트</h1>
    <p className="root-description">{missionStage === 1 ? '첫 임무에서는 힌트 대신 워크스테이션을 자유롭게 둘러보세요.' : unavailable ? '새 임무를 기다리는 동안 이전에 연 힌트를 다시 볼 수 있습니다.' : `${caseMissions[missionStage - 1].title} · 필요한 만큼 한 단계씩 확인하세요.`}</p>
    <div className="root-hint-list">
      {count === 0 ? <p className="root-records-empty">{missionStage === 1 ? 'Project Root 앱에서 안내를 읽고 Firefox, Dolphin, Konsole과 KWrite를 살펴보세요. 공식 사이트에 접속하면 다음 임무가 준비됩니다.' : unavailable ? '이 조사에서 연 힌트가 없습니다.' : '아직 연 힌트가 없습니다. 먼저 자료를 살펴보고 막히는 지점에서 열어 보세요.'}</p> :
        caseHints[stage].slice(0, count).map((hint, index) => <article key={hint}><span>{String(index + 1).padStart(2, '0')}</span><p>{hint}</p></article>)}
    </div>
    {error && <p role="alert" className="root-form-error">{error}</p>}
    {missionStage !== 1 && <button className="root-btn primary-root" disabled={busy || unavailable || count >= caseHints[stage].length} onClick={async () => { setBusy(true); try { await useHint(); } catch (e) { setError(e instanceof Error ? e.message : '힌트를 열 수 없습니다.'); } finally { setBusy(false); } }}>{busy ? '불러오는 중…' : '다음 힌트 보기'}</button>}
  </div>;
}

export function MissionRecords() {
  const { profile, files, openApp, openText, openBrowserUrl } = useWorkspace();
  const { visited, evidence } = profile.gameProgress;
  const openEvidence = (path: string) => {
    const filePath = buildEvidenceFiles[path] ||
      files.find((file) => file.kind === 'file' && file.path.endsWith('/' + path.split('/').pop()))?.path;
    if (filePath) openText(filePath);
    else openApp('files');
  };
  return <div className="root-records-page">
    <span className="root-overline">조사 자료</span>
    <h1>확인한 기록을 한곳에서</h1>
    <p className="root-description">직접 열어 본 웹 자료와 확보한 내부 기록입니다. 제출한 판단은 임무 화면에서 확인할 수 있습니다.</p>
    <div className="root-record-summary" aria-label="확인한 자료 수">
      <span><Globe2 size={20} /><strong>{visited.length}</strong><small>웹 자료</small></span>
      <span><FolderOpen size={20} /><strong>{evidence.length}</strong><small>내부 기록</small></span>
    </div>
    <section className="root-record-group" aria-labelledby="root-web-records">
      <div className="root-section-heading"><div><span className="root-overline">공개 자료</span><h2 id="root-web-records">확인한 웹 자료</h2></div><button className="root-btn" onClick={() => openApp('browser')}>Firefox 열기 <ArrowUpRight size={14} /></button></div>
      {visited.length === 0 ? <p className="root-records-empty">아직 확인한 웹 자료가 없습니다. Firefox에서 자료를 열면 이곳에 기록됩니다.</p> :
        <div className="root-record-list">{visited.map((url) => <article key={url}><Globe2 size={18} /><div><strong>{worldPage(url)?.title || url}</strong><small>{url}</small></div><button onClick={() => openBrowserUrl(url)}>다시 열기 <ArrowUpRight size={14} /></button></article>)}</div>}
    </section>
    <section className="root-record-group" aria-labelledby="root-file-records">
      <div className="root-section-heading"><div><span className="root-overline">내부 기록</span><h2 id="root-file-records">확보한 파일</h2></div><button className="root-btn" onClick={() => openApp('files')}>Dolphin 열기 <ArrowUpRight size={14} /></button></div>
      {evidence.length === 0 ? <p className="root-records-empty">아직 확보한 내부 기록이 없습니다. 조사 중 확인한 자료가 이곳에 표시됩니다.</p> :
        <div className="root-record-list">{evidence.map((path) => <article key={path}><FolderOpen size={18} /><div><strong>{path.split('/').pop()}</strong><small>{path}</small></div><button onClick={() => openEvidence(path)}>파일 열기 <ArrowUpRight size={14} /></button></article>)}</div>}
    </section>
  </div>;
}
