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
