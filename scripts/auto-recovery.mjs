#!/usr/bin/env node

/**
 * Vercelデプロイ自動復旧スクリプト
 * デプロイ失敗時の自動リトライとエラーハンドリング機能
 */

import { execSync } from 'child_process';
import fs from 'fs';

class AutoRecovery {
  constructor(options = {}) {
    this.projectId = options.projectId || process.env.VERCEL_PROJECT_ID;
    this.orgId = options.orgId || process.env.VERCEL_ORG_ID;
    this.token = options.token || process.env.VERCEL_TOKEN;
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 60000; // 1分
    this.githubToken = process.env.GITHUB_TOKEN;
    this.repository = process.env.GITHUB_REPOSITORY;
  }

  async run() {
    console.log('🔄 Vercelデプロイ自動復旧を開始します...\n');

    try {
      // 現在のデプロイ状況を確認
      const deploymentStatus = await this.checkDeploymentStatus();
      
      if (deploymentStatus.hasErrors) {
        console.log('❌ エラーのあるデプロイメントを検出しました');
        await this.handleDeploymentErrors(deploymentStatus);
      } else {
        console.log('✅ デプロイメントは正常です');
      }

      // ドメイン設定の確認と修正
      await this.checkAndFixDomainConfiguration();

    } catch (error) {
      console.error('❌ 自動復旧中にエラーが発生しました:', error.message);
      await this.reportError(error);
      process.exit(1);
    }
  }

  async checkDeploymentStatus() {
    console.log('📊 デプロイメント状況を確認中...');

    try {
      const output = execSync(`curl -s -H "Authorization: Bearer ${this.token}" "https://api.vercel.com/v6/deployments?projectId=${this.projectId}&limit=5"`, {
        encoding: 'utf8'
      });

      const response = JSON.parse(output);
      const deployments = response.deployments || [];

      const productionDeployments = deployments.filter(d => d.target === 'production');
      const errorDeployments = deployments.filter(d => d.readyState === 'ERROR');

      console.log(`  📋 最新5件のデプロイメント: ${deployments.length}件`);
      console.log(`  🏭 本番デプロイメント: ${productionDeployments.length}件`);
      console.log(`  ❌ エラーデプロイメント: ${errorDeployments.length}件`);

      return {
        deployments,
        productionDeployments,
        errorDeployments,
        hasErrors: errorDeployments.length > 0,
        latestProduction: productionDeployments[0] || null
      };

    } catch (error) {
      console.error('デプロイメント状況の確認に失敗:', error.message);
      throw error;
    }
  }

  async handleDeploymentErrors(status) {
    console.log('\n🔧 デプロイメントエラーの処理を開始...');

    // エラーの詳細を収集
    const errorDetails = await this.collectErrorDetails(status.errorDeployments);
    
    // 一般的な問題の自動修正を試行
    const fixAttempts = await this.attemptCommonFixes(errorDetails);
    
    // リトライ実行
    if (fixAttempts.some(fix => fix.success)) {
      console.log('🔄 修正後にデプロイメントをリトライします...');
      await this.retryDeployment();
    } else {
      console.log('⚠️ 自動修正に失敗しました。手動での確認が必要です');
      await this.createIssueForManualReview(errorDetails);
    }
  }

  async collectErrorDetails(errorDeployments) {
    console.log('📋 エラー詳細を収集中...');

    const details = [];

    for (const deployment of errorDeployments.slice(0, 3)) { // 最新3件のエラーを分析
      try {
        const output = execSync(`curl -s -H "Authorization: Bearer ${this.token}" "https://api.vercel.com/v13/deployments/${deployment.uid}"`, {
          encoding: 'utf8'
        });

        const deploymentDetail = JSON.parse(output);
        
        details.push({
          uid: deployment.uid,
          createdAt: deployment.createdAt,
          readyState: deployment.readyState,
          target: deployment.target,
          errorMessage: deploymentDetail.errorMessage || 'Unknown error',
          buildLogs: await this.getBuildLogs(deployment.uid)
        });

        console.log(`  📄 ${deployment.uid}: ${deploymentDetail.errorMessage || 'Unknown error'}`);

      } catch (error) {
        console.log(`  ⚠️ ${deployment.uid}: 詳細取得に失敗`);
      }
    }

    return details;
  }

  async getBuildLogs(deploymentId) {
    try {
      // ビルドログの取得（簡略版）
      const output = execSync(`curl -s -H "Authorization: Bearer ${this.token}" "https://api.vercel.com/v2/deployments/${deploymentId}/events"`, {
        encoding: 'utf8'
      });

      const events = JSON.parse(output);
      return events.slice(-10); // 最新10件のイベント

    } catch (error) {
      return [];
    }
  }

  async attemptCommonFixes(errorDetails) {
    console.log('\n🔧 一般的な問題の自動修正を試行中...');

    const fixes = [];

    // 1. 環境変数の問題をチェック
    const envFix = await this.fixEnvironmentVariables(errorDetails);
    fixes.push({ name: '環境変数修正', success: envFix });

    // 2. ビルド設定の問題をチェック
    const buildFix = await this.fixBuildConfiguration(errorDetails);
    fixes.push({ name: 'ビルド設定修正', success: buildFix });

    // 3. 依存関係の問題をチェック
    const depFix = await this.fixDependencies(errorDetails);
    fixes.push({ name: '依存関係修正', success: depFix });

    fixes.forEach(fix => {
      console.log(`  ${fix.success ? '✅' : '❌'} ${fix.name}: ${fix.success ? '成功' : '失敗'}`);
    });

    return fixes;
  }

  async fixEnvironmentVariables(errorDetails) {
    console.log('🔍 環境変数の問題をチェック中...');

    // エラーメッセージから環境変数関連の問題を検出
    const envErrors = errorDetails.filter(detail => 
      detail.errorMessage && (
        detail.errorMessage.includes('Environment Variable') ||
        detail.errorMessage.includes('Missing required') ||
        detail.errorMessage.includes('NEXT_PUBLIC_')
      )
    );

    if (envErrors.length === 0) {
      return false;
    }

    try {
      // 環境変数検証スクリプトを実行
      execSync('node scripts/verify-env-variables.mjs', { stdio: 'pipe' });
      console.log('  ✅ 環境変数は正常に設定されています');
      return false; // 問題なし
    } catch (error) {
      console.log('  ❌ 環境変数に問題があります');
      // 自動修正は困難なため、手動確認を推奨
      return false;
    }
  }

  async fixBuildConfiguration(errorDetails) {
    console.log('🔍 ビルド設定の問題をチェック中...');

    // モジュール解決エラーの検出
    const moduleErrors = errorDetails.filter(detail => 
      detail.errorMessage && (
        detail.errorMessage.includes("Can't resolve") ||
        detail.errorMessage.includes('Module not found') ||
        detail.errorMessage.includes('webpack errors')
      )
    );

    if (moduleErrors.length === 0) {
      return false;
    }

    // vercel.jsonの設定を確認・修正
    try {
      const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
      
      // Root directoryの設定が必要かチェック
      if (!vercelConfig.rootDirectory && fs.existsSync('apps/web')) {
        console.log('  🔧 Root directoryを設定します...');
        vercelConfig.rootDirectory = 'apps/web';
        
        fs.writeFileSync('vercel.json', JSON.stringify(vercelConfig, null, 2));
        console.log('  ✅ vercel.jsonを更新しました');
        return true;
      }

      return false;
    } catch (error) {
      console.log('  ❌ ビルド設定の修正に失敗:', error.message);
      return false;
    }
  }

  async fixDependencies(errorDetails) {
    console.log('🔍 依存関係の問題をチェック中...');

    // 依存関係エラーの検出
    const depErrors = errorDetails.filter(detail => 
      detail.errorMessage && (
        detail.errorMessage.includes('Cannot find package') ||
        detail.errorMessage.includes('ERR_MODULE_NOT_FOUND') ||
        detail.errorMessage.includes('pnpm')
      )
    );

    if (depErrors.length === 0) {
      return false;
    }

    // package.jsonの存在確認
    const packageJsonPaths = ['package.json', 'apps/web/package.json'];
    
    for (const path of packageJsonPaths) {
      if (fs.existsSync(path)) {
        console.log(`  ✅ ${path} が存在します`);
      } else {
        console.log(`  ❌ ${path} が見つかりません`);
      }
    }

    // 自動修正は困難なため、手動確認を推奨
    return false;
  }

  async retryDeployment() {
    console.log('\n🔄 デプロイメントをリトライ中...');

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`  試行 ${attempt}/${this.maxRetries}...`);

        // GitHub Actionsワークフローをトリガー
        if (this.githubToken && this.repository) {
          await this.triggerGitHubWorkflow();
        } else {
          // 直接Vercelデプロイを実行
          execSync('vercel --prod', { stdio: 'inherit' });
        }

        console.log('  ✅ デプロイメントが成功しました');
        return true;

      } catch (error) {
        console.log(`  ❌ 試行 ${attempt} が失敗: ${error.message}`);
        
        if (attempt < this.maxRetries) {
          console.log(`  ⏳ ${this.retryDelay / 1000}秒待機中...`);
          await this.sleep(this.retryDelay);
        }
      }
    }

    console.log('❌ すべてのリトライが失敗しました');
    return false;
  }

  async triggerGitHubWorkflow() {
    try {
      const output = execSync(`curl -X POST -H "Authorization: token ${this.githubToken}" -H "Accept: application/vnd.github.v3+json" "https://api.github.com/repos/${this.repository}/actions/workflows/vercel-production-deploy.yml/dispatches" -d '{"ref":"master"}'`, {
        encoding: 'utf8'
      });

      console.log('  📡 GitHub Actionsワークフローをトリガーしました');
    } catch (error) {
      throw new Error(`GitHub Actionsのトリガーに失敗: ${error.message}`);
    }
  }

  async checkAndFixDomainConfiguration() {
    console.log('\n🌐 ドメイン設定を確認中...');

    try {
      // ドメイン一覧を取得
      const output = execSync('vercel domains ls', { encoding: 'utf8' });
      
      if (output.includes('0 Domains found')) {
        console.log('❌ ドメインが設定されていません');
        await this.addDomain('suptia.com');
      } else {
        console.log('✅ ドメインが設定されています');
      }

    } catch (error) {
      console.log('⚠️ ドメイン設定の確認に失敗:', error.message);
    }
  }

  async addDomain(domain) {
    console.log(`🔧 ドメイン ${domain} を追加中...`);

    try {
      // まず成功するデプロイメントが必要
      const deploymentStatus = await this.checkDeploymentStatus();
      
      if (!deploymentStatus.latestProduction || deploymentStatus.latestProduction.readyState !== 'READY') {
        console.log('⚠️ 成功した本番デプロイメントが必要です。先にデプロイを修正してください');
        return false;
      }

      execSync(`vercel domains add ${domain}`, { stdio: 'inherit' });
      console.log(`✅ ドメイン ${domain} を追加しました`);
      return true;

    } catch (error) {
      console.log(`❌ ドメイン追加に失敗: ${error.message}`);
      return false;
    }
  }

  async createIssueForManualReview(errorDetails) {
    console.log('\n📝 手動確認用のIssueを作成中...');

    if (!this.githubToken || !this.repository) {
      console.log('⚠️ GitHub認証情報が不足しているため、Issueを作成できません');
      return;
    }

    const issueBody = this.generateIssueBody(errorDetails);

    try {
      const issueData = {
        title: `🚨 Vercelデプロイ自動復旧失敗 - ${new Date().toISOString().split('T')[0]}`,
        body: issueBody,
        labels: ['deployment', 'vercel', 'auto-recovery', 'urgent']
      };

      execSync(`curl -X POST -H "Authorization: token ${this.githubToken}" -H "Accept: application/vnd.github.v3+json" "https://api.github.com/repos/${this.repository}/issues" -d '${JSON.stringify(issueData)}'`, {
        encoding: 'utf8'
      });

      console.log('✅ 手動確認用のIssueを作成しました');

    } catch (error) {
      console.log('❌ Issue作成に失敗:', error.message);
    }
  }

  generateIssueBody(errorDetails) {
    const errors = errorDetails.map(detail => `
### デプロイメント ${detail.uid}
- **作成日時**: ${new Date(detail.createdAt).toLocaleString()}
- **ターゲット**: ${detail.target}
- **状態**: ${detail.readyState}
- **エラー**: ${detail.errorMessage}
`).join('\n');

    return `
# Vercelデプロイ自動復旧失敗

自動復旧スクリプトがデプロイメントエラーを解決できませんでした。手動での確認と修正が必要です。

## エラー詳細

${errors}

## 推奨アクション

1. **環境変数の確認**
   \`\`\`bash
   node scripts/verify-env-variables.mjs
   \`\`\`

2. **ビルド設定の確認**
   - vercel.json の設定
   - package.json の依存関係
   - TypeScript設定

3. **ドメイン設定の確認**
   \`\`\`bash
   vercel domains ls
   node scripts/verify-custom-domain.mjs
   \`\`\`

4. **手動デプロイの実行**
   \`\`\`bash
   vercel --prod
   \`\`\`

## 関連ログ

Vercelダッシュボード: https://vercel.com/dashboard
GitHub Actions: ${process.env.GITHUB_SERVER_URL}/${this.repository}/actions

---
*このIssueは自動復旧スクリプトによって作成されました*
`;
  }

  async reportError(error) {
    console.log('\n📊 エラーレポートを生成中...');

    const report = {
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack,
      environment: {
        projectId: this.projectId,
        orgId: this.orgId,
        repository: this.repository
      }
    };

    // ローカルファイルに保存
    fs.writeFileSync(`error-report-${Date.now()}.json`, JSON.stringify(report, null, 2));
    console.log('📄 エラーレポートを保存しました');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI実行
if (import.meta.url === `file://${process.argv[1]}`) {
  const recovery = new AutoRecovery();
  recovery.run().catch(console.error);
}

export default AutoRecovery;