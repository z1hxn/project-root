import { NextResponse } from 'next/server';
import { currentUser, publicProfile } from '@/server/auth';
import { db } from '@/server/db';
import { errorResponse, sameOrigin } from '@/server/http';
import { profileSchema } from '@/lib/validation';
export async function PATCH(request: Request) {
  if (!sameOrigin(request)) return errorResponse('허용되지 않은 요청입니다.', 403);
  try {
    const user = await currentUser();
    if (!user) return errorResponse('다시 로그인해 주세요.', 401);
    const parsed = profileSchema.safeParse(await request.json());
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message);
    const updated = await db.user.update({ where: { id: user.id }, data: parsed.data });
    return NextResponse.json(publicProfile(updated));
  } catch {
    return errorResponse('설정을 저장하지 못했습니다. 다시 시도해 주세요.', 503);
  }
}
