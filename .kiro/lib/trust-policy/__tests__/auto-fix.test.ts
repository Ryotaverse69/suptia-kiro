/**
 * 自動修正機能のテスト
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { promises as fs } from 'fs';
import { join } from 'path';
import { QualityAssuranceController, QualityIssueType, QualityIssue } from '../quality-assurance-controller';

describe('QualityAssuranceController - Auto Fix', () => {
  let controller: QualityAssuranceController;
  let testDir: string;

  beforeEach(async () => {
    testDir = join(process.cwd(), '.kiro-test-auto-fix');
    await fs.mkdir(testDir, { recursive: true });
    
    // テスト用の設定ディレクトリを作成
    await fs.mkdir(join(testDir, 'settings'), { recursive: true });
    await fs.mkdir(join(testDir, 'reports', 'quality'), { recursive: true });
    
    controller = new QualityAssuranceController();
    await controller.initialize();
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // クリーンアップエラーは無視
    }
  });

  describe('修正可能性の判定', () => {
    it('修正可能な問題を正しく判定する', async () => {
      const issue: QualityIssue = {
        id: 'test-issue-1',
        type: QualityIssueType.MISSING_METHOD,
        severity: 'high',
        component: 'AuditLogger',
        description: 'テスト用の修正可能な問題',
        detectedAt: new Date(),
        autoFixable: true,
        fixApplied: false
      };

      const isFixable = await (controller as any).assessFixability(issue);
      expect(isFixable).toBe(true);
    });

    it('修正不可能な問題を正しく判定する', async () => {
      const issue: QualityIssue = {
        id: 'test-issue-2',
        type: QualityIssueType.PERFORMANCE_DEGRADATION,
        severity: 'medium',
        component: 'UnknownComponent',
        description: 'テスト用の修正不可能な問題',
        detectedAt: new Date(),
        autoFixable: false,
        fixApplied: false
      };

      const isFixable = await (controller as any).assessFixability(issue);
      expect(isFixable).toBe(false);
    });
  });

  describe('AuditLoggerの修正', () => {
    it('logメソッドが不足している場合に追加する', async () => {
      const issue: QualityIssue = {
        id: 'audit-logger-missing-log-method',
        type: QualityIssueType.MISSING_METHOD,
        severity: 'high',
        component: 'AuditLogger',
        description: 'AuditLoggerクラスにlogメソッドが存在しません',
        detectedAt: new Date(),
        autoFixable: true,
        fixApplied: false
      };

      // logメソッドを削除してテスト環境を準備
      const auditLogger = (controller as any).auditLogger;
      delete auditLogger.log;
      expect(typeof auditLogger.log).toBe('undefined');

      // 修正を実行
      const result = await (controller as any).fixAuditLoggerLogMethod(issue);
      expect(result).toBe(true);

      // logメソッドが追加されたことを確認
      expect(typeof auditLogger.log).toBe('function');

      // logメソッドが正常に動作することを確認
      await expect(auditLogger.log({ test: 'data' })).resolves.not.toThrow();
    });
  });

  describe('設定の修正', () => {
    it('不正な設定ファイルを修正する', async () => {
      const issue: QualityIssue = {
        id: 'config-validation-error',
        type: QualityIssueType.INVALID_CONFIG,
        severity: 'critical',
        component: 'PolicyManager',
        description: '設定ファイルの読み込みに失敗しました',
        detectedAt: new Date(),
        autoFixable: true,
        fixApplied: false
      };

      // 設定ファイルを削除してテスト環境を準備
      const configPath = '.kiro/settings/trust-policy.json';
      try {
        await fs.unlink(configPath);
      } catch (error) {
        // ファイルが存在しない場合は無視
      }

      // 修正を実行
      const result = await (controller as any).fixConfigValidationError(issue);
      expect(result).toBe(true);

      // 設定ファイルが作成されたことを確認
      const configExists = await fs.access(configPath).then(() => true).catch(() => false);
      expect(configExists).toBe(true);

      // 設定ファイルの内容を確認
      const configContent = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(configContent);
      expect(config.version).toBeDefined();
      expect(config.autoApprove).toBeDefined();
      expect(config.manualApprove).toBeDefined();
      expect(config.security).toBeDefined();
    });

    it('自動承認率を改善する', async () => {
      const issue: QualityIssue = {
        id: 'low-auto-approval-rate',
        type: QualityIssueType.INVALID_CONFIG,
        severity: 'medium',
        component: 'PolicyManager',
        description: '自動承認率が95%を下回っています',
        detectedAt: new Date(),
        autoFixable: true,
        fixApplied: false,
        metadata: {
          currentRate: 80,
          targetRate: 95
        }
      };

      // 修正を実行
      const result = await (controller as any).fixAutoApprovalRate(issue);
      expect(result).toBe(true);

      // 設定が更新されたことを確認
      const policyManager = (controller as any).policyManager;
      const policy = await policyManager.loadPolicy();
      expect(policy.autoApprove.gitOperations.length).toBeGreaterThan(0);
      expect(policy.autoApprove.fileOperations.length).toBeGreaterThan(0);
    });
  });

  describe('パフォーマンス最適化', () => {
    it('決定処理の最適化を適用する', async () => {
      const issue: QualityIssue = {
        id: 'slow-decision-processing',
        type: QualityIssueType.PERFORMANCE_DEGRADATION,
        severity: 'medium',
        component: 'TrustDecisionEngine',
        description: '判定処理時間が100msを超過しています',
        detectedAt: new Date(),
        autoFixable: true,
        fixApplied: false,
        metadata: {
          processingTime: 150,
          targetTime: 100
        }
      };

      // 修正を実行
      const result = await (controller as any).optimizeDecisionProcessing(issue);
      expect(result).toBe(true);

      // キャッシュ機能が追加されたことを確認
      const decisionEngine = (controller as any).decisionEngine;
      const testOperation = {
        type: 'git',
        command: 'git',
        args: ['status'],
        context: { cwd: '/test' },
        timestamp: new Date()
      };

      // 同じ操作を2回実行してキャッシュ効果を確認
      const startTime1 = performance.now();
      await decisionEngine.evaluateOperation(testOperation);
      const time1 = performance.now() - startTime1;

      const startTime2 = performance.now();
      await decisionEngine.evaluateOperation(testOperation);
      const time2 = performance.now() - startTime2;

      // 2回目の方が高速であることを確認（キャッシュ効果）
      expect(time2).toBeLessThan(time1);
    });
  });

  describe('修正結果の検証', () => {
    it('修正後に検証を実行する', async () => {
      const issue: QualityIssue = {
        id: 'test-validation',
        type: QualityIssueType.MISSING_METHOD,
        severity: 'high',
        component: 'AuditLogger',
        description: 'テスト用の検証対象問題',
        detectedAt: new Date(),
        autoFixable: true,
        fixApplied: false
      };

      // 修正を実行
      const issues = [issue];
      const fixedCount = await (controller as any).applyAutoFixes(issues);
      
      expect(fixedCount).toBe(1);
      expect(issue.fixApplied).toBe(true);
    });

    it('検証に失敗した場合はロールバックする', async () => {
      // モックアクションを設定（検証が失敗するように）
      const mockAction = {
        issueType: QualityIssueType.MISSING_METHOD,
        description: 'テスト用の失敗する修正',
        execute: jest.fn().mockResolvedValue(true),
        validate: jest.fn().mockResolvedValue(false),
        rollback: jest.fn().mockResolvedValue(true)
      };

      (controller as any).autoFixActions.set(QualityIssueType.MISSING_METHOD, mockAction);

      const issue: QualityIssue = {
        id: 'test-rollback',
        type: QualityIssueType.MISSING_METHOD,
        severity: 'high',
        component: 'TestComponent',
        description: 'テスト用のロールバック対象問題',
        detectedAt: new Date(),
        autoFixable: true,
        fixApplied: false
      };

      const issues = [issue];
      const fixedCount = await (controller as any).applyAutoFixes(issues);

      expect(fixedCount).toBe(0);
      expect(issue.fixApplied).toBe(false);
      expect(mockAction.execute).toHaveBeenCalled();
      expect(mockAction.validate).toHaveBeenCalled();
      expect(mockAction.rollback).toHaveBeenCalled();
    });
  });

  describe('修正履歴の管理', () => {
    it('修正履歴を正しく記録する', async () => {
      const historyEntry = {
        id: 'test-fix-1',
        issueId: 'test-issue-1',
        fixType: 'test_fix',
        appliedAt: new Date(),
        success: true,
        description: 'テスト用の修正',
        beforeState: { test: 'before' },
        afterState: { test: 'after' }
      };

      await (controller as any).recordFixHistory(historyEntry);

      const history = controller.getFixHistory();
      expect(history).toContain(historyEntry);
    });

    it('修正統計を正しく計算する', async () => {
      // テスト用の履歴を追加
      const entries = [
        {
          id: 'fix-1',
          issueId: 'issue-1',
          fixType: 'method_addition',
          appliedAt: new Date(),
          success: true,
          description: '成功した修正1',
          beforeState: {},
          afterState: {}
        },
        {
          id: 'fix-2',
          issueId: 'issue-2',
          fixType: 'config_creation',
          appliedAt: new Date(),
          success: false,
          description: '失敗した修正',
          beforeState: {},
          afterState: {}
        },
        {
          id: 'fix-3',
          issueId: 'issue-3',
          fixType: 'method_addition',
          appliedAt: new Date(),
          success: true,
          description: '成功した修正2',
          beforeState: {},
          afterState: {}
        }
      ];

      for (const entry of entries) {
        await (controller as any).recordFixHistory(entry);
      }

      const stats = controller.getFixStatistics();
      expect(stats.totalFixes).toBe(3);
      expect(stats.successfulFixes).toBe(2);
      expect(stats.failedFixes).toBe(1);
      expect(stats.fixesByType['method_addition']).toBe(2);
      expect(stats.fixesByType['config_creation']).toBe(1);
      expect(stats.recentFixes.length).toBe(3);
    });
  });

  describe('ロールバック機能', () => {
    it('修正をロールバックできる', async () => {
      // テスト用の修正履歴を作成
      const fixEntry = {
        id: 'rollback-test-1',
        issueId: 'test-issue',
        fixType: 'method_addition',
        appliedAt: new Date(),
        success: true,
        description: 'ロールバックテスト用の修正',
        beforeState: { hasMethod: false },
        afterState: { hasMethod: true },
        rollbackData: { methodName: 'testMethod' }
      };

      await (controller as any).recordFixHistory(fixEntry);

      // テスト用のメソッドを追加
      const auditLogger = (controller as any).auditLogger;
      auditLogger.testMethod = () => 'test';
      expect(typeof auditLogger.testMethod).toBe('function');

      // ロールバックを実行
      const result = await controller.rollbackFix('rollback-test-1');
      expect(result).toBe(true);

      // メソッドが削除されたことを確認
      expect(auditLogger.testMethod).toBeUndefined();
    });

    it('存在しない修正IDのロールバックは失敗する', async () => {
      const result = await controller.rollbackFix('non-existent-fix');
      expect(result).toBe(false);
    });
  });

  describe('統合テスト', () => {
    it('品質チェックから自動修正まで一連の流れが正常に動作する', async () => {
      // 品質チェックを実行
      const result = await controller.performQualityCheck();
      
      expect(result).toBeDefined();
      expect(result.issues).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.recommendations).toBeDefined();

      // 自動修正可能な問題があれば修正されていることを確認
      const autoFixableIssues = result.issues.filter(issue => issue.autoFixable);
      const fixedIssues = result.issues.filter(issue => issue.fixApplied);
      
      if (autoFixableIssues.length > 0) {
        expect(result.summary.autoFixed).toBeGreaterThan(0);
      }

      // 修正履歴が記録されていることを確認
      const history = controller.getFixHistory();
      if (fixedIssues.length > 0) {
        expect(history.length).toBeGreaterThan(0);
      }
    });
  });
});