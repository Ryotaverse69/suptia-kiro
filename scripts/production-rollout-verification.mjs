#!/usr/bin/env node

/**
 * 本番環境ロールアウト検証スクリプト
 * 段階的な検証とロールアウトプロセスを管理
 */

import { execSync } from 'child_process';
import fs from 'fs';
import chalk from 'chalk';

class ProductionRolloutVerification {
  constructor() {
    this.phases = [
      {
        name: 'pre-deployment',
        title: 'デプロイ前検証',
        tests: [
          'checkGitStatus',
          'verifyEnvironmentVariables',
          'validateConfiguration',
          'runLocalTests'
        ]
      },
      {
        name: 'deployment',
        title: 'デプロイメント実行',
        tests: [
          'executeProductionDeploy',
          'monitorDeploymentProgress',
          'verifyDeploymentSuccess'
        ]
      },
      {
        name: 'post-deployment',
        title: 'デプロイ後検証',
        tests: [
          'verifyDomainAccess',
          'checkApplicationHealth',
          'validateFunctionality',
          'performanceCheck'
        ]
      },
      {
        name: 'monitoring',
        title: '継続監視設定',
        tests: [
          'setupContinuousMonitoring',
          'configureAlerts',
          'documentRollout'
        ]
      }
    ];

    this.results = {
      timestamp: new Date().toISOString(),
      phases: {},
      overall: {
        status: 'pending',
        startTime: new Date(),
        endTime: null,
        duration: null
      },
      metrics: {},
      issues: [],
      recommendations: []
    };

    this.verbose = process.argv.includes('--verbose');
    this.dryRun = process.argv.includes('--dry-run');
  }

  async run() {
    console.log(chalk.blue('🚀 本番環境ロールアウト検証を開始します...\n'));

    if (this.dryRun) {
      console.log(chalk.yellow('⚠️ ドライランモードで実行中（実際のデプロイは行いません）\n'));
    }

    try {
      for (const phase of this.phases) {
        await this.executePhase(phase);
        
        // フェーズ間の待機時間
        if (phase.name !== 'monitoring') {
          console.log(chalk.blue('⏳ 次のフェーズまで30秒待機中...\n'));
          if (!this.dryRun) {
            await this.sleep(30000);
          }
        }
      }

      await this.generateFinalReport();
      this.displaySummary();

    } catch (error) {
      console.error(chalk.red(`❌ ロールアウト検証中にエラーが発生しました: ${error.message}`));
      this.results.overall.status = 'failed';
      this.results.issues.push({
        type: 'critical',
        phase: 'execution',
        message: error.message,
        timestamp: new Date().toISOString()
      });
      process.exit(1);
    }
  }

  async executePhase(phase) {
    console.log(chalk.bold(`\n📋 ${phase.title} フェーズを開始...\n`));
    
    const phaseResult = {
      name: phase.name,
      title: phase.title,
      status: 'running',
      startTime: new Date(),
      endTime: null,
      tests: {},
      issues: []
    };

    this.results.phases[phase.name] = phaseResult;

    for (const testName of phase.tests) {
      try {
        console.log(chalk.blue(`  🧪 ${testName} を実行中...`));
        
        const testResult = await this.executeTest(testName);
        phaseResult.tests[testName] = testResult;
        
        if (testResult.status === 'passed') {
          console.log(chalk.green(`    ✅ ${testName}: 成功`));
        } else if (testResult.status === 'warning') {
          console.log(chalk.yellow(`    ⚠️ ${testName}: 警告 - ${testResult.message}`));
        } else {
          console.log(chalk.red(`    ❌ ${testName}: 失敗 - ${testResult.message}`));
          phaseResult.issues.push({
            test: testName,
            message: testResult.message,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.log(chalk.red(`    ❌ ${testName}: エラー - ${error.message}`));
        phaseResult.tests[testName] = {
          status: 'failed',
          message: error.message,
          timestamp: new Date().toISOString()
        };
        phaseResult.issues.push({
          test: testName,
          message: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    phaseResult.endTime = new Date();
    phaseResult.duration = phaseResult.endTime - phaseResult.startTime;
    
    // フェーズの全体的な成功/失敗を判定
    const failedTests = Object.values(phaseResult.tests).filter(t => t.status === 'failed');
    phaseResult.status = failedTests.length === 0 ? 'passed' : 'failed';

    if (phaseResult.status === 'passed') {
      console.log(chalk.green(`\n✅ ${phase.title} フェーズが完了しました`));
    } else {
      console.log(chalk.red(`\n❌ ${phase.title} フェーズで問題が発生しました`));
      
      // 重要なフェーズで失敗した場合は停止
      if (phase.name === 'deployment' && !this.dryRun) {
        throw new Error(`${phase.title}フェーズで重要な問題が発生したため、ロールアウトを停止します`);
      }
    }
  }

  async executeTest(testName) {
    const testStartTime = new Date();
    
    try {
      let result;
      
      switch (testName) {
        case 'checkGitStatus':
          result = await this.checkGitStatus();
          break;
        case 'verifyEnvironmentVariables':
          result = await this.verifyEnvironmentVariables();
          break;
        case 'validateConfiguration':
          result = await this.validateConfiguration();
          break;
        case 'runLocalTests':
          result = await this.runLocalTests();
          break;
        case 'executeProductionDeploy':
          result = await this.executeProductionDeploy();
          break;
        case 'monitorDeploymentProgress':
          result = await this.monitorDeploymentProgress();
          break;
        case 'verifyDeploymentSuccess':
          result = await this.verifyDeploymentSuccess();
          break;
        case 'verifyDomainAccess':
          result = await this.verifyDomainAccess();
          break;
        case 'checkApplicationHealth':
          result = await this.checkApplicationHealth();
          break;
        case 'validateFunctionality':
          result = await this.validateFunctionality();
          break;
        case 'performanceCheck':
          result = await this.performanceCheck();
          break;
        case 'setupContinuousMonitoring':
          result = await this.setupContinuousMonitoring();
          break;
        case 'configureAlerts':
          result = await this.configureAlerts();
          break;
        case 'documentRollout':
          result = await this.documentRollout();
          break;
        default:
          throw new Error(`未知のテスト: ${testName}`);
      }

      return {
        ...result,
        duration: new Date() - testStartTime,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'failed',
        message: error.message,
        duration: new Date() - testStartTime,
        timestamp: new Date().toISOString()
      };
    }
  }

  async checkGitStatus() {
    try {
      // 現在のブランチを確認
      const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
      
      if (currentBranch !== 'master') {
        return {
          status: 'warning',
          message: `現在のブランチは ${currentBranch} です。masterブランチでの実行を推奨します。`
        };
      }

      // 未コミットの変更を確認
      const status = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
      if (status) {
        return {
          status: 'warning',
          message: '未コミットの変更があります。コミットしてからデプロイすることを推奨します。'
        };
      }

      // リモートとの同期状況を確認
      try {
        execSync('git fetch origin', { stdio: 'pipe' });
        const behind = execSync('git rev-list --count HEAD..origin/master', { encoding: 'utf8' }).trim();
        if (parseInt(behind) > 0) {
          return {
            status: 'warning',
            message: `リモートより ${behind} コミット遅れています。git pull を実行してください。`
          };
        }
      } catch (error) {
        // リモート確認でエラーが発生した場合は警告として扱う
        return {
          status: 'warning',
          message: 'リモートとの同期状況を確認できませんでした。'
        };
      }

      return {
        status: 'passed',
        message: 'Gitの状態は正常です。',
        data: { branch: currentBranch }
      };
    } catch (error) {
      throw new Error(`Git状態の確認に失敗: ${error.message}`);
    }
  }

  async verifyEnvironmentVariables() {
    try {
      // 環境変数確認スクリプトを実行（--jsonオプションなしで）
      const output = execSync('node scripts/verify-env-variables.mjs', { encoding: 'utf8' });
      
      // 出力から成功/失敗を判定
      if (output.includes('✅') && !output.includes('❌')) {
        return {
          status: 'passed',
          message: '環境変数の設定は正常です。',
          data: { output }
        };
      } else if (output.includes('⚠️')) {
        return {
          status: 'warning',
          message: '環境変数に軽微な問題があります。',
          data: { output }
        };
      } else {
        return {
          status: 'failed',
          message: '環境変数に問題があります。',
          data: { output }
        };
      }
    } catch (error) {
      throw new Error(`環境変数の確認に失敗: ${error.message}`);
    }
  }

  async validateConfiguration() {
    try {
      // vercel.jsonの存在と構文確認
      if (!fs.existsSync('vercel.json')) {
        return {
          status: 'failed',
          message: 'vercel.json が見つかりません。'
        };
      }

      const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
      
      // 必要な設定項目の確認
      const requiredFields = ['version', 'framework'];
      const missingFields = requiredFields.filter(field => !vercelConfig[field]);
      
      if (missingFields.length > 0) {
        return {
          status: 'warning',
          message: `vercel.json に推奨設定が不足: ${missingFields.join(', ')}`
        };
      }

      return {
        status: 'passed',
        message: 'Vercel設定は正常です。',
        data: { config: vercelConfig }
      };
    } catch (error) {
      throw new Error(`設定の検証に失敗: ${error.message}`);
    }
  }

  async runLocalTests() {
    if (this.dryRun) {
      return {
        status: 'passed',
        message: 'ドライランモードのため、ローカルテストをスキップしました。'
      };
    }

    try {
      // package.jsonでテストスクリプトの存在を確認
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      
      if (!packageJson.scripts?.test) {
        return {
          status: 'warning',
          message: 'テストスクリプトが定義されていません。'
        };
      }

      // テストを実行
      execSync('npm test', { stdio: 'pipe' });
      
      return {
        status: 'passed',
        message: 'ローカルテストが成功しました。'
      };
    } catch (error) {
      return {
        status: 'failed',
        message: `ローカルテストが失敗しました: ${error.message}`
      };
    }
  }

  async executeProductionDeploy() {
    if (this.dryRun) {
      return {
        status: 'passed',
        message: 'ドライランモードのため、実際のデプロイはスキップしました。'
      };
    }

    try {
      console.log(chalk.blue('    📦 本番デプロイメントを実行中...'));
      
      // Vercel CLIを使用してデプロイ
      const deployOutput = execSync('vercel --prod --yes', { 
        encoding: 'utf8',
        timeout: 300000 // 5分のタイムアウト
      });

      // デプロイURLを抽出
      const urlMatch = deployOutput.match(/https:\/\/[^\s]+/);
      const deployUrl = urlMatch ? urlMatch[0] : null;

      return {
        status: 'passed',
        message: '本番デプロイメントが成功しました。',
        data: { 
          deployUrl,
          output: deployOutput 
        }
      };
    } catch (error) {
      throw new Error(`本番デプロイメントに失敗: ${error.message}`);
    }
  }

  async monitorDeploymentProgress() {
    if (this.dryRun) {
      return {
        status: 'passed',
        message: 'ドライランモードのため、デプロイ監視をスキップしました。'
      };
    }

    try {
      console.log(chalk.blue('    👀 デプロイメントの進行状況を監視中...'));
      
      // デプロイメント監視スクリプトを実行
      const monitorOutput = execSync('node scripts/monitor-deployment.mjs --timeout=180', { 
        encoding: 'utf8',
        timeout: 200000 // 3分20秒のタイムアウト
      });

      return {
        status: 'passed',
        message: 'デプロイメント監視が完了しました。',
        data: { output: monitorOutput }
      };
    } catch (error) {
      throw new Error(`デプロイメント監視に失敗: ${error.message}`);
    }
  }

  async verifyDeploymentSuccess() {
    try {
      // 最新のデプロイメント状況を確認
      const deployments = execSync('vercel ls', { encoding: 'utf8' });
      
      // デプロイメント一覧から本番デプロイメントを探す
      const lines = deployments.split('\n');
      const prodLine = lines.find(line => line.includes('production') || line.includes('READY'));
      
      if (!prodLine) {
        return {
          status: 'failed',
          message: '本番デプロイメントが見つかりません。'
        };
      }

      // READYステータスの確認
      if (!prodLine.includes('READY')) {
        return {
          status: 'failed',
          message: 'デプロイメントの状態が異常です。'
        };
      }

      return {
        status: 'passed',
        message: 'デプロイメントが正常に完了しました。',
        data: { deploymentInfo: prodLine.trim() }
      };
    } catch (error) {
      throw new Error(`デプロイメント確認に失敗: ${error.message}`);
    }
  }

  async verifyDomainAccess() {
    try {
      console.log(chalk.blue('    🌐 ドメインアクセスを検証中...'));
      
      // ドメイン検証スクリプトを実行（--jsonオプションなしで）
      const verifyOutput = execSync('node scripts/verify-custom-domain.mjs', { 
        encoding: 'utf8',
        timeout: 60000
      });
      
      // 出力から成功/失敗を判定
      if (verifyOutput.includes('✅') && !verifyOutput.includes('❌')) {
        return {
          status: 'passed',
          message: 'カスタムドメインアクセスが正常です。',
          data: { output: verifyOutput }
        };
      } else if (verifyOutput.includes('⚠️')) {
        return {
          status: 'warning',
          message: 'ドメインアクセスに軽微な問題があります。',
          data: { output: verifyOutput }
        };
      } else {
        return {
          status: 'failed',
          message: 'ドメインアクセスに問題があります。',
          data: { output: verifyOutput }
        };
      }
    } catch (error) {
      throw new Error(`ドメインアクセス検証に失敗: ${error.message}`);
    }
  }

  async checkApplicationHealth() {
    try {
      // アプリケーションのヘルスチェックエンドポイントを確認
      const healthUrls = [
        'https://suptia.com',
        'https://www.suptia.com',
        'https://suptia.com/api/health' // ヘルスチェックエンドポイントがある場合
      ];

      const results = [];
      
      for (const url of healthUrls) {
        try {
          const curlOutput = execSync(`curl -s -o /dev/null -w "%{http_code}" "${url}"`, { 
            encoding: 'utf8',
            timeout: 30000
          });
          
          const statusCode = parseInt(curlOutput.trim());
          results.push({
            url,
            statusCode,
            status: statusCode >= 200 && statusCode < 400 ? 'ok' : 'error'
          });
        } catch (error) {
          results.push({
            url,
            statusCode: null,
            status: 'error',
            error: error.message
          });
        }
      }

      const failedChecks = results.filter(r => r.status === 'error');
      
      if (failedChecks.length === 0) {
        return {
          status: 'passed',
          message: 'アプリケーションヘルスチェックが正常です。',
          data: { results }
        };
      } else {
        return {
          status: 'warning',
          message: `一部のヘルスチェックで問題が発生: ${failedChecks.length}/${results.length}`,
          data: { results }
        };
      }
    } catch (error) {
      throw new Error(`アプリケーションヘルスチェックに失敗: ${error.message}`);
    }
  }

  async validateFunctionality() {
    try {
      // 基本的な機能テストを実行
      const functionalityTests = [
        {
          name: 'ホームページアクセス',
          url: 'https://suptia.com',
          expectedStatus: 200
        },
        {
          name: 'APIエンドポイント',
          url: 'https://suptia.com/api',
          expectedStatus: [200, 404] // APIルートによって異なる
        }
      ];

      const results = [];
      
      for (const test of functionalityTests) {
        try {
          const curlOutput = execSync(`curl -s -o /dev/null -w "%{http_code}" "${test.url}"`, { 
            encoding: 'utf8',
            timeout: 30000
          });
          
          const statusCode = parseInt(curlOutput.trim());
          const expectedCodes = Array.isArray(test.expectedStatus) ? test.expectedStatus : [test.expectedStatus];
          const isValid = expectedCodes.includes(statusCode);
          
          results.push({
            name: test.name,
            url: test.url,
            statusCode,
            expected: test.expectedStatus,
            status: isValid ? 'passed' : 'failed'
          });
        } catch (error) {
          results.push({
            name: test.name,
            url: test.url,
            status: 'failed',
            error: error.message
          });
        }
      }

      const failedTests = results.filter(r => r.status === 'failed');
      
      if (failedTests.length === 0) {
        return {
          status: 'passed',
          message: '機能テストが正常に完了しました。',
          data: { results }
        };
      } else {
        return {
          status: 'failed',
          message: `機能テストで問題が発生: ${failedTests.length}/${results.length}`,
          data: { results }
        };
      }
    } catch (error) {
      throw new Error(`機能テストに失敗: ${error.message}`);
    }
  }

  async performanceCheck() {
    try {
      // 基本的なパフォーマンスチェック
      const performanceUrls = ['https://suptia.com'];
      const results = [];
      
      for (const url of performanceUrls) {
        try {
          const curlOutput = execSync(`curl -s -o /dev/null -w "%{time_total},%{time_connect},%{time_starttransfer}" "${url}"`, { 
            encoding: 'utf8',
            timeout: 30000
          });
          
          const [totalTime, connectTime, startTransferTime] = curlOutput.trim().split(',').map(parseFloat);
          
          results.push({
            url,
            totalTime,
            connectTime,
            startTransferTime,
            status: totalTime < 5.0 ? 'good' : totalTime < 10.0 ? 'acceptable' : 'slow'
          });
        } catch (error) {
          results.push({
            url,
            status: 'error',
            error: error.message
          });
        }
      }

      const slowResults = results.filter(r => r.status === 'slow');
      
      if (slowResults.length === 0) {
        return {
          status: 'passed',
          message: 'パフォーマンスチェックが正常です。',
          data: { results }
        };
      } else {
        return {
          status: 'warning',
          message: `パフォーマンスに改善の余地があります: ${slowResults.length}/${results.length}`,
          data: { results }
        };
      }
    } catch (error) {
      throw new Error(`パフォーマンスチェックに失敗: ${error.message}`);
    }
  }

  async setupContinuousMonitoring() {
    try {
      // 継続監視の設定確認
      const monitoringFiles = [
        '.github/workflows/health-check.yml',
        'scripts/monitor-deployment.mjs'
      ];

      const missingFiles = monitoringFiles.filter(file => !fs.existsSync(file));
      
      if (missingFiles.length > 0) {
        return {
          status: 'warning',
          message: `監視設定ファイルが不足: ${missingFiles.join(', ')}`
        };
      }

      return {
        status: 'passed',
        message: '継続監視の設定が完了しています。',
        data: { monitoringFiles }
      };
    } catch (error) {
      throw new Error(`継続監視設定の確認に失敗: ${error.message}`);
    }
  }

  async configureAlerts() {
    try {
      // アラート設定の確認
      const alertConfig = {
        githubActions: fs.existsSync('.github/workflows/health-check.yml'),
        monitoringScripts: fs.existsSync('scripts/monitor-deployment.mjs'),
        errorHandling: fs.existsSync('scripts/auto-recovery.mjs')
      };

      const configuredAlerts = Object.values(alertConfig).filter(Boolean).length;
      const totalAlerts = Object.keys(alertConfig).length;

      if (configuredAlerts === totalAlerts) {
        return {
          status: 'passed',
          message: 'アラート設定が完了しています。',
          data: alertConfig
        };
      } else {
        return {
          status: 'warning',
          message: `アラート設定が部分的です: ${configuredAlerts}/${totalAlerts}`,
          data: alertConfig
        };
      }
    } catch (error) {
      throw new Error(`アラート設定の確認に失敗: ${error.message}`);
    }
  }

  async documentRollout() {
    try {
      // ロールアウト結果の文書化
      const rolloutDoc = {
        timestamp: new Date().toISOString(),
        version: this.getVersionInfo(),
        phases: this.results.phases,
        metrics: this.results.metrics,
        issues: this.results.issues,
        recommendations: this.results.recommendations
      };

      const docPath = '.kiro/reports';
      if (!fs.existsSync(docPath)) {
        fs.mkdirSync(docPath, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `production-rollout-${timestamp}.json`;
      const filepath = `${docPath}/${filename}`;

      fs.writeFileSync(filepath, JSON.stringify(rolloutDoc, null, 2));

      return {
        status: 'passed',
        message: `ロールアウト結果を文書化しました: ${filepath}`,
        data: { filepath, document: rolloutDoc }
      };
    } catch (error) {
      throw new Error(`ロールアウト文書化に失敗: ${error.message}`);
    }
  }

  getVersionInfo() {
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const gitCommit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
      const gitBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
      
      return {
        package: packageJson.version,
        commit: gitCommit,
        branch: gitBranch
      };
    } catch (error) {
      return {
        error: error.message
      };
    }
  }

  async generateFinalReport() {
    this.results.overall.endTime = new Date();
    this.results.overall.duration = this.results.overall.endTime - this.results.overall.startTime;

    // 全体的な成功/失敗を判定
    const failedPhases = Object.values(this.results.phases).filter(p => p.status === 'failed');
    this.results.overall.status = failedPhases.length === 0 ? 'success' : 'failed';

    // メトリクスの計算
    this.results.metrics = {
      totalPhases: this.phases.length,
      successfulPhases: Object.values(this.results.phases).filter(p => p.status === 'passed').length,
      failedPhases: failedPhases.length,
      totalTests: Object.values(this.results.phases).reduce((sum, p) => sum + Object.keys(p.tests).length, 0),
      successfulTests: Object.values(this.results.phases).reduce((sum, p) => 
        sum + Object.values(p.tests).filter(t => t.status === 'passed').length, 0),
      failedTests: Object.values(this.results.phases).reduce((sum, p) => 
        sum + Object.values(p.tests).filter(t => t.status === 'failed').length, 0)
    };

    // 推奨事項の生成
    if (failedPhases.length > 0) {
      this.results.recommendations.push({
        type: 'critical',
        message: '失敗したフェーズの問題を解決してから再度ロールアウトを実行してください。'
      });
    }

    const warningTests = Object.values(this.results.phases).reduce((warnings, p) => 
      warnings.concat(Object.values(p.tests).filter(t => t.status === 'warning')), []);
    
    if (warningTests.length > 0) {
      this.results.recommendations.push({
        type: 'improvement',
        message: `${warningTests.length}個の警告があります。可能な限り対応することを推奨します。`
      });
    }
  }

  displaySummary() {
    console.log(chalk.blue('\n📊 ロールアウト検証結果サマリー\n'));
    console.log('=' .repeat(60));

    // 全体的な結果
    const statusColor = this.results.overall.status === 'success' ? 'green' : 'red';
    const statusIcon = this.results.overall.status === 'success' ? '✅' : '❌';
    console.log(`\n${statusIcon} 全体的な結果: ${chalk[statusColor](this.results.overall.status.toUpperCase())}`);
    console.log(`⏱️ 実行時間: ${Math.round(this.results.overall.duration / 1000)}秒`);

    // メトリクス
    console.log(`\n📈 メトリクス:`);
    console.log(`  フェーズ: ${this.results.metrics.successfulPhases}/${this.results.metrics.totalPhases} 成功`);
    console.log(`  テスト: ${this.results.metrics.successfulTests}/${this.results.metrics.totalTests} 成功`);

    // フェーズ別結果
    console.log(`\n📋 フェーズ別結果:`);
    Object.values(this.results.phases).forEach(phase => {
      const phaseStatusColor = phase.status === 'passed' ? 'green' : 'red';
      const phaseStatusIcon = phase.status === 'passed' ? '✅' : '❌';
      console.log(`  ${phaseStatusIcon} ${phase.title}: ${chalk[phaseStatusColor](phase.status)}`);
      
      if (phase.issues.length > 0) {
        phase.issues.forEach(issue => {
          console.log(`    ⚠️ ${issue.test}: ${issue.message}`);
        });
      }
    });

    // 推奨事項
    if (this.results.recommendations.length > 0) {
      console.log(`\n💡 推奨事項:`);
      this.results.recommendations.forEach(rec => {
        const recIcon = rec.type === 'critical' ? '🚨' : '💡';
        console.log(`  ${recIcon} ${rec.message}`);
      });
    }

    console.log(`\n🎉 ${chalk.green('ロールアウト検証が完了しました！')}`);
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// スクリプト実行
if (import.meta.url === `file://${process.argv[1]}`) {
  const verification = new ProductionRolloutVerification();
  verification.run().catch(console.error);
}

export default ProductionRolloutVerification;