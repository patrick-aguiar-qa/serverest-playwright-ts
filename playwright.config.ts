import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.BASE_URL ?? 'https://front.serverest.dev';
const apiURL = process.env.API_URL ?? 'https://serverest.dev';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // The public ServeRest server is shared: 1 retry absorbs network noise, real failures still fail twice
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 4,
  // UI tests load the shared public catalog (hundreds of products); Firefox needs the extra time
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI
    ? [['github'], ['list'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    actionTimeout: 10_000,
  },
  projects: [
    {
      name: 'api',
      testDir: './tests/api',
      use: { baseURL: apiURL },
    },
    {
      name: 'chromium',
      testDir: './tests/ui',
      grepInvert: /@mobile/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      testDir: './tests/ui',
      grepInvert: /@mobile/,
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'mobile',
      testDir: './tests/ui',
      grep: /@mobile/,
      use: { ...devices['Pixel 7'] },
    },
  ],
});
