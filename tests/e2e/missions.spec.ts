import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { OFFICIAL_URL, PROFILE_URL, THREAD_URL } from '../../src/game/world';
const db = new PrismaClient();
const username = `qm_${Date.now().toString(36)}`;
const password = 'Test-missions-42';
const baseURL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';
test.afterAll(async () => {
  await db.user.deleteMany({ where: { username } });
  await db.$disconnect();
});
test('official site discovery, mission evidence, notification sources and rollback persist', async ({
  page,
}) => {
  test.setTimeout(120000);
  const fatal: string[] = [];
  page.on('pageerror', (e) => fatal.push(e.message));
  const headers = { origin: baseURL };
  expect(
    (
      await page.request.post('/api/auth/register', {
        headers,
        data: { username, email: `${username}@example.test`, password, confirmPassword: password },
      })
    ).status(),
  ).toBe(201);
  expect(
    (
      await page.request.patch('/api/profile', {
        headers,
        data: { setupCompleted: true, briefingCompleted: true },
      })
    ).status(),
  ).toBe(200);
  const gameEvent = (data: unknown) => page.request.post('/api/game/events', { headers, data });
  expect((await gameEvent({ type: 'rollback', stage: 1 })).status()).toBe(400);
  expect(
    (await gameEvent({ type: 'visit', url: 'https://projectroot.kro.kr.evil.test' })).status(),
  ).toBe(400);
  expect(
    (
      await page.request.post('/api/game/events', {
        headers: { origin: 'https://bad.test' },
        data: { type: 'visit', url: OFFICIAL_URL },
      })
    ).status(),
  ).toBe(403);
  await page.goto('/game');
  await page.getByLabel('OS 로그인 비밀번호').fill(password);
  await page.getByRole('button', { name: 'OS 로그인', exact: true }).click();
  const root = page.getByRole('region', { name: 'Project Root 창', exact: true });
  await expect(root.getByText(/Firefox에서 프로젝트 루트 공식 사이트/)).toBeVisible();
  await root.getByRole('button', { name: 'Project Root 최소화' }).click();
  await page.getByRole('button', { name: 'Firefox 실행 또는 복원' }).click();
  const firefox = page.getByRole('region', { name: 'Firefox 창', exact: true });
  await expect(firefox.getByRole('button', { name: '시작 안내', exact: true })).toHaveCount(0);
  await expect(
    firefox.locator('.firefox-shortcuts').getByRole('button', { name: 'Project Root 공식 사이트' }),
  ).toBeVisible();
  await firefox.getByLabel('웹 검색', { exact: true }).fill('프로젝트루트');
  await firefox.getByLabel('웹 검색', { exact: true }).press('Enter');
  await expect(
    firefox.getByRole('button', { name: 'PROJECT ROOT — 디지털 조사와 분석' }),
  ).toBeVisible();
  await page.screenshot({ path: 'test-results/index-search.png' });
  await firefox.getByRole('button', { name: 'PROJECT ROOT — 디지털 조사와 분석' }).click();
  await expect(
    firefox.getByRole('heading', { name: '기록을 읽고, 사실을 연결합니다.' }),
  ).toBeVisible();
  await expect(page.getByRole('status')).toContainText('두 번째 미션이 배정되었습니다');
  await expect(page.locator('.plasma-toast strong')).toHaveText('Project Root');
  await page.screenshot({ path: 'test-results/official-site.png' });
  await firefox.getByRole('button', { name: '새로 고침', exact: true }).click();
  await page.getByRole('button', { name: '알림', exact: true }).click();
  await expect(
    page.locator('.notification-list article').filter({ hasText: '두 번째 미션이 배정되었습니다' }),
  ).toHaveCount(1);
  await page.getByRole('button', { name: '트레이 닫기' }).click();
  expect(
    (
      await gameEvent({ type: 'report', handle: 'seoha_y', sources: [PROFILE_URL, THREAD_URL] })
    ).status(),
  ).toBe(400);
  await firefox.getByRole('button', { name: '연구원 공개 프로필' }).click();
  await expect(firefox.getByRole('heading', { name: '윤서하', exact: true })).toBeVisible();
  await page.screenshot({ path: 'test-results/profile-site.png' });
  await firefox.getByRole('button', { name: 'Threads의 공개 글 보기' }).click();
  await expect(
    firefox.getByRole('heading', { name: '공개 아카이브 색인 갱신 안내' }),
  ).toBeVisible();
  await page.screenshot({ path: 'test-results/threads-site.png' });
  await firefox.getByRole('button', { name: 'Firefox 최소화' }).click();
  await page.getByRole('button', { name: 'Project Root 실행 또는 복원' }).click();
  await expect(root.getByRole('heading', { name: '공개 기록의 연결' })).toBeVisible();
  await root.getByLabel('조사한 공개 사용자명').fill('wrong');
  await root.getByLabel('첫 번째 조사 출처').fill(PROFILE_URL);
  await root.getByLabel('두 번째 조사 출처').fill(THREAD_URL);
  await root.getByRole('button', { name: '조사 보고서 제출' }).click();
  await expect(root.getByRole('alert')).toContainText('계정을 다시 확인');
  await root.getByLabel('조사한 공개 사용자명').fill('seoha_y');
  await root.getByRole('button', { name: '조사 보고서 제출' }).click();
  await expect(root.getByText('보고서 승인 완료')).toBeVisible();
  await page.screenshot({ path: 'test-results/mission-complete.png' });
  await root.getByRole('button', { name: '임무 이력', exact: true }).click();
  await expect(root.locator('.mission-history article')).toHaveCount(2);
  await page.screenshot({ path: 'test-results/mission-history.png' });
  await root.getByRole('button', { name: 'MISSION 001로 돌아가기' }).click();
  await page.getByRole('dialog').getByRole('button', { name: '임무 되돌리기' }).click();
  await root.getByRole('button', { name: '사건', exact: true }).click();
  await expect(root.getByRole('heading', { name: '워크스테이션 둘러보기' })).toBeVisible();
  await page.reload();
  await page.getByLabel('OS 로그인 비밀번호').fill(password);
  await page.getByRole('button', { name: 'OS 로그인', exact: true }).click();
  await expect(root.getByRole('heading', { name: '워크스테이션 둘러보기' })).toBeVisible();
  await root.getByRole('button', { name: '임무 이력', exact: true }).click();
  await expect(root.locator('.mission-history article')).toHaveCount(2);
  await root.getByRole('button', { name: 'MISSION 002로 돌아가기' }).click();
  await page.getByRole('dialog').getByRole('button', { name: '임무 되돌리기' }).click();
  expect(
    (
      await gameEvent({ type: 'report', handle: 'seoha_y', sources: [PROFILE_URL, THREAD_URL] })
    ).status(),
  ).toBe(400);
  await root.getByRole('button', { name: 'Project Root 최소화' }).click();
  await page.getByRole('button', { name: 'KWrite 실행 또는 복원' }).click();
  const editor = page.getByRole('region', { name: 'KWrite 창' });
  await editor.getByLabel('파일 내용').fill('조사 메모');
  await editor.getByLabel('파일 내용').press('Control+s');
  await page.getByRole('dialog').getByRole('button', { name: '저장', exact: true }).click();
  await expect(page.locator('.plasma-toast strong')).toHaveText('KWrite');
  await expect(page.locator('.plasma-toast img')).toHaveAttribute(
    'src',
    '/assets/icons/editor.svg',
  );
  expect(fatal).toEqual([]);
});
