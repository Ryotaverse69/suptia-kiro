/**
 * メトリクス収集システムの統合テスト
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import { join } from 'path';
import { MetricsCollector } from '../metrics-collector';
import { TrustDecisionEngine } from '../trust-decision-engine';
import { PolicyManager } from '../policy-manager';

const TEST_DIR = '.kiro-metrics-integration-test';
const TEST_METRICS_DIR = join(TEST_DIR, 'reports', 'metrics');
const TEST_SETTINGS_DIR = join(TEST_DIR, 'settings');

describe('メトリクス収集システム統合テスト', () => {
  let collector: MetricsCollector;
  let decisionEngine: TrustDecisionEngine;
  let policyManager: PolicyManager;

  beforeEach(async () => {
    // テスト用ディレクトリの作成
    await fs.mkdir(TEST_METRICS_DIR, { recursive: true });
    await fs.mkdir(TEST_SETTINGS_DIR, { recursive: true });
    
    // テスト用ポリシー設定
    const testPolicy = {
      version: '1.0',
      lastUpdated: new Date().toISOString(),
      autoApprove: {
        gitOperations: ['status', 'commit', 'push', 'pull'],
        fileOperations: ['read', 'write', 'create', 'mkdir'],
        cliOperations: {
          vercel: ['env ls', 'deployments ls']
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
    };

    await fs.writeFile(
      join(TEST_SETTINGS_DIR, 'trust-policy.json'),
      JSON.stringify(testPolicy, null, 2)
    );

    // システムコンポーネントの初期化
    policyManager = new PolicyManager();
    (policyManager as any).policyPath = join(TEST_SETTINGS_DIR, 'trust-policy.json');

    decisionEngine = new TrustDecisionEngine(policyManager);
    
    collector = new MetricsCollector({
      enabled: true,
      retentionDays: 7,
      performanceThresholds: { fast: 50, normal: 100 }
    });
    (collector as any).metricsDir = TEST_METRICS_DIR;
    
    await collector.initialize();
  });

  afterEach(async () => {
    try {
      await fs.rm(TEST_DIR, { recursive: true, force: true });
    } catch (error) {
      // 削除に失敗しても続行
    }
  });

  describe('エンドツーエンド操作フロー', () => {
    it('操作実行からメトリクス記録まで完全に動作する', async () => {
      const operations = [
        {
          type: 'git',
          command: 'git',
          args: ['status'],
          context: { cwd: '/test' }
        },
        {
          type: 'git',
          command: 'git',
          args: ['commit', '-m', 'test'],
          context: { cwd: '/test' }
        },
        {
          type: 'git',
          command: 'git',
          args: ['push', '--force'],
          context: { cwd: '/test' }
        },
        {
          type: 'file',
          command: 'rm',
          args: ['-rf', 'important'],
          context: { cwd: '/test' }
        }
      ];

      const results = [];

      for (const operation of operations) {
        // 1. Trust判定エンジンで判定
        const startTime = Date.now();
        const decision = await decisionEngine.evaluateOperation({
          ...operation,
          timestamp: new Date()
        });
        const processingTime = Date.now() - startTime;

        results.push({ operation, decision, processingTime });

        // 2. メトリクス記録
        await collector.recordOperation({
          operationType: operation.type,
          command: operation.command,
          args: operation.args,
          decision: decision.approved ? 'auto' : 'manual',
          processingTime,
          context: operation.context
        });
      }

      // 3. 結果の検証
      expect(results).toHaveLength(4);
      
      // git status, commit は自動承認
      expect(results[0].decision.approved).toBe(true);
      expect(results[1].decision.approved).toBe(true);
      
      // git push --force, rm -rf は手動承認
      expect(results[2].decision.approved).toBe(false);
      expect(results[3].decision.approved).toBe(false);

      // 4. メトリクスファイルの確認
      const today = new Date().toISOString().split('T')[0];
      const metricsFile = join(TEST_METRICS_DIR, `trust-metrics-${today}.jsonl`);
      
      const exists = await fs.access(metricsFile).then(() => true).catch(() => false);
      expect(exists).toBe(true);

      const content = await fs.readFile(metricsFile, 'utf-8');
      const lines = content.trim().split('\n');
      expect(lines).toHaveLength(4);

      // 5. 集計メトリクスの確認
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const aggregated = await collector.aggregateMetrics(startOfDay, endOfDay);
      
      expect(aggregated.totalOperations).toBe(4);
      expect(aggregated.autoApprovedOperations).toBe(2);
      expect(aggregated.manualApprovedOperations).toBe(2);
      expect(aggregated.autoApprovalRate).toBe(50);
    });
  });

  describe('大量操作のパフォーマンステスト', () => {
    it('1000操作を効率的に処理できる', async () => {
      const operationCount = 1000;
      const startTime = Date.now();

      // 大量の操作をシミュレート
      const promises = [];
      for (let i = 0; i < operationCount; i++) {
        const operation = {
          type: 'git',
          command: 'git',
          args: ['status'],
          context: { cwd: '/test' }
        };

        const promise = (async () => {
          const opStartTime = Date.now();
          const decision = await decisionEngine.evaluateOperation({
            ...operation,
            timestamp: new Date()
          });
          const processingTime = Date.now() - opStartTime;

          await collector.recordOperation({
            operationType: operation.type,
            command: operation.command,
            args: operation.args,
            decision: decision.approved ? 'auto' : 'manual',
            processingTime
          });

          return processingTime;
        })();

        promises.push(promise);
      }

      const processingTimes = await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      // パフォーマンス検証
      const averageProcessingTime = processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length;
      const throughput = operationCount / (totalTime / 1000);

      console.log(`大量操作テスト結果:`);
      console.log(`  総操作数: ${operationCount}`);
      console.log(`  総時間: ${totalTime}ms`);
      console.log(`  平均処理時間: ${averageProcessingTime.toFixed(2)}ms`);
      console.log(`  スループット: ${throughput.toFixed(1)} ops/sec`);

      // パフォーマンス要件の確認
      expect(averageProcessingTime).toBeLessThan(100); // 100ms以内
      expect(throughput).toBeGreaterThan(10); // 10 ops/sec以上

      // メトリクス集計のパフォーマンス
      const aggregationStart = Date.now();
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);

      const aggregated = await collector.aggregateMetrics(startOfDay, today);
      const aggregationTime = Date.now() - aggregationStart;

      console.log(`  集計時間: ${aggregationTime}ms`);
      console.log(`  集計対象: ${aggregated.totalOperations} 操作`);

      expect(aggregationTime).toBeLessThan(5000); // 5秒以内
      expect(aggregated.totalOperations).toBe(operationCount);
    });
  });

  describe('リアルタイム監視', () => {
    it('リアルタイムメトリクスが正確に更新される', async () => {
      // 初期状態の確認
      let currentMetrics = await collector.getCurrentMetrics();
      const initialOperations = currentMetrics.todayOperations;

      // 複数の操作を実行
      const operations = [
        { command: 'git', args: ['status'], decision: 'auto' },
        { command: 'git', args: ['commit'], decision: 'auto' },
        { command: 'rm', args: ['-rf', 'test'], decision: 'manual' }
      ];

      for (const op of operations) {
        await collector.recordOperation({
          operationType: 'test',
          command: op.command,
          args: op.args,
          decision: op.decision as 'auto' | 'manual',
          processingTime: 50 + Math.random() * 50
        });
      }

      // リアルタイムメトリクスの更新確認
      currentMetrics = await collector.getCurrentMetrics();

      expect(currentMetrics.todayOperations).toBe(initialOperations + 3);
      expect(currentMetrics.todayAutoApprovalRate).toBeCloseTo(66.7, 1); // 2/3 * 100
      expect(currentMetrics.recentAverageProcessingTime).toBeGreaterThan(0);
    });

    it('アラート条件が正しく検出される', async () => {
      // 自動承認率を下げる操作（手動承認を多く発生させる）
      for (let i = 0; i < 10; i++) {
        await collector.recordOperation({
          operationType: 'test',
          command: 'rm',
          args: ['-rf', `test${i}`],
          decision: 'manual',
          processingTime: 50
        });
      }

      // 1つだけ自動承認
      await collector.recordOperation({
        operationType: 'test',
        command: 'git',
        args: ['status'],
        decision: 'auto',
        processingTime: 50
      });

      const currentMetrics = await collector.getCurrentMetrics();

      // 自動承認率が低いためアラートが発生するはず
      expect(currentMetrics.todayAutoApprovalRate).toBeLessThan(95);
      expect(currentMetrics.alertsCount).toBeGreaterThan(0);
    });
  });

  describe('レポート生成統合', () => {
    beforeEach(async () => {
      // テスト用のメトリクスデータを作成
      const operations = [
        { type: 'git', command: 'git', args: ['status'], decision: 'auto', time: 45 },
        { type: 'git', command: 'git', args: ['commit'], decision: 'auto', time: 60 },
        { type: 'git', command: 'git', args: ['push'], decision: 'auto', time: 80 },
        { type: 'file', command: 'rm', args: ['-rf', 'test'], decision: 'manual', time: 120 },
        { type: 'cli', command: 'vercel', args: ['env', 'set'], decision: 'manual', time: 150 }
      ];

      for (const op of operations) {
        await collector.recordOperation({
          operationType: op.type,
          command: op.command,
          args: op.args,
          decision: op.decision as 'auto' | 'manual',
          processingTime: op.time
        });
      }
    });

    it('日次レポートが正確に生成される', async () => {
      const today = new Date();
      const report = await collector.generateDailyReport(today);

      // レポート内容の検証
      expect(report).toContain('Trust承認ポリシー 日次メトリクスレポート');
      expect(report).toContain('**総操作数**: 5');
      expect(report).toContain('**自動承認**: 3 (60.0%)');
      expect(report).toContain('**手動承認**: 2 (40.0%)');
      expect(report).toContain('**平均処理時間**: 91.0ms');

      // 目標未達成の警告が含まれることを確認
      expect(report).toContain('改善提案');
      expect(report).toContain('自動承認率が目標の95%を下回っています');

      // レポートファイルが作成されることを確認
      const reportPath = join(TEST_METRICS_DIR, `daily-report-${today.toISOString().split('T')[0]}.md`);
      const exists = await fs.access(reportPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    it('週次レポートが正確に生成される', async () => {
      const today = new Date();
      const report = await collector.generateWeeklyReport(today);

      // レポート内容の検証
      expect(report).toContain('Trust承認ポリシー 週次メトリクスレポート');
      expect(report).toContain('週間概要');
      expect(report).toContain('日別推移');
      expect(report).toContain('| 日付 | 操作数 | 自動承認率 | 平均処理時間 |');
      expect(report).toContain('トレンド分析');
      expect(report).toContain('推奨アクション');

      // レポートファイルが作成されることを確認
      const reportPath = join(TEST_METRICS_DIR, `weekly-report-${today.toISOString().split('T')[0]}.md`);
      const exists = await fs.access(reportPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });
  });

  describe('データ整合性', () => {
    it('メトリクスデータの整合性が保たれる', async () => {
      const testOperations = [
        { type: 'git', decision: 'auto', time: 45 },
        { type: 'git', decision: 'auto', time: 60 },
        { type: 'file', decision: 'manual', time: 120 }
      ];

      // メトリクス記録
      for (const [index, op] of testOperations.entries()) {
        await collector.recordOperation({
          operationType: op.type,
          command: 'test-command',
          args: [`arg${index}`],
          decision: op.decision as 'auto' | 'manual',
          processingTime: op.time,
          userId: 'test-user'
        });
      }

      // ファイルから直接読み込み
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      const rawMetrics = await collector.loadMetrics(startOfDay, endOfDay);
      const aggregated = await collector.aggregateMetrics(startOfDay, endOfDay);

      // データ整合性の確認
      expect(rawMetrics).toHaveLength(testOperations.length);
      expect(aggregated.totalOperations).toBe(testOperations.length);
      
      const autoCount = testOperations.filter(op => op.decision === 'auto').length;
      const manualCount = testOperations.filter(op => op.decision === 'manual').length;
      
      expect(aggregated.autoApprovedOperations).toBe(autoCount);
      expect(aggregated.manualApprovedOperations).toBe(manualCount);
      
      const expectedAvgTime = testOperations.reduce((sum, op) => sum + op.time, 0) / testOperations.length;
      expect(aggregated.averageProcessingTime).toBeCloseTo(expectedAvgTime, 1);
    });

    it('並行操作でもデータが正しく記録される', async () => {
      const operationCount = 50;
      const promises = [];

      // 並行してメトリクスを記録
      for (let i = 0; i < operationCount; i++) {
        const promise = collector.recordOperation({
          operationType: 'concurrent-test',
          command: 'test',
          args: [`concurrent-${i}`],
          decision: i % 5 === 0 ? 'manual' : 'auto',
          processingTime: 30 + Math.random() * 40,
          userId: `user-${i % 3}`
        });
        promises.push(promise);
      }

      await Promise.all(promises);

      // 結果の検証
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);

      const aggregated = await collector.aggregateMetrics(startOfDay, today);
      
      expect(aggregated.totalOperations).toBe(operationCount);
      
      // 自動承認率の確認（5回に1回が手動承認）
      const expectedAutoCount = operationCount - Math.floor(operationCount / 5);
      expect(aggregated.autoApprovedOperations).toBe(expectedAutoCount);
    });
  });

  describe('エラー処理', () => {
    it('ファイル書き込みエラーでも処理が継続される', async () => {
      // 書き込み権限のないディレクトリを設定
      const readOnlyDir = join(TEST_DIR, 'readonly');
      await fs.mkdir(readOnlyDir, { recursive: true });
      
      // 権限を読み取り専用に変更（Windowsでは動作しない可能性があります）
      try {
        await fs.chmod(readOnlyDir, 0o444);
      } catch (error) {
        // 権限変更に失敗した場合はテストをスキップ
        return;
      }

      const errorCollector = new MetricsCollector({ enabled: true });
      (errorCollector as any).metricsDir = readOnlyDir;

      // エラーが発生してもメソッドが正常に完了することを確認
      await expect(errorCollector.recordOperation({
        operationType: 'test',
        command: 'test',
        args: ['test'],
        decision: 'auto',
        processingTime: 50
      })).resolves.not.toThrow();
    });

    it('破損したメトリクスファイルを適切に処理する', async () => {
      // 破損したメトリクスファイルを作成
      const today = new Date().toISOString().split('T')[0];
      const corruptedFile = join(TEST_METRICS_DIR, `trust-metrics-${today}.jsonl`);
      
      await fs.writeFile(corruptedFile, 'invalid json line\n{"valid": "json"}\ninvalid again\n', 'utf-8');

      // 破損したファイルがあっても正常に処理されることを確認
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const metrics = await collector.loadMetrics(startOfDay, endOfDay);
      
      // 有効な行のみが読み込まれることを確認
      expect(metrics).toHaveLength(1);
      expect(metrics[0]).toHaveProperty('valid', 'json');
    });
  });
});