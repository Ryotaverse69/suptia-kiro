import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PerformanceMonitor } from '../performance-monitor.js';
import { Operation, OperationType, RiskLevel } from '../types.js';

// モックの設定
vi.mock('../trust-decision-engine.js', () => ({
  TrustDecisionEngine: vi.fn().mockImplementation(() => ({
    evaluateOperation: vi.fn().mockResolvedValue({
      approved: true,
      requiresManualApproval: false,
      reason: 'Test operation approved',
      riskLevel: RiskLevel.LOW
    })
  }))
}));

vi.mock('../metrics-collector.js', () => ({
  MetricsCollector: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined)
  }))
}));

vi.mock('../audit-logger.js', () => ({
  AuditLogger: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    logPerformanceFix: vi.fn().mockResolvedValue(undefined),
    logPerformanceAlert: vi.fn().mockResolvedValue(undefined)
  }))
}));

vi.mock('../error-handler.js', () => ({
  ErrorHandler: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    handleError: vi.fn().mockResolvedValue(undefined)
  }))
}));

vi.mock('fs/promises', () => ({
  mkdir: vi.fn().mockResolvedValue(undefined),
  readFile: vi.fn().mockRejectedValue(new Error('File not found')),
  writeFile: vi.fn().mockResolvedValue(undefined),
  access: vi.fn().mockRejectedValue(new Error('File not found'))
}));

describe('PerformanceMonitor', () => {
  let performanceMonitor: PerformanceMonitor;
  let testOperation: Operation;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    performanceMonitor = new PerformanceMonitor();
    
    testOperation = {
      type: OperationType.GIT,
      command: 'git',
      args: ['status'],
      context: {
        workingDirectory: '/test',
        user: 'testuser',
        sessionId: 'test-session'
      },
      timestamp: new Date()
    };

    // パフォーマンス測定のモック
    vi.spyOn(performance, 'now')
      .mockReturnValueOnce(0)  // 開始時間
      .mockReturnValueOnce(50); // 終了時間（50ms経過）

    // プロセスメモリ使用量のモック
    vi.spyOn(process, 'memoryUsage')
      .mockReturnValueOnce({
        rss: 100 * 1024 * 1024,
        heapTotal: 50 * 1024 * 1024,
        heapUsed: 30 * 1024 * 1024,
        external: 5 * 1024 * 1024,
        arrayBuffers: 1 * 1024 * 1024
      })
      .mockReturnValueOnce({
        rss: 105 * 1024 * 1024,
        heapTotal: 52 * 1024 * 1024,
        heapUsed: 32 * 1024 * 1024,
        external: 5 * 1024 * 1024,
        arrayBuffers: 1 * 1024 * 1024
      });

    // CPU使用量のモック
    vi.spyOn(process, 'cpuUsage')
      .mockReturnValueOnce({ user: 1000, system: 500 })
      .mockReturnValueOnce({ user: 2000, system: 1000 });
  });

  afterEach(() => {
    if (performanceMonitor) {
      performanceMonitor.stopRealTimeMonitoring();
    }
    vi.restoreAllMocks();
  });

  describe('初期化', () => {
    it('正常に初期化できること', async () => {
      await expect(performanceMonitor.initialize()).resolves.not.toThrow();
    });

    it('初期化時に必要なディレクトリが作成されること', async () => {
      const fs = await import('fs/promises');
      await performanceMonitor.initialize();
      
      expect(fs.mkdir).toHaveBeenCalledWith('.kiro/reports/performance', { recursive: true });
      expect(fs.mkdir).toHaveBeenCalledWith('.kiro/reports/performance/history', { recursive: true });
      expect(fs.mkdir).toHaveBeenCalledWith('.kiro/reports/performance/alerts', { recursive: true });
    });
  });

  describe('パフォーマンステストの修正', () => {
    beforeEach(async () => {
      await performanceMonitor.initialize();
    });

    it('パフォーマンステストの修正が実行されること', async () => {
      const result = await performanceMonitor.fixPerformanceTests();
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.fixedIssues).toContain('モジュールインポートエラーを修正');
      expect(result.fixedIssues).toContain('パフォーマンス測定の精度を向上');
      expect(result.fixedIssues).toContain('閾値設定を最適化');
      expect(result.fixedIssues).toContain('テスト環境を安定化');
      expect(result.executionTime).toBeGreaterThan(0);
    });

    it('修正に失敗した場合でも適切に処理されること', async () => {
      // エラーを発生させるためのモック
      vi.spyOn(performanceMonitor as any, 'fixModuleImportErrors')
        .mockRejectedValue(new Error('Fix failed'));

      const result = await performanceMonitor.fixPerformanceTests();
      
      expect(result.success).toBe(false);
      expect(result.remainingIssues.length).toBeGreaterThan(0);
    });
  });

  describe('パフォーマンス測定', () => {
    beforeEach(async () => {
      await performanceMonitor.initialize();
    });

    it('操作のパフォーマンスを正確に測定できること', async () => {
      const metrics = await performanceMonitor.measurePerformance(testOperation);
      
      expect(metrics).toBeDefined();
      expect(metrics.operationType).toBe(OperationType.GIT);
      expect(metrics.executionTime).toBe(50); // モックで設定した値
      expect(metrics.memoryUsage).toBe(2 * 1024 * 1024); // 32MB - 30MB
      expect(metrics.status).toBe('pass'); // 50ms < 100ms なので pass
      expect(metrics.timestamp).toBeInstanceOf(Date);
      expect(metrics.operationId).toMatch(/^git_\d+_[a-z0-9]+$/);
    });

    it('閾値を超過した場合に適切なステータスが設定されること', async () => {
      // 実行時間を閾値超過に設定
      vi.spyOn(performance, 'now')
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(150); // 150ms（閾値100msを超過）

      const metrics = await performanceMonitor.measurePerformance(testOperation);
      
      expect(metrics.status).toBe('fail');
      expect(metrics.executionTime).toBe(150);
    });

    it('エラーが発生した場合に適切に処理されること', async () => {
      // TrustDecisionEngineでエラーを発生させる
      const mockEngine = (performanceMonitor as any).trustEngine;
      mockEngine.evaluateOperation.mockRejectedValue(new Error('Evaluation failed'));

      const metrics = await performanceMonitor.measurePerformance(testOperation);
      
      expect(metrics.status).toBe('error');
      expect(metrics.error).toBe('Evaluation failed');
    });
  });

  describe('閾値監視', () => {
    beforeEach(async () => {
      await performanceMonitor.initialize();
    });

    it('正常な状態では健全なステータスが返されること', async () => {
      const status = await performanceMonitor.monitorThresholds();
      
      expect(status.overall).toBe('healthy');
      expect(status.violations).toHaveLength(0);
      expect(status.warnings).toHaveLength(0);
    });

    it('閾値違反が検出された場合に適切なステータスが返されること', async () => {
      // 高いメトリクス値を設定
      const highMetrics = {
        executionTime: { current: 200, average: 150, min: 50, max: 200 },
        memoryUsage: { current: 600 * 1024 * 1024, average: 400 * 1024 * 1024, min: 100 * 1024 * 1024, max: 600 * 1024 * 1024 },
        cpuUsage: { current: 90, average: 70, min: 20, max: 90 },
        throughput: { current: 100, average: 200, min: 50, max: 500 },
        errorRate: { current: 15, average: 10, min: 0, max: 15 },
        lastUpdated: new Date()
      };

      // プライベートメソッドにアクセスするためのキャスト
      (performanceMonitor as any).currentMetrics = highMetrics;

      const status = await performanceMonitor.monitorThresholds();
      
      expect(status.overall).toBe('critical');
      expect(status.violations.length).toBeGreaterThan(0);
    });
  });

  describe('リアルタイム監視', () => {
    beforeEach(async () => {
      await performanceMonitor.initialize();
    });

    it('リアルタイム監視を開始できること', async () => {
      await performanceMonitor.startRealTimeMonitoring(100); // 100ms間隔
      
      expect((performanceMonitor as any).isMonitoring).toBe(true);
      expect((performanceMonitor as any).monitoringInterval).toBeDefined();
    });

    it('リアルタイム監視を停止できること', async () => {
      await performanceMonitor.startRealTimeMonitoring(100);
      performanceMonitor.stopRealTimeMonitoring();
      
      expect((performanceMonitor as any).isMonitoring).toBe(false);
      expect((performanceMonitor as any).monitoringInterval).toBeNull();
    });

    it('既に監視中の場合は重複開始されないこと', async () => {
      await performanceMonitor.startRealTimeMonitoring(100);
      const firstInterval = (performanceMonitor as any).monitoringInterval;
      
      await performanceMonitor.startRealTimeMonitoring(100);
      const secondInterval = (performanceMonitor as any).monitoringInterval;
      
      expect(firstInterval).toBe(secondInterval);
    });
  });

  describe('パフォーマンスレポート生成', () => {
    beforeEach(async () => {
      await performanceMonitor.initialize();
    });

    it('パフォーマンスレポートを生成できること', async () => {
      // テストデータを追加
      await performanceMonitor.measurePerformance(testOperation);
      
      const report = await performanceMonitor.generatePerformanceReport();
      
      expect(report).toBeDefined();
      expect(report.id).toMatch(/^perf-report-\d+$/);
      expect(report.timestamp).toBeInstanceOf(Date);
      expect(report.period).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.metrics).toBeDefined();
      expect(report.trends).toBeDefined();
      expect(report.alerts).toBeDefined();
      expect(report.recommendations).toBeDefined();
      expect(report.thresholdStatus).toBeDefined();
    });

    it('レポートに適切な統計情報が含まれること', async () => {
      // 複数の測定を実行
      for (let i = 0; i < 5; i++) {
        await performanceMonitor.measurePerformance(testOperation);
      }
      
      const report = await performanceMonitor.generatePerformanceReport();
      
      expect(report.summary.totalOperations).toBe(5);
      expect(report.summary.averageExecutionTime).toBeGreaterThan(0);
      expect(report.summary.successRate).toBeGreaterThanOrEqual(0);
      expect(report.summary.successRate).toBeLessThanOrEqual(100);
    });
  });

  describe('パフォーマンス履歴', () => {
    beforeEach(async () => {
      await performanceMonitor.initialize();
    });

    it('パフォーマンス履歴が記録されること', async () => {
      const metrics = await performanceMonitor.measurePerformance(testOperation);
      
      await performanceMonitor.recordPerformanceHistory(metrics);
      
      const stats = performanceMonitor.getPerformanceStatistics();
      expect(stats.historySize).toBeGreaterThan(0);
    });

    it('履歴サイズが制限されること', async () => {
      // 大量のデータを追加
      for (let i = 0; i < 1100; i++) {
        const metrics = await performanceMonitor.measurePerformance(testOperation);
        await performanceMonitor.recordPerformanceHistory(metrics);
      }
      
      const stats = performanceMonitor.getPerformanceStatistics();
      expect(stats.historySize).toBeLessThanOrEqual(1000);
    });
  });

  describe('統計情報', () => {
    beforeEach(async () => {
      await performanceMonitor.initialize();
    });

    it('パフォーマンス統計を取得できること', async () => {
      const stats = performanceMonitor.getPerformanceStatistics();
      
      expect(stats).toBeDefined();
      expect(stats.currentMetrics).toBeDefined();
      expect(stats.historySize).toBeDefined();
      expect(stats.alertCount).toBeDefined();
      expect(stats.isMonitoring).toBeDefined();
    });

    it('測定後に統計が更新されること', async () => {
      const statsBefore = performanceMonitor.getPerformanceStatistics();
      
      await performanceMonitor.measurePerformance(testOperation);
      
      const statsAfter = performanceMonitor.getPerformanceStatistics();
      
      expect(statsAfter.historySize).toBeGreaterThan(statsBefore.historySize);
    });
  });

  describe('エラーハンドリング', () => {
    beforeEach(async () => {
      await performanceMonitor.initialize();
    });

    it('初期化エラーが適切に処理されること', async () => {
      const newMonitor = new PerformanceMonitor();
      
      // 依存コンポーネントの初期化でエラーを発生させる
      const mockEngine = (newMonitor as any).trustEngine;
      mockEngine.initialize.mockRejectedValue(new Error('Initialization failed'));

      await expect(newMonitor.initialize()).rejects.toThrow('Initialization failed');
    });

    it('測定エラーが適切に処理されること', async () => {
      const mockEngine = (performanceMonitor as any).trustEngine;
      mockEngine.evaluateOperation.mockRejectedValue(new Error('Evaluation error'));

      const metrics = await performanceMonitor.measurePerformance(testOperation);
      
      expect(metrics.status).toBe('error');
      expect(metrics.error).toBe('Evaluation error');
    });

    it('監視エラーが適切に処理されること', async () => {
      // getCurrentMetrics でエラーを発生させる
      vi.spyOn(performanceMonitor as any, 'getCurrentMetrics')
        .mockImplementation(() => {
          throw new Error('Metrics error');
        });

      const status = await performanceMonitor.monitorThresholds();
      
      expect(status.overall).toBe('error');
      expect(status.violations.length).toBeGreaterThan(0);
    });
  });

  describe('アラート機能', () => {
    beforeEach(async () => {
      await performanceMonitor.initialize();
    });

    it('閾値超過時にアラートが生成されること', async () => {
      // 閾値を超過する操作を実行
      vi.spyOn(performance, 'now')
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(200); // 200ms（閾値100msを超過）

      await performanceMonitor.measurePerformance(testOperation);
      
      const stats = performanceMonitor.getPerformanceStatistics();
      expect(stats.alertCount).toBeGreaterThan(0);
    });

    it('アラート履歴が制限されること', async () => {
      // 大量のアラートを生成
      for (let i = 0; i < 150; i++) {
        vi.spyOn(performance, 'now')
          .mockReturnValueOnce(0)
          .mockReturnValueOnce(200); // 閾値超過

        await performanceMonitor.measurePerformance(testOperation);
      }
      
      const stats = performanceMonitor.getPerformanceStatistics();
      expect(stats.alertCount).toBeLessThanOrEqual(100);
    });
  });

  describe('パフォーマンス要件', () => {
    beforeEach(async () => {
      await performanceMonitor.initialize();
    });

    it('測定処理自体が高速であること', async () => {
      const start = performance.now();
      
      await performanceMonitor.measurePerformance(testOperation);
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(50); // 測定処理自体は50ms以内
    });

    it('複数の並行測定が正常に処理されること', async () => {
      const promises = [];
      
      for (let i = 0; i < 10; i++) {
        promises.push(performanceMonitor.measurePerformance(testOperation));
      }
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.operationType).toBe(OperationType.GIT);
      });
    });
  });
});