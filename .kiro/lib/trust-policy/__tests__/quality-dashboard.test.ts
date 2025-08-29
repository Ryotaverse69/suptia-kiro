/**
 * 品質ダッシュボードのテスト
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import { join } from 'path';
import { QualityDashboard, QualityAlert, QualityTarget, QualityImprovementTask, DashboardData } from '../quality-dashboard';
import { QualityAssuranceController, QualityCheckResult } from '../quality-assurance-controller';
import { QualityReportGenerator } from '../quality-report-generator';

// モックの設定
vi.mock('fs', () => ({
  promises: {
    mkdir: vi.fn(),
    writeFile: vi.fn(),
    readFile: vi.fn(),
    readdir: vi.fn(),
    stat: vi.fn(),
    unlink: vi.fn()
  }
}));

vi.mock('../quality-assurance-controller');
vi.mock('../quality-report-generator');

describe('QualityDashboard', () => {
  let dashboard: QualityDashboard;
  let mockQaController: any;
  let mockReportGenerator: any;
  let mockQualityResult: QualityCheckResult;

  beforeEach(async () => {
    dashboard = new QualityDashboard();
    
    // モックの設定
    mockQaController = {
      initialize: vi.fn().mockResolvedValue(undefined),
      performQualityCheck: vi.fn()
    };
    
    mockReportGenerator = {
      initialize: vi.fn().mockResolvedValue(undefined),
      generateComprehensiveReport: vi.fn()
    };

    (QualityAssuranceController as any).mockImplementation(() => mockQaController);
    (QualityReportGenerator as any).mockImplementation(() => mockReportGenerator);

    // テスト用品質結果
    mockQualityResult = {
      passed: false,
      issues: [
        {
          id: 'test-issue-1',
          type: 'MISSING_METHOD',
          severity: 'critical',
          component: 'TestComponent',
          description: 'テスト用重大問題',
          detectedAt: new Date(),
          autoFixable: false,
          fixApplied: false
        },
        {
          id: 'test-issue-2',
          type: 'PERFORMANCE_DEGRADATION',
          severity: 'medium',
          component: 'PerformanceComponent',
          description: 'パフォーマンス問題',
          detectedAt: new Date(),
          autoFixable: true,
          fixApplied: false
        }
      ],
      summary: {
        total: 2,
        critical: 1,
        high: 0,
        medium: 1,
        low: 0,
        autoFixed: 0
      },
      recommendations: ['テスト推奨事項']
    };

    mockQaController.performQualityCheck.mockResolvedValue(mockQualityResult);
    mockReportGenerator.generateComprehensiveReport.mockResolvedValue({
      id: 'test-report',
      generatedAt: new Date(),
      period: { from: new Date(), to: new Date() },
      summary: {
        overallScore: 75,
        trend: 'stable',
        totalIssues: 2,
        resolvedIssues: 0,
        criticalIssues: 1
      },
      metrics: {
        timestamp: new Date(),
        overallScore: 75,
        categories: {
          reliability: 70,
          performance: 80,
          maintainability: 75,
          security: 85
        },
        testCoverage: 80,
        codeQuality: 75,
        deploymentReadiness: false
      },
      trends: [
        { date: '2024-01-01', score: 70, issues: 3, fixes: 1, category: 'overall' },
        { date: '2024-01-02', score: 75, issues: 2, fixes: 1, category: 'overall' }
      ],
      issues: mockQualityResult.issues,
      improvements: [],
      recommendations: [],
      charts: {
        scoreHistory: { type: 'line', title: 'Test', labels: [], datasets: [] },
        issueDistribution: { type: 'pie', title: 'Test', labels: [], datasets: [] },
        categoryBreakdown: { type: 'bar', title: 'Test', labels: [], datasets: [] }
      }
    });

    // fsモックのリセット
    vi.clearAllMocks();
    (fs.mkdir as any).mockResolvedValue(undefined);
    (fs.writeFile as any).mockResolvedValue(undefined);
    (fs.readFile as any).mockRejectedValue(new Error('File not found')); // デフォルトでファイルなし
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('初期化', () => {
    it('正常に初期化できる', async () => {
      await expect(dashboard.initialize()).resolves.not.toThrow();
      
      expect(mockQaController.initialize).toHaveBeenCalled();
      expect(mockReportGenerator.initialize).toHaveBeenCalled();
      expect(fs.mkdir).toHaveBeenCalledWith('.kiro/reports/quality/dashboard', { recursive: true });
    });

    it('依存コンポーネントの初期化エラーを処理する', async () => {
      mockQaController.initialize.mockRejectedValue(new Error('QA Controller init failed'));

      await expect(dashboard.initialize()).rejects.toThrow('QA Controller init failed');
    });

    it('ディレクトリ作成エラーを処理する', async () => {
      (fs.mkdir as any).mockRejectedValue(new Error('Permission denied'));

      await expect(dashboard.initialize()).rejects.toThrow('Permission denied');
    });
  });

  describe('ダッシュボードデータ取得', () => {
    beforeEach(async () => {
      await dashboard.initialize();
    });

    it('基本的なダッシュボードデータを取得できる', async () => {
      const data = await dashboard.getDashboardData();

      expect(data).toBeDefined();
      expect(data.timestamp).toBeInstanceOf(Date);
      expect(data.summary).toBeDefined();
      expect(data.metrics).toBeDefined();
      expect(data.alerts).toBeDefined();
      expect(data.targets).toBeDefined();
      expect(data.tasks).toBeDefined();
      expect(data.charts).toBeDefined();
    });

    it('サマリー情報を正しく計算する', async () => {
      const data = await dashboard.getDashboardData();

      expect(data.summary.overallScore).toBe(75);
      expect(data.summary.criticalIssues).toBe(1);
      expect(typeof data.summary.activeAlerts).toBe('number');
      expect(typeof data.summary.completedTasks).toBe('number');
      expect(typeof data.summary.totalTasks).toBe('number');
    });

    it('品質メトリクスを含む', async () => {
      const data = await dashboard.getDashboardData();

      expect(data.metrics.overallScore).toBe(75);
      expect(data.metrics.categories.reliability).toBe(70);
      expect(data.metrics.categories.performance).toBe(80);
      expect(data.metrics.categories.maintainability).toBe(75);
      expect(data.metrics.categories.security).toBe(85);
    });

    it('チャートデータを生成する', async () => {
      const data = await dashboard.getDashboardData();

      expect(data.charts.scoreHistory).toBeDefined();
      expect(data.charts.alertTrends).toBeDefined();
      expect(data.charts.taskProgress).toBeDefined();
      expect(data.charts.categoryBreakdown).toBeDefined();

      // チャート構造の確認
      expect(data.charts.scoreHistory.type).toBeDefined();
      expect(data.charts.scoreHistory.title).toBeDefined();
      expect(Array.isArray(data.charts.scoreHistory.labels)).toBe(true);
      expect(Array.isArray(data.charts.scoreHistory.datasets)).toBe(true);
    });
  });

  describe('アラート管理', () => {
    beforeEach(async () => {
      await dashboard.initialize();
    });

    it('アラートを作成できる', async () => {
      const alertData = {
        type: 'critical' as const,
        title: 'テストアラート',
        message: 'テスト用のアラートメッセージ',
        severity: 'high' as const,
        category: 'test',
        actionRequired: true,
        relatedIssues: ['issue-1']
      };

      const alert = await dashboard.createAlert(alertData);

      expect(alert.id).toBeDefined();
      expect(alert.title).toBe('テストアラート');
      expect(alert.isActive).toBe(true);
      expect(alert.createdAt).toBeInstanceOf(Date);
    });

    it('アラートを解決できる', async () => {
      // アラートを作成
      const alert = await dashboard.createAlert({
        type: 'warning',
        title: 'テストアラート',
        message: 'テストメッセージ',
        severity: 'medium',
        category: 'test',
        actionRequired: false,
        relatedIssues: []
      });

      // アラートを解決
      const resolved = await dashboard.resolveAlert(alert.id);

      expect(resolved).toBe(true);
    });

    it('存在しないアラートの解決を適切に処理する', async () => {
      const resolved = await dashboard.resolveAlert('non-existent-alert');

      expect(resolved).toBe(false);
    });

    it('重大な問題に対してアラートを自動生成する', async () => {
      const data = await dashboard.getDashboardData();

      // 重大な問題があるのでアラートが生成されるはず
      expect(data.alerts.length).toBeGreaterThan(0);
      
      const criticalAlert = data.alerts.find(a => a.type === 'critical');
      expect(criticalAlert).toBeDefined();
    });
  });

  describe('品質目標管理', () => {
    beforeEach(async () => {
      await dashboard.initialize();
    });

    it('品質目標を作成できる', async () => {
      const targetData = {
        name: 'テスト目標',
        description: 'テスト用の品質目標',
        category: 'overall' as const,
        targetValue: 90,
        unit: '点',
        threshold: { critical: 50, warning: 70, good: 90 },
        isActive: true
      };

      const target = await dashboard.createTarget(targetData);

      expect(target.id).toBeDefined();
      expect(target.name).toBe('テスト目標');
      expect(target.currentValue).toBe(0);
      expect(target.createdAt).toBeInstanceOf(Date);
    });

    it('品質目標を更新できる', async () => {
      const target = await dashboard.createTarget({
        name: 'テスト目標',
        description: 'テスト用の品質目標',
        category: 'performance',
        targetValue: 80,
        unit: '点',
        threshold: { critical: 50, warning: 65, good: 80 },
        isActive: true
      });

      const updated = await dashboard.updateTarget(target.id, {
        targetValue: 85,
        description: '更新されたテスト目標'
      });

      expect(updated).toBe(true);
    });

    it('存在しない目標の更新を適切に処理する', async () => {
      const updated = await dashboard.updateTarget('non-existent-target', {
        targetValue: 100
      });

      expect(updated).toBe(false);
    });

    it('デフォルト目標が設定される', async () => {
      const data = await dashboard.getDashboardData();

      expect(data.targets.length).toBeGreaterThan(0);
      
      const overallTarget = data.targets.find(t => t.category === 'overall');
      expect(overallTarget).toBeDefined();
      expect(overallTarget?.name).toContain('全体品質スコア');
    });
  });

  describe('改善タスク管理', () => {
    beforeEach(async () => {
      await dashboard.initialize();
    });

    it('改善タスクを作成できる', async () => {
      const taskData = {
        title: 'テストタスク',
        description: 'テスト用の改善タスク',
        priority: 'high' as const,
        status: 'pending' as const,
        category: 'reliability',
        estimatedEffort: 8,
        relatedIssues: ['issue-1'],
        blockers: [],
        dependencies: []
      };

      const task = await dashboard.createTask(taskData);

      expect(task.id).toBeDefined();
      expect(task.title).toBe('テストタスク');
      expect(task.progress).toBe(0);
      expect(task.createdAt).toBeInstanceOf(Date);
    });

    it('改善タスクを更新できる', async () => {
      const task = await dashboard.createTask({
        title: 'テストタスク',
        description: 'テスト用タスク',
        priority: 'medium',
        status: 'pending',
        category: 'performance',
        estimatedEffort: 4,
        relatedIssues: [],
        blockers: [],
        dependencies: []
      });

      const updated = await dashboard.updateTask(task.id, {
        status: 'in_progress',
        progress: 50
      });

      expect(updated).toBe(true);
    });

    it('タスク完了時の処理を正しく行う', async () => {
      const task = await dashboard.createTask({
        title: 'テストタスク',
        description: 'テスト用タスク',
        priority: 'low',
        status: 'in_progress',
        category: 'maintainability',
        estimatedEffort: 2,
        relatedIssues: [],
        blockers: [],
        dependencies: []
      });

      const updated = await dashboard.updateTask(task.id, {
        status: 'completed'
      });

      expect(updated).toBe(true);
    });

    it('存在しないタスクの更新を適切に処理する', async () => {
      const updated = await dashboard.updateTask('non-existent-task', {
        status: 'completed'
      });

      expect(updated).toBe(false);
    });
  });

  describe('HTMLダッシュボード生成', () => {
    beforeEach(async () => {
      await dashboard.initialize();
    });

    it('HTMLダッシュボードを生成できる', async () => {
      const html = await dashboard.generateHtmlDashboard();

      expect(html).toBeDefined();
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('品質ダッシュボード');
      expect(html).toContain('全体スコア');
      expect(html).toContain('アクティブアラート');
    });

    it('生成されたHTMLに必要な要素が含まれる', async () => {
      const html = await dashboard.generateHtmlDashboard();

      // 基本構造
      expect(html).toContain('<html lang="ja">');
      expect(html).toContain('<title>品質ダッシュボード</title>');
      
      // サマリーカード
      expect(html).toContain('全体スコア');
      expect(html).toContain('アクティブアラート');
      expect(html).toContain('重大な問題');
      expect(html).toContain('完了タスク');

      // メトリクス
      expect(html).toContain('信頼性');
      expect(html).toContain('パフォーマンス');
      expect(html).toContain('保守性');
      expect(html).toContain('セキュリティ');

      // 自動更新スクリプト
      expect(html).toContain('setTimeout');
      expect(html).toContain('location.reload');
    });

    it('HTMLファイルが保存される', async () => {
      await dashboard.generateHtmlDashboard();

      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('dashboard.html'),
        expect.stringContaining('<!DOCTYPE html>')
      );
    });
  });

  describe('設定管理', () => {
    beforeEach(async () => {
      await dashboard.initialize();
    });

    it('設定を更新できる', async () => {
      const updates = {
        refreshInterval: 600,
        alertRetentionDays: 60,
        enableRealTimeUpdates: false
      };

      await dashboard.updateConfig(updates);

      // 設定が保存されることを確認
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('config.json'),
        expect.stringContaining('"refreshInterval":600')
      );
    });

    it('デフォルト設定が適用される', async () => {
      // 設定ファイルが存在しない場合のテスト
      const data = await dashboard.getDashboardData();

      expect(data).toBeDefined();
      // デフォルト設定で動作することを確認
    });
  });

  describe('データ永続化', () => {
    beforeEach(async () => {
      await dashboard.initialize();
    });

    it('アラートデータが保存される', async () => {
      await dashboard.createAlert({
        type: 'info',
        title: 'テストアラート',
        message: 'テストメッセージ',
        severity: 'low',
        category: 'test',
        actionRequired: false,
        relatedIssues: []
      });

      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('alerts.json'),
        expect.stringContaining('テストアラート')
      );
    });

    it('目標データが保存される', async () => {
      await dashboard.createTarget({
        name: 'テスト目標',
        description: 'テスト用目標',
        category: 'overall',
        targetValue: 95,
        unit: '点',
        threshold: { critical: 60, warning: 80, good: 95 },
        isActive: true
      });

      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('targets.json'),
        expect.stringContaining('テスト目標')
      );
    });

    it('タスクデータが保存される', async () => {
      await dashboard.createTask({
        title: 'テストタスク',
        description: 'テスト用タスク',
        priority: 'medium',
        status: 'pending',
        category: 'test',
        estimatedEffort: 4,
        relatedIssues: [],
        blockers: [],
        dependencies: []
      });

      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('tasks.json'),
        expect.stringContaining('テストタスク')
      );
    });

    it('ダッシュボードデータが保存される', async () => {
      await dashboard.getDashboardData();

      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('latest-data.json'),
        expect.stringContaining('"timestamp"')
      );
    });
  });

  describe('エラーハンドリング', () => {
    it('初期化されていない状態でのデータ取得', async () => {
      const newDashboard = new QualityDashboard();
      
      // 初期化が自動的に実行されることを確認
      await expect(newDashboard.getDashboardData()).resolves.toBeDefined();
    });

    it('品質チェック失敗時の処理', async () => {
      await dashboard.initialize();
      
      mockQaController.performQualityCheck.mockRejectedValue(new Error('Quality check failed'));

      await expect(dashboard.getDashboardData()).rejects.toThrow('Quality check failed');
    });

    it('レポート生成失敗時の処理', async () => {
      await dashboard.initialize();
      
      mockReportGenerator.generateComprehensiveReport.mockRejectedValue(new Error('Report generation failed'));

      await expect(dashboard.getDashboardData()).rejects.toThrow('Report generation failed');
    });

    it('ファイル保存エラーの処理', async () => {
      await dashboard.initialize();
      
      (fs.writeFile as any).mockRejectedValue(new Error('Disk full'));

      // エラーが発生してもアラート作成は完了する（内部でエラーハンドリング）
      await expect(dashboard.createAlert({
        type: 'info',
        title: 'テスト',
        message: 'テスト',
        severity: 'low',
        category: 'test',
        actionRequired: false,
        relatedIssues: []
      })).resolves.toBeDefined();
    });
  });

  describe('パフォーマンス', () => {
    beforeEach(async () => {
      await dashboard.initialize();
    });

    it('大量のアラートを効率的に処理する', async () => {
      const startTime = Date.now();

      // 大量のアラートを作成
      const alertPromises = Array.from({ length: 100 }, (_, i) =>
        dashboard.createAlert({
          type: 'info',
          title: `テストアラート ${i}`,
          message: `テストメッセージ ${i}`,
          severity: 'low',
          category: 'test',
          actionRequired: false,
          relatedIssues: []
        })
      );

      await Promise.all(alertPromises);
      const endTime = Date.now();

      // 処理時間が合理的な範囲内であることを確認（5秒以内）
      expect(endTime - startTime).toBeLessThan(5000);
    });

    it('大量のタスクを効率的に処理する', async () => {
      const startTime = Date.now();

      // 大量のタスクを作成
      const taskPromises = Array.from({ length: 50 }, (_, i) =>
        dashboard.createTask({
          title: `テストタスク ${i}`,
          description: `テスト用タスク ${i}`,
          priority: 'medium',
          status: 'pending',
          category: 'test',
          estimatedEffort: 2,
          relatedIssues: [],
          blockers: [],
          dependencies: []
        })
      );

      await Promise.all(taskPromises);
      const endTime = Date.now();

      // 処理時間が合理的な範囲内であることを確認（3秒以内）
      expect(endTime - startTime).toBeLessThan(3000);
    });

    it('HTMLダッシュボード生成のパフォーマンス', async () => {
      // 大量のデータを準備
      await Promise.all([
        ...Array.from({ length: 20 }, (_, i) =>
          dashboard.createAlert({
            type: 'info',
            title: `アラート ${i}`,
            message: `メッセージ ${i}`,
            severity: 'low',
            category: 'test',
            actionRequired: false,
            relatedIssues: []
          })
        ),
        ...Array.from({ length: 30 }, (_, i) =>
          dashboard.createTask({
            title: `タスク ${i}`,
            description: `説明 ${i}`,
            priority: 'medium',
            status: 'pending',
            category: 'test',
            estimatedEffort: 2,
            relatedIssues: [],
            blockers: [],
            dependencies: []
          })
        )
      ]);

      const startTime = Date.now();
      const html = await dashboard.generateHtmlDashboard();
      const endTime = Date.now();

      expect(html).toBeDefined();
      expect(html.length).toBeGreaterThan(1000);
      
      // HTML生成時間が合理的な範囲内であることを確認（2秒以内）
      expect(endTime - startTime).toBeLessThan(2000);
    });
  });
});