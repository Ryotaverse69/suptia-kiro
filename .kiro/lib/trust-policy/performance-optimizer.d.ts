import { Operation, TrustDecision } from './types.js';
/**
 * パフォーマンス最適化システム
 * 要件7.1, 7.2, 7.3に基づいて実装：
 * - 操作パターンキャッシュと頻繁操作の事前計算機能
 * - 非同期処理とメモリ効率化
 * - 高負荷時の承認判定優先度制御
 */
export declare class PerformanceOptimizer {
    private operationPatternCache;
    private frequentOperationsCache;
    private priorityQueue;
    private memoryManager;
    private loadBalancer;
    private readonly MAX_PATTERN_CACHE_SIZE;
    private readonly PATTERN_CACHE_TTL;
    private readonly FREQUENT_OPERATION_THRESHOLD;
    private readonly HIGH_LOAD_THRESHOLD;
    private performanceStats;
    private currentLoad;
    private processingQueue;
    constructor();
    /**
     * 操作パターンを事前計算してキャッシュする
     * 要件7.1: 操作パターンキャッシュと頻繁操作の事前計算機能
     */
    precomputeFrequentOperations(): Promise<void>;
    /**
     * 高速な判定処理（キャッシュ優先）
     * 要件7.1: 100ms以内の高速判定処理
     */
    optimizedEvaluate(operation: Operation): Promise<TrustDecision>;
    /**
     * 非同期処理とメモリ効率化された評価
     * 要件7.2: 非同期処理とメモリ効率化
     */
    private performOptimizedEvaluation;
    /**
     * 高負荷時の承認判定優先度制御
     * 要件7.3: 高負荷時の承認判定優先度制御
     */
    private handleHighLoadEvaluation;
    /**
     * 頻繁な操作パターンを特定
     */
    private identifyFrequentPatterns;
    /**
     * 事前計算された判定を実行
     */
    private precomputeDecision;
    /**
     * 事前計算済み判定をキャッシュに保存
     */
    private cachePrecomputedDecision;
    /**
     * 事前計算済み判定を取得
     */
    private getPrecomputedDecision;
    /**
     * パターンキャッシュから判定を取得
     */
    private getPatternCachedDecision;
    /**
     * 操作の優先度を計算
     */
    private calculateOperationPriority;
    /**
     * 高負荷状態かどうかを判定
     */
    private isHighLoad;
    /**
     * 評価結果をキャッシュに保存
     */
    private cacheEvaluationResult;
    /**
     * パターンキーを生成
     */
    private generatePatternKey;
    /**
     * 操作からパターンを抽出
     */
    private extractPattern;
    /**
     * サンプル操作を生成
     */
    private generateSampleOperation;
    /**
     * パターンの信頼度を計算
     */
    private calculateConfidence;
    /**
     * 古いキャッシュエントリを削除
     */
    private evictOldestCacheEntries;
    /**
     * 操作IDを生成
     */
    private generateOperationId;
    /**
     * 最近の操作履歴を取得（モック実装）
     */
    private getRecentOperations;
    /**
     * 最適化された評価処理
     */
    private evaluateWithOptimization;
    /**
     * 定期的なメンテナンス処理を開始
     */
    private startMaintenanceTasks;
    /**
     * 期限切れキャッシュのクリーンアップ
     */
    private cleanupExpiredCache;
    /**
     * 優先度キューの処理
     */
    private processPriorityQueue;
    /**
     * パフォーマンス統計を取得
     */
    getPerformanceStats(): any;
}
