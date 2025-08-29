#!/usr/bin/env node

/**
 * Trust承認ポリシー初期化スクリプトのデモンストレーション
 * 
 * このスクリプトは初期化機能の動作を確認するためのデモです。
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const DEMO_DIR = '.kiro-demo';

/**
 * デモ環境のセットアップ
 */
async function setupDemoEnvironment() {
  console.log('🔧 デモ環境をセットアップ中...');
  
  // デモディレクトリの作成
  await fs.mkdir(DEMO_DIR, { recursive: true });
  await fs.mkdir(join(DEMO_DIR, 'settings'), { recursive: true });
  await fs.mkdir(join(DEMO_DIR, 'lib', 'trust-policy'), { recursive: true });
  
  // デフォルト設定ファイルをコピー
  const defaultPolicy = await fs.readFile('.kiro/lib/trust-policy/default-policy.json', 'utf-8');
  await fs.writeFile(join(DEMO_DIR, 'lib', 'trust-policy', 'default-policy.json'), defaultPolicy);
  
  console.log('✅ デモ環境のセットアップ完了');
}

/**
 * 既存設定のシミュレーション
 */
async function createExistingConfig() {
  console.log('📝 既存設定をシミュレーション...');
  
  const existingPolicy = {
    version: '0.9',
    lastUpdated: '2025-08-26T10:00:00Z',
    autoApprove: {
      gitOperations: ['status', 'commit', 'push'],
      fileOperations: ['read', 'write']
    },
    manualApprove: {
      deleteOperations: ['rm -rf'],
      forceOperations: ['git push --force']
    },
    security: {
      maxAutoApprovalPerHour: 500,
      suspiciousPatternDetection: false,
      logAllOperations: true
    }
  };
  
  const policyPath = join(DEMO_DIR, 'settings', 'trust-policy.json');
  await fs.writeFile(policyPath, JSON.stringify(existingPolicy, null, 2));
  
  console.log('✅ 既存設定（v0.9）を作成しました');
  console.log('   - Git操作: status, commit, push');
  console.log('   - 最大自動承認: 500/時間');
  console.log('   - 不審パターン検出: 無効');
}

/**
 * 初期化スクリプトのデモ実行
 */
async function runInitializationDemo() {
  console.log('\n🚀 初期化スクリプトのデモを開始します...\n');
  
  try {
    // 1. ドライランでの移行確認
    console.log('=== 1. ドライラン（変更内容の確認） ===');
    const dryRunResult = execSync(
      `cd ${DEMO_DIR} && node ../.kiro/scripts/init-trust-policy.mjs --migrate --dry-run --verbose`,
      { encoding: 'utf-8' }
    );
    console.log(dryRunResult);
    
    // 2. 実際の段階的移行
    console.log('\n=== 2. 段階的移行の実行 ===');
    const migrateResult = execSync(
      `cd ${DEMO_DIR} && node ../.kiro/scripts/init-trust-policy.mjs --migrate --verbose`,
      { encoding: 'utf-8' }
    );
    console.log(migrateResult);
    
    // 3. 移行結果の確認
    console.log('\n=== 3. 移行結果の確認 ===');
    const policyPath = join(DEMO_DIR, 'settings', 'trust-policy.json');
    const migratedContent = await fs.readFile(policyPath, 'utf-8');
    const migratedPolicy = JSON.parse(migratedContent);
    
    console.log('📋 移行後の設定:');
    console.log(`   バージョン: ${migratedPolicy.version}`);
    console.log(`   Git操作数: ${migratedPolicy.autoApprove.gitOperations.length}`);
    console.log(`   ファイル操作数: ${migratedPolicy.autoApprove.fileOperations.length}`);
    console.log(`   最大自動承認: ${migratedPolicy.security.maxAutoApprovalPerHour}/時間`);
    console.log(`   不審パターン検出: ${migratedPolicy.security.suspiciousPatternDetection ? '有効' : '無効'}`);
    
    // 4. バックアップの確認
    console.log('\n=== 4. バックアップの確認 ===');
    const backupDir = join(DEMO_DIR, 'backups');
    const backupFiles = await fs.readdir(backupDir);
    console.log(`📦 作成されたバックアップ: ${backupFiles.length} 件`);
    
    for (const backupFile of backupFiles) {
      const backupPath = join(backupDir, backupFile);
      const backupContent = await fs.readFile(backupPath, 'utf-8');
      const backupData = JSON.parse(backupContent);
      
      if (backupData.metadata) {
        console.log(`   ${backupFile}`);
        console.log(`     作成日時: ${backupData.metadata.backupTime}`);
        console.log(`     理由: ${backupData.metadata.reason}`);
        console.log(`     元バージョン: ${backupData.metadata.version}`);
      }
    }
    
    // 5. 移行ログの確認
    console.log('\n=== 5. 移行ログの確認 ===');
    const logPath = join(DEMO_DIR, 'reports', 'trust-policy-migration.log');
    const logExists = await fs.access(logPath).then(() => true).catch(() => false);
    
    if (logExists) {
      const logContent = await fs.readFile(logPath, 'utf-8');
      console.log('📋 移行ログが生成されました:');
      console.log(logContent.split('\n').slice(0, 10).join('\n')); // 最初の10行のみ表示
      console.log('   ...');
    }
    
    // 6. バックアップからの復元デモ
    console.log('\n=== 6. バックアップからの復元デモ ===');
    if (backupFiles.length > 0) {
      const restoreFile = backupFiles[0];
      console.log(`📦 ${restoreFile} から復元中...`);
      
      const restoreResult = execSync(
        `cd ${DEMO_DIR} && node ../.kiro/scripts/init-trust-policy.mjs --restore=${restoreFile}`,
        { encoding: 'utf-8' }
      );
      console.log(restoreResult);
      
      // 復元結果の確認
      const restoredContent = await fs.readFile(policyPath, 'utf-8');
      const restoredPolicy = JSON.parse(restoredContent);
      console.log(`✅ 復元完了: バージョン ${restoredPolicy.version}`);
    }
    
    console.log('\n✅ 初期化スクリプトのデモが完了しました！');
    
  } catch (error) {
    console.error('❌ デモ実行中にエラーが発生しました:', error.message);
  }
}

/**
 * デモ環境のクリーンアップ
 */
async function cleanupDemoEnvironment() {
  console.log('\n🧹 デモ環境をクリーンアップ中...');
  
  try {
    await fs.rm(DEMO_DIR, { recursive: true, force: true });
    console.log('✅ デモ環境のクリーンアップ完了');
  } catch (error) {
    console.warn('⚠️  クリーンアップに失敗しました:', error.message);
  }
}

/**
 * メイン処理
 */
async function main() {
  console.log('🎭 Trust承認ポリシー初期化スクリプト デモンストレーション\n');
  
  try {
    await setupDemoEnvironment();
    await createExistingConfig();
    await runInitializationDemo();
  } finally {
    await cleanupDemoEnvironment();
  }
}

// スクリプトが直接実行された場合のみメイン処理を実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ デモ実行に失敗しました:', error.message);
    process.exit(1);
  });
}

export { main as runInitializationDemo };