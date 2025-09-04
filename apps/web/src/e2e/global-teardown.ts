/**
 * Playwright グローバルティアダウン
 * E2Eテスト実行後のクリーンアップ処理
 */

import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 E2Eテストのグローバルティアダウンを開始...');

  try {
    // テスト結果のレポート生成
    console.log('📊 テスト結果を処理中...');

    // テスト用データのクリーンアップ（必要に応じて）
    // await cleanupTestData();

    // 一時ファイルの削除
    // await cleanupTempFiles();

    console.log('✅ テスト環境のクリーンアップが完了しました');

  } catch (error) {
    console.error('❌ グローバルティアダウンでエラーが発生:', error);
    // エラーが発生してもテストの結果には影響させない
  }

  console.log('✅ E2Eテストのグローバルティアダウンが完了しました');
}

export default globalTeardown;