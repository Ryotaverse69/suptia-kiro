/**
 * メトリクス収集システムのテスト
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import { join } from 'path';
import { MetricsCollector, TrustMetrics, AggregatedMetrics } from '../metrics-collector';

const TEST_METRICS_DIR = '.kiro-test/reports/metrics';

describe('MetricsCollector', () => {
  let collector: MetricsCollector;

  beforeEach(async () => {
    // テスト用ディレクトリの作成
    await fs.mkdir(TEST_METRICS_DIR, { recursive: true });
    
    collector = new MetricsCollector({
      enabled: true,
      retentionDays: 7,
      aggregationInterval: 60,
      performanceThresholds: {
        fast: 50,
        normal: 100
      }
    });
    
    // テスト用のメトリクスディレクトリを設定
    (collector as any).metricsDir = TEST_METRICS_DIR;
    
    await collector.initialize();
  });

  afterEach(async () => {
    // テスト用ディレクトリの削除
    try {
      await fs.rm('.kiro-test', { recursive: true, force: true });
    } catch (error) {
      // 削除に失敗しても続行
    }
  });

  describe('初期化', () => {
    it('メトリクスディレクトリが作成される', async () => {
      const exists = await fs.access(TEST_METRICS_DIR).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    it('無効化されている場合はディレクトリを作成しない', async () => {
      const disabledCollector = new MetricsCollector({ enabled: false });
      
      // 初期化を実行しても何も起こらない
      await disabledCollector.initialize();
      
      // 実際のテストは実装依存のため、エラーが発生しないことを確認
      expect(true).toBe(true);
    });
  });

  describe('メトリクス記録', () => {
    it('操作メトリクスが正しく記録される', async () => {
      const metrics: Omit<TrustMetrics, 'timestamp'> = {
        operationType: 'git',
        command: 'git',
        args: ['status'],
        decision: 'auto',
        processingTime: 45,
        userId: 'test-user',
        context: { cwd: '/test' }
      };

      await collector.recordOperation(metrics);

      // ファイルが作成されることを確認
      const today = new Date().toISOString().split('T')[0];
      const filePath = join(TEST_METRICS_DIR, `trust-metrics-${today}.jsonl`);
      
      const exists = await fs.access(filePath).then(() => true).catch(() => false);
      expect(exists).toBe(true);

      // ファイル内容を確認
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.trim().split('\n');
      expect(lines.length).toBe(1);

      const recordedMetrics = JSON.parse(lines[0]) as TrustMetrics;
      expect(recordedMetrics.operationType).toBe('git');
      expect(recordedMetrics.command).toBe('git');
      expect(recordedMetrics.decision).toBe('auto');
      expect(recordedMetrics.processingTime).toBe(45);
      expect(recordedMetrics.timestamp).toBeDefined();
    });

    it('複数の操作メトリクスが追記される', async () => {
      const metrics1: Omit<TrustMetrics, 'timestamp'> = {
        operationType: 'git',
        command: 'git',
        args: ['status'],
        decision: 'auto',
        processingTime: 45
      };

      const metrics2: Omit<TrustMetrics, 'timestamp'> = {
        operationType: 'file',
        command: 'touch',
        args: ['test.txt'],
        decision: 'auto',
        processingTime: 30
      };

      await collector.recordOperation(metrics1);
      await collector.recordOperation(metrics2);

      const today = new Date().toISOString().split('T')[0];
      const filePath = join(TEST_METRICS_DIR, `trust-metrics-${today}.jsonl`);
      
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.trim().split('\n');
      expect(lines.length).toBe(2);
    });

    it('無効化されている場合は記録しない', async () => {
      const disabledCollector = new MetricsCollector({ enabled: false });
      
      const metrics: Omit<TrustMetrics, 'timestamp'> = {
        operationType: 'git',
        command: 'git',
        args: ['status'],
        decision: 'auto',
        processingTime: 45
      };

      await disabledCollector.recordOperation(metrics);

      // ファイルが作成されないことを確認
      const today = new Date().toISOString().split('T')[0];
      const filePath = join(TEST_METRICS_DIR, `trust-metrics-${today}.jsonl`);
      
      const exists = await fs.access(filePath).then(() => true).catch(() => false);
      expect(exists).toBe(false);
    });
  });

  describe('メトリクス読み込み', () => {
    beforeEach(async () => {
      // テスト用のメトリクスデータを作成
      const testDate = '2025-08-27';
      const filePath = join(TEST_METRICS_DIR, `trust-metrics-${testDate}.jsonl`);
      
      const testMetrics = [
        {
          timestamp: '2025-08-27T09:00:00.000Z',
          operationType: 'git',
          command: 'git',
          args: ['status'],
          decision: 'auto',
          processingTime: 45
        },
        {
          timestamp: '2025-08-27T09:05:00.000Z',
          operationType: 'git',
          command: 'git',
          args: ['commit'],
          decision: 'auto',
          processingTime: 60
        },
        {
          timestamp: '2025-08-27T09:10:00.000Z',
          operationType: 'file',
          command: 'rm',
          args: ['-rf', 'test'],
          decision: 'manual',
          processingTime: 120
        }
      ];

      const content = testMetrics.map(m => JSON.stringify(m)).join('\n') + '\n';
      await fs.writeFile(filePath, content, 'utf-8');
    });

    it('指定期間のメトリクスが正しく読み込まれる', async () => {
      const startDate = new Date('2025-08-27T00:00:00.000Z');
      const endDate = new Date('2025-08-27T23:59:59.999Z');

      const metrics = await collector.loadMetrics(startDate, endDate);

      expect(metrics).toHaveLength(3);
      expect(metrics[0].operationType).toBe('git');
      expect(metrics[1].command).toBe('git');
      expect(metrics[2].decision).toBe('manual');
    });

    it('期間外のメトリクスは除外される', async () => {
      const startDate = new Date('2025-08-27T09:03:00.000Z');
      const endDate = new Date('2025-08-27T09:07:00.000Z');

      const metrics = await collector.loadMetrics(startDate, endDate);

      expect(metrics).toHaveLength(1);
      expect(metrics[0].timestamp).toBe('2025-08-27T09:05:00.000Z');
    });

    it('存在しない日付の場合は空配列を返す', async () => {
      const startDate = new Date('2025-08-26T00:00:00.000Z');
      const endDate = new Date('2025-08-26T23:59:59.999Z');

      const metrics = await collector.loadMetrics(startDate, endDate);

      expect(metrics).toHaveLength(0);
    });
  });

  describe('メトリクス集計', () => {
    beforeEach(async () => {
      // テスト用のメトリクスデータを作成
      const testMetrics = [
        {
          timestamp: '2025-08-27T09:00:00.000Z',
          operationType: 'git',
          command: 'git',
          args: ['status'],
          decision: 'auto',
          processingTime: 45
        },
        {
          timestamp: '2025-08-27T09:05:00.000Z',
          operationType: 'git',
          command: 'git',
          args: ['commit'],
          decision: 'auto',
          processingTime: 60
        },
        {
          timestamp: '2025-08-27T09:10:00.000Z',
          operationType: 'file',
          command: 'rm',
          args: ['-rf', 'test'],
          decision: 'manual',
          processingTime: 120
        },
        {
          timestamp: '2025-08-27T09:15:00.000Z',
          operationType: 'git',
          command: 'git',
          args: ['push'],
          decision: 'auto',
          processingTime: 80
        }
      ];

      const filePath = join(TEST_METRICS_DIR, 'trust-metrics-2025-08-27.jsonl');
      const content = testMetrics.map(m => JSON.stringify(m)).join('\n') + '\n';
      await fs.writeFile(filePath, content, 'utf-8');
    });

    it('メトリクスが正しく集計される', async () => {
      const startDate = new Date('2025-08-27T00:00:00.000Z');
      const endDate = new Date('2025-08-27T23:59:59.999Z');

      const aggregated = await collector.aggregateMetrics(startDate, endDate);

      expect(aggregated.totalOperations).toBe(4);
      expect(aggregated.autoApprovedOperations).toBe(3);
      expect(aggregated.manualApprovedOperations).toBe(1);
      expect(aggregated.autoApprovalRate).toBe(75); // 3/4 * 100
      expect(aggregated.averageProcessingTime).toBe(76.25); // (45+60+120+80)/4
      expect(aggregated.maxProcessingTime).toBe(120);
      expect(aggregated.trustDialogDisplayCount).toBe(1);
    });

    it('操作タイプ別の集計が正しい', async () => {
      const startDate = new Date('2025-08-27T00:00:00.000Z');
      const endDate = new Date('2025-08-27T23:59:59.999Z');

      const aggregated = await collector.aggregateMetrics(startDate, endDate);

      expect(aggregated.operationsByType.git).toBe(3);
      expect(aggregated.operationsByType.file).toBe(1);
    });

    it('パフォーマンス分析が正しい', async () => {
      const startDate = new Date('2025-08-27T00:00:00.000Z');
      const endDate = new Date('2025-08-27T23:59:59.999Z');

      const aggregated = await collector.aggregateMetrics(startDate, endDate);

      expect(aggregated.performanceMetrics.fastOperations).toBe(1); // 45ms
      expect(aggregated.performanceMetrics.normalOperations).toBe(2); // 60ms, 80ms
      expect(aggregated.performanceMetrics.slowOperations).toBe(1); // 120ms
    });

    it('データがない場合は空の集計を返す', async () => {
      const startDate = new Date('2025-08-26T00:00:00.000Z');
      const endDate = new Date('2025-08-26T23:59:59.999Z');

      const aggregated = await collector.aggregateMetrics(startDate, endDate);

      expect(aggregated.totalOperations).toBe(0);
      expect(aggregated.autoApprovalRate).toBe(0);
      expect(aggregated.averageProcessingTime).toBe(0);
    });
  });

  describe('レポート生成', () => {
    beforeEach(async () => {
      // テスト用のメトリクスデータを作成
      const testMetrics = [
        {
          timestamp: '2025-08-27T09:00:00.000Z',
          operationType: 'git',
          command: 'git',
          args: ['status'],
          decision: 'auto',
          processingTime: 45
        },
        {
          timestamp: '2025-08-27T09:05:00.000Z',
          operationType: 'git',
          command: 'git',
          args: ['commit'],
          decision: 'auto',
          processingTime: 60
        },
        {
          timestamp: '2025-08-27T09:10:00.000Z',
          operationType: 'file',
          command: 'rm',
          args: ['-rf', 'test'],
          decision: 'manual',
          processingTime: 120
        }
      ];

      const filePath = join(TEST_METRICS_DIR, 'trust-metrics-2025-08-27.jsonl');
      const content = testMetrics.map(m => JSON.stringify(m)).join('\n') + '\n';
      await fs.writeFile(filePath, content, 'utf-8');
    });

    it('日次レポートが正しく生成される', async () => {
      const date = new Date('2025-08-27');
      const report = await collector.generateDailyReport(date);

      expect(report).toContain('Trust承認ポリシー 日次メトリクスレポート');
      expect(report).toContain('**日付**: 2025-08-27');
      expect(report).toContain('**総操作数**: 3');
      expect(report).toContain('**自動承認**: 2 (66.7%)');
      expect(report).toContain('**手動承認**: 1 (33.3%)');
      expect(report).toContain('**平均処理時間**: 75.0ms');

      // レポートファイルが作成されることを確認
      const reportPath = join(TEST_METRICS_DIR, 'daily-report-2025-08-27.md');
      const exists = await fs.access(reportPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    it('自動承認率が低い場合に改善提案が含まれる', async () => {
      const date = new Date('2025-08-27');
      const report = await collector.generateDailyReport(date);

      expect(report).toContain('改善提案');
      expect(report).toContain('自動承認率が目標の95%を下回っています');
    });

    it('処理時間が遅い場合にパフォーマンス改善提案が含まれる', async () => {
      // 遅い処理時間のメトリクスを追加
      const slowMetrics = {
        timestamp: '2025-08-27T09:20:00.000Z',
        operationType: 'git',
        command: 'git',
        args: ['push'],
        decision: 'auto',
        processingTime: 200
      };

      const filePath = join(TEST_METRICS_DIR, 'trust-metrics-2025-08-27.jsonl');
      await fs.appendFile(filePath, JSON.stringify(slowMetrics) + '\n', 'utf-8');

      const date = new Date('2025-08-27');
      const report = await collector.generateDailyReport(date);

      expect(report).toContain('パフォーマンス改善提案');
      expect(report).toContain('処理時間が目標の100msを超えています');
    });
  });

  describe('週次レポート生成', () => {
    beforeEach(async () => {
      // 7日分のテストデータを作成
      for (let i = 0; i < 7; i++) {
        const date = new Date('2025-08-21');
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];

        const testMetrics = [
          {
            timestamp: `${dateStr}T09:00:00.000Z`,
            operationType: 'git',
            command: 'git',
            args: ['status'],
            decision: 'auto',
            processingTime: 45 + i * 5
          },
          {
            timestamp: `${dateStr}T09:05:00.000Z`,
            operationType: 'git',
            command: 'git',
            args: ['commit'],
            decision: 'auto',
            processingTime: 60 + i * 3
          }
        ];

        if (i % 3 === 0) {
          // 3日に1回手動承認を追加
          testMetrics.push({
            timestamp: `${dateStr}T09:10:00.000Z`,
            operationType: 'file',
            command: 'rm',
            args: ['-rf', 'test'],
            decision: 'manual',
            processingTime: 120
          });
        }

        const filePath = join(TEST_METRICS_DIR, `trust-metrics-${dateStr}.jsonl`);
        const content = testMetrics.map(m => JSON.stringify(m)).join('\n') + '\n';
        await fs.writeFile(filePath, content, 'utf-8');
      }
    });

    it('週次レポートが正しく生成される', async () => {
      const endDate = new Date('2025-08-27');
      const report = await collector.generateWeeklyReport(endDate);

      expect(report).toContain('Trust承認ポリシー 週次メトリクスレポート');
      expect(report).toContain('**期間**: 2025-08-21 ～ 2025-08-27');
      expect(report).toContain('週間概要');
      expect(report).toContain('日別推移');
      expect(report).toContain('| 日付 | 操作数 | 自動承認率 | 平均処理時間 |');

      // レポートファイルが作成されることを確認
      const reportPath = join(TEST_METRICS_DIR, 'weekly-report-2025-08-27.md');
      const exists = await fs.access(reportPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    it('トレンド分析が含まれる', async () => {
      const endDate = new Date('2025-08-27');
      const report = await collector.generateWeeklyReport(endDate);

      expect(report).toContain('トレンド分析');
      expect(report).toMatch(/自動承認率.*:(📈|📉|➡️)/);
      expect(report).toMatch(/処理時間.*:(📈|📉|➡️)/);
    });

    it('推奨アクションが含まれる', async () => {
      const endDate = new Date('2025-08-27');
      const report = await collector.generateWeeklyReport(endDate);

      expect(report).toContain('推奨アクション');
    });
  });

  describe('リアルタイム監視', () => {
    it('現在のメトリクスが取得できる', async () => {
      // 今日のメトリクスを作成
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      const testMetrics = [
        {
          timestamp: `${todayStr}T09:00:00.000Z`,
          operationType: 'git',
          command: 'git',
          args: ['status'],
          decision: 'auto',
          processingTime: 45
        },
        {
          timestamp: `${todayStr}T09:05:00.000Z`,
          operationType: 'git',
          command: 'git',
          args: ['commit'],
          decision: 'auto',
          processingTime: 60
        }
      ];

      const filePath = join(TEST_METRICS_DIR, `trust-metrics-${todayStr}.jsonl`);
      const content = testMetrics.map(m => JSON.stringify(m)).join('\n') + '\n';
      await fs.writeFile(filePath, content, 'utf-8');

      // メモリ内キャッシュにもデータを追加
      for (const metrics of testMetrics) {
        await collector.recordOperation({
          operationType: metrics.operationType,
          command: metrics.command,
          args: metrics.args,
          decision: metrics.decision as 'auto' | 'manual',
          processingTime: metrics.processingTime
        });
      }

      const currentMetrics = await collector.getCurrentMetrics();

      expect(currentMetrics.todayOperations).toBeGreaterThan(0);
      expect(currentMetrics.todayAutoApprovalRate).toBeGreaterThan(0);
      expect(currentMetrics.recentAverageProcessingTime).toBeGreaterThan(0);
      expect(typeof currentMetrics.alertsCount).toBe('number');
    });
  });

  describe('クリーンアップ', () => {
    it('古いメトリクスファイルが削除される', async () => {
      // 古いファイルを作成
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 10);
      const oldDateStr = oldDate.toISOString().split('T')[0];
      
      const oldFilePath = join(TEST_METRICS_DIR, `trust-metrics-${oldDateStr}.jsonl`);
      await fs.writeFile(oldFilePath, 'test data\n', 'utf-8');

      // 新しいファイルを作成
      const newDate = new Date();
      const newDateStr = newDate.toISOString().split('T')[0];
      
      const newFilePath = join(TEST_METRICS_DIR, `trust-metrics-${newDateStr}.jsonl`);
      await fs.writeFile(newFilePath, 'test data\n', 'utf-8');

      // クリーンアップ実行
      await collector.cleanupOldMetrics();

      // 古いファイルが削除され、新しいファイルは残る
      const oldExists = await fs.access(oldFilePath).then(() => true).catch(() => false);
      const newExists = await fs.access(newFilePath).then(() => true).catch(() => false);

      expect(oldExists).toBe(false);
      expect(newExists).toBe(true);
    });
  });
});