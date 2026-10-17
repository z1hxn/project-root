import { z } from 'zod';
import { buildEvidence, caseHints, caseMissions, CHANGELOG_URL, CURRENT_RECORD_URL } from './cases';
import { GITHUB_URL, THREADS_URL, canonicalWorldUrl } from './world';
import { logFiles } from './virtualNetwork';

export const linkReportSchema = z.object({
  currentUrl: z.string().max(500),
  changeUrl: z.string().max(500),
  conclusion: z.enum(['주소 이동/갱신', '자료 삭제', '판단 불가']),
  note: z.string().trim().min(8).max(500),
});
export const buildReportSchema = z.object({
  classification: z.enum(['예정된 자동 작업', '사용자 접속', '판단 불가']),
  note: z.string().trim().min(8).max(500),
});
export const incidentReportSchema = z.object({
  normalEvidence: z.string().max(200),
  suspiciousEvidence: z.string().max(200),
  automationEvidence: z.string().max(200),
  publicCorroboration: z.string().max(500),
  assessment: z.enum(['정상 활동으로 판단', '추가 확인 필요', '승인되지 않은 접근 가능성', '판단 불가']),
  analystNote: z.string().trim().min(20).max(1500),
});
export type LinkReport = z.infer<typeof linkReportSchema>;
export type BuildReport = z.infer<typeof buildReportSchema>;
export type IncidentReport = z.infer<typeof incidentReportSchema>;
const stageSchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]);
export type MissionStage = 1 | 2 | 3 | 4;
export const NEXT_MISSION_DELAY_MS = 20_000;
export const progressSchema = z.object({
  version: z.literal(2).default(2),
  stage: stageSchema.default(1),
  highestStage: stageSchema.default(1),
  pendingStage: z.union([z.literal(2), z.literal(3)]).nullable().default(null),
  nextMissionAt: z.string().datetime().nullable().default(null),
  visited: z.array(z.string()).default([]),
  evidence: z.array(z.string()).default([]),
  installedPackages: z.object({ smbclient: z.boolean().default(false) }).default({ smbclient: false }),
  hintsUsed: z.object({ '1': z.number().int().min(0).max(3).default(0), '2': z.number().int().min(0).max(3).default(0), '3': z.number().int().min(0).max(3).default(0) }).default({ '1': 0, '2': 0, '3': 0 }),
  reports: z.object({ link: linkReportSchema.nullable().default(null), build: buildReportSchema.nullable().default(null), incident: incidentReportSchema.nullable().default(null) }).default({ link: null, build: null, incident: null }),
});
export type GameProgress = z.infer<typeof progressSchema>;

export function readProgress(input: unknown): GameProgress {
  const value = input && typeof input === 'object' ? input as Record<string, unknown> : {};
  if (value.version === 2) {
    const parsed = progressSchema.safeParse(value);
    return parsed.success ? { ...parsed.data, highestStage: Math.max(parsed.data.stage, parsed.data.highestStage) as MissionStage } : progressSchema.parse({});
  }
  // Previous saves used stage 0 for orientation and stage 1 for the internal-access case.
  const oldStage = typeof value.stage === 'number' ? value.stage : 0;
  const oldHighest = typeof value.highestStage === 'number' ? value.highestStage : oldStage;
  const convert = (stage: number): MissionStage => stage >= 2 ? 4 : stage >= 1 ? 3 : 1;
  const oldReport = value.report && typeof value.report === 'object' ? value.report as Record<string, unknown> : null;
  const migrated = {
    stage: convert(oldStage), highestStage: convert(oldHighest),
    visited: Array.isArray(value.visited) ? value.visited : [],
    evidence: Array.isArray(value.evidence) ? value.evidence : [],
    installedPackages: value.installedPackages,
    hintsUsed: { '1': 0, '2': 0, '3': Math.min(3, Number(value.mission002HintsUsed) || 0) },
    reports: oldReport ? {
      link: null, build: null,
      incident: {
        normalEvidence: 'auth/auth-2026-09-24.log',
        suspiciousEvidence: 'auth/auth-2026-09-26.log',
        automationEvidence: 'build/build-runner.log',
        publicCorroboration: String(oldReport.publicCorroboration || GITHUB_URL),
        assessment: oldReport.assessment,
        analystNote: String(oldReport.analystNote || '이전 버전에서 완료한 보고서입니다. 기존 완료 상태를 보존합니다.'),
      },
    } : undefined,
  };
  const parsed = progressSchema.safeParse(migrated);
  return parsed.success ? parsed.data : progressSchema.parse({ ...migrated, reports: undefined });
}

export type GameEvent =
  | { type: 'visit'; url: string }
  | { type: 'rollback'; stage: 1 | 2 | 3 }
  | { type: 'hint' }
  | { type: 'install'; package: 'smbclient' }
  | { type: 'evidence'; path: string }
  | { type: 'link-report'; report: LinkReport }
  | { type: 'build-report'; report: BuildReport }
  | { type: 'incident-report'; report: IncidentReport }
  | { type: 'activate' };

export function advanceProgress(current: GameProgress, event: GameEvent, now = Date.now()): { progress: GameProgress; assigned: boolean; completed: boolean } {
  const result = (progress: GameProgress, completed = false, assigned = false) => ({ progress, assigned, completed });
  if (event.type === 'activate') {
    if (!current.pendingStage || !current.nextMissionAt || now < Date.parse(current.nextMissionAt)) return result(current);
    return result({ ...current, stage: current.pendingStage, highestStage: Math.max(current.pendingStage, current.highestStage) as MissionStage, pendingStage: null, nextMissionAt: null }, false, true);
  }
  if (event.type === 'rollback') {
    if (event.stage > current.highestStage) throw Error('아직 배정되지 않은 임무입니다.');
    return result({ ...current, stage: event.stage, pendingStage: null, nextMissionAt: null, visited: [], evidence: [],
      hintsUsed: { ...current.hintsUsed, [event.stage]: 0 },
      reports: {
        link: event.stage <= 1 ? null : current.reports.link,
        build: event.stage <= 2 ? null : current.reports.build,
        incident: null,
      },
    });
  }
  if (event.type === 'visit') {
    const url = canonicalWorldUrl(event.url);
    if (!url) throw Error('등록된 조사 페이지가 아닙니다.');
    return result({ ...current, visited: current.visited.includes(url) ? current.visited : [...current.visited, url] });
  }
  if (current.pendingStage) throw Error('다음 임무가 배정될 때까지 잠시 기다려 주세요.');
  if (event.type === 'hint') {
    if (current.stage === 4) return result(current);
    const key = String(current.stage) as '1' | '2' | '3';
    return result({ ...current, hintsUsed: { ...current.hintsUsed, [key]: Math.min(caseHints[current.stage].length, current.hintsUsed[key] + 1) } });
  }
  if (event.type === 'link-report') {
    if (current.stage !== 1) throw Error('현재 임무의 보고서가 아닙니다.');
    const report = linkReportSchema.parse(event.report);
    if (report.currentUrl !== CURRENT_RECORD_URL || report.changeUrl !== CHANGELOG_URL || report.conclusion !== '주소 이동/갱신' || ![CURRENT_RECORD_URL, CHANGELOG_URL].every((url) => current.visited.includes(url)))
      throw Error('현재 공식 자료와 공개 변경 이력을 Firefox에서 확인한 뒤 선택해 주세요.');
    return result({ ...current, pendingStage: 2, nextMissionAt: new Date(now + NEXT_MISSION_DELAY_MS).toISOString(), reports: { ...current.reports, link: report } }, true);
  }
  if (event.type === 'build-report') {
    if (current.stage !== 2) throw Error('현재 임무의 보고서가 아닙니다.');
    const report = buildReportSchema.parse(event.report);
    if (!Object.values(buildEvidence).every((path) => current.evidence.includes(path)))
      throw Error('Dolphin의 사건용 작업·일정·인증 기록 세 개를 열어 비교해 주세요.');
    if (report.classification !== '예정된 자동 작업') throw Error('세 기록의 계정, 인증 방식, runner와 시간을 다시 비교해 주세요.');
    return result({ ...current, pendingStage: 3, nextMissionAt: new Date(now + NEXT_MISSION_DELAY_MS).toISOString(), reports: { ...current.reports, build: report } }, true);
  }
  if (event.type === 'evidence' && current.stage === 2) {
    if (!Object.values(buildEvidence).some((path) => path === event.path)) throw Error('이 사건의 자료가 아닙니다.');
    return result({ ...current, evidence: current.evidence.includes(event.path) ? current.evidence : [...current.evidence, event.path] });
  }
  if (current.stage !== 3) throw Error('현재 진행 중인 조사 임무가 아닙니다.');
  if (event.type === 'install') return result({ ...current, installedPackages: { smbclient: true } });
  if (event.type === 'evidence') {
    if (!current.installedPackages.smbclient || !(event.path in logFiles)) throw Error('먼저 가상 저장소에 접근해 기록을 확보하세요.');
    return result({ ...current, evidence: current.evidence.includes(event.path) ? current.evidence : [...current.evidence, event.path] });
  }
  const report = incidentReportSchema.parse(event.report);
  const normal = 'auth/auth-2026-09-24.log';
  const suspicious = 'auth/auth-2026-09-26.log';
  if (report.normalEvidence !== normal || report.suspiciousEvidence !== suspicious || ![normal, suspicious].every((path) => current.evidence.includes(path)))
    throw Error('정상 기록과 의심 기록을 내부 저장소에서 확보하고 선택해 주세요.');
  if (!['build/build-runner.log', 'application/scheduler.log'].includes(report.automationEvidence) || !current.evidence.includes(report.automationEvidence))
    throw Error('01:30 자동 작업의 근거 기록도 확보해 선택해 주세요.');
  if (![GITHUB_URL, THREADS_URL].includes(report.publicCorroboration) || !current.visited.includes(report.publicCorroboration))
    throw Error('Firefox에서 확인한 윤서하의 공개 기록을 선택해 주세요.');
  if (!['추가 확인 필요', '승인되지 않은 접근 가능성'].includes(report.assessment))
    throw Error('현재 증거로는 실제 사용자를 확정할 수 없습니다.');
  return result({ ...current, stage: 4, highestStage: 4, reports: { ...current.reports, incident: report } }, true);
}

export const explorationMission = caseMissions[0];
export const investigationMission = caseMissions[2];
export const mission002Hints = caseHints[2];
