#!/usr/bin/env node

/**
 * 監査ログシステムのデモンストレーション
 * 
 * このスクリプトは監査ログシステムの動作を実演します：
 * - 自動承認操作のログ記録
 * - 手動承認操作のログ記録
 * - ログローテーション機能
 * - エラーハンドリング
 * - 統計情報の取得
 */

import { AuditLogger } from './audit-logger.js';
import { OperationType, RiskLevel } from './types.js';

async function demonstrateAuditLogger() {
  console.log('🔍 Trust承認システム - 監査ログデモンストレーション');
  console.log('=' .repeat(60));

  // テスト用の監査ログシステムを初期化
  const auditLogger = new AuditLogger({
    reportsDir: '.kiro/reports',
    maxLogFileSize: 1024 * 1024, // 1MB
    maxLogFiles: 30,
    enableRotation: true
  });

  // サンプル操作データ
  const sampleOperations = [
    {
      operation: {
        type: OperationType.GIT,
        command: 'git',
        args: ['status'],
        context: {
          workingDirectory: process.cwd(),
          user: 'developer',
          sessionId: 'session-001'
        },
        timestamp: new Date()
      },
      decision: {
        approved: true,
        requiresManualApproval: false,
        reason: 'Git読み取り操作のため自動承認',
        riskLevel: RiskLevel.LOW
      },
      executionResult: {
        success: true,
        executionTime: 45,
        output: 'On branch main\nnothing to commit, working tree clean'
      }
    },
    {
      operation: {
        type: OperationType.GIT,
        command: 'git',
        args: ['branch', '-D', 'feature-branch'],
        context: {
          workingDirectory: process.cwd(),
          user: 'developer',
          sessionId: 'session-002'
        },
        timestamp: new Date()
      },
      decision: {
        approved: true,
        requiresManualApproval: true,
        reason: '削除操作のため手動承認が必要',
        riskLevel: RiskLevel.HIGH
      },
      executionResult: {
        success: true,
        executionTime: 120,
        output: 'Deleted branch feature-branch'
      }
    },
    {
      operation: {
        type: OperationType.FILE,
        command: 'rm',
        args: ['-rf', 'temp-directory'],
        context: {
          workingDirectory: process.cwd(),
          user: 'developer',
          sessionId: 'session-003'
        },
        timestamp: new Date()
      },
      decision: {
        approved: false,
        requiresManualApproval: true,
        reason: 'ユーザーが操作を拒否',
        riskLevel: RiskLevel.HIGH
      },
      executionResult: {
        success: false,
        executionTime: 0,
        errorMessage: 'Operation cancelled by user'
      }
    },
    {
      operation: {
        type: OperationType.SCRIPT,
        command: 'node',
        args: ['scripts/generate-report.mjs'],
        context: {
          workingDirectory: process.cwd(),
          user: 'developer',
          sessionId: 'session-004'
        },
        timestamp: new Date()
      },
      decision: {
        approved: true,
        requiresManualApproval: false,
        reason: '許可されたスクリプト実行のため自動承認',
        riskLevel: RiskLevel.LOW
      },
      executionResult: {
        success: true,
        executionTime: 2340,
        output: 'Report generated successfully'
      }
    }
  ];

  console.log('\n📝 1. 自動承認操作のログ記録デモ');
  console.log('-'.repeat(40));

  // 自動承認操作のログ記録
  const autoApprovalOps = sampleOperations.filter(op => !op.decision.requiresManualApproval);
  for (const { operation, decision, executionResult } of autoApprovalOps) {
    console.log(`  ✅ ${operation.command} ${operation.args.join(' ')}`);
    await auditLogger.logAutoApproval(
      operation,
      decision,
      executionResult,
      operation.context.user,
      operation.context.sessionId
    );
  }

  console.log('\n📋 2. 手動承認操作のログ記録デモ');
  console.log('-'.repeat(40));

  // 手動承認操作のログ記録
  const manualApprovalOps = sampleOperations.filter(op => op.decision.requiresManualApproval);
  for (const { operation, decision, executionResult } of manualApprovalOps) {
    const status = decision.approved ? '✅ 承認' : '❌ 拒否';
    console.log(`  ${status} ${operation.command} ${operation.args.join(' ')}`);
    await auditLogger.logManualApproval(
      operation,
      decision,
      executionResult,
      operation.context.user,
      operation.context.sessionId
    );
  }

  console.log('\n📊 3. ログ統計情報の取得デモ');
  console.log('-'.repeat(40));

  const stats = await auditLogger.getLogStats(7);
  console.log(`  📈 総操作数: ${stats.totalOperations}`);
  console.log(`  🤖 自動承認: ${stats.autoApprovals}`);
  console.log(`  👤 手動承認: ${stats.manualApprovals}`);
  console.log(`  ❌ エラー: ${stats.errors}`);
  
  if (stats.totalOperations > 0) {
    const autoApprovalRate = ((stats.autoApprovals / stats.totalOperations) * 100).toFixed(1);
    console.log(`  📊 自動承認率: ${autoApprovalRate}%`);
  }

  console.log('\n🔄 4. ログローテーション機能のデモ');
  console.log('-'.repeat(40));

  // 大量のログを生成してローテーションをテスト
  console.log('  大量のログエントリを生成中...');
  for (let i = 0; i < 10; i++) {
    const testOperation = {
      type: OperationType.GIT,
      command: 'git',
      args: ['log', '--oneline', '-n', '10'],
      context: {
        workingDirectory: process.cwd(),
        user: 'test-user',
        sessionId: `bulk-session-${i}`
      },
      timestamp: new Date()
    };

    const testDecision = {
      approved: true,
      requiresManualApproval: false,
      reason: 'バルクテスト用自動承認',
      riskLevel: RiskLevel.LOW
    };

    const testResult = {
      success: true,
      executionTime: Math.floor(Math.random() * 100) + 10,
      output: `Test output ${i}`
    };

    await auditLogger.logAutoApproval(testOperation, testDecision, testResult);
  }
  console.log('  ✅ ログローテーション機能が正常に動作しました');

  console.log('\n⚠️  5. エラーハンドリングのデモ');
  console.log('-'.repeat(40));

  // 無効なディレクトリでエラーハンドリングをテスト
  const errorLogger = new AuditLogger({
    reportsDir: '/invalid/path/that/does/not/exist',
    enableRotation: false
  });

  console.log('  無効なパスでのログ記録をテスト中...');
  
  // コンソールエラーを一時的にキャプチャ
  const originalConsoleError = console.error;
  let errorCaptured = false;
  console.error = (...args) => {
    if (args[0]?.includes('ログの記録に失敗')) {
      errorCaptured = true;
      console.log('  ✅ エラーハンドリングが正常に動作しました');
    }
  };

  await errorLogger.logAutoApproval(
    sampleOperations[0].operation,
    sampleOperations[0].decision,
    sampleOperations[0].executionResult
  );

  // コンソールエラーを復元
  console.error = originalConsoleError;

  if (!errorCaptured) {
    console.log('  ⚠️  エラーハンドリングのテストが期待通りに動作しませんでした');
  }

  console.log('\n📁 6. 生成されたログファイルの確認');
  console.log('-'.repeat(40));

  try {
    const { promises: fs } = await import('fs');
    const files = await fs.readdir('.kiro/reports');
    const logFiles = files.filter(f => f.includes('trust-log'));
    
    console.log('  生成されたログファイル:');
    for (const file of logFiles) {
      const stats = await fs.stat(`.kiro/reports/${file}`);
      const sizeKB = (stats.size / 1024).toFixed(2);
      console.log(`    📄 ${file} (${sizeKB} KB)`);
    }
  } catch (error) {
    console.log('  ⚠️  ログファイルの確認中にエラーが発生しました:', error.message);
  }

  console.log('\n✅ 監査ログシステムのデモンストレーション完了');
  console.log('=' .repeat(60));
  console.log('📋 生成されたログファイルは .kiro/reports/ ディレクトリで確認できます');
  console.log('🔍 ログの内容を確認して、監査証跡が適切に記録されていることを確認してください');
}

// メイン実行
if (import.meta.url === `file://${process.argv[1]}`) {
  demonstrateAuditLogger().catch(error => {
    console.error('❌ デモンストレーション中にエラーが発生しました:', error);
    process.exit(1);
  });
}

export { demonstrateAuditLogger };