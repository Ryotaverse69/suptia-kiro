import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2Eテスト設定
 * 重要なユーザーフローのテストを実行
 */
export default defineConfig({
  testDir: './src/e2e',
  /* 並列実行の設定 */
  fullyParallel: true,
  /* CI環境での失敗時の動作 */
  forbidOnly: !!process.env.CI,
  /* CI環境でのリトライ設定 */
  retries: process.env.CI ? 2 : 0,
  /* 並列実行するワーカー数 */
  workers: process.env.CI ? 1 : undefined,
  /* レポーター設定 */
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/e2e-results.json' }],
    ['junit', { outputFile: 'test-results/e2e-results.xml' }],
  ],
  /* 共通設定 */
  use: {
    /* ベースURL */
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    /* スクリーンショット設定 */
    screenshot: 'only-on-failure',
    /* ビデオ録画設定 */
    video: 'retain-on-failure',
    /* トレース設定 */
    trace: 'on-first-retry',
    /* ロケール設定 */
    locale: 'ja-JP',
    /* タイムゾーン設定 */
    timezoneId: 'Asia/Tokyo',
  },

  /* プロジェクト設定（ブラウザ別） */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    /* モバイルテスト */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
    /* タブレットテスト */
    {
      name: 'Tablet',
      use: { ...devices['iPad Pro'] },
    },
  ],

  /* 開発サーバー設定 */
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  /* テスト実行時の設定 */
  timeout: 30 * 1000,
  expect: {
    timeout: 5 * 1000,
  },

  /* グローバル設定 */
  globalSetup: './src/e2e/global-setup.ts',
  globalTeardown: './src/e2e/global-teardown.ts',
});