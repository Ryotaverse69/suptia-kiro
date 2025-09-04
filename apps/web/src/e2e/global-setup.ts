/**
 * Playwright グローバルセットアップ
 * E2Eテスト実行前の初期化処理
 */

import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 E2Eテストのグローバルセットアップを開始...');

  // ブラウザを起動してアプリケーションの準備状態を確認
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // アプリケーションが起動するまで待機
    const baseURL = config.projects[0].use.baseURL || 'http://localhost:3000';
    console.log(`📡 アプリケーションの起動を確認中: ${baseURL}`);
    
    await page.goto(baseURL, { waitUntil: 'networkidle' });
    
    // 基本的なページ要素が読み込まれているか確認
    await page.waitForSelector('header', { timeout: 10000 });
    await page.waitForSelector('main', { timeout: 10000 });
    
    console.log('✅ アプリケーションの起動を確認しました');

    // テスト用のデータベース状態をリセット（必要に応じて）
    // await resetTestDatabase();

    // テスト用のキャッシュをクリア
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    console.log('🧹 テスト環境をクリーンアップしました');

  } catch (error) {
    console.error('❌ グローバルセットアップでエラーが発生:', error);
    throw error;
  } finally {
    await browser.close();
  }

  console.log('✅ E2Eテストのグローバルセットアップが完了しました');
}

export default globalSetup;