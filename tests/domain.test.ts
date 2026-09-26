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
  PROFILE_URL,
  THREAD_URL,
  canonicalWorldUrl,
} from '../src/game/world';
import { advanceProgress, readProgress } from '../src/game/missions';
test('Index matches Korean and English aliases and uses exact virtual hosts', () => {
  for (const query of [
    '프로젝트루트',
    '프로젝트 루트',
    'PROJECT ROOT',
    'projectroot',
    'project root 공식사이트',
    'projectroot.kro.kr',
  ])
    assert.equal(searchWorld(query)[0]?.url, OFFICIAL_URL);
  assert.equal(searchWorld('아무 결과도 없는 검색어').length, 0);
  assert.equal(searchWorld('윤서하').length, 2);
  assert.equal(canonicalWorldUrl('http://www.projectroot.kro.kr/?from=index'), OFFICIAL_URL);
  assert.equal(canonicalWorldUrl('https://projectroot.kro.kr.evil.test'), null);
  assert.equal(canonicalWorldUrl('https://evil.test/?next=projectroot.kro.kr'), null);
});
test('missions assign once, verify visited evidence, and retain history through rollback', () => {
  let progress = readProgress({});
  assert.throws(() => advanceProgress(progress, { type: 'rollback', stage: 1 }), /아직 배정/);
  let result = advanceProgress(progress, { type: 'visit', url: OFFICIAL_URL });
  assert.equal(result.assigned, true);
  progress = result.progress;
  assert.equal(advanceProgress(progress, { type: 'visit', url: OFFICIAL_URL }).assigned, false);
  assert.throws(
    () =>
      advanceProgress(progress, {
        type: 'report',
        handle: 'seoha_y',
        sources: [PROFILE_URL, THREAD_URL],
      }),
    /직접 확인/,
  );
  for (const url of [PROFILE_URL, THREAD_URL])
    progress = advanceProgress(progress, { type: 'visit', url }).progress;
  assert.throws(
    () =>
      advanceProgress(progress, {
        type: 'report',
        handle: 'wrong',
        sources: [PROFILE_URL, THREAD_URL],
      }),
    /계정/,
  );
  result = advanceProgress(progress, {
    type: 'report',
    handle: '@seoha_y',
    sources: [PROFILE_URL, THREAD_URL],
  });
  assert.equal(result.completed, true);
  progress = result.progress;
  assert.equal(progress.stage, 2);
  progress = advanceProgress(progress, { type: 'rollback', stage: 0 }).progress;
  assert.equal(progress.stage, 0);
  assert.equal(progress.highestStage, 2);
  assert.deepEqual(progress.visited, []);
  progress = advanceProgress(progress, { type: 'rollback', stage: 1 }).progress;
  assert.equal(progress.stage, 1);
  assert.deepEqual(progress.visited, [OFFICIAL_URL]);
  assert.throws(
    () =>
      advanceProgress(progress, {
        type: 'report',
        handle: 'seoha_y',
        sources: [PROFILE_URL, THREAD_URL],
      }),
    /직접 확인/,
  );
});
