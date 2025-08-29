import { TrustPolicy, PolicyValidationResult } from './types.js';
/**
 * Trust承認ポリシーの管理クラス
 * 設定ファイルの読み込み・検証・更新を担当
 */
export declare class PolicyManager {
    private static readonly POLICY_FILE_PATH;
    private static readonly DEFAULT_POLICY_PATH;
    private cachedPolicy;
    private lastLoadTime;
    private readonly CACHE_TTL;
    private reportGenerator;
    constructor(reportsDir?: string);
    /**
     * ポリシー設定を読み込む
     */
    loadPolicy(): Promise<TrustPolicy>;
    /**
     * デフォルトポリシーを読み込む
     */
    loadDefaultPolicy(): Promise<TrustPolicy>;
    /**
     * ポリシー設定を更新する
     */
    updatePolicy(policy: TrustPolicy, generateReport?: boolean): Promise<void>;
    /**
     * ポリシー更新レポートを手動生成する
     */
    generateUpdateReport(previousPolicy: TrustPolicy, newPolicy: TrustPolicy, generatedBy?: string): Promise<void>;
    /**
     * ポリシー設定を検証する
     */
    validatePolicy(policy: TrustPolicy): PolicyValidationResult;
    /**
     * 設定ファイルのバックアップを作成
     */
    private createBackup;
    /**
     * ハードコードされたデフォルトポリシーを返す
     */
    private getHardcodedDefaultPolicy;
    /**
     * キャッシュをクリア
     */
    clearCache(): void;
    /**
     * レポート生成の自動化設定を確認
     */
    isReportGenerationEnabled(): Promise<boolean>;
    /**
     * レポート生成のエラーハンドリング
     */
    private handleReportGenerationError;
}
