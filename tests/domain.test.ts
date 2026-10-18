import { test } from 'node:test';
import assert from 'node:assert/strict';
import { registrationSchema, profileSchema } from '../src/lib/validation';
import { hashPassword, verifyPassword } from '../src/server/password';
import { windowReducer, initialWindows, clampPosition } from '../src/components/windows/state';
const valid = {
  username: 'analyst_01',
  email: 'analyst@example.test',
  password: 'long-password-01',
  confirmPassword: 'long-password-01',
};
test('registration normalizes identity and rejects malformed credentials', () => {
  assert.equal(
    registrationSchema.parse({
      ...valid,
      username: ' Analyst_01 ',
      email: ' Analyst@Example.test ',
    }).username,
    'analyst_01',
  );
  for (const patch of [
    { username: '../root' },
    { username: '2root' },
    { username: 'ab' },
    { email: 'invalid' },
    { password: 'short' },
    { confirmPassword: 'wrong' },
  ])
    assert.equal(registrationSchema.safeParse({ ...valid, ...patch }).success, false);
  assert.equal(profileSchema.safeParse({ displayName: ' ', wallpaper: 'slate' }).success, false);
  assert.equal(profileSchema.safeParse({ displayName: 'Root', wallpaper: 'other' }).success, false);
});
test('password hashes are salted, verify correctly, and never contain password', async () => {
  const first = await hashPassword(valid.password);
  const second = await hashPassword(valid.password);
  assert.notEqual(first, second);
  assert.equal(first.includes(valid.password), false);
  assert.equal(await verifyPassword(valid.password, first), true);
  assert.equal(await verifyPassword('wrong', first), false);
});
test('window focus, restore, maximize and close maintain independent windows', () => {
  let windows = windowReducer(initialWindows, { type: 'open', id: 'terminal' });
  windows = windowReducer(windows, { type: 'minimize', id: 'terminal' });
  assert.equal(windows.find((w) => w.id === 'terminal')!.minimized, true);
  windows = windowReducer(windows, { type: 'open', id: 'terminal' });
  assert.equal(windows.length, 2);
  assert.equal(windows[1].minimized, false);
  windows = windowReducer(windows, { type: 'focus', id: 'root' });
  assert.ok(windows[0].z > windows[1].z);
  windows = windowReducer(windows, { type: 'maximize', id: 'root' });
  assert.equal(windows[0].maximized, true);
  windows = windowReducer(windows, { type: 'close', id: 'root' });
  assert.equal(windows[0].id, 'terminal');
  assert.equal(windows.length, 1);
});
test('drag bounds keep titlebar and window inside a resized viewport', () => {
  assert.deepEqual(clampPosition(-100, -50, 850, 600, 1366, 900), { x: 0, y: 0 });
  assert.deepEqual(clampPosition(2000, 2000, 850, 600, 1366, 900), { x: 516, y: 238 });
  assert.deepEqual(clampPosition(200, 80, 850, 600, 390, 700), { x: 0, y: 38 });
});

import {
  initialFiles,
  runCommand,
  homePath,
  pasteFiles,
  moveToTrash,
  trashPath,
  renameFile,
  repairSystemDirectories,
} from '../src/game/filesystem';
import { osSettingsSchema } from '../src/lib/os-settings';
test('terminal writes and moves files through the shared VFS without host execution', () => {
  const user = 'tester';
  const home = homePath(user);
  const files = initialFiles(user);
  const written = runCommand('echo hello > Documents/note.txt', home, files, user, []);
  assert.equal(
    written.files.find((f) => f.path === home + '/Documents/note.txt')?.content,
    'hello\n',
  );
  assert.equal(
    runCommand('cat Documents/note.txt', home, written.files, user, []).output,
    'hello\n',
  );
  assert.match(runCommand('touch /etc/passwd', home, files, user, []).output, /Permission denied/);
  assert.match(
    runCommand('curl https://example.com', home, files, user, []).output,
    /command not found/,
  );
  const copied = pasteFiles(
    written.files,
    [home + '/Documents/note.txt'],
    home + '/Downloads',
    false,
  );
  assert.ok(copied.some((f) => f.path === home + '/Downloads/note.txt'));
  const trashed = moveToTrash(copied, [home + '/Downloads/note.txt'], user);
  assert.ok(trashed.some((f) => f.path === trashPath(user) + '/note.txt'));
  assert.throws(() => pasteFiles(files, [home + '/Documents'], home + '/Documents', true));
});
test('OS settings validate bounds and keep account fields separate', () => {
  assert.equal(osSettingsSchema.parse({}).theme, 'breeze');
  assert.equal(osSettingsSchema.safeParse({ volume: 101 }).success, false);
  assert.equal(osSettingsSchema.safeParse({ brightness: 0 }).success, false);
  assert.equal(osSettingsSchema.safeParse({ username: 'intruder' }).success, false);
  assert.equal(
    osSettingsSchema.safeParse({ wallpaper: 'https://external.example' }).success,
    false,
  );
});
test('window snapping, resizing and virtual desktops preserve restore geometry', () => {
  let state = windowReducer(initialWindows, { type: 'snap', id: 'root', side: 'left' });
  assert.equal(state[0].snap, 'left');
  assert.equal(state[0].width, 1040);
  state = windowReducer(state, { type: 'desktop', id: 'root', desktop: 1 });
  assert.equal(state[0].desktop, 1);
  state = windowReducer(state, { type: 'resize', id: 'root', width: 850, height: 600 });
  assert.equal(state[0].width, 850);
});

test('essential directories reject delete, rename and cut atomically, while personal files remain mutable', () => {
  const files = initialFiles('tester');
  const home = homePath('tester');
  for (const path of [
    '/',
    '/home',
    home,
    home + '/Downloads',
    home + '/Documents',
    home + '/.local/share/Trash/files',
  ]) {
    assert.throws(() => moveToTrash(files, [path], 'tester'), /기본 폴더/);
    assert.throws(() => renameFile(files, path, home + '/renamed'), /기본 폴더/);
    assert.throws(() => pasteFiles(files, [path], home + '/Desktop', true), /기본 폴더/);
  }
  const broken = files.filter((f) => f.path !== home + '/Downloads');
  assert.ok(
    repairSystemDirectories(broken, 'tester').some(
      (f) => f.path === home + '/Downloads' && f.kind === 'directory',
    ),
  );
  assert.ok(
    moveToTrash(files, [home + '/Documents/Welcome.txt'], 'tester').some(
      (f) => f.path === trashPath('tester') + '/Welcome.txt',
    ),
  );
});

import {
  searchWorld,
  OFFICIAL_URL,
  GITHUB_URL,
  THREADS_URL,
  canonicalWorldUrl,
} from '../src/game/world';
import { advanceProgress, readProgress } from '../src/game/missions';
import { buildEvidence, CHANGELOG_URL, CURRENT_RECORD_URL } from '../src/game/cases';
test('Google virtual search and exact host routing', () => {
  for (const query of ['프로젝트', '프로젝트루트', 'project', 'PROJECT ROOT', 'projectroot.kro.kr'])
    assert.ok(searchWorld(query).some((x) => x.url === OFFICIAL_URL));
  assert.ok(searchWorld('윤서하').some((x) => x.url === GITHUB_URL));
  assert.ok(searchWorld('윤서하').some((x) => x.url === THREADS_URL));
  assert.equal(canonicalWorldUrl('http://www.projectroot.kro.kr/?from=google'), OFFICIAL_URL);
  assert.equal(canonicalWorldUrl('https://projectroot.kro.kr.evil.test'), null);
  assert.equal(canonicalWorldUrl('https://github.com/not-real'), null);
});
test('orientation and three cases advance in order and require their own evidence', () => {
  let progress = readProgress({});
  assert.equal(progress.stage, 1);
  assert.throws(() => advanceProgress(progress, { type: 'rollback', stage: 3 }), /아직 배정/);
  progress = advanceProgress(progress, { type: 'hint' }).progress;
  assert.equal(progress.hintsUsed['2'], 0);
  progress = advanceProgress(progress, { type: 'visit', url: OFFICIAL_URL }).progress;
  assert.equal(progress.stage, 1);
  assert.equal(progress.pendingStage, 2);
  assert.equal(advanceProgress(progress, { type: 'activate' }, Date.parse(progress.nextMissionAt!) - 1).assigned, false);
  progress = advanceProgress(progress, { type: 'activate' }, Date.parse(progress.nextMissionAt!)).progress;
  assert.equal(progress.stage, 2);
  progress = advanceProgress(progress, { type: 'hint' }).progress;
  assert.equal(progress.hintsUsed['2'], 1);
  const link = { currentUrl: CURRENT_RECORD_URL, changeUrl: CHANGELOG_URL, conclusion: '주소 이동/갱신' as const, note: '공식 자료와 공개 변경 이력의 주소가 일치합니다.' };
  assert.throws(() => advanceProgress(progress, { type: 'link-report', report: link }), /공식 자료/);
  for (const url of [CURRENT_RECORD_URL, CHANGELOG_URL])
    progress = advanceProgress(progress, { type: 'visit', url }).progress;
  progress = advanceProgress(progress, { type: 'link-report', report: link }).progress;
  assert.equal(progress.stage, 2);
  assert.equal(progress.pendingStage, 3);
  assert.equal(advanceProgress(progress, { type: 'activate' }, Date.parse(progress.nextMissionAt!) - 1).assigned, false);
  progress = advanceProgress(progress, { type: 'activate' }, Date.parse(progress.nextMissionAt!)).progress;
  assert.equal(progress.stage, 3);
  const build = { classification: '예정된 자동 작업' as const, note: 'svc-build가 예약된 runner에서 service-token으로 실행했습니다.' };
  assert.throws(() => advanceProgress(progress, { type: 'build-report', report: build }), /기록 세 개/);
  for (const path of Object.values(buildEvidence))
    progress = advanceProgress(progress, { type: 'evidence', path }).progress;
  progress = advanceProgress(progress, { type: 'build-report', report: build }).progress;
  assert.equal(progress.stage, 3);
  assert.equal(progress.pendingStage, 4);
  progress = advanceProgress(progress, { type: 'activate' }, Date.parse(progress.nextMissionAt!)).progress;
  assert.equal(progress.stage, 4);
  progress = advanceProgress(progress, { type: 'install', package: 'smbclient' }).progress;
  for (const path of [
    'auth/auth-2026-09-24.log',
    'auth/auth-2026-09-26.log',
    'build/build-runner.log',
  ])
    progress = advanceProgress(progress, { type: 'evidence', path }).progress;
  progress = advanceProgress(progress, { type: 'visit', url: GITHUB_URL }).progress;
  const report = {
    normalEvidence: 'auth/auth-2026-09-24.log',
    suspiciousEvidence: 'auth/auth-2026-09-26.log',
    automationEvidence: 'build/build-runner.log',
    publicCorroboration: GITHUB_URL,
    assessment: '추가 확인 필요' as const,
    analystNote:
      '이전 정상 세션과 source가 다르고 자동 빌드 활동과도 구분됩니다. 주체는 확인되지 않았습니다.',
  };
  const result = advanceProgress(progress, { type: 'incident-report', report });
  assert.equal(result.completed, true);
  assert.equal(result.progress.stage, 5);
  progress = advanceProgress(result.progress, { type: 'rollback', stage: 4 }).progress;
  assert.equal(progress.stage, 4);
  assert.equal(progress.highestStage, 5);
  assert.deepEqual(progress.evidence, []);
});
test('previous mission saves retain internal-access progress', () => {
  const migrated = readProgress({ stage: 1, highestStage: 1, installedPackages: { smbclient: true } });
  assert.equal(migrated.stage, 4);
  assert.equal(migrated.installedPackages.smbclient, true);
});
