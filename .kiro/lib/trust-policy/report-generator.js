/**
 * Trust承認ポリシー更新レポート生成システム
 */
import { promises as fs } from 'fs';
import { join } from 'path';
import { RiskLevel } from './types.js';
export class ReportGenerator {
    reportsDir;
    constructor(reportsDir = '.kiro/reports') {
        this.reportsDir = reportsDir;
    }
    /**
     * Trust承認ポリシー更新レポートを生成する
     */
    async generatePolicyUpdateReport(previousPolicy, newPolicy, generatedBy = 'system') {
        const reportId = this.generateReportId();
        const timestamp = new Date();
        // 変更点を分析
        const changes = this.analyzeChanges(previousPolicy, newPolicy);
        // 影響範囲を分析
        const impactAnalysis = this.analyzeImpact(changes, previousPolicy, newPolicy);
        // 期待効果を分析
        const expectedEffects = this.analyzeExpectedEffects(changes, impactAnalysis);
        const report = {
            id: reportId,
            timestamp,
            previousPolicy,
            newPolicy,
            changes,
            impactAnalysis,
            expectedEffects,
            generatedBy
        };
        // レポートファイルを生成
        await this.saveReportToFile(report);
        return report;
    }
    /**
     * ポリシー間の変更点を分析
     */
    analyzeChanges(previousPolicy, newPolicy) {
        const changes = [];
        // autoApprove設定の変更を分析
        changes.push(...this.analyzeAutoApproveChanges(previousPolicy.autoApprove, newPolicy.autoApprove));
        // manualApprove設定の変更を分析
        changes.push(...this.analyzeManualApproveChanges(previousPolicy.manualApprove, newPolicy.manualApprove));
        // security設定の変更を分析
        changes.push(...this.analyzeSecurityChanges(previousPolicy.security, newPolicy.security));
        return changes;
    }
    /**
     * 自動承認設定の変更を分析
     */
    analyzeAutoApproveChanges(previous, current) {
        const changes = [];
        // Git操作の変更
        const gitChanges = this.compareArrays(previous.gitOperations, current.gitOperations);
        if (gitChanges.added.length > 0) {
            changes.push({
                section: 'autoApprove',
                field: 'gitOperations',
                changeType: 'added',
                newValue: gitChanges.added,
                description: `Git操作に自動承認を追加: ${gitChanges.added.join(', ')}`
            });
        }
        if (gitChanges.removed.length > 0) {
            changes.push({
                section: 'autoApprove',
                field: 'gitOperations',
                changeType: 'removed',
                previousValue: gitChanges.removed,
                description: `Git操作から自動承認を削除: ${gitChanges.removed.join(', ')}`
            });
        }
        // ファイル操作の変更
        const fileChanges = this.compareArrays(previous.fileOperations, current.fileOperations);
        if (fileChanges.added.length > 0) {
            changes.push({
                section: 'autoApprove',
                field: 'fileOperations',
                changeType: 'added',
                newValue: fileChanges.added,
                description: `ファイル操作に自動承認を追加: ${fileChanges.added.join(', ')}`
            });
        }
        if (fileChanges.removed.length > 0) {
            changes.push({
                section: 'autoApprove',
                field: 'fileOperations',
                changeType: 'removed',
                previousValue: fileChanges.removed,
                description: `ファイル操作から自動承認を削除: ${fileChanges.removed.join(', ')}`
            });
        }
        // CLI操作の変更
        const cliChanges = this.compareObjects(previous.cliOperations, current.cliOperations);
        for (const [tool, operations] of Object.entries(cliChanges.added)) {
            changes.push({
                section: 'autoApprove',
                field: 'cliOperations',
                changeType: 'added',
                newValue: { [tool]: operations },
                description: `${tool} CLI操作に自動承認を追加: ${operations.join(', ')}`
            });
        }
        for (const [tool, operations] of Object.entries(cliChanges.removed)) {
            changes.push({
                section: 'autoApprove',
                field: 'cliOperations',
                changeType: 'removed',
                previousValue: { [tool]: operations },
                description: `${tool} CLI操作から自動承認を削除: ${operations.join(', ')}`
            });
        }
        return changes;
    }
    /**
     * 手動承認設定の変更を分析
     */
    analyzeManualApproveChanges(previous, current) {
        const changes = [];
        // 削除操作の変更
        const deleteChanges = this.compareArrays(previous.deleteOperations, current.deleteOperations);
        if (deleteChanges.added.length > 0) {
            changes.push({
                section: 'manualApprove',
                field: 'deleteOperations',
                changeType: 'added',
                newValue: deleteChanges.added,
                description: `削除操作に手動承認を追加: ${deleteChanges.added.join(', ')}`
            });
        }
        if (deleteChanges.removed.length > 0) {
            changes.push({
                section: 'manualApprove',
                field: 'deleteOperations',
                changeType: 'removed',
                previousValue: deleteChanges.removed,
                description: `削除操作から手動承認を削除: ${deleteChanges.removed.join(', ')}`
            });
        }
        // 強制操作の変更
        const forceChanges = this.compareArrays(previous.forceOperations, current.forceOperations);
        if (forceChanges.added.length > 0) {
            changes.push({
                section: 'manualApprove',
                field: 'forceOperations',
                changeType: 'added',
                newValue: forceChanges.added,
                description: `強制操作に手動承認を追加: ${forceChanges.added.join(', ')}`
            });
        }
        if (forceChanges.removed.length > 0) {
            changes.push({
                section: 'manualApprove',
                field: 'forceOperations',
                changeType: 'removed',
                previousValue: forceChanges.removed,
                description: `強制操作から手動承認を削除: ${forceChanges.removed.join(', ')}`
            });
        }
        // 本番影響操作の変更
        const productionChanges = this.compareArrays(previous.productionImpact, current.productionImpact);
        if (productionChanges.added.length > 0) {
            changes.push({
                section: 'manualApprove',
                field: 'productionImpact',
                changeType: 'added',
                newValue: productionChanges.added,
                description: `本番影響操作に手動承認を追加: ${productionChanges.added.join(', ')}`
            });
        }
        if (productionChanges.removed.length > 0) {
            changes.push({
                section: 'manualApprove',
                field: 'productionImpact',
                changeType: 'removed',
                previousValue: productionChanges.removed,
                description: `本番影響操作から手動承認を削除: ${productionChanges.removed.join(', ')}`
            });
        }
        return changes;
    }
    /**
     * セキュリティ設定の変更を分析
     */
    analyzeSecurityChanges(previous, current) {
        const changes = [];
        if (previous.maxAutoApprovalPerHour !== current.maxAutoApprovalPerHour) {
            changes.push({
                section: 'security',
                field: 'maxAutoApprovalPerHour',
                changeType: 'modified',
                previousValue: previous.maxAutoApprovalPerHour,
                newValue: current.maxAutoApprovalPerHour,
                description: `最大自動承認数/時間を ${previous.maxAutoApprovalPerHour} から ${current.maxAutoApprovalPerHour} に変更`
            });
        }
        if (previous.suspiciousPatternDetection !== current.suspiciousPatternDetection) {
            changes.push({
                section: 'security',
                field: 'suspiciousPatternDetection',
                changeType: 'modified',
                previousValue: previous.suspiciousPatternDetection,
                newValue: current.suspiciousPatternDetection,
                description: `不審パターン検出を ${previous.suspiciousPatternDetection ? '有効' : '無効'} から ${current.suspiciousPatternDetection ? '有効' : '無効'} に変更`
            });
        }
        if (previous.logAllOperations !== current.logAllOperations) {
            changes.push({
                section: 'security',
                field: 'logAllOperations',
                changeType: 'modified',
                previousValue: previous.logAllOperations,
                newValue: current.logAllOperations,
                description: `全操作ログ記録を ${previous.logAllOperations ? '有効' : '無効'} から ${current.logAllOperations ? '有効' : '無効'} に変更`
            });
        }
        return changes;
    }
    /**
     * 影響範囲を分析
     */
    analyzeImpact(changes, previousPolicy, newPolicy) {
        const affectedOperations = this.getAffectedOperations(changes);
        const securityImpact = this.analyzeSecurityImpact(changes);
        const performanceImpact = this.analyzePerformanceImpact(changes, previousPolicy, newPolicy);
        const userExperienceImpact = this.analyzeUserExperienceImpact(changes);
        return {
            affectedOperations,
            securityImpact,
            performanceImpact,
            userExperienceImpact
        };
    }
    /**
     * セキュリティ影響を分析
     */
    analyzeSecurityImpact(changes) {
        let level = RiskLevel.LOW;
        const descriptions = [];
        const mitigations = [];
        for (const change of changes) {
            if (change.section === 'manualApprove' && change.changeType === 'removed') {
                level = RiskLevel.HIGH;
                descriptions.push(`手動承認の削除により、危険操作が自動実行される可能性があります`);
                mitigations.push('定期的な監査ログの確認');
                mitigations.push('不審パターン検出の有効化');
            }
            if (change.section === 'autoApprove' && change.changeType === 'added') {
                if (level === RiskLevel.LOW)
                    level = RiskLevel.MEDIUM;
                descriptions.push(`自動承認の追加により、新たな操作が自動実行されます`);
                mitigations.push('段階的な展開');
                mitigations.push('初期期間での集中監視');
            }
            if (change.field === 'suspiciousPatternDetection' && change.newValue === false) {
                level = RiskLevel.HIGH;
                descriptions.push(`不審パターン検出の無効化により、セキュリティリスクが増加します`);
                mitigations.push('手動での定期監視');
                mitigations.push('ログ分析の強化');
            }
        }
        return {
            level,
            description: descriptions.join('; ') || 'セキュリティへの影響は軽微です',
            mitigations: Array.from(new Set(mitigations))
        };
    }
    /**
     * パフォーマンス影響を分析
     */
    analyzePerformanceImpact(changes, previousPolicy, newPolicy) {
        let autoApprovalRateChange = 0;
        let responseTimeChange = 0;
        const descriptions = [];
        // 自動承認操作の増減を計算
        const previousAutoCount = this.countAutoApprovalOperations(previousPolicy);
        const newAutoCount = this.countAutoApprovalOperations(newPolicy);
        autoApprovalRateChange = ((newAutoCount - previousAutoCount) / Math.max(previousAutoCount, 1)) * 100;
        if (autoApprovalRateChange > 0) {
            descriptions.push(`自動承認操作の増加により、約${autoApprovalRateChange.toFixed(1)}%の効率向上が期待されます`);
            responseTimeChange = -10; // 10ms短縮
        }
        else if (autoApprovalRateChange < 0) {
            descriptions.push(`自動承認操作の減少により、約${Math.abs(autoApprovalRateChange).toFixed(1)}%の効率低下が予想されます`);
            responseTimeChange = 20; // 20ms増加
        }
        else {
            descriptions.push('パフォーマンスへの影響は軽微です');
        }
        return {
            expectedAutoApprovalRateChange: autoApprovalRateChange,
            expectedResponseTimeChange: responseTimeChange,
            description: descriptions.join('; ')
        };
    }
    /**
     * ユーザーエクスペリエンス影響を分析
     */
    analyzeUserExperienceImpact(changes) {
        let trustDialogFrequencyChange = 0;
        let workflowDisruptionLevel = 'none';
        const descriptions = [];
        for (const change of changes) {
            if (change.section === 'autoApprove' && change.changeType === 'added') {
                trustDialogFrequencyChange -= 5; // 5%減少
                descriptions.push('自動承認の追加により、Trustダイアログの表示頻度が減少します');
            }
            if (change.section === 'manualApprove' && change.changeType === 'added') {
                trustDialogFrequencyChange += 3; // 3%増加
                descriptions.push('手動承認の追加により、Trustダイアログの表示頻度が増加します');
                if (workflowDisruptionLevel === 'none')
                    workflowDisruptionLevel = 'minimal';
            }
            if (change.section === 'autoApprove' && change.changeType === 'removed') {
                trustDialogFrequencyChange += 10; // 10%増加
                descriptions.push('自動承認の削除により、作業フローの中断が増加します');
                workflowDisruptionLevel = 'moderate';
            }
        }
        return {
            trustDialogFrequencyChange,
            workflowDisruptionLevel,
            description: descriptions.join('; ') || 'ユーザーエクスペリエンスへの影響は軽微です'
        };
    }
    /**
     * 期待効果を分析
     */
    analyzeExpectedEffects(changes, impactAnalysis) {
        const effects = [];
        // セキュリティ効果
        if (impactAnalysis.securityImpact.level === RiskLevel.HIGH) {
            effects.push({
                category: 'security',
                description: 'セキュリティリスクの増加に対する適切な監視と対策が必要',
                timeframe: 'immediate',
                measurable: true,
                metrics: ['セキュリティインシデント数', '不審操作検出数']
            });
        }
        else {
            effects.push({
                category: 'security',
                description: 'セキュリティレベルの維持または向上',
                timeframe: 'short-term',
                measurable: true,
                metrics: ['監査ログ完全性', 'ポリシー違反検出率']
            });
        }
        // パフォーマンス効果
        if (impactAnalysis.performanceImpact.expectedAutoApprovalRateChange > 0) {
            effects.push({
                category: 'performance',
                description: `自動承認率の向上により、開発効率が${impactAnalysis.performanceImpact.expectedAutoApprovalRateChange.toFixed(1)}%向上`,
                timeframe: 'immediate',
                measurable: true,
                metrics: ['自動承認率', '平均応答時間', '操作完了時間']
            });
        }
        // ユーザビリティ効果
        if (impactAnalysis.userExperienceImpact.trustDialogFrequencyChange < 0) {
            effects.push({
                category: 'usability',
                description: 'Trustダイアログの表示頻度減少により、作業フローの中断が軽減',
                timeframe: 'immediate',
                measurable: true,
                metrics: ['ダイアログ表示回数', 'ユーザー満足度', '作業中断回数']
            });
        }
        // メンテナンス効果
        effects.push({
            category: 'maintenance',
            description: 'ポリシー設定の最適化により、長期的な運用コストが改善',
            timeframe: 'long-term',
            measurable: false,
            metrics: ['運用工数', 'サポート問い合わせ数']
        });
        return effects;
    }
    /**
     * レポートをファイルに保存
     */
    async saveReportToFile(report) {
        try {
            // レポートディレクトリを作成
            await fs.mkdir(this.reportsDir, { recursive: true });
            // ファイル名を生成
            const dateStr = report.timestamp.toISOString().split('T')[0];
            const filename = `trust-policy-update-${dateStr}.md`;
            const filepath = join(this.reportsDir, filename);
            // Markdownレポートを生成
            const markdown = this.generateMarkdownReport(report);
            // ファイルに書き込み
            await fs.writeFile(filepath, markdown, 'utf-8');
            console.log(`Trust承認ポリシー更新レポートを生成しました: ${filepath}`);
        }
        catch (error) {
            console.error('レポート生成エラー:', error);
            throw new Error(`レポートファイルの保存に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Markdownレポートを生成
     */
    generateMarkdownReport(report) {
        const { timestamp, changes, impactAnalysis, expectedEffects } = report;
        return `# Trust承認ポリシー更新レポート

## 基本情報

- **レポートID**: ${report.id}
- **生成日時**: ${timestamp.toLocaleString('ja-JP')}
- **生成者**: ${report.generatedBy}
- **ポリシーバージョン**: ${report.previousPolicy.version} → ${report.newPolicy.version}

## 変更概要

${changes.length === 0 ? '変更はありません。' : `合計 ${changes.length} 件の変更が検出されました。`}

${changes.map(change => `### ${change.section}.${change.field}

- **変更タイプ**: ${this.getChangeTypeLabel(change.changeType)}
- **説明**: ${change.description}
${change.previousValue ? `- **変更前**: \`${JSON.stringify(change.previousValue)}\`` : ''}
${change.newValue ? `- **変更後**: \`${JSON.stringify(change.newValue)}\`` : ''}
`).join('\n')}

## 影響範囲分析

### 影響を受ける操作
${impactAnalysis.affectedOperations.length === 0 ? '影響を受ける操作はありません。' :
            impactAnalysis.affectedOperations.map(op => `- ${op}`).join('\n')}

### セキュリティ影響
- **リスクレベル**: ${this.getRiskLevelLabel(impactAnalysis.securityImpact.level)}
- **説明**: ${impactAnalysis.securityImpact.description}
${impactAnalysis.securityImpact.mitigations.length > 0 ? `
**推奨される軽減策**:
${impactAnalysis.securityImpact.mitigations.map(m => `- ${m}`).join('\n')}` : ''}

### パフォーマンス影響
- **自動承認率変化**: ${impactAnalysis.performanceImpact.expectedAutoApprovalRateChange > 0 ? '+' : ''}${impactAnalysis.performanceImpact.expectedAutoApprovalRateChange.toFixed(1)}%
- **応答時間変化**: ${impactAnalysis.performanceImpact.expectedResponseTimeChange > 0 ? '+' : ''}${impactAnalysis.performanceImpact.expectedResponseTimeChange}ms
- **説明**: ${impactAnalysis.performanceImpact.description}

### ユーザーエクスペリエンス影響
- **Trustダイアログ頻度変化**: ${impactAnalysis.userExperienceImpact.trustDialogFrequencyChange > 0 ? '+' : ''}${impactAnalysis.userExperienceImpact.trustDialogFrequencyChange}%
- **作業フロー中断レベル**: ${this.getDisruptionLevelLabel(impactAnalysis.userExperienceImpact.workflowDisruptionLevel)}
- **説明**: ${impactAnalysis.userExperienceImpact.description}

## 期待効果

${expectedEffects.map(effect => `### ${this.getEffectCategoryLabel(effect.category)}

- **説明**: ${effect.description}
- **期間**: ${this.getTimeframeLabel(effect.timeframe)}
- **測定可能**: ${effect.measurable ? 'はい' : 'いいえ'}
${effect.metrics && effect.metrics.length > 0 ? `- **メトリクス**: ${effect.metrics.join(', ')}` : ''}
`).join('\n')}

## 推奨事項

1. **段階的展開**: 変更を段階的に適用し、各段階で動作を確認してください
2. **監視強化**: 変更後は監査ログを注意深く監視してください
3. **バックアップ**: 変更前の設定をバックアップとして保存してください
4. **テスト実行**: 主要な操作パターンでテストを実行してください

## 設定変更詳細

### 変更前の設定
\`\`\`json
${JSON.stringify(report.previousPolicy, null, 2)}
\`\`\`

### 変更後の設定
\`\`\`json
${JSON.stringify(report.newPolicy, null, 2)}
\`\`\`

---

*このレポートは Trust Policy Report Generator により自動生成されました。*
`;
    }
    // ヘルパーメソッド
    generateReportId() {
        return `trust-policy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    compareArrays(arr1, arr2) {
        const set1 = new Set(arr1 || []);
        const set2 = new Set(arr2 || []);
        return {
            added: Array.from(set2).filter(x => !set1.has(x)),
            removed: Array.from(set1).filter(x => !set2.has(x))
        };
    }
    compareObjects(obj1, obj2) {
        const added = {};
        const removed = {};
        // 新しく追加されたキーまたは値
        for (const [key, values] of Object.entries(obj2 || {})) {
            if (!obj1 || !obj1[key]) {
                added[key] = values;
            }
            else {
                const diff = this.compareArrays(obj1[key], values);
                if (diff.added.length > 0) {
                    added[key] = diff.added;
                }
            }
        }
        // 削除されたキーまたは値
        for (const [key, values] of Object.entries(obj1 || {})) {
            if (!obj2 || !obj2[key]) {
                removed[key] = values;
            }
            else {
                const diff = this.compareArrays(values, obj2[key]);
                if (diff.removed.length > 0) {
                    removed[key] = diff.removed;
                }
            }
        }
        return { added, removed };
    }
    getAffectedOperations(changes) {
        const operations = new Set();
        for (const change of changes) {
            if (change.section === 'autoApprove' || change.section === 'manualApprove') {
                if (Array.isArray(change.newValue)) {
                    change.newValue.forEach(op => operations.add(op));
                }
                if (Array.isArray(change.previousValue)) {
                    change.previousValue.forEach(op => operations.add(op));
                }
            }
        }
        return Array.from(operations);
    }
    countAutoApprovalOperations(policy) {
        let count = 0;
        count += policy.autoApprove.gitOperations?.length || 0;
        count += policy.autoApprove.fileOperations?.length || 0;
        for (const operations of Object.values(policy.autoApprove.cliOperations || {})) {
            count += operations.length;
        }
        return count;
    }
    // ラベル変換メソッド
    getChangeTypeLabel(type) {
        const labels = {
            'added': '追加',
            'removed': '削除',
            'modified': '変更'
        };
        return labels[type] || type;
    }
    getRiskLevelLabel(level) {
        const labels = {
            [RiskLevel.LOW]: '低',
            [RiskLevel.MEDIUM]: '中',
            [RiskLevel.HIGH]: '高',
            [RiskLevel.CRITICAL]: '重大'
        };
        return labels[level];
    }
    getDisruptionLevelLabel(level) {
        const labels = {
            'none': 'なし',
            'minimal': '最小限',
            'moderate': '中程度',
            'significant': '重大'
        };
        return labels[level] || level;
    }
    getEffectCategoryLabel(category) {
        const labels = {
            'security': 'セキュリティ',
            'performance': 'パフォーマンス',
            'usability': 'ユーザビリティ',
            'maintenance': 'メンテナンス'
        };
        return labels[category] || category;
    }
    getTimeframeLabel(timeframe) {
        const labels = {
            'immediate': '即座',
            'short-term': '短期',
            'long-term': '長期'
        };
        return labels[timeframe] || timeframe;
    }
}
