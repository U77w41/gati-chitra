import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';

if (process.platform === 'darwin' && !process.env.CFFIXED_USER_HOME) {
  const userHome = path.join(os.tmpdir(), 'playwright-user-home');
  fs.mkdirSync(userHome, { recursive: true });
  process.env.CFFIXED_USER_HOME = userHome;
}

const basePath = process.env.BASE_PATH || '/';
const normalizedBase = basePath.endsWith('/') ? basePath : `${basePath}/`;
const baseURL = `http://localhost:4173${normalizedBase}`;

export default defineConfig({
  testDir: 'tests/e2e',
  use: {
    baseURL,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: /mobile\.spec\.ts/,
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testIgnore: /mobile\.spec\.ts/,
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testIgnore: /mobile\.spec\.ts/,
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
      testMatch: /mobile\.spec\.ts/,
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 14'] },
      testMatch: /mobile\.spec\.ts/,
    },
  ],
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      BASE_PATH: normalizedBase,
    },
  },
});
