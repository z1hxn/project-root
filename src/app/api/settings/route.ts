import { NextResponse } from 'next/server';
import { currentUser, publicProfile } from '@/server/auth';
import { db } from '@/server/db';
import { errorResponse, sameOrigin } from '@/server/http';
import { osSettingsSchema } from '@/lib/os-settings';
export async function PUT(request: Request) {
  if (!sameOrigin(request)) return errorResponse('허용되지 않은 요청입니다.', 403);
  try {
    const user = await currentUser();
    if (!user) return errorResponse('다시 로그인해 주세요.', 401);
    const parsed = osSettingsSchema.safeParse(await request.json());
    if (!parsed.success) return errorResponse('설정 값을 확인해 주세요.');
    const updated = await db.user.update({
      where: { id: user.id },
      data: { osSettings: parsed.data },
    });
    return NextResponse.json(publicProfile(updated));
  } catch {
    return errorResponse('시스템 설정을 저장하지 못했습니다.', 503);
  }
}
