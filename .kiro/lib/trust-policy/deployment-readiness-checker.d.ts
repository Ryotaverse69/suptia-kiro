export interface DeploymentReadiness {
    ready: boolean;
    score: number;
    blockers: DeploymentBlocker[];
    warnings: DeploymentWarning[];
    recommendations: string[];
    qualityGates: QualityGateResult[];
    timestamp: Date;
}
export interface DeploymentBlocker {
    id: string;
    category: 'critical_test_failure' | 'performance_threshold' | 'security_issue' | 'dependency_issue';
    description: string;
    impact: string;
    resolution: string;
    autoFixable: boolean;
}
export interface DeploymentWarning {
    id: string;
    category: 'quality_degradation' | 'performance_warning' | 'test_coverage';
    description: string;
    recommendation: string;
}
export interface QualityGateResult {
    name: string;
    status: 'pass' | 'fail' | 'warning';
    criteria: QualityCriteriaResult[];
    blocking: boolean;
}
export interface QualityCriteriaResult {
    metric: string;
    actual: number;
    threshold: number;
    operator: string;
    passed: boolean;
}
export interface DeploymentPermission {
    granted: boolean;
    grantedAt: Date;
    validUntil: Date;
    conditions: string[];
    approver: string;
}
/**
 * デプロイメント準備状況を確認し、デプロイ可能性を判定するクラス
 */
export declare class DeploymentReadinessChecker {
    private qualityController;
    private performanceMonitor;
    private testManager;
    private reportsDir;
    constructor();
    /**
     * 初期化処理
     */
    initialize(): Promise<void>;
    /**
     * デプロイメント準備状況の包括的チェック
     */
    checkDeploymentReadiness(): Promise<DeploymentReadiness>;
    /**
     * 品質ゲートの評価
     */
    private evaluateQualityGates;
    /**
     * Critical Functionality Gateの評価
     */
    private evaluateCriticalFunctionalityGate;
    /**
     * Performance Standards Gateの評価
     */
    private evaluatePerformanceGate;
    /**
     * Quality Metrics Gateの評価
     */
    private evaluateQualityMetricsGate;
    /**
     * 全体的なテスト成功率の計算
     */
    private calculateOverallTestSuccessRate;
    /**
     * デプロイメントブロッカーの特定
     */
    private identifyBlockers;
    /**
     * デプロイメント警告の特定
     */
    private identifyWarnings;
    /**
     * ブロッカーのカテゴリ分類
     */
    private categorizeBlocker;
    /**
     * 警告のカテゴリ分類
     */
    private categorizeWarning;
    /**
     * メトリクスに対する解決策の取得
     */
    private getResolutionForMetric;
    /**
     * メトリクスに対する推奨事項の取得
     */
    private getRecommendationForMetric;
    /**
     * 自動修正可能かどうかの判定
     */
    private isAutoFixable;
    /**
     * デプロイ準備スコアの計算
     */
    private calculateReadinessScore;
    /**
     * 推奨事項の生成
     */
    private generateRecommendations;
    /**
     * デプロイ許可の発行
     */
    grantDeploymentPermission(readiness: DeploymentReadiness): Promise<DeploymentPermission>;
    /**
     * デプロイ後検証の実行
     */
    runPostDeploymentVerification(): Promise<{
        success: boolean;
        issues: string[];
    }>;
    /**
     * ヘルスチェックの実行
     */
    private performHealthCheck;
    /**
     * 重要機能の動作確認
     */
    private verifyCriticalFunctionality;
    /**
     * 準備状況レポートの保存
     */
    private saveReadinessReport;
    /**
     * 準備状況レポートの生成
     */
    private generateReadinessReport;
}
