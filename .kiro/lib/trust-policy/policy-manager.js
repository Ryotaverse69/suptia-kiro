import { promises as fs } from 'fs';
import { ReportGenerator } from './report-generator.js';
/**
 * Trust承認ポリシーの管理クラス
 * 設定ファイルの読み込み・検証・更新を担当
 */
export class PolicyManager {
    static POLICY_FILE_PATH = '.kiro/settings/trust-policy.json';
    static DEFAULT_POLICY_PATH = '.kiro/lib/trust-policy/default-policy.json';
    cachedPolicy = null;
    lastLoadTime = 0;
    CACHE_TTL = 5000; // 5秒間キャッシュ
    reportGenerator;
    constructor(reportsDir = '.kiro/reports') {
        this.reportGenerator = new ReportGenerator(reportsDir);
    }
    /**
     * ポリシー設定を読み込む
     */
    async loadPolicy() {
        const now = Date.now();
        // キャッシュが有効な場合は返す
        if (this.cachedPolicy && (now - this.lastLoadTime) < this.CACHE_TTL) {
            return this.cachedPolicy;
        }
        try {
            const policyContent = await fs.readFile(PolicyManager.POLICY_FILE_PATH, 'utf-8');
            const policy = JSON.parse(policyContent);
            // ポリシーを検証
            const validation = this.validatePolicy(policy);
            if (!validation.isValid) {
                console.warn('Trust policy validation failed:', validation.errors);
                return await this.loadDefaultPolicy();
            }
            this.cachedPolicy = policy;
            this.lastLoadTime = now;
            return policy;
        }
        catch (error) {
            console.warn('Failed to load trust policy, using default:', error);
            return await this.loadDefaultPolicy();
        }
    }
    /**
     * デフォルトポリシーを読み込む
     */
    async loadDefaultPolicy() {
        try {
            const defaultContent = await fs.readFile(PolicyManager.DEFAULT_POLICY_PATH, 'utf-8');
            const defaultPolicy = JSON.parse(defaultContent);
            this.cachedPolicy = defaultPolicy;
            this.lastLoadTime = Date.now();
            return defaultPolicy;
        }
        catch (error) {
            // デフォルトファイルも読み込めない場合はハードコードされたデフォルトを返す
            console.error('Failed to load default policy, using hardcoded fallback:', error);
            return this.getHardcodedDefaultPolicy();
        }
    }
    /**
     * ポリシー設定を更新する
     */
    async updatePolicy(policy, generateReport = true) {
        // 更新前に検証
        const validation = this.validatePolicy(policy);
        if (!validation.isValid) {
            throw new Error(`Policy validation failed: ${validation.errors.join(', ')}`);
        }
        // 現在のポリシーを取得（レポート生成用）
        const previousPolicy = generateReport ? await this.loadPolicy() : null;
        // ポリシーをクローンしてタイムスタンプを更新
        const updatedPolicy = { ...policy, lastUpdated: new Date().toISOString() };
        try {
            // 既存ファイルのバックアップを作成
            await this.createBackup();
            // 新しいポリシーを書き込み
            const policyContent = JSON.stringify(updatedPolicy, null, 2);
            await fs.writeFile(PolicyManager.POLICY_FILE_PATH, policyContent, 'utf-8');
            // キャッシュを更新
            this.cachedPolicy = updatedPolicy;
            this.lastLoadTime = Date.now();
            console.log('Trust policy updated successfully');
            // レポート生成
            if (generateReport && previousPolicy) {
                try {
                    await this.reportGenerator.generatePolicyUpdateReport(previousPolicy, updatedPolicy, 'policy-manager');
                    console.log('Policy update report generated successfully');
                }
                catch (reportError) {
                    console.error('Failed to generate policy update report:', reportError);
                    // レポート生成失敗は致命的ではないので続行
                }
            }
        }
        catch (error) {
            console.error('Failed to update trust policy:', error);
            throw error;
        }
    }
    /**
     * ポリシー更新レポートを手動生成する
     */
    async generateUpdateReport(previousPolicy, newPolicy, generatedBy = 'manual') {
        try {
            await this.reportGenerator.generatePolicyUpdateReport(previousPolicy, newPolicy, generatedBy);
            console.log('Policy update report generated successfully');
        }
        catch (error) {
            console.error('Failed to generate policy update report:', error);
            throw error;
        }
    }
    /**
     * ポリシー設定を検証する
     */
    validatePolicy(policy) {
        const errors = [];
        const warnings = [];
        // 必須フィールドの検証
        if (!policy.version) {
            errors.push('version is required');
        }
        if (!policy.lastUpdated) {
            errors.push('lastUpdated is required');
        }
        if (!policy.autoApprove) {
            errors.push('autoApprove configuration is required');
        }
        if (!policy.manualApprove) {
            errors.push('manualApprove configuration is required');
        }
        if (!policy.security) {
            errors.push('security configuration is required');
        }
        // autoApprove設定の検証
        if (policy.autoApprove) {
            if (!Array.isArray(policy.autoApprove.gitOperations)) {
                errors.push('autoApprove.gitOperations must be an array');
            }
            if (!Array.isArray(policy.autoApprove.fileOperations)) {
                errors.push('autoApprove.fileOperations must be an array');
            }
            if (typeof policy.autoApprove.cliOperations !== 'object') {
                errors.push('autoApprove.cliOperations must be an object');
            }
        }
        // manualApprove設定の検証
        if (policy.manualApprove) {
            if (!Array.isArray(policy.manualApprove.deleteOperations)) {
                errors.push('manualApprove.deleteOperations must be an array');
            }
            if (!Array.isArray(policy.manualApprove.forceOperations)) {
                errors.push('manualApprove.forceOperations must be an array');
            }
            if (!Array.isArray(policy.manualApprove.productionImpact)) {
                errors.push('manualApprove.productionImpact must be an array');
            }
        }
        // security設定の検証
        if (policy.security) {
            if (typeof policy.security.maxAutoApprovalPerHour !== 'number' ||
                policy.security.maxAutoApprovalPerHour < 0) {
                errors.push('security.maxAutoApprovalPerHour must be a positive number');
            }
            if (typeof policy.security.suspiciousPatternDetection !== 'boolean') {
                errors.push('security.suspiciousPatternDetection must be a boolean');
            }
            if (typeof policy.security.logAllOperations !== 'boolean') {
                errors.push('security.logAllOperations must be a boolean');
            }
        }
        // 警告の生成
        if (policy.security?.maxAutoApprovalPerHour > 10000) {
            warnings.push('maxAutoApprovalPerHour is very high, consider lowering for security');
        }
        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
    /**
     * 設定ファイルのバックアップを作成
     */
    async createBackup() {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupPath = `.kiro/settings/trust-policy.backup.${timestamp}.json`;
            const currentContent = await fs.readFile(PolicyManager.POLICY_FILE_PATH, 'utf-8');
            await fs.writeFile(backupPath, currentContent, 'utf-8');
            console.log(`Policy backup created: ${backupPath}`);
        }
        catch (error) {
            console.warn('Failed to create policy backup:', error);
            // バックアップ失敗は致命的ではないので続行
        }
    }
    /**
     * ハードコードされたデフォルトポリシーを返す
     */
    getHardcodedDefaultPolicy() {
        return {
            version: "1.0",
            lastUpdated: new Date().toISOString(),
            autoApprove: {
                gitOperations: ["status", "log", "diff", "show"],
                fileOperations: ["read"],
                cliOperations: {},
                scriptExecution: {
                    extensions: [],
                    allowedPaths: []
                }
            },
            manualApprove: {
                deleteOperations: ["*"],
                forceOperations: ["*"],
                productionImpact: ["*"]
            },
            security: {
                maxAutoApprovalPerHour: 100,
                suspiciousPatternDetection: true,
                logAllOperations: true
            }
        };
    }
    /**
     * キャッシュをクリア
     */
    clearCache() {
        this.cachedPolicy = null;
        this.lastLoadTime = 0;
    }
    /**
     * レポート生成の自動化設定を確認
     */
    async isReportGenerationEnabled() {
        try {
            const policy = await this.loadPolicy();
            // セキュリティ設定でレポート生成が有効かどうかを確認
            // 現在は常に有効だが、将来的に設定可能にする可能性がある
            return policy.security?.logAllOperations ?? true;
        }
        catch (error) {
            console.warn('Failed to check report generation setting:', error);
            return true; // デフォルトで有効
        }
    }
    /**
     * レポート生成のエラーハンドリング
     */
    async handleReportGenerationError(error, context) {
        const errorMessage = `Report generation failed in ${context}: ${error.message}`;
        console.error(errorMessage);
        try {
            // エラーログをファイルに記録
            const errorLogPath = '.kiro/reports/report-generation-errors.log';
            const timestamp = new Date().toISOString();
            const logEntry = `[${timestamp}] ${errorMessage}\n`;
            await fs.appendFile(errorLogPath, logEntry, 'utf-8');
        }
        catch (logError) {
            console.error('Failed to log report generation error:', logError);
        }
    }
}
