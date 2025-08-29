#!/usr/bin/env node

/**
 * Trust承認ポリシーレポート生成システムのデモ
 */

import { promises as fs } from 'fs';
import { join } from 'path';

// ReportGeneratorクラスの簡易実装（デモ用）
class ReportGenerator {
  constructor(reportsDir = '.kiro/reports') {
    this.reportsDir = reportsDir;
  }

  async generatePolicyUpdateReport(previousPolicy, newPolicy, generatedBy = 'system') {
    const reportId = `trust-policy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date();

    // 簡易的な変更分析
    const changes = this.analyzeChanges(previousPolicy, newPolicy);
    
    const report = {
      id: reportId,
      timestamp,
      previousPolicy,
      newPolicy,
      changes,
      impactAnalysis: {
        affectedOperations: this.getAffectedOperations(changes),
        securityImpact: { level: 'medium', description: 'セキュリティへの影響は中程度です' },
        performanceImpact: { 
          expectedAutoApprovalRateChange: changes.length > 0 ? 15.5 : 0,
          expectedResponseTimeChange: changes.length > 0 ? -10 : 0,
          description: changes.length > 0 ? '自動承認の増加により効率向上が期待されます' : 'パフォーマンスへの影響はありません'
        },
        userExperienceImpact: {
          trustDialogFrequencyChange: changes.length > 0 ? -8 : 0,
          workflowDisruptionLevel: 'minimal',
          description: changes.length > 0 ? 'Trustダイアログの表示頻度が減少します' : 'ユーザーエクスペリエンスへの影響はありません'
        }
      },
      expectedEffects: [
        {
          category: 'performance',
          description: '自動承認率の向上により、開発効率が向上',
          timeframe: 'immediate',
          measurable: true,
          metrics: ['自動承認率', '平均応答時間']
        },
        {
          category: 'usability',
          description: 'Trustダイアログの表示頻度減少により、作業フローの中断が軽減',
          timeframe: 'immediate',
          measurable: true,
          metrics: ['ダイアログ表示回数', 'ユーザー満足度']
        }
      ],
      generatedBy
    };

    // レポートファイルを生成
    await this.saveReportToFile(report);

    return report;
  }

  analyzeChanges(previousPolicy, newPolicy) {
    const changes = [];

    // Git操作の変更をチェック
    const prevGit = previousPolicy.autoApprove?.gitOperations || [];
    const newGit = newPolicy.autoApprove?.gitOperations || [];
    const addedGit = newGit.filter(op => !prevGit.includes(op));
    const removedGit = prevGit.filter(op => !newGit.includes(op));

    if (addedGit.length > 0) {
      changes.push({
        section: 'autoApprove',
        field: 'gitOperations',
        changeType: 'added',
        newValue: addedGit,
        description: `Git操作に自動承認を追加: ${addedGit.join(', ')}`
      });
    }

    if (removedGit.length > 0) {
      changes.push({
        section: 'autoApprove',
        field: 'gitOperations',
        changeType: 'removed',
        previousValue: removedGit,
        description: `Git操作から自動承認を削除: ${removedGit.join(', ')}`
      });
    }

    // ファイル操作の変更をチェック
    const prevFile = previousPolicy.autoApprove?.fileOperations || [];
    const newFile = newPolicy.autoApprove?.fileOperations || [];
    const addedFile = newFile.filter(op => !prevFile.includes(op));
    const removedFile = prevFile.filter(op => !newFile.includes(op));

    if (addedFile.length > 0) {
      changes.push({
        section: 'autoApprove',
        field: 'fileOperations',
        changeType: 'added',
        newValue: addedFile,
        description: `ファイル操作に自動承認を追加: ${addedFile.join(', ')}`
      });
    }

    if (removedFile.length > 0) {
      changes.push({
        section: 'autoApprove',
        field: 'fileOperations',
        changeType: 'removed',
        previousValue: removedFile,
        description: `ファイル操作から自動承認を削除: ${removedFile.join(', ')}`
      });
    }

    // セキュリティ設定の変更をチェック
    if (previousPolicy.security?.maxAutoApprovalPerHour !== newPolicy.security?.maxAutoApprovalPerHour) {
      changes.push({
        section: 'security',
        field: 'maxAutoApprovalPerHour',
        changeType: 'modified',
        previousValue: previousPolicy.security?.maxAutoApprovalPerHour,
        newValue: newPolicy.security?.maxAutoApprovalPerHour,
        description: `最大自動承認数/時間を ${previousPolicy.security?.maxAutoApprovalPerHour} から ${newPolicy.security?.maxAutoApprovalPerHour} に変更`
      });
    }

    return changes;
  }

  getAffectedOperations(changes) {
    const operations = new Set();
    for (const change of changes) {
      if (Array.isArray(change.newValue)) {
        change.newValue.forEach(op => operations.add(op));
      }
      if (Array.isArray(change.previousValue)) {
        change.previousValue.forEach(op => operations.add(op));
      }
    }
    return Array.from(operations);
  }

  async saveReportToFile(report) {
    try {
      await fs.mkdir(this.reportsDir, { recursive: true });
      
      const dateStr = report.timestamp.toISOString().split('T')[0];
      const filename = `trust-policy-update-${dateStr}.md`;
      const filepath = join(this.reportsDir, filename);
      
      const markdown = this.generateMarkdownReport(report);
      await fs.writeFile(filepath, markdown, 'utf-8');
      
      console.log(`Trust承認ポリシー更新レポートを生成しました: ${filepath}`);
    } catch (error) {
      console.error('レポート生成エラー:', error);
      throw new Error(`レポートファイルの保存に失敗しました: ${error.message}`);
    }
  }

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

- **変更タイプ**: ${change.changeType === 'added' ? '追加' : change.changeType === 'removed' ? '削除' : '変更'}
- **説明**: ${change.description}
${change.previousValue ? `- **変更前**: \`${JSON.stringify(change.previousValue)}\`` : ''}
${change.newValue ? `- **変更後**: \`${JSON.stringify(change.newValue)}\`` : ''}
`).join('\n')}

## 影響範囲分析

### 影響を受ける操作
${impactAnalysis.affectedOperations.length === 0 ? '影響を受ける操作はありません。' : 
impactAnalysis.affectedOperations.map(op => `- ${op}`).join('\n')}

### セキュリティ影響
- **リスクレベル**: ${impactAnalysis.securityImpact.level}
- **説明**: ${impactAnalysis.securityImpact.description}

### パフォーマンス影響
- **自動承認率変化**: ${impactAnalysis.performanceImpact.expectedAutoApprovalRateChange > 0 ? '+' : ''}${impactAnalysis.performanceImpact.expectedAutoApprovalRateChange.toFixed(1)}%
- **応答時間変化**: ${impactAnalysis.performanceImpact.expectedResponseTimeChange > 0 ? '+' : ''}${impactAnalysis.performanceImpact.expectedResponseTimeChange}ms
- **説明**: ${impactAnalysis.performanceImpact.description}

### ユーザーエクスペリエンス影響
- **Trustダイアログ頻度変化**: ${impactAnalysis.userExperienceImpact.trustDialogFrequencyChange > 0 ? '+' : ''}${impactAnalysis.userExperienceImpact.trustDialogFrequencyChange}%
- **作業フロー中断レベル**: ${impactAnalysis.userExperienceImpact.workflowDisruptionLevel}
- **説明**: ${impactAnalysis.userExperienceImpact.description}

## 期待効果

${expectedEffects.map(effect => `### ${effect.category}

- **説明**: ${effect.description}
- **期間**: ${effect.timeframe}
- **測定可能**: ${effect.measurable ? 'はい' : 'いいえ'}
${effect.metrics && effect.metrics.length > 0 ? `- **メトリクス**: ${effect.metrics.join(', ')}` : ''}
`).join('\n')}

## 推奨事項

1. **段階的展開**: 変更を段階的に適用し、各段階で動作を確認してください
2. **監視強化**: 変更後は監査ログを注意深く監視してください
3. **バックアップ**: 変更前の設定をバックアップとして保存してください
4. **テスト実行**: 主要な操作パターンでテストを実行してください

---

*このレポートは Trust Policy Report Generator により自動生成されました。*
`;
  }
}

// サンプルポリシーデータ
const previousPolicy = {
  version: '1.0',
  lastUpdated: '2025-08-27T10:00:00Z',
  autoApprove: {
    gitOperations: ['status', 'commit', 'push'],
    fileOperations: ['read', 'write'],
    cliOperations: {
      vercel: ['env ls', 'status']
    },
    scriptExecution: {
      extensions: ['.mjs'],
      allowedPaths: ['scripts/']
    }
  },
  manualApprove: {
    deleteOperations: ['rm -rf', 'git branch -D'],
    forceOperations: ['git push --force'],
    productionImpact: ['github:write', 'sanity-dev:write']
  },
  security: {
    maxAutoApprovalPerHour: 1000,
    suspiciousPatternDetection: true,
    logAllOperations: true
  }
};

const newPolicy = {
  version: '1.1',
  lastUpdated: '2025-08-27T12:00:00Z',
  autoApprove: {
    gitOperations: ['status', 'commit', 'push', 'pull', 'merge'], // pull, mergeを追加
    fileOperations: ['read', 'write', 'create'], // createを追加
    cliOperations: {
      vercel: ['env ls', 'status', 'deployments ls'], // deployments lsを追加
      git: ['status', 'log'] // 新しいツールを追加
    },
    scriptExecution: {
      extensions: ['.mjs', '.js'], // .jsを追加
      allowedPaths: ['scripts/', '.kiro/scripts/'] // .kiro/scripts/を追加
    }
  },
  manualApprove: {
    deleteOperations: ['rm -rf', 'git branch -D', 'vercel env rm'], // vercel env rmを追加
    forceOperations: ['git push --force', 'git reset --hard'], // git reset --hardを追加
    productionImpact: ['github:write', 'sanity-dev:write', 'vercel:envSet'] // vercel:envSetを追加
  },
  security: {
    maxAutoApprovalPerHour: 2000, // 1000から2000に変更
    suspiciousPatternDetection: true, // 変更なし
    logAllOperations: true // 変更なし
  }
};

async function runDemo() {
  console.log('🚀 Trust承認ポリシーレポート生成システム デモ');
  console.log('=' .repeat(60));

  try {
    const reportGenerator = new ReportGenerator('.kiro/reports');

    console.log('\n📊 レポート生成中...');
    const report = await reportGenerator.generatePolicyUpdateReport(
      previousPolicy,
      newPolicy,
      'demo-user'
    );

    console.log('\n✅ レポート生成完了!');
    console.log(`📄 レポートID: ${report.id}`);
    console.log(`📅 生成日時: ${report.timestamp.toLocaleString('ja-JP')}`);
    console.log(`👤 生成者: ${report.generatedBy}`);
    console.log(`🔄 バージョン: ${report.previousPolicy.version} → ${report.newPolicy.version}`);

    console.log('\n📋 変更概要:');
    if (report.changes.length === 0) {
      console.log('  変更はありません');
    } else {
      report.changes.forEach((change, index) => {
        console.log(`  ${index + 1}. ${change.section}.${change.field}`);
        console.log(`     タイプ: ${change.changeType}`);
        console.log(`     説明: ${change.description}`);
        if (change.previousValue) {
          console.log(`     変更前: ${JSON.stringify(change.previousValue)}`);
        }
        if (change.newValue) {
          console.log(`     変更後: ${JSON.stringify(change.newValue)}`);
        }
        console.log('');
      });
    }

    console.log('🎯 影響範囲分析:');
    console.log(`  影響を受ける操作数: ${report.impactAnalysis.affectedOperations.length}`);
    console.log(`  セキュリティリスクレベル: ${report.impactAnalysis.securityImpact.level}`);
    console.log(`  自動承認率変化: ${report.impactAnalysis.performanceImpact.expectedAutoApprovalRateChange.toFixed(1)}%`);
    console.log(`  応答時間変化: ${report.impactAnalysis.performanceImpact.expectedResponseTimeChange}ms`);
    console.log(`  Trustダイアログ頻度変化: ${report.impactAnalysis.userExperienceImpact.trustDialogFrequencyChange}%`);

    console.log('\n🎉 期待効果:');
    report.expectedEffects.forEach((effect, index) => {
      console.log(`  ${index + 1}. ${effect.category}: ${effect.description}`);
      console.log(`     期間: ${effect.timeframe}`);
      console.log(`     測定可能: ${effect.measurable ? 'はい' : 'いいえ'}`);
      if (effect.metrics && effect.metrics.length > 0) {
        console.log(`     メトリクス: ${effect.metrics.join(', ')}`);
      }
      console.log('');
    });

    console.log('💡 推奨事項:');
    console.log('  1. 段階的展開: 変更を段階的に適用し、各段階で動作を確認');
    console.log('  2. 監視強化: 変更後は監査ログを注意深く監視');
    console.log('  3. バックアップ: 変更前の設定をバックアップとして保存');
    console.log('  4. テスト実行: 主要な操作パターンでテストを実行');

    console.log('\n📁 レポートファイルが生成されました:');
    const dateStr = report.timestamp.toISOString().split('T')[0];
    console.log(`  .kiro/reports/trust-policy-update-${dateStr}.md`);

  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
    process.exit(1);
  }
}

// デモ実行
if (import.meta.url === `file://${process.argv[1]}`) {
  runDemo().catch(console.error);
}

export { runDemo };