/**
 * Trust承認ポリシーエラーハンドリングとフォールバック機能
 *
 * 設定エラー、判定エラー、実行エラー時の安全な処理と
 * システムの継続性を保証する機能を提供します。
 */
/**
 * エラータイプの定義
 */
export declare enum TrustErrorType {
    CONFIG_ERROR = "config_error",
    VALIDATION_ERROR = "validation_error",
    DECISION_ERROR = "decision_error",
    EXECUTION_ERROR = "execution_error",
    PERFORMANCE_ERROR = "performance_error",
    SECURITY_ERROR = "security_error"
}
/**
 * エラー詳細情報
 */
export interface TrustError {
    type: TrustErrorType;
    message: string;
    originalError?: Error;
    context?: Record<string, any>;
    timestamp: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    recoverable: boolean;
}
/**
 * フォールバック設定
 */
export interface FallbackConfig {
    enableSafeMode: boolean;
    defaultDecision: 'auto' | 'manual';
    maxRetries: number;
    retryDelay: number;
    emergencyMode: {
        enabled: boolean;
        autoApproveOnly: string[];
    };
}
/**
 * エラー統計
 */
export interface ErrorStatistics {
    totalErrors: number;
    errorsByType: Record<TrustErrorType, number>;
    errorsByHour: Record<string, number>;
    recoverySuccessRate: number;
    lastError?: TrustError;
}
/**
 * Trust承認ポリシーエラーハンドラー
 */
export declare class TrustErrorHandler {
    private config;
    private errorLog;
    private errorLogPath;
    private maxLogSize;
    constructor(config?: Partial<FallbackConfig>);
    /**
     * エラーハンドラーの初期化
     */
    initialize(): Promise<void>;
    /**
     * エラーを処理し、適切なフォールバック動作を実行
     */
    handleError(error: Error | TrustError, context?: Record<string, any>): Promise<{
        decision: 'auto' | 'manual';
        reason: string;
        fallbackApplied: boolean;
    }>;
    /**
     * 設定エラーの処理
     */
    private handleConfigError;
    /**
     * 検証エラーの処理
     */
    private handleValidationError;
    /**
     * 判定エラーの処理
     */
    private handleDecisionError;
    /**
     * 実行エラーの処理
     */
    private handleExecutionError;
    /**
     * パフォーマンスエラーの処理
     */
    private handlePerformanceError;
    /**
     * セキュリティエラーの処理
     */
    private handleSecurityError;
    /**
     * 未知のエラーの処理
     */
    private handleUnknownError;
    /**
     * エラーを正規化
     */
    private normalizeError;
    /**
     * エラーを分類
     */
    private classifyError;
    /**
     * エラーの重要度を判定
     */
    private determineSeverity;
    /**
     * エラーが回復可能かを判定
     */
    private isRecoverable;
    /**
     * エラーをログに記録
     */
    private logError;
    /**
     * 実行エラーの詳細ログ
     */
    private logExecutionError;
    /**
     * 既存のエラーログを読み込み
     */
    private loadErrorLog;
    /**
     * デフォルト設定の復帰
     */
    private restoreDefaultConfig;
    /**
     * 緊急モードの有効化
     */
    private enableEmergencyMode;
    /**
     * 緊急モードの無効化
     */
    disableEmergencyMode(): Promise<void>;
    /**
     * 緊急モード状態の確認
     */
    isEmergencyModeEnabled(): boolean;
    /**
     * 緊急モードで操作が許可されるかチェック
     */
    isAllowedInEmergencyMode(operation: string): boolean;
    /**
     * エラー統計の取得
     */
    getErrorStatistics(): ErrorStatistics;
    /**
     * エラーログのクリーンアップ
     */
    cleanupErrorLog(): Promise<void>;
    /**
     * ヘルスチェック
     */
    performHealthCheck(): Promise<{
        status: 'healthy' | 'warning' | 'critical';
        issues: string[];
        recommendations: string[];
    }>;
}
