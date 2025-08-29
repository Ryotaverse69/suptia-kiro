import { OperationType, RiskLevel } from './types.js';
import { OperationClassifier } from './operation-classifier.js';
import { PolicyManager } from './policy-manager.js';
/**
 * パフォーマンス最適化システム
 * 要件7.1, 7.2, 7.3に基づいて実装：
 * - 操作パターンキャッシュと頻繁操作の事前計算機能
 * - 非同期処理とメモリ効率化
 * - 高負荷時の承認判定優先度制御
 */
export class PerformanceOptimizer {
    operationPatternCache;
    frequentOperationsCache;
    priorityQueue;
    memoryManager;
    loadBalancer;
    // 設定値
    MAX_PATTERN_CACHE_SIZE = 5000;
    PATTERN_CACHE_TTL = 300000; // 5分
    FREQUENT_OPERATION_THRESHOLD = 10; // 10回以上で頻繁操作と判定
    HIGH_LOAD_THRESHOLD = 100; // 同時処理数の閾値
    // 統計情報
    performanceStats;
    currentLoad = 0;
    processingQueue = new Set();
    constructor() {
        this.operationPatternCache = new Map();
        this.frequentOperationsCache = new Map();
        this.priorityQueue = new PriorityQueue();
        this.memoryManager = new MemoryManager();
        this.loadBalancer = new LoadBalancer();
        this.performanceStats = new PerformanceStatistics();
        // 定期的なメンテナンス処理を開始
        this.startMaintenanceTasks();
    }
    /**
     * 操作パターンを事前計算してキャッシュする
     * 要件7.1: 操作パターンキャッシュと頻繁操作の事前計算機能
     */
    async precomputeFrequentOperations() {
        const startTime = performance.now();
        try {
            // 頻繁な操作パターンを特定
            const frequentPatterns = await this.identifyFrequentPatterns();
            // 各パターンについて事前計算を実行
            const precomputePromises = frequentPatterns.map(async (pattern) => {
                const decision = await this.precomputeDecision(pattern);
                this.cachePrecomputedDecision(pattern, decision);
            });
            await Promise.all(precomputePromises);
            const duration = performance.now() - startTime;
            this.performanceStats.recordPrecomputation(frequentPatterns.length, duration);
            console.log(`事前計算完了: ${frequentPatterns.length}パターン (${duration.toFixed(2)}ms)`);
        }
        catch (error) {
            console.error('事前計算中にエラーが発生しました:', error);
        }
    }
    /**
     * 高速な判定処理（キャッシュ優先）
     * 要件7.1: 100ms以内の高速判定処理
     */
    async optimizedEvaluate(operation) {
        const startTime = performance.now();
        const operationId = this.generateOperationId(operation);
        try {
            // 1. 事前計算済みパターンのチェック（最高速）
            const precomputedDecision = this.getPrecomputedDecision(operation);
            if (precomputedDecision) {
                this.performanceStats.recordCacheHit('precomputed', performance.now() - startTime);
                return precomputedDecision.decision;
            }
            // 2. パターンキャッシュのチェック（高速）
            const cachedDecision = this.getPatternCachedDecision(operation);
            if (cachedDecision) {
                this.performanceStats.recordCacheHit('pattern', performance.now() - startTime);
                return cachedDecision.decision;
            }
            // 3. 高負荷時の優先度制御
            if (this.isHighLoad()) {
                return await this.handleHighLoadEvaluation(operation, operationId);
            }
            // 4. 通常の評価処理（非同期最適化）
            return await this.performOptimizedEvaluation(operation, operationId);
        }
        catch (error) {
            console.error('最適化された評価処理でエラーが発生しました:', error);
            // エラー時のフォールバック
            return {
                approved: false,
                requiresManualApproval: true,
                reason: `最適化処理エラー: ${error instanceof Error ? error.message : 'Unknown error'}`,
                riskLevel: RiskLevel.HIGH
            };
        }
        finally {
            this.processingQueue.delete(operationId);
            this.currentLoad = Math.max(0, this.currentLoad - 1);
        }
    }
    /**
     * 非同期処理とメモリ効率化された評価
     * 要件7.2: 非同期処理とメモリ効率化
     */
    async performOptimizedEvaluation(operation, operationId) {
        this.processingQueue.add(operationId);
        this.currentLoad++;
        // 非同期でバックグラウンド処理を実行
        const evaluationPromise = this.evaluateWithOptimization(operation);
        // メモリ効率化のための並行処理
        const memoryOptimizationPromise = this.memoryManager.optimizeForOperation(operation);
        // 両方の処理を並行実行
        const [decision] = await Promise.all([
            evaluationPromise,
            memoryOptimizationPromise
        ]);
        // 結果をキャッシュに保存（非同期）
        setImmediate(() => {
            this.cacheEvaluationResult(operation, decision);
        });
        return decision;
    }
    /**
     * 高負荷時の承認判定優先度制御
     * 要件7.3: 高負荷時の承認判定優先度制御
     */
    async handleHighLoadEvaluation(operation, operationId) {
        // 操作の優先度を計算
        const priority = this.calculateOperationPriority(operation);
        // 優先度キューに追加
        const pendingOperation = {
            id: operationId,
            operation,
            priority,
            timestamp: Date.now(),
            resolve: null,
            reject: null
        };
        return new Promise((resolve, reject) => {
            pendingOperation.resolve = resolve;
            pendingOperation.reject = reject;
            this.priorityQueue.enqueue(pendingOperation);
            // 高負荷時のタイムアウト設定（より短く）
            setTimeout(() => {
                if (this.priorityQueue.contains(operationId)) {
                    this.priorityQueue.remove(operationId);
                    reject(new Error('高負荷によりタイムアウトしました'));
                }
            }, 2000); // 2秒でタイムアウト
        });
    }
    /**
     * 頻繁な操作パターンを特定
     */
    async identifyFrequentPatterns() {
        const patterns = new Map();
        // 過去の操作履歴から頻繁なパターンを抽出
        const recentOperations = await this.getRecentOperations(1000); // 直近1000件
        for (const operation of recentOperations) {
            const patternKey = this.generatePatternKey(operation);
            const existing = patterns.get(patternKey) || { count: 0, pattern: this.extractPattern(operation) };
            existing.count++;
            patterns.set(patternKey, existing);
        }
        // 閾値以上の頻度のパターンを返す
        return Array.from(patterns.values())
            .filter(p => p.count >= this.FREQUENT_OPERATION_THRESHOLD)
            .map(p => p.pattern)
            .sort((a, b) => b.frequency - a.frequency)
            .slice(0, 100); // 上位100パターン
    }
    /**
     * 事前計算された判定を実行
     */
    async precomputeDecision(pattern) {
        const classifier = new OperationClassifier();
        const policyManager = new PolicyManager();
        // サンプル操作を生成
        const sampleOperation = this.generateSampleOperation(pattern);
        // 分類とポリシー評価を実行
        const classification = classifier.classifyOperation(sampleOperation);
        const policy = await policyManager.loadPolicy();
        // 簡易的な判定ロジック
        const decision = {
            approved: !classification.requiresManualApproval,
            requiresManualApproval: classification.requiresManualApproval,
            reason: classification.reason,
            riskLevel: classification.riskLevel
        };
        return {
            pattern,
            decision,
            computedAt: Date.now(),
            confidence: this.calculateConfidence(pattern)
        };
    }
    /**
     * 事前計算済み判定をキャッシュに保存
     */
    cachePrecomputedDecision(pattern, decision) {
        const key = this.generatePatternKey(pattern);
        this.operationPatternCache.set(key, decision);
        // キャッシュサイズ制限
        if (this.operationPatternCache.size > this.MAX_PATTERN_CACHE_SIZE) {
            this.evictOldestCacheEntries();
        }
    }
    /**
     * 事前計算済み判定を取得
     */
    getPrecomputedDecision(operation) {
        const patternKey = this.generatePatternKey(operation);
        const cached = this.operationPatternCache.get(patternKey);
        if (!cached) {
            return null;
        }
        // TTLチェック
        if (Date.now() - cached.computedAt > this.PATTERN_CACHE_TTL) {
            this.operationPatternCache.delete(patternKey);
            return null;
        }
        // 信頼度チェック
        if (cached.confidence < 0.8) {
            return null;
        }
        return cached;
    }
    /**
     * パターンキャッシュから判定を取得
     */
    getPatternCachedDecision(operation) {
        const patternKey = this.generatePatternKey(operation);
        return this.frequentOperationsCache.get(patternKey) || null;
    }
    /**
     * 操作の優先度を計算
     */
    calculateOperationPriority(operation) {
        let priority = 50; // ベース優先度
        // 操作タイプによる優先度調整
        switch (operation.type) {
            case OperationType.GIT:
                priority += 20; // Git操作は高優先度
                break;
            case OperationType.FILE:
                priority += 10; // ファイル操作は中優先度
                break;
            case OperationType.CLI:
                priority += 5; // CLI操作は低優先度
                break;
            case OperationType.SCRIPT:
                priority -= 10; // スクリプト実行は低優先度
                break;
        }
        // 危険度による優先度調整
        if (operation.args.some(arg => arg.includes('delete') || arg.includes('rm'))) {
            priority += 30; // 削除系操作は最高優先度
        }
        if (operation.args.some(arg => arg.includes('force') || arg.includes('-f'))) {
            priority += 20; // 強制系操作は高優先度
        }
        // ユーザーセッションによる優先度調整
        if (operation.context?.sessionId) {
            priority += 5; // 認証済みセッションは優先度アップ
        }
        return Math.max(0, Math.min(100, priority)); // 0-100の範囲に正規化
    }
    /**
     * 高負荷状態かどうかを判定
     */
    isHighLoad() {
        return this.currentLoad >= this.HIGH_LOAD_THRESHOLD;
    }
    /**
     * 評価結果をキャッシュに保存
     */
    cacheEvaluationResult(operation, decision) {
        const patternKey = this.generatePatternKey(operation);
        const pattern = this.extractPattern(operation);
        const cachedPattern = {
            pattern,
            decision,
            cachedAt: Date.now(),
            hitCount: 1,
            lastAccessed: Date.now()
        };
        this.frequentOperationsCache.set(patternKey, cachedPattern);
    }
    /**
     * パターンキーを生成
     */
    generatePatternKey(operation) {
        if ('command' in operation) {
            // Operation型の場合
            return `${operation.type}:${operation.command}:${operation.args.slice(0, 3).join(':')}`;
        }
        else {
            // OperationPattern型の場合
            return `${operation.type}:${operation.commandPattern}:${operation.argsPattern}`;
        }
    }
    /**
     * 操作からパターンを抽出
     */
    extractPattern(operation) {
        return {
            type: operation.type,
            commandPattern: operation.command,
            argsPattern: operation.args.slice(0, 3).join(' '), // 最初の3つの引数のみ
            frequency: 1,
            riskLevel: RiskLevel.LOW
        };
    }
    /**
     * サンプル操作を生成
     */
    generateSampleOperation(pattern) {
        return {
            type: pattern.type,
            command: pattern.commandPattern,
            args: pattern.argsPattern.split(' '),
            context: {
                workingDirectory: process.cwd(),
                user: 'system',
                sessionId: 'precompute'
            },
            timestamp: new Date()
        };
    }
    /**
     * パターンの信頼度を計算
     */
    calculateConfidence(pattern) {
        let confidence = 0.5; // ベース信頼度
        // 頻度による信頼度向上
        confidence += Math.min(0.4, pattern.frequency / 100);
        // リスクレベルによる調整
        switch (pattern.riskLevel) {
            case RiskLevel.LOW:
                confidence += 0.1;
                break;
            case RiskLevel.MEDIUM:
                confidence += 0.05;
                break;
            case RiskLevel.HIGH:
            case RiskLevel.CRITICAL:
                confidence -= 0.1;
                break;
        }
        return Math.max(0, Math.min(1, confidence));
    }
    /**
     * 古いキャッシュエントリを削除
     */
    evictOldestCacheEntries() {
        const entries = Array.from(this.operationPatternCache.entries());
        entries.sort((a, b) => a[1].computedAt - b[1].computedAt);
        // 古い25%のエントリを削除
        const toDelete = Math.floor(entries.length * 0.25);
        for (let i = 0; i < toDelete; i++) {
            this.operationPatternCache.delete(entries[i][0]);
        }
    }
    /**
     * 操作IDを生成
     */
    generateOperationId(operation) {
        return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * 最近の操作履歴を取得（モック実装）
     */
    async getRecentOperations(limit) {
        // 実際の実装では監査ログから取得
        return [];
    }
    /**
     * 最適化された評価処理
     */
    async evaluateWithOptimization(operation) {
        // 簡易的な評価ロジック（実際の実装では完全な評価を行う）
        const classifier = new OperationClassifier();
        const classification = classifier.classifyOperation(operation);
        return {
            approved: !classification.requiresManualApproval,
            requiresManualApproval: classification.requiresManualApproval,
            reason: classification.reason,
            riskLevel: classification.riskLevel
        };
    }
    /**
     * 定期的なメンテナンス処理を開始
     */
    startMaintenanceTasks() {
        // 5分ごとに事前計算を実行
        setInterval(() => {
            this.precomputeFrequentOperations().catch(console.error);
        }, 300000);
        // 1分ごとにメモリ最適化を実行
        setInterval(() => {
            this.memoryManager.performGarbageCollection();
        }, 60000);
        // 10分ごとにキャッシュクリーンアップを実行
        setInterval(() => {
            this.cleanupExpiredCache();
        }, 600000);
        // 高負荷時の優先度キュー処理（より頻繁に）
        setInterval(() => {
            this.processPriorityQueue();
        }, 10); // 10msごと
    }
    /**
     * 期限切れキャッシュのクリーンアップ
     */
    cleanupExpiredCache() {
        const now = Date.now();
        // パターンキャッシュのクリーンアップ
        for (const [key, value] of this.operationPatternCache.entries()) {
            if (now - value.computedAt > this.PATTERN_CACHE_TTL) {
                this.operationPatternCache.delete(key);
            }
        }
        // 頻繁操作キャッシュのクリーンアップ
        for (const [key, value] of this.frequentOperationsCache.entries()) {
            if (now - value.lastAccessed > this.PATTERN_CACHE_TTL) {
                this.frequentOperationsCache.delete(key);
            }
        }
    }
    /**
     * 優先度キューの処理
     */
    processPriorityQueue() {
        if (this.priorityQueue.isEmpty()) {
            return;
        }
        // 高負荷時でも優先度キューは処理する（これが高負荷時の制御の目的）
        const operation = this.priorityQueue.dequeue();
        if (operation) {
            this.currentLoad = Math.max(0, this.currentLoad - 1); // 負荷を減らす
            this.evaluateWithOptimization(operation.operation)
                .then(decision => operation.resolve(decision))
                .catch(error => operation.reject(error));
        }
    }
    /**
     * パフォーマンス統計を取得
     */
    getPerformanceStats() {
        return {
            ...this.performanceStats.getStats(),
            currentLoad: this.currentLoad,
            cacheSize: {
                patterns: this.operationPatternCache.size,
                frequent: this.frequentOperationsCache.size
            },
            queueSize: this.priorityQueue.size()
        };
    }
}
/**
 * 優先度キュー実装
 */
class PriorityQueue {
    items = [];
    enqueue(item) {
        let added = false;
        for (let i = 0; i < this.items.length; i++) {
            if (item.priority > this.items[i].priority) {
                this.items.splice(i, 0, item);
                added = true;
                break;
            }
        }
        if (!added) {
            this.items.push(item);
        }
    }
    dequeue() {
        return this.items.shift() || null;
    }
    contains(id) {
        return this.items.some(item => item.id === id);
    }
    remove(id) {
        const index = this.items.findIndex(item => item.id === id);
        if (index !== -1) {
            this.items.splice(index, 1);
            return true;
        }
        return false;
    }
    isEmpty() {
        return this.items.length === 0;
    }
    size() {
        return this.items.length;
    }
}
/**
 * メモリ管理システム
 */
class MemoryManager {
    memoryUsage = new Map();
    MAX_MEMORY_USAGE = 100 * 1024 * 1024; // 100MB
    async optimizeForOperation(operation) {
        // メモリ使用量をチェック
        const currentUsage = this.getCurrentMemoryUsage();
        if (currentUsage > this.MAX_MEMORY_USAGE) {
            await this.performGarbageCollection();
        }
    }
    performGarbageCollection() {
        // Node.jsのガベージコレクションを強制実行
        if (global.gc) {
            global.gc();
        }
    }
    getCurrentMemoryUsage() {
        const usage = process.memoryUsage();
        return usage.heapUsed;
    }
}
/**
 * 負荷分散システム
 */
class LoadBalancer {
    workers = [];
    currentWorkerIndex = 0;
    distributeLoad(operation) {
        // 実際の実装ではワーカープロセスに負荷を分散
        // ここでは簡略化
        return Promise.resolve({
            approved: true,
            requiresManualApproval: false,
            reason: '負荷分散処理完了',
            riskLevel: RiskLevel.LOW
        });
    }
}
/**
 * パフォーマンス統計システム
 */
class PerformanceStatistics {
    stats = {
        totalEvaluations: 0,
        cacheHits: { precomputed: 0, pattern: 0 },
        averageEvaluationTime: 0,
        precomputations: { count: 0, totalTime: 0 },
        highLoadEvents: 0,
        memoryOptimizations: 0
    };
    recordCacheHit(type, duration) {
        this.stats.cacheHits[type]++;
        this.updateAverageTime(duration);
    }
    recordPrecomputation(count, duration) {
        this.stats.precomputations.count += count;
        this.stats.precomputations.totalTime += duration;
    }
    updateAverageTime(duration) {
        this.stats.totalEvaluations++;
        this.stats.averageEvaluationTime =
            (this.stats.averageEvaluationTime * (this.stats.totalEvaluations - 1) + duration) /
                this.stats.totalEvaluations;
    }
    getStats() {
        return { ...this.stats };
    }
}
