import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { GITHUB_URL } from '../../src/game/world';
import { CHANGELOG_URL, CURRENT_RECORD_URL } from '../../src/game/cases';

const db = new PrismaClient();
const username = `qm_${Date.now().toString(36)}`;
const password = 'Test-missions-42';
const baseURL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';
test.afterAll(async () => {
  await db.user.deleteMany({ where: { username } });
  await db.$disconnect();
});

test('first case is playable, Firefox waits before showing a page, and later cases persist', async ({ page, context }) => {
  test.setTimeout(150000);
  const headers = { origin: baseURL };
  expect((await page.request.post('/api/auth/register', { headers, data: { username, email: `${username}@example.test`, password, confirmPassword: password } })).status()).toBe(201);
  expect((await page.request.patch('/api/profile', { headers, data: { setupCompleted: true, introCompleted: true, briefingCompleted: true } })).status()).toBe(200);
  const event = (data: unknown) => page.request.post('/api/game/events', { headers, data });
  await page.goto('/game');
  await page.getByRole('button', { name: '워크스테이션 열기' }).click();
  const root = page.getByRole('region', { name: 'Project Root 창', exact: true });
  await expect(root.getByRole('heading', { name: '사라진 링크' })).toBeVisible();
  await root.getByRole('button', { name: 'Firefox 열기' }).click();
  const firefox = page.getByRole('region', { name: 'Firefox 창', exact: true });
  await firefox.getByRole('textbox', { name: 'Firefox 주소창' }).fill(CURRENT_RECORD_URL);
  await firefox.getByRole('textbox', { name: 'Firefox 주소창' }).press('Enter');
  await expect(firefox.getByRole('progressbar', { name: '페이지 로딩 중' })).toBeVisible();
  await expect(firefox.getByRole('heading', { name: '공개 기록 보존 안내' })).toBeHidden();
  await expect(firefox.getByRole('heading', { name: '공개 기록 보존 안내' })).toBeVisible();
  await firefox.getByRole('textbox', { name: 'Firefox 주소창' }).fill(CHANGELOG_URL);
  await firefox.getByRole('textbox', { name: 'Firefox 주소창' }).press('Enter');
  await expect(firefox.getByRole('heading', { name: 'archive-index' })).toBeVisible();
  await expect(root.getByLabel('현재 공식 자료').locator('option')).toHaveCount(2);
  await expect(root.getByLabel('공개 변경 이력').locator('option')).toHaveCount(2);
  await page.keyboard.press('Alt+Shift+T');
  await expect(firefox.getByRole('tab')).toHaveCount(2);
  expect(context.pages()).toHaveLength(1);
  await root.getByLabel('현재 공식 자료').selectOption(CURRENT_RECORD_URL);
  await root.getByLabel('공개 변경 이력').selectOption(CHANGELOG_URL);
  await root.getByLabel('판단 근거').fill('공식 자료의 새 주소와 GitHub 공개 변경 이력이 일치합니다.');
  await root.getByRole('button', { name: '보고서 제출' }).click();
  await expect(root.getByText('다음 임무 준비 중', { exact: false }).first()).toBeVisible();
  await expect(root.getByRole('heading', { name: '새벽의 빌드 알림' })).toBeVisible({ timeout: 30000 });
  await root.getByRole('button', { name: 'Dolphin 열기' }).click();
  const files = page.getByRole('region', { name: 'Dolphin 창', exact: true });
  await files.getByRole('button', { name: '네트워크' }).click();
  for (const folder of ['PROJECT ROOT', 'Case Exports', 'Build Alert'])
    await files.locator('.file-entry').filter({ hasText: folder }).dblclick();
  for (const name of ['build-runner.log', 'scheduler.log', 'auth-excerpt.log']) {
    await files.locator('.file-entry').filter({ hasText: name }).dblclick();
    const editor = page.getByRole('region', { name: 'KWrite 창', exact: true });
    await expect(editor).toBeVisible();
    await editor.getByRole('button', { name: 'KWrite 닫기' }).click();
  }
  await page.getByRole('button', { name: 'Project Root 실행 또는 복원' }).click();
  await expect(root.getByText('확인한 기록: 3/3')).toBeVisible();
  await root.getByLabel('판단 근거').fill('svc-build의 인증 방식과 예약 일정, 빌드 runner의 실행 시각이 일치합니다.');
  await root.getByRole('button', { name: '보고서 제출' }).click();
  await expect(root.getByText('다음 임무 준비 중', { exact: false }).first()).toBeVisible();
  await expect(root.getByRole('heading', { name: '비정상 접근 기록' })).toBeVisible({ timeout: 30000 });
  expect((await event({ type: 'install', package: 'smbclient' })).status()).toBe(200);
  for (const path of ['auth/auth-2026-09-24.log', 'auth/auth-2026-09-26.log', 'build/build-runner.log']) expect((await event({ type: 'evidence', path })).status()).toBe(200);
  expect((await event({ type: 'visit', url: GITHUB_URL })).status()).toBe(200);
  expect((await event({ type: 'incident-report', report: {
    normalEvidence: 'auth/auth-2026-09-24.log', suspiciousEvidence: 'auth/auth-2026-09-26.log', automationEvidence: 'build/build-runner.log', publicCorroboration: GITHUB_URL,
    assessment: '추가 확인 필요', analystNote: '정상 세션과 source 및 시각이 다르고 01:30 자동 작업으로 설명되지 않습니다. 실제 사용자는 알 수 없습니다.',
  } })).status()).toBe(200);
  const saved = await db.user.findUniqueOrThrow({ where: { username } });
  expect((saved.gameProgress as { stage: number; highestStage: number }).stage).toBe(4);
  expect((await event({ type: 'rollback', stage: 3 })).status()).toBe(200);
  const replay = await db.user.findUniqueOrThrow({ where: { username } });
  expect((replay.gameProgress as { stage: number; highestStage: number }).stage).toBe(3);
  expect((replay.gameProgress as { stage: number; highestStage: number }).highestStage).toBe(4);
});
