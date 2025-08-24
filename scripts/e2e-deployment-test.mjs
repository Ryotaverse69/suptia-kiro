#!/usr/bin/env node

/**
 * エンドツーエンドデプロイメントテストスクリプト
 * Vercelデプロイメントの全工程をテストし、問題を特定する
 */

import { execSync } from 'child_process';
import fs from 'fs';
import chalk from 'chalk';

class E2EDeploymentTest {
  constructor() {
    this.testResults = {
      timestamp: new Date().toISOString(),
      tests: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0
      },
      issues: [],
      recommendations: []
    };
    this.verbose = process.argv.includes('--verbose');
  }

  async run() {
    console.log(chalk.blue('🧪 エンドツーエンドデプロイメントテストを開始します...\n'));

    try {
      await this.runTestSuite();
      await this.generateReport();
      this.displayResults();
      
      // テスト結果に基づいて終了コードを設定
      if (this.testResults.summary.failed > 0) {
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red(`❌ テスト実行中にエラーが発生しました: ${error.message}`));
      process.exit(1);
    }
  }

  async runTestSuite() {
    const tests = [
      { name: 'プロジェクト設定確認', fn: () => this.testProjectConfiguration() },
      { name: '環境変数確認', fn: () => this.testEnvironmentVariables() },
      { name: 'ビルド設定確認', fn: () => this.testBuildConfiguration() },
      { name: 'Git連携確認', fn: () => this.testGitIntegration() },
      { name: 'デプロイメント実行', fn: () => this.testDeployment() },
      { name: 'ドメイン設定確認', fn: () => this.testDomainConfiguration() },
      { name: 'ヘルスチェック', fn: () => this.testHealthCheck() },
      { name: 'パフォーマンス確認', fn: () => this.testPerformance() }
    ];

    for (const test of tests) {
      await this.runTest(test.name, test.fn);
    }
  }

  async runTest(name, testFn) {
    console.log(chalk.blue(`🔍 ${name}を実行中...`));
    
    const startTime = Date.now();
    let result = {
      name,
      status: 'unknown',
      duration: 0,
      message: '',
      details: {}
    };

    try {
      const testResult = await testFn();
      result = {
        ...result,
        ...testResult,
        duration: Date.now() - startTime
      };

      const statusIcon = result.status === 'passed' ? '✅' : 
                        result.status === 'failed' ? '❌' : 
                        result.status === 'skipped' ? '⏭️' : '❓';
      
      console.log(`  ${statusIcon} ${result.message}`);
      
      if (this.verbose && result.details) {
        Object.entries(result.details).forEach(([key, value]) => {
          console.log(`    ${key}: ${value}`);
        });
      }

    } catch (error) {
      result = {
        ...result,
        status: 'failed',
        message: `テスト実行エラー: ${error.message}`,
        duration: Date.now() - startTime,
        error: error.message
      };
      console.log(chalk.red(`  ❌ ${result.message}`));
    }

    this.testResults.tests.push(result);
    this.testResults.summary.total++;
    this.testResults.summary[result.status]++;

    console.log();
  }

  async testProjectConfiguration() {
    try {
      // Vercelプロジェクト設定の確認
      const projectData = JSON.parse(fs.readFileSync('.vercel/project.json', 'utf8'));
      
      const details = {
        'プロジェクトID': projectData.projectId,
        '組織ID': projectData.orgId
      };

      // Vercel CLIでプロジェクト情報を確認
      const whoami = execSync('vercel whoami', { encoding: 'utf8' }).trim();
      details['認証ユーザー'] = whoami.split('\n').pop();

      return {
        status: 'passed',
        message: 'プロジェクト設定は正常です',
        details
      };

    } catch (error) {
      return {
        status: 'failed',
        message: `プロジェクト設定に問題があります: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  async testEnvironmentVariables() {
    try {
      // 必要な環境変数のリスト
      const requiredVars = [
        'NEXT_PUBLIC_SANITY_PROJECT_ID',
        'NEXT_PUBLIC_SANITY_DATASET',
        'NEXT_PUBLIC_SITE_URL',
        'SANITY_API_VERSION',
        'SANITY_API_TOKEN'
      ];

      // Vercelの環境変数を確認
      const envOutput = execSync('vercel env ls production', { encoding: 'utf8' });
      
      const missingVars = [];
      const presentVars = [];

      requiredVars.forEach(varName => {
        if (envOutput.includes(varName)) {
          presentVars.push(varName);
        } else {
          missingVars.push(varName);
        }
      });

      const details = {
        '設定済み変数数': presentVars.length,
        '不足変数数': missingVars.length,
        '設定済み変数': presentVars.join(', '),
        '不足変数': missingVars.join(', ')
      };

      if (missingVars.length > 0) {
        this.testResults.issues.push({
          type: 'environment',
          severity: 'high',
          message: `必要な環境変数が不足しています: ${missingVars.join(', ')}`
        });

        return {
          status: 'failed',
          message: `${missingVars.length}個の環境変数が不足しています`,
          details
        };
      }

      return {
        status: 'passed',
        message: 'すべての必要な環境変数が設定されています',
        details
      };

    } catch (error) {
      return {
        status: 'failed',
        message: `環境変数の確認に失敗しました: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  async testBuildConfiguration() {
    try {
      const details = {};

      // vercel.jsonの確認
      if (fs.existsSync('vercel.json')) {
        const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
        details['vercel.json'] = '存在';
        details['framework'] = vercelConfig.framework || 'なし';
        details['functions設定'] = vercelConfig.functions ? '設定済み' : 'なし';
      } else {
        details['vercel.json'] = '不存在';
        this.testResults.issues.push({
          type: 'configuration',
          severity: 'medium',
          message: 'vercel.jsonファイルが存在しません'
        });
      }

      // package.jsonの確認
      const packagePaths = ['package.json', 'apps/web/package.json'];
      let hasValidPackageJson = false;

      packagePaths.forEach(path => {
        if (fs.existsSync(path)) {
          const pkg = JSON.parse(fs.readFileSync(path, 'utf8'));
          details[`${path} name`] = pkg.name;
          details[`${path} scripts`] = Object.keys(pkg.scripts || {}).join(', ');
          hasValidPackageJson = true;
        }
      });

      if (!hasValidPackageJson) {
        return {
          status: 'failed',
          message: 'package.jsonファイルが見つかりません',
          details
        };
      }

      // pnpm-workspace.yamlの確認（monorepo）
      if (fs.existsSync('pnpm-workspace.yaml')) {
        details['workspace'] = 'pnpm workspace設定済み';
      }

      return {
        status: 'passed',
        message: 'ビルド設定は正常です',
        details
      };

    } catch (error) {
      return {
        status: 'failed',
        message: `ビルド設定の確認に失敗しました: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  async testGitIntegration() {
    try {
      const details = {};

      // Gitリポジトリの確認
      const gitRemote = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
      details['リモートURL'] = gitRemote;

      // 現在のブランチ
      const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
      details['現在のブランチ'] = currentBranch;

      // 最新コミット
      const latestCommit = execSync('git log -1 --oneline', { encoding: 'utf8' }).trim();
      details['最新コミット'] = latestCommit;

      // 未コミットの変更
      try {
        const status = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
        details['未コミット変更'] = status ? '有り' : '無し';
      } catch (error) {
        details['未コミット変更'] = '確認不可';
      }

      return {
        status: 'passed',
        message: 'Git連携は正常です',
        details
      };

    } catch (error) {
      return {
        status: 'failed',
        message: `Git連携の確認に失敗しました: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  async testDeployment() {
    try {
      const details = {};

      // 最新のデプロイメント情報を取得
      const deploymentsOutput = execSync('vercel ls', { encoding: 'utf8' });
      
      // テキスト出力からデプロイメント情報を解析
      const lines = deploymentsOutput.split('\n').filter(line => line.trim());
      const deploymentLines = lines.filter(line => 
        line.includes('https://') && (line.includes('Ready') || line.includes('Error') || line.includes('Building'))
      );

      if (deploymentLines.length === 0) {
        return {
          status: 'failed',
          message: 'デプロイメントが見つかりません',
          details: { deployments: 0 }
        };
      }

      // 本番デプロイメント（Production環境）を特定
      const productionDeployments = deploymentLines.filter(line => 
        line.includes('Production')
      );
      
      const previewDeployments = deploymentLines.filter(line => 
        line.includes('Preview')
      );

      // 最新の本番デプロイメントの状態を確認
      let latestProdState = 'NONE';
      let latestProdUrl = 'N/A';
      
      if (productionDeployments.length > 0) {
        const latestProdLine = productionDeployments[0];
        if (latestProdLine.includes('● Ready')) {
          latestProdState = 'READY';
        } else if (latestProdLine.includes('● Error')) {
          latestProdState = 'ERROR';
        } else if (latestProdLine.includes('● Building')) {
          latestProdState = 'BUILDING';
        }
        
        // URLを抽出
        const urlMatch = latestProdLine.match(/https:\/\/[^\s]+/);
        if (urlMatch) {
          latestProdUrl = urlMatch[0];
        }
      }

      details['総デプロイメント数'] = deploymentLines.length;
      details['本番デプロイメント数'] = productionDeployments.length;
      details['プレビューデプロイメント数'] = previewDeployments.length;
      details['最新本番デプロイ状態'] = latestProdState;
      details['最新本番デプロイURL'] = latestProdUrl;

      // 本番デプロイメントの状態確認
      if (productionDeployments.length > 0) {
        if (latestProdState === 'READY') {
          return {
            status: 'passed',
            message: '最新の本番デプロイメントは成功しています',
            details
          };
        } else if (latestProdState === 'ERROR') {
          this.testResults.issues.push({
            type: 'deployment',
            severity: 'critical',
            message: `本番デプロイメントが失敗しています: ${latestProdState}`
          });

          return {
            status: 'failed',
            message: `本番デプロイメントが失敗しています: ${latestProdState}`,
            details
          };
        } else {
          return {
            status: 'failed',
            message: `本番デプロイメントの状態が不明です: ${latestProdState}`,
            details
          };
        }
      } else {
        this.testResults.issues.push({
          type: 'deployment',
          severity: 'critical',
          message: '本番デプロイメントが存在しません'
        });

        return {
          status: 'failed',
          message: '本番デプロイメントが存在しません',
          details
        };
      }

    } catch (error) {
      return {
        status: 'failed',
        message: `デプロイメントの確認に失敗しました: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  async testDomainConfiguration() {
    try {
      const details = {};

      // ドメイン一覧を取得
      const domainsOutput = execSync('vercel domains ls', { encoding: 'utf8' });
      
      const domainCount = (domainsOutput.match(/(\d+) Domains? found/)?.[1] || '0');
      details['設定済みドメイン数'] = domainCount;

      if (parseInt(domainCount) === 0) {
        this.testResults.issues.push({
          type: 'domain',
          severity: 'high',
          message: 'カスタムドメインが設定されていません'
        });

        return {
          status: 'failed',
          message: 'カスタムドメインが設定されていません',
          details
        };
      }

      // 特定のドメインの確認
      const expectedDomains = ['suptia.com', 'www.suptia.com'];
      const configuredDomains = [];
      const missingDomains = [];

      expectedDomains.forEach(domain => {
        if (domainsOutput.includes(domain)) {
          configuredDomains.push(domain);
        } else {
          missingDomains.push(domain);
        }
      });

      details['設定済みドメイン'] = configuredDomains.join(', ');
      details['未設定ドメイン'] = missingDomains.join(', ');

      if (missingDomains.length > 0) {
        this.testResults.issues.push({
          type: 'domain',
          severity: 'medium',
          message: `一部のドメインが未設定です: ${missingDomains.join(', ')}`
        });

        return {
          status: 'failed',
          message: `${missingDomains.length}個のドメインが未設定です`,
          details
        };
      }

      return {
        status: 'passed',
        message: 'すべてのドメインが設定されています',
        details
      };

    } catch (error) {
      return {
        status: 'failed',
        message: `ドメイン設定の確認に失敗しました: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  async testHealthCheck() {
    try {
      const details = {};

      // 最新の本番デプロイメントURLを取得
      const deploymentsOutput = execSync('vercel ls', { encoding: 'utf8' });
      const lines = deploymentsOutput.split('\n').filter(line => line.trim());
      const deploymentLines = lines.filter(line => 
        line.includes('https://') && line.includes('READY')
      );

      if (deploymentLines.length === 0) {
        return {
          status: 'skipped',
          message: '準備完了状態の本番デプロイメントが存在しないためスキップしました',
          details
        };
      }

      // 最初のREADY状態のデプロイメントを使用
      const latestReadyLine = deploymentLines[0];
      const parts = latestReadyLine.trim().split(/\s+/);
      const deploymentUrl = parts.find(part => part.startsWith('https://'));
      
      if (!deploymentUrl) {
        return {
          status: 'skipped',
          message: 'デプロイメントURLが取得できないためスキップしました',
          details
        };
      }

      const url = deploymentUrl;
      details['テストURL'] = url;

      try {
        // curlでヘルスチェック
        const response = execSync(`curl -s -o /dev/null -w "%{http_code},%{time_total}" "${url}"`, { 
          encoding: 'utf8',
          timeout: 30000
        });

        const [statusCode, responseTime] = response.trim().split(',');
        details['HTTPステータス'] = statusCode;
        details['レスポンス時間'] = `${parseFloat(responseTime).toFixed(3)}秒`;

        if (statusCode === '200') {
          // Vercelヘッダーの確認
          const headers = execSync(`curl -s -I "${url}"`, { encoding: 'utf8' });
          const hasVercelHeaders = headers.includes('x-vercel-id') || headers.includes('server: Vercel');
          details['Vercelヘッダー'] = hasVercelHeaders ? '検出' : '未検出';

          return {
            status: 'passed',
            message: 'ヘルスチェックが成功しました',
            details
          };
        } else {
          this.testResults.issues.push({
            type: 'health',
            severity: 'critical',
            message: `ヘルスチェックが失敗しました: HTTP ${statusCode}`
          });

          return {
            status: 'failed',
            message: `ヘルスチェックが失敗しました: HTTP ${statusCode}`,
            details
          };
        }

      } catch (error) {
        return {
          status: 'failed',
          message: `ヘルスチェックでエラーが発生しました: ${error.message}`,
          details: { ...details, error: error.message }
        };
      }

    } catch (error) {
      return {
        status: 'failed',
        message: `ヘルスチェックの準備に失敗しました: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  async testPerformance() {
    try {
      const details = {};

      // 最新の本番デプロイメントURLを取得
      const deploymentsOutput = execSync('vercel ls', { encoding: 'utf8' });
      const lines = deploymentsOutput.split('\n').filter(line => line.trim());
      const deploymentLines = lines.filter(line => 
        line.includes('https://') && line.includes('READY')
      );

      if (deploymentLines.length === 0) {
        return {
          status: 'skipped',
          message: '本番デプロイメントが利用できないためスキップしました',
          details
        };
      }

      // 最初のREADY状態のデプロイメントを使用
      const latestReadyLine = deploymentLines[0];
      const parts = latestReadyLine.trim().split(/\s+/);
      const deploymentUrl = parts.find(part => part.startsWith('https://'));
      
      if (!deploymentUrl) {
        return {
          status: 'skipped',
          message: 'デプロイメントURLが取得できないためスキップしました',
          details
        };
      }

      const url = deploymentUrl;
      details['テストURL'] = url;

      // 複数回のリクエストでパフォーマンスを測定
      const measurements = [];
      const testCount = 3;

      for (let i = 0; i < testCount; i++) {
        try {
          const response = execSync(`curl -s -o /dev/null -w "%{time_total},%{time_connect},%{time_starttransfer}" "${url}"`, { 
            encoding: 'utf8',
            timeout: 30000
          });

          const [total, connect, firstByte] = response.trim().split(',').map(parseFloat);
          measurements.push({ total, connect, firstByte });

        } catch (error) {
          // エラーは無視して続行
        }
      }

      if (measurements.length === 0) {
        return {
          status: 'failed',
          message: 'パフォーマンス測定に失敗しました',
          details
        };
      }

      // 平均値を計算
      const avgTotal = measurements.reduce((sum, m) => sum + m.total, 0) / measurements.length;
      const avgConnect = measurements.reduce((sum, m) => sum + m.connect, 0) / measurements.length;
      const avgFirstByte = measurements.reduce((sum, m) => sum + m.firstByte, 0) / measurements.length;

      details['測定回数'] = measurements.length;
      details['平均レスポンス時間'] = `${avgTotal.toFixed(3)}秒`;
      details['平均接続時間'] = `${avgConnect.toFixed(3)}秒`;
      details['平均TTFB'] = `${avgFirstByte.toFixed(3)}秒`;

      // パフォーマンス評価
      let status = 'passed';
      let message = 'パフォーマンスは良好です';

      if (avgTotal > 3.0) {
        status = 'failed';
        message = 'レスポンス時間が遅すぎます';
        this.testResults.issues.push({
          type: 'performance',
          severity: 'medium',
          message: `レスポンス時間が遅いです: ${avgTotal.toFixed(3)}秒`
        });
      } else if (avgTotal > 1.5) {
        message = 'レスポンス時間がやや遅いです';
      }

      return {
        status,
        message,
        details
      };

    } catch (error) {
      return {
        status: 'failed',
        message: `パフォーマンステストに失敗しました: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  async generateReport() {
    // 推奨事項の生成
    this.generateRecommendations();

    // レポートファイルの保存
    const reportDir = '.kiro/reports';
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = `${reportDir}/e2e-test-report-${timestamp}.json`;

    fs.writeFileSync(reportPath, JSON.stringify(this.testResults, null, 2));
    console.log(chalk.green(`📄 テストレポートを保存しました: ${reportPath}`));

    // Markdownレポートも生成
    const markdownReport = this.generateMarkdownReport();
    const markdownPath = `${reportDir}/e2e-test-report-${timestamp}.md`;
    fs.writeFileSync(markdownPath, markdownReport);
    console.log(chalk.green(`📄 Markdownレポートを保存しました: ${markdownPath}`));
  }

  generateRecommendations() {
    const criticalIssues = this.testResults.issues.filter(i => i.severity === 'critical');
    const highIssues = this.testResults.issues.filter(i => i.severity === 'high');

    if (criticalIssues.length > 0) {
      this.testResults.recommendations.push({
        priority: 'critical',
        action: '緊急対応が必要',
        description: '重大な問題が検出されました。即座に対応してください。',
        items: criticalIssues.map(i => i.message)
      });
    }

    if (highIssues.length > 0) {
      this.testResults.recommendations.push({
        priority: 'high',
        action: '早急な対応が推奨',
        description: '重要な問題が検出されました。できるだけ早く対応してください。',
        items: highIssues.map(i => i.message)
      });
    }

    // 成功率に基づく推奨事項
    const successRate = (this.testResults.summary.passed / this.testResults.summary.total) * 100;
    
    if (successRate < 50) {
      this.testResults.recommendations.push({
        priority: 'high',
        action: '全体的な見直しが必要',
        description: 'テスト成功率が低いため、設定全体の見直しが必要です。',
        items: ['Vercel設定の確認', '環境変数の見直し', 'ビルド設定の最適化']
      });
    } else if (successRate < 80) {
      this.testResults.recommendations.push({
        priority: 'medium',
        action: '部分的な改善が推奨',
        description: 'いくつかの問題が検出されました。改善を検討してください。',
        items: ['失敗したテストの詳細確認', '設定の最適化']
      });
    }
  }

  generateMarkdownReport() {
    const md = [];
    
    md.push('# エンドツーエンドデプロイメントテストレポート');
    md.push('');
    md.push(`**実行日時**: ${new Date(this.testResults.timestamp).toLocaleString()}`);
    md.push('');
    
    // サマリー
    md.push('## テスト結果サマリー');
    md.push('');
    md.push('| 項目 | 件数 |');
    md.push('|------|------|');
    md.push(`| 総テスト数 | ${this.testResults.summary.total} |`);
    md.push(`| 成功 | ${this.testResults.summary.passed} |`);
    md.push(`| 失敗 | ${this.testResults.summary.failed} |`);
    md.push(`| スキップ | ${this.testResults.summary.skipped} |`);
    md.push(`| 成功率 | ${((this.testResults.summary.passed / this.testResults.summary.total) * 100).toFixed(1)}% |`);
    md.push('');
    
    // 詳細結果
    md.push('## 詳細テスト結果');
    md.push('');
    
    this.testResults.tests.forEach((test, index) => {
      const statusIcon = test.status === 'passed' ? '✅' : 
                        test.status === 'failed' ? '❌' : 
                        test.status === 'skipped' ? '⏭️' : '❓';
      
      md.push(`### ${index + 1}. ${statusIcon} ${test.name}`);
      md.push('');
      md.push(`**結果**: ${test.message}`);
      md.push(`**実行時間**: ${test.duration}ms`);
      
      if (test.details && Object.keys(test.details).length > 0) {
        md.push('');
        md.push('**詳細**:');
        Object.entries(test.details).forEach(([key, value]) => {
          md.push(`- ${key}: ${value}`);
        });
      }
      
      if (test.error) {
        md.push('');
        md.push(`**エラー**: ${test.error}`);
      }
      
      md.push('');
    });
    
    // 問題と推奨事項
    if (this.testResults.issues.length > 0) {
      md.push('## 検出された問題');
      md.push('');
      
      this.testResults.issues.forEach((issue, index) => {
        const severityIcon = issue.severity === 'critical' ? '🚨' : 
                            issue.severity === 'high' ? '⚠️' : 
                            issue.severity === 'medium' ? '💡' : 'ℹ️';
        
        md.push(`${index + 1}. ${severityIcon} **${issue.severity.toUpperCase()}**: ${issue.message}`);
      });
      
      md.push('');
    }
    
    if (this.testResults.recommendations.length > 0) {
      md.push('## 推奨事項');
      md.push('');
      
      this.testResults.recommendations.forEach((rec, index) => {
        md.push(`### ${index + 1}. ${rec.action}`);
        md.push('');
        md.push(`**優先度**: ${rec.priority.toUpperCase()}`);
        md.push(`**説明**: ${rec.description}`);
        md.push('');
        md.push('**対応項目**:');
        rec.items.forEach(item => md.push(`- ${item}`));
        md.push('');
      });
    }
    
    return md.join('\n');
  }

  displayResults() {
    console.log(chalk.blue('\n📊 テスト結果サマリー\n'));
    console.log('=' .repeat(60));
    
    const successRate = (this.testResults.summary.passed / this.testResults.summary.total) * 100;
    const rateColor = successRate >= 80 ? 'green' : successRate >= 50 ? 'yellow' : 'red';
    
    console.log(`総テスト数: ${this.testResults.summary.total}`);
    console.log(chalk.green(`成功: ${this.testResults.summary.passed}`));
    console.log(chalk.red(`失敗: ${this.testResults.summary.failed}`));
    console.log(chalk.blue(`スキップ: ${this.testResults.summary.skipped}`));
    console.log(chalk[rateColor](`成功率: ${successRate.toFixed(1)}%`));
    
    // 重要な問題の表示
    const criticalIssues = this.testResults.issues.filter(i => i.severity === 'critical');
    if (criticalIssues.length > 0) {
      console.log(chalk.red('\n🚨 緊急対応が必要な問題:'));
      criticalIssues.forEach(issue => {
        console.log(chalk.red(`  • ${issue.message}`));
      });
    }
    
    const highIssues = this.testResults.issues.filter(i => i.severity === 'high');
    if (highIssues.length > 0) {
      console.log(chalk.yellow('\n⚠️ 重要な問題:'));
      highIssues.forEach(issue => {
        console.log(chalk.yellow(`  • ${issue.message}`));
      });
    }
    
    // 推奨事項の表示
    if (this.testResults.recommendations.length > 0) {
      console.log(chalk.blue('\n💡 推奨事項:'));
      this.testResults.recommendations.slice(0, 3).forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec.action}`);
        console.log(`     ${rec.description}`);
      });
    }
    
    console.log(chalk.green('\n✨ テストが完了しました！'));
    console.log('詳細なレポートファイルを確認してください。');
  }
}

// CLI実行
if (import.meta.url === `file://${process.argv[1]}`) {
  const test = new E2EDeploymentTest();
  test.run().catch(console.error);
}

export default E2EDeploymentTest;