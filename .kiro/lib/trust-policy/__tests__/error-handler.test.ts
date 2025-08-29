/**
 * エラーハンドリングシステムのテスト
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import { join } from 'path';
import { TrustErrorHandler, TrustErrorType, TrustError } from '../error-handler';

const TEST_DIR = '.kiro-error-handler-test';
const TEST_REPORTS_DIR = join(TEST_DIR, 'reports');
const TEST_SETTINGS_DIR = join(TEST_DIR, 'settings');

describe('TrustErrorHandler', () => {
  let errorHandler: TrustErrorHandler;

  beforeEach(async () => {
    // テスト用ディレクトリの作成
    await fs.mkdir(TEST_REPORTS_DIR, { recursive: true });
    await fs.mkdir(TEST_SETTINGS_DIR, { recursive: true });
    
    errorHandler = new TrustErrorHandler({
      enableSafeMode: true,
      defaultDecision: 'manual',
      maxRetries: 3,
      retryDelay: 100, // テスト用に短縮
      emergencyMode: {
        enabled: false,
        autoApproveOnly: ['git status', 'git log']
      }
    });

    // テスト用のパスを設定
    (errorHandler as any).errorLogPath = join(TEST_REPORTS_DIR, 'trust-error-log.jsonl');
    
    await errorHandler.initialize();
  });

  afterEach(async () => {
    try {
      await fs.rm(TEST_DIR, { recursive: true, force: true });
    } catch (error) {
      // 削除に失敗しても続行
    }
  });

  describe('初期化', () => {
    it('エラーハンドラーが正しく初期化される', async () => {
      const exists = await fs.access(TEST_REPORTS_DIR).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    it('既存のエラーログが読み込まれる', async () => {
      // 既存のエラーログを作成
      const existingErrors = [
        {
          type: TrustErrorType.CONFIG_ERROR,
          message: 'Test config error',
          timestamp: new Date().toISOString(),
          severity: 'medium',
          recoverable: true
        }
      ];

      const logPath = join(TEST_REPORTS_DIR, 'trust-error-log.jsonl');
      const content = existingErrors.map(e => JSON.stringify(e)).join('\n') + '\n';
      await fs.writeFile(logPath, content, 'utf-8');

      // 新しいハンドラーで読み込み
      const newHandler = new TrustErrorHandler();
      (newHandler as any).errorLogPath = logPath;
      await newHandler.initialize();

      const stats = newHandler.getErrorStatistics();
      expect(stats.totalErrors).toBeGreaterThan(0);
    });
  });

  describe('エラー分類', () => {
    it('設定エラーが正しく分類される', async () => {
      const configError = new Error('Invalid config setting detected');
      const result = await errorHandler.handleError(configError);

      expect(result.fallbackApplied).toBe(true);
      expect(result.reason).toContain('設定');
    });

    it('検証エラーが正しく分類される', async () => {
      const validationError = new Error('Validation failed for operation');
      const result = await errorHandler.handleError(validationError);

      expect(result.decision).toBe('manual');
      expect(result.fallbackApplied).toBe(true);
      expect(result.reason).toContain('検証エラー');
    });

    it('セキュリティエラーが正しく分類される', async () => {
      const securityError = new Error('Unauthorized access detected');
      const result = await errorHandler.handleError(securityError);

      expect(result.decision).toBe('manual');
      expect(result.fallbackApplied).toBe(true);
      expect(result.reason).toContain('セキュリティエラー');
      expect(errorHandler.isEmergencyModeEnabled()).toBe(true);
    });

    it('パフォーマンスエラーが正しく分類される', async () => {
      const performanceError = new Error('Operation timeout exceeded');
      const result = await errorHandler.handleError(performanceError);

      expect(result.decision).toBe('auto');
      expect(result.fallbackApplied).toBe(true);
      expect(result.reason).toContain('パフォーマンス');
    });
  });

  describe('エラー重要度判定', () => {
    it('重要度が正しく判定される', async () => {
      const criticalError = new Error('Critical system failure');
      await errorHandler.handleError(criticalError);

      const stats = errorHandler.getErrorStatistics();
      expect(stats.lastError?.severity).toBe('critical');
    });

    it('セキュリティエラーは高重要度として扱われる', async () => {
      const securityError = new Error('Security breach detected');
      await errorHandler.handleError(securityError);

      const stats = errorHandler.getErrorStatistics();
      expect(stats.lastError?.severity).toBe('high');
    });
  });

  describe('フォールバック機能', () => {
    it('設定エラー時にデフォルト設定が復帰される', async () => {
      const configError: TrustError = {
        type: TrustErrorType.CONFIG_ERROR,
        message: 'Config file corrupted',
        timestamp: new Date().toISOString(),
        severity: 'medium',
        recoverable: true
      };

      const result = await errorHandler.handleError(configError);

      expect(result.fallbackApplied).toBe(true);
      expect(result.reason).toContain('デフォルト設定');

      // デフォルト設定ファイルが作成されることを確認
      const configPath = '.kiro/settings/trust-policy.json';
      const exists = await fs.access(configPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    it('判定エラー時にリトライが実行される', async () => {
      const decisionError: TrustError = {
        type: TrustErrorType.DECISION_ERROR,
        message: 'Decision evaluation failed',
        timestamp: new Date().toISOString(),
        severity: 'medium',
        recoverable: true,
        context: { retryCount: 0 }
      };

      const result = await errorHandler.handleError(decisionError);

      expect(result.reason).toContain('リトライ');
      expect(result.fallbackApplied).toBe(false);
    });

    it('リトライ上限に達すると手動承認に切り替わる', async () => {
      const decisionError: TrustError = {
        type: TrustErrorType.DECISION_ERROR,
        message: 'Decision evaluation failed',
        timestamp: new Date().toISOString(),
        severity: 'medium',
        recoverable: true,
        context: { retryCount: 3 }
      };

      const result = await errorHandler.handleError(decisionError);

      expect(result.decision).toBe('manual');
      expect(result.fallbackApplied).toBe(true);
      expect(result.reason).toContain('リトライ上限');
    });
  });

  describe('緊急モード', () => {
    it('セキュリティエラー時に緊急モードが有効化される', async () => {
      const securityError: TrustError = {
        type: TrustErrorType.SECURITY_ERROR,
        message: 'Security threat detected',
        timestamp: new Date().toISOString(),
        severity: 'high',
        recoverable: false
      };

      await errorHandler.handleError(securityError);

      expect(errorHandler.isEmergencyModeEnabled()).toBe(true);

      // 緊急モード設定ファイルが作成されることを確認
      const emergencyConfigPath = '.kiro/settings/emergency-mode.json';
      const exists = await fs.access(emergencyConfigPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    it('緊急モードで許可された操作のみが自動承認される', async () => {
      // 緊急モードを有効化
      const securityError: TrustError = {
        type: TrustErrorType.SECURITY_ERROR,
        message: 'Security threat',
        timestamp: new Date().toISOString(),
        severity: 'high',
        recoverable: false
      };
      await errorHandler.handleError(securityError);

      // 許可された操作
      expect(errorHandler.isAllowedInEmergencyMode('git status')).toBe(true);
      expect(errorHandler.isAllowedInEmergencyMode('git log')).toBe(true);

      // 許可されていない操作
      expect(errorHandler.isAllowedInEmergencyMode('git push')).toBe(false);
      expect(errorHandler.isAllowedInEmergencyMode('rm -rf')).toBe(false);
    });

    it('緊急モードを手動で無効化できる', async () => {
      // 緊急モードを有効化
      const securityError: TrustError = {
        type: TrustErrorType.SECURITY_ERROR,
        message: 'Security threat',
        timestamp: new Date().toISOString(),
        severity: 'high',
        recoverable: false
      };
      await errorHandler.handleError(securityError);

      expect(errorHandler.isEmergencyModeEnabled()).toBe(true);

      // 緊急モードを無効化
      await errorHandler.disableEmergencyMode();

      expect(errorHandler.isEmergencyModeEnabled()).toBe(false);
    });
  });

  describe('エラーログ', () => {
    it('エラーがログファイルに記録される', async () => {
      const testError = new Error('Test error for logging');
      await errorHandler.handleError(testError);

      const logPath = join(TEST_REPORTS_DIR, 'trust-error-log.jsonl');
      const exists = await fs.access(logPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);

      const content = await fs.readFile(logPath, 'utf-8');
      expect(content).toContain('Test error for logging');
    });

    it('実行エラーが詳細ログに記録される', async () => {
      const executionError: TrustError = {
        type: TrustErrorType.EXECUTION_ERROR,
        message: 'Execution failed',
        timestamp: new Date().toISOString(),
        severity: 'low',
        recoverable: true,
        context: { operation: 'test-operation' }
      };

      await errorHandler.handleError(executionError);

      const executionLogPath = '.kiro/reports/trust-execution-error.log';
      const exists = await fs.access(executionLogPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);

      const content = await fs.readFile(executionLogPath, 'utf-8');
      expect(content).toContain('Execution failed');
      expect(content).toContain('test-operation');
    });

    it('ログサイズが制限される', async () => {
      // ログサイズ制限を小さく設定
      (errorHandler as any).maxLogSize = 5;

      // 制限を超える数のエラーを生成
      for (let i = 0; i < 10; i++) {
        await errorHandler.handleError(new Error(`Test error ${i}`));
      }

      const stats = errorHandler.getErrorStatistics();
      expect(stats.totalErrors).toBeLessThanOrEqual(5);
    });
  });

  describe('エラー統計', () => {
    beforeEach(async () => {
      // テスト用のエラーを生成
      const errors = [
        { type: TrustErrorType.CONFIG_ERROR, message: 'Config error 1' },
        { type: TrustErrorType.CONFIG_ERROR, message: 'Config error 2' },
        { type: TrustErrorType.VALIDATION_ERROR, message: 'Validation error 1' },
        { type: TrustErrorType.SECURITY_ERROR, message: 'Security error 1' }
      ];

      for (const error of errors) {
        await errorHandler.handleError(new Error(error.message));
      }
    });

    it('エラー統計が正しく計算される', () => {
      const stats = errorHandler.getErrorStatistics();

      expect(stats.totalErrors).toBe(4);
      expect(stats.errorsByType[TrustErrorType.CONFIG_ERROR]).toBe(2);
      expect(stats.errorsByType[TrustErrorType.VALIDATION_ERROR]).toBe(1);
      expect(stats.errorsByType[TrustErrorType.SECURITY_ERROR]).toBe(1);
      expect(stats.lastError).toBeDefined();
    });

    it('回復成功率が計算される', () => {
      const stats = errorHandler.getErrorStatistics();
      expect(stats.recoverySuccessRate).toBeGreaterThan(0);
      expect(stats.recoverySuccessRate).toBeLessThanOrEqual(100);
    });

    it('時間別エラー統計が生成される', () => {
      const stats = errorHandler.getErrorStatistics();
      expect(typeof stats.errorsByHour).toBe('object');
    });
  });

  describe('ヘルスチェック', () => {
    it('正常状態でhealthyステータスを返す', async () => {
      const health = await errorHandler.performHealthCheck();
      expect(health.status).toBe('healthy');
      expect(health.issues).toHaveLength(0);
    });

    it('多数のエラーでwarningステータスを返す', async () => {
      // 多数のエラーを生成
      for (let i = 0; i < 60; i++) {
        await errorHandler.handleError(new Error(`Test error ${i}`));
      }

      const health = await errorHandler.performHealthCheck();
      expect(health.status).toBe('warning');
      expect(health.issues.length).toBeGreaterThan(0);
      expect(health.recommendations.length).toBeGreaterThan(0);
    });

    it('セキュリティエラーでcriticalステータスを返す', async () => {
      const securityError: TrustError = {
        type: TrustErrorType.SECURITY_ERROR,
        message: 'Security breach',
        timestamp: new Date().toISOString(),
        severity: 'high',
        recoverable: false
      };

      await errorHandler.handleError(securityError);

      const health = await errorHandler.performHealthCheck();
      expect(health.status).toBe('critical');
      expect(health.issues.some(issue => issue.includes('セキュリティエラー'))).toBe(true);
    });

    it('緊急モード有効時にcriticalステータスを返す', async () => {
      // 緊急モードを有効化
      const securityError: TrustError = {
        type: TrustErrorType.SECURITY_ERROR,
        message: 'Security threat',
        timestamp: new Date().toISOString(),
        severity: 'high',
        recoverable: false
      };
      await errorHandler.handleError(securityError);

      const health = await errorHandler.performHealthCheck();
      expect(health.status).toBe('critical');
      expect(health.issues.some(issue => issue.includes('緊急モード'))).toBe(true);
    });
  });

  describe('クリーンアップ', () => {
    it('古いエラーログがクリーンアップされる', async () => {
      // 古いエラーを作成
      const oldError: TrustError = {
        type: TrustErrorType.CONFIG_ERROR,
        message: 'Old error',
        timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8日前
        severity: 'low',
        recoverable: true
      };

      // 新しいエラーを作成
      const newError: TrustError = {
        type: TrustErrorType.CONFIG_ERROR,
        message: 'New error',
        timestamp: new Date().toISOString(),
        severity: 'low',
        recoverable: true
      };

      // エラーログに直接追加
      (errorHandler as any).errorLog = [oldError, newError];

      // クリーンアップ実行
      await errorHandler.cleanupErrorLog();

      const stats = errorHandler.getErrorStatistics();
      expect(stats.totalErrors).toBe(1); // 新しいエラーのみ残る
      expect(stats.lastError?.message).toBe('New error');
    });
  });

  describe('エラー処理の継続性', () => {
    it('ログ書き込みエラーでも処理が継続される', async () => {
      // 書き込み権限のないパスを設定
      (errorHandler as any).errorLogPath = '/invalid/path/error.log';

      // エラー処理が例外を投げないことを確認
      await expect(errorHandler.handleError(new Error('Test error'))).resolves.not.toThrow();
    });

    it('設定復帰エラーでも適切にフォールバックする', async () => {
      // 設定ディレクトリを読み取り専用にする（テスト環境によっては動作しない可能性）
      try {
        await fs.chmod('.kiro/settings', 0o444);
      } catch (error) {
        // 権限変更に失敗した場合はテストをスキップ
        return;
      }

      const configError: TrustError = {
        type: TrustErrorType.CONFIG_ERROR,
        message: 'Config corruption',
        timestamp: new Date().toISOString(),
        severity: 'critical',
        recoverable: true
      };

      const result = await errorHandler.handleError(configError);

      // 設定復帰に失敗しても手動承認にフォールバックすることを確認
      expect(result.decision).toBe('manual');
      expect(result.fallbackApplied).toBe(true);
    });
  });
});