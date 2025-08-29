/**
 * Trust承認ポリシーメトリクス収集システム
 *
 * 自動承認率、判定処理時間、Trustダイアログ表示頻度などの
 * 運用メトリクスを収集・分析する機能を提供します。
 */
/**
 * メトリクスデータの型定義
 */
export interface TrustMetrics {
    timestamp: string;
    operationType: string;
    command: string;
    args: string[];
    decision: 'auto' | 'manual';
    processingTime: number;
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
    autoApprovalRate: number;
    averageProcessingTime: number;
    maxProcessingTime: number;
    trustDialogDisplayCount: number;
    operationsByType: Record<string, number>;
    performanceMetrics: {
        fastOperations: number;
        normalOperations: number;
        slowOperations: number;
    };
}
/**
 * メトリクス収集設定
 */
export interface MetricsConfig {
    enabled: boolean;
    retentionDays: number;
    aggregationInterval: number;
    performanceThresholds: {
        fast: number;
        normal: number;
    };
}
/**
 * メトリクス収集システム
 */
export declare class MetricsCollector {
    private config;
    private metricsDir;
    private currentMetrics;
    constructor(config?: Partial<MetricsConfig>);
    /**
     * メトリクスディレクトリの初期化
     */
    initialize(): Promise<void>;
    /**
     * 操作メトリクスを記録
     */
    recordOperation(metrics: Omit<TrustMetrics, 'timestamp'>): Promise<void>;
    /**
     * メトリクスをファイルに書き込み
     */
    private writeMetricsToFile;
    /**
     * 指定期間のメトリクスを読み込み
     */
    loadMetrics(startDate: Date, endDate: Date): Promise<TrustMetrics[]>;
    /**
     * メトリクスを集計
     */
    aggregateMetrics(startDate: Date, endDate: Date): Promise<AggregatedMetrics>;
    /**
     * 空の集計データを作成
     */
    private createEmptyAggregation;
    /**
     * 日次メトリクスレポートを生成
     */
    generateDailyReport(date?: Date): Promise<string>;
    /**
     * 週次メトリクスレポートを生成
     */
    generateWeeklyReport(endDate?: Date): Promise<string>;
    /**
     * トレンド分析を生成
     */
    private generateTrendAnalysis;
    /**
     * 推奨アクションを生成
     */
    private generateRecommendations;
    /**
     * 数値配列のトレンドを計算（簡易線形回帰）
     */
    private calculateTrend;
    /**
     * 古いメトリクスファイルをクリーンアップ
     */
    cleanupOldMetrics(): Promise<void>;
    /**
     * リアルタイム監視用のメトリクス取得
     */
    getCurrentMetrics(): Promise<{
        todayOperations: number;
        todayAutoApprovalRate: number;
        recentAverageProcessingTime: number;
        alertsCount: number;
    }>;
}
