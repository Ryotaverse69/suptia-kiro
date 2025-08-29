import { Operation, TrustDecision, TrustPolicy, OperationType, ExecutionResult } from './types.js';
/**
 * Trust判定エンジン - 操作要求を受け取り、自動承認・手動承認を判定するメインエンジン
 *
 * 要件7.1, 8.1に基づいて実装：
 * - 操作要求を受け取り、自動承認・手動承認の判定を行う
 * - ポリシー評価器とセキュリティ検証器を統合
 * - 100ms以内の高速判定処理を実現
 */
export declare class TrustDecisionEngine {
    private policyManager;
    private operationClassifier;
    private securityProtectionSystem;
    private securityVerifier;
    private policyEvaluator;
    private auditLogger;
    private performanceOptimizer;
    private performanceMetrics;
    private decisionCache;
    private readonly CACHE_TTL;
    private readonly MAX_CACHE_SIZE;
    constructor();
    /**
     * 操作要求を評価し、Trust判定を行う
     * 要件7.1: 100ms以内の高速判定処理
     * パフォーマンス最適化システムを使用
     */
    evaluateOperation(operation: Operation): Promise<TrustDecision>;
    /**
     * ポリシー設定を更新する
     */
    updatePolicy(policy: TrustPolicy): Promise<void>;
    /**
     * 操作履歴を取得する
     */
    getOperationHistory(): OperationLog[];
    /**
     * パフォーマンス統計を取得する
     */
    getPerformanceStats(): PerformanceStats;
    /**
     * パフォーマンス最適化の初期化
     */
    private initializePerformanceOptimization;
    /**
     * 手動でパフォーマンス最適化を実行
     */
    optimizePerformance(): Promise<void>;
    /**
     * 操作実行結果をログに記録する
     * 要件4.1, 4.2に基づいて実装
     */
    logOperationResult(operation: Operation, decision: TrustDecision, executionResult?: ExecutionResult, user?: string, sessionId?: string): Promise<void>;
    /**
     * 監査ログの統計情報を取得する
     */
    getAuditLogStats(days?: number): Promise<{
        autoApprovals: number;
        manualApprovals: number;
        errors: number;
        totalOperations: number;
    }>;
    /**
     * セキュリティ統計を取得する
     */
    getSecurityStats(days?: number): Promise<any>;
    /**
     * セキュリティ状態を取得する
     */
    getSecurityState(): any;
    /**
     * 手動承認モードから自動承認モードに復帰する
     */
    restoreAutoApprovalMode(reason?: string): Promise<void>;
    /**
     * セキュリティアクションを処理する
     */
    private handleSecurityAction;
    /**
     * 最終判定を行う
     */
    private makeFinalDecision;
    /**
     * キャッシュキーを生成する
     */
    private generateCacheKey;
    /**
     * キャッシュされた判定を取得する
     */
    private getCachedDecision;
    /**
     * 判定をキャッシュに保存する
     */
    private cacheDecision;
    /**
     * キャッシュをクリアする
     */
    private clearCache;
    /**
     * パフォーマンスを記録する
     */
    private recordPerformance;
}
interface OperationLog {
    id: string;
    timestamp: Date;
    operationType: OperationType;
    command: string;
    args: string[];
    approved: boolean;
    approvalType: 'auto' | 'manual';
    executionTime: number;
    result: 'success' | 'failure' | 'cancelled';
    duration?: number;
    errorMessage?: string;
}
interface PerformanceStats {
    totalOperations: number;
    successfulOperations: number;
    successRate: number;
    averageDuration: number;
    cacheHitRate: number;
    operationsUnder100ms: number;
    optimization?: any;
}
export {};
