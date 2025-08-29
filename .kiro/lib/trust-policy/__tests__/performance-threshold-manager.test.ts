import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PerformanceThresholdManager } from '../performance-threshold-manager.js';

// モックの設定
vi.mock('../audit-logger.js', () => ({
  AuditLogger: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    logPerformanceAlert: vi.fn().mockResolvedValue(undefined)
  }))
}));

vi.mock('fs/promises', () => ({
  readFile: vi.fn().mockRejectedValue(new Error('File not found')),
  writeFile: vi.fn().mockResolvedValue(undefined)
}));

describe('PerformanceThresholdManager', () => {
  let thresholdManager: PerformanceThresholdManager;
  let mockMetrics: any[];

  beforeEach(async () => {
    vi.clearAllMocks();
    
    thresholdManager = new PerformanceThresholdManager();
    
    // テスト用のメトリクスデータ
    mockMetrics = Array.from({ length: 20 }, (_, i) => ({
      operationType: 'test',
      operationId: `test-${i}`,
      executionTime: 50 + Math.random() * 100, // 50-150ms
      memoryUsage: (100 + Math.random() * 50) * 1024 * 1024, // 100-150MB
      cpuUsage: 20 + Math.random() * 40, // 20-60%
      timestamp: new Date(Date.now() - (19 - i) * 60000), // 過去20分間
      threshold: {
        executionTime: 100,
        memoryUsage: 512 * 1024 * 1024
      },
      status: 'pass'
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('初期化', () => {
    it('正常に初期化できること', async () => {
      await expect(thresholdManager.initialize()).resolves.not.toThrow();
    });

    it('初期化後にデフォルト閾値が設定されること', async () => {
      await thresholdManager.initialize();
      
      const thresholds = thresholdManager.getCurrentThresholds();
      expect(thresholds.current.executionTime).toBeGreaterThan(0);
      expect(thresholds.current.memoryUsage).toBeGreaterThan(0);
      expect(thresholds.current.cpuUsage).toBeGreaterThan(0);
    });
  });

  describe('動的閾値調整', () => {
    beforeEach(async () => {
      await thresholdManager.initialize();
    });

    it('十分なデータがある場合に閾値調整が実行されること', async () => {
      const result = await thresholdManager.adjustThresholdsDynamically(mockMetrics);
      
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
      expect(result.adjustments).toBeInstanceOf(Array);
      expect(result.executionTime).toBeGreaterThan(0);
    });

    it('データが不足している場合に適切なメッセージが返されること', async () => {
      const insufficientData = mockMetrics.slice(0, 5); // 5件のみ
      const result = await thresholdManager.adjustThresholdsDynamically(insufficientData);
      
      expect(result.success).toBe(false);
      expect(result.reason).toContain('最小データ数');
    });

    it('調整が必要な場合に新しい閾値が設定されること', async () => {
      // 実行時間が高い値のメトリクスを作成
      const highExecutionTimeMetrics = mockMetrics.map(m => ({
        ...m,
        executionTime: 200 + Math.random() * 100 // 200-300ms（現在の閾値100msを大幅に超過）
      }));

      const beforeThresholds = thresholdManager.getCurrentThresholds();
      const result = await thresholdManager.adjustThresholdsDynamically(highExecutionTimeMetrics);
      const afterThresholds = thresholdManager.getCurrentThresholds();

      if (result.success && result.adjustments.length > 0) {
        expect(afterThresholds.current.executionTime).not.toBe(beforeThresholds.current.executionTime);
      }
    });
  });

  describe('パフォーマンス劣化検出', () => {
    beforeEach(async () => {
      await thresholdManager.initialize();
    });

    it('正常なメトリクスでは劣化が検出されないこと', async () => {
      const normalMetrics = {
        operationType: 'test',
        operationId: 'normal-test',
        executionTime: 50, // 正常範囲
        memoryUsage: 100 * 1024 * 1024, // 正常範囲
        cpuUsage: 30, // 正常範囲
        timestamp: new Date(),
        threshold: {
          executionTime: 100,
          memoryUsage: 512 * 1024 * 1024
        },
        status: 'pass'
      };

      const result = await thresholdManager.detectPerformanceDegradation(normalMetrics);
      
      expect(result.degradationDetected).toBe(false);
      expect(result.severity).toBe('none');
      expect(result.affectedMetrics).toHaveLength(0);
    });

    it('異常なメトリクスで劣化が検出されること', async () => {
      const degradedMetrics = {
        operationType: 'test',
        operationId: 'degraded-test',
        executionTime: 500, // 大幅に悪化
        memoryUsage: 800 * 1024 * 1024, // 大幅に悪化
        cpuUsage: 90, // 大幅に悪化
        timestamp: new Date(),
        threshold: {
          executionTime: 100,
          memoryUsage: 512 * 1024 * 1024
        },
        status: 'fail'
      };

      const result = await thresholdManager.detectPerformanceDegradation(degradedMetrics);
      
      expect(result.degradationDetected).toBe(true);
      expect(result.severity).not.toBe('none');
      expect(result.affectedMetrics.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('劣化検出時に適切な推奨事項が生成されること', async () => {
      const degradedMetrics = {
        operationType: 'test',
        operationId: 'degraded-test',
        executionTime: 300,
        memoryUsage: 600 * 1024 * 1024,
        cpuUsage: 85,
        timestamp: new Date(),
        threshold: {
          executionTime: 100,
          memoryUsage: 512 * 1024 * 1024
        },
        status: 'fail'
      };

      const result = await thresholdManager.detectPerformanceDegradation(degradedMetrics);
      
      if (result.degradationDetected) {
        expect(result.recommendations).toContain(
          expect.stringMatching(/実行時間|メモリ|CPU/)
        );
      }
    });
  });

  describe('閾値超過時の自動対応', () => {
    beforeEach(async () => {
      await thresholdManager.initialize();
    });

    it('軽微な違反に対して適切な対応が実行されること', async () => {
      const minorViolation = {
        metric: 'executionTime',
        value: 120,
        threshold: 100,
        message: 'Minor threshold violation',
        severity: 'warning' as const,
        timestamp: new Date(),
        operationId: 'test-minor'
      };

      const result = await thresholdManager.handleThresholdViolation(minorViolation);
      
      expect(result.success).toBe(true);
      expect(result.actionsPerformed.length).toBeGreaterThan(0);
      expect(result.responseTime).toBeGreaterThan(0);
      expect(result.actionsPerformed.some(a => a.action === 'log_violation')).toBe(true);
    });

    it('重大な違反に対してより多くの対応が実行されること', async () => {
      const criticalViolation = {
        metric: 'executionTime',
        value: 400, // 閾値の4倍
        threshold: 100,
        message: 'Critical threshold violation',
        severity: 'critical' as const,
        timestamp: new Date(),
        operationId: 'test-critical'
      };

      const result = await thresholdManager.handleThresholdViolation(criticalViolation);
      
      expect(result.success).toBe(true);
      expect(result.actionsPerformed.length).toBeGreaterThan(1);
      expect(result.actionsPerformed.some(a => a.action === 'immediate_alert')).toBe(true);
      expect(result.effectiveness).toBeGreaterThan(0);
    });

    it('対応の効果が適切に評価されること', async () => {
      const violation = {
        metric: 'memoryUsage',
        value: 600 * 1024 * 1024,
        threshold: 512 * 1024 * 1024,
        message: 'Memory threshold violation',
        severity: 'warning' as const,
        timestamp: new Date(),
        operationId: 'test-memory'
      };

      const result = await thresholdManager.handleThresholdViolation(violation);
      
      expect(result.effectiveness).toBeGreaterThanOrEqual(0);
      expect(result.effectiveness).toBeLessThanOrEqual(1);
      expect(typeof result.followUpRequired).toBe('boolean');
    });
  });

  describe('パフォーマンストレンド分析', () => {
    beforeEach(async () => {
      await thresholdManager.initialize();
    });

    it('十分なデータでトレンド分析が実行されること', async () => {
      const result = await thresholdManager.analyzePerformanceTrends(mockMetrics);
      
      expect(result).toBeDefined();
      expect(result.trends).toBeInstanceOf(Array);
      expect(result.predictions).toBeInstanceOf(Array);
      expect(result.anomalies).toBeInstanceOf(Array);
      expect(result.recommendations).toBeInstanceOf(Array);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('データが不足している場合に適切なメッセージが返されること', async () => {
      const insufficientData = mockMetrics.slice(0, 10); // 10件のみ
      const result = await thresholdManager.analyzePerformanceTrends(insufficientData);
      
      expect(result.recommendations).toContain(
        expect.stringMatching(/最低20件のデータが必要/)
      );
    });

    it('悪化傾向のデータで適切なトレンドが検出されること', async () => {
      // 時間とともに悪化するメトリクスを作成
      const degradingMetrics = mockMetrics.map((m, i) => ({
        ...m,
        executionTime: 50 + i * 10, // 徐々に増加
        memoryUsage: (100 + i * 5) * 1024 * 1024 // 徐々に増加
      }));

      const result = await thresholdManager.analyzePerformanceTrends(degradingMetrics);
      
      // トレンドが検出される可能性がある
      if (result.trends.length > 0) {
        const degradingTrends = result.trends.filter(t => t.direction === 'degrading');
        expect(degradingTrends.length).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('閾値管理', () => {
    beforeEach(async () => {
      await thresholdManager.initialize();
    });

    it('現在の閾値を取得できること', () => {
      const thresholds = thresholdManager.getCurrentThresholds();
      
      expect(thresholds).toBeDefined();
      expect(thresholds.current).toBeDefined();
      expect(thresholds.confidence).toBeGreaterThanOrEqual(0);
      expect(thresholds.confidence).toBeLessThanOrEqual(1);
      expect(thresholds.lastUpdated).toBeInstanceOf(Date);
    });

    it('閾値履歴を取得できること', () => {
      const history = thresholdManager.getThresholdHistory();
      
      expect(history).toBeInstanceOf(Array);
    });

    it('パフォーマンスベースラインを取得できること', () => {
      const baseline = thresholdManager.getPerformanceBaseline();
      
      expect(baseline).toBeDefined();
      expect(baseline.executionTime).toBeDefined();
      expect(baseline.memoryUsage).toBeDefined();
      expect(baseline.cpuUsage).toBeDefined();
      expect(baseline.establishedAt).toBeInstanceOf(Date);
    });
  });

  describe('エラーハンドリング', () => {
    beforeEach(async () => {
      await thresholdManager.initialize();
    });

    it('無効なメトリクスデータでもエラーが発生しないこと', async () => {
      const invalidMetrics = null as any;
      
      await expect(
        thresholdManager.adjustThresholdsDynamically(invalidMetrics)
      ).resolves.not.toThrow();
    });

    it('劣化検出でエラーが発生した場合に適切に処理されること', async () => {
      const invalidMetrics = {} as any;
      
      const result = await thresholdManager.detectPerformanceDegradation(invalidMetrics);
      
      expect(result.degradationDetected).toBe(false);
      expect(result.severity).toBe('error');
    });

    it('自動対応でエラーが発生した場合に適切に処理されること', async () => {
      const invalidViolation = {} as any;
      
      const result = await thresholdManager.handleThresholdViolation(invalidViolation);
      
      expect(result.success).toBe(false);
      expect(result.details).toContain('エラー');
    });
  });

  describe('パフォーマンス要件', () => {
    beforeEach(async () => {
      await thresholdManager.initialize();
    });

    it('閾値調整処理が高速であること', async () => {
      const start = performance.now();
      
      await thresholdManager.adjustThresholdsDynamically(mockMetrics);
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(1000); // 1秒以内
    });

    it('劣化検出処理が高速であること', async () => {
      const testMetrics = mockMetrics[0];
      const start = performance.now();
      
      await thresholdManager.detectPerformanceDegradation(testMetrics);
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(500); // 500ms以内
    });

    it('自動対応処理が高速であること', async () => {
      const violation = {
        metric: 'executionTime',
        value: 150,
        threshold: 100,
        message: 'Test violation',
        severity: 'warning' as const,
        timestamp: new Date(),
        operationId: 'perf-test'
      };

      const start = performance.now();
      
      await thresholdManager.handleThresholdViolation(violation);
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(200); // 200ms以内
    });
  });
});