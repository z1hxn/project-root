import { z } from 'zod';
import { OFFICIAL_URL, PROFILE_URL, THREAD_URL, canonicalWorldUrl } from './world';
export const progressSchema = z.object({
  stage: z.union([z.literal(0), z.literal(1), z.literal(2)]).default(0),
  visited: z.array(z.string()).default([]),
  highestStage: z.union([z.literal(0), z.literal(1), z.literal(2)]).default(0),
});
export type GameProgress = z.infer<typeof progressSchema>;
export function readProgress(input: unknown): GameProgress {
  const result = progressSchema.safeParse(input);
  return result.success
    ? {
        ...result.data,
        highestStage: Math.max(result.data.highestStage, result.data.stage) as 0 | 1 | 2,
      }
    : { stage: 0, visited: [], highestStage: 0 };
}
export const explorationMission = {
  id: 'orientation-001',
  code: 'MISSION 001',
  title: '워크스테이션 둘러보기',
  description: '첫 임무가 배정되었습니다. 컴퓨터를 자유롭게 탐색하며 조사 도구를 익혀 보세요.',
  objective:
    'Firefox, Dolphin, Konsole과 KWrite를 열어 보고, 필요한 내용은 텍스트 파일로 메모하세요.',
  status: '진행 중 · 환경 탐색',
} as const;
export const investigationMission = {
  id: 'public-records-002',
  code: 'MISSION 002',
  title: '공개 기록의 연결',
  description:
    '협력 기관인 해온 데이터 연구소가 연구원 윤서하의 최근 공개 활동을 확인해 달라고 요청했습니다. 공개 프로필과 커뮤니티 기록이 같은 사람의 활동인지 확인하세요.',
  objective:
    '윤서하가 사용하는 공개 계정을 식별하고, 서로 다른 두 출처를 근거로 제출하세요. 공개된 정보만 조사합니다.',
  status: '진행 중 · 공개 정보 조사',
} as const;
export type GameEvent =
  | { type: 'visit'; url: string }
  | { type: 'report'; handle: string; sources: string[] }
  | { type: 'rollback'; stage: 0 | 1 };
export function advanceProgress(
  current: GameProgress,
  event: GameEvent,
): { progress: GameProgress; assigned: boolean; completed: boolean } {
  if (event.type === 'rollback') {
    if (event.stage > current.highestStage) throw Error('아직 배정되지 않은 임무입니다.');
    return {
      progress: {
        ...current,
        stage: event.stage,
        visited: event.stage === 1 ? [OFFICIAL_URL] : [],
      },
      assigned: false,
      completed: false,
    };
  }
  if (event.type === 'visit') {
    const url = canonicalWorldUrl(event.url);
    if (!url) throw Error('등록된 조사 페이지가 아닙니다.');
    const assigned = current.stage === 0 && url === OFFICIAL_URL;
    return {
      progress: {
        highestStage: assigned
          ? (Math.max(1, current.highestStage) as 1 | 2)
          : current.highestStage,
        stage: assigned ? 1 : current.stage,
        visited: current.visited.includes(url) ? current.visited : [...current.visited, url],
      },
      assigned,
      completed: false,
    };
  }
  if (current.stage === 0) throw Error('아직 조사 임무가 배정되지 않았습니다.');
  if (current.stage === 2) return { progress: current, assigned: false, completed: false };
  const sources = new Set<string | null>(event.sources.map(canonicalWorldUrl));
  if (event.handle.trim().replace(/^@/, '').toLowerCase() !== 'seoha_y')
    throw Error('계정을 다시 확인해 주세요. 이름과 사용자명은 다를 수 있습니다.');
  if (![PROFILE_URL, THREAD_URL].every((url) => sources.has(url) && current.visited.includes(url)))
    throw Error('서로 다른 두 공개 출처를 직접 확인한 뒤 해당 주소를 제출해 주세요.');
  return { progress: { ...current, stage: 2, highestStage: 2 }, assigned: false, completed: true };
}
