#!/usr/bin/env node

/**
 * Trust承認ポリシー初期化スクリプトの検証
 * 
 * 初期化スクリプトの各機能が正しく動作することを検証します。
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const VERIFY_DIR = '.kiro-verify';

/**
 * 検証結果を記録
 */
class VerificationResults {
  constructor() {
    this.results = [];
    this.passed = 0;
    this.failed = 0;
  }

  addResult(test, passed, message = '') {
    this.results.push({ test, passed, message });
    if (passed) {
      this.passed++;
      console.log(`✅ ${test}`);
    } else {
      this.failed++;
      console.log(`❌ ${test}: ${message}`);
    }
  }

  summary() {
    console.log(`\n📊 検証結果: ${this.passed} 成功, ${this.failed} 失敗`);
    return this.failed === 0;
  }
}

/**
 * 検証環境のセットアップ
 */
async function setupVerificationEnvironment() {
  await fs.mkdir(VERIFY_DIR, { recursive: true });
  await fs.mkdir(join(VERIFY_DIR, 'settings'), { recursive: true });
  await fs.mkdir(join(VERIFY_DIR, 'lib', 'trust-policy'), { recursive: true });
  
  // デフォルト設定ファイルをコピー
  const defaultPolicy = await fs.readFile('.kiro/lib/trust-policy/default-policy.json', 'utf-8');
  await fs.writeFile(join(VERIFY_DIR, 'lib', 'trust-policy', 'default-policy.json'), defaultPolicy);
}

/**
 * 新規初期化の検証
 */
async function verifyNewInstallation(results) {
  console.log('\n=== 新規初期化の検証 ===');
  
  try {
    // 初期化実行
    execSync(
      `cd ${VERIFY_DIR} && node ../.kiro/scripts/init-trust-policy.mjs --force`,
      { encoding: 'utf-8', stdio: 'pipe' }
    );
    
    // 設定ファイルの存在確認
    const policyPath = join(VERIFY_DIR, 'settings', 'trust-policy.json');
    const exists = await fs.access(policyPath).then(() => true).catch(() => false);
    results.addResult('設定ファイルが作成される', exists);
    
    if (exists) {
      // 設定内容の検証
      const content = await fs.readFile(policyPath, 'utf-8');
      const policy = JSON.parse(content);
      
      results.addResult('バージョン情報が設定される', !!policy.version);
      results.addResult('自動承認設定が存在する', !!policy.autoApprove);
      results.addResult('手動承認設定が存在する', !!policy.manualApprove);
      results.addResult('セキュリティ設定が存在する', !!policy.security);
      results.addResult('Git操作が設定される', Array.isArray(policy.autoApprove.gitOperations));
      results.addResult('ファイル操作が設定される', Array.isArray(policy.autoApprove.fileOperations));
    }
    
    // ディレクトリ構造の確認
    const reportsExists = await fs.access(join(VERIFY_DIR, 'reports')).then(() => true).catch(() => false);
    results.addResult('レポートディレクトリが作成される', reportsExists);
    
    const steeringExists = await fs.access(join(VERIFY_DIR, 'steering')).then(() => true).catch(() => false);
    results.addResult('ステアリングディレクトリが作成される', steeringExists);
    
  } catch (error) {
    results.addResult('新規初期化が実行される', false, error.message);
  }
}

/**
 * バックアップ機能の検証
 */
async function verifyBackupFunctionality(results) {
  console.log('\n=== バックアップ機能の検証 ===');
  
  try {
    // 既存設定を作成
    const existingPolicy = {
      version: '0.9',
      lastUpdated: '2025-08-26T10:00:00Z',
      autoApprove: { gitOperations: ['status'] },
      manualApprove: { deleteOperations: [] },
      security: { maxAutoApprovalPerHour: 500 }
    };
    
    const policyPath = join(VERIFY_DIR, 'settings', 'trust-policy.json');
    await fs.writeFile(policyPath, JSON.stringify(existingPolicy, null, 2));
    
    // 初期化実行（バックアップが作成されるはず）
    execSync(
      `cd ${VERIFY_DIR} && node ../.kiro/scripts/init-trust-policy.mjs --force`,
      { encoding: 'utf-8', stdio: 'pipe' }
    );
    
    // バックアップファイルの確認
    const backupDir = join(VERIFY_DIR, 'backups');
    const backupExists = await fs.access(backupDir).then(() => true).catch(() => false);
    results.addResult('バックアップディレクトリが作成される', backupExists);
    
    if (backupExists) {
      const backupFiles = await fs.readdir(backupDir);
      const hasBackup = backupFiles.some(file => file.startsWith('trust-policy.backup.'));
      results.addResult('バックアップファイルが作成される', hasBackup);
      
      if (hasBackup) {
        const backupFile = backupFiles.find(file => file.startsWith('trust-policy.backup.'));
        const backupContent = await fs.readFile(join(backupDir, backupFile), 'utf-8');
        const backupData = JSON.parse(backupContent);
        
        results.addResult('バックアップにメタデータが含まれる', !!backupData.metadata);
        results.addResult('バックアップに元の設定が保存される', backupData.content?.version === '0.9');
      }
    }
    
  } catch (error) {
    results.addResult('バックアップ機能が動作する', false, error.message);
  }
}

/**
 * 段階的移行の検証
 */
async function verifyMigrationFunctionality(results) {
  console.log('\n=== 段階的移行の検証 ===');
  
  try {
    // 古いバージョンの設定を作成
    const oldPolicy = {
      version: '0.8',
      lastUpdated: '2025-08-25T10:00:00Z',
      autoApprove: {
        gitOperations: ['status', 'commit'],
        fileOperations: ['read']
      },
      manualApprove: {
        deleteOperations: ['rm -rf']
      },
      security: {
        maxAutoApprovalPerHour: 300,
        suspiciousPatternDetection: false
      }
    };
    
    const policyPath = join(VERIFY_DIR, 'settings', 'trust-policy.json');
    await fs.writeFile(policyPath, JSON.stringify(oldPolicy, null, 2));
    
    // 段階的移行実行
    execSync(
      `cd ${VERIFY_DIR} && node ../.kiro/scripts/init-trust-policy.mjs --migrate`,
      { encoding: 'utf-8', stdio: 'pipe' }
    );
    
    // 移行結果の確認
    const migratedContent = await fs.readFile(policyPath, 'utf-8');
    const migratedPolicy = JSON.parse(migratedContent);
    
    results.addResult('バージョンが更新される', migratedPolicy.version !== '0.8');
    results.addResult('既存のGit操作が保持される', 
      migratedPolicy.autoApprove.gitOperations.includes('status') &&
      migratedPolicy.autoApprove.gitOperations.includes('commit')
    );
    results.addResult('新しいGit操作が追加される', 
      migratedPolicy.autoApprove.gitOperations.includes('push') &&
      migratedPolicy.autoApprove.gitOperations.includes('pull')
    );
    results.addResult('既存のセキュリティ設定が保持される', 
      migratedPolicy.security.maxAutoApprovalPerHour === 300
    );
    results.addResult('新しいファイル操作が追加される', 
      migratedPolicy.autoApprove.fileOperations.includes('write')
    );
    
    // 移行ログの確認
    const logPath = join(VERIFY_DIR, 'reports', 'trust-policy-migration.log');
    const logExists = await fs.access(logPath).then(() => true).catch(() => false);
    results.addResult('移行ログが生成される', logExists);
    
  } catch (error) {
    results.addResult('段階的移行が動作する', false, error.message);
  }
}

/**
 * 復元機能の検証
 */
async function verifyRestoreFunctionality(results) {
  console.log('\n=== 復元機能の検証 ===');
  
  try {
    // バックアップファイルを作成
    const backupDir = join(VERIFY_DIR, 'backups');
    await fs.mkdir(backupDir, { recursive: true });
    
    const backupData = {
      metadata: {
        originalPath: join(VERIFY_DIR, 'settings', 'trust-policy.json'),
        backupTime: '2025-08-27T09:00:00Z',
        reason: 'test',
        hash: 'test1234',
        version: '0.7'
      },
      content: {
        version: '0.7',
        autoApprove: { gitOperations: ['status'] },
        manualApprove: { deleteOperations: [] },
        security: { maxAutoApprovalPerHour: 200 }
      }
    };
    
    const backupFile = 'trust-policy.backup.2025-08-27T09-00-00-000Z.test1234.json';
    await fs.writeFile(
      join(backupDir, backupFile),
      JSON.stringify(backupData, null, 2)
    );
    
    // 復元実行
    execSync(
      `cd ${VERIFY_DIR} && node ../.kiro/scripts/init-trust-policy.mjs --restore=${backupFile}`,
      { encoding: 'utf-8', stdio: 'pipe' }
    );
    
    // 復元結果の確認
    const policyPath = join(VERIFY_DIR, 'settings', 'trust-policy.json');
    const restoredContent = await fs.readFile(policyPath, 'utf-8');
    const restoredPolicy = JSON.parse(restoredContent);
    
    results.addResult('バックアップから復元される', restoredPolicy.version === '0.7');
    results.addResult('復元された設定が正しい', restoredPolicy.security.maxAutoApprovalPerHour === 200);
    
  } catch (error) {
    results.addResult('復元機能が動作する', false, error.message);
  }
}

/**
 * ドライラン機能の検証
 */
async function verifyDryRunFunctionality(results) {
  console.log('\n=== ドライラン機能の検証 ===');
  
  try {
    // 既存設定を作成
    const existingPolicy = {
      version: '0.9',
      autoApprove: { gitOperations: ['status'] },
      manualApprove: { deleteOperations: [] },
      security: { maxAutoApprovalPerHour: 500 }
    };
    
    const policyPath = join(VERIFY_DIR, 'settings', 'trust-policy.json');
    await fs.writeFile(policyPath, JSON.stringify(existingPolicy, null, 2));
    
    // ドライラン実行
    const output = execSync(
      `cd ${VERIFY_DIR} && node ../.kiro/scripts/init-trust-policy.mjs --migrate --dry-run`,
      { encoding: 'utf-8' }
    );
    
    // 設定ファイルが変更されていないことを確認
    const unchangedContent = await fs.readFile(policyPath, 'utf-8');
    const unchangedPolicy = JSON.parse(unchangedContent);
    
    results.addResult('ドライランで設定が変更されない', unchangedPolicy.version === '0.9');
    results.addResult('ドライランメッセージが表示される', output.includes('ドライラン'));
    
  } catch (error) {
    results.addResult('ドライラン機能が動作する', false, error.message);
  }
}

/**
 * エラーハンドリングの検証
 */
async function verifyErrorHandling(results) {
  console.log('\n=== エラーハンドリングの検証 ===');
  
  try {
    // 存在しないバックアップファイルからの復元
    let errorCaught = false;
    try {
      execSync(
        `cd ${VERIFY_DIR} && node ../.kiro/scripts/init-trust-policy.mjs --restore=nonexistent.json`,
        { encoding: 'utf-8', stdio: 'pipe' }
      );
    } catch (error) {
      errorCaught = true;
    }
    results.addResult('存在しないバックアップファイルでエラーが発生する', errorCaught);
    
    // 破損した設定ファイルの処理
    const policyPath = join(VERIFY_DIR, 'settings', 'trust-policy.json');
    await fs.writeFile(policyPath, '{ invalid json }');
    
    errorCaught = false;
    try {
      execSync(
        `cd ${VERIFY_DIR} && node ../.kiro/scripts/init-trust-policy.mjs --migrate`,
        { encoding: 'utf-8', stdio: 'pipe' }
      );
    } catch (error) {
      errorCaught = true;
    }
    results.addResult('破損した設定ファイルでエラーが発生する', errorCaught);
    
  } catch (error) {
    results.addResult('エラーハンドリングが動作する', false, error.message);
  }
}

/**
 * 検証環境のクリーンアップ
 */
async function cleanupVerificationEnvironment() {
  try {
    await fs.rm(VERIFY_DIR, { recursive: true, force: true });
  } catch (error) {
    // クリーンアップエラーは無視
  }
}

/**
 * メイン検証処理
 */
async function main() {
  console.log('🔍 Trust承認ポリシー初期化スクリプトの検証を開始します...\n');
  
  const results = new VerificationResults();
  
  try {
    await setupVerificationEnvironment();
    
    await verifyNewInstallation(results);
    await verifyBackupFunctionality(results);
    await verifyMigrationFunctionality(results);
    await verifyRestoreFunctionality(results);
    await verifyDryRunFunctionality(results);
    await verifyErrorHandling(results);
    
    const allPassed = results.summary();
    
    if (allPassed) {
      console.log('\n✅ すべての検証が成功しました！初期化スクリプトは正常に動作しています。');
    } else {
      console.log('\n❌ 一部の検証が失敗しました。初期化スクリプトに問題がある可能性があります。');
      process.exit(1);
    }
    
  } finally {
    await cleanupVerificationEnvironment();
  }
}

// スクリプトが直接実行された場合のみメイン処理を実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ 検証実行に失敗しました:', error.message);
    process.exit(1);
  });
}

export { main as verifyInitScript };