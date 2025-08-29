#!/usr/bin/env node

/**
 * 自動修正機能の検証スクリプト
 * 
 * 自動修正機能が正しく実装され、動作することを検証します。
 */

import { QualityAssuranceController, QualityIssueType } from './quality-assurance-controller.ts';
import { promises as fs } from 'fs';

class AutoFixVerifier {
  constructor() {
    this.controller = null;
    this.testResults = [];
  }

  async initialize() {
    console.log('🔧 自動修正機能検証を初期化中...');
    this.controller = new QualityAssuranceController();
    await this.controller.initialize();
    console.log('✅ 初期化完了\n');
  }

  async runVerification() {
    console.log('🧪 自動修正機能の検証を開始します...\n');

    const tests = [
      { name: 'AuditLoggerのlogメソッド修正', test: () => this.testAuditLoggerFix() },
      { name: '設定ファイル作成修正', test: () => this.testConfigCreationFix() },
      { name: 'パフォーマンス最適化', test: () => this.testPerformanceOptimization() },
      { name: '修正可能性判定', test: () => this.testFixabilityAssessment() },
      { name: '修正結果検証', test: () => this.testFixValidation() },
      { name: 'ロールバック機能', test: () => this.testRollbackFunctionality() },
      { name: '修正履歴記録', test: () => this.testFixHistoryRecording() },
      { name: '修正統計計算', test: () => this.testFixStatistics() }
    ];

    for (const { name, test } of tests) {
      try {
        console.log(`🔍 ${name}をテスト中...`);
        const result = await test();
        this.testResults.push({ name, success: result.success, details: result.details });
        
        if (result.success) {
          console.log(`✅ ${name}: 成功`);
          if (result.details) {
            console.log(`   └─ ${result.details}`);
          }
        } else {
          console.log(`❌ ${name}: 失敗`);
          if (result.details) {
            console.log(`   └─ ${result.details}`);
          }
        }
      } catch (error) {
        console.log(`❌ ${name}: エラー - ${error.message}`);
        this.testResults.push({ name, success: false, details: error.message });
      }
      console.log('');
    }

    this.printSummary();
  }

  async testAuditLoggerFix() {
    const auditLogger = this.controller.auditLogger;
    
    // 1. logメソッドを削除
    const originalMethod = auditLogger.log;
    delete auditLogger.log;
    
    if (typeof auditLogger.log !== 'undefined') {
      return { success: false, details: 'logメソッドの削除に失敗' };
    }

    // 2. 修正を実行
    const issue = {
      id: 'audit-logger-missing-log-method',
      type: QualityIssueType.MISSING_METHOD,
      severity: 'high',
      component: 'AuditLogger',
      description: 'AuditLoggerクラスにlogメソッドが存在しません',
      detectedAt: new Date(),
      autoFixable: true,
      fixApplied: false
    };

    const fixResult = await this.controller.fixAuditLoggerLogMethod(issue);
    
    if (!fixResult) {
      // 元のメソッドを復元
      auditLogger.log = originalMethod;
      return { success: false, details: '修正の実行に失敗' };
    }

    // 3. 修正結果を検証
    if (typeof auditLogger.log !== 'function') {
      auditLogger.log = originalMethod;
      return { success: false, details: 'logメソッドが復元されていない' };
    }

    // 4. 機能をテスト
    try {
      await auditLogger.log({ test: 'verification' });
    } catch (error) {
      auditLogger.log = originalMethod;
      return { success: false, details: `logメソッドの動作に問題: ${error.message}` };
    }

    // 元のメソッドを復元
    auditLogger.log = originalMethod;
    return { success: true, details: 'logメソッドの追加と動作確認が成功' };
  }

  async testConfigCreationFix() {
    const configPath = '.kiro/settings/trust-policy-test.json';
    
    // 1. テスト用設定ファイルが存在しないことを確認
    try {
      await fs.unlink(configPath);
    } catch (error) {
      // ファイルが存在しない場合は無視
    }

    // 2. 修正を実行
    const issue = {
      id: 'config-validation-error',
      type: QualityIssueType.INVALID_CONFIG,
      severity: 'critical',
      component: 'PolicyManager',
      description: '設定ファイルの読み込みに失敗しました',
      detectedAt: new Date(),
      autoFixable: true,
      fixApplied: false
    };

    // PolicyManagerのパスを一時的に変更
    const originalPath = this.controller.policyManager.policyPath;
    this.controller.policyManager.policyPath = configPath;

    const fixResult = await this.controller.fixConfigValidationError(issue);

    // パスを元に戻す
    this.controller.policyManager.policyPath = originalPath;

    if (!fixResult) {
      return { success: false, details: '設定ファイル作成の実行に失敗' };
    }

    // 3. 設定ファイルが作成されたことを確認
    try {
      const configContent = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(configContent);
      
      if (!config.version || !config.autoApprove || !config.manualApprove || !config.security) {
        await fs.unlink(configPath).catch(() => {});
        return { success: false, details: '作成された設定ファイルに必須フィールドが不足' };
      }

      // テストファイルを削除
      await fs.unlink(configPath).catch(() => {});
      return { success: true, details: '設定ファイルの作成と内容検証が成功' };
    } catch (error) {
      return { success: false, details: `設定ファイルの読み込みに失敗: ${error.message}` };
    }
  }

  async testPerformanceOptimization() {
    const issue = {
      id: 'slow-decision-processing',
      type: QualityIssueType.PERFORMANCE_DEGRADATION,
      severity: 'medium',
      component: 'TrustDecisionEngine',
      description: '判定処理時間が100msを超過しています',
      detectedAt: new Date(),
      autoFixable: true,
      fixApplied: false
    };

    // 1. 元の処理時間を測定
    const testOperation = {
      type: 'git',
      command: 'git',
      args: ['status'],
      context: { cwd: '/test' },
      timestamp: new Date()
    };

    const startTime1 = performance.now();
    await this.controller.decisionEngine.evaluateOperation(testOperation);
    const originalTime = performance.now() - startTime1;

    // 2. 最適化を適用
    const fixResult = await this.controller.optimizeDecisionProcessing(issue);
    
    if (!fixResult) {
      return { success: false, details: 'パフォーマンス最適化の実行に失敗' };
    }

    // 3. 最適化後の処理時間を測定（キャッシュ効果を確認）
    const startTime2 = performance.now();
    await this.controller.decisionEngine.evaluateOperation(testOperation);
    const firstOptimizedTime = performance.now() - startTime2;

    const startTime3 = performance.now();
    await this.controller.decisionEngine.evaluateOperation(testOperation);
    const secondOptimizedTime = performance.now() - startTime3;

    // キャッシュ効果により2回目の方が高速であることを確認
    if (secondOptimizedTime >= firstOptimizedTime) {
      return { success: false, details: 'キャッシュ効果が確認できない' };
    }

    return { 
      success: true, 
      details: `最適化成功 (元: ${originalTime.toFixed(2)}ms, 最適化後: ${secondOptimizedTime.toFixed(2)}ms)` 
    };
  }

  async testFixabilityAssessment() {
    // 1. 修正可能な問題のテスト
    const fixableIssue = {
      id: 'test-fixable',
      type: QualityIssueType.MISSING_METHOD,
      severity: 'high',
      component: 'AuditLogger',
      description: 'テスト用の修正可能な問題',
      detectedAt: new Date(),
      autoFixable: true,
      fixApplied: false
    };

    const isFixable = await this.controller.assessFixability(fixableIssue);
    if (!isFixable) {
      return { success: false, details: '修正可能な問題が修正不可能と判定された' };
    }

    // 2. 修正不可能な問題のテスト
    const unfixableIssue = {
      id: 'test-unfixable',
      type: QualityIssueType.MISSING_METHOD,
      severity: 'high',
      component: 'NonExistentComponent',
      description: 'テスト用の修正不可能な問題',
      detectedAt: new Date(),
      autoFixable: false,
      fixApplied: false
    };

    const isUnfixable = await this.controller.assessFixability(unfixableIssue);
    if (isUnfixable) {
      return { success: false, details: '修正不可能な問題が修正可能と判定された' };
    }

    return { success: true, details: '修正可能性の判定が正常に動作' };
  }

  async testFixValidation() {
    // モックアクションを作成
    let executeCallCount = 0;
    let validateCallCount = 0;
    let rollbackCallCount = 0;

    const mockAction = {
      issueType: QualityIssueType.MISSING_METHOD,
      description: 'テスト用のモック修正',
      execute: async (issue) => {
        executeCallCount++;
        return true;
      },
      validate: async (issue) => {
        validateCallCount++;
        return false; // 検証を失敗させる
      },
      rollback: async (issue) => {
        rollbackCallCount++;
        return true;
      }
    };

    // モックアクションを設定
    const originalAction = this.controller.autoFixActions.get(QualityIssueType.MISSING_METHOD);
    this.controller.autoFixActions.set(QualityIssueType.MISSING_METHOD, mockAction);

    const issue = {
      id: 'test-validation',
      type: QualityIssueType.MISSING_METHOD,
      severity: 'high',
      component: 'TestComponent',
      description: 'テスト用の検証対象問題',
      detectedAt: new Date(),
      autoFixable: true,
      fixApplied: false
    };

    // 修正を実行
    const fixedCount = await this.controller.applyAutoFixes([issue]);

    // 元のアクションを復元
    if (originalAction) {
      this.controller.autoFixActions.set(QualityIssueType.MISSING_METHOD, originalAction);
    }

    // 結果を検証
    if (fixedCount !== 0) {
      return { success: false, details: '検証に失敗した修正がカウントされている' };
    }

    if (executeCallCount !== 1) {
      return { success: false, details: `execute呼び出し回数が異常: ${executeCallCount}` };
    }

    if (validateCallCount !== 1) {
      return { success: false, details: `validate呼び出し回数が異常: ${validateCallCount}` };
    }

    if (rollbackCallCount !== 1) {
      return { success: false, details: `rollback呼び出し回数が異常: ${rollbackCallCount}` };
    }

    if (issue.fixApplied) {
      return { success: false, details: '検証に失敗した問題がfixApplied=trueになっている' };
    }

    return { success: true, details: '修正結果の検証とロールバックが正常に動作' };
  }

  async testRollbackFunctionality() {
    // テスト用の修正履歴を作成
    const fixEntry = {
      id: 'rollback-test',
      issueId: 'test-issue',
      fixType: 'method_addition',
      appliedAt: new Date(),
      success: true,
      description: 'ロールバックテスト用の修正',
      beforeState: { hasMethod: false },
      afterState: { hasMethod: true },
      rollbackData: { methodName: 'testRollbackMethod' }
    };

    await this.controller.recordFixHistory(fixEntry);

    // テスト用のメソッドを追加
    const auditLogger = this.controller.auditLogger;
    auditLogger.testRollbackMethod = () => 'test';

    if (typeof auditLogger.testRollbackMethod !== 'function') {
      return { success: false, details: 'テスト用メソッドの追加に失敗' };
    }

    // ロールバックを実行
    const rollbackResult = await this.controller.rollbackFix('rollback-test');

    if (!rollbackResult) {
      return { success: false, details: 'ロールバックの実行に失敗' };
    }

    // メソッドが削除されたことを確認
    if (typeof auditLogger.testRollbackMethod !== 'undefined') {
      return { success: false, details: 'ロールバック後もメソッドが残っている' };
    }

    return { success: true, details: 'ロールバック機能が正常に動作' };
  }

  async testFixHistoryRecording() {
    const initialHistoryLength = this.controller.getFixHistory().length;

    const testEntry = {
      id: 'history-test',
      issueId: 'test-issue',
      fixType: 'test_fix',
      appliedAt: new Date(),
      success: true,
      description: '履歴記録テスト用の修正',
      beforeState: { test: 'before' },
      afterState: { test: 'after' }
    };

    await this.controller.recordFixHistory(testEntry);

    const updatedHistory = this.controller.getFixHistory();
    
    if (updatedHistory.length !== initialHistoryLength + 1) {
      return { success: false, details: '履歴の記録数が正しくない' };
    }

    const recordedEntry = updatedHistory.find(entry => entry.id === 'history-test');
    if (!recordedEntry) {
      return { success: false, details: '記録したエントリが見つからない' };
    }

    if (recordedEntry.description !== testEntry.description) {
      return { success: false, details: '記録されたエントリの内容が正しくない' };
    }

    return { success: true, details: '修正履歴の記録が正常に動作' };
  }

  async testFixStatistics() {
    // テスト用の履歴を追加
    const testEntries = [
      {
        id: 'stats-test-1',
        issueId: 'issue-1',
        fixType: 'method_addition',
        appliedAt: new Date(),
        success: true,
        description: '統計テスト用の成功修正1',
        beforeState: {},
        afterState: {}
      },
      {
        id: 'stats-test-2',
        issueId: 'issue-2',
        fixType: 'config_creation',
        appliedAt: new Date(),
        success: false,
        description: '統計テスト用の失敗修正',
        beforeState: {},
        afterState: {}
      },
      {
        id: 'stats-test-3',
        issueId: 'issue-3',
        fixType: 'method_addition',
        appliedAt: new Date(),
        success: true,
        description: '統計テスト用の成功修正2',
        beforeState: {},
        afterState: {}
      }
    ];

    const initialStats = this.controller.getFixStatistics();
    
    for (const entry of testEntries) {
      await this.controller.recordFixHistory(entry);
    }

    const updatedStats = this.controller.getFixStatistics();

    // 統計の検証
    if (updatedStats.totalFixes !== initialStats.totalFixes + 3) {
      return { success: false, details: '総修正回数の計算が正しくない' };
    }

    if (updatedStats.successfulFixes !== initialStats.successfulFixes + 2) {
      return { success: false, details: '成功修正回数の計算が正しくない' };
    }

    if (updatedStats.failedFixes !== initialStats.failedFixes + 1) {
      return { success: false, details: '失敗修正回数の計算が正しくない' };
    }

    const methodAdditionCount = updatedStats.fixesByType['method_addition'] || 0;
    const configCreationCount = updatedStats.fixesByType['config_creation'] || 0;

    if (methodAdditionCount < 2) {
      return { success: false, details: 'method_additionタイプの統計が正しくない' };
    }

    if (configCreationCount < 1) {
      return { success: false, details: 'config_creationタイプの統計が正しくない' };
    }

    return { success: true, details: '修正統計の計算が正常に動作' };
  }

  printSummary() {
    console.log('='.repeat(60));
    console.log('🧪 自動修正機能検証結果サマリー');
    console.log('='.repeat(60));

    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(result => result.success).length;
    const failedTests = totalTests - passedTests;

    console.log(`総テスト数: ${totalTests}`);
    console.log(`成功: ${passedTests} ✅`);
    console.log(`失敗: ${failedTests} ❌`);
    console.log(`成功率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

    if (failedTests > 0) {
      console.log('\n❌ 失敗したテスト:');
      this.testResults
        .filter(result => !result.success)
        .forEach(result => {
          console.log(`- ${result.name}: ${result.details}`);
        });
    }

    console.log('\n✅ 成功したテスト:');
    this.testResults
      .filter(result => result.success)
      .forEach(result => {
        console.log(`- ${result.name}`);
      });

    const overallStatus = failedTests === 0 ? '✅ 全テスト合格' : '❌ 一部テスト失敗';
    console.log(`\n${overallStatus}`);
    
    if (failedTests === 0) {
      console.log('🎉 自動修正機能は正常に実装されています！');
    } else {
      console.log('⚠️ 自動修正機能に問題があります。修正が必要です。');
    }
  }
}

async function main() {
  const verifier = new AutoFixVerifier();
  
  try {
    await verifier.initialize();
    await verifier.runVerification();
  } catch (error) {
    console.error('❌ 検証中にエラーが発生しました:', error);
    process.exit(1);
  }
}

// スクリプトが直接実行された場合のみmain関数を呼び出し
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { AutoFixVerifier, main };