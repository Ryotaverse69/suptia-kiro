/**
 * Trust承認ポリシーシステム品質保証コントローラー
 *
 * システム全体の品質チェック、問題の自動検出・修正、
 * 品質レポート生成を統括する機能を提供します。
 */
/**
 * 品質問題の種類
 */
export declare enum QualityIssueType {
    MISSING_METHOD = "missing_method",
    INVALID_CONFIG = "invalid_config",
    PERFORMANCE_DEGRADATION = "performance_degradation",
    TEST_FAILURE = "test_failure",
    API_MISMATCH = "api_mismatch",
    INITIALIZATION_ERROR = "initialization_error"
}
/**
 * 品質問題の詳細
 */
export interface QualityIssue {
    id: string;
    type: QualityIssueType;
    severity: 'low' | 'medium' | 'high' | 'critical';
    component: string;
    description: string;
    detectedAt: Date;
    autoFixable: boolean;
    fixApplied: boolean;
    fixDetails?: string;
    metadata?: Record<string, any>;
}
/**
 * 品質チェック結果
 */
export interface QualityCheckResult {
    passed: boolean;
    issues: QualityIssue[];
    summary: {
        total: number;
        critical: number;
        high: number;
        medium: number;
        low: number;
        autoFixed: number;
    };
    recommendations: string[];
}
/**
 * 自動修正アクション
 */
export interface AutoFixAction {
    issueType: QualityIssueType;
    description: string;
    execute: (issue: QualityIssue) => Promise<boolean>;
    validate?: (issue: QualityIssue) => Promise<boolean>;
    rollback?: (issue: QualityIssue) => Promise<boolean>;
}
/**
 * 修正結果
 */
export interface FixResult {
    issueId: string;
    success: boolean;
    appliedAt: Date;
    fixDescription: string;
    validationResult?: boolean;
    error?: string;
    rollbackAvailable: boolean;
}
/**
 * 修正履歴エントリ
 */
export interface FixHistoryEntry {
    id: string;
    issueId: string;
    fixType: string;
    appliedAt: Date;
    success: boolean;
    description: string;
    beforeState: any;
    afterState: any;
    rollbackData?: any;
}
/**
 * 品質保証コントローラー
 */
export declare class QualityAssuranceController {
    private policyManager;
    private classifier;
    private decisionEngine;
    private auditLogger;
    private metricsCollector;
    private errorHandler;
    private autoFixActions;
    private detectedIssues;
    private fixHistory;
    private initialized;
    constructor();
    /**
     * 品質保証コントローラーの初期化
     */
    initialize(): Promise<void>;
    /**
     * 包括的な品質チェックを実行
     */
    performQualityCheck(): Promise<QualityCheckResult>;
    /**
     * コンポーネント初期化チェック
     */
    private checkComponentInitialization;
    /**
     * API互換性チェック
     */
    private checkAPICompatibility;
    /**
     * 設定妥当性チェック
     */
    private checkConfigurationValidity;
    /**
     * パフォーマンスメトリクスチェック
     */
    private checkPerformanceMetrics;
    /**
     * テストカバレッジチェック
     */
    private checkTestCoverage;
    /**
     * 自動修正アクションの設定
     */
    private setupAutoFixActions;
    /**
     * AuditLoggerのlogメソッドを修正
     */
    private fixAuditLoggerLogMethod;
    /**
     * PolicyManagerの設定検証を修正
     */
    private fixPolicyManagerValidation;
    /**
     * 自動承認率の改善
     */
    private fixAutoApprovalRate;
    /**
     * 設定検証エラーの修正
     */
    private fixConfigValidationError;
    /**
     * 決定処理の最適化
     */
    private optimizeDecisionProcessing;
    /**
     * テスト結果不足の修正
     */
    private fixMissingTestResults;
    /**
     * 自動修正の実行
     */
    private applyAutoFixes;
    /**
     * 修正結果の記録
     */
    private recordFixResults;
    /**
     * 修正履歴の記録
     */
    private recordFixHistory;
    /**
     * 問題の重要度別集計
     */
    private summarizeIssues;
    /**
     * 推奨事項の生成
     */
    private generateRecommendations;
    /**
     * 品質チェック結果をログに記録
     */
    private logQualityCheckResult;
    /**
     * 修正履歴を取得
     */
    getFixHistory(): FixHistoryEntry[];
    /**
     * 修正統計を取得
     */
    getFixStatistics(): {
        totalFixes: number;
        successfulFixes: number;
        failedFixes: number;
        fixesByType: Record<string, number>;
        recentFixes: FixHistoryEntry[];
    };
    /**
     * 基本的なヘルスチェックの実行
     */
    runBasicHealthCheck(): Promise<void>;
    /**
     * 修正をロールバック
     */
    rollbackFix(fixId: string): Promise<boolean>;
    /**
     * メソッド追加のロールバック
     */
    private rollbackMethodAddition;
    /**
     * 設定作成のロールバック
     */
    private rollbackConfigCreation;
    /**
     * 検証強化のロールバック
     */
    private rollbackValidationEnhancement;
}
