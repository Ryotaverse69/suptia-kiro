import { Operation, TrustDecision, ExecutionResult, SecurityEvent } from './types.js';
export interface AuditLog {
    id: string;
    timestamp: Date;
    operation: Operation;
    decision: TrustDecision;
    executionResult?: ExecutionResult;
    user: string;
    sessionId: string;
}
export interface AuditLoggerConfig {
    reportsDir: string;
    maxLogFileSize: number;
    maxLogFiles: number;
    enableRotation: boolean;
}
export declare class AuditLogger {
    private config;
    private logQueue;
    private isProcessing;
    constructor(config?: Partial<AuditLoggerConfig>);
    /**
     * レポートディレクトリを設定（テスト用）
     */
    setReportsDir(reportsDir: string): void;
    /**
     * AuditLoggerの初期化
     * レポートディレクトリの作成とログファイルの準備を行う
     */
    initialize(): Promise<void>;
    /**
     * 自動承認操作のログを記録（オーバーロード対応）
     */
    logAutoApproval(operationOrData: Operation | {
        operation: string;
        timestamp: string;
        processingTime: number;
        context?: any;
    }, decision?: TrustDecision, executionResult?: ExecutionResult, user?: string, sessionId?: string): Promise<void>;
    /**
     * 手動承認操作のログを記録（オーバーロード対応）
     */
    logManualApproval(operationOrData: Operation | {
        operation: string;
        timestamp: string;
        user: string;
        approved: boolean;
        reason: string;
    }, decision?: TrustDecision, executionResult?: ExecutionResult, user?: string, sessionId?: string): Promise<void>;
    /**
     * 自動承認ログファイルに書き込み
     */
    private writeAutoApprovalLog;
    /**
     * 手動承認ログファイルに書き込み
     */
    private writeManualApprovalLog;
    /**
     * エラーログの記録
     */
    private logError; /**
    
   * ログローテーション機能
     */
    private checkAndRotateLog;
    /**
     * ログファイルのローテーション実行
     */
    private rotateLogFile;
    /**
     * 古いログファイルのクリーンアップ
     */
    private cleanupOldLogs;
    /**
     * 自動承認ログエントリのフォーマット
     */
    private formatAutoApprovalLogEntry;
    /**
     * 手動承認ログエントリのフォーマット
     */
    private formatManualApprovalLogEntry;
    /**
     * エラーログエントリのフォーマット
     */
    private formatErrorLogEntry;
    /**
     * ディレクトリの存在確認と作成
     */
    private ensureDirectoryExists;
    /**
     * ファイルに追記
     */
    private appendToFile;
    /**
     * ログファイルのヘッダー生成
     */
    private generateLogFileHeader;
    /**
     * ユニークなログIDを生成
     */
    private generateLogId;
    /**
     * セッションIDを生成
     */
    private generateSessionId;
    /**
     * 日付を YYYY-MM-DD 形式でフォーマット
     */
    private formatDate;
    /**
     * セキュリティイベントをログに記録する
     */
    logSecurityEvent(event: SecurityEvent): Promise<void>;
    /**
     * セキュリティイベントの統計を取得する
     */
    getSecurityEventStats(days?: number): Promise<{
        securityEvents: number;
        suspiciousPatterns: number;
        externalThreats: number;
        configTampering: number;
    }>;
    /**
     * ログローテーションを手動実行
     */
    rotateLogs(): Promise<void>;
    /**
     * ログ統計情報を取得
     */
    getLogStats(days?: number): Promise<{
        autoApprovals: number;
        manualApprovals: number;
        errors: number;
        totalOperations: number;
    }>;
    /**
     * 統一されたログ記録メソッド
     */
    log(entry: AuditLogEntry): Promise<void>;
    /**
     * ログディレクトリの確保（logメソッド用）
     */
    private ensureLogDirectory;
}
