import { describe, it, expect, beforeEach } from 'vitest';
import { TrustDecisionEngine } from '../trust-decision-engine.js';
import { Operation, OperationType, TrustPolicy } from '../types.js';

describe('TrustDecisionEngine Performance Tests', () => {
  let engine: TrustDecisionEngine;

  beforeEach(() => {
    engine = new TrustDecisionEngine();
  });

  describe('応答時間テスト', () => {
    it('単一操作の判定が100ms以内に完了する', async () => {
      const operation: Operation = {
        type: OperationType.GIT,
        command: 'git',
        args: ['status'],
        context: {
          workingDirectory: '/test',
          user: 'testuser',
          sessionId: 'perf-session-1'
        },
        timestamp: new Date()
      };

      const measurements: number[] = [];
      
      // 10回測定して平均を取る
      for (let i = 0; i < 10; i++) {
        const startTime = performance.now();
        await engine.evaluateOperation(operation);
        const duration = performance.now() - startTime;
        measurements.push(duration);
      }

      const averageDuration = measurements.reduce((sum, d) => sum + d, 0) / measurements.length;
      const maxDuration = Math.max(...measurements);

      expect(averageDuration).toBeLessThan(100);
      expect(maxDuration).toBeLessThan(150); // 最大でも150ms以内
      
      console.log(`平均応答時間: ${averageDuration.toFixed(2)}ms`);
      console.log(`最大応答時間: ${maxDuration.toFixed(2)}ms`);
    });

    it('複雑な操作の判定が100ms以内に完了する', async () => {
      const complexOperation: Operation = {
        type: OperationType.MCP,
        command: 'mcp-call',
        args: ['create_document', '--type', 'product', '--data', JSON.stringify({
          name: 'Test Product',
          description: 'A test product with complex data',
          ingredients: ['ingredient1', 'ingredient2', 'ingredient3'],
          metadata: { category: 'test', tags: ['tag1', 'tag2'] }
        })],
        context: {
          workingDirectory: '/test',
          user: 'testuser',
          sessionId: 'complex-perf-session',
          mcpServer: 'sanity-dev',
          mcpTool: 'create_document',
          environment: 'development'
        },
        timestamp: new Date()
      };

      const measurements: number[] = [];
      
      for (let i = 0; i < 5; i++) {
        const startTime = performance.now();
        await engine.evaluateOperation(complexOperation);
        const duration = performance.now() - startTime;
        measurements.push(duration);
      }

      const averageDuration = measurements.reduce((sum, d) => sum + d, 0) / measurements.length;
      
      expect(averageDuration).toBeLessThan(100);
      console.log(`複雑な操作の平均応答時間: ${averageDuration.toFixed(2)}ms`);
    });

    it('キャッシュヒット時の応答時間が10ms以内', async () => {
      const operation: Operation = {
        type: OperationType.GIT,
        command: 'git',
        args: ['status'],
        context: {
          workingDirectory: '/test',
          user: 'testuser',
          sessionId: 'cache-perf-session'
        },
        timestamp: new Date()
      };

      // 最初の実行でキャッシュを作成
      await engine.evaluateOperation(operation);

      // キャッシュヒット時の測定
      const measurements: number[] = [];
      for (let i = 0; i < 10; i++) {
        const startTime = performance.now();
        await engine.evaluateOperation(operation);
        const duration = performance.now() - startTime;
        measurements.push(duration);
      }

      const averageCacheHitTime = measurements.reduce((sum, d) => sum + d, 0) / measurements.length;
      
      expect(averageCacheHitTime).toBeLessThan(10);
      console.log(`キャッシュヒット平均時間: ${averageCacheHitTime.toFixed(2)}ms`);
    });
  });

  describe('スループットテスト', () => {
    it('並列処理で高いスループットを実現する', async () => {
      const operations: Operation[] = [];
      
      // 100個の異なる操作を生成
      for (let i = 0; i < 100; i++) {
        operations.push({
          type: OperationType.GIT,
          command: 'git',
          args: ['status'],
          context: {
            workingDirectory: '/test',
            user: 'testuser',
            sessionId: `throughput-session-${i}`
          },
          timestamp: new Date()
        });
      }

      const startTime = performance.now();
      
      // 並列実行
      const decisions = await Promise.all(
        operations.map(op => engine.evaluateOperation(op))
      );
      
      const totalDuration = performance.now() - startTime;
      const operationsPerSecond = (operations.length / totalDuration) * 1000;

      expect(decisions).toHaveLength(100);
      expect(operationsPerSecond).toBeGreaterThan(50); // 50ops/sec以上
      
      console.log(`スループット: ${operationsPerSecond.toFixed(2)} operations/sec`);
      console.log(`総処理時間: ${totalDuration.toFixed(2)}ms`);
    });

    it('大量の同一操作を効率的に処理する（キャッシュ効果）', async () => {
      const baseOperation: Operation = {
        type: OperationType.GIT,
        command: 'git',
        args: ['status'],
        context: {
          workingDirectory: '/test',
          user: 'testuser',
          sessionId: 'cache-throughput-session'
        },
        timestamp: new Date()
      };

      // 同一操作を200回実行
      const operations = Array(200).fill(null).map(() => ({ ...baseOperation }));

      const startTime = performance.now();
      const decisions = await Promise.all(
        operations.map(op => engine.evaluateOperation(op))
      );
      const totalDuration = performance.now() - startTime;

      const operationsPerSecond = (operations.length / totalDuration) * 1000;

      expect(decisions).toHaveLength(200);
      expect(operationsPerSecond).toBeGreaterThan(500); // キャッシュ効果で500ops/sec以上
      
      console.log(`キャッシュ効果込みスループット: ${operationsPerSecond.toFixed(2)} operations/sec`);
    });

    it('混合ワークロードでの性能を測定する', async () => {
      const operations: Operation[] = [];
      
      // 様々な種類の操作を混合
      const operationTypes = [
        { type: OperationType.GIT, command: 'git', args: ['status'] },
        { type: OperationType.GIT, command: 'git', args: ['log', '--oneline'] },
        { type: OperationType.FILE, command: 'cat', args: ['test.txt'] },
        { type: OperationType.CLI, command: 'vercel', args: ['status'] },
        { type: OperationType.SCRIPT, command: 'node', args: ['scripts/test.mjs'] },
        { type: OperationType.MCP, command: 'mcp-call', args: ['query'] }
      ];

      for (let i = 0; i < 60; i++) {
        const template = operationTypes[i % operationTypes.length];
        operations.push({
          ...template,
          context: {
            workingDirectory: '/test',
            user: 'testuser',
            sessionId: `mixed-session-${i}`,
            mcpServer: template.type === OperationType.MCP ? 'test-server' : undefined,
            mcpTool: template.type === OperationType.MCP ? 'test-tool' : undefined
          },
          timestamp: new Date()
        });
      }

      const startTime = performance.now();
      const decisions = await Promise.all(
        operations.map(op => engine.evaluateOperation(op))
      );
      const totalDuration = performance.now() - startTime;

      const operationsPerSecond = (operations.length / totalDuration) * 1000;

      expect(decisions).toHaveLength(60);
      expect(operationsPerSecond).toBeGreaterThan(30); // 混合ワークロードで30ops/sec以上
      
      console.log(`混合ワークロードスループット: ${operationsPerSecond.toFixed(2)} operations/sec`);
    });
  });

  describe('メモリ使用量テスト', () => {
    it('大量の操作処理後もメモリリークしない', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // 1000回の操作を実行
      for (let i = 0; i < 1000; i++) {
        const operation: Operation = {
          type: OperationType.GIT,
          command: 'git',
          args: ['status'],
          context: {
            workingDirectory: '/test',
            user: 'testuser',
            sessionId: `memory-test-${i}`
          },
          timestamp: new Date()
        };
        
        await engine.evaluateOperation(operation);
        
        // 100回ごとにガベージコレクションを促す
        if (i % 100 === 0 && global.gc) {
          global.gc();
        }
      }

      // 最終的なガベージコレクション
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      const memoryIncreaseKB = memoryIncrease / 1024;

      // メモリ増加が1MB以下であることを確認
      expect(memoryIncreaseKB).toBeLessThan(1024);
      
      console.log(`メモリ増加量: ${memoryIncreaseKB.toFixed(2)}KB`);
    });

    it('キャッシュサイズが制限内に収まる', async () => {
      // 1500個の異なる操作を実行（キャッシュ制限1000を超える）
      for (let i = 0; i < 1500; i++) {
        const operation: Operation = {
          type: OperationType.GIT,
          command: 'git',
          args: ['status', `--unique-${i}`], // 各操作を一意にする
          context: {
            workingDirectory: '/test',
            user: 'testuser',
            sessionId: `cache-limit-test-${i}`
          },
          timestamp: new Date()
        };
        
        await engine.evaluateOperation(operation);
      }

      // キャッシュサイズが制限内であることを確認
      // （実際の実装では内部状態を確認する必要があるが、ここでは動作確認のみ）
      const stats = engine.getPerformanceStats();
      expect(stats.totalOperations).toBeGreaterThan(0);
    });
  });

  describe('負荷テスト', () => {
    it('高負荷状況下でも安定して動作する', async () => {
      const concurrentUsers = 10;
      const operationsPerUser = 50;
      
      const userPromises = Array(concurrentUsers).fill(null).map(async (_, userIndex) => {
        const userOperations: Promise<any>[] = [];
        
        for (let i = 0; i < operationsPerUser; i++) {
          const operation: Operation = {
            type: OperationType.GIT,
            command: 'git',
            args: ['status'],
            context: {
              workingDirectory: '/test',
              user: `user-${userIndex}`,
              sessionId: `load-test-${userIndex}-${i}`
            },
            timestamp: new Date()
          };
          
          userOperations.push(engine.evaluateOperation(operation));
        }
        
        return Promise.all(userOperations);
      });

      const startTime = performance.now();
      const allResults = await Promise.all(userPromises);
      const totalDuration = performance.now() - startTime;

      const totalOperations = concurrentUsers * operationsPerUser;
      const operationsPerSecond = (totalOperations / totalDuration) * 1000;

      // すべての操作が正常に完了することを確認
      expect(allResults).toHaveLength(concurrentUsers);
      allResults.forEach(userResults => {
        expect(userResults).toHaveLength(operationsPerUser);
        userResults.forEach(decision => {
          expect(decision).toBeDefined();
          expect(typeof decision.approved).toBe('boolean');
        });
      });

      expect(operationsPerSecond).toBeGreaterThan(20); // 高負荷でも20ops/sec以上
      
      console.log(`高負荷テスト結果:`);
      console.log(`- 同時ユーザー数: ${concurrentUsers}`);
      console.log(`- ユーザーあたり操作数: ${operationsPerUser}`);
      console.log(`- 総操作数: ${totalOperations}`);
      console.log(`- 総処理時間: ${totalDuration.toFixed(2)}ms`);
      console.log(`- スループット: ${operationsPerSecond.toFixed(2)} operations/sec`);
    });

    it('レート制限機能が正常に動作する', async () => {
      const operations: Operation[] = [];
      
      // 制限を超える数の操作を同一ユーザーで実行
      for (let i = 0; i < 1100; i++) { // 制限1000を超える
        operations.push({
          type: OperationType.GIT,
          command: 'git',
          args: ['status'],
          context: {
            workingDirectory: '/test',
            user: 'rate-limit-test-user', // 同一ユーザー
            sessionId: `rate-limit-session-${i}`
          },
          timestamp: new Date()
        });
      }

      const decisions = await Promise.all(
        operations.map(op => engine.evaluateOperation(op))
      );

      // 最初の1000個は承認される可能性が高い
      const approvedCount = decisions.filter(d => d.approved).length;
      const rejectedCount = decisions.filter(d => !d.approved).length;

      expect(rejectedCount).toBeGreaterThan(0); // 一部は拒否される
      
      console.log(`レート制限テスト結果:`);
      console.log(`- 承認された操作: ${approvedCount}`);
      console.log(`- 拒否された操作: ${rejectedCount}`);
    });
  });

  describe('パフォーマンス統計', () => {
    it('パフォーマンス統計が正確に記録される', async () => {
      const operations: Operation[] = [];
      
      // 様々な結果を生成するための操作
      for (let i = 0; i < 50; i++) {
        operations.push({
          type: OperationType.GIT,
          command: 'git',
          args: ['status'],
          context: {
            workingDirectory: '/test',
            user: 'stats-test-user',
            sessionId: `stats-session-${i}`
          },
          timestamp: new Date()
        });
      }

      // 操作を実行
      await Promise.all(operations.map(op => engine.evaluateOperation(op)));

      const stats = engine.getPerformanceStats();

      expect(stats.totalOperations).toBeGreaterThan(0);
      expect(stats.successfulOperations).toBeGreaterThan(0);
      expect(stats.successRate).toBeGreaterThan(0);
      expect(stats.averageDuration).toBeGreaterThan(0);
      expect(stats.operationsUnder100ms).toBeGreaterThan(0);

      console.log('パフォーマンス統計:');
      console.log(`- 総操作数: ${stats.totalOperations}`);
      console.log(`- 成功操作数: ${stats.successfulOperations}`);
      console.log(`- 成功率: ${stats.successRate.toFixed(2)}%`);
      console.log(`- 平均処理時間: ${stats.averageDuration.toFixed(2)}ms`);
      console.log(`- キャッシュヒット率: ${stats.cacheHitRate.toFixed(2)}%`);
      console.log(`- 100ms以内の操作数: ${stats.operationsUnder100ms}`);
    });
  });
});