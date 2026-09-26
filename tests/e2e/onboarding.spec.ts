import { test, expect, type Page } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
const username = `qa_${Date.now().toString(36)}`;
const password = 'Test-workspace-42';
const baseURL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';
test.setTimeout(150000);
test.afterAll(async () => {
  await db.user.deleteMany({ where: { username } });
  await db.$disconnect();
});
async function screenshot(page: Page, name: string) {
  await page.screenshot({
    path: `test-results/${name}.png`,
    fullPage: true,
    animations: 'disabled',
  });
}
async function osLogin(page: Page) {
  await expect(page.getByRole('main', { name: 'OS 로그인', exact: true })).toBeVisible({
    timeout: 12000,
  });
  await page.getByLabel('OS 로그인 비밀번호').fill(password);
  await page.getByRole('button', { name: 'OS 로그인', exact: true }).click();
}
test('new analyst: KDE workspace, native applications, persistence and session lifecycle', async ({
  page,
  browser,
}) => {
  const fatal: string[] = [];
  page.on('pageerror', (e) => fatal.push(e.message));
  await page.goto('/');
  await page.getByRole('link', { name: '시작하기', exact: true }).click();
  for (let i = 0; i < 4; i++) {
    await page.getByRole('button', { name: i === 3 ? 'CREATE YOUR IDENTITY' : /계속하기/ }).click();
  }
  await expect(page).toHaveURL(/register/);
  await page.getByRole('button', { name: '계정 생성 및 시작' }).click();
  await expect(page.getByText('올바른 이메일 주소를 입력해 주세요.')).toBeVisible();
  await page.getByLabel('Username', { exact: true }).fill(username);
  await page.getByLabel('Email', { exact: true }).fill(`${username}@example.test`);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByLabel('Confirm password', { exact: true }).fill(password);
  await page.getByRole('button', { name: '계정 생성 및 시작' }).click();
  await expect(page.getByRole('main', { name: '워크스테이션 부팅' })).toBeVisible();
  await screenshot(page, 'plasma-boot');
  await expect(page.getByLabel('OS 로그인 비밀번호')).toBeVisible({ timeout: 12000 });
  await screenshot(page, 'os-login');
  await page.getByLabel('OS 로그인 비밀번호').fill('wrong-password');
  await page.getByRole('button', { name: 'OS 로그인', exact: true }).click();
  await expect(
    page.getByRole('main', { name: 'OS 로그인', exact: true }).getByRole('alert'),
  ).toContainText('계정 비밀번호가 일치하지 않습니다.');
  await osLogin(page);
  await expect(page.getByRole('heading', { name: '당신의 자리를 확인하세요.' })).toBeVisible({
    timeout: 12000,
  });
  await page.reload();
  await osLogin(page);
  await expect(page.getByRole('heading', { name: '당신의 자리를 확인하세요.' })).toBeVisible({
    timeout: 12000,
  });
  await page.getByLabel('표시 이름').fill('조사관 ROOT');
  await page.getByRole('button', { name: '워크스테이션 시작' }).click();
  const root = page.getByRole('region', { name: 'Project Root 창', exact: true });
  await expect(root.getByRole('region', { name: '세계관 안내' })).toBeVisible();
  await screenshot(page, 'world-briefing');
  for (let i = 0; i < 3; i++) await root.getByRole('button', { name: '계속', exact: true }).click();
  await root.getByRole('button', { name: '안내 마치기' }).click();
  await expect(root.getByRole('heading', { name: '환영합니다, 조사관 ROOT님.' })).toBeVisible();
  await expect(page.getByLabel('데스크톱 패널', { exact: true })).not.toContainText(username);
  await expect(root.getByRole('heading', { name: '워크스테이션 둘러보기' })).toBeVisible();
  await expect(page.getByRole('status')).toContainText('새 임무: 워크스테이션 둘러보기');
  await expect(root.getByText('Tip · 자유롭게 메모하세요')).toBeAttached();
  await screenshot(page, 'plasma-desktop');
  await root.getByRole('button', { name: '세계관 안내', exact: true }).click();
  await expect(root.getByRole('heading', { name: '지워진 것에도 흔적은 남습니다.' })).toBeVisible();
  await root.getByRole('button', { name: '닫기', exact: true }).click();
  // Native window drag, resize and context menu.
  const start = (await root.boundingBox())!;
  await root.locator('.kwin-titlebar').hover({ position: { x: 250, y: 15 } });
  await page.mouse.down();
  await page.mouse.move(start.x + 310, start.y + 45, { steps: 6 });
  await page.mouse.up();
  expect((await root.boundingBox())!.x).toBeGreaterThan(start.x);
  const beforeResize = (await root.boundingBox())!;
  await root.locator('.resize-bottom-right').hover();
  await page.mouse.down();
  await page.mouse.move(
    beforeResize.x + beforeResize.width - 100,
    beforeResize.y + beforeResize.height - 80,
    { steps: 5 },
  );
  await page.mouse.up();
  expect((await root.boundingBox())!.width).toBeLessThan(beforeResize.width);
  await root.locator('.kwin-titlebar').click({ button: 'right' });
  await page.getByRole('button', { name: '항상 위에 표시' }).click();
  await expect(root.locator('.window-caption svg')).toHaveCount(1);
  await root.locator('.kwin-titlebar').click({ button: 'right' });
  await page.getByRole('button', { name: '항상 위에 표시' }).click();
  await root.getByRole('button', { name: 'Project Root 최대화' }).click();
  expect((await root.boundingBox())!.width).toBe(1440);
  await root.getByRole('button', { name: 'Project Root 복원' }).click();
  await root.getByRole('button', { name: 'Project Root 최대화' }).click();
  await root.locator('.kwin-titlebar').hover({ position: { x: 400, y: 15 } });
  await page.mouse.down();
  await page.mouse.move(500, 150, { steps: 8 });
  await page.mouse.up();
  await expect(root).not.toHaveClass(/maximized/);
  expect((await root.boundingBox())!.width).toBeLessThan(1440);
  await root.getByRole('button', { name: 'Project Root 최소화' }).click();
  const surface = page.getByLabel('바탕화면', { exact: true });
  const icon = surface.getByRole('button', { name: 'Firefox', exact: true });
  const old = (await icon.boundingBox())!;
  await icon.hover();
  await page.mouse.down();
  await page.mouse.move(old.x + 250, old.y + 70, { steps: 8 });
  await page.mouse.up();
  expect((await icon.boundingBox())!.x).toBeGreaterThan(old.x + 100);
  const iconX = (await icon.boundingBox())!.x;
  await surface.click({ button: 'right', position: { x: 800, y: 300 } });
  await page.getByRole('button', { name: '새 폴더…', exact: true }).click();
  await page.getByRole('textbox', { name: '항목 이름' }).fill('조사 자료');
  await page.getByRole('button', { name: '확인', exact: true }).click();
  const folder = surface.getByRole('button', { name: '조사 자료', exact: true });
  await expect(folder).toBeVisible();
  await folder.click({ button: 'right' });
  await page.getByRole('button', { name: /이름 바꾸기/ }).click();
  await page.getByRole('textbox', { name: '항목 이름' }).fill('첫 조사');
  await page.getByRole('button', { name: '확인', exact: true }).click();
  await expect(surface.getByRole('button', { name: '첫 조사', exact: true })).toBeVisible();
  await screenshot(page, 'desktop-context-ready');
  // Firefox tab history, bookmarks, intranet and shared download.
  await page.getByRole('button', { name: 'Firefox 실행 또는 복원' }).click();
  const firefox = page.getByRole('region', { name: 'Firefox 창', exact: true });
  await expect(firefox.getByRole('heading', { name: 'Firefox', exact: true })).toBeVisible();
  await screenshot(page, 'firefox');
  await firefox.getByRole('button', { name: '새 탭', exact: true }).click();
  await expect(firefox.getByRole('tab')).toHaveCount(2);
  await firefox.getByRole('textbox', { name: 'Firefox 주소창' }).fill('https://portal.root');
  await firefox.getByRole('textbox', { name: 'Firefox 주소창' }).press('Enter');
  await expect(firefox.getByRole('heading', { name: /좋은 조사는/ })).toBeVisible();
  await firefox.getByRole('button', { name: '워크스테이션 안내 다운로드' }).click();
  await expect(
    firefox.locator('.download-item').filter({ hasText: 'Project-Root-Guide.txt' }),
  ).toBeVisible();
  await firefox.getByRole('button', { name: '뒤로', exact: true }).click();
  await expect(firefox.getByRole('heading', { name: 'Firefox', exact: true })).toBeVisible();
  await firefox.getByRole('button', { name: '앞으로', exact: true }).click();
  await expect(firefox.getByRole('heading', { name: /좋은 조사는/ })).toBeVisible();
  await firefox.getByRole('button', { name: 'Firefox 메뉴' }).click();
  await expect(firefox.getByRole('button', { name: '확대', exact: true })).toBeVisible();
  await firefox.getByRole('button', { name: '확대', exact: true }).click();
  await expect(firefox.locator('.firefox-zoom')).toContainText('110%');
  await firefox.getByRole('button', { name: 'Firefox 메뉴' }).click();
  await firefox.getByRole('button', { name: 'Firefox 닫기' }).click();
  // One filesystem shared by Konsole and Dolphin.
  await page.getByRole('button', { name: 'Konsole 실행 또는 복원' }).click();
  const terminal = page.getByRole('region', { name: 'Konsole 창', exact: true });
  await terminal.getByLabel('터미널 명령어').fill('echo evidence > Documents/note.txt');
  await terminal.getByLabel('터미널 명령어').press('Enter');
  await terminal.getByLabel('터미널 명령어').fill('cat Documents/note.txt');
  await terminal.getByLabel('터미널 명령어').press('Enter');
  await expect(terminal.locator('pre').last()).toHaveText('evidence\n');
  await screenshot(page, 'konsole');
  await terminal.getByRole('button', { name: 'Konsole 닫기' }).click();
  await page.getByRole('button', { name: 'Dolphin 실행 또는 복원' }).click();
  const dolphin = page.getByRole('region', { name: 'Dolphin 창', exact: true });
  await dolphin
    .locator('.dolphin-places')
    .getByRole('button', { name: '문서', exact: true })
    .click();
  await expect(dolphin.getByRole('button', { name: 'note.txt', exact: true })).toBeVisible();
  await dolphin.getByRole('button', { name: 'note.txt', exact: true }).dblclick();
  await expect(page.getByLabel('파일 내용')).toHaveValue('evidence\n');
  const editor = page.getByRole('region', { name: 'KWrite 창', exact: true });
  await editor.getByLabel('파일 내용').fill('첫 번째 자유 메모\n컴퓨터 둘러보기');
  await editor.getByLabel('파일 내용').press('Control+s');
  await expect(editor.locator('.kwrite-tab')).toContainText('저장됨');
  await screenshot(page, 'kwrite');
  await editor.getByRole('button', { name: '새 문서', exact: true }).click();
  await editor.getByLabel('파일 내용').fill('내가 원하는 자유 메모');
  await editor.getByLabel('파일 내용').press('Control+s');
  await page.getByLabel('텍스트 파일 경로').fill(`/home/${username}/Desktop/자유 메모.txt`);
  await page.getByRole('dialog').getByRole('button', { name: '저장', exact: true }).click();
  await expect(editor.locator('.kwrite-tab')).toContainText('자유 메모.txt');
  await expect(surface.getByRole('button', { name: '자유 메모.txt', exact: true })).toBeAttached();
  await editor.getByRole('button', { name: 'KWrite 닫기' }).click();
  await dolphin
    .locator('.dolphin-places')
    .getByRole('button', { name: '다운로드', exact: true })
    .click();
  await expect(
    dolphin.getByRole('button', { name: 'Project-Root-Guide.txt', exact: true }),
  ).toBeVisible();
  await screenshot(page, 'dolphin');
  await dolphin.locator('.dolphin-places').getByRole('button', { name: '홈', exact: true }).click();
  await dolphin.getByRole('button', { name: 'Downloads', exact: true }).click();
  await page.keyboard.press('Delete');
  await expect(dolphin.getByRole('alert')).toContainText('워크스테이션의 기본 폴더');
  await expect(dolphin.getByRole('button', { name: 'Downloads', exact: true })).toBeVisible();
  await dolphin.getByRole('button', { name: 'Dolphin 닫기' }).click();
  await page.getByRole('button', { name: 'KMail 실행 또는 복원' }).click();
  const mail = page.getByRole('region', { name: 'KMail 창', exact: true });
  await screenshot(page, 'kmail');
  await mail.getByRole('button', { name: '새 메시지', exact: true }).click();
  await page.getByLabel('메일 제목').fill('조사 준비');
  await page.getByLabel('메일 본문').fill('워크스테이션 확인 완료');
  await page.getByRole('button', { name: '임시 저장', exact: true }).click();
  await mail.getByRole('button', { name: /임시 보관함/ }).click();
  await expect(mail.getByRole('heading', { name: '조사 준비', exact: true })).toBeVisible();
  await mail.getByRole('button', { name: 'KMail 닫기' }).click();
  // OS settings have no profile fields and actually change the desktop.
  await page.getByRole('button', { name: '시스템 설정 실행 또는 복원' }).click();
  const settings = page.getByRole('region', { name: '시스템 설정 창', exact: true });
  await expect(settings.getByRole('heading', { name: '빠른 설정' })).toBeVisible();
  await expect(settings.getByLabel('표시 이름', { exact: true })).toHaveCount(0);
  await screenshot(page, 'system-settings');
  await settings.getByRole('button', { name: 'Breeze Dark', exact: true }).click();
  await settings.getByRole('button', { name: '적용', exact: true }).click();
  await expect(page.locator('.plasma-workspace')).toHaveClass(/theme-breeze-dark/);
  await settings
    .locator('.settings-categories')
    .getByRole('button', { name: '바탕화면 및 패널', exact: true })
    .click();
  await settings.getByLabel('패널 위치').selectOption('top');
  await settings.getByRole('button', { name: '적용', exact: true }).click();
  await expect(page.locator('.plasma-workspace')).toHaveClass(/panel-top/);
  await settings.getByLabel('패널 위치').selectOption('bottom');
  await settings.getByRole('button', { name: '적용', exact: true }).click();
  await settings
    .locator('.settings-categories')
    .getByRole('button', { name: '빠른 설정', exact: true })
    .click();
  await settings.getByRole('button', { name: 'Breeze', exact: true }).click();
  await settings.getByRole('button', { name: '적용', exact: true }).click();
  await settings.getByRole('button', { name: '시스템 설정 닫기' }).click();
  await page.reload();
  await osLogin(page);
  await expect(root.getByRole('heading', { name: '환영합니다, 조사관 ROOT님.' })).toBeVisible({
    timeout: 12000,
  });
  await expect(root.getByRole('region', { name: '세계관 안내' })).toHaveCount(0);
  await root.getByRole('button', { name: 'Project Root 최소화' }).click();
  await expect(icon).toHaveCSS('left', `${iconX}px`);
  await expect(surface.getByRole('button', { name: '첫 조사', exact: true })).toBeVisible();
  await surface.getByRole('button', { name: '자유 메모.txt', exact: true }).dblclick();
  await expect(editor.getByLabel('파일 내용')).toHaveValue('내가 원하는 자유 메모');
  await editor.getByLabel('파일 내용').fill('저장하지 않은 초안도 보관');
  await editor.getByRole('button', { name: 'KWrite 닫기' }).click();
  await page.getByRole('button', { name: 'KWrite 실행 또는 복원' }).click();
  await expect(editor.getByLabel('파일 내용')).toHaveValue('저장하지 않은 초안도 보관');
  await editor.getByRole('button', { name: 'KWrite 닫기' }).click();
  await page.getByRole('button', { name: '프로그램 실행 메뉴', exact: true }).click();
  await screenshot(page, 'plasma-launcher');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: '오디오 음량', exact: true }).click();
  await expect(page.getByLabel('트레이 음량')).toBeVisible();
  const audioTray = page.getByRole('region', { name: '오디오 트레이', exact: true });
  await expect(audioTray).toHaveCSS('display', 'block');
  const audioHeader = (await audioTray.locator('header').boundingBox())!;
  expect((await audioTray.locator('.tray-device').boundingBox())!.y).toBeGreaterThanOrEqual(
    audioHeader.y + audioHeader.height,
  );
  expect(await audioTray.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  await screenshot(page, 'audio-tray');
  await page.getByRole('button', { name: '트레이 닫기' }).click();
  await page.getByRole('button', { name: '네트워크', exact: true }).click();
  const networkTray = page.getByRole('region', { name: '네트워크 트레이', exact: true });
  await expect(networkTray).toHaveCSS('display', 'block');
  const networkHeader = (await networkTray.locator('header').boundingBox())!;
  expect((await networkTray.locator('.tray-toggles').boundingBox())!.y).toBeGreaterThanOrEqual(
    networkHeader.y + networkHeader.height,
  );
  expect(await networkTray.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  await screenshot(page, 'network-tray');
  await page.getByRole('button', { name: '트레이 닫기' }).click();
  await page.getByRole('button', { name: 'Project Root 실행 또는 복원' }).click();
  await root.getByRole('button', { name: '내 프로필', exact: true }).click();
  await expect(root.getByLabel('표시 이름')).toBeVisible();
  await root.getByRole('button', { name: '워크스테이션 종료', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: '종료', exact: true }).click();
  await expect(page).toHaveURL(baseURL + '/');
  await expect(page.getByRole('link', { name: '로그인', exact: true })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('link', { name: '워크스테이션 켜기', exact: true })).toBeVisible();
  await page.getByRole('link', { name: '워크스테이션 켜기', exact: true }).click();
  await expect(page.getByRole('main', { name: '워크스테이션 부팅' })).toBeVisible();
  await osLogin(page);
  await expect(root).toBeVisible({ timeout: 12000 });
  await page.keyboard.press('Control+Alt+l');
  await expect(page.getByLabel('잠금 해제 비밀번호')).toBeVisible();
  await page.getByLabel('잠금 해제 비밀번호').fill(password);
  await page.getByRole('button', { name: '잠금 해제', exact: true }).click();
  await expect(page.getByLabel('잠금 해제 비밀번호')).toHaveCount(0);
  await root.getByRole('button', { name: '로그아웃', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: '로그아웃', exact: true }).click();
  await expect(page).toHaveURL(/login/);
  await page.getByLabel('Username or email').fill(username);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: '워크스테이션 연결' }).click();
  await expect(page.getByRole('main', { name: '워크스테이션 부팅' })).toBeVisible();
  await osLogin(page);
  await expect(root).toBeVisible({ timeout: 12000 });
  // Mobile and laptop layouts remain bounded.
  await page.setViewportSize({ width: 1366, height: 768 });
  await screenshot(page, 'plasma-laptop');
  await page.setViewportSize({ width: 390, height: 844 });
  await screenshot(page, 'plasma-mobile');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  const unauthorized = await browser.newContext();
  expect(
    (
      await unauthorized.request.put(`${baseURL}/api/settings`, {
        headers: { origin: baseURL },
        data: {},
      })
    ).status(),
  ).toBe(401);
  expect(
    (
      await page.request.put('/api/settings', {
        headers: { origin: 'https://untrusted.example' },
        data: {},
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await unauthorized.request.post(`${baseURL}/api/auth/unlock`, {
        headers: { origin: baseURL },
        data: { password },
      })
    ).status(),
  ).toBe(401);
  expect(
    (
      await page.request.post('/api/auth/unlock', {
        headers: { origin: 'https://untrusted.example' },
        data: { password },
      })
    ).status(),
  ).toBe(403);
  await unauthorized.close();
  const user = await db.user.findUniqueOrThrow({ where: { username } });
  expect(user.briefingCompleted).toBe(true);
  expect(user.passwordHash).not.toContain(password);
  expect(fatal).toEqual([]);
});
