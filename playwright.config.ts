import { defineConfig } from '@playwright/test';
import { loadEnvFile } from 'node:process';
loadEnvFile('.env');
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  use: {
    actionTimeout: 10000,
    channel: process.env.TEST_BROWSER_CHANNEL === 'chrome' ? 'chrome' : undefined,
    baseURL: process.env.TEST_BASE_URL || 'http://127.0.0.1:3000',
    viewport: { width: 1440, height: 1000 },
    trace: 'retain-on-failure',
  },
  reporter: 'list',
});
