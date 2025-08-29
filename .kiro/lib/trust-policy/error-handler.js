/**
 * Trust承認ポリシーエラーハンドリングとフォールバック機能
 *
 * 設定エラー、判定エラー、実行エラー時の安全な処理と
 * システムの継続性を保証する機能を提供します。
 */
import { promises as fs } from 'fs';
/**
 * エラータイプの定義
 */
export var TrustErrorType;
(function (TrustErrorType) {
    TrustErrorType["CONFIG_ERROR"] = "config_error";
    TrustErrorType["VALIDATION_ERROR"] = "validation_error";
    TrustErrorType["DECISION_ERROR"] = "decision_error";
    TrustErrorType["EXECUTION_ERROR"] = "execution_error";
    TrustErrorType["PERFORMANCE_ERROR"] = "performance_error";
    TrustErrorType["SECURITY_ERROR"] = "security_error";
})(TrustErrorType || (TrustErrorType = {}));
/**
 * Trust承認ポリシーエラーハンドラー
 */
export class TrustErrorHandler {
    config;
    errorLog = [];
    errorLogPath;
    maxLogSize = 1000;
    constructor(config) {
        this.config = {
            enableSafeMode: true,
            defaultDecision: 'manual',
            maxRetries: 3,
            retryDelay: 1000,
            emergencyMode: {
                enabled: false,
                autoApproveOnly: ['git status', 'git log', 'git diff']
            },
            ...config
        };
        this.errorLogPath = '.kiro/reports/trust-error-log.jsonl';
    }
    /**
     * エラーハンドラーの初期化
     */
    async initialize() {
        try {
            await fs.mkdir('.kiro/reports', { recursive: true });
            // 既存のエラーログを読み込み
            await this.loadErrorLog();
        }
        catch (error) {
            console.warn('エラーハンドラーの初期化に失敗しました:', error);
        }
    }
    /**
     * エラーを処理し、適切なフォールバック動作を実行
     */
    async handleError(error, context) {
        const trustError = this.normalizeError(error, context);
        // エラーをログに記録
        await this.logError(trustError);
        // エラータイプに応じた処理
        switch (trustError.type) {
            case TrustErrorType.CONFIG_ERROR:
                return await this.handleConfigError(trustError);
            case TrustErrorType.VALIDATION_ERROR:
                return await this.handleValidationError(trustError);
            case TrustErrorType.DECISION_ERROR:
                return await this.handleDecisionError(trustError);
            case TrustErrorType.EXECUTION_ERROR:
                return await this.handleExecutionError(trustError);
            case TrustErrorType.PERFORMANCE_ERROR:
                return await this.handlePerformanceError(trustError);
            case TrustErrorType.SECURITY_ERROR:
                return await this.handleSecurityError(trustError);
            default:
                return await this.handleUnknownError(trustError);
        }
    }
    /**
     * 設定エラーの処理
     */
    async handleConfigError(error) {
        console.warn('⚠️ 設定エラーが発生しました:', error.message);
        if (error.severity === 'critical') {
            // 緊急モードを有効化
            await this.enableEmergencyMode();
            return {
                decision: 'manual',
                reason: '設定エラーのため緊急モードに切り替えました',
                fallbackApplied: true
            };
        }
        // デフォルト設定の復帰を試行
        try {
            await this.restoreDefaultConfig();
            return {
                decision: this.config.defaultDecision,
                reason: 'デフォルト設定に復帰しました',
                fallbackApplied: true
            };
        }
        catch (restoreError) {
            console.error('デフォルト設定の復帰に失敗しました:', restoreError);
            return {
                decision: 'manual',
                reason: '設定復帰に失敗したため手動承認に切り替えました',
                fallbackApplied: true
            };
        }
    }
    /**
     * 検証エラーの処理
     */
    async handleValidationError(error) {
        console.warn('⚠️ 検証エラーが発生しました:', error.message);
        // 検証エラーは通常、安全側にフォールバック
        return {
            decision: 'manual',
            reason: '検証エラーのため安全側にフォールバックしました',
            fallbackApplied: true
        };
    }
    /**
     * 判定エラーの処理
     */
    async handleDecisionError(error) {
        console.warn('⚠️ 判定エラーが発生しました:', error.message);
        // リトライ機能
        if (error.context?.retryCount < this.config.maxRetries) {
            const retryCount = (error.context?.retryCount || 0) + 1;
            console.log(`判定を再試行します (${retryCount}/${this.config.maxRetries})`);
            // 遅延後にリトライ
            await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
            // リトライ情報を更新
            error.context = { ...error.context, retryCount };
            // 再試行は呼び出し元で処理されることを示す
            return {
                decision: 'manual',
                reason: `判定エラーのためリトライ中 (${retryCount}/${this.config.maxRetries})`,
                fallbackApplied: false
            };
        }
        // リトライ上限に達した場合
        return {
            decision: 'manual',
            reason: '判定エラーのリトライ上限に達したため手動承認に切り替えました',
            fallbackApplied: true
        };
    }
    /**
     * 実行エラーの処理
     */
    async handleExecutionError(error) {
        console.warn('⚠️ 実行エラーが発生しました:', error.message);
        // 実行エラーは操作を継続し、ログに記録
        await this.logExecutionError(error);
        return {
            decision: this.config.defaultDecision,
            reason: '実行エラーが発生しましたが処理を継続します',
            fallbackApplied: false
        };
    }
    /**
     * パフォーマンスエラーの処理
     */
    async handlePerformanceError(error) {
        console.warn('⚠️ パフォーマンスエラーが発生しました:', error.message);
        // パフォーマンス劣化時は簡易判定モードに切り替え
        return {
            decision: 'auto',
            reason: 'パフォーマンス劣化のため簡易判定モードに切り替えました',
            fallbackApplied: true
        };
    }
    /**
     * セキュリティエラーの処理
     */
    async handleSecurityError(error) {
        console.error('🚨 セキュリティエラーが発生しました:', error.message);
        // セキュリティエラーは即座に緊急モードに切り替え
        await this.enableEmergencyMode();
        return {
            decision: 'manual',
            reason: 'セキュリティエラーのため緊急モードに切り替えました',
            fallbackApplied: true
        };
    }
    /**
     * 未知のエラーの処理
     */
    async handleUnknownError(error) {
        console.error('❌ 未知のエラーが発生しました:', error.message);
        return {
            decision: 'manual',
            reason: '未知のエラーのため安全側にフォールバックしました',
            fallbackApplied: true
        };
    }
    /**
     * エラーを正規化
     */
    normalizeError(error, context) {
        if ('type' in error && 'severity' in error) {
            // 既にTrustError形式
            return error;
        }
        // 通常のErrorからTrustErrorに変換
        const normalizedError = {
            type: this.classifyError(error),
            message: error.message,
            originalError: error,
            context,
            timestamp: new Date().toISOString(),
            severity: this.determineSeverity(error),
            recoverable: this.isRecoverable(error)
        };
        return normalizedError;
    }
    /**
     * エラーを分類
     */
    classifyError(error) {
        const message = error.message.toLowerCase();
        if (message.includes('config') || message.includes('setting')) {
            return TrustErrorType.CONFIG_ERROR;
        }
        if (message.includes('validation') || message.includes('invalid')) {
            return TrustErrorType.VALIDATION_ERROR;
        }
        if (message.includes('decision') || message.includes('evaluation')) {
            return TrustErrorType.DECISION_ERROR;
        }
        if (message.includes('execution') || message.includes('operation')) {
            return TrustErrorType.EXECUTION_ERROR;
        }
        if (message.includes('timeout') || message.includes('performance')) {
            return TrustErrorType.PERFORMANCE_ERROR;
        }
        if (message.includes('security') || message.includes('unauthorized')) {
            return TrustErrorType.SECURITY_ERROR;
        }
        return TrustErrorType.EXECUTION_ERROR; // デフォルト
    }
    /**
     * エラーの重要度を判定
     */
    determineSeverity(error) {
        const message = error.message.toLowerCase();
        if (message.includes('critical') || message.includes('fatal')) {
            return 'critical';
        }
        if (message.includes('security') || message.includes('unauthorized')) {
            return 'high';
        }
        if (message.includes('config') || message.includes('validation')) {
            return 'medium';
        }
        return 'low';
    }
    /**
     * エラーが回復可能かを判定
     */
    isRecoverable(error) {
        const message = error.message.toLowerCase();
        // 回復不可能なエラー
        if (message.includes('fatal') || message.includes('corrupted')) {
            return false;
        }
        // 通常は回復可能
        return true;
    }
    /**
     * エラーをログに記録
     */
    async logError(error) {
        try {
            // メモリ内ログに追加
            this.errorLog.push(error);
            // ログサイズ制限
            if (this.errorLog.length > this.maxLogSize) {
                this.errorLog = this.errorLog.slice(-this.maxLogSize / 2);
            }
            // ファイルに記録
            const logLine = JSON.stringify(error) + '\n';
            await fs.appendFile(this.errorLogPath, logLine, 'utf-8');
        }
        catch (logError) {
            console.error('エラーログの記録に失敗しました:', logError);
        }
    }
    /**
     * 実行エラーの詳細ログ
     */
    async logExecutionError(error) {
        try {
            const executionLogPath = '.kiro/reports/trust-execution-error.log';
            const logEntry = [
                `[${error.timestamp}] ${error.type}: ${error.message}`,
                `Context: ${JSON.stringify(error.context)}`,
                `Severity: ${error.severity}`,
                `Recoverable: ${error.recoverable}`,
                '---'
            ].join('\n') + '\n';
            await fs.appendFile(executionLogPath, logEntry, 'utf-8');
        }
        catch (logError) {
            console.error('実行エラーログの記録に失敗しました:', logError);
        }
    }
    /**
     * 既存のエラーログを読み込み
     */
    async loadErrorLog() {
        try {
            const content = await fs.readFile(this.errorLogPath, 'utf-8');
            const lines = content.trim().split('\n').filter(line => line);
            this.errorLog = lines.slice(-this.maxLogSize).map(line => {
                try {
                    return JSON.parse(line);
                }
                catch (parseError) {
                    console.warn('エラーログ行の解析に失敗しました:', parseError);
                    return null;
                }
            }).filter(error => error !== null);
        }
        catch (error) {
            // ファイルが存在しない場合は新規作成
            this.errorLog = [];
        }
    }
    /**
     * デフォルト設定の復帰
     */
    async restoreDefaultConfig() {
        const defaultConfig = {
            version: '1.0',
            lastUpdated: new Date().toISOString(),
            autoApprove: {
                gitOperations: ['status', 'log', 'diff'],
                fileOperations: ['read'],
                cliOperations: {},
                scriptExecution: { extensions: [], allowedPaths: [] }
            },
            manualApprove: {
                deleteOperations: ['*'],
                forceOperations: ['*'],
                productionImpact: ['*']
            },
            security: {
                maxAutoApprovalPerHour: 100,
                suspiciousPatternDetection: true,
                logAllOperations: true
            }
        };
        const configPath = '.kiro/settings/trust-policy.json';
        await fs.writeFile(configPath, JSON.stringify(defaultConfig, null, 2), 'utf-8');
        console.log('✅ デフォルト設定に復帰しました');
    }
    /**
     * 緊急モードの有効化
     */
    async enableEmergencyMode() {
        this.config.emergencyMode.enabled = true;
        console.log('🚨 緊急モードを有効化しました');
        console.log('自動承認対象:', this.config.emergencyMode.autoApproveOnly);
        // 緊急モード設定をファイルに保存
        const emergencyConfigPath = '.kiro/settings/emergency-mode.json';
        await fs.writeFile(emergencyConfigPath, JSON.stringify({
            enabled: true,
            enabledAt: new Date().toISOString(),
            autoApproveOnly: this.config.emergencyMode.autoApproveOnly
        }, null, 2), 'utf-8');
    }
    /**
     * 緊急モードの無効化
     */
    async disableEmergencyMode() {
        this.config.emergencyMode.enabled = false;
        console.log('✅ 緊急モードを無効化しました');
        // 緊急モード設定ファイルを削除
        try {
            await fs.unlink('.kiro/settings/emergency-mode.json');
        }
        catch (error) {
            // ファイルが存在しない場合は無視
        }
    }
    /**
     * 緊急モード状態の確認
     */
    isEmergencyModeEnabled() {
        return this.config.emergencyMode.enabled;
    }
    /**
     * 緊急モードで操作が許可されるかチェック
     */
    isAllowedInEmergencyMode(operation) {
        if (!this.config.emergencyMode.enabled) {
            return true; // 緊急モードでない場合は通常判定
        }
        return this.config.emergencyMode.autoApproveOnly.some(allowed => operation.includes(allowed));
    }
    /**
     * エラー統計の取得
     */
    getErrorStatistics() {
        const now = new Date();
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const recentErrors = this.errorLog.filter(error => new Date(error.timestamp) >= last24Hours);
        const errorsByType = {
            [TrustErrorType.CONFIG_ERROR]: 0,
            [TrustErrorType.VALIDATION_ERROR]: 0,
            [TrustErrorType.DECISION_ERROR]: 0,
            [TrustErrorType.EXECUTION_ERROR]: 0,
            [TrustErrorType.PERFORMANCE_ERROR]: 0,
            [TrustErrorType.SECURITY_ERROR]: 0
        };
        const errorsByHour = {};
        recentErrors.forEach(error => {
            errorsByType[error.type]++;
            const hour = new Date(error.timestamp).getHours().toString().padStart(2, '0');
            errorsByHour[hour] = (errorsByHour[hour] || 0) + 1;
        });
        const recoverableErrors = recentErrors.filter(error => error.recoverable).length;
        const recoverySuccessRate = recentErrors.length > 0
            ? (recoverableErrors / recentErrors.length) * 100
            : 100;
        return {
            totalErrors: recentErrors.length,
            errorsByType,
            errorsByHour,
            recoverySuccessRate,
            lastError: this.errorLog[this.errorLog.length - 1]
        };
    }
    /**
     * エラーログのクリーンアップ
     */
    async cleanupErrorLog() {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - 7); // 7日前
            // メモリ内ログのクリーンアップ
            this.errorLog = this.errorLog.filter(error => new Date(error.timestamp) >= cutoffDate);
            // ファイルの再作成
            const content = this.errorLog.map(error => JSON.stringify(error)).join('\n') + '\n';
            await fs.writeFile(this.errorLogPath, content, 'utf-8');
            console.log('✅ エラーログをクリーンアップしました');
        }
        catch (error) {
            console.warn('エラーログのクリーンアップに失敗しました:', error);
        }
    }
    /**
     * ヘルスチェック
     */
    async performHealthCheck() {
        const issues = [];
        const recommendations = [];
        // エラー統計の確認
        const stats = this.getErrorStatistics();
        if (stats.totalErrors > 50) {
            issues.push(`過去24時間で${stats.totalErrors}件のエラーが発生しています`);
            recommendations.push('エラーの原因調査と対策を推奨します');
        }
        if (stats.recoverySuccessRate < 80) {
            issues.push(`エラー回復成功率が${stats.recoverySuccessRate.toFixed(1)}%と低下しています`);
            recommendations.push('システムの安定性向上対策を検討してください');
        }
        // 緊急モードの確認
        if (this.config.emergencyMode.enabled) {
            issues.push('緊急モードが有効化されています');
            recommendations.push('問題解決後に緊急モードを無効化してください');
        }
        // セキュリティエラーの確認
        if (stats.errorsByType[TrustErrorType.SECURITY_ERROR] > 0) {
            issues.push('セキュリティエラーが検出されています');
            recommendations.push('セキュリティ設定の見直しを緊急で実施してください');
        }
        // ステータスの判定
        let status;
        if (stats.errorsByType[TrustErrorType.SECURITY_ERROR] > 0 || this.config.emergencyMode.enabled) {
            status = 'critical';
        }
        else if (issues.length > 0) {
            status = 'warning';
        }
        else {
            status = 'healthy';
        }
        return { status, issues, recommendations };
    }
}
