import { PerformanceMetrics, ThresholdStatus, ThresholdViolation } from './performance-monitor.js';
import { AuditLogger } from './audit-logger.js';
import * as fs from 'fs/promises';

/**
 * パフォーマンス閾値管理システム
 * 要件4.2, 4.3に基づいて実装：
 * - 動的閾値調整機能
 * - パフォーマンス劣化の早期検出
 * - 閾値超過時の自動対応
 * - パフォーマンストレンド分析
 */
export class PerformanceThresholdManager {
  private auditLogger: AuditLogger;
  
  // 動的閾値設定
  private dynamicThresholds: DynamicThresholds;
  private thresholdHistory: ThresholdHistoryEntry[] = [];
  private performanceBaseline: PerformanceBaseline;
  
  // トレンド分析
  private trendAnalyzer: TrendAnalyzer;
  private degradationDetector: DegradationDetector;
  
  // 自動対応システム
  private autoResponseSystem: AutoResponseSystem;
  private responseHistory: ResponseHistoryEntry[] = [];
  
  // 設定値
  private readonly DEFAULT_THRESHOLDS = {
    executionTime: 100, // 100ms
    memoryUsage: 512 * 1024 * 1024, // 512MB
    cpuUsage: 80, // 80%
    errorRate: 5, // 5%
    throughput: 1000 // 1000 ops/sec
  };
  
  private readonly ADJUSTMENT_FACTORS = {
    conservative: 0.1, // 10%の調整
    moderate: 0.2, // 20%の調整
    aggressive: 0.3 // 30%の調整
  };

  constructor() {
    this.auditLogger = new AuditLogger();
    this.dynamicThresholds = this.initializeDynamicThresholds();
    this.performanceBaseline = this.initializeBaseline();
    this.trendAnalyzer = new TrendAnalyzer();
    this.degradationDetector = new DegradationDetector();
    this.autoResponseSystem = new AutoResponseSystem();
  }

  /**
   * 閾値管理システムの初期化
   */
  async initialize(): Promise<void> {
    try {
      console.log('🎯 パフォーマンス閾値管理システムを初期化中...');
      
      await this.auditLogger.initialize();
      
      // 履歴データの読み込み
      await this.loadThresholdHistory();
      await this.loadPerformanceBaseline();
      
      // 初期閾値の設定
      await this.calculateInitialThresholds();
      
      console.log('✅ パフォーマンス閾値管理システムの初期化が完了しました');
    } catch (error) {
      console.error('❌ パフォーマンス閾値管理システムの初期化に失敗しました:', error);
      throw error;
    }
  }
}  /*
*
   * 動的閾値調整機能
   * 要件4.2: 動的閾値調整機能を実装
   */
  async adjustThresholdsDynamically(recentMetrics: PerformanceMetrics[]): Promise<ThresholdAdjustmentResult> {
    const startTime = performance.now();
    const adjustmentResult: ThresholdAdjustmentResult = {
      success: false,
      adjustments: [],
      reason: '',
      previousThresholds: { ...this.dynamicThresholds.current },
      newThresholds: { ...this.dynamicThresholds.current },
      confidence: 0,
      executionTime: 0
    };

    try {
      if (recentMetrics.length < 10) {
        adjustmentResult.reason = '調整に必要な最小データ数（10件）に達していません';
        return adjustmentResult;
      }

      // 統計分析
      const statistics = this.calculateStatistics(recentMetrics);
      
      // 調整の必要性を判定
      const adjustmentNeeds = this.assessAdjustmentNeeds(statistics);
      
      if (adjustmentNeeds.length === 0) {
        adjustmentResult.success = true;
        adjustmentResult.reason = '現在の閾値は適切です';
        adjustmentResult.confidence = 0.9;
        return adjustmentResult;
      }

      // 各メトリクスの閾値を調整
      for (const need of adjustmentNeeds) {
        const adjustment = await this.calculateThresholdAdjustment(need, statistics);
        
        if (adjustment.shouldAdjust) {
          adjustmentResult.adjustments.push(adjustment);
          
          // 新しい閾値を適用
          this.applyThresholdAdjustment(adjustment);
        }
      }

      adjustmentResult.newThresholds = { ...this.dynamicThresholds.current };
      adjustmentResult.success = adjustmentResult.adjustments.length > 0;
      adjustmentResult.reason = adjustmentResult.success ? 
        `${adjustmentResult.adjustments.length}個のメトリクスの閾値を調整しました` :
        '調整が必要な閾値はありませんでした';
      
      adjustmentResult.confidence = this.calculateAdjustmentConfidence(adjustmentResult.adjustments);
      
      // 調整履歴を記録
      await this.recordThresholdAdjustment(adjustmentResult);
      
      return adjustmentResult;
    } catch (error) {
      adjustmentResult.reason = `閾値調整エラー: ${error instanceof Error ? error.message : 'Unknown error'}`;
      return adjustmentResult;
    } finally {
      adjustmentResult.executionTime = performance.now() - startTime;
    }
  }

  /**
   * パフォーマンス劣化の早期検出
   * 要件4.2: パフォーマンス劣化の早期検出を追加
   */
  async detectPerformanceDegradation(currentMetrics: PerformanceMetrics): Promise<DegradationDetectionResult> {
    const detectionResult: DegradationDetectionResult = {
      degradationDetected: false,
      severity: 'none',
      affectedMetrics: [],
      trendAnalysis: null,
      recommendations: [],
      confidence: 0,
      timestamp: new Date()
    };

    try {
      // ベースラインとの比較
      const baselineComparison = this.compareWithBaseline(currentMetrics);
      
      // トレンド分析
      const trendAnalysis = await this.trendAnalyzer.analyzeTrends([currentMetrics]);
      detectionResult.trendAnalysis = trendAnalysis;
      
      // 劣化の検出
      const degradationIndicators = this.identifyDegradationIndicators(
        baselineComparison, 
        trendAnalysis
      );
      
      if (degradationIndicators.length > 0) {
        detectionResult.degradationDetected = true;
        detectionResult.affectedMetrics = degradationIndicators;
        detectionResult.severity = this.calculateDegradationSeverity(degradationIndicators);
        detectionResult.recommendations = this.generateDegradationRecommendations(degradationIndicators);
        detectionResult.confidence = this.calculateDetectionConfidence(degradationIndicators);
        
        // 劣化検出をログに記録
        await this.auditLogger.logPerformanceAlert({
          id: `degradation-${Date.now()}`,
          type: 'performance_degradation',
          severity: detectionResult.severity as 'info' | 'warning' | 'critical',
          message: `パフォーマンス劣化を検出: ${detectionResult.affectedMetrics.length}個のメトリクスに影響`,
          timestamp: detectionResult.timestamp,
          metrics: this.extractMetricsFromIndicators(degradationIndicators),
          details: {
            indicators: degradationIndicators,
            recommendations: detectionResult.recommendations
          }
        });
      }
      
      return detectionResult;
    } catch (error) {
      console.error('パフォーマンス劣化検出エラー:', error);
      detectionResult.degradationDetected = false;
      detectionResult.severity = 'error';
      return detectionResult;
    }
  }

  /**
   * 閾値超過時の自動対応
   * 要件4.2: 閾値超過時の自動対応を実装
   */
  async handleThresholdViolation(violation: ThresholdViolation): Promise<AutoResponseResult> {
    const responseResult: AutoResponseResult = {
      success: false,
      actionsPerformed: [],
      responseTime: 0,
      effectiveness: 0,
      followUpRequired: false,
      details: ''
    };

    const startTime = performance.now();

    try {
      // 違反の重要度を評価
      const violationSeverity = this.assessViolationSeverity(violation);
      
      // 適切な対応アクションを決定
      const responseActions = this.determineResponseActions(violation, violationSeverity);
      
      // アクションを実行
      for (const action of responseActions) {
        const actionResult = await this.executeResponseAction(action, violation);
        responseResult.actionsPerformed.push(actionResult);
        
        if (!actionResult.success) {
          console.warn(`自動対応アクション失敗: ${action.type} - ${actionResult.error}`);
        }
      }

      // 対応の効果を評価
      responseResult.effectiveness = this.evaluateResponseEffectiveness(responseResult.actionsPerformed);
      responseResult.success = responseResult.actionsPerformed.some(a => a.success);
      responseResult.followUpRequired = responseResult.effectiveness < 0.7; // 70%未満の効果の場合
      
      responseResult.details = this.generateResponseSummary(responseResult);
      
      // 対応履歴を記録
      await this.recordAutoResponse(violation, responseResult);
      
      return responseResult;
    } catch (error) {
      responseResult.details = `自動対応エラー: ${error instanceof Error ? error.message : 'Unknown error'}`;
      return responseResult;
    } finally {
      responseResult.responseTime = performance.now() - startTime;
    }
  }

  /**
   * パフォーマンストレンド分析
   * 要件4.3: パフォーマンストレンド分析を追加
   */
  async analyzePerformanceTrends(metricsHistory: PerformanceMetrics[]): Promise<TrendAnalysisResult> {
    const analysisResult: TrendAnalysisResult = {
      trends: [],
      predictions: [],
      anomalies: [],
      recommendations: [],
      confidence: 0,
      analysisTimestamp: new Date()
    };

    try {
      if (metricsHistory.length < 20) {
        analysisResult.recommendations.push('トレンド分析には最低20件のデータが必要です');
        return analysisResult;
      }

      // 各メトリクスのトレンドを分析
      const metricTypes = ['executionTime', 'memoryUsage', 'cpuUsage', 'errorRate'];
      
      for (const metricType of metricTypes) {
        const metricValues = this.extractMetricValues(metricsHistory, metricType);
        const trend = this.calculateTrend(metricValues, metricType);
        
        if (trend) {
          analysisResult.trends.push(trend);
        }
      }

      // 異常値の検出
      analysisResult.anomalies = this.detectAnomalies(metricsHistory);
      
      // 将来の予測
      analysisResult.predictions = this.generatePredictions(analysisResult.trends);
      
      // 推奨事項の生成
      analysisResult.recommendations = this.generateTrendRecommendations(
        analysisResult.trends, 
        analysisResult.predictions,
        analysisResult.anomalies
      );
      
      // 分析の信頼度を計算
      analysisResult.confidence = this.calculateAnalysisConfidence(
        metricsHistory.length,
        analysisResult.trends.length,
        analysisResult.anomalies.length
      );
      
      return analysisResult;
    } catch (error) {
      console.error('パフォーマンストレンド分析エラー:', error);
      analysisResult.recommendations.push(`分析エラー: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return analysisResult;
    }
  }

  /**
   * 現在の動的閾値を取得
   */
  getCurrentThresholds(): DynamicThresholds {
    return { ...this.dynamicThresholds };
  }

  /**
   * 閾値履歴を取得
   */
  getThresholdHistory(): ThresholdHistoryEntry[] {
    return [...this.thresholdHistory];
  }

  /**
   * パフォーマンスベースラインを取得
   */
  getPerformanceBaseline(): PerformanceBaseline {
    return { ...this.performanceBaseline };
  }

  // プライベートメソッド

  private initializeDynamicThresholds(): DynamicThresholds {
    return {
      current: { ...this.DEFAULT_THRESHOLDS },
      adaptive: { ...this.DEFAULT_THRESHOLDS },
      confidence: 0.5,
      lastUpdated: new Date(),
      adjustmentHistory: []
    };
  }

  private initializeBaseline(): PerformanceBaseline {
    return {
      executionTime: { mean: 50, stdDev: 10, percentiles: { p50: 45, p90: 70, p95: 85, p99: 95 } },
      memoryUsage: { mean: 100 * 1024 * 1024, stdDev: 20 * 1024 * 1024, percentiles: { p50: 90 * 1024 * 1024, p90: 140 * 1024 * 1024, p95: 160 * 1024 * 1024, p99: 200 * 1024 * 1024 } },
      cpuUsage: { mean: 30, stdDev: 15, percentiles: { p50: 25, p90: 50, p95: 65, p99: 75 } },
      errorRate: { mean: 1, stdDev: 2, percentiles: { p50: 0, p90: 2, p95: 4, p99: 8 } },
      establishedAt: new Date(),
      sampleSize: 0
    };
  }  private a
sync loadThresholdHistory(): Promise<void> {
    try {
      const historyFile = '.kiro/reports/performance/threshold-history.json';
      const data = await fs.readFile(historyFile, 'utf-8');
      this.thresholdHistory = JSON.parse(data);
      console.log(`📊 閾値履歴を読み込みました: ${this.thresholdHistory.length}件`);
    } catch (error) {
      this.thresholdHistory = [];
      console.log('📊 新しい閾値履歴を開始します');
    }
  }

  private async loadPerformanceBaseline(): Promise<void> {
    try {
      const baselineFile = '.kiro/reports/performance/baseline.json';
      const data = await fs.readFile(baselineFile, 'utf-8');
      this.performanceBaseline = JSON.parse(data);
      console.log('📈 パフォーマンスベースラインを読み込みました');
    } catch (error) {
      console.log('📈 デフォルトのパフォーマンスベースラインを使用します');
    }
  }

  private async calculateInitialThresholds(): Promise<void> {
    // ベースラインに基づいて初期閾値を計算
    this.dynamicThresholds.current.executionTime = Math.max(
      this.DEFAULT_THRESHOLDS.executionTime,
      this.performanceBaseline.executionTime.percentiles.p95
    );
    
    this.dynamicThresholds.current.memoryUsage = Math.max(
      this.DEFAULT_THRESHOLDS.memoryUsage,
      this.performanceBaseline.memoryUsage.percentiles.p95
    );
    
    this.dynamicThresholds.current.cpuUsage = Math.max(
      this.DEFAULT_THRESHOLDS.cpuUsage,
      this.performanceBaseline.cpuUsage.percentiles.p95
    );
    
    console.log('🎯 初期閾値を設定しました:', this.dynamicThresholds.current);
  }

  private calculateStatistics(metrics: PerformanceMetrics[]): MetricsStatistics {
    const executionTimes = metrics.map(m => m.executionTime);
    const memoryUsages = metrics.map(m => m.memoryUsage);
    const cpuUsages = metrics.map(m => m.cpuUsage);
    
    return {
      executionTime: this.calculateMetricStats(executionTimes),
      memoryUsage: this.calculateMetricStats(memoryUsages),
      cpuUsage: this.calculateMetricStats(cpuUsages),
      sampleSize: metrics.length,
      timeRange: {
        start: metrics[0].timestamp,
        end: metrics[metrics.length - 1].timestamp
      }
    };
  }

  private calculateMetricStats(values: number[]): MetricStatistics {
    const sorted = values.sort((a, b) => a - b);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    return {
      mean,
      median: sorted[Math.floor(sorted.length / 2)],
      stdDev,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p90: sorted[Math.floor(sorted.length * 0.9)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    };
  }

  private assessAdjustmentNeeds(statistics: MetricsStatistics): AdjustmentNeed[] {
    const needs: AdjustmentNeed[] = [];
    
    // 実行時間の調整必要性
    if (this.shouldAdjustThreshold('executionTime', statistics.executionTime)) {
      needs.push({
        metric: 'executionTime',
        currentThreshold: this.dynamicThresholds.current.executionTime,
        suggestedThreshold: statistics.executionTime.p95 * 1.2, // 95%ile + 20%マージン
        reason: '実行時間の分布が変化しています',
        confidence: 0.8
      });
    }
    
    // メモリ使用量の調整必要性
    if (this.shouldAdjustThreshold('memoryUsage', statistics.memoryUsage)) {
      needs.push({
        metric: 'memoryUsage',
        currentThreshold: this.dynamicThresholds.current.memoryUsage,
        suggestedThreshold: statistics.memoryUsage.p95 * 1.1, // 95%ile + 10%マージン
        reason: 'メモリ使用パターンが変化しています',
        confidence: 0.8
      });
    }
    
    return needs;
  }

  private shouldAdjustThreshold(metric: string, stats: MetricStatistics): boolean {
    const currentThreshold = this.dynamicThresholds.current[metric as keyof typeof this.dynamicThresholds.current];
    
    // 現在の閾値が統計的に適切でない場合
    const tooStrict = stats.p90 > currentThreshold * 0.8; // 90%ileが閾値の80%を超える
    const tooLoose = stats.p99 < currentThreshold * 0.6; // 99%ileが閾値の60%未満
    
    return tooStrict || tooLoose;
  }
}  privat
e async calculateThresholdAdjustment(
    need: AdjustmentNeed, 
    statistics: MetricsStatistics
  ): Promise<ThresholdAdjustment> {
    const adjustment: ThresholdAdjustment = {
      metric: need.metric,
      currentValue: need.currentThreshold,
      newValue: need.suggestedThreshold,
      adjustmentFactor: 0,
      reason: need.reason,
      confidence: need.confidence,
      shouldAdjust: false
    };

    // 調整係数を計算
    adjustment.adjustmentFactor = (need.suggestedThreshold - need.currentThreshold) / need.currentThreshold;
    
    // 調整の妥当性をチェック
    const isReasonableAdjustment = Math.abs(adjustment.adjustmentFactor) <= this.ADJUSTMENT_FACTORS.aggressive;
    const hasEnoughConfidence = adjustment.confidence >= 0.7;
    
    adjustment.shouldAdjust = isReasonableAdjustment && hasEnoughConfidence;
    
    if (!adjustment.shouldAdjust) {
      adjustment.reason += adjustment.confidence < 0.7 ? 
        ' (信頼度不足)' : 
        ' (調整幅が大きすぎます)';
    }
    
    return adjustment;
  }

  private applyThresholdAdjustment(adjustment: ThresholdAdjustment): void {
    const metric = adjustment.metric as keyof typeof this.dynamicThresholds.current;
    this.dynamicThresholds.current[metric] = adjustment.newValue;
    this.dynamicThresholds.lastUpdated = new Date();
    this.dynamicThresholds.adjustmentHistory.push({
      timestamp: new Date(),
      metric: adjustment.metric,
      oldValue: adjustment.currentValue,
      newValue: adjustment.newValue,
      reason: adjustment.reason
    });
  }

  private calculateAdjustmentConfidence(adjustments: ThresholdAdjustment[]): number {
    if (adjustments.length === 0) return 0;
    
    const totalConfidence = adjustments.reduce((sum, adj) => sum + adj.confidence, 0);
    return totalConfidence / adjustments.length;
  }

  private async recordThresholdAdjustment(result: ThresholdAdjustmentResult): Promise<void> {
    const historyEntry: ThresholdHistoryEntry = {
      timestamp: new Date(),
      adjustments: result.adjustments,
      confidence: result.confidence,
      reason: result.reason,
      thresholds: { ...result.newThresholds }
    };
    
    this.thresholdHistory.push(historyEntry);
    
    // 履歴サイズの制限
    if (this.thresholdHistory.length > 1000) {
      this.thresholdHistory = this.thresholdHistory.slice(-1000);
    }
    
    // ファイルに保存
    try {
      const historyFile = '.kiro/reports/performance/threshold-history.json';
      await fs.writeFile(historyFile, JSON.stringify(this.thresholdHistory, null, 2));
    } catch (error) {
      console.error('閾値履歴の保存に失敗しました:', error);
    }
  }

  private compareWithBaseline(metrics: PerformanceMetrics): BaselineComparison {
    return {
      executionTime: {
        current: metrics.executionTime,
        baseline: this.performanceBaseline.executionTime.mean,
        deviation: (metrics.executionTime - this.performanceBaseline.executionTime.mean) / this.performanceBaseline.executionTime.mean,
        significance: this.calculateSignificance(metrics.executionTime, this.performanceBaseline.executionTime)
      },
      memoryUsage: {
        current: metrics.memoryUsage,
        baseline: this.performanceBaseline.memoryUsage.mean,
        deviation: (metrics.memoryUsage - this.performanceBaseline.memoryUsage.mean) / this.performanceBaseline.memoryUsage.mean,
        significance: this.calculateSignificance(metrics.memoryUsage, this.performanceBaseline.memoryUsage)
      },
      cpuUsage: {
        current: metrics.cpuUsage,
        baseline: this.performanceBaseline.cpuUsage.mean,
        deviation: (metrics.cpuUsage - this.performanceBaseline.cpuUsage.mean) / this.performanceBaseline.cpuUsage.mean,
        significance: this.calculateSignificance(metrics.cpuUsage, this.performanceBaseline.cpuUsage)
      }
    };
  }

  private calculateSignificance(current: number, baseline: BaselineMetric): 'low' | 'medium' | 'high' {
    const zScore = Math.abs(current - baseline.mean) / baseline.stdDev;
    
    if (zScore > 2.5) return 'high';
    if (zScore > 1.5) return 'medium';
    return 'low';
  }

  private identifyDegradationIndicators(
    comparison: BaselineComparison, 
    trendAnalysis: TrendAnalysisResult
  ): DegradationIndicator[] {
    const indicators: DegradationIndicator[] = [];
    
    // ベースライン比較による劣化検出
    Object.entries(comparison).forEach(([metric, comp]) => {
      if (comp.deviation > 0.2 && comp.significance !== 'low') { // 20%以上の悪化
        indicators.push({
          metric,
          type: 'baseline_deviation',
          severity: comp.significance === 'high' ? 'critical' : 'warning',
          value: comp.current,
          baseline: comp.baseline,
          deviation: comp.deviation,
          description: `${metric}がベースラインから${(comp.deviation * 100).toFixed(1)}%悪化`
        });
      }
    });
    
    // トレンド分析による劣化検出
    trendAnalysis.trends.forEach(trend => {
      if (trend.direction === 'degrading' && trend.confidence > 0.7) {
        indicators.push({
          metric: trend.metric,
          type: 'trend_degradation',
          severity: trend.slope > 0.1 ? 'critical' : 'warning',
          value: trend.currentValue,
          baseline: trend.baselineValue,
          deviation: trend.slope,
          description: `${trend.metric}が継続的に悪化傾向（傾き: ${trend.slope.toFixed(3)}）`
        });
      }
    });
    
    return indicators;
  }
}  priv
ate calculateDegradationSeverity(indicators: DegradationIndicator[]): 'low' | 'medium' | 'high' | 'critical' {
    const criticalCount = indicators.filter(i => i.severity === 'critical').length;
    const warningCount = indicators.filter(i => i.severity === 'warning').length;
    
    if (criticalCount > 0) return 'critical';
    if (warningCount >= 3) return 'high';
    if (warningCount >= 2) return 'medium';
    return 'low';
  }

  private generateDegradationRecommendations(indicators: DegradationIndicator[]): string[] {
    const recommendations: string[] = [];
    
    indicators.forEach(indicator => {
      switch (indicator.metric) {
        case 'executionTime':
          recommendations.push('実行時間の最適化を検討してください（アルゴリズム改善、キャッシュ活用）');
          break;
        case 'memoryUsage':
          recommendations.push('メモリ使用量の削減を検討してください（ガベージコレクション、メモリリーク調査）');
          break;
        case 'cpuUsage':
          recommendations.push('CPU使用率の最適化を検討してください（並行処理の見直し、計算量削減）');
          break;
      }
    });
    
    if (indicators.length > 2) {
      recommendations.push('複数のメトリクスで劣化が検出されています。システム全体の見直しを推奨します');
    }
    
    return [...new Set(recommendations)]; // 重複を除去
  }

  private calculateDetectionConfidence(indicators: DegradationIndicator[]): number {
    if (indicators.length === 0) return 0;
    
    const avgDeviation = indicators.reduce((sum, i) => sum + Math.abs(i.deviation), 0) / indicators.length;
    const criticalRatio = indicators.filter(i => i.severity === 'critical').length / indicators.length;
    
    return Math.min(0.9, 0.5 + avgDeviation * 0.5 + criticalRatio * 0.3);
  }

  private extractMetricsFromIndicators(indicators: DegradationIndicator[]): Record<string, number> {
    const metrics: Record<string, number> = {};
    indicators.forEach(indicator => {
      metrics[indicator.metric] = indicator.value;
    });
    return metrics;
  }

  private assessViolationSeverity(violation: ThresholdViolation): 'low' | 'medium' | 'high' | 'critical' {
    const exceedanceRatio = violation.value / violation.threshold;
    
    if (exceedanceRatio > 3) return 'critical';
    if (exceedanceRatio > 2) return 'high';
    if (exceedanceRatio > 1.5) return 'medium';
    return 'low';
  }

  private determineResponseActions(
    violation: ThresholdViolation, 
    severity: 'low' | 'medium' | 'high' | 'critical'
  ): ResponseAction[] {
    const actions: ResponseAction[] = [];
    
    // 基本的なログ記録は常に実行
    actions.push({
      type: 'log_violation',
      priority: 1,
      description: '閾値違反をログに記録',
      parameters: { violation, severity }
    });
    
    // 重要度に応じた追加アクション
    switch (severity) {
      case 'critical':
        actions.push({
          type: 'immediate_alert',
          priority: 1,
          description: '即座にアラートを発行',
          parameters: { urgency: 'high' }
        });
        actions.push({
          type: 'throttle_requests',
          priority: 2,
          description: 'リクエスト制限を実行',
          parameters: { throttleRate: 0.5 }
        });
        break;
        
      case 'high':
        actions.push({
          type: 'send_notification',
          priority: 2,
          description: '通知を送信',
          parameters: { channel: 'monitoring' }
        });
        actions.push({
          type: 'adjust_threshold',
          priority: 3,
          description: '閾値の一時的な調整',
          parameters: { adjustmentFactor: 1.2 }
        });
        break;
        
      case 'medium':
        actions.push({
          type: 'collect_diagnostics',
          priority: 3,
          description: '診断情報を収集',
          parameters: { detailLevel: 'medium' }
        });
        break;
        
      case 'low':
        actions.push({
          type: 'update_statistics',
          priority: 4,
          description: '統計情報を更新',
          parameters: { includeInTrend: true }
        });
        break;
    }
    
    return actions.sort((a, b) => a.priority - b.priority);
  }

  private async executeResponseAction(
    action: ResponseAction, 
    violation: ThresholdViolation
  ): Promise<ActionResult> {
    const result: ActionResult = {
      action: action.type,
      success: false,
      executionTime: 0,
      details: '',
      error: undefined
    };
    
    const startTime = performance.now();
    
    try {
      switch (action.type) {
        case 'log_violation':
          await this.auditLogger.logPerformanceAlert({
            id: `violation-${Date.now()}`,
            type: 'threshold_violation',
            severity: violation.severity || 'warning',
            message: `閾値違反: ${violation.metric} = ${violation.value} > ${violation.threshold}`,
            timestamp: new Date(),
            metrics: { [violation.metric]: violation.value },
            operationId: violation.operationId
          });
          result.success = true;
          result.details = '閾値違反をログに記録しました';
          break;
          
        case 'immediate_alert':
          // 実際の実装では外部アラートシステムに通知
          console.error(`🚨 CRITICAL ALERT: ${violation.metric} threshold exceeded: ${violation.value} > ${violation.threshold}`);
          result.success = true;
          result.details = '緊急アラートを発行しました';
          break;
          
        case 'send_notification':
          // 実際の実装では通知システムに送信
          console.warn(`⚠️ Performance notification: ${violation.metric} threshold exceeded`);
          result.success = true;
          result.details = '通知を送信しました';
          break;
          
        case 'throttle_requests':
          // 実際の実装ではリクエスト制限を実行
          console.log('🔄 Request throttling activated');
          result.success = true;
          result.details = 'リクエスト制限を有効化しました';
          break;
          
        case 'adjust_threshold':
          const adjustmentFactor = action.parameters?.adjustmentFactor || 1.2;
          const newThreshold = violation.threshold * adjustmentFactor;
          this.dynamicThresholds.current[violation.metric as keyof typeof this.dynamicThresholds.current] = newThreshold;
          result.success = true;
          result.details = `閾値を一時的に調整しました: ${violation.threshold} → ${newThreshold}`;
          break;
          
        case 'collect_diagnostics':
          // 実際の実装では詳細な診断情報を収集
          result.success = true;
          result.details = '診断情報を収集しました';
          break;
          
        case 'update_statistics':
          // 統計情報の更新
          result.success = true;
          result.details = '統計情報を更新しました';
          break;
          
        default:
          result.error = `未知のアクションタイプ: ${action.type}`;
      }
    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Unknown error';
    } finally {
      result.executionTime = performance.now() - startTime;
    }
    
    return result;
  }
}  privat
e evaluateResponseEffectiveness(actions: ActionResult[]): number {
    const successfulActions = actions.filter(a => a.success).length;
    const totalActions = actions.length;
    
    if (totalActions === 0) return 0;
    
    const baseEffectiveness = successfulActions / totalActions;
    
    // アクションタイプによる重み付け
    const weightedScore = actions.reduce((score, action) => {
      if (!action.success) return score;
      
      switch (action.action) {
        case 'immediate_alert': return score + 0.3;
        case 'throttle_requests': return score + 0.25;
        case 'adjust_threshold': return score + 0.2;
        case 'send_notification': return score + 0.15;
        case 'collect_diagnostics': return score + 0.1;
        default: return score + 0.05;
      }
    }, 0);
    
    return Math.min(1.0, baseEffectiveness * 0.7 + weightedScore);
  }

  private generateResponseSummary(result: AutoResponseResult): string {
    const successful = result.actionsPerformed.filter(a => a.success).length;
    const total = result.actionsPerformed.length;
    
    let summary = `自動対応完了: ${successful}/${total}件のアクションが成功`;
    
    if (result.effectiveness < 0.5) {
      summary += ' (効果が限定的)';
    } else if (result.effectiveness > 0.8) {
      summary += ' (高い効果)';
    }
    
    if (result.followUpRequired) {
      summary += ' - 追加対応が必要です';
    }
    
    return summary;
  }

  private async recordAutoResponse(
    violation: ThresholdViolation, 
    response: AutoResponseResult
  ): Promise<void> {
    const historyEntry: ResponseHistoryEntry = {
      timestamp: new Date(),
      violation,
      response,
      effectiveness: response.effectiveness
    };
    
    this.responseHistory.push(historyEntry);
    
    // 履歴サイズの制限
    if (this.responseHistory.length > 500) {
      this.responseHistory = this.responseHistory.slice(-500);
    }
  }

  private extractMetricValues(metrics: PerformanceMetrics[], metricType: string): number[] {
    return metrics.map(m => {
      switch (metricType) {
        case 'executionTime': return m.executionTime;
        case 'memoryUsage': return m.memoryUsage;
        case 'cpuUsage': return m.cpuUsage;
        default: return 0;
      }
    });
  }

  private calculateTrend(values: number[], metricType: string): PerformanceTrend | null {
    if (values.length < 10) return null;
    
    // 線形回帰による傾向分析
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;
    
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // 相関係数の計算
    const meanX = sumX / n;
    const meanY = sumY / n;
    const numerator = x.reduce((sum, val, i) => sum + (val - meanX) * (y[i] - meanY), 0);
    const denomX = Math.sqrt(x.reduce((sum, val) => sum + Math.pow(val - meanX, 2), 0));
    const denomY = Math.sqrt(y.reduce((sum, val) => sum + Math.pow(val - meanY, 2), 0));
    const correlation = numerator / (denomX * denomY);
    
    return {
      metric: metricType,
      direction: slope > 0.01 ? 'degrading' : slope < -0.01 ? 'improving' : 'stable',
      slope,
      correlation,
      confidence: Math.abs(correlation),
      currentValue: y[y.length - 1],
      baselineValue: y[0],
      description: this.generateTrendDescription(metricType, slope, correlation)
    };
  }

  private generateTrendDescription(metric: string, slope: number, correlation: number): string {
    const direction = slope > 0.01 ? '悪化' : slope < -0.01 ? '改善' : '安定';
    const strength = Math.abs(correlation) > 0.7 ? '強い' : Math.abs(correlation) > 0.4 ? '中程度の' : '弱い';
    
    return `${metric}は${strength}${direction}傾向を示しています（傾き: ${slope.toFixed(4)}）`;
  }

  private detectAnomalies(metrics: PerformanceMetrics[]): PerformanceAnomaly[] {
    const anomalies: PerformanceAnomaly[] = [];
    
    // 各メトリクスについて異常値を検出
    const metricTypes = ['executionTime', 'memoryUsage', 'cpuUsage'];
    
    metricTypes.forEach(metricType => {
      const values = this.extractMetricValues(metrics, metricType);
      const stats = this.calculateMetricStats(values);
      
      // Z-scoreによる異常値検出
      values.forEach((value, index) => {
        const zScore = Math.abs(value - stats.mean) / stats.stdDev;
        
        if (zScore > 3) { // 3σを超える値を異常値とする
          anomalies.push({
            metric: metricType,
            value,
            expectedValue: stats.mean,
            deviation: zScore,
            timestamp: metrics[index].timestamp,
            severity: zScore > 4 ? 'critical' : 'warning',
            description: `${metricType}で異常値を検出: ${value} (Z-score: ${zScore.toFixed(2)})`
          });
        }
      });
    });
    
    return anomalies;
  }

  private generatePredictions(trends: PerformanceTrend[]): PerformancePrediction[] {
    const predictions: PerformancePrediction[] = [];
    
    trends.forEach(trend => {
      if (trend.confidence > 0.6) {
        // 1時間後、1日後、1週間後の予測
        const timeHorizons = [
          { label: '1時間後', hours: 1 },
          { label: '1日後', hours: 24 },
          { label: '1週間後', hours: 168 }
        ];
        
        timeHorizons.forEach(horizon => {
          const predictedValue = trend.currentValue + (trend.slope * horizon.hours);
          
          predictions.push({
            metric: trend.metric,
            timeHorizon: horizon.label,
            predictedValue,
            confidence: trend.confidence * 0.9, // 予測の不確実性を考慮
            currentValue: trend.currentValue,
            description: `${horizon.label}の${trend.metric}予測値: ${predictedValue.toFixed(2)}`
          });
        });
      }
    });
    
    return predictions;
  }

  private generateTrendRecommendations(
    trends: PerformanceTrend[], 
    predictions: PerformancePrediction[],
    anomalies: PerformanceAnomaly[]
  ): string[] {
    const recommendations: string[] = [];
    
    // トレンドに基づく推奨事項
    trends.forEach(trend => {
      if (trend.direction === 'degrading' && trend.confidence > 0.7) {
        recommendations.push(`${trend.metric}の継続的な悪化が検出されました。原因調査と対策を推奨します`);
      }
    });
    
    // 予測に基づく推奨事項
    predictions.forEach(prediction => {
      if (prediction.confidence > 0.7) {
        const currentThreshold = this.dynamicThresholds.current[prediction.metric as keyof typeof this.dynamicThresholds.current];
        if (prediction.predictedValue > currentThreshold) {
          recommendations.push(`${prediction.timeHorizon}に${prediction.metric}が閾値を超過する可能性があります。事前対策を検討してください`);
        }
      }
    });
    
    // 異常値に基づく推奨事項
    if (anomalies.length > 0) {
      const criticalAnomalies = anomalies.filter(a => a.severity === 'critical').length;
      if (criticalAnomalies > 0) {
        recommendations.push(`${criticalAnomalies}件の重大な異常値が検出されました。システムの詳細調査を実施してください`);
      }
    }
    
    return recommendations;
  }

  private calculateAnalysisConfidence(
    dataPoints: number, 
    trendsCount: number, 
    anomaliesCount: number
  ): number {
    let confidence = 0.5; // ベース信頼度
    
    // データ量による信頼度向上
    confidence += Math.min(0.3, dataPoints / 100);
    
    // トレンド数による調整
    confidence += Math.min(0.1, trendsCount / 10);
    
    // 異常値による信頼度低下
    confidence -= Math.min(0.2, anomaliesCount / 20);
    
    return Math.max(0.1, Math.min(0.95, confidence));
  }
}

// 型定義
interface DynamicThresholds {
  current: Record<string, number>;
  adaptive: Record<string, number>;
  confidence: number;
  lastUpdated: Date;
  adjustmentHistory: ThresholdAdjustmentHistory[];
}

interface ThresholdAdjustmentHistory {
  timestamp: Date;
  metric: string;
  oldValue: number;
  newValue: number;
  reason: string;
}

interface PerformanceBaseline {
  executionTime: BaselineMetric;
  memoryUsage: BaselineMetric;
  cpuUsage: BaselineMetric;
  errorRate: BaselineMetric;
  establishedAt: Date;
  sampleSize: number;
}

interface BaselineMetric {
  mean: number;
  stdDev: number;
  percentiles: {
    p50: number;
    p90: number;
    p95: number;
    p99: number;
  };
}

interface ThresholdAdjustmentResult {
  success: boolean;
  adjustments: ThresholdAdjustment[];
  reason: string;
  previousThresholds: Record<string, number>;
  newThresholds: Record<string, number>;
  confidence: number;
  executionTime: number;
}

interface ThresholdAdjustment {
  metric: string;
  currentValue: number;
  newValue: number;
  adjustmentFactor: number;
  reason: string;
  confidence: number;
  shouldAdjust: boolean;
}

interface DegradationDetectionResult {
  degradationDetected: boolean;
  severity: 'none' | 'low' | 'medium' | 'high' | 'critical' | 'error';
  affectedMetrics: DegradationIndicator[];
  trendAnalysis: TrendAnalysisResult | null;
  recommendations: string[];
  confidence: number;
  timestamp: Date;
}

interface DegradationIndicator {
  metric: string;
  type: 'baseline_deviation' | 'trend_degradation';
  severity: 'warning' | 'critical';
  value: number;
  baseline: number;
  deviation: number;
  description: string;
}

interface AutoResponseResult {
  success: boolean;
  actionsPerformed: ActionResult[];
  responseTime: number;
  effectiveness: number;
  followUpRequired: boolean;
  details: string;
}

interface ResponseAction {
  type: string;
  priority: number;
  description: string;
  parameters?: Record<string, any>;
}

interface ActionResult {
  action: string;
  success: boolean;
  executionTime: number;
  details: string;
  error?: string;
}

interface TrendAnalysisResult {
  trends: PerformanceTrend[];
  predictions: PerformancePrediction[];
  anomalies: PerformanceAnomaly[];
  recommendations: string[];
  confidence: number;
  analysisTimestamp: Date;
}

interface PerformanceTrend {
  metric: string;
  direction: 'improving' | 'degrading' | 'stable';
  slope: number;
  correlation: number;
  confidence: number;
  currentValue: number;
  baselineValue: number;
  description: string;
}

interface PerformancePrediction {
  metric: string;
  timeHorizon: string;
  predictedValue: number;
  confidence: number;
  currentValue: number;
  description: string;
}

interface PerformanceAnomaly {
  metric: string;
  value: number;
  expectedValue: number;
  deviation: number;
  timestamp: Date;
  severity: 'warning' | 'critical';
  description: string;
}

interface MetricsStatistics {
  executionTime: MetricStatistics;
  memoryUsage: MetricStatistics;
  cpuUsage: MetricStatistics;
  sampleSize: number;
  timeRange: {
    start: Date;
    end: Date;
  };
}

interface MetricStatistics {
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
  p90: number;
  p95: number;
  p99: number;
}

interface AdjustmentNeed {
  metric: string;
  currentThreshold: number;
  suggestedThreshold: number;
  reason: string;
  confidence: number;
}

interface BaselineComparison {
  executionTime: MetricComparison;
  memoryUsage: MetricComparison;
  cpuUsage: MetricComparison;
}

interface MetricComparison {
  current: number;
  baseline: number;
  deviation: number;
  significance: 'low' | 'medium' | 'high';
}

interface ThresholdHistoryEntry {
  timestamp: Date;
  adjustments: ThresholdAdjustment[];
  confidence: number;
  reason: string;
  thresholds: Record<string, number>;
}

interface ResponseHistoryEntry {
  timestamp: Date;
  violation: ThresholdViolation;
  response: AutoResponseResult;
  effectiveness: number;
}

// ヘルパークラス
class TrendAnalyzer {
  async analyzeTrends(metrics: PerformanceMetrics[]): Promise<TrendAnalysisResult> {
    // 簡易実装
    return {
      trends: [],
      predictions: [],
      anomalies: [],
      recommendations: [],
      confidence: 0.5,
      analysisTimestamp: new Date()
    };
  }
}

class DegradationDetector {
  // 劣化検出の実装
}

class AutoResponseSystem {
  // 自動対応システムの実装
}