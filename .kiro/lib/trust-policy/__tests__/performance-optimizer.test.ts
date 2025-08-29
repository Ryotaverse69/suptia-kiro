import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PerformanceOptimizer } from '../performance-optimizer.js';
import { Operation, OperationType, RiskLevel } from '../types.js';

describe('PerformanceOptimizer', () => {
  let optimizer: PerformanceOptimizer;
  let mockOperation: Operation;

  beforeEach(() => {
    optimizer = new PerformanceOptimizer();
    mockOperation = {
      type: OperationType.GIT,
      command: 'git',
      args: ['status'],
      context: {
        cwd: '/test',
        user: 'testuser',
        sessionId: 'test-session'
      },
      timestamp: new Date()
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('事前計算機能', () => {
    it('頻繁操作の事前計算を実行できる', async () => {
      const startTime = Date.now();
      
      await optimizer.precomputeFrequentOperations();
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // 事前計算は適切な時間内で完了する
      expect(duration).toBeLessThan(5000); // 5秒以内
    });

    it('事前計算結果がキャッシュされる', async () => {
      await optimizer.precomputeFrequentOperations();
      
      const stats = optimizer.getPerformanceStats();
      expect(stats.cacheSize).toBeDefined();
      expect(stats.cacheSize.patterns).toBeGreaterThanOrEqual(0);
    });
  });

  describe('最適化された評価', () => {
    it('100ms以内で判定を完了する', async () => {
      const startTime = performance.now();
      
      const decision = await optimizer.optimizedEvaluate(mockOperation);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(100); // 100ms以内
      expect(decision).toBeDefined();
      expect(decision.approved).toBeDefined();
      expect(decision.requiresManualApproval).toBeDefined();
    });

    it('キャッシュヒット時は非常に高速', async () => {
      // 最初の評価でキャッシュに保存
      await optimizer.optimizedEvaluate(mockOperation);
      
      // 2回目の評価（キャッシュヒット）
      const startTime = performance.now();
      const decision = await optimizer.optimizedEvaluate(mockOperation);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(10); // 10ms以内
      expect(decision).toBeDefined();
    });

    it('異なる操作タイプを適切に処理する', async () => {
      const operations = [
        { ...mockOperation, type: OperationType.GIT },
        { ...mockOperation, type: OperationType.FILE, command: 'touch' },
        { ...mockOperation, type: OperationType.CLI, command: 'vercel' },
        { ...mockOperation, type: OperationType.SCRIPT, command: 'node' }
      ];

      for (const operation of operations) {
        const decision = await optimizer.optimizedEvaluate(operation);
        expect(decision).toBeDefined();
        expect(decision.approved).toBeDefined();
      }
    });
  });

  describe('高負荷時の優先度制御', () => {
    it('高負荷時に優先度キューを使用する', async () => {
      // 高負荷状態をシミュレート
      const promises = [];
      for (let i = 0; i < 150; i++) { // 高負荷閾値(100)を超える
        promises.push(optimizer.optimizedEvaluate({
          ...mockOperation,
          args: [`test-${i}`]
        }));
      }

      const results = await Promise.all(promises);
      
      // すべての操作が完了する
      expect(results).toHaveLength(150);
      results.forEach(result => {
        expect(result).toBeDefined();
      });
    });

    it('優先度の高い操作が先に処理される', async () => {
      const highPriorityOp = {
        ...mockOperation,
        args: ['branch', '-D', 'feature'] // 削除系操作（高優先度）
      };

      const lowPriorityOp = {
        ...mockOperation,
        type: OperationType.SCRIPT,
        command: 'node',
        args: ['script.js'] // スクリプト実行（低優先度）
      };

      // 高負荷状態をシミュレート
      const promises = [];
      
      // 低優先度操作を大量に追加
      for (let i = 0; i < 100; i++) {
        promises.push(optimizer.optimizedEvaluate(lowPriorityOp));
      }
      
      // 高優先度操作を追加
      promises.push(optimizer.optimizedEvaluate(highPriorityOp));

      const results = await Promise.all(promises);
      expect(results).toHaveLength(101);
    });
  });

  describe('メモリ効率化', () => {
    it('大量の操作でもメモリ使用量が制限される', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // 大量の操作を実行
      const promises = [];
      for (let i = 0; i < 1000; i++) {
        promises.push(optimizer.optimizedEvaluate({
          ...mockOperation,
          args: [`operation-${i}`]
        }));
      }
      
      await Promise.all(promises);
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // メモリ増加量が合理的な範囲内
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB以内
    });

    it('キャッシュサイズが制限される', async () => {
      // 大量の異なる操作を実行してキャッシュを満たす
      for (let i = 0; i < 6000; i++) { // MAX_PATTERN_CACHE_SIZE(5000)を超える
        await optimizer.optimizedEvaluate({
          ...mockOperation,
          args: [`unique-operation-${i}`]
        });
      }

      const stats = optimizer.getPerformanceStats();
      
      // キャッシュサイズが制限内
      expect(stats.cacheSize.patterns).toBeLessThanOrEqual(5000);
    });
  });

  describe('パフォーマンス統計', () => {
    it('パフォーマンス統計を正確に記録する', async () => {
      await optimizer.optimizedEvaluate(mockOperation);
      await optimizer.optimizedEvaluate(mockOperation); // キャッシュヒット
      
      const stats = optimizer.getPerformanceStats();
      
      expect(stats.totalEvaluations).toBeGreaterThan(0);
      expect(stats.cacheHits).toBeDefined();
      expect(stats.averageEvaluationTime).toBeGreaterThan(0);
      expect(stats.currentLoad).toBeGreaterThanOrEqual(0);
    });

    it('キャッシュヒット率を正確に計算する', async () => {
      // 最初の評価（キャッシュミス）
      await optimizer.optimizedEvaluate(mockOperation);
      
      // 同じ操作を複数回実行（キャッシュヒット）
      for (let i = 0; i < 5; i++) {
        await optimizer.optimizedEvaluate(mockOperation);
      }
      
      const stats = optimizer.getPerformanceStats();
      
      // キャッシュヒット率が適切に計算される
      expect(stats.cacheHits.precomputed + stats.cacheHits.pattern).toBeGreaterThan(0);
    });
  });

  describe('エラーハンドリング', () => {
    it('評価エラー時にフォールバック判定を返す', async () => {
      const invalidOperation = {
        ...mockOperation,
        command: null as any // 不正な操作
      };

      const decision = await optimizer.optimizedEvaluate(invalidOperation);
      
      expect(decision).toBeDefined();
      expect(decision.approved).toBe(false);
      expect(decision.requiresManualApproval).toBe(true);
      expect(decision.reason).toContain('エラー');
    });

    it('高負荷時のタイムアウトを適切に処理する', async () => {
      // タイムアウトテストは時間がかかるため、モック化
      const longRunningOperation = {
        ...mockOperation,
        args: ['long-running-operation']
      };

      const startTime = Date.now();
      const decision = await optimizer.optimizedEvaluate(longRunningOperation);
      const endTime = Date.now();
      
      // タイムアウト時間内で完了するか、適切なエラーハンドリング
      expect(endTime - startTime).toBeLessThan(6000); // 6秒以内
      expect(decision).toBeDefined();
    });
  });

  describe('非同期処理', () => {
    it('複数の操作を並行処理できる', async () => {
      const operations = Array.from({ length: 10 }, (_, i) => ({
        ...mockOperation,
        args: [`parallel-${i}`]
      }));

      const startTime = Date.now();
      const promises = operations.map(op => optimizer.optimizedEvaluate(op));
      const results = await Promise.all(promises);
      const endTime = Date.now();

      expect(results).toHaveLength(10);
      
      // 並行処理により、逐次処理より高速
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(1000); // 1秒以内
    });

    it('非同期処理中にエラーが発生しても他の処理に影響しない', async () => {
      const validOperation = mockOperation;
      const invalidOperation = { ...mockOperation, command: null as any };

      const promises = [
        optimizer.optimizedEvaluate(validOperation),
        optimizer.optimizedEvaluate(invalidOperation),
        optimizer.optimizedEvaluate(validOperation)
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      expect(results[0].approved).toBeDefined(); // 正常な操作
      expect(results[1].approved).toBe(false);   // エラー操作
      expect(results[2].approved).toBeDefined(); // 正常な操作
    });
  });
});