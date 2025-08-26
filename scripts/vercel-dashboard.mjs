#!/usr/bin/env node

/**
 * Vercel Dashboard
 * リアルタイムでVercelの状況を監視・表示するダッシュボード
 */

import { execSync } from 'child_process';
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

class VercelDashboard {
  constructor() {
    this.reportsDir = join(process.cwd(), '.kiro', 'reports');
    mkdirSync(this.reportsDir, { recursive: true });
    this.projectName = 'suptia-kiro';
  }

  /**
   * Vercel CLIコマンドを実行（エラーハンドリング強化）
   */
  execVercel(command, options = {}) {
    try {
      const result = execSync(`vercel ${command}`, {
        encoding: 'utf8',
        stdio: options.silent ? 'pipe' : 'inherit',
        ...options
      });
      return result.trim();
    } catch (error) {
      if (!options.silent) {
        console.error(`❌ エラー: vercel ${command}`);
        console.error(error.message);
      }
      return null;
    }
  }

  /**
   * デプロイメント詳細情報を解析
   */
  parseDeployments(deploymentList) {
    if (!deploymentList) return [];
    
    const lines = deploymentList.split('\n').filter(line => line.trim());
    return lines.map((url, index) => {
      const deploymentId = url.split('-').pop().split('.')[0];
      return {
        id: deploymentId,
        url: url.trim(),
        position: index + 1,
        isLatest: index === 0,
        status: index === 0 ? 'active' : 'inactive'
      };
    });
  }

  /**
   * 環境変数情報を解析
   */
  parseEnvVars(envList) {
    if (!envList) return [];
    
    const lines = envList.split('\n').filter(line => line.trim() && !line.includes('name'));
    return lines.map(line => {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 4) {
        return {
          name: parts[0],
          value: parts[1],
          environments: parts[2],
          created: parts[3]
        };
      }
      return null;
    }).filter(Boolean);
  }

  /**
   * プロジェクト健全性チェック
   */
  async healthAnalysis() {
    console.log('🏥 プロジェクト健全性分析中...\n');
    
    const health = {
      overall: 'healthy',
      issues: [],
      recommendations: [],
      score: 100
    };

    // デプロイメント数チェック
    const deployments = this.execVercel('ls', { silent: true });
    const deploymentCount = deployments ? deployments.split('\n').length : 0;
    
    if (deploymentCount > 50) {
      health.issues.push('デプロイメント数が多すぎます（50+）');
      health.recommendations.push('古いデプロイメントの削除を検討');
      health.score -= 10;
    }

    // 環境変数チェック
    const envVars = this.execVercel('env ls', { silent: true });
    const envCount = envVars ? envVars.split('\n').length - 1 : 0;
    
    if (envCount > 20) {
      health.issues.push('環境変数が多すぎます（20+）');
      health.recommendations.push('不要な環境変数の整理を検討');
      health.score -= 5;
    }

    // 本番環境の必須環境変数チェック
    const requiredEnvs = [
      'NEXT_PUBLIC_SANITY_PROJECT_ID',
      'NEXT_PUBLIC_SANITY_DATASET',
      'SANITY_API_TOKEN'
    ];

    const parsedEnvs = this.parseEnvVars(envVars);
    const missingEnvs = requiredEnvs.filter(required => 
      !parsedEnvs.some(env => env.name === required && env.environments.includes('Production'))
    );

    if (missingEnvs.length > 0) {
      health.issues.push(`本番環境に必須環境変数が不足: ${missingEnvs.join(', ')}`);
      health.recommendations.push('必須環境変数を本番環境に設定');
      health.score -= 20;
    }

    // 健全性レベル判定
    if (health.score >= 90) health.overall = 'excellent';
    else if (health.score >= 70) health.overall = 'good';
    else if (health.score >= 50) health.overall = 'warning';
    else health.overall = 'critical';

    return health;
  }

  /**
   * パフォーマンス分析
   */
  async performanceAnalysis() {
    console.log('⚡ パフォーマンス分析中...\n');
    
    // 最新デプロイメントのURLを取得
    const deployments = this.execVercel('ls', { silent: true });
    const latestUrl = deployments ? deployments.split('\n')[0] : null;
    
    if (!latestUrl) {
      return { error: 'デプロイメントが見つかりません' };
    }

    return {
      latestDeployment: latestUrl,
      analysis: 'パフォーマンス分析は外部ツールで実行してください',
      recommendations: [
        'Lighthouse でCore Web Vitalsを測定',
        'Vercel Analytics でリアルユーザーメトリクスを確認',
        'Bundle Analyzer でバンドルサイズを最適化'
      ]
    };
  }

  /**
   * セキュリティ分析
   */
  async securityAnalysis() {
    console.log('🔒 セキュリティ分析中...\n');
    
    const security = {
      level: 'good',
      issues: [],
      recommendations: []
    };

    // 環境変数のセキュリティチェック
    const envVars = this.execVercel('env ls', { silent: true });
    const parsedEnvs = this.parseEnvVars(envVars);
    
    // 機密情報が適切に暗号化されているかチェック
    const unencryptedEnvs = parsedEnvs.filter(env => env.value !== 'Encrypted');
    if (unencryptedEnvs.length > 0) {
      security.issues.push('暗号化されていない環境変数があります');
      security.recommendations.push('すべての機密情報を暗号化');
      security.level = 'warning';
    }

    // 本番環境とプレビュー環境の分離チェック
    const productionOnlyEnvs = parsedEnvs.filter(env => 
      env.environments === 'Production' && env.name.includes('API')
    );
    
    if (productionOnlyEnvs.length === 0) {
      security.recommendations.push('本番環境専用のAPI設定を検討');
    }

    return security;
  }

  /**
   * 包括的なダッシュボードレポート生成
   */
  async generateDashboard() {
    const timestamp = new Date().toISOString();
    console.log(`🚀 Vercel Dashboard - ${timestamp}\n`);
    console.log('=' .repeat(60));

    // 基本情報収集
    const deployments = this.execVercel('ls', { silent: true });
    const envVars = this.execVercel('env ls', { silent: true });
    const projectInfo = this.execVercel('project', { silent: true });

    // 解析実行
    const parsedDeployments = this.parseDeployments(deployments);
    const parsedEnvs = this.parseEnvVars(envVars);
    const health = await this.healthAnalysis();
    const performance = await this.performanceAnalysis();
    const security = await this.securityAnalysis();

    // ダッシュボード表示
    console.log('\n📊 プロジェクト概要');
    console.log(`プロジェクト名: ${this.projectName}`);
    console.log(`デプロイメント数: ${parsedDeployments.length}`);
    console.log(`環境変数数: ${parsedEnvs.length}`);
    console.log(`最新デプロイ: ${parsedDeployments[0]?.url || 'なし'}`);

    console.log('\n🏥 健全性スコア');
    const healthIcon = {
      excellent: '🟢',
      good: '🟡', 
      warning: '🟠',
      critical: '🔴'
    }[health.overall];
    console.log(`${healthIcon} ${health.overall.toUpperCase()} (${health.score}/100)`);
    
    if (health.issues.length > 0) {
      console.log('\n⚠️ 検出された問題:');
      health.issues.forEach(issue => console.log(`  • ${issue}`));
    }

    if (health.recommendations.length > 0) {
      console.log('\n💡 推奨事項:');
      health.recommendations.forEach(rec => console.log(`  • ${rec}`));
    }

    console.log('\n🔒 セキュリティ状況');
    const securityIcon = {
      excellent: '🟢',
      good: '🟡',
      warning: '🟠', 
      critical: '🔴'
    }[security.level];
    console.log(`${securityIcon} ${security.level.toUpperCase()}`);

    if (security.issues.length > 0) {
      console.log('\n🚨 セキュリティ問題:');
      security.issues.forEach(issue => console.log(`  • ${issue}`));
    }

    // レポート保存
    const report = {
      timestamp,
      project: this.projectName,
      deployments: parsedDeployments,
      envVars: parsedEnvs,
      health,
      performance,
      security,
      summary: {
        deploymentCount: parsedDeployments.length,
        envVarCount: parsedEnvs.length,
        healthScore: health.score,
        securityLevel: security.level
      }
    };

    const reportPath = join(this.reportsDir, `vercel-dashboard-${timestamp.replace(/[:.]/g, '-')}.json`);
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n📄 詳細レポート: ${reportPath}`);
    console.log('=' .repeat(60));

    return report;
  }

  /**
   * 継続監視モード
   */
  async watchMode(intervalMinutes = 5) {
    console.log(`👀 継続監視モード開始 (${intervalMinutes}分間隔)\n`);
    
    const runCheck = async () => {
      try {
        await this.generateDashboard();
        console.log(`\n⏰ 次回チェック: ${intervalMinutes}分後`);
      } catch (error) {
        console.error('❌ 監視エラー:', error.message);
      }
    };

    // 初回実行
    await runCheck();

    // 定期実行
    setInterval(runCheck, intervalMinutes * 60 * 1000);
  }
}

// メイン実行
async function main() {
  const dashboard = new VercelDashboard();
  const args = process.argv.slice(2);

  if (args.includes('--watch')) {
    const intervalIndex = args.indexOf('--interval') + 1;
    const interval = intervalIndex > 0 ? parseInt(args[intervalIndex]) || 5 : 5;
    await dashboard.watchMode(interval);
    return;
  }

  if (args.includes('--health')) {
    const health = await dashboard.healthAnalysis();
    console.log(JSON.stringify(health, null, 2));
    return;
  }

  if (args.includes('--security')) {
    const security = await dashboard.securityAnalysis();
    console.log(JSON.stringify(security, null, 2));
    return;
  }

  // デフォルト: 包括的ダッシュボード
  await dashboard.generateDashboard();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default VercelDashboard;