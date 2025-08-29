/**
 * 品質レポートジェネレーターのテスト
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import { join } from 'path';
import { QualityReportGenerator, QualityReport, QualityMetrics, ImprovementSuggestion } from '../quality-report-generator';
import { QualityCheckResult, QualityIssue, QualityIssueType } from '../quality-assurance-controller';

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

describe('QualityReportGenerator', () => {
  let generator: QualityReportGenerator;
  let mockQualityResult: QualityCheckResult;

  beforeEach(async () => {
    generator = new QualityReportGenerator();
    
    // モックデータの準備
    mockQualityResult = {
      passed: false,
      issues: [
        {
          id: 'test-issue-1',
          type: QualityIssueType.MISSING_METHOD,
          severity: 'high',
          component: 'TestComponent',
          description: 'テスト用の問題',
          detectedAt: new Date(),
          autoFixable: true,
          fixApplied: false
        },
        {
          id: 'test-issue-2',
          type: QualityIssueType.PERFORMANCE_DEGRADATION,
          severity: 'medium',
          component: 'PerformanceComponent',
          description: 'パフォーマンス問題',
          detectedAt: new Date(),
          autoFixable: false,
          fixApplied: false
        }
      ],
      summary: {
        total: 2,
        critical: 0,
        high: 1,
        medium: 1,
        low: 0,
        autoFixed: 0
      },
      recommendations: ['テスト推奨事項']
    };

    // fsモックのリセット
    vi.clearAllMocks();
    (fs.mkdir as any).mockResolvedValue(undefined);
    (fs.writeFile as any).mockResolvedValue(undefined);
    (fs.readdir as any).mockResolvedValue([]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('初期化', () => {
    it('正常に初期化できる', async () => {
      await expect(generator.initialize()).resolves.not.toThrow();
      
      expect(fs.mkdir).toHaveBeenCalledWith('.kiro/reports/quality', { recursive: true });
      expect(fs.mkdir).toHaveBeenCalledWith(join('.kiro/reports/quality', 'charts'), { recursive: true });
      expect(fs.mkdir).toHaveBeenCalledWith(join('.kiro/reports/quality', 'trends'), { recursive: true });
    });

    it('ディレクトリ作成エラーを適切に処理する', async () => {
      (fs.mkdir as any).mockRejectedValue(new Error('Permission denied'));

      await expect(generator.initialize()).rejects.toThrow('Permission denied');
    });
  });

  describe('包括的レポート生成', () => {
    beforeEach(async () => {
      await generator.initialize();
    });

    it('基本的なレポートを生成できる', async () => {
      const report = await generator.generateComprehensiveReport(mockQualityResult);

      expect(report).toBeDefined();
      expect(report.id).toMatch(/^quality-report-\d+$/);
      expect(report.generatedAt).toBeInstanceOf(Date);
      expect(report.summary.totalIssues).toBe(2);
      expect(report.summary.criticalIssues).toBe(0);
      expect(report.issues).toHaveLength(2);
      expect(report.metrics).toBeDefined();
      expect(report.improvements).toBeDefined();
    });

    it('設定に基づいてレポートをカスタマイズできる', async () => {
      const config = {
        includeTrends: false,
        includeCharts: false,
        includeRecommendations: false,
        periodDays: 7,
        format: 'json' as const
      };

      const report = await generator.generateComprehensiveReport(mockQualityResult, config);

      expect(report.trends).toHaveLength(0);
      expect(report.recommendations).toHaveLength(0);
      expect(report.period.from.getTime()).toBeLessThan(report.period.to.getTime());
    });

    it('品質メトリクスを正しく計算する', async () => {
      const report = await generator.generateComprehensiveReport(mockQualityResult);

      expect(report.metrics.overallScore).toBeGreaterThanOrEqual(0);
      expect(report.metrics.overallScore).toBeLessThanOrEqual(100);
      expect(report.metrics.categories.reliability).toBeGreaterThanOrEqual(0);
      expect(report.metrics.categories.performance).toBeGreaterThanOrEqual(0);
      expect(report.metrics.categories.maintainability).toBeGreaterThanOrEqual(0);
      expect(report.metrics.categories.security).toBeGreaterThanOrEqual(0);
    });

    it('改善提案を生成する', async () => {
      const report = await generator.generateComprehensiveReport(mockQualityResult);

      expect(report.improvements).toBeDefined();
      expect(Array.isArray(report.improvements)).toBe(true);
      
      if (report.improvements.length > 0) {
        const improvement = report.improvements[0];
        expect(improvement.id).toBeDefined();
        expect(improvement.priority).toMatch(/^(high|medium|low)$/);
        expect(improvement.title).toBeDefined();
        expect(improvement.description).toBeDefined();
        expect(Array.isArray(improvement.implementation)).toBe(true);
      }
    });

    it('チャートデータを生成する', async () => {
      const report = await generator.generateComprehensiveReport(mockQualityResult, {
        includeCharts: true
      });

      expect(report.charts).toBeDefined();
      expect(report.charts.scoreHistory).toBeDefined();
      expect(report.charts.issueDistribution).toBeDefined();
      expect(report.charts.categoryBreakdown).toBeDefined();

      // チャートデータの構造確認
      const chart = report.charts.scoreHistory;
      expect(chart.type).toBeDefined();
      expect(chart.title).toBeDefined();
      expect(Array.isArray(chart.labels)).toBe(true);
      expect(Array.isArray(chart.datasets)).toBe(true);
    });
  });

  describe('品質メトリクス計算', () => {
    beforeEach(async () => {
      await generator.initialize();
    });

    it('重大な問題がある場合のスコア計算', async () => {
      const criticalResult: QualityCheckResult = {
        ...mockQualityResult,
        summary: {
          total: 1,
          critical: 1,
          high: 0,
          medium: 0,
          low: 0,
          autoFixed: 0
        }
      };

      const report = await generator.generateComprehensiveReport(criticalResult);
      
      // 重大な問題があるとスコアが大幅に下がる
      expect(report.metrics.overallScore).toBeLessThan(90);
    });

    it('問題がない場合の高スコア', async () => {
      const perfectResult: QualityCheckResult = {
        passed: true,
        issues: [],
        summary: {
          total: 0,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          autoFixed: 0
        },
        recommendations: []
      };

      const report = await generator.generateComprehensiveReport(perfectResult);
      
      expect(report.metrics.overallScore).toBe(100);
      expect(report.metrics.deploymentReadiness).toBe(true);
    });

    it('デプロイ準備状況を正しく判定する', async () => {
      // 重大な問題がある場合
      const criticalResult: QualityCheckResult = {
        ...mockQualityResult,
        summary: { ...mockQualityResult.summary, critical: 1 }
      };

      const criticalReport = await generator.generateComprehensiveReport(criticalResult);
      expect(criticalReport.metrics.deploymentReadiness).toBe(false);

      // 問題がない場合
      const cleanResult: QualityCheckResult = {
        ...mockQualityResult,
        summary: { ...mockQualityResult.summary, critical: 0, high: 0 }
      };

      const cleanReport = await generator.generateComprehensiveReport(cleanResult);
      expect(cleanReport.metrics.deploymentReadiness).toBe(true);
    });
  });

  describe('改善提案生成', () => {
    beforeEach(async () => {
      await generator.initialize();
    });

    it('重大な問題に対する提案を生成する', async () => {
      const criticalResult: QualityCheckResult = {
        ...mockQualityResult,
        issues: [{
          id: 'critical-issue',
          type: QualityIssueType.INITIALIZATION_ERROR,
          severity: 'critical',
          component: 'CriticalComponent',
          description: '重大な初期化エラー',
          detectedAt: new Date(),
          autoFixable: false,
          fixApplied: false
        }],
        summary: { ...mockQualityResult.summary, critical: 1 }
      };

      const report = await generator.generateComprehensiveReport(criticalResult);
      
      const criticalSuggestion = report.improvements.find(i => i.priority === 'high');
      expect(criticalSuggestion).toBeDefined();
      expect(criticalSuggestion?.title).toContain('重大');
    });

    it('パフォーマンス問題に対する提案を生成する', async () => {
      const performanceResult: QualityCheckResult = {
        ...mockQualityResult,
        issues: [{
          id: 'performance-issue',
          type: QualityIssueType.PERFORMANCE_DEGRADATION,
          severity: 'medium',
          component: 'PerformanceComponent',
          description: 'パフォーマンス劣化',
          detectedAt: new Date(),
          autoFixable: true,
          fixApplied: false
        }]
      };

      const report = await generator.generateComprehensiveReport(performanceResult);
      
      const performanceSuggestion = report.improvements.find(i => 
        i.category === 'performance' || i.title.includes('パフォーマンス')
      );
      expect(performanceSuggestion).toBeDefined();
    });

    it('自動修正可能な問題に対する提案を生成する', async () => {
      const autoFixableResult: QualityCheckResult = {
        ...mockQualityResult,
        issues: [{
          id: 'auto-fixable-issue',
          type: QualityIssueType.MISSING_METHOD,
          severity: 'medium',
          component: 'TestComponent',
          description: '自動修正可能な問題',
          detectedAt: new Date(),
          autoFixable: true,
          fixApplied: false
        }]
      };

      const report = await generator.generateComprehensiveReport(autoFixableResult);
      
      const autoFixSuggestion = report.improvements.find(i => 
        i.title.includes('自動修正') || i.category === 'automation'
      );
      expect(autoFixSuggestion).toBeDefined();
    });
  });

  describe('レポート保存', () => {
    beforeEach(async () => {
      await generator.initialize();
    });

    it('JSONフォーマットでレポートを保存する', async () => {
      const report = await generator.generateComprehensiveReport(mockQualityResult, {
        format: 'json'
      });

      expect(fs.writeFile).toHaveBeenCalled();
      
      const writeCall = (fs.writeFile as any).mock.calls.find((call: any) => 
        call[0].includes('quality-report-') && call[0].endsWith('.json')
      );
      expect(writeCall).toBeDefined();
      
      // JSON形式で保存されることを確認
      const savedContent = writeCall[1];
      expect(() => JSON.parse(savedContent)).not.toThrow();
    });

    it('Markdownフォーマットでレポートを保存する', async () => {
      const report = await generator.generateComprehensiveReport(mockQualityResult, {
        format: 'markdown'
      });

      const writeCall = (fs.writeFile as any).mock.calls.find((call: any) => 
        call[0].includes('quality-report-') && call[0].endsWith('.md')
      );
      expect(writeCall).toBeDefined();
      
      // Markdown形式の内容確認
      const savedContent = writeCall[1];
      expect(savedContent).toContain('# 品質レポート');
      expect(savedContent).toContain('## 📊 サマリー');
    });

    it('HTMLフォーマットでレポートを保存する', async () => {
      const report = await generator.generateComprehensiveReport(mockQualityResult, {
        format: 'html'
      });

      const writeCall = (fs.writeFile as any).mock.calls.find((call: any) => 
        call[0].includes('quality-report-') && call[0].endsWith('.html')
      );
      expect(writeCall).toBeDefined();
      
      // HTML形式の内容確認
      const savedContent = writeCall[1];
      expect(savedContent).toContain('<!DOCTYPE html>');
      expect(savedContent).toContain('<title>品質レポート');
    });
  });

  describe('トレンド分析', () => {
    beforeEach(async () => {
      await generator.initialize();
      
      // 過去のレポートファイルをモック
      (fs.readdir as any).mockResolvedValue([
        'quality-check-2024-01-01.json',
        'quality-check-2024-01-02.json',
        'other-file.txt'
      ]);

      (fs.stat as any).mockImplementation((path: string) => ({
        mtime: new Date('2024-01-01')
      }));

      (fs.readFile as any).mockImplementation((path: string) => {
        if (path.includes('quality-check-')) {
          return JSON.stringify({
            timestamp: '2024-01-01T00:00:00.000Z',
            result: {
              issues: [{ severity: 'medium' }],
              summary: { critical: 0, high: 0, medium: 1, low: 0 }
            }
          });
        }
        return '{}';
      });
    });

    it('過去のレポートからトレンドを分析する', async () => {
      const report = await generator.generateComprehensiveReport(mockQualityResult, {
        includeTrends: true,
        periodDays: 30
      });

      expect(report.trends).toBeDefined();
      expect(Array.isArray(report.trends)).toBe(true);
      
      if (report.trends.length > 0) {
        const trend = report.trends[0];
        expect(trend.date).toBeDefined();
        expect(typeof trend.score).toBe('number');
        expect(typeof trend.issues).toBe('number');
        expect(typeof trend.fixes).toBe('number');
      }
    });

    it('データが不足している場合は模擬データを生成する', async () => {
      (fs.readdir as any).mockResolvedValue([]);

      const report = await generator.generateComprehensiveReport(mockQualityResult, {
        includeTrends: true,
        periodDays: 7
      });

      expect(report.trends.length).toBeGreaterThan(0);
      expect(report.summary.trend).toMatch(/^(improving|stable|declining)$/);
    });
  });

  describe('レポート管理', () => {
    beforeEach(async () => {
      await generator.initialize();
    });

    it('レポート一覧を取得できる', async () => {
      (fs.readdir as any).mockResolvedValue([
        'quality-report-2024-01-01.json',
        'quality-report-2024-01-02.json',
        'other-file.txt'
      ]);

      const reports = await generator.listReports(5);
      
      expect(reports).toHaveLength(2);
      expect(reports[0]).toContain('quality-report-');
      expect(reports[0]).toContain('.json');
    });

    it('レポートを読み込める', async () => {
      const mockReport = {
        id: 'test-report',
        generatedAt: new Date().toISOString(),
        summary: { overallScore: 85 }
      };

      (fs.readFile as any).mockResolvedValue(JSON.stringify(mockReport));

      const report = await generator.loadReport('test-path.json');
      
      expect(report).toBeDefined();
      expect(report?.id).toBe('test-report');
      expect(report?.summary.overallScore).toBe(85);
    });

    it('レポートを削除できる', async () => {
      (fs.unlink as any).mockResolvedValue(undefined);

      const result = await generator.deleteReport('test-path.json');
      
      expect(result).toBe(true);
      expect(fs.unlink).toHaveBeenCalledWith('test-path.json');
    });

    it('存在しないレポートの読み込みエラーを処理する', async () => {
      (fs.readFile as any).mockRejectedValue(new Error('File not found'));

      const report = await generator.loadReport('non-existent.json');
      
      expect(report).toBeNull();
    });

    it('レポート削除エラーを処理する', async () => {
      (fs.unlink as any).mockRejectedValue(new Error('Permission denied'));

      const result = await generator.deleteReport('test-path.json');
      
      expect(result).toBe(false);
    });
  });

  describe('エラーハンドリング', () => {
    it('初期化されていない状態でのレポート生成', async () => {
      const newGenerator = new QualityReportGenerator();
      
      // 初期化が自動的に実行されることを確認
      await expect(newGenerator.generateComprehensiveReport(mockQualityResult))
        .resolves.toBeDefined();
    });

    it('ファイルシステムエラーの処理', async () => {
      await generator.initialize();
      
      (fs.writeFile as any).mockRejectedValue(new Error('Disk full'));

      // エラーが発生してもレポート生成は完了する
      await expect(generator.generateComprehensiveReport(mockQualityResult))
        .resolves.toBeDefined();
    });

    it('不正なデータでの処理', async () => {
      await generator.initialize();

      const invalidResult = {
        ...mockQualityResult,
        issues: null as any,
        summary: null as any
      };

      // 不正なデータでもエラーを投げずに処理する
      await expect(generator.generateComprehensiveReport(invalidResult))
        .resolves.toBeDefined();
    });
  });

  describe('パフォーマンス', () => {
    it('大量の問題データを効率的に処理する', async () => {
      await generator.initialize();

      // 大量の問題データを生成
      const manyIssues: QualityIssue[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `issue-${i}`,
        type: QualityIssueType.MISSING_METHOD,
        severity: i % 4 === 0 ? 'critical' : i % 3 === 0 ? 'high' : i % 2 === 0 ? 'medium' : 'low',
        component: `Component${i}`,
        description: `問題 ${i}`,
        detectedAt: new Date(),
        autoFixable: i % 2 === 0,
        fixApplied: false
      }));

      const largeResult: QualityCheckResult = {
        ...mockQualityResult,
        issues: manyIssues,
        summary: {
          total: 1000,
          critical: 250,
          high: 250,
          medium: 250,
          low: 250,
          autoFixed: 0
        }
      };

      const startTime = Date.now();
      const report = await generator.generateComprehensiveReport(largeResult);
      const endTime = Date.now();

      expect(report).toBeDefined();
      expect(report.issues).toHaveLength(1000);
      
      // 処理時間が合理的な範囲内であることを確認（10秒以内）
      expect(endTime - startTime).toBeLessThan(10000);
    });
  });
});