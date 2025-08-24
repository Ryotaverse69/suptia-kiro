#!/usr/bin/env node

/**
 * 成功メトリクス測定スクリプト
 * デプロイメントの成功率、パフォーマンス、信頼性を測定・評価
 */

import { execSync } from 'child_process';
import fs from 'fs';
import chalk from 'chalk';

class SuccessMetricsMeasurement {
  constructor() {
    this.metrics = {
      timestamp: new Date().toISOString(),
      deployment: {
        successRate: null,
        averageDeployTime: null,
        failureRecoveryTime: null,
        lastDeployments: []
      },
      performance: {
        responseTime: null,
        availability: null,
        errorRate: null,
        throughput: null
      },
      reliability: {
        uptime: null,
        mtbf: null, // Mean Time Between Failures
        mttr: null, // Mean Time To Recovery
        slaCompliance: null
      },
      quality: {
        buildSuccess: null,
        testCoverage: null,
        codeQuality: null,
        securityScore: null
      }
    };

    this.targets = {
      deployment: {
        successRate: 95, // 95%以上
        averageDeployTime: 300, // 5分以内
        failureRecoveryTime: 600 // 10分以内
      },
      performance: {
        responseTime: 2000, // 2秒以内
        availability: 99.9, // 99.9%以上
        errorRate: 1 // 1%以下
      },
      reliability: {
        uptime: 99.5, // 99.5%以上
        mtbf: 168, // 1週間以上
        mttr: 30 // 30分以内
      }
    };

    this.period = process.argv.includes('--period') ? 
      process.argv[process.argv.indexOf('--period') + 1] : '7d';
  }

  async run() {
    console.log(chalk.blue('📊 成功メトリクスの測定を開始します...\n'));
    console.log(`📅 測定期間: ${this.period}\n`);

    try {
      await this.measureDeploymentMetrics();
      await this.measurePerformanceMetrics();
      await this.measureReliabilityMetrics();
      await this.measureQualityMetrics();
      
      await this.evaluateMetrics();
      await this.generateReport();
      this.displayResults();

    } catch (error) {
      console.error(chalk.red(`❌ メトリクス測定中にエラーが発生しました: ${error.message}`));
      process.exit(1);
    }
  }

  async measureDeploymentMetrics() {
    console.log(chalk.blue('🚀 デプロイメントメトリクスを測定中...'));

    try {
      // 最近のデプロイメント履歴を取得
      const deployments = await this.getRecentDeployments();
      this.metrics.deployment.lastDeployments = deployments;

      if (deployments.length === 0) {
        console.log(chalk.yellow('  ⚠️ デプロイメント履歴が見つかりません'));
        return;
      }

      // 成功率の計算
      const successfulDeployments = deployments.filter(d => d.state === 'READY');
      this.metrics.deployment.successRate = (successfulDeployments.length / deployments.length) * 100;

      // 平均デプロイ時間の計算
      const deployTimes = successfulDeployments
        .filter(d => d.createdAt && d.readyAt)
        .map(d => new Date(d.readyAt) - new Date(d.createdAt));
      
      if (deployTimes.length > 0) {
        this.metrics.deployment.averageDeployTime = deployTimes.reduce((a, b) => a + b, 0) / deployTimes.length / 1000;
      }

      // 失敗からの復旧時間の計算
      const failedDeployments = deployments.filter(d => d.state === 'ERROR');
      if (failedDeployments.length > 0) {
        const recoveryTimes = [];
        failedDeployments.forEach(failed => {
          const nextSuccess = deployments.find(d => 
            d.state === 'READY' && 
            new Date(d.createdAt) > new Date(failed.createdAt)
          );
          if (nextSuccess) {
            recoveryTimes.push(new Date(nextSuccess.readyAt) - new Date(failed.createdAt));
          }
        });
        
        if (recoveryTimes.length > 0) {
          this.metrics.deployment.failureRecoveryTime = recoveryTimes.reduce((a, b) => a + b, 0) / recoveryTimes.length / 1000;
        }
      }

      console.log(chalk.green(`  ✅ 成功率: ${this.metrics.deployment.successRate?.toFixed(1)}%`));
      console.log(chalk.green(`  ✅ 平均デプロイ時間: ${this.metrics.deployment.averageDeployTime?.toFixed(0)}秒`));
      if (this.metrics.deployment.failureRecoveryTime) {
        console.log(chalk.green(`  ✅ 復旧時間: ${this.metrics.deployment.failureRecoveryTime?.toFixed(0)}秒`));
      }

    } catch (error) {
      console.log(chalk.red(`  ❌ デプロイメントメトリクス測定に失敗: ${error.message}`));
    }

    console.log();
  }

  async getRecentDeployments() {
    try {
      const deploymentsOutput = execSync('vercel ls', { encoding: 'utf8' });
      
      // テキスト出力をパースしてデプロイメント情報を抽出
      const lines = deploymentsOutput.split('\n').filter(line => line.trim());
      const deployments = [];
      
      for (const line of lines) {
        if (line.includes('https://') && (line.includes('READY') || line.includes('ERROR'))) {
          const parts = line.trim().split(/\s+/);
          const url = parts.find(part => part.startsWith('https://'));
          const state = parts.find(part => part === 'READY' || part === 'ERROR') || 'UNKNOWN';
          const age = parts[parts.length - 1];
          
          deployments.push({
            url,
            state,
            age,
            createdAt: new Date(Date.now() - this.parseAge(age)).toISOString(),
            readyAt: state === 'READY' ? new Date().toISOString() : null
          });
        }
      }
      
      return deployments.slice(0, 10); // 最新10件
    } catch (error) {
      throw new Error(`デプロイメント履歴の取得に失敗: ${error.message}`);
    }
  }

  parseAge(ageString) {
    // "2h", "1d", "3m" などの形式をミリ秒に変換
    const match = ageString.match(/^(\d+)([smhd])$/);
    if (!match) return 0;
    
    const [, num, unit] = match;
    const multipliers = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000
    };
    
    return parseInt(num) * (multipliers[unit] || 0);
  }

  async measurePerformanceMetrics() {
    console.log(chalk.blue('⚡ パフォーマンスメトリクスを測定中...'));

    try {
      // レスポンス時間の測定
      await this.measureResponseTime();
      
      // 可用性の測定
      await this.measureAvailability();
      
      // エラー率の測定
      await this.measureErrorRate();

      console.log(chalk.green(`  ✅ レスポンス時間: ${this.metrics.performance.responseTime}ms`));
      console.log(chalk.green(`  ✅ 可用性: ${this.metrics.performance.availability?.toFixed(2)}%`));
      console.log(chalk.green(`  ✅ エラー率: ${this.metrics.performance.errorRate?.toFixed(2)}%`));

    } catch (error) {
      console.log(chalk.red(`  ❌ パフォーマンスメトリクス測定に失敗: ${error.message}`));
    }

    console.log();
  }

  async measureResponseTime() {
    const urls = ['https://suptia.com', 'https://www.suptia.com'];
    const measurements = [];

    for (const url of urls) {
      try {
        const curlOutput = execSync(`curl -s -o /dev/null -w "%{time_total}" "${url}"`, { 
          encoding: 'utf8',
          timeout: 30000
        });
        
        const responseTime = parseFloat(curlOutput.trim()) * 1000; // ミリ秒に変換
        measurements.push(responseTime);
      } catch (error) {
        console.log(chalk.yellow(`    ⚠️ ${url} のレスポンス時間測定に失敗`));
      }
    }

    if (measurements.length > 0) {
      this.metrics.performance.responseTime = Math.round(measurements.reduce((a, b) => a + b, 0) / measurements.length);
    }
  }

  async measureAvailability() {
    // 簡易的な可用性チェック（複数回のリクエストで判定）
    const urls = ['https://suptia.com'];
    const checkCount = 10;
    let successCount = 0;

    for (let i = 0; i < checkCount; i++) {
      for (const url of urls) {
        try {
          const curlOutput = execSync(`curl -s -o /dev/null -w "%{http_code}" "${url}"`, { 
            encoding: 'utf8',
            timeout: 10000
          });
          
          const statusCode = parseInt(curlOutput.trim());
          if (statusCode >= 200 && statusCode < 400) {
            successCount++;
          }
        } catch (error) {
          // リクエスト失敗はダウンタイムとしてカウント
        }
      }
      
      // チェック間隔
      if (i < checkCount - 1) {
        await this.sleep(1000);
      }
    }

    this.metrics.performance.availability = (successCount / (checkCount * urls.length)) * 100;
  }

  async measureErrorRate() {
    // エラー率の測定（ログベースまたはモニタリングデータから）
    // 簡易実装として、最近のデプロイメントエラー率を使用
    const deployments = this.metrics.deployment.lastDeployments;
    
    if (deployments.length > 0) {
      const errorDeployments = deployments.filter(d => d.state === 'ERROR');
      this.metrics.performance.errorRate = (errorDeployments.length / deployments.length) * 100;
    }
  }

  async measureReliabilityMetrics() {
    console.log(chalk.blue('🔒 信頼性メトリクスを測定中...'));

    try {
      // アップタイムの測定
      await this.measureUptime();
      
      // MTBF/MTTRの計算
      await this.calculateMTBFMTTR();

      console.log(chalk.green(`  ✅ アップタイム: ${this.metrics.reliability.uptime?.toFixed(2)}%`));
      if (this.metrics.reliability.mtbf) {
        console.log(chalk.green(`  ✅ MTBF: ${this.metrics.reliability.mtbf?.toFixed(1)}時間`));
      }
      if (this.metrics.reliability.mttr) {
        console.log(chalk.green(`  ✅ MTTR: ${this.metrics.reliability.mttr?.toFixed(1)}分`));
      }

    } catch (error) {
      console.log(chalk.red(`  ❌ 信頼性メトリクス測定に失敗: ${error.message}`));
    }

    console.log();
  }

  async measureUptime() {
    // 簡易的なアップタイム計算（デプロイメント成功率ベース）
    const deployments = this.metrics.deployment.lastDeployments;
    
    if (deployments.length > 0) {
      const successfulDeployments = deployments.filter(d => d.state === 'READY');
      this.metrics.reliability.uptime = (successfulDeployments.length / deployments.length) * 100;
    }
  }

  async calculateMTBFMTTR() {
    const deployments = this.metrics.deployment.lastDeployments;
    
    if (deployments.length < 2) return;

    // 失敗イベントを特定
    const failures = deployments.filter(d => d.state === 'ERROR');
    
    if (failures.length > 0) {
      // MTBF計算（失敗間の平均時間）
      if (failures.length > 1) {
        const intervals = [];
        for (let i = 1; i < failures.length; i++) {
          const interval = new Date(failures[i-1].createdAt) - new Date(failures[i].createdAt);
          intervals.push(interval);
        }
        this.metrics.reliability.mtbf = intervals.reduce((a, b) => a + b, 0) / intervals.length / (1000 * 60 * 60); // 時間単位
      }

      // MTTR計算（復旧までの平均時間）
      const recoveryTimes = [];
      failures.forEach(failure => {
        const nextSuccess = deployments.find(d => 
          d.state === 'READY' && 
          new Date(d.createdAt) > new Date(failure.createdAt)
        );
        if (nextSuccess) {
          const recoveryTime = new Date(nextSuccess.readyAt) - new Date(failure.createdAt);
          recoveryTimes.push(recoveryTime);
        }
      });
      
      if (recoveryTimes.length > 0) {
        this.metrics.reliability.mttr = recoveryTimes.reduce((a, b) => a + b, 0) / recoveryTimes.length / (1000 * 60); // 分単位
      }
    }
  }

  async measureQualityMetrics() {
    console.log(chalk.blue('🎯 品質メトリクスを測定中...'));

    try {
      // ビルド成功率
      await this.measureBuildSuccess();
      
      // テストカバレッジ
      await this.measureTestCoverage();
      
      // コード品質
      await this.measureCodeQuality();

      console.log(chalk.green(`  ✅ ビルド成功率: ${this.metrics.quality.buildSuccess?.toFixed(1)}%`));
      if (this.metrics.quality.testCoverage) {
        console.log(chalk.green(`  ✅ テストカバレッジ: ${this.metrics.quality.testCoverage?.toFixed(1)}%`));
      }
      if (this.metrics.quality.codeQuality) {
        console.log(chalk.green(`  ✅ コード品質スコア: ${this.metrics.quality.codeQuality}`));
      }

    } catch (error) {
      console.log(chalk.red(`  ❌ 品質メトリクス測定に失敗: ${error.message}`));
    }

    console.log();
  }

  async measureBuildSuccess() {
    // GitHub Actionsのワークフロー実行結果から計算
    try {
      const workflowRuns = await this.getWorkflowRuns();
      
      if (workflowRuns.length > 0) {
        const successfulRuns = workflowRuns.filter(run => run.conclusion === 'success');
        this.metrics.quality.buildSuccess = (successfulRuns.length / workflowRuns.length) * 100;
      }
    } catch (error) {
      console.log(chalk.yellow(`    ⚠️ ビルド成功率の測定をスキップ: ${error.message}`));
    }
  }

  async getWorkflowRuns() {
    // GitHub CLIを使用してワークフロー実行履歴を取得
    try {
      const output = execSync('gh run list --limit 20 --json conclusion,status,createdAt', { 
        encoding: 'utf8',
        timeout: 30000
      });
      
      const runs = JSON.parse(output);
      
      // 指定期間内の実行をフィルタ
      const periodMs = this.parsePeriod(this.period);
      const cutoffDate = new Date(Date.now() - periodMs);
      
      return runs.filter(run => new Date(run.createdAt) > cutoffDate);
    } catch (error) {
      throw new Error(`ワークフロー実行履歴の取得に失敗: ${error.message}`);
    }
  }

  async measureTestCoverage() {
    // package.jsonでテストスクリプトの存在を確認
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      
      if (packageJson.scripts?.test) {
        // テストカバレッジレポートが存在する場合は解析
        if (fs.existsSync('coverage/coverage-summary.json')) {
          const coverageData = JSON.parse(fs.readFileSync('coverage/coverage-summary.json', 'utf8'));
          this.metrics.quality.testCoverage = coverageData.total?.lines?.pct || null;
        }
      }
    } catch (error) {
      console.log(chalk.yellow(`    ⚠️ テストカバレッジの測定をスキップ: ${error.message}`));
    }
  }

  async measureCodeQuality() {
    // ESLintやPrettierの設定存在確認
    const qualityTools = {
      eslint: fs.existsSync('.eslintrc.js') || fs.existsSync('.eslintrc.json'),
      prettier: fs.existsSync('.prettierrc') || fs.existsSync('prettier.config.js'),
      typescript: fs.existsSync('tsconfig.json'),
      husky: fs.existsSync('.husky')
    };

    const configuredTools = Object.values(qualityTools).filter(Boolean).length;
    this.metrics.quality.codeQuality = `${configuredTools}/4`;
  }

  async evaluateMetrics() {
    console.log(chalk.blue('📈 メトリクス評価中...'));

    const evaluation = {
      deployment: this.evaluateDeploymentMetrics(),
      performance: this.evaluatePerformanceMetrics(),
      reliability: this.evaluateReliabilityMetrics(),
      quality: this.evaluateQualityMetrics()
    };

    this.evaluation = evaluation;

    // 全体的な評価
    const scores = Object.values(evaluation).map(e => e.score).filter(s => s !== null);
    const overallScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    
    this.evaluation.overall = {
      score: overallScore,
      grade: this.getGrade(overallScore),
      recommendations: this.generateRecommendations(evaluation)
    };

    console.log(chalk.green(`  ✅ 評価完了 - 総合スコア: ${overallScore.toFixed(1)}/100 (${this.evaluation.overall.grade})`));
    console.log();
  }

  evaluateDeploymentMetrics() {
    const metrics = this.metrics.deployment;
    const targets = this.targets.deployment;
    let score = 0;
    let maxScore = 0;
    const issues = [];

    // 成功率評価
    if (metrics.successRate !== null) {
      maxScore += 40;
      if (metrics.successRate >= targets.successRate) {
        score += 40;
      } else if (metrics.successRate >= 80) {
        score += 30;
        issues.push('デプロイ成功率が目標を下回っています');
      } else {
        score += 10;
        issues.push('デプロイ成功率が大幅に目標を下回っています');
      }
    }

    // デプロイ時間評価
    if (metrics.averageDeployTime !== null) {
      maxScore += 30;
      if (metrics.averageDeployTime <= targets.averageDeployTime) {
        score += 30;
      } else if (metrics.averageDeployTime <= targets.averageDeployTime * 2) {
        score += 20;
        issues.push('デプロイ時間が目標を上回っています');
      } else {
        score += 5;
        issues.push('デプロイ時間が大幅に目標を上回っています');
      }
    }

    // 復旧時間評価
    if (metrics.failureRecoveryTime !== null) {
      maxScore += 30;
      if (metrics.failureRecoveryTime <= targets.failureRecoveryTime) {
        score += 30;
      } else {
        score += 15;
        issues.push('障害復旧時間が目標を上回っています');
      }
    }

    return {
      category: 'deployment',
      score: maxScore > 0 ? (score / maxScore) * 100 : null,
      issues,
      metrics
    };
  }

  evaluatePerformanceMetrics() {
    const metrics = this.metrics.performance;
    const targets = this.targets.performance;
    let score = 0;
    let maxScore = 0;
    const issues = [];

    // レスポンス時間評価
    if (metrics.responseTime !== null) {
      maxScore += 40;
      if (metrics.responseTime <= targets.responseTime) {
        score += 40;
      } else if (metrics.responseTime <= targets.responseTime * 2) {
        score += 25;
        issues.push('レスポンス時間が目標を上回っています');
      } else {
        score += 10;
        issues.push('レスポンス時間が大幅に目標を上回っています');
      }
    }

    // 可用性評価
    if (metrics.availability !== null) {
      maxScore += 40;
      if (metrics.availability >= targets.availability) {
        score += 40;
      } else if (metrics.availability >= 95) {
        score += 25;
        issues.push('可用性が目標を下回っています');
      } else {
        score += 10;
        issues.push('可用性が大幅に目標を下回っています');
      }
    }

    // エラー率評価
    if (metrics.errorRate !== null) {
      maxScore += 20;
      if (metrics.errorRate <= targets.errorRate) {
        score += 20;
      } else {
        score += 5;
        issues.push('エラー率が目標を上回っています');
      }
    }

    return {
      category: 'performance',
      score: maxScore > 0 ? (score / maxScore) * 100 : null,
      issues,
      metrics
    };
  }

  evaluateReliabilityMetrics() {
    const metrics = this.metrics.reliability;
    const targets = this.targets.reliability;
    let score = 0;
    let maxScore = 0;
    const issues = [];

    // アップタイム評価
    if (metrics.uptime !== null) {
      maxScore += 50;
      if (metrics.uptime >= targets.uptime) {
        score += 50;
      } else if (metrics.uptime >= 95) {
        score += 30;
        issues.push('アップタイムが目標を下回っています');
      } else {
        score += 10;
        issues.push('アップタイムが大幅に目標を下回っています');
      }
    }

    // MTBF評価
    if (metrics.mtbf !== null) {
      maxScore += 25;
      if (metrics.mtbf >= targets.mtbf) {
        score += 25;
      } else {
        score += 10;
        issues.push('MTBF（平均故障間隔）が目標を下回っています');
      }
    }

    // MTTR評価
    if (metrics.mttr !== null) {
      maxScore += 25;
      if (metrics.mttr <= targets.mttr) {
        score += 25;
      } else {
        score += 10;
        issues.push('MTTR（平均復旧時間）が目標を上回っています');
      }
    }

    return {
      category: 'reliability',
      score: maxScore > 0 ? (score / maxScore) * 100 : null,
      issues,
      metrics
    };
  }

  evaluateQualityMetrics() {
    const metrics = this.metrics.quality;
    let score = 0;
    let maxScore = 0;
    const issues = [];

    // ビルド成功率評価
    if (metrics.buildSuccess !== null) {
      maxScore += 40;
      if (metrics.buildSuccess >= 95) {
        score += 40;
      } else if (metrics.buildSuccess >= 80) {
        score += 25;
        issues.push('ビルド成功率が低下しています');
      } else {
        score += 10;
        issues.push('ビルド成功率が大幅に低下しています');
      }
    }

    // テストカバレッジ評価
    if (metrics.testCoverage !== null) {
      maxScore += 30;
      if (metrics.testCoverage >= 80) {
        score += 30;
      } else if (metrics.testCoverage >= 60) {
        score += 20;
        issues.push('テストカバレッジが不十分です');
      } else {
        score += 5;
        issues.push('テストカバレッジが大幅に不足しています');
      }
    }

    // コード品質評価
    if (metrics.codeQuality) {
      maxScore += 30;
      const [configured, total] = metrics.codeQuality.split('/').map(Number);
      const qualityScore = (configured / total) * 30;
      score += qualityScore;
      
      if (configured < total) {
        issues.push('コード品質ツールの設定が不完全です');
      }
    }

    return {
      category: 'quality',
      score: maxScore > 0 ? (score / maxScore) * 100 : null,
      issues,
      metrics
    };
  }

  getGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  generateRecommendations(evaluation) {
    const recommendations = [];

    Object.values(evaluation).forEach(category => {
      if (category.issues) {
        category.issues.forEach(issue => {
          recommendations.push({
            category: category.category,
            issue,
            priority: category.score < 70 ? 'high' : 'medium'
          });
        });
      }
    });

    return recommendations;
  }

  async generateReport() {
    const report = {
      timestamp: this.metrics.timestamp,
      period: this.period,
      metrics: this.metrics,
      evaluation: this.evaluation,
      targets: this.targets
    };

    const reportPath = '.kiro/reports';
    if (!fs.existsSync(reportPath)) {
      fs.mkdirSync(reportPath, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `success-metrics-${timestamp}.json`;
    const filepath = `${reportPath}/${filename}`;

    fs.writeFileSync(filepath, JSON.stringify(report, null, 2));

    // Markdownレポートも生成
    const markdownReport = this.generateMarkdownReport(report);
    const markdownPath = `${reportPath}/success-metrics-${timestamp}.md`;
    fs.writeFileSync(markdownPath, markdownReport);

    console.log(chalk.green(`📄 メトリクスレポートを保存しました: ${filepath}`));
    console.log(chalk.green(`📄 Markdownレポートを保存しました: ${markdownPath}`));
  }

  generateMarkdownReport(report) {
    const md = [];
    
    md.push('# 成功メトリクス レポート');
    md.push('');
    md.push(`**生成日時**: ${new Date(report.timestamp).toLocaleString()}`);
    md.push(`**測定期間**: ${report.period}`);
    md.push('');
    
    md.push('## 総合評価');
    md.push('');
    md.push(`**総合スコア**: ${report.evaluation.overall.score.toFixed(1)}/100 (${report.evaluation.overall.grade})`);
    md.push('');
    
    md.push('## カテゴリ別評価');
    md.push('');
    md.push('| カテゴリ | スコア | グレード | 主な問題 |');
    md.push('|----------|--------|----------|----------|');
    
    Object.values(report.evaluation).forEach(category => {
      if (category.category) {
        const score = category.score?.toFixed(1) || 'N/A';
        const grade = category.score ? this.getGrade(category.score) : 'N/A';
        const issues = category.issues?.slice(0, 2).join(', ') || 'なし';
        md.push(`| ${category.category} | ${score} | ${grade} | ${issues} |`);
      }
    });
    
    md.push('');
    
    md.push('## 詳細メトリクス');
    md.push('');
    
    // デプロイメントメトリクス
    md.push('### デプロイメント');
    md.push('');
    md.push(`- **成功率**: ${report.metrics.deployment.successRate?.toFixed(1)}% (目標: ${report.targets.deployment.successRate}%)`);
    md.push(`- **平均デプロイ時間**: ${report.metrics.deployment.averageDeployTime?.toFixed(0)}秒 (目標: ${report.targets.deployment.averageDeployTime}秒)`);
    if (report.metrics.deployment.failureRecoveryTime) {
      md.push(`- **復旧時間**: ${report.metrics.deployment.failureRecoveryTime?.toFixed(0)}秒 (目標: ${report.targets.deployment.failureRecoveryTime}秒)`);
    }
    md.push('');
    
    // パフォーマンスメトリクス
    md.push('### パフォーマンス');
    md.push('');
    md.push(`- **レスポンス時間**: ${report.metrics.performance.responseTime}ms (目標: ${report.targets.performance.responseTime}ms)`);
    md.push(`- **可用性**: ${report.metrics.performance.availability?.toFixed(2)}% (目標: ${report.targets.performance.availability}%)`);
    md.push(`- **エラー率**: ${report.metrics.performance.errorRate?.toFixed(2)}% (目標: ${report.targets.performance.errorRate}%)`);
    md.push('');
    
    // 信頼性メトリクス
    md.push('### 信頼性');
    md.push('');
    md.push(`- **アップタイム**: ${report.metrics.reliability.uptime?.toFixed(2)}% (目標: ${report.targets.reliability.uptime}%)`);
    if (report.metrics.reliability.mtbf) {
      md.push(`- **MTBF**: ${report.metrics.reliability.mtbf?.toFixed(1)}時間 (目標: ${report.targets.reliability.mtbf}時間)`);
    }
    if (report.metrics.reliability.mttr) {
      md.push(`- **MTTR**: ${report.metrics.reliability.mttr?.toFixed(1)}分 (目標: ${report.targets.reliability.mttr}分)`);
    }
    md.push('');
    
    // 品質メトリクス
    md.push('### 品質');
    md.push('');
    if (report.metrics.quality.buildSuccess) {
      md.push(`- **ビルド成功率**: ${report.metrics.quality.buildSuccess?.toFixed(1)}%`);
    }
    if (report.metrics.quality.testCoverage) {
      md.push(`- **テストカバレッジ**: ${report.metrics.quality.testCoverage?.toFixed(1)}%`);
    }
    if (report.metrics.quality.codeQuality) {
      md.push(`- **コード品質**: ${report.metrics.quality.codeQuality}`);
    }
    md.push('');
    
    // 推奨事項
    if (report.evaluation.overall.recommendations.length > 0) {
      md.push('## 推奨事項');
      md.push('');
      report.evaluation.overall.recommendations.forEach((rec, index) => {
        const priority = rec.priority === 'high' ? '🔴 高' : '🟡 中';
        md.push(`${index + 1}. **[${priority}] ${rec.category}**: ${rec.issue}`);
      });
      md.push('');
    }
    
    return md.join('\\n');
  }

  displayResults() {
    console.log(chalk.blue('📊 成功メトリクス測定結果\n'));
    console.log('=' .repeat(60));

    // 総合評価
    const overallScore = this.evaluation.overall.score;
    const overallGrade = this.evaluation.overall.grade;
    const scoreColor = overallScore >= 80 ? 'green' : overallScore >= 60 ? 'yellow' : 'red';
    
    console.log(`\n🎯 総合評価: ${chalk[scoreColor](overallScore.toFixed(1))}/100 (${chalk[scoreColor](overallGrade)})`);

    // カテゴリ別結果
    console.log(`\n📈 カテゴリ別スコア:`);
    Object.values(this.evaluation).forEach(category => {
      if (category.category) {
        const score = category.score?.toFixed(1) || 'N/A';
        const grade = category.score ? this.getGrade(category.score) : 'N/A';
        const color = category.score >= 80 ? 'green' : category.score >= 60 ? 'yellow' : 'red';
        console.log(`  ${category.category}: ${chalk[color](score)} (${chalk[color](grade)})`);
      }
    });

    // 主要な問題
    const highPriorityIssues = this.evaluation.overall.recommendations.filter(r => r.priority === 'high');
    if (highPriorityIssues.length > 0) {
      console.log(`\n🚨 優先対応が必要な問題:`);
      highPriorityIssues.forEach(issue => {
        console.log(chalk.red(`  • ${issue.category}: ${issue.issue}`));
      });
    }

    // 改善提案
    const mediumPriorityIssues = this.evaluation.overall.recommendations.filter(r => r.priority === 'medium');
    if (mediumPriorityIssues.length > 0) {
      console.log(`\n💡 改善提案:`);
      mediumPriorityIssues.slice(0, 3).forEach(issue => {
        console.log(chalk.yellow(`  • ${issue.category}: ${issue.issue}`));
      });
    }

    console.log(`\n✨ ${chalk.green('メトリクス測定が完了しました！')}`);
  }

  parsePeriod(period) {
    const match = period.match(/^(\d+)([hdw])$/);
    if (!match) return 7 * 24 * 60 * 60 * 1000; // デフォルト7日

    const [, num, unit] = match;
    const multipliers = {
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
      w: 7 * 24 * 60 * 60 * 1000
    };

    return parseInt(num) * multipliers[unit];
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// スクリプト実行
if (import.meta.url === `file://${process.argv[1]}`) {
  const measurement = new SuccessMetricsMeasurement();
  measurement.run().catch(console.error);
}

export default SuccessMetricsMeasurement;