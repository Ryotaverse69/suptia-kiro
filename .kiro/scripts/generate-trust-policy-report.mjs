#!/usr/bin/env node

/**
 * Trust承認ポリシー更新レポート生成CLI
 */

import { promises as fs } from 'fs';
import { join } from 'path';

// ReportGeneratorクラスの簡易実装（CLI用）
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
        securityImpact: { 
          level: this.calculateSecurityRisk(changes), 
          description: this.getSecurityDescription(changes) 
        },
        performanceImpact: { 
          expectedAutoApprovalRateChange: this.calculatePerformanceChange(changes),
          expectedResponseTimeChange: changes.length > 0 ? -10 : 0,
          description: this.getPerformanceDescription(changes)
        },
        userExperienceImpact: {
          trustDialogFrequencyChange: this.calculateUXChange(changes),
          workflowDisruptionLevel: changes.length > 5 ? 'moderate' : changes.length > 0 ? 'minimal' : 'none',
          description: this.getUXDescription(changes)
        }
      },
      expectedEffects: this.generateExpectedEffects(changes),
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
    this.addArrayChanges(changes, 'autoApprove', 'gitOperations', prevGit, newGit, 'Git操作');

    // ファイル操作の変更をチェック
    const prevFile = previousPolicy.autoApprove?.fileOperations || [];
    const newFile = newPolicy.autoApprove?.fileOperations || [];
    this.addArrayChanges(changes, 'autoApprove', 'fileOperations', prevFile, newFile, 'ファイル操作');

    // CLI操作の変更をチェック
    const prevCli = previousPolicy.autoApprove?.cliOperations || {};
    const newCli = newPolicy.autoApprove?.cliOperations || {};
    this.addObjectChanges(changes, 'autoApprove', 'cliOperations', prevCli, newCli, 'CLI操作');

    // 手動承認設定の変更をチェック
    const prevDelete = previousPolicy.manualApprove?.deleteOperations || [];
    const newDelete = newPolicy.manualApprove?.deleteOperations || [];
    this.addArrayChanges(changes, 'manualApprove', 'deleteOperations', prevDelete, newDelete, '削除操作');

    const prevForce = previousPolicy.manualApprove?.forceOperations || [];
    const newForce = newPolicy.manualApprove?.forceOperations || [];
    this.addArrayChanges(changes, 'manualApprove', 'forceOperations', prevForce, newForce, '強制操作');

    const prevProd = previousPolicy.manualApprove?.productionImpact || [];
    const newProd = newPolicy.manualApprove?.productionImpact || [];
    this.addArrayChanges(changes, 'manualApprove', 'productionImpact', prevProd, newProd, '本番影響操作');

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

    if (previousPolicy.security?.suspiciousPatternDetection !== newPolicy.security?.suspiciousPatternDetection) {
      changes.push({
        section: 'security',
        field: 'suspiciousPatternDetection',
        changeType: 'modified',
        previousValue: previousPolicy.security?.suspiciousPatternDetection,
        newValue: newPolicy.security?.suspiciousPatternDetection,
        description: `不審パターン検出を ${previousPolicy.security?.suspiciousPatternDetection ? '有効' : '無効'} から ${newPolicy.security?.suspiciousPatternDetection ? '有効' : '無効'} に変更`
      });
    }

    return changes;
  }

  addArrayChanges(changes, section, field, prevArray, newArray, label) {
    const added = newArray.filter(op => !prevArray.includes(op));
    const removed = prevArray.filter(op => !newArray.includes(op));

    if (added.length > 0) {
      changes.push({
        section,
        field,
        changeType: 'added',
        newValue: added,
        description: `${label}に自動承認を追加: ${added.join(', ')}`
      });
    }

    if (removed.length > 0) {
      changes.push({
        section,
        field,
        changeType: 'removed',
        previousValue: removed,
        description: `${label}から自動承認を削除: ${removed.join(', ')}`
      });
    }
  }

  addObjectChanges(changes, section, field, prevObj, newObj, label) {
    const allKeys = new Set([...Object.keys(prevObj), ...Object.keys(newObj)]);
    
    for (const key of allKeys) {
      const prevOps = prevObj[key] || [];
      const newOps = newObj[key] || [];
      
      if (JSON.stringify(prevOps) !== JSON.stringify(newOps)) {
        const added = newOps.filter(op => !prevOps.includes(op));
        const removed = prevOps.filter(op => !newOps.includes(op));
        
        if (added.length > 0) {
          changes.push({
            section,
            field,
            changeType: 'added',
            newValue: { [key]: added },
            description: `${key} ${label}に自動承認を追加: ${added.join(', ')}`
          });
        }
        
        if (removed.length > 0) {
          changes.push({
            section,
            field,
            changeType: 'removed',
            previousValue: { [key]: removed },
            description: `${key} ${label}から自動承認を削除: ${removed.join(', ')}`
          });
        }
      }
    }
  }

  calculateSecurityRisk(changes) {
    let riskLevel = 'low';
    
    for (const change of changes) {
      if (change.section === 'manualApprove' && change.changeType === 'removed') {
        riskLevel = 'high';
      } else if (change.field === 'suspiciousPatternDetection' && change.newValue === false) {
        riskLevel = 'high';
      } else if (change.section === 'autoApprove' && change.changeType === 'added') {
        if (riskLevel === 'low') riskLevel = 'medium';
      }
    }
    
    return riskLevel;
  }

  getSecurityDescription(changes) {
    const descriptions = [];
    
    for (const change of changes) {
      if (change.section === 'manualApprove' && change.changeType === 'removed') {
        descriptions.push('手動承認の削除により、危険操作が自動実行される可能性があります');
      } else if (change.field === 'suspiciousPatternDetection' && change.newValue === false) {
        descriptions.push('不審パターン検出の無効化により、セキュリティリスクが増加します');
      } else if (change.section === 'autoApprove' && change.changeType === 'added') {
        descriptions.push('自動承認の追加により、新たな操作が自動実行されます');
      }
    }
    
    return descriptions.length > 0 ? descriptions.join('; ') : 'セキュリティへの影響は軽微です';
  }

  calculatePerformanceChange(changes) {
    let autoApprovalIncrease = 0;
    
    for (const change of changes) {
      if (change.section === 'autoApprove' && change.changeType === 'added') {
        if (Array.isArray(change.newValue)) {
          autoApprovalIncrease += change.newValue.length * 5; // 1操作あたり5%向上と仮定
        }
      } else if (change.section === 'autoApprove' && change.changeType === 'removed') {
        if (Array.isArray(change.previousValue)) {
          autoApprovalIncrease -= change.previousValue.length * 5;
        }
      }
    }
    
    return Math.min(Math.max(autoApprovalIncrease, -50), 50); // -50%から+50%の範囲
  }

  getPerformanceDescription(changes) {
    const performanceChange = this.calculatePerformanceChange(changes);
    
    if (performanceChange > 0) {
      return `自動承認操作の増加により、約${performanceChange.toFixed(1)}%の効率向上が期待されます`;
    } else if (performanceChange < 0) {
      return `自動承認操作の減少により、約${Math.abs(performanceChange).toFixed(1)}%の効率低下が予想されます`;
    } else {
      return 'パフォーマンスへの影響は軽微です';
    }
  }

  calculateUXChange(changes) {
    let dialogChange = 0;
    
    for (const change of changes) {
      if (change.section === 'autoApprove' && change.changeType === 'added') {
        dialogChange -= 5; // 自動承認増加でダイアログ減少
      } else if (change.section === 'manualApprove' && change.changeType === 'added') {
        dialogChange += 3; // 手動承認増加でダイアログ増加
      } else if (change.section === 'autoApprove' && change.changeType === 'removed') {
        dialogChange += 10; // 自動承認削除でダイアログ大幅増加
      }
    }
    
    return Math.min(Math.max(dialogChange, -30), 30); // -30%から+30%の範囲
  }

  getUXDescription(changes) {
    const uxChange = this.calculateUXChange(changes);
    
    if (uxChange < 0) {
      return 'Trustダイアログの表示頻度が減少し、作業フローの中断が軽減されます';
    } else if (uxChange > 0) {
      return 'Trustダイアログの表示頻度が増加し、作業フローの中断が増える可能性があります';
    } else {
      return 'ユーザーエクスペリエンスへの影響は軽微です';
    }
  }

  generateExpectedEffects(changes) {
    const effects = [];
    
    // セキュリティ効果
    const securityRisk = this.calculateSecurityRisk(changes);
    if (securityRisk === 'high') {
      effects.push({
        category: 'security',
        description: 'セキュリティリスクの増加に対する適切な監視と対策が必要',
        timeframe: 'immediate',
        measurable: true,
        metrics: ['セキュリティインシデント数', '不審操作検出数']
      });
    } else {
      effects.push({
        category: 'security',
        description: 'セキュリティレベルの維持または向上',
        timeframe: 'short-term',
        measurable: true,
        metrics: ['監査ログ完全性', 'ポリシー違反検出率']
      });
    }
    
    // パフォーマンス効果
    const performanceChange = this.calculatePerformanceChange(changes);
    if (performanceChange > 0) {
      effects.push({
        category: 'performance',
        description: `自動承認率の向上により、開発効率が${performanceChange.toFixed(1)}%向上`,
        timeframe: 'immediate',
        measurable: true,
        metrics: ['自動承認率', '平均応答時間', '操作完了時間']
      });
    }
    
    // ユーザビリティ効果
    const uxChange = this.calculateUXChange(changes);
    if (uxChange < 0) {
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

  getAffectedOperations(changes) {
    const operations = new Set();
    for (const change of changes) {
      if (Array.isArray(change.newValue)) {
        change.newValue.forEach(op => operations.add(op));
      }
      if (Array.isArray(change.previousValue)) {
        change.previousValue.forEach(op => operations.add(op));
      }
      if (typeof change.newValue === 'object' && change.newValue !== null) {
        Object.values(change.newValue).flat().forEach(op => operations.add(op));
      }
      if (typeof change.previousValue === 'object' && change.previousValue !== null) {
        Object.values(change.previousValue).flat().forEach(op => operations.add(op));
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
- **リスクレベル**: ${impactAnalysis.securityImpact.level === 'low' ? '低' : impactAnalysis.securityImpact.level === 'medium' ? '中' : '高'}
- **説明**: ${impactAnalysis.securityImpact.description}

### パフォーマンス影響
- **自動承認率変化**: ${impactAnalysis.performanceImpact.expectedAutoApprovalRateChange > 0 ? '+' : ''}${impactAnalysis.performanceImpact.expectedAutoApprovalRateChange.toFixed(1)}%
- **応答時間変化**: ${impactAnalysis.performanceImpact.expectedResponseTimeChange > 0 ? '+' : ''}${impactAnalysis.performanceImpact.expectedResponseTimeChange}ms
- **説明**: ${impactAnalysis.performanceImpact.description}

### ユーザーエクスペリエンス影響
- **Trustダイアログ頻度変化**: ${impactAnalysis.userExperienceImpact.trustDialogFrequencyChange > 0 ? '+' : ''}${impactAnalysis.userExperienceImpact.trustDialogFrequencyChange}%
- **作業フロー中断レベル**: ${impactAnalysis.userExperienceImpact.workflowDisruptionLevel === 'none' ? 'なし' : impactAnalysis.userExperienceImpact.workflowDisruptionLevel === 'minimal' ? '最小限' : impactAnalysis.userExperienceImpact.workflowDisruptionLevel === 'moderate' ? '中程度' : '重大'}
- **説明**: ${impactAnalysis.userExperienceImpact.description}

## 期待効果

${expectedEffects.map(effect => `### ${effect.category === 'security' ? 'セキュリティ' : effect.category === 'performance' ? 'パフォーマンス' : effect.category === 'usability' ? 'ユーザビリティ' : 'メンテナンス'}

- **説明**: ${effect.description}
- **期間**: ${effect.timeframe === 'immediate' ? '即座' : effect.timeframe === 'short-term' ? '短期' : '長期'}
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
}

const USAGE = `
Trust承認ポリシー更新レポート生成ツール

使用方法:
  node .kiro/scripts/generate-trust-policy-report.mjs [options]

オプション:
  --previous <file>    変更前のポリシーファイルパス
  --current <file>     変更後のポリシーファイルパス
  --output <dir>       レポート出力ディレクトリ (デフォルト: .kiro/reports)
  --user <name>        レポート生成者名 (デフォルト: cli-user)
  --help, -h           このヘルプを表示

例:
  # 現在のポリシーと前回のバックアップを比較
  node .kiro/scripts/generate-trust-policy-report.mjs \\
    --previous .kiro/settings/trust-policy.backup.2025-08-27.json \\
    --current .kiro/settings/trust-policy.json

  # カスタム出力ディレクトリを指定
  node .kiro/scripts/generate-trust-policy-report.mjs \\
    --previous old-policy.json \\
    --current new-policy.json \\
    --output ./reports \\
    --user admin
`;

async function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    previous: null,
    current: null,
    output: '.kiro/reports',
    user: 'cli-user'
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case '--help':
      case '-h':
        console.log(USAGE);
        process.exit(0);
        break;
      case '--previous':
        if (!nextArg) {
          throw new Error('--previous requires a file path');
        }
        options.previous = nextArg;
        i++;
        break;
      case '--current':
        if (!nextArg) {
          throw new Error('--current requires a file path');
        }
        options.current = nextArg;
        i++;
        break;
      case '--output':
        if (!nextArg) {
          throw new Error('--output requires a directory path');
        }
        options.output = nextArg;
        i++;
        break;
      case '--user':
        if (!nextArg) {
          throw new Error('--user requires a name');
        }
        options.user = nextArg;
        i++;
        break;
      default:
        throw new Error(`Unknown option: ${arg}`);
    }
  }

  return options;
}

async function loadPolicyFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to load policy file ${filePath}: ${error.message}`);
  }
}

async function findLatestBackup() {
  try {
    const backupDir = '.kiro/settings';
    const files = await fs.readdir(backupDir);
    
    const backupFiles = files
      .filter(file => file.startsWith('trust-policy.backup.') && file.endsWith('.json'))
      .sort()
      .reverse();

    if (backupFiles.length === 0) {
      return null;
    }

    return join(backupDir, backupFiles[0]);
  } catch (error) {
    return null;
  }
}

async function main() {
  try {
    console.log('🚀 Trust承認ポリシー更新レポート生成ツール');
    console.log('=' .repeat(60));

    const options = await parseArgs();

    // ファイルパスの自動検出
    if (!options.previous && !options.current) {
      console.log('📁 ファイルパスが指定されていません。自動検出を試行します...');
      
      // 現在のポリシーファイルを検出
      const currentPolicyPath = '.kiro/settings/trust-policy.json';
      try {
        await fs.access(currentPolicyPath);
        options.current = currentPolicyPath;
        console.log(`✅ 現在のポリシーファイルを検出: ${currentPolicyPath}`);
      } catch (error) {
        throw new Error('現在のポリシーファイルが見つかりません: .kiro/settings/trust-policy.json');
      }

      // 最新のバックアップファイルを検出
      const latestBackup = await findLatestBackup();
      if (latestBackup) {
        options.previous = latestBackup;
        console.log(`✅ 最新のバックアップファイルを検出: ${latestBackup}`);
      } else {
        throw new Error('バックアップファイルが見つかりません。--previous オプションでファイルを指定してください。');
      }
    }

    if (!options.previous || !options.current) {
      throw new Error('--previous と --current の両方のオプションが必要です。--help でヘルプを確認してください。');
    }

    console.log('\n📋 設定情報:');
    console.log(`  変更前ポリシー: ${options.previous}`);
    console.log(`  変更後ポリシー: ${options.current}`);
    console.log(`  出力ディレクトリ: ${options.output}`);
    console.log(`  生成者: ${options.user}`);

    // ポリシーファイルを読み込み
    console.log('\n📖 ポリシーファイルを読み込み中...');
    const previousPolicy = await loadPolicyFile(options.previous);
    const currentPolicy = await loadPolicyFile(options.current);

    console.log(`✅ 変更前ポリシー読み込み完了 (バージョン: ${previousPolicy.version})`);
    console.log(`✅ 変更後ポリシー読み込み完了 (バージョン: ${currentPolicy.version})`);

    // レポート生成
    console.log('\n📊 レポート生成中...');
    const reportGenerator = new ReportGenerator(options.output);
    const report = await reportGenerator.generatePolicyUpdateReport(
      previousPolicy,
      currentPolicy,
      options.user
    );

    console.log('\n✅ レポート生成完了!');
    console.log(`📄 レポートID: ${report.id}`);
    console.log(`📅 生成日時: ${report.timestamp.toLocaleString('ja-JP')}`);
    console.log(`🔄 バージョン変更: ${previousPolicy.version} → ${currentPolicy.version}`);

    // 変更概要を表示
    console.log('\n📋 変更概要:');
    if (report.changes.length === 0) {
      console.log('  変更はありません');
    } else {
      console.log(`  合計 ${report.changes.length} 件の変更が検出されました:`);
      report.changes.slice(0, 5).forEach((change, index) => {
        console.log(`    ${index + 1}. ${change.section}.${change.field} (${change.changeType})`);
        console.log(`       ${change.description}`);
      });
      
      if (report.changes.length > 5) {
        console.log(`    ... および ${report.changes.length - 5} 件の追加変更`);
      }
    }

    // 影響分析を表示
    console.log('\n🎯 影響分析:');
    console.log(`  セキュリティリスク: ${report.impactAnalysis.securityImpact.level}`);
    console.log(`  自動承認率変化: ${report.impactAnalysis.performanceImpact.expectedAutoApprovalRateChange.toFixed(1)}%`);
    console.log(`  応答時間変化: ${report.impactAnalysis.performanceImpact.expectedResponseTimeChange}ms`);
    console.log(`  Trustダイアログ頻度変化: ${report.impactAnalysis.userExperienceImpact.trustDialogFrequencyChange}%`);

    // 期待効果を表示
    console.log('\n🎉 期待効果:');
    report.expectedEffects.forEach((effect, index) => {
      console.log(`  ${index + 1}. ${effect.category}: ${effect.description}`);
    });

    // レポートファイルパスを表示
    const dateStr = report.timestamp.toISOString().split('T')[0];
    const reportFilePath = join(options.output, `trust-policy-update-${dateStr}.md`);
    console.log('\n📁 生成されたレポートファイル:');
    console.log(`  ${reportFilePath}`);

    console.log('\n💡 推奨事項:');
    console.log('  1. レポート内容を確認し、変更の妥当性を検証してください');
    console.log('  2. セキュリティリスクが高い場合は、段階的な展開を検討してください');
    console.log('  3. 変更後は監査ログを注意深く監視してください');
    console.log('  4. 問題が発生した場合は、バックアップから復元してください');

  } catch (error) {
    console.error('\n❌ エラーが発生しました:', error.message);
    
    if (error.message.includes('Unknown option') || error.message.includes('requires')) {
      console.log('\n💡 ヘルプを表示するには --help オプションを使用してください');
    }
    
    process.exit(1);
  }
}

// スクリプトが直接実行された場合のみmainを実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main };