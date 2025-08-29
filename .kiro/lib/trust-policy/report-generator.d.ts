/**
 * Trust承認ポリシー更新レポート生成システム
 */
import { TrustPolicy, PolicyUpdateReport } from './types.js';
export declare class ReportGenerator {
    private reportsDir;
    constructor(reportsDir?: string);
    /**
     * Trust承認ポリシー更新レポートを生成する
     */
    generatePolicyUpdateReport(previousPolicy: TrustPolicy, newPolicy: TrustPolicy, generatedBy?: string): Promise<PolicyUpdateReport>;
    /**
     * ポリシー間の変更点を分析
     */
    private analyzeChanges;
    /**
     * 自動承認設定の変更を分析
     */
    private analyzeAutoApproveChanges;
    /**
     * 手動承認設定の変更を分析
     */
    private analyzeManualApproveChanges;
    /**
     * セキュリティ設定の変更を分析
     */
    private analyzeSecurityChanges;
    /**
     * 影響範囲を分析
     */
    private analyzeImpact;
    /**
     * セキュリティ影響を分析
     */
    private analyzeSecurityImpact;
    /**
     * パフォーマンス影響を分析
     */
    private analyzePerformanceImpact;
    /**
     * ユーザーエクスペリエンス影響を分析
     */
    private analyzeUserExperienceImpact;
    /**
     * 期待効果を分析
     */
    private analyzeExpectedEffects;
    /**
     * レポートをファイルに保存
     */
    private saveReportToFile;
    /**
     * Markdownレポートを生成
     */
    private generateMarkdownReport;
    private generateReportId;
    private compareArrays;
    private compareObjects;
    private getAffectedOperations;
    private countAutoApprovalOperations;
    private getChangeTypeLabel;
    private getRiskLevelLabel;
    private getDisruptionLevelLabel;
    private getEffectCategoryLabel;
    private getTimeframeLabel;
}
