import { Operation, RiskLevel } from './types.js';
/**
 * セキュリティ保護システム
 * 要件8.1, 8.2, 8.3に基づいて実装
 */
export declare class SecurityProtectionSystem {
    private policyManager;
    private auditLogger;
    private suspiciousPatternDetector;
    private configIntegrityVerifier;
    private externalRequestValidator;
    private securityState;
    constructor();
    /**
     * 包括的なセキュリティ検証を実行
     * 要件8.1, 8.2, 8.3のすべてを統合
     */
    performSecurityCheck(operation: Operation): Promise<SecurityCheckResult>;
    /**
     * セキュリティ状態を取得
     */
    getSecurityState(): SecurityStateInfo;
    /**
     * 手動承認モードから自動承認モードに復帰
     */
    restoreAutoApprovalMode(reason?: string): Promise<void>;
    /**
     * セキュリティ統計を取得
     */
    getSecurityStats(days?: number): Promise<SecurityStats>;
    /**
     * 設定ファイル改ざんを処理
     */
    private handleConfigTampering;
    /**
     * 外部脅威を処理
     */
    private handleExternalThreat;
    /**
     * 不審なパターンを処理
     */
    private handleSuspiciousPattern;
    /**
     * 手動承認モードに切り替え
     */
    private switchToManualApprovalMode;
}
export interface SecurityCheckResult {
    passed: boolean;
    reason: string;
    riskLevel: RiskLevel;
    action: SecurityAction;
}
export declare enum SecurityAction {
    ALLOW = "allow",
    REJECT_AND_LOG = "reject_and_log",
    SWITCH_TO_MANUAL_MODE = "switch_to_manual_mode",
    RESTORE_DEFAULT_CONFIG = "restore_default_config"
}
interface SecurityStateInfo {
    securityLevel: SecurityLevel;
    isManualApprovalMode: boolean;
    lastSecurityIncident: SecurityIncident | null;
    threatCount: number;
    lastStateChange: Date;
}
interface SecurityIncident {
    reason: string;
    timestamp: Date;
    previousLevel: SecurityLevel;
    newLevel: SecurityLevel;
}
declare enum SecurityLevel {
    NORMAL = 1,
    ELEVATED = 2,
    HIGH = 3,
    CRITICAL = 4
}
interface SecurityStats {
    currentSecurityLevel: SecurityLevel;
    isManualApprovalMode: boolean;
    lastSecurityIncident: SecurityIncident | null;
    configIntegrityStatus: ConfigIntegrityStatus;
    threatCount: number;
    securityEvents: number;
    suspiciousPatterns: number;
    externalThreats: number;
}
interface ConfigIntegrityStatus {
    isValid: boolean;
    lastChecked: Date;
    checksum: string;
    details: any;
}
export {};
