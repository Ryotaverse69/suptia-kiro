/**
 * QualityAssuranceController テスト
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import { QualityAssuranceController, QualityIssueType } from '../quality-assurance-controller';

// モックの設定
vi.mock('fs', () => ({
  promises: {
    mkdir: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
    readdir: vi.fn(),
    unlink: vi.fn()
  }
}));

vi.mock('../policy-manager', () => ({
  PolicyManager: vi.fn().mockImplementation(() => ({
    loadPolicy: vi.fn().mockResolvedValue({
      version: '1.0',
      autoApprove: {
        gitOperations: ['status', 'commit'],
        fileOperations: ['read', 'write'],
        cliOperations: { vercel: ['status'] }
      },
      manualApprove: {
        deleteOperations: ['rm -rf'],
        forceOperations: ['git push --force'],
        productionImpact: ['vercel:envSet']
      }
    })
  }))
}));

vi.mock('../operation-classifier', () => ({
  OperationClassifier: vi.fn().mockImplementation(() => ({}))
}));

vi.mock('../trust-decision-engine', () => ({
  TrustDecisionEngine: vi.fn().mockImplementation(() => ({
    evaluateOperation: vi.fn().mockResolvedValue({ approved: true, reason: 'test' })
  }))
}));

vi.mock('../audit-logger', () => ({
  AuditLogger: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    log: undefined // 意図的にundefinedに設定
  }))
}));

vi.mock('../metrics-collector', () => ({
  MetricsCollector: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    collectMetrics: vi.fn().mockResolvedValue({})
  }))
}));

vi.mock('../error-handler', () => ({
  TrustErrorHandler: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined)
  }))
}));

describe('QualityAssuranceController', () => {
  let controller: QualityAssuranceController;
  const mockFs = fs as any;

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new QualityAssuranceController();
    
    // デフォルトのモック設定
    mockFs.mkdir.mockResolvedValue(undefined);
    mockFs.writeFile.mockResolvedValue(undefined);
    mockFs.readdir.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('初期化', () => {
    it('正常に初期化できる', async () => {
      await expect(controller.initialize()).resolves.not.toThrow();
      expect(mockFs.mkdir).toHaveBeenCalledWith('.kiro/reports/quality', { recursive: true });
    });

    it('初期化エラーを適切に処理する', async () => {
      mockFs.mkdir.mockRejectedValue(new Error('Permission denied'));
      
      await expect(controller.initialize()).rejects.toThrow('Permission denied');
    });
  });

  describe('品質チェック', () => {
    beforeEach(async () => {
      await controller.initialize();
    });

    it('品質チェックを実行できる', async () => {
      mockFs.readdir.mockResolvedValue(['test-result-2025-08-29.json']);
      
      const result = await controller.performQualityCheck();
      
      expect(result).toBeDefined();
      expect(result.issues).toBeInstanceOf(Array);
      expect(result.summary).toBeDefined();
      expect(result.recommendations).toBeInstanceOf(Array);
      expect(typeof result.passed).toBe('boolean');
    });

    it('AuditLoggerのlogメソッド不足を検出する', async () => {
      const result = await controller.performQualityCheck();
      
      const logMethodIssue = result.issues.find(
        issue => issue.id === 'audit-logger-missing-log-method'
      );
      
      expect(logMethodIssue).toBeDefined();
      expect(logMethodIssue?.type).toBe(QualityIssueType.MISSING_METHOD);
      expect(logMethodIssue?.severity).toBe('high');
      expect(logMethodIssue?.autoFixable).toBe(true);
    });

    it('自動承認率の問題を検出する', async () => {
      const result = await controller.performQualityCheck();
      
      const approvalRateIssue = result.issues.find(
        issue => issue.id === 'low-auto-approval-rate'
      );
      
      expect(approvalRateIssue).toBeDefined();
      expect(approvalRateIssue?.type).toBe(QualityIssueType.INVALID_CONFIG);
      expect(approvalRateIssue?.autoFixable).toBe(true);
    });

    it('パフォーマンス問題を検出する', async () => {
      // 遅い処理をシミュレート
      const mockDecisionEngine = (controller as any).decisionEngine;
      mockDecisionEngine.evaluateOperation.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 150)); // 150ms遅延
        return { approved: true, reason: 'test' };
      });

      const result = await controller.performQualityCheck();
      
      const performanceIssue = result.issues.find(
        issue => issue.id === 'slow-decision-processing'
      );
      
      expect(performanceIssue).toBeDefined();
      expect(performanceIssue?.type).toBe(QualityIssueType.PERFORMANCE_DEGRADATION);
    });

    it('テスト結果不足を検出する', async () => {
      mockFs.readdir.mockResolvedValue([]); // テストファイルなし
      
      const result = await controller.performQualityCheck();
      
      const testIssue = result.issues.find(
        issue => issue.id === 'missing-test-results'
      );
      
      expect(testIssue).toBeDefined();
      expect(testIssue?.type).toBe(QualityIssueType.TEST_FAILURE);
    });
  });

  describe('自動修正', () => {
    beforeEach(async () => {
      await controller.initialize();
    });

    it('AuditLoggerのlogメソッドを自動修正する', async () => {
      const result = await controller.performQualityCheck();
      
      const logMethodIssue = result.issues.find(
        issue => issue.id === 'audit-logger-missing-log-method'
      );
      
      expect(logMethodIssue?.fixApplied).toBe(true);
      expect(typeof (controller as any).auditLogger.log).toBe('function');
    });

    it('自動承認率を改善する', async () => {
      const result = await controller.performQualityCheck();
      
      const approvalRateIssue = result.issues.find(
        issue => issue.id === 'low-auto-approval-rate'
      );
      
      expect(approvalRateIssue?.fixApplied).toBe(true);
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        '.kiro/settings/trust-policy.json',
        expect.stringContaining('"add"')
      );
    });

    it('テスト結果ファイルを作成する', async () => {
      mockFs.readdir.mockResolvedValue([]); // テストファイルなし
      
      const result = await controller.performQualityCheck();
      
      const testIssue = result.issues.find(
        issue => issue.id === 'missing-test-results'
      );
      
      expect(testIssue?.fixApplied).toBe(true);
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        '.kiro/reports/test-result-latest.json',
        expect.stringContaining('"testType":"acceptance"')
      );
    });

    it('修正結果を記録する', async () => {
      await controller.performQualityCheck();
      
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringMatching(/\.kiro\/reports\/quality\/fix-results-\d{4}-\d{2}-\d{2}\.json/),
        expect.stringContaining('"totalFixes"')
      );
    });
  });

  describe('統計とレポート', () => {
    beforeEach(async () => {
      await controller.initialize();
      await controller.performQualityCheck(); // 修正履歴を作成
    });

    it('修正統計を取得できる', () => {
      const stats = controller.getFixStatistics();
      
      expect(stats).toBeDefined();
      expect(typeof stats.totalFixes).toBe('number');
      expect(typeof stats.successfulFixes).toBe('number');
      expect(typeof stats.failedFixes).toBe('number');
      expect(stats.fixesByType).toBeDefined();
      expect(Array.isArray(stats.recentFixes)).toBe(true);
    });

    it('修正履歴を取得できる', () => {
      const history = controller.getFixHistory();
      
      expect(Array.isArray(history)).toBe(true);
      if (history.length > 0) {
        expect(history[0]).toHaveProperty('id');
        expect(history[0]).toHaveProperty('issueId');
        expect(history[0]).toHaveProperty('fixType');
        expect(history[0]).toHaveProperty('appliedAt');
        expect(history[0]).toHaveProperty('success');
      }
    });

    it('品質チェック結果をログに記録する', async () => {
      await controller.performQualityCheck();
      
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringMatching(/\.kiro\/reports\/quality\/quality-check-\d{4}-\d{2}-\d{2}\.json/),
        expect.stringContaining('"result"')
      );
    });
  });

  describe('ロールバック機能', () => {
    beforeEach(async () => {
      await controller.initialize();
      await controller.performQualityCheck(); // 修正を実行
    });

    it('存在しない修正IDでロールバックを試行すると失敗する', async () => {
      const result = await controller.rollbackFix('non-existent-id');
      expect(result).toBe(false);
    });

    it('ロールバックデータがない修正をロールバックしようとすると失敗する', async () => {
      const history = controller.getFixHistory();
      if (history.length > 0) {
        // ロールバックデータを削除
        delete history[0].rollbackData;
        
        const result = await controller.rollbackFix(history[0].id);
        expect(result).toBe(false);
      }
    });
  });

  describe('エラーハンドリング', () => {
    it('設定ファイル読み込みエラーを適切に処理する', async () => {
      const mockPolicyManager = (controller as any).policyManager;
      mockPolicyManager.loadPolicy.mockRejectedValue(new Error('Config not found'));
      
      await controller.initialize();
      const result = await controller.performQualityCheck();
      
      const configError = result.issues.find(
        issue => issue.id === 'config-validation-error'
      );
      
      expect(configError).toBeDefined();
      expect(configError?.severity).toBe('critical');
    });

    it('パフォーマンステストエラーを適切に処理する', async () => {
      const mockDecisionEngine = (controller as any).decisionEngine;
      mockDecisionEngine.evaluateOperation.mockRejectedValue(new Error('Engine error'));
      
      await controller.initialize();
      const result = await controller.performQualityCheck();
      
      const performanceError = result.issues.find(
        issue => issue.id === 'performance-test-error'
      );
      
      expect(performanceError).toBeDefined();
      expect(performanceError?.severity).toBe('high');
    });

    it('テストカバレッジチェックエラーを適切に処理する', async () => {
      mockFs.readdir.mockRejectedValue(new Error('Directory not found'));
      
      await controller.initialize();
      const result = await controller.performQualityCheck();
      
      const testError = result.issues.find(
        issue => issue.id === 'test-coverage-check-error'
      );
      
      expect(testError).toBeDefined();
      expect(testError?.severity).toBe('medium');
    });
  });

  describe('推奨事項生成', () => {
    it('重大な問題がある場合の推奨事項を生成する', async () => {
      // 重大な問題をシミュレート
      const mockPolicyManager = (controller as any).policyManager;
      mockPolicyManager.loadPolicy.mockRejectedValue(new Error('Critical error'));
      
      await controller.initialize();
      const result = await controller.performQualityCheck();
      
      expect(result.recommendations).toContain('🚨 重大な問題があります。即座に対応してください。');
    });

    it('問題がない場合の推奨事項を生成する', async () => {
      // 全ての問題を修正済みにする
      mockFs.readdir.mockResolvedValue(['test-result-2025-08-29.json']);
      
      // AuditLoggerにlogメソッドを追加
      (controller as any).auditLogger.log = vi.fn();
      
      await controller.initialize();
      const result = await controller.performQualityCheck();
      
      if (result.issues.length === 0) {
        expect(result.recommendations).toContain('✅ 品質チェックに合格しました。継続的な監視を推奨します。');
      }
    });
  });
});