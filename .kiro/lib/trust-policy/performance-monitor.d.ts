import { Operation, TrustDecision } from './types.js';
/**
 * パフォーマンス監視システム
 * 要件1.3, 4.1, 4.2に基づいて実装：
 * - パフォーマンステストの修正機能
 * - リアルタイムパフォーマンス測定
 * - 閾値監視とアラート機能
 * - パフォーマンス履歴の記録
 */
export declare class PerformanceMonitor {
    private trustEngine;
    private metricsCollector;
    private auditLogger;
    private errorHandler;
    private readonly PERFORMANCE_THRESHOLDS;
    private isMonitoring;
    private monitoringInterval;
    private performanceHistory;
    private currentMetrics;
    private alertThresholds;
    private performanceAlerts;
    private performanceStats;
    private thresholdViolations;
    constructor();
    /**
     * パフォーマンス監視システムの初期化
     */
    initialize(): Promise<void>;
    /**
     * パフォーマンステストの修正機能
     * 要件1.3: パフォーマンステストが正常に実行される
     */
    fixPerformanceTests(): Promise<FixResult>;
    /**
     * リアルタイムパフォーマンス測定
     * 要件4.1: パフォーマンス、信頼性、可用性を測定する
     */
    measurePerformance(operation: Operation): Promise<PerformanceMetrics>;
    /**
     * パフォーマンス閾値の監視
     * 要件4.2: メトリクスが閾値を超過したらアラートを発生させる
     */
    monitorThresholds(): Promise<ThresholdStatus>;
    /**
     * リアルタイム監視の開始
     */
    startRealTimeMonitoring(intervalMs?: number): Promise<void>;
    /**
     * リアルタイム監視の停止
     */
    stopRealTimeMonitoring(): void;
    /**
     * パフォーマンスレポートの生成
     * 要件4.3: 分かりやすい形式でメトリクスを表示する
     */
    generatePerformanceReport(): Promise<PerformanceReport>;
    /**
     * パフォーマンス履歴の記録
     * 要件4.4: 履歴データを分析して品質トレンドを可視化する
     */
    recordPerformanceHistory(metrics: PerformanceMetrics): Promise<void>;
    /**
     * パフォーマンス統計の取得
     */
    getPerformanceStatistics(): any;
    private initializeMetrics;
    private initializeAlertThresholds;
    private ensurePerformanceDirectories;
    private loadPerformanceHistory;
    private savePerformanceHistory;
    private fixModuleImportErrors;
    private improvePerformanceMeasurement;
    private optimizeThresholds;
    private stabilizeTestEnvironment;
    private evaluatePerformanceStatus;
    private generateOperationId;
    private addToPerformanceHistory;
    private updateRealTimeMetrics;
    private updateMetricValue;
    private checkThresholds;
    private handleThresholdViolations;
    private getCurrentMetrics;
    private checkExecutionTimeThreshold;
    private checkMemoryUsageThreshold;
    private checkCpuUsageThreshold;
    private checkThroughputThreshold;
    private generatePerformanceAlert;
    private collectSystemMetrics;
    private getReportPeriodStart;
    private generatePerformanceSummary;
    private getAggregatedMetrics;
    private aggregateMetric;
    private countOperationsByType;
    private analyzePerformanceTrends;
    private analyzeTrend;
    private generateRecommendations;
    private savePerformanceReport;
    private extractMetricsFromStatus;
    private clearOldPerformanceData;
}
interface PerformanceMetrics {
    operationType: string;
    operationId: string;
    executionTime: number;
    memoryUsage: number;
    cpuUsage: number;
    timestamp: Date;
    threshold: {
        executionTime: number;
        memoryUsage: number;
    };
    status: 'pass' | 'fail' | 'warning' | 'error';
    decision?: TrustDecision;
    error?: string;
    context?: any;
}
interface ThresholdStatus {
    overall: 'healthy' | 'warning' | 'critical' | 'error';
    violations: ThresholdViolation[];
    warnings: ThresholdViolation[];
    recommendations: string[];
}
interface ThresholdViolation {
    metric: string;
    value: number;
    threshold: number;
    message?: string;
    severity?: 'warning' | 'critical';
    timestamp?: Date;
    operationId?: string;
}
interface PerformanceAlert {
    id: string;
    type: 'threshold_violation' | 'performance_degradation' | 'system_error';
    severity: 'info' | 'warning' | 'critical';
    message: string;
    timestamp: Date;
    metrics: Record<string, number>;
    operationId?: string;
    details?: any;
}
interface PerformanceReport {
    id: string;
    timestamp: Date;
    period: {
        start: Date;
        end: Date;
    };
    summary: PerformanceSummary;
    metrics: AggregatedMetrics;
    trends: PerformanceTrend[];
    alerts: PerformanceAlert[];
    recommendations: string[];
    thresholdStatus: ThresholdStatus;
}
interface PerformanceSummary {
    totalOperations: number;
    averageExecutionTime: number;
    successRate: number;
    errorRate: number;
    peakMemoryUsage: number;
    averageMemoryUsage: number;
}
interface AggregatedMetrics {
    executionTime: {
        min: number;
        max: number;
        avg: number;
        p95: number;
    };
    memoryUsage: {
        min: number;
        max: number;
        avg: number;
        p95: number;
    };
    cpuUsage: {
        min: number;
        max: number;
        avg: number;
        p95: number;
    };
    operationCounts: Record<string, number>;
}
interface PerformanceTrend {
    metric: string;
    direction: 'improving' | 'degrading' | 'stable';
    changeRate: number;
    description: string;
}
interface FixResult {
    success: boolean;
    fixedIssues: string[];
    remainingIssues: string[];
    executionTime: number;
}
export {};
