#!/usr/bin/env node

/**
 * Trust承認ポリシーエラーハンドリングシステムのデモンストレーション
 * 
 * このスクリプトはエラーハンドリング機能の動作を確認するためのデモです。
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { TrustErrorHandler, TrustErrorType } from './error-handler.js';

const DEMO_DIR = '.kiro-error-handler-demo';

/**
 * デモ環境のセットアップ
 */
async function setupDemoEnvironment() {
  console.log('🔧 エラーハンドリングデモ環境をセットアップ中...');
  
  await fs.mkdir(DEMO_DIR, { recursive: true });
  await fs.mkdir(join(DEMO_DIR, 'reports'), { recursive: true });
  await fs.mkdir(join(DEMO_DIR, 'settings'), { recursive: true });
  
  console.log('✅ デモ環境のセットアップ完了');
}

/**
 * 様々なタイプのエラーを生成
 */
function createTestErrors() {
  return [
    {
      name: '設定エラー',
      error: new Error('Invalid configuration: missing required field "autoApprove"'),
      expectedType: TrustErrorType.CONFIG_ERROR
    },
    {
      name: '検証エラー',
      error: new Error('Validation failed: operation type not recognized'),
      expectedType: TrustErrorType.VALIDATION_ERROR
    },
    {
      name: '判定エラー',
      error: new Error('Decision evaluation timeout: unable to process request'),
      expectedType: TrustErrorType.DECISION_ERROR
    },
    {
      name: '実行エラー',
      error: new Error('Operation execution failed: command not found'),
      expectedType: TrustErrorType.EXECUTION_ERROR
    },
    {
      name: 'パフォーマンスエラー',
      error: new Error('Performance degradation: processing time exceeded 500ms'),
      expectedType: TrustErrorType.PERFORMANCE_ERROR
    },
    {
      name: 'セキュリティエラー',
      error: new Error('Security violation: unauthorized access attempt detected'),
      expectedType: TrustErrorType.SECURITY_ERROR
    },
    {
      name: '重要なエラー',
      error: new Error('Critical system failure: database connection lost'),
      expectedType: TrustErrorType.CONFIG_ERROR
    }
  ];
}

/**
 * エラー分類のデモ
 */
async function demonstrateErrorClassification(errorHandler) {
  console.log('\n🔍 エラー分類のデモンストレーション...\n');
  
  const testErrors = createTestErrors();
  
  console.log('=== エラー分類テスト ===');
  
  for (const { name, error, expectedType } of testErrors) {
    console.log(`\n📋 ${name}:`);
    console.log(`   エラーメッセージ: "${error.message}"`);
    
    const result = await errorHandler.handleError(error, { 
      testMode: true,
      errorName: name 
    });
    
    console.log(`   判定結果: ${result.decision}`);
    console.log(`   フォールバック適用: ${result.fallbackApplied ? 'はい' : 'いいえ'}`);
    console.log(`   理由: ${result.reason}`);
    
    // 緊急モードの状態確認
    if (errorHandler.isEmergencyModeEnabled()) {
      console.log(`   🚨 緊急モードが有効化されました`);
    }
  }
}

/**
 * フォールバック機能のデモ
 */
async function demonstrateFallbackMechanisms(errorHandler) {
  console.log('\n🛡️ フォールバック機能のデモンストレーション...\n');
  
  // 1. リトライ機能のテスト
  console.log('=== 1. リトライ機能テスト ===');
  
  const retryError = {
    type: TrustErrorType.DECISION_ERROR,
    message: 'Temporary decision failure',
    timestamp: new Date().toISOString(),
    severity: 'medium',
    recoverable: true,
    context: { retryCount: 0 }
  };
  
  console.log('初回判定エラー（リトライ対象）:');
  let result = await errorHandler.handleError(retryError);
  console.log(`   結果: ${result.reason}`);
  
  // リトライ回数を増やして再テスト
  retryError.context.retryCount = 3;
  console.log('\nリトライ上限到達後:');
  result = await errorHandler.handleError(retryError);
  console.log(`   結果: ${result.reason}`);
  
  // 2. 設定復帰機能のテスト
  console.log('\n=== 2. 設定復帰機能テスト ===');
  
  const configError = {
    type: TrustErrorType.CONFIG_ERROR,
    message: 'Configuration file corrupted',
    timestamp: new Date().toISOString(),
    severity: 'medium',
    recoverable: true
  };
  
  console.log('設定エラー発生:');
  result = await errorHandler.handleError(configError);
  console.log(`   結果: ${result.reason}`);
  
  // デフォルト設定ファイルの確認
  const defaultConfigPath = '.kiro/settings/trust-policy.json';
  const configExists = await fs.access(defaultConfigPath).then(() => true).catch(() => false);
  console.log(`   デフォルト設定ファイル作成: ${configExists ? '成功' : '失敗'}`);
  
  // 3. 緊急モード機能のテスト
  console.log('\n=== 3. 緊急モード機能テスト ===');
  
  const securityError = {
    type: TrustErrorType.SECURITY_ERROR,
    message: 'Malicious activity detected',
    timestamp: new Date().toISOString(),
    severity: 'high',
    recoverable: false
  };
  
  console.log('セキュリティエラー発生:');
  result = await errorHandler.handleError(securityError);
  console.log(`   結果: ${result.reason}`);
  console.log(`   緊急モード状態: ${errorHandler.isEmergencyModeEnabled() ? '有効' : '無効'}`);
  
  if (errorHandler.isEmergencyModeEnabled()) {
    console.log('\n緊急モードでの操作許可テスト:');
    const testOperations = [
      'git status',
      'git log',
      'git push',
      'rm -rf important-file'
    ];
    
    testOperations.forEach(operation => {
      const allowed = errorHandler.isAllowedInEmergencyMode(operation);
      console.log(`   "${operation}": ${allowed ? '✅ 許可' : '❌ 拒否'}`);
    });
  }
}

/**
 * エラー統計とモニタリングのデモ
 */
async function demonstrateErrorStatistics(errorHandler) {
  console.log('\n📊 エラー統計とモニタリングのデモンストレーション...\n');
  
  // 複数のエラーを生成して統計データを作成
  console.log('=== エラーデータ生成中 ===');
  
  const errorTypes = [
    TrustErrorType.CONFIG_ERROR,
    TrustErrorType.VALIDATION_ERROR,
    TrustErrorType.DECISION_ERROR,
    TrustErrorType.EXECUTION_ERROR
  ];
  
  for (let i = 0; i < 20; i++) {
    const errorType = errorTypes[i % errorTypes.length];
    const error = new Error(`Test error ${i + 1} of type ${errorType}`);
    
    await errorHandler.handleError(error, {
      testId: i + 1,
      batch: 'statistics-demo'
    });
  }
  
  console.log('✅ 20件のテストエラーを生成しました');
  
  // 統計情報の表示
  console.log('\n=== エラー統計情報 ===');
  const stats = errorHandler.getErrorStatistics();
  
  console.log(`総エラー数（過去24時間）: ${stats.totalErrors}`);
  console.log(`回復成功率: ${stats.recoverySuccessRate.toFixed(1)}%`);
  
  console.log('\nエラータイプ別統計:');
  Object.entries(stats.errorsByType).forEach(([type, count]) => {
    if (count > 0) {
      console.log(`   ${type}: ${count}件`);
    }
  });
  
  console.log('\n時間別エラー統計:');
  Object.entries(stats.errorsByHour).forEach(([hour, count]) => {
    console.log(`   ${hour}時: ${count}件`);
  });
  
  if (stats.lastError) {
    console.log('\n最新エラー:');
    console.log(`   タイプ: ${stats.lastError.type}`);
    console.log(`   メッセージ: ${stats.lastError.message}`);
    console.log(`   重要度: ${stats.lastError.severity}`);
    console.log(`   回復可能: ${stats.lastError.recoverable ? 'はい' : 'いいえ'}`);
  }
}

/**
 * ヘルスチェック機能のデモ
 */
async function demonstrateHealthCheck(errorHandler) {
  console.log('\n🏥 ヘルスチェック機能のデモンストレーション...\n');
  
  console.log('=== システムヘルスチェック実行 ===');
  
  const health = await errorHandler.performHealthCheck();
  
  console.log(`システム状態: ${health.status}`);
  
  if (health.issues.length > 0) {
    console.log('\n検出された問題:');
    health.issues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue}`);
    });
  } else {
    console.log('\n✅ 問題は検出されませんでした');
  }
  
  if (health.recommendations.length > 0) {
    console.log('\n推奨アクション:');
    health.recommendations.forEach((recommendation, index) => {
      console.log(`   ${index + 1}. ${recommendation}`);
    });
  }
  
  // ステータス別の対応方針
  console.log('\n=== 対応方針 ===');
  switch (health.status) {
    case 'healthy':
      console.log('✅ システムは正常に動作しています。定期的な監視を継続してください。');
      break;
    case 'warning':
      console.log('⚠️ 注意が必要な状況です。推奨アクションの実施を検討してください。');
      break;
    case 'critical':
      console.log('🚨 緊急対応が必要です。即座に推奨アクションを実施してください。');
      break;
  }
}

/**
 * エラーログ管理のデモ
 */
async function demonstrateErrorLogManagement(errorHandler) {
  console.log('\n📝 エラーログ管理のデモンストレーション...\n');
  
  console.log('=== エラーログファイル確認 ===');
  
  const logPath = join(DEMO_DIR, 'reports', 'trust-error-log.jsonl');
  
  try {
    const logExists = await fs.access(logPath).then(() => true).catch(() => false);
    console.log(`エラーログファイル: ${logExists ? '存在' : '未作成'}`);
    
    if (logExists) {
      const content = await fs.readFile(logPath, 'utf-8');
      const lines = content.trim().split('\n').filter(line => line);
      console.log(`ログエントリ数: ${lines.length}`);
      
      if (lines.length > 0) {
        console.log('\n最新のログエントリ（最大3件）:');
        lines.slice(-3).forEach((line, index) => {
          try {
            const entry = JSON.parse(line);
            console.log(`   ${index + 1}. [${entry.timestamp}] ${entry.type}: ${entry.message}`);
          } catch (parseError) {
            console.log(`   ${index + 1}. 解析エラー: ${line.substring(0, 50)}...`);
          }
        });
      }
    }
  } catch (error) {
    console.warn('ログファイルの確認に失敗しました:', error.message);
  }
  
  console.log('\n=== ログクリーンアップテスト ===');
  
  console.log('古いログエントリのクリーンアップを実行中...');
  await errorHandler.cleanupErrorLog();
  console.log('✅ ログクリーンアップ完了');
  
  // クリーンアップ後の統計
  const statsAfterCleanup = errorHandler.getErrorStatistics();
  console.log(`クリーンアップ後のエラー数: ${statsAfterCleanup.totalErrors}`);
}

/**
 * 緊急モード管理のデモ
 */
async function demonstrateEmergencyModeManagement(errorHandler) {
  console.log('\n🚨 緊急モード管理のデモンストレーション...\n');
  
  console.log('=== 緊急モード制御テスト ===');
  
  // 初期状態の確認
  console.log(`初期状態: ${errorHandler.isEmergencyModeEnabled() ? '緊急モード有効' : '通常モード'}`);
  
  // セキュリティエラーで緊急モードを有効化
  console.log('\nセキュリティエラーによる緊急モード有効化...');
  const securityError = {
    type: TrustErrorType.SECURITY_ERROR,
    message: 'Critical security breach detected',
    timestamp: new Date().toISOString(),
    severity: 'critical',
    recoverable: false
  };
  
  await errorHandler.handleError(securityError);
  console.log(`緊急モード状態: ${errorHandler.isEmergencyModeEnabled() ? '有効' : '無効'}`);
  
  // 緊急モード設定ファイルの確認
  const emergencyConfigPath = '.kiro/settings/emergency-mode.json';
  const configExists = await fs.access(emergencyConfigPath).then(() => true).catch(() => false);
  console.log(`緊急モード設定ファイル: ${configExists ? '作成済み' : '未作成'}`);
  
  if (configExists) {
    try {
      const configContent = await fs.readFile(emergencyConfigPath, 'utf-8');
      const config = JSON.parse(configContent);
      console.log(`有効化日時: ${config.enabledAt}`);
      console.log(`許可操作: ${config.autoApproveOnly.join(', ')}`);
    } catch (error) {
      console.warn('設定ファイルの読み込みに失敗しました:', error.message);
    }
  }
  
  // 手動での緊急モード無効化
  console.log('\n手動での緊急モード無効化...');
  await errorHandler.disableEmergencyMode();
  console.log(`緊急モード状態: ${errorHandler.isEmergencyModeEnabled() ? '有効' : '無効'}`);
  
  // 設定ファイルが削除されることを確認
  const configExistsAfter = await fs.access(emergencyConfigPath).then(() => true).catch(() => false);
  console.log(`緊急モード設定ファイル: ${configExistsAfter ? '残存' : '削除済み'}`);
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
    console.warn('⚠️ クリーンアップに失敗しました:', error.message);
  }
}

/**
 * メイン処理
 */
async function main() {
  console.log('🛡️ Trust承認ポリシーエラーハンドリングシステム デモンストレーション\n');
  
  try {
    await setupDemoEnvironment();
    
    // エラーハンドラーの初期化
    const errorHandler = new TrustErrorHandler({
      enableSafeMode: true,
      defaultDecision: 'manual',
      maxRetries: 3,
      retryDelay: 500,
      emergencyMode: {
        enabled: false,
        autoApproveOnly: ['git status', 'git log', 'git diff']
      }
    });
    
    // デモ用のパスを設定
    (errorHandler as any).errorLogPath = join(DEMO_DIR, 'reports', 'trust-error-log.jsonl');
    await errorHandler.initialize();
    
    // デモの実行
    await demonstrateErrorClassification(errorHandler);
    await demonstrateFallbackMechanisms(errorHandler);
    await demonstrateErrorStatistics(errorHandler);
    await demonstrateHealthCheck(errorHandler);
    await demonstrateErrorLogManagement(errorHandler);
    await demonstrateEmergencyModeManagement(errorHandler);
    
    console.log('\n✅ エラーハンドリングシステムのデモが完了しました！');
    console.log('\n📋 主な機能:');
    console.log('   - 自動エラー分類と重要度判定');
    console.log('   - インテリジェントフォールバック機能');
    console.log('   - リトライ機能と設定復帰');
    console.log('   - 緊急モードによるセキュリティ保護');
    console.log('   - 包括的なエラー統計とモニタリング');
    console.log('   - システムヘルスチェック');
    console.log('   - エラーログ管理とクリーンアップ');
    
  } catch (error) {
    console.error('❌ デモ実行中にエラーが発生しました:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
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

export { main as runErrorHandlerDemo };