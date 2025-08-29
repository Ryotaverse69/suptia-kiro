/**
 * Trust承認ポリシーメトリクス収集システム
 * 
 * 自動承認率、判定処理時間、Trustダイアログ表示頻度などの
 * 運用メトリクスを収集・分析する機能を提供します。
 */

import { promises as fs } from 'fs';
import { join } from 'path';

/**
 * メトリクスデータの型定義
 */
export interface TrustMetrics {
  timestamp: string;
  operationType: string;
  command: string;
  args: string[];
  decision: 'auto' | 'manual';
  processingTime: number; // ミリ秒
  userId?: string;
  context?: Record<string, any>;
}

/**
 * 集計メトリクスの型定義
 */
export interface AggregatedMetrics {
  period: {
    start: string;
    end: string;
  };
  totalOperations: number;
  autoApprovedOperations: number;
  manualApprovedOperations: number;
  autoApprovalRate: number; // パーセンテージ
  averageProcessingTime: number; // ミリ秒
  maxProcessingTime: number; // ミリ秒
  trustDialogDisplayCount: number;
  operationsByType: Record<string, number>;
  performanceMetrics: {
    fastOperations: number; // <50ms
    normalOperations: number; // 50-100ms
    slowOperations: number; // >100ms
  };
}

/**
 * メトリクス収集設定
 */
export interface MetricsConfig {
  enabled: boolean;
  retentionDays: number;
  aggregationInterval: number; // 分
  performanceThresholds: {
    fast: number; // ms
    normal: number; // ms
  };
}

/**
 * メトリクス収集システム
 */
export class MetricsCollector {
  private config: MetricsConfig;
  private metricsDir: string;
  private currentMetrics: TrustMetrics[] = [];

  constructor(config?: Partial<MetricsConfig>) {
    this.config = {
      enabled: true,
      retentionDays: 30,
      aggregationInterval: 60, // 1時間
      performanceThresholds: {
        fast: 50,
        normal: 100
      },
      ...config
    };
    
    this.metricsDir = '.kiro/reports/metrics';
  }

  /**
   * メトリクスディレクトリの初期化
   */
  async initialize(): Promise<void> {
    if (!this.config.enabled) return;

    try {
      await fs.mkdir(this.metricsDir, { recursive: true });
    } catch (error) {
      console.warn('メトリクスディレクトリの作成に失敗しました:', error);
    }
  }

  /**
   * 操作メトリクスを記録
   */
  async recordOperation(metrics: Omit<TrustMetrics, 'timestamp'>): Promise<void> {
    if (!this.config.enabled) return;

    const fullMetrics: TrustMetrics = {
      ...metrics,
      timestamp: new Date().toISOString()
    };

    // メモリ内キャッシュに追加
    this.currentMetrics.push(fullMetrics);

    // ファイルに即座に記録（パフォーマンス重視の場合はバッファリング可能）
    await this.writeMetricsToFile(fullMetrics);

    // 古いメトリクスのクリーンアップ（メモリ使用量制御）
    if (this.currentMetrics.length > 1000) {
      this.currentMetrics = this.currentMetrics.slice(-500);
    }
  }

  /**
   * メトリクスをファイルに書き込み
   */
  private async writeMetricsToFile(metrics: TrustMetrics): Promise<void> {
    try {
      const date = new Date().toISOString().split('T')[0];
      const filePath = join(this.metricsDir, `trust-metrics-${date}.jsonl`);
      
      const line = JSON.stringify(metrics) + '\n';
      await fs.appendFile(filePath, line, 'utf-8');
    } catch (error) {
      console.warn('メトリクスファイルの書き込みに失敗しました:', error);
    }
  }

  /**
   * 指定期間のメトリクスを読み込み
   */
  async loadMetrics(startDate: Date, endDate: Date): Promise<TrustMetrics[]> {
    const metrics: TrustMetrics[] = [];
    
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const filePath = join(this.metricsDir, `trust-metrics-${dateStr}.jsonl`);
      
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const lines = content.trim().split('\n').filter(line => line);
        
        for (const line of lines) {
          try {
            const metric = JSON.parse(line) as TrustMetrics;
            const metricDate = new Date(metric.timestamp);
            
            if (metricDate >= startDate && metricDate <= endDate) {
              metrics.push(metric);
            }
          } catch (parseError) {
            console.warn('メトリクス行の解析に失敗しました:', parseError);
          }
        }
      } catch (error) {
        // ファイルが存在しない場合はスキップ
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return metrics.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }

  /**
   * メトリクスを集計
   */
  async aggregateMetrics(startDate: Date, endDate: Date): Promise<AggregatedMetrics> {
    const metrics = await this.loadMetrics(startDate, endDate);
    
    if (metrics.length === 0) {
      return this.createEmptyAggregation(startDate, endDate);
    }

    const autoApproved = metrics.filter(m => m.decision === 'auto');
    const manualApproved = metrics.filter(m => m.decision === 'manual');
    
    const processingTimes = metrics.map(m => m.processingTime).filter(t => t > 0);
    const averageProcessingTime = processingTimes.length > 0 
      ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length 
      : 0;
    
    const maxProcessingTime = processingTimes.length > 0 
      ? Math.max(...processingTimes) 
      : 0;

    // 操作タイプ別の集計
    const operationsByType: Record<string, number> = {};
    metrics.forEach(m => {
      operationsByType[m.operationType] = (operationsByType[m.operationType] || 0) + 1;
    });

    // パフォーマンス分析
    const fastOperations = processingTimes.filter(t => t < this.config.performanceThresholds.fast).length;
    const normalOperations = processingTimes.filter(t => 
      t >= this.config.performanceThresholds.fast && t < this.config.performanceThresholds.normal
    ).length;
    const slowOperations = processingTimes.filter(t => t >= this.config.performanceThresholds.normal).length;

    return {
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      totalOperations: metrics.length,
      autoApprovedOperations: autoApproved.length,
      manualApprovedOperations: manualApproved.length,
      autoApprovalRate: metrics.length > 0 ? (autoApproved.length / metrics.length) * 100 : 0,
      averageProcessingTime,
      maxProcessingTime,
      trustDialogDisplayCount: manualApproved.length,
      operationsByType,
      performanceMetrics: {
        fastOperations,
        normalOperations,
        slowOperations
      }
    };
  }

  /**
   * 空の集計データを作成
   */
  private createEmptyAggregation(startDate: Date, endDate: Date): AggregatedMetrics {
    return {
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      totalOperations: 0,
      autoApprovedOperations: 0,
      manualApprovedOperations: 0,
      autoApprovalRate: 0,
      averageProcessingTime: 0,
      maxProcessingTime: 0,
      trustDialogDisplayCount: 0,
      operationsByType: {},
      performanceMetrics: {
        fastOperations: 0,
        normalOperations: 0,
        slowOperations: 0
      }
    };
  }

  /**
   * 日次メトリクスレポートを生成
   */
  async generateDailyReport(date: Date = new Date()): Promise<string> {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const metrics = await this.aggregateMetrics(startDate, endDate);
    
    const report = [
      `# Trust承認ポリシー 日次メトリクスレポート`,
      ``,
      `**日付**: ${date.toISOString().split('T')[0]}`,
      `**生成日時**: ${new Date().toISOString()}`,
      ``,
      `## 概要`,
      ``,
      `- **総操作数**: ${metrics.totalOperations}`,
      `- **自動承認**: ${metrics.autoApprovedOperations} (${metrics.autoApprovalRate.toFixed(1)}%)`,
      `- **手動承認**: ${metrics.manualApprovedOperations} (${(100 - metrics.autoApprovalRate).toFixed(1)}%)`,
      `- **Trustダイアログ表示回数**: ${metrics.trustDialogDisplayCount}`,
      ``,
      `## パフォーマンス`,
      ``,
      `- **平均処理時間**: ${metrics.averageProcessingTime.toFixed(1)}ms`,
      `- **最大処理時間**: ${metrics.maxProcessingTime}ms`,
      `- **高速処理** (<${this.config.performanceThresholds.fast}ms): ${metrics.performanceMetrics.fastOperations}`,
      `- **通常処理** (${this.config.performanceThresholds.fast}-${this.config.performanceThresholds.normal}ms): ${metrics.performanceMetrics.normalOperations}`,
      `- **低速処理** (>${this.config.performanceThresholds.normal}ms): ${metrics.performanceMetrics.slowOperations}`,
      ``,
      `## 操作タイプ別統計`,
      ``,
      ...Object.entries(metrics.operationsByType)
        .sort(([,a], [,b]) => b - a)
        .map(([type, count]) => `- **${type}**: ${count}`),
      ``,
      `## 目標達成状況`,
      ``,
      `- **自動承認率目標** (95%以上): ${metrics.autoApprovalRate >= 95 ? '✅ 達成' : '❌ 未達成'} (${metrics.autoApprovalRate.toFixed(1)}%)`,
      `- **処理時間目標** (100ms以内): ${metrics.averageProcessingTime <= 100 ? '✅ 達成' : '❌ 未達成'} (${metrics.averageProcessingTime.toFixed(1)}ms)`,
      ``,
      metrics.autoApprovalRate < 95 ? [
        `## 改善提案`,
        ``,
        `自動承認率が目標の95%を下回っています。以下を確認してください：`,
        ``,
        `1. 手動承認が発生している操作の確認`,
        `2. 自動承認対象への追加検討`,
        `3. ポリシー設定の見直し`,
        ``
      ].join('\n') : '',
      metrics.averageProcessingTime > 100 ? [
        `## パフォーマンス改善提案`,
        ``,
        `処理時間が目標の100msを超えています。以下を確認してください：`,
        ``,
        `1. キャッシュの最適化`,
        `2. 判定ロジックの簡素化`,
        `3. システムリソースの確認`,
        ``
      ].join('\n') : '',
      `---`,
      ``,
      `*このレポートは自動生成されました*`
    ].filter(line => line !== '').join('\n');

    // レポートファイルに保存
    const reportPath = join(this.metricsDir, `daily-report-${date.toISOString().split('T')[0]}.md`);
    await fs.writeFile(reportPath, report, 'utf-8');

    return report;
  }

  /**
   * 週次メトリクスレポートを生成
   */
  async generateWeeklyReport(endDate: Date = new Date()): Promise<string> {
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);
    
    const adjustedEndDate = new Date(endDate);
    adjustedEndDate.setHours(23, 59, 59, 999);

    const metrics = await this.aggregateMetrics(startDate, adjustedEndDate);
    
    // 日別の詳細データも取得
    const dailyMetrics: AggregatedMetrics[] = [];
    for (let i = 0; i < 7; i++) {
      const dayStart = new Date(startDate);
      dayStart.setDate(dayStart.getDate() + i);
      dayStart.setHours(0, 0, 0, 0);
      
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);
      
      const dayMetrics = await this.aggregateMetrics(dayStart, dayEnd);
      dailyMetrics.push(dayMetrics);
    }

    const report = [
      `# Trust承認ポリシー 週次メトリクスレポート`,
      ``,
      `**期間**: ${startDate.toISOString().split('T')[0]} ～ ${endDate.toISOString().split('T')[0]}`,
      `**生成日時**: ${new Date().toISOString()}`,
      ``,
      `## 週間概要`,
      ``,
      `- **総操作数**: ${metrics.totalOperations}`,
      `- **自動承認**: ${metrics.autoApprovedOperations} (${metrics.autoApprovalRate.toFixed(1)}%)`,
      `- **手動承認**: ${metrics.manualApprovedOperations} (${(100 - metrics.autoApprovalRate).toFixed(1)}%)`,
      `- **1日平均操作数**: ${Math.round(metrics.totalOperations / 7)}`,
      `- **平均処理時間**: ${metrics.averageProcessingTime.toFixed(1)}ms`,
      ``,
      `## 日別推移`,
      ``,
      `| 日付 | 操作数 | 自動承認率 | 平均処理時間 |`,
      `|------|--------|------------|--------------|`,
      ...dailyMetrics.map((day, index) => {
        const date = new Date(startDate);
        date.setDate(date.getDate() + index);
        return `| ${date.toISOString().split('T')[0]} | ${day.totalOperations} | ${day.autoApprovalRate.toFixed(1)}% | ${day.averageProcessingTime.toFixed(1)}ms |`;
      }),
      ``,
      `## トレンド分析`,
      ``,
      this.generateTrendAnalysis(dailyMetrics),
      ``,
      `## 推奨アクション`,
      ``,
      this.generateRecommendations(metrics, dailyMetrics),
      ``,
      `---`,
      ``,
      `*このレポートは自動生成されました*`
    ].join('\n');

    // レポートファイルに保存
    const reportPath = join(this.metricsDir, `weekly-report-${endDate.toISOString().split('T')[0]}.md`);
    await fs.writeFile(reportPath, report, 'utf-8');

    return report;
  }

  /**
   * トレンド分析を生成
   */
  private generateTrendAnalysis(dailyMetrics: AggregatedMetrics[]): string {
    const validDays = dailyMetrics.filter(day => day.totalOperations > 0);
    
    if (validDays.length < 2) {
      return '十分なデータがありません。';
    }

    const approvalRates = validDays.map(day => day.autoApprovalRate);
    const processingTimes = validDays.map(day => day.averageProcessingTime);
    
    const approvalTrend = this.calculateTrend(approvalRates);
    const performanceTrend = this.calculateTrend(processingTimes);

    return [
      `- **自動承認率**: ${approvalTrend > 0 ? '📈 上昇傾向' : approvalTrend < 0 ? '📉 下降傾向' : '➡️ 横ばい'}`,
      `- **処理時間**: ${performanceTrend > 0 ? '📈 増加傾向' : performanceTrend < 0 ? '📉 改善傾向' : '➡️ 横ばい'}`
    ].join('\n');
  }

  /**
   * 推奨アクションを生成
   */
  private generateRecommendations(weeklyMetrics: AggregatedMetrics, dailyMetrics: AggregatedMetrics[]): string {
    const recommendations: string[] = [];

    // 自動承認率の確認
    if (weeklyMetrics.autoApprovalRate < 95) {
      recommendations.push('🔧 自動承認率が目標を下回っています。ポリシー設定の見直しを検討してください。');
    }

    // パフォーマンスの確認
    if (weeklyMetrics.averageProcessingTime > 100) {
      recommendations.push('⚡ 処理時間が目標を超えています。システムの最適化を検討してください。');
    }

    // 操作数の変動確認
    const operationCounts = dailyMetrics.map(day => day.totalOperations);
    const maxOperations = Math.max(...operationCounts);
    const minOperations = Math.min(...operationCounts.filter(count => count > 0));
    
    if (maxOperations > minOperations * 3) {
      recommendations.push('📊 操作数に大きな変動があります。作業パターンの分析を推奨します。');
    }

    // Trustダイアログの頻度確認
    if (weeklyMetrics.trustDialogDisplayCount > weeklyMetrics.totalOperations * 0.1) {
      recommendations.push('🚨 Trustダイアログの表示頻度が高めです。自動承認対象の拡大を検討してください。');
    }

    return recommendations.length > 0 
      ? recommendations.map(rec => `- ${rec}`).join('\n')
      : '- ✅ 現在の設定は適切に機能しています。';
  }

  /**
   * 数値配列のトレンドを計算（簡易線形回帰）
   */
  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;

    const n = values.length;
    const sumX = (n * (n - 1)) / 2; // 0 + 1 + 2 + ... + (n-1)
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, index) => sum + (index * val), 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6; // 0² + 1² + 2² + ... + (n-1)²

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
  }

  /**
   * 古いメトリクスファイルをクリーンアップ
   */
  async cleanupOldMetrics(): Promise<void> {
    if (!this.config.enabled) return;

    try {
      const files = await fs.readdir(this.metricsDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

      for (const file of files) {
        if (file.startsWith('trust-metrics-') && file.endsWith('.jsonl')) {
          const dateMatch = file.match(/trust-metrics-(\d{4}-\d{2}-\d{2})\.jsonl/);
          if (dateMatch) {
            const fileDate = new Date(dateMatch[1]);
            if (fileDate < cutoffDate) {
              await fs.unlink(join(this.metricsDir, file));
              console.log(`古いメトリクスファイルを削除しました: ${file}`);
            }
          }
        }
      }
    } catch (error) {
      console.warn('メトリクスファイルのクリーンアップに失敗しました:', error);
    }
  }

  /**
   * リアルタイム監視用のメトリクス取得
   */
  async getCurrentMetrics(): Promise<{
    todayOperations: number;
    todayAutoApprovalRate: number;
    recentAverageProcessingTime: number;
    alertsCount: number;
  }> {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    const todayMetrics = await this.aggregateMetrics(startOfDay, today);
    
    // 直近の処理時間（メモリ内キャッシュから）
    const recentMetrics = this.currentMetrics.slice(-10);
    const recentProcessingTimes = recentMetrics.map(m => m.processingTime).filter(t => t > 0);
    const recentAverageProcessingTime = recentProcessingTimes.length > 0
      ? recentProcessingTimes.reduce((sum, time) => sum + time, 0) / recentProcessingTimes.length
      : 0;

    // アラート条件のチェック
    let alertsCount = 0;
    if (todayMetrics.autoApprovalRate < 95) alertsCount++;
    if (recentAverageProcessingTime > 100) alertsCount++;
    if (todayMetrics.trustDialogDisplayCount > 20) alertsCount++;

    return {
      todayOperations: todayMetrics.totalOperations,
      todayAutoApprovalRate: todayMetrics.autoApprovalRate,
      recentAverageProcessingTime,
      alertsCount
    };
  }
}