/**
 * Trust承認ポリシーシステム パフォーマンステスト
 * 
 * システムのパフォーマンス要件達成を検証する専用テストスイート
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { promises as fs } from 'fs';
import { join } from 'path';
import { PolicyManager } from '../policy-manager';
import { OperationClassifier } from '../operation-classifier';
import { TrustDecisionEngine } from '../trust-decision-engine';
import { MetricsCollector } from '../metrics-collector';
import { PerformanceOptimizer } from '../performance-optimizer';

const TEST_DIR = '.kiro-performance-test';
const TEST_SETTINGS_DIR = join(TEST_DIR, 'settings');
const TEST_REPORTS_DIR = join(TEST_DIR, 'reports');

describe('Trust承認ポリシーシステム パフォーマンステスト', () => {
  let policyManager: PolicyManager;
  let classifier: OperationClassifier;
  let decisionEngine: TrustDecisionEngine;
  let metricsCollector: MetricsCollector;
  let performanceOptimizer: PerformanceOptimizer;

  beforeAll(async () => {
    // テスト環境のセットアップ
    await fs.mkdir(TEST_SETTINGS_DIR, { recursive: true });
    await fs.mkdir(TEST_REPORTS_DIR, { recursive: true });
    
    // 最適化されたテスト用ポリシー設定
    const optimizedPolicy = {
      version: '1.0',
      lastUpdated: new Date().toISOString(),
      autoApprove: {
        gitOperations: [
          'status', 'commit', 'push', 'pull', 'merge', 'log',
          'diff', 'show', 'branch', 'checkout', 'switch', 'add'
        ],
        fileOperations: ['read', 'write', 'create', 'update', 'mkdir', 'ls', 'cat'],
        cliOperations: {
          vercel: ['env ls', 'domains ls', 'deployments ls', 'status', 'whoami'],
          npm: ['install', 'run build', 'run test', 'run dev'],
          node: ['--version', '-v']
        },
        scriptExecution: {
          extensions: ['.mjs', '.js', '.ts'],
          allowedPaths: ['scripts/', '.kiro/scripts/', 'tools/']
        }
      },
      manualApprove: {
        deleteOperations: [
          'git branch -D', 'git push --delete', 'rm -rf',
          'vercel env rm', 'vercel domain rm'
        ],
        forceOperations: [
          'git reset --hard', 'git push --force', 'git push -f'
        ],
        productionImpact: [
          'github:write', 'sanity-dev:write', 'vercel:envSet', 'vercel:addDomain'
        ]
      },
      security: {
        maxAutoApprovalPerHour: 2000,
        suspiciousPatternDetection: true,
        logAllOperations: true
      }
    };

    await fs.writeFile(
      join(TEST_SETTINGS_DIR, 'trust-policy.json'),
      JSON.stringify(optimizedPolicy, null, 2)
    );

    // システムコンポーネントの初期化
    policyManager = new PolicyManager();
    (policyManager as any).policyPath = join(TEST_SETTINGS_DIR, 'trust-policy.json');

    classifier = new OperationClassifier(policyManager);
    decisionEngine = new TrustDecisionEngine(policyManager);
    
    metricsCollector = new MetricsCollector({ 
      enabled: true,
      performanceThresholds: { fast: 50, normal: 100 }
    });
    (metricsCollector as any).metricsDir = join(TEST_REPORTS_DIR, 'metrics');
    
    performanceOptimizer = new PerformanceOptimizer({
      cacheSize: 1000,
      precomputeCommonOperations: true,
      enableAsyncProcessing: true
    });

    await metricsCollector.initialize();
    await performanceOptimizer.initialize();
  });

  afterAll(async () => {
    try {
      await fs.rm(TEST_DIR, { recursive: true, force: true });
    } catch (error) {
      // クリーンアップエラーは無視
    }
  });

  describe('基本パフォーマンス要件', () => {
    it('単一操作の判定が100ms以内に完了する', async () => {
      const testOperations = [
        { type: 'git', command: 'git', args: ['status'] },
        { type: 'git', command: 'git', args: ['commit', '-m', 'test'] },
        { type: 'file', command: 'touch', args: ['file.txt'] },
        { type: 'cli', command: 'vercel', args: ['env', 'ls'] },
        { type: 'script', command: 'node', args: ['script.mjs'] }
      ];

      for (const operation of testOperations) {
        const iterations = 10;
        const times: number[] = [];

        for (let i = 0; i < iterations; i++) {
          const startTime = performance.now();
          
          await decisionEngine.evaluateOperation({
            ...operation,
            context: { cwd: '/test', iteration: i },
            timestamp: new Date()
          });
          
          const endTime = performance.now();
          times.push(endTime - startTime);
        }

        const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
        const maxTime = Math.max(...times);

        expect(averageTime).toBeLessThan(100);
        expect(maxTime).toBeLessThan(200);

        console.log(`${operation.command} ${operation.args.join(' ')}: 平均 ${averageTime.toFixed(2)}ms, 最大 ${maxTime.toFixed(2)}ms`);
      }
    });

    it('並行処理で100操作/秒以上のスループットを達成する', async () => {
      const operationCount = 200;
      const testOperation = {
        type: 'git',
        command: 'git',
        args: ['status'],
        context: { cwd: '/test' },
        timestamp: new Date()
      };

      const startTime = performance.now();
      
      // 並行実行
      const promises = Array(operationCount).fill(null).map((_, i) => 
        decisionEngine.evaluateOperation({
          ...testOperation,
          context: { ...testOperation.context, requestId: i }
        })
      );

      const results = await Promise.all(promises);
      const endTime = performance.now();

      const totalTime = (endTime - startTime) / 1000; // 秒に変換
      const throughput = operationCount / totalTime;

      expect(results).toHaveLength(operationCount);
      expect(throughput).toBeGreaterThan(100);

      console.log(`並行処理スループット: ${throughput.toFixed(1)} ops/sec (${operationCount}操作を${totalTime.toFixed(2)}秒で処理)`);
    });

    it('メモリ使用量が適切に制御される', async () => {
      const initialMemory = process.memoryUsage();
      
      // 大量の操作を実行してメモリ使用量を監視
      const operationCount = 1000;
      
      for (let i = 0; i < operationCount; i++) {
        await decisionEngine.evaluateOperation({
          type: 'git',
          command: 'git',
          args: ['status'],
          context: { cwd: '/test', operationId: i },
          timestamp: new Date()
        });

        // 100操作ごとにメモリ使用量をチェック
        if (i % 100 === 0) {
          const currentMemory = process.memoryUsage();
          const memoryIncrease = currentMemory.heapUsed - initialMemory.heapUsed;
          
          // メモリ増加が50MB以下であることを確認
          expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
        }
      }

      const finalMemory = process.memoryUsage();
      const totalMemoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      console.log(`メモリ使用量増加: ${(totalMemoryIncrease / 1024 / 1024).toFixed(2)}MB`);
      
      // 最終的なメモリ増加が100MB以下であることを確認
      expect(totalMemoryIncrease).toBeLessThan(100 * 1024 * 1024);
    });
  });

  describe('スケーラビリティテスト', () => {
    it('大量の同時リクエストを効率的に処理する', async () => {
      const concurrentRequests = [100, 500, 1000];
      
      for (const requestCount of concurrentRequests) {
        const startTime = performance.now();
        
        const promises = Array(requestCount).fill(null).map((_, i) => 
          decisionEngine.evaluateOperation({
            type: 'git',
            command: 'git',
            args: ['status'],
            context: { cwd: '/test', batchId: requestCount, requestId: i },
            timestamp: new Date()
          })
        );

        const results = await Promise.all(promises);
        const endTime = performance.now();

        const totalTime = endTime - startTime;
        const averageTime = totalTime / requestCount;
        const throughput = (requestCount / totalTime) * 1000; // ops/sec

        expect(results).toHaveLength(requestCount);
        expect(averageTime).toBeLessThan(100); // 平均100ms以内
        expect(throughput).toBeGreaterThan(50); // 50 ops/sec以上

        console.log(`${requestCount}同時リクエスト: 平均 ${averageTime.toFixed(2)}ms, スループット ${throughput.toFixed(1)} ops/sec`);
      }
    });

    it('異なる操作タイプの混合負荷を処理する', async () => {
      const operationMix = [
        { type: 'git', command: 'git', args: ['status'], weight: 40 },
        { type: 'git', command: 'git', args: ['commit', '-m', 'test'], weight: 20 },
        { type: 'file', command: 'touch', args: ['file.txt'], weight: 20 },
        { type: 'cli', command: 'vercel', args: ['env', 'ls'], weight: 15 },
        { type: 'git', command: 'git', args: ['push', '--force'], weight: 5 } // 手動承認
      ];

      const totalOperations = 500;
      const operations: any[] = [];

      // 重み付きで操作を生成
      operationMix.forEach(op => {
        const count = Math.floor(totalOperations * op.weight / 100);
        for (let i = 0; i < count; i++) {
          operations.push({
            ...op,
            context: { cwd: '/test', mixedLoad: true, operationId: operations.length }
          });
        }
      });

      // ランダムに並び替え
      operations.sort(() => Math.random() - 0.5);

      const startTime = performance.now();
      
      const promises = operations.map((operation, index) => 
        decisionEngine.evaluateOperation({
          ...operation,
          timestamp: new Date()
        })
      );

      const results = await Promise.all(promises);
      const endTime = performance.now();

      const totalTime = endTime - startTime;
      const averageTime = totalTime / operations.length;
      const throughput = (operations.length / totalTime) * 1000;

      // 結果の分析
      const autoApproved = results.filter(r => r.approved).length;
      const autoApprovalRate = (autoApproved / results.length) * 100;

      expect(results).toHaveLength(operations.length);
      expect(averageTime).toBeLessThan(100);
      expect(autoApprovalRate).toBeGreaterThan(90); // 90%以上が自動承認

      console.log(`混合負荷テスト: 平均 ${averageTime.toFixed(2)}ms, 自動承認率 ${autoApprovalRate.toFixed(1)}%, スループット ${throughput.toFixed(1)} ops/sec`);
    });
  });

  describe('キャッシュとパフォーマンス最適化', () => {
    it('頻繁な操作がキャッシュされて高速化される', async () => {
      const commonOperation = {
        type: 'git',
        command: 'git',
        args: ['status'],
        context: { cwd: '/test' },
        timestamp: new Date()
      };

      // 初回実行（キャッシュなし）
      const firstRunTimes: number[] = [];
      for (let i = 0; i < 10; i++) {
        const startTime = performance.now();
        await decisionEngine.evaluateOperation(commonOperation);
        const endTime = performance.now();
        firstRunTimes.push(endTime - startTime);
      }

      // キャッシュウォームアップ
      await performanceOptimizer.precomputeCommonOperations([
        'git status',
        'git commit',
        'git push'
      ]);

      // 2回目実行（キャッシュあり）
      const secondRunTimes: number[] = [];
      for (let i = 0; i < 10; i++) {
        const startTime = performance.now();
        await decisionEngine.evaluateOperation(commonOperation);
        const endTime = performance.now();
        secondRunTimes.push(endTime - startTime);
      }

      const firstRunAverage = firstRunTimes.reduce((sum, time) => sum + time, 0) / firstRunTimes.length;
      const secondRunAverage = secondRunTimes.reduce((sum, time) => sum + time, 0) / secondRunTimes.length;

      // キャッシュにより処理時間が改善されることを確認
      expect(secondRunAverage).toBeLessThan(firstRunAverage);

      console.log(`キャッシュ効果: ${firstRunAverage.toFixed(2)}ms → ${secondRunAverage.toFixed(2)}ms (${((firstRunAverage - secondRunAverage) / firstRunAverage * 100).toFixed(1)}% 改善)`);
    });

    it('メトリクス収集のオーバーヘッドが最小限である', async () => {
      const testOperations = 100;
      
      // メトリクス収集なしでの実行時間
      const withoutMetricsTimes: number[] = [];
      for (let i = 0; i < testOperations; i++) {
        const startTime = performance.now();
        
        await decisionEngine.evaluateOperation({
          type: 'git',
          command: 'git',
          args: ['status'],
          context: { cwd: '/test', metricsTest: false },
          timestamp: new Date()
        });
        
        const endTime = performance.now();
        withoutMetricsTimes.push(endTime - startTime);
      }

      // メトリクス収集ありでの実行時間
      const withMetricsTimes: number[] = [];
      for (let i = 0; i < testOperations; i++) {
        const startTime = performance.now();
        
        const decision = await decisionEngine.evaluateOperation({
          type: 'git',
          command: 'git',
          args: ['status'],
          context: { cwd: '/test', metricsTest: true },
          timestamp: new Date()
        });
        
        // メトリクス記録
        await metricsCollector.recordOperation({
          operationType: 'git',
          command: 'git',
          args: ['status'],
          decision: decision.approved ? 'auto' : 'manual',
          processingTime: 0 // ダミー値
        });
        
        const endTime = performance.now();
        withMetricsTimes.push(endTime - startTime);
      }

      const withoutMetricsAverage = withoutMetricsTimes.reduce((sum, time) => sum + time, 0) / withoutMetricsTimes.length;
      const withMetricsAverage = withMetricsTimes.reduce((sum, time) => sum + time, 0) / withMetricsTimes.length;
      
      const overhead = withMetricsAverage - withoutMetricsAverage;
      const overheadPercentage = (overhead / withoutMetricsAverage) * 100;

      // オーバーヘッドが20%以下であることを確認
      expect(overheadPercentage).toBeLessThan(20);

      console.log(`メトリクス収集オーバーヘッド: ${overhead.toFixed(2)}ms (${overheadPercentage.toFixed(1)}%)`);
    });
  });

  describe('長期パフォーマンス安定性', () => {
    it('長時間実行でもパフォーマンスが劣化しない', async () => {
      const testDuration = 30000; // 30秒
      const batchSize = 50;
      const batches: number[][] = [];
      
      const startTime = Date.now();
      let operationCount = 0;

      while (Date.now() - startTime < testDuration) {
        const batchStartTime = performance.now();
        
        // バッチ処理
        const promises = Array(batchSize).fill(null).map((_, i) => 
          decisionEngine.evaluateOperation({
            type: 'git',
            command: 'git',
            args: ['status'],
            context: { cwd: '/test', longRunTest: true, batchId: batches.length, operationId: i },
            timestamp: new Date()
          })
        );

        await Promise.all(promises);
        
        const batchEndTime = performance.now();
        const batchTime = batchEndTime - batchStartTime;
        
        batches.push([batchTime, batchSize]);
        operationCount += batchSize;

        // 短い休憩を入れて実際の使用パターンをシミュレート
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // パフォーマンス劣化の分析
      const firstQuarter = batches.slice(0, Math.floor(batches.length / 4));
      const lastQuarter = batches.slice(-Math.floor(batches.length / 4));

      const firstQuarterAverage = firstQuarter.reduce((sum, [time]) => sum + time, 0) / firstQuarter.length;
      const lastQuarterAverage = lastQuarter.reduce((sum, [time]) => sum + time, 0) / lastQuarter.length;

      const performanceDegradation = ((lastQuarterAverage - firstQuarterAverage) / firstQuarterAverage) * 100;

      // パフォーマンス劣化が10%以下であることを確認
      expect(performanceDegradation).toBeLessThan(10);

      console.log(`長期実行テスト: ${operationCount}操作, 劣化率 ${performanceDegradation.toFixed(1)}%`);
      console.log(`初期性能: ${firstQuarterAverage.toFixed(2)}ms/batch, 最終性能: ${lastQuarterAverage.toFixed(2)}ms/batch`);
    });

    it('ガベージコレクションの影響が最小限である', async () => {
      const gcTimes: number[] = [];
      let operationCount = 0;

      // GCイベントの監視
      const originalGC = global.gc;
      if (typeof originalGC === 'function') {
        // 手動GCが利用可能な場合のテスト
        for (let i = 0; i < 10; i++) {
          // 大量の操作を実行してメモリを使用
          for (let j = 0; j < 100; j++) {
            await decisionEngine.evaluateOperation({
              type: 'git',
              command: 'git',
              args: ['status'],
              context: { cwd: '/test', gcTest: true, batch: i, operation: j },
              timestamp: new Date()
            });
            operationCount++;
          }

          // GC実行時間を測定
          const gcStartTime = performance.now();
          originalGC();
          const gcEndTime = performance.now();
          
          gcTimes.push(gcEndTime - gcStartTime);
        }

        const averageGCTime = gcTimes.reduce((sum, time) => sum + time, 0) / gcTimes.length;
        const maxGCTime = Math.max(...gcTimes);

        // GC時間が適切な範囲内であることを確認
        expect(averageGCTime).toBeLessThan(50); // 平均50ms以下
        expect(maxGCTime).toBeLessThan(200); // 最大200ms以下

        console.log(`GC影響: 平均 ${averageGCTime.toFixed(2)}ms, 最大 ${maxGCTime.toFixed(2)}ms (${operationCount}操作後)`);
      } else {
        console.log('手動GCが利用できないため、GCテストをスキップします');
      }
    });
  });

  describe('リソース効率性', () => {
    it('CPU使用率が適切な範囲内である', async () => {
      const testDuration = 5000; // 5秒
      const startTime = Date.now();
      let operationCount = 0;

      // CPU集約的な処理を実行
      while (Date.now() - startTime < testDuration) {
        await Promise.all([
          decisionEngine.evaluateOperation({
            type: 'git',
            command: 'git',
            args: ['status'],
            context: { cwd: '/test', cpuTest: true },
            timestamp: new Date()
          }),
          decisionEngine.evaluateOperation({
            type: 'file',
            command: 'touch',
            args: ['file.txt'],
            context: { cwd: '/test', cpuTest: true },
            timestamp: new Date()
          }),
          decisionEngine.evaluateOperation({
            type: 'cli',
            command: 'vercel',
            args: ['env', 'ls'],
            context: { cwd: '/test', cpuTest: true },
            timestamp: new Date()
          })
        ]);
        
        operationCount += 3;
      }

      const actualDuration = Date.now() - startTime;
      const operationsPerSecond = (operationCount / actualDuration) * 1000;

      // 適切なスループットが維持されることを確認
      expect(operationsPerSecond).toBeGreaterThan(100);

      console.log(`CPU効率性テスト: ${operationCount}操作を${actualDuration}msで処理, ${operationsPerSecond.toFixed(1)} ops/sec`);
    });

    it('ファイルI/Oが効率的に実行される', async () => {
      const fileOperations = 100;
      const startTime = performance.now();

      // ファイルI/Oを伴う操作を実行
      for (let i = 0; i < fileOperations; i++) {
        await decisionEngine.evaluateOperation({
          type: 'file',
          command: 'cat',
          args: [join(TEST_SETTINGS_DIR, 'trust-policy.json')],
          context: { cwd: '/test', fileIOTest: true, operationId: i },
          timestamp: new Date()
        });

        // メトリクス記録（ファイルI/O）
        await metricsCollector.recordOperation({
          operationType: 'file',
          command: 'cat',
          args: ['trust-policy.json'],
          decision: 'auto',
          processingTime: 10
        });
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const averageTime = totalTime / fileOperations;

      // ファイルI/O操作が効率的であることを確認
      expect(averageTime).toBeLessThan(50); // 平均50ms以下

      console.log(`ファイルI/O効率性: ${fileOperations}操作, 平均 ${averageTime.toFixed(2)}ms`);
    });
  });
});