import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { db } from '@/server/db';
import { createSession, destroySession, currentUser } from '@/server/auth';
import { hashPassword, verifyPassword } from '@/server/password';
import { errorResponse, rateLimited, sameOrigin } from '@/server/http';
import { loginSchema, registrationSchema } from '@/lib/validation';
export async function POST(request: Request, context: { params: Promise<{ action: string }> }) {
  if (!sameOrigin(request)) return errorResponse('허용되지 않은 요청입니다.', 403);
  const { action } = await context.params;
  try {
    if (action === 'logout') {
      await destroySession();
      return NextResponse.json({ ok: true });
    }
    if (action === 'unlock') {
      const user = await currentUser();
      if (!user) return errorResponse('다시 로그인해 주세요.', 401);
      if (rateLimited(`unlock:${user.id}`))
        return errorResponse('잠시 후 다시 시도해 주세요.', 429);
      const body = await request.json();
      if (
        typeof body.password !== 'string' ||
        body.password.length > 128 ||
        !(await verifyPassword(body.password, user.passwordHash))
      )
        return errorResponse('계정 비밀번호가 일치하지 않습니다.', 401);
      return NextResponse.json({ ok: true });
    }
    if (!['register', 'login'].includes(action))
      return errorResponse('찾을 수 없는 요청입니다.', 404);
    if (Number(request.headers.get('content-length') || 0) > 8192)
      return errorResponse('요청이 너무 큽니다.', 413);
    const body = await request.json();
    // Global cap plus identity cap: no reliance on client-supplied forwarding headers.
    if (
      rateLimited('global') ||
      rateLimited(`identity:${String(body.username).slice(0, 254).toLowerCase()}`)
    )
      return errorResponse('잠시 후 다시 시도해 주세요.', 429);
    if (action === 'register') {
      const parsed = registrationSchema.safeParse(body);
      if (!parsed.success) return errorResponse(parsed.error.issues[0].message);
      const { username, email, password } = parsed.data;
      const user = await db.user.create({
        data: {
          username,
          email,
          displayName: username,
          passwordHash: await hashPassword(password),
        },
      });
      await createSession(user.id);
      return NextResponse.json({ ok: true }, { status: 201 });
    }
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) return errorResponse('사용자명과 비밀번호를 확인해 주세요.');
    const user = await db.user.findFirst({
      where: { OR: [{ username: parsed.data.username }, { email: parsed.data.username }] },
    });
    const valid = await verifyPassword(
      parsed.data.password,
      user?.passwordHash ?? `${'0'.repeat(32)}:${'0'.repeat(128)}`,
    );
    if (!user || !valid) return errorResponse('사용자명 또는 비밀번호가 일치하지 않습니다.', 401);
    await createSession(user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
      return errorResponse('이미 사용 중인 사용자명 또는 이메일입니다.', 409);
    if (error instanceof SyntaxError) return errorResponse('요청 형식을 확인해 주세요.');
    return errorResponse('연결을 완료하지 못했습니다. 잠시 후 다시 시도해 주세요.', 503);
  }
}
