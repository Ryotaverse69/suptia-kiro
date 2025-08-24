#!/usr/bin/env node

/**
 * 最終統合レポート生成スクリプト
 * プロジェクト全体の状況、実装された機能、残課題をまとめる
 */

import { execSync } from 'child_process';
import fs from 'fs';
import chalk from 'chalk';

class FinalIntegrationReport {
  constructor() {
    this.report = {
      timestamp: new Date().toISOString(),
      project: {
        name: 'Vercel Production Deploy Fix',
        version: this.getProjectVersion(),
        status: 'completed_with_issues'
      },
      implementation: {
        completed: [],
        inProgress: [],
        blocked: [],
        notStarted: []
      },
      metrics: {
        current: null,
        targets: null,
        gaps: []
      },
      infrastructure: {
        scripts: [],
        workflows: [],
        documentation: []
      },
      issues: {
        critical: [],
        high: [],
        medium: [],
        low: []
      },
      recommendations: {
        immediate: [],
        shortTerm: [],
        longTerm: []
      },
      nextSteps: []
    };
  }

  async generate() {
    console.log(chalk.blue('📋 最終統合レポートを生成中...\n'));

    try {
      await this.analyzeImplementation();
      await this.collectMetrics();
      await this.assessInfrastructure();
      await this.identifyIssues();
      await this.generateRecommendations();
      await this.defineNextSteps();
      
      await this.saveReport();
      this.displaySummary();

    } catch (error) {
      console.error(chalk.red(`❌ レポート生成中にエラーが発生しました: ${error.message}`));
      process.exit(1);
    }
  }

  async analyzeImplementation() {
    console.log(chalk.blue('🔍 実装状況を分析中...'));

    // タスクファイルから実装状況を読み取り
    try {
      const tasksContent = fs.readFileSync('.kiro/specs/vercel-production-deploy-fix/tasks.md', 'utf8');
      const lines = tasksContent.split('\n');
      
      lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('- [x]')) {
          this.report.implementation.completed.push(trimmed.replace('- [x]', '').trim());
        } else if (trimmed.startsWith('- [-]')) {
          this.report.implementation.inProgress.push(trimmed.replace('- [-]', '').trim());
        } else if (trimmed.startsWith('- [ ]')) {
          this.report.implementation.notStarted.push(trimmed.replace('- [ ]', '').trim());
        }
      });

      console.log(chalk.green(`  ✅ 完了: ${this.report.implementation.completed.length}件`));
      console.log(chalk.yellow(`  🔄 進行中: ${this.report.implementation.inProgress.length}件`));
      console.log(chalk.red(`  ❌ 未着手: ${this.report.implementation.notStarted.length}件`));

    } catch (error) {
      console.log(chalk.red(`  ❌ タスク分析に失敗: ${error.message}`));
    }

    console.log();
  }

  async collectMetrics() {
    console.log(chalk.blue('📊 メトリクスを収集中...'));

    try {
      // 最新のメトリクスレポートを読み込み
      const reportsDir = '.kiro/reports';
      if (fs.existsSync(reportsDir)) {
        const files = fs.readdirSync(reportsDir)
          .filter(f => f.startsWith('success-metrics-') && f.endsWith('.json'))
          .sort()
          .reverse();
        
        if (files.length > 0) {
          const latestMetrics = JSON.parse(fs.readFileSync(`${reportsDir}/${files[0]}`, 'utf8'));
          this.report.metrics.current = latestMetrics.evaluation.overall;
          this.report.metrics.targets = latestMetrics.targets;
          
          // ギャップ分析
          Object.entries(latestMetrics.evaluation).forEach(([category, data]) => {
            if (data.issues && data.issues.length > 0) {
              this.report.metrics.gaps.push({
                category,
                score: data.score,
                issues: data.issues
              });
            }
          });

          console.log(chalk.green(`  ✅ 総合スコア: ${this.report.metrics.current.score.toFixed(1)}/100`));
          console.log(chalk.yellow(`  ⚠️ 改善が必要な領域: ${this.report.metrics.gaps.length}件`));
        }
      }
    } catch (error) {
      console.log(chalk.red(`  ❌ メトリクス収集に失敗: ${error.message}`));
    }

    console.log();
  }

  async assessInfrastructure() {
    console.log(chalk.blue('🏗️ インフラストラクチャを評価中...'));

    // 作成されたスクリプトの確認
    const scriptsDir = 'scripts';
    if (fs.existsSync(scriptsDir)) {
      const scriptFiles = fs.readdirSync(scriptsDir)
        .filter(f => f.endsWith('.mjs'))
        .map(f => {
          const stats = fs.statSync(`${scriptsDir}/${f}`);
          return {
            name: f,
            size: stats.size,
            created: stats.birthtime,
            purpose: this.getScriptPurpose(f)
          };
        });
      
      this.report.infrastructure.scripts = scriptFiles;
      console.log(chalk.green(`  ✅ スクリプト: ${scriptFiles.length}件作成`));
    }

    // GitHub Actionsワークフローの確認
    const workflowsDir = '.github/workflows';
    if (fs.existsSync(workflowsDir)) {
      const workflowFiles = fs.readdirSync(workflowsDir)
        .filter(f => f.endsWith('.yml') || f.endsWith('.yaml'))
        .map(f => {
          const content = fs.readFileSync(`${workflowsDir}/${f}`, 'utf8');
          return {
            name: f,
            triggers: this.extractWorkflowTriggers(content),
            jobs: this.extractWorkflowJobs(content)
          };
        });
      
      this.report.infrastructure.workflows = workflowFiles;
      console.log(chalk.green(`  ✅ ワークフロー: ${workflowFiles.length}件作成`));
    }

    // ドキュメントの確認
    const docsDir = 'docs';
    if (fs.existsSync(docsDir)) {
      const docFiles = fs.readdirSync(docsDir)
        .filter(f => f.endsWith('.md'))
        .map(f => ({
          name: f,
          size: fs.statSync(`${docsDir}/${f}`).size
        }));
      
      this.report.infrastructure.documentation = docFiles;
      console.log(chalk.green(`  ✅ ドキュメント: ${docFiles.length}件作成`));
    }

    console.log();
  }

  async identifyIssues() {
    console.log(chalk.blue('🚨 課題を特定中...'));

    // メトリクスから課題を抽出
    if (this.report.metrics.current) {
      const score = this.report.metrics.current.score;
      
      if (score < 50) {
        this.report.issues.critical.push({
          title: '総合スコアが非常に低い',
          description: `現在のスコア: ${score.toFixed(1)}/100`,
          impact: 'プロダクションデプロイメントが機能していない'
        });
      }
    }

    // デプロイメント状況から課題を抽出
    try {
      const deployOutput = execSync('vercel ls', { encoding: 'utf8' });
      const prodErrors = (deployOutput.match(/Production.*Error/g) || []).length;
      
      if (prodErrors > 0) {
        this.report.issues.critical.push({
          title: '本番デプロイメントが失敗している',
          description: `${prodErrors}件の本番デプロイメントエラー`,
          impact: 'サービスが利用できない状態'
        });
      }
    } catch (error) {
      this.report.issues.high.push({
        title: 'デプロイメント状況の確認ができない',
        description: error.message,
        impact: '現在の状況が不明'
      });
    }

    // 設定ファイルの課題
    if (!fs.existsSync('vercel.json')) {
      this.report.issues.high.push({
        title: 'vercel.json設定ファイルが不完全',
        description: 'Vercel設定が最適化されていない',
        impact: 'デプロイメントの信頼性に影響'
      });
    }

    // 環境変数の課題
    try {
      const envOutput = execSync('node scripts/verify-env-variables.mjs', { encoding: 'utf8' });
      if (envOutput.includes('❌')) {
        this.report.issues.high.push({
          title: '環境変数設定に問題がある',
          description: '必要な環境変数が不足または不正',
          impact: 'アプリケーションの動作に影響'
        });
      }
    } catch (error) {
      this.report.issues.medium.push({
        title: '環境変数の確認ができない',
        description: error.message,
        impact: '設定状況が不明'
      });
    }

    console.log(chalk.red(`  🚨 重要: ${this.report.issues.critical.length}件`));
    console.log(chalk.yellow(`  ⚠️ 高: ${this.report.issues.high.length}件`));
    console.log(chalk.blue(`  💡 中: ${this.report.issues.medium.length}件`));
    console.log(chalk.gray(`  📝 低: ${this.report.issues.low.length}件`));

    console.log();
  }

  async generateRecommendations() {
    console.log(chalk.blue('💡 推奨事項を生成中...'));

    // 即座に対応すべき項目
    if (this.report.issues.critical.length > 0) {
      this.report.recommendations.immediate.push({
        priority: 'critical',
        action: 'デプロイメントエラーの根本原因調査',
        description: 'ビルドログを確認し、エラーの原因を特定する',
        estimatedTime: '2-4時間'
      });

      this.report.recommendations.immediate.push({
        priority: 'critical',
        action: 'Vercelプロジェクト設定の見直し',
        description: 'Root Directory、Build Command、環境変数を再設定',
        estimatedTime: '1-2時間'
      });
    }

    // 短期的な改善項目
    this.report.recommendations.shortTerm.push({
      priority: 'high',
      action: 'monorepo設定の最適化',
      description: 'apps/webディレクトリを正しく認識するよう設定を調整',
      estimatedTime: '3-5時間'
    });

    this.report.recommendations.shortTerm.push({
      priority: 'high',
      action: 'カスタムドメイン設定の完了',
      description: 'suptia.comドメインの設定とDNS設定を完了',
      estimatedTime: '2-3時間'
    });

    // 長期的な改善項目
    this.report.recommendations.longTerm.push({
      priority: 'medium',
      action: '継続的監視システムの強化',
      description: 'より詳細なメトリクス収集とアラート機能の実装',
      estimatedTime: '1-2週間'
    });

    this.report.recommendations.longTerm.push({
      priority: 'medium',
      action: 'テスト自動化の拡充',
      description: 'E2Eテストとパフォーマンステストの追加',
      estimatedTime: '1-2週間'
    });

    console.log(chalk.red(`  🚨 即座に対応: ${this.report.recommendations.immediate.length}件`));
    console.log(chalk.yellow(`  📅 短期: ${this.report.recommendations.shortTerm.length}件`));
    console.log(chalk.blue(`  🔮 長期: ${this.report.recommendations.longTerm.length}件`));

    console.log();
  }

  async defineNextSteps() {
    console.log(chalk.blue('🚀 次のステップを定義中...'));

    this.report.nextSteps = [
      {
        step: 1,
        title: 'デプロイメントエラーの解決',
        description: 'Vercelダッシュボードでビルドログを確認し、エラーの根本原因を特定',
        priority: 'critical',
        owner: 'developer',
        estimatedTime: '2-4時間',
        dependencies: []
      },
      {
        step: 2,
        title: 'Vercelプロジェクト設定の修正',
        description: 'Root Directory、Build Command、Output Directoryを正しく設定',
        priority: 'critical',
        owner: 'developer',
        estimatedTime: '1-2時間',
        dependencies: ['step1']
      },
      {
        step: 3,
        title: '成功する本番デプロイメントの実行',
        description: '設定修正後、実際に成功するデプロイメントを作成',
        priority: 'critical',
        owner: 'developer',
        estimatedTime: '30分-1時間',
        dependencies: ['step2']
      },
      {
        step: 4,
        title: 'カスタムドメインの設定',
        description: 'suptia.comドメインをプロジェクトに追加し、DNS設定を完了',
        priority: 'high',
        owner: 'developer',
        estimatedTime: '1-2時間',
        dependencies: ['step3']
      },
      {
        step: 5,
        title: '全体的な動作確認',
        description: '本番環境での全機能テストと監視システムの動作確認',
        priority: 'high',
        owner: 'developer',
        estimatedTime: '2-3時間',
        dependencies: ['step4']
      }
    ];

    console.log(chalk.green(`  ✅ ${this.report.nextSteps.length}ステップを定義しました`));
    console.log();
  }

  getProjectVersion() {
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      return packageJson.version || '1.0.0';
    } catch (error) {
      return '1.0.0';
    }
  }

  getScriptPurpose(filename) {
    const purposes = {
      'diagnose-vercel-project.mjs': 'Vercelプロジェクト診断',
      'verify-env-variables.mjs': '環境変数確認',
      'verify-custom-domain.mjs': 'カスタムドメイン検証',
      'monitor-deployment.mjs': 'デプロイメント監視',
      'auto-recovery.mjs': '自動復旧',
      'production-rollout-verification.mjs': '本番ロールアウト検証',
      'measure-success-metrics.mjs': '成功メトリクス測定',
      'e2e-deployment-test.mjs': 'E2Eデプロイメントテスト',
      'final-integration-report.mjs': '最終統合レポート'
    };
    return purposes[filename] || '汎用スクリプト';
  }

  extractWorkflowTriggers(content) {
    const triggers = [];
    const lines = content.split('\n');
    let inOnSection = false;
    
    for (const line of lines) {
      if (line.trim().startsWith('on:')) {
        inOnSection = true;
        continue;
      }
      if (inOnSection && line.trim() && !line.startsWith(' ')) {
        break;
      }
      if (inOnSection && line.includes(':')) {
        const trigger = line.trim().replace(':', '');
        if (trigger && !triggers.includes(trigger)) {
          triggers.push(trigger);
        }
      }
    }
    
    return triggers;
  }

  extractWorkflowJobs(content) {
    const jobs = [];
    const lines = content.split('\n');
    let inJobsSection = false;
    
    for (const line of lines) {
      if (line.trim().startsWith('jobs:')) {
        inJobsSection = true;
        continue;
      }
      if (inJobsSection && line.match(/^\\s{2}\\w+:/)) {
        const job = line.trim().replace(':', '');
        jobs.push(job);
      }
    }
    
    return jobs;
  }

  async saveReport() {
    const reportPath = '.kiro/reports';
    if (!fs.existsSync(reportPath)) {
      fs.mkdirSync(reportPath, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // JSON形式で保存
    const jsonFilename = `final-integration-report-${timestamp}.json`;
    const jsonFilepath = `${reportPath}/${jsonFilename}`;
    fs.writeFileSync(jsonFilepath, JSON.stringify(this.report, null, 2));

    // Markdown形式で保存
    const markdownReport = this.generateMarkdownReport();
    const mdFilename = `final-integration-report-${timestamp}.md`;
    const mdFilepath = `${reportPath}/${mdFilename}`;
    fs.writeFileSync(mdFilepath, markdownReport);

    console.log(chalk.green(`📄 統合レポートを保存しました:`));
    console.log(`  JSON: ${jsonFilepath}`);
    console.log(`  Markdown: ${mdFilepath}`);
    console.log();
  }

  generateMarkdownReport() {
    const md = [];
    
    md.push('# Vercel Production Deploy Fix - 最終統合レポート');
    md.push('');
    md.push(`**生成日時**: ${new Date(this.report.timestamp).toLocaleString()}`);
    md.push(`**プロジェクト**: ${this.report.project.name}`);
    md.push(`**バージョン**: ${this.report.project.version}`);
    md.push(`**ステータス**: ${this.report.project.status}`);
    md.push('');
    
    // エグゼクティブサマリー
    md.push('## エグゼクティブサマリー');
    md.push('');
    md.push('このプロジェクトは、Vercelでの本番デプロイメント問題を解決するために実施されました。');
    md.push('多くの自動化スクリプトと監視機能を実装しましたが、根本的なデプロイメント問題が残っています。');
    md.push('');
    
    // 実装状況
    md.push('## 実装状況');
    md.push('');
    md.push('| ステータス | 件数 | 割合 |');
    md.push('|------------|------|------|');
    const total = this.report.implementation.completed.length + 
                  this.report.implementation.inProgress.length + 
                  this.report.implementation.notStarted.length;
    md.push(`| 完了 | ${this.report.implementation.completed.length} | ${((this.report.implementation.completed.length / total) * 100).toFixed(1)}% |`);
    md.push(`| 進行中 | ${this.report.implementation.inProgress.length} | ${((this.report.implementation.inProgress.length / total) * 100).toFixed(1)}% |`);
    md.push(`| 未着手 | ${this.report.implementation.notStarted.length} | ${((this.report.implementation.notStarted.length / total) * 100).toFixed(1)}% |`);
    md.push('');
    
    // 現在のメトリクス
    if (this.report.metrics.current) {
      md.push('## 現在のメトリクス');
      md.push('');
      md.push(`**総合スコア**: ${this.report.metrics.current.score.toFixed(1)}/100 (${this.report.metrics.current.grade})`);
      md.push('');
      
      if (this.report.metrics.gaps.length > 0) {
        md.push('### 改善が必要な領域');
        md.push('');
        this.report.metrics.gaps.forEach(gap => {
          md.push(`- **${gap.category}** (${gap.score?.toFixed(1) || 'N/A'}点)`);
          gap.issues.forEach(issue => {
            md.push(`  - ${issue}`);
          });
        });
        md.push('');
      }
    }
    
    // インフラストラクチャ
    md.push('## 実装されたインフラストラクチャ');
    md.push('');
    
    md.push('### スクリプト');
    md.push('');
    this.report.infrastructure.scripts.forEach(script => {
      md.push(`- **${script.name}**: ${script.purpose}`);
    });
    md.push('');
    
    md.push('### GitHub Actions ワークフロー');
    md.push('');
    this.report.infrastructure.workflows.forEach(workflow => {
      md.push(`- **${workflow.name}**`);
      md.push(`  - トリガー: ${workflow.triggers.join(', ')}`);
      md.push(`  - ジョブ: ${workflow.jobs.join(', ')}`);
    });
    md.push('');
    
    // 課題
    md.push('## 特定された課題');
    md.push('');
    
    if (this.report.issues.critical.length > 0) {
      md.push('### 🚨 重要な課題');
      md.push('');
      this.report.issues.critical.forEach((issue, index) => {
        md.push(`${index + 1}. **${issue.title}**`);
        md.push(`   - 説明: ${issue.description}`);
        md.push(`   - 影響: ${issue.impact}`);
        md.push('');
      });
    }
    
    if (this.report.issues.high.length > 0) {
      md.push('### ⚠️ 高優先度の課題');
      md.push('');
      this.report.issues.high.forEach((issue, index) => {
        md.push(`${index + 1}. **${issue.title}**`);
        md.push(`   - 説明: ${issue.description}`);
        md.push(`   - 影響: ${issue.impact}`);
        md.push('');
      });
    }
    
    // 推奨事項
    md.push('## 推奨事項');
    md.push('');
    
    if (this.report.recommendations.immediate.length > 0) {
      md.push('### 即座に対応すべき項目');
      md.push('');
      this.report.recommendations.immediate.forEach((rec, index) => {
        md.push(`${index + 1}. **${rec.action}** (${rec.estimatedTime})`);
        md.push(`   ${rec.description}`);
        md.push('');
      });
    }
    
    if (this.report.recommendations.shortTerm.length > 0) {
      md.push('### 短期的な改善項目');
      md.push('');
      this.report.recommendations.shortTerm.forEach((rec, index) => {
        md.push(`${index + 1}. **${rec.action}** (${rec.estimatedTime})`);
        md.push(`   ${rec.description}`);
        md.push('');
      });
    }
    
    // 次のステップ
    md.push('## 次のステップ');
    md.push('');
    this.report.nextSteps.forEach(step => {
      const priorityIcon = {
        critical: '🚨',
        high: '⚠️',
        medium: '💡',
        low: '📝'
      }[step.priority] || '📋';
      
      md.push(`### ${step.step}. ${priorityIcon} ${step.title}`);
      md.push('');
      md.push(`**説明**: ${step.description}`);
      md.push(`**優先度**: ${step.priority}`);
      md.push(`**担当**: ${step.owner}`);
      md.push(`**推定時間**: ${step.estimatedTime}`);
      if (step.dependencies.length > 0) {
        md.push(`**依存関係**: ${step.dependencies.join(', ')}`);
      }
      md.push('');
    });
    
    // 結論
    md.push('## 結論');
    md.push('');
    md.push('このプロジェクトでは包括的な監視・診断システムを構築しましたが、');
    md.push('根本的なデプロイメント問題の解決が最優先課題として残っています。');
    md.push('');
    md.push('次のステップに従って段階的に問題を解決することで、');
    md.push('安定した本番デプロイメント環境を構築できると考えられます。');
    md.push('');
    
    return md.join('\\n');
  }

  displaySummary() {
    console.log(chalk.blue('📊 最終統合レポート サマリー\n'));
    console.log('=' .repeat(60));

    // プロジェクト概要
    console.log(`\n📋 プロジェクト: ${chalk.bold(this.report.project.name)}`);
    console.log(`📅 完了日時: ${new Date(this.report.timestamp).toLocaleString()}`);
    console.log(`📊 ステータス: ${chalk.yellow(this.report.project.status)}`);

    // 実装状況
    const total = this.report.implementation.completed.length + 
                  this.report.implementation.inProgress.length + 
                  this.report.implementation.notStarted.length;
    const completionRate = ((this.report.implementation.completed.length / total) * 100).toFixed(1);
    
    console.log(`\n📈 実装進捗: ${chalk.green(completionRate)}% (${this.report.implementation.completed.length}/${total})`);

    // メトリクス
    if (this.report.metrics.current) {
      const score = this.report.metrics.current.score;
      const scoreColor = score >= 80 ? 'green' : score >= 60 ? 'yellow' : 'red';
      console.log(`🎯 総合スコア: ${chalk[scoreColor](score.toFixed(1))}/100 (${chalk[scoreColor](this.report.metrics.current.grade)})`);
    }

    // インフラストラクチャ
    console.log(`\n🏗️ 作成されたアセット:`);
    console.log(`  📜 スクリプト: ${this.report.infrastructure.scripts.length}件`);
    console.log(`  ⚙️ ワークフロー: ${this.report.infrastructure.workflows.length}件`);
    console.log(`  📚 ドキュメント: ${this.report.infrastructure.documentation.length}件`);

    // 課題
    console.log(`\n🚨 特定された課題:`);
    console.log(chalk.red(`  重要: ${this.report.issues.critical.length}件`));
    console.log(chalk.yellow(`  高: ${this.report.issues.high.length}件`));
    console.log(chalk.blue(`  中: ${this.report.issues.medium.length}件`));

    // 次のステップ
    console.log(`\n🚀 次のステップ (上位3件):`);
    this.report.nextSteps.slice(0, 3).forEach(step => {
      const priorityIcon = {
        critical: '🚨',
        high: '⚠️',
        medium: '💡'
      }[step.priority] || '📋';
      console.log(`  ${step.step}. ${priorityIcon} ${step.title} (${step.estimatedTime})`);
    });

    console.log(`\n✨ ${chalk.green('最終統合レポートの生成が完了しました！')}`);
    console.log(`📄 詳細なレポートファイルを確認してください。`);
  }
}

// スクリプト実行
if (import.meta.url === `file://${process.argv[1]}`) {
  const report = new FinalIntegrationReport();
  report.generate().catch(console.error);
}

export default FinalIntegrationReport;