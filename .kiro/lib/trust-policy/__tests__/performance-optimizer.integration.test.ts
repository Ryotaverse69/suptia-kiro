import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TrustDecisionEngine } from '../trust-decision-engine.js';
import { Operation, OperationType, RiskLevel } from '../types.js';
import { PolicyManager } from '../policy-manager.js';

describe('PerformanceOptimizer Integration Tests', () => {
  let engine: TrustDecisionEngine;
  let policyManager: PolicyManager;

  beforeEach(async () => {
    engine = new TrustDecisionEngine();
    policyManager = new PolicyManager();
    
    // テスト用のポリシーを設定
    await policyManager.updatePolicy({
      version: '1.0',
      lastUpdated: new Date(),
      autoApprove: {
        gitOperations: ['status', 'commit', 'push', 'pull'],
        fileOperations: ['read', 'write', 'create'],
        cliOperations: {
          vercel: ['env ls', 'status']
        },
        scriptExecution: {
          extensions: ['.mjs'],
          allowedPaths: ['scripts/']
        }
      },
      manualApprove: {
        deleteOperations: ['git branch -D', 'rm -rf'],
        forceOperations: ['git push --force'],
        productionImpact: ['vercel env set']
      },
      security: {
        maxAutoApprovalPerHour: 1000,
        suspiciousPatternDetection: true,
        logAllOperations: true
      }
    });
  });

  afterEach(() => {
    // クリーンアップ
  });

  describe('エンドツーエンドパフォーマンス', () => {
    it('大量の操作を100ms以内で処理する', async () => {
      const operations: Operation[] = [
        {
          type: OperationType.GIT,
          command: 'git',
          args: ['status'],
          context: { cwd: '/test', user: 'test', sessionId: 'test' },
          timestamp: new Date()
        },
        {
          type: OperationType.FILE,
          command: 'touch',
          args: ['test.txt'],
          context: { cwd: '/test', user: 'test', sessionId: 'test' },
          timestamp: new Date()
        },
        {
          type: OperationType.CLI,
          command: 'vercel',
          args: ['status'],
          context: { cwd: '/test', user: 'test', sessionId: 'test' },
          timestamp: new Date()
        }
      ];

      const results = [];
      const startTime = performance.now();

      // 各操作を複数回実行（キャッシュ効果をテスト）
      for (let i = 0; i < 100; i++) {
        for (const operation of operations) {
          const decision = await engine.evaluateOperation(operation);
          results.push(decision);
        }
      }

      const endTime = performance.now();
      const totalDuration = endTime - startTime;
      const averageDuration = totalDuration / results.length;

      expect(results).toHaveLength(300);
      expect(averageDuration).toBeLessThan(100); // 平均100ms以内
      
      // 大部分の操作が自動承認される
      const autoApproved = results.filter(r => !r.requiresManualApproval).length;
      expect(autoApproved / results.length).toBeGreaterThan(0.8); // 80%以上自動承認
    });

    it('キャッシュ効果により2回目以降の処理が高速化される', async () => {
      const operation: Operation = {
        type: OperationType.GIT,
        command: 'git',
        args: ['status'],
        context: { cwd: '/test', user: 'test', sessionId: 'test' },
        timestamp: new Date()
      };

      // 最初の評価（キャッシュなし）
      const startTime1 = performance.now();
      const decision1 = await engine.evaluateOperation(operation);
      const endTime1 = performance.now();
      const duration1 = endTime1 - startTime1;

      // 2回目の評価（キャッシュあり）
      const startTime2 = performance.now();
      const decision2 = await engine.evaluateOperation(operation);
      const endTime2 = performance.now();
      const duration2 = endTime2 - startTime2;

      expect(decision1.approved).toBe(decision2.approved);
      expect(duration2).toBeLessThan(duration1); // 2回目の方が高速
      expect(duration2).toBeLessThan(10); // 2回目は10ms以内
    });

    it('高負荷時でも安定して動作する', async () => {
      const operations = Array.from({ length: 200 }, (_, i) => ({
        type: OperationType.GIT,
        command: 'git',
        args: ['status', `file-${i}`],
        context: { cwd: '/test', user: 'test', sessionId: 'test' },
        timestamp: new Date()
      }));

      const startTime = performance.now();
      const promises = operations.map(op => engine.evaluateOperation(op));
      const results = await Promise.all(promises);
      const endTime = performance.now();

      const totalDuration = endTime - startTime;
      const averageDuration = totalDuration / results.length;

      expect(results).toHaveLength(200);
      expect(averageDuration).toBeLessThan(200); // 高負荷時でも200ms以内
      
      // すべての操作が適切に処理される
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.approved).toBeDefined();
        expect(result.requiresManualApproval).toBeDefined();
      });
    });
  });

  describe('メモリ効率性', () => {
    it('長時間の運用でもメモリリークが発生しない', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // 長時間の運用をシミュレート
      for (let batch = 0; batch < 10; batch++) {
        const operations = Array.from({ length: 100 }, (_, i) => ({
          type: OperationType.GIT,
          command: 'git',
          args: ['status', `batch-${batch}-file-${i}`],
          context: { cwd: '/test', user: 'test', sessionId: 'test' },
          timestamp: new Date()
        }));

        const promises = operations.map(op => engine.evaluateOperation(op));
        await Promise.all(promises);

        // バッチ間でガベージコレクションを促進
        if (global.gc) {
          global.gc();
        }
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // メモリ増加量が合理的な範囲内
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // 100MB以内
    });

    it('キャッシュサイズが適切に制限される', async () => {
      // 大量の異なる操作を実行
      for (let i = 0; i < 6000; i++) {
        const operation: Operation = {
          type: OperationType.GIT,
          command: 'git',
          args: ['status', `unique-${i}`],
          context: { cwd: '/test', user: 'test', sessionId: 'test' },
          timestamp: new Date()
        };

        await engine.evaluateOperation(operation);
      }

      const stats = engine.getPerformanceStats();
      
      // キャッシュサイズが制限内
      if (stats.optimization && stats.optimization.cacheSize) {
        expect(stats.optimization.cacheSize.patterns).toBeLessThanOrEqual(5000);
      }
    });
  });

  describe('パフォーマンス統計', () => {
    it('正確なパフォーマンス統計を提供する', async () => {
      const operations = [
        {
          type: OperationType.GIT,
          command: 'git',
          args: ['status'],
          context: { cwd: '/test', user: 'test', sessionId: 'test' },
          timestamp: new Date()
        },
        {
          type: OperationType.FILE,
          command: 'touch',
          args: ['test.txt'],
          context: { cwd: '/test', user: 'test', sessionId: 'test' },
          timestamp: new Date()
        }
      ];

      // 複数回実行
      for (let i = 0; i < 10; i++) {
        for (const operation of operations) {
          await engine.evaluateOperation(operation);
        }
      }

      const stats = engine.getPerformanceStats();

      expect(stats.totalOperations).toBeGreaterThan(0);
      expect(stats.successfulOperations).toBeGreaterThan(0);
      expect(stats.successRate).toBeGreaterThan(0);
      expect(stats.averageDuration).toBeGreaterThan(0);
      
      if (stats.optimization) {
        expect(stats.optimization.totalEvaluations).toBeGreaterThan(0);
        expect(stats.optimization.currentLoad).toBeGreaterThanOrEqual(0);
      }
    });

    it('95%以上の自動承認率を達成する', async () => {
      const autoApproveOperations = [
        { type: OperationType.GIT, command: 'git', args: ['status'] },
        { type: OperationType.GIT, command: 'git', args: ['commit', '-m', 'test'] },
        { type: OperationType.FILE, command: 'touch', args: ['test.txt'] },
        { type: OperationType.CLI, command: 'vercel', args: ['status'] }
      ];

      const manualApproveOperations = [
        { type: OperationType.GIT, command: 'git', args: ['branch', '-D', 'feature'] },
        { type: OperationType.CLI, command: 'rm', args: ['-rf', 'important'] }
      ];

      const results = [];

      // 自動承認操作を大量実行
      for (let i = 0; i < 95; i++) {
        const operation = autoApproveOperations[i % autoApproveOperations.length];
        const decision = await engine.evaluateOperation({
          ...operation,
          context: { cwd: '/test', user: 'test', sessionId: 'test' },
          timestamp: new Date()
        });
        results.push(decision);
      }

      // 手動承認操作を少量実行
      for (let i = 0; i < 5; i++) {
        const operation = manualApproveOperations[i % manualApproveOperations.length];
        const decision = await engine.evaluateOperation({
          ...operation,
          context: { cwd: '/test', user: 'test', sessionId: 'test' },
          timestamp: new Date()
        });
        results.push(decision);
      }

      const autoApproved = results.filter(r => !r.requiresManualApproval).length;
      const autoApprovalRate = (autoApproved / results.length) * 100;

      expect(autoApprovalRate).toBeGreaterThanOrEqual(95);
    });
  });

  describe('エラー回復性', () => {
    it('一部の操作でエラーが発生しても全体の処理が継続される', async () => {
      const validOperations = Array.from({ length: 50 }, (_, i) => ({
        type: OperationType.GIT,
        command: 'git',
        args: ['status', `valid-${i}`],
        context: { cwd: '/test', user: 'test', sessionId: 'test' },
        timestamp: new Date()
      }));

      const invalidOperations = Array.from({ length: 5 }, (_, i) => ({
        type: OperationType.GIT,
        command: null as any, // 不正な操作
        args: [`invalid-${i}`],
        context: { cwd: '/test', user: 'test', sessionId: 'test' },
        timestamp: new Date()
      }));

      const allOperations = [...validOperations, ...invalidOperations];
      const promises = allOperations.map(op => engine.evaluateOperation(op));
      const results = await Promise.all(promises);

      expect(results).toHaveLength(55);
      
      // 有効な操作は正常に処理される
      const validResults = results.slice(0, 50);
      validResults.forEach(result => {
        expect(result).toBeDefined();
        expect(result.approved).toBeDefined();
      });

      // 無効な操作はエラーハンドリングされる
      const invalidResults = results.slice(50);
      invalidResults.forEach(result => {
        expect(result).toBeDefined();
        expect(result.approved).toBe(false);
        expect(result.requiresManualApproval).toBe(true);
      });
    });

    it('システム負荷が高い状態から正常に回復する', async () => {
      // 高負荷状態を作成
      const highLoadPromises = Array.from({ length: 150 }, (_, i) => 
        engine.evaluateOperation({
          type: OperationType.GIT,
          command: 'git',
          args: ['status', `load-${i}`],
          context: { cwd: '/test', user: 'test', sessionId: 'test' },
          timestamp: new Date()
        })
      );

      // 高負荷処理を開始
      const highLoadResults = await Promise.all(highLoadPromises);
      expect(highLoadResults).toHaveLength(150);

      // 負荷が下がった後の通常処理
      const normalOperation = {
        type: OperationType.GIT,
        command: 'git',
        args: ['status'],
        context: { cwd: '/test', user: 'test', sessionId: 'test' },
        timestamp: new Date()
      };

      const startTime = performance.now();
      const normalResult = await engine.evaluateOperation(normalOperation);
      const endTime = performance.now();

      expect(normalResult).toBeDefined();
      expect(endTime - startTime).toBeLessThan(100); // 通常の処理時間に戻る
    });
  });
});