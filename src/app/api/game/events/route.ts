import { z } from 'zod';
import { NextResponse } from 'next/server';
import { currentUser } from '@/server/auth';
import { db } from '@/server/db';
import { errorResponse, sameOrigin } from '@/server/http';
import { readOSSettings } from '@/lib/os-settings';
import { advanceProgress, readProgress, linkReportSchema, buildReportSchema, incidentReportSchema } from '@/game/missions';
const eventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('rollback'), stage: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]) }).strict(),
  z.object({ type: z.literal('visit'), url: z.string().max(500) }).strict(),
  z.object({ type: z.literal('hint') }).strict(),
  z.object({ type: z.literal('activate') }).strict(),
  z.object({ type: z.literal('install'), package: z.literal('smbclient') }).strict(),
  z.object({ type: z.literal('evidence'), path: z.string().max(200) }).strict(),
  z.object({ type: z.literal('link-report'), report: linkReportSchema }).strict(),
  z.object({ type: z.literal('build-report'), report: buildReportSchema }).strict(),
  z.object({ type: z.literal('incident-report'), report: incidentReportSchema }).strict(),
]);
export async function POST(request: Request) {
  if (!sameOrigin(request)) return errorResponse('허용되지 않은 요청입니다.', 403);
  try {
    const user = await currentUser();
    if (!user) return errorResponse('다시 로그인해 주세요.', 401);
    if (Number(request.headers.get('content-length') || 0) > 8192)
      return errorResponse('요청이 너무 큽니다.', 413);
    const parsed = eventSchema.safeParse(await request.json());
    if (!parsed.success) return errorResponse('조사 요청 형식을 확인해 주세요.');
    for (let attempt = 0; attempt < 4; attempt++) {
      const fresh = await db.user.findUniqueOrThrow({ where: { id: user.id } });
      if (!fresh.briefingCompleted && !fresh.introCompleted) return errorResponse('첫 접속 안내를 먼저 마쳐 주세요.', 409);
      const settings = readOSSettings(fresh.osSettings);
      if (parsed.data.type === 'visit' && (!settings.wifi || settings.airplaneMode))
        return errorResponse('네트워크에 연결해 주세요.', 409);
      let result;
      try {
        result = advanceProgress(readProgress(fresh.gameProgress), parsed.data);
      } catch (e) {
        return errorResponse(e instanceof Error ? e.message : '조사 내용을 확인해 주세요.');
      }
      const updated = await db.user.updateMany({
        where: { id: user.id, gameProgress: { equals: fresh.gameProgress! } },
        data: { gameProgress: result.progress },
      });
      if (updated.count) return NextResponse.json(result);
    }
    return errorResponse('진행 상태가 변경되었습니다. 다시 시도해 주세요.', 409);
  } catch {
    return errorResponse('진행 상태를 저장하지 못했습니다. 다시 시도해 주세요.', 503);
  }
}
