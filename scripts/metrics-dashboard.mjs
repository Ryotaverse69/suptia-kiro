#!/usr/bin/env node

/**
 * Metrics Dashboard
 * CI/CDとデプロイメントメトリクスの統合ダッシュボード
 */

import fs from 'fs';
import path from 'path';
import { loadMetrics, calculateSuccessRate, calculateJobDurationStats } from './analyze-ci-metrics.mjs';

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

const ICONS = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  time: '⏱️',
  chart: '📊',
  info: 'ℹ️',
  rocket: '🚀',
  build: '🔨',
  test: '🧪',
  deploy: '🎯',
  trend_up: '📈',
  trend_down: '📉',
  dashboard: '📋'
};

/**
 * デプロイメントメトリクスを読み込み
 */
function loadDeploymentMetrics() {
  const deploymentMetricsDir = '.git/deployment-metrics';
  const latestPath = path.join(deploymentMetricsDir, 'latest.json');
  
  if (!fs.existsSync(latestPath)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(latestPath, 'utf8'));
  } catch (error) {
    console.error('❌ デプロイメントメトリクス読み込みエラー:', error.message);
    return null;
  }
}

/**
 * 時間をフォーマット
 */
function formatTime(ms) {
  if (!ms || ms < 0) return 'N/A';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
}

/**
 * パーセンテージをフォーマット
 */
function formatPercentage(value) {
  if (typeof value !== 'number') return 'N/A';
  return `${value.toFixed(1)}%`;
}

/**
 * ステータスアイコンを取得
 */
function getStatusIcon(value, thresholds) {
  if (typeof value !== 'number') return ICONS.info;
  if (value >= thresholds.good) return ICONS.success;
  if (value >= thresholds.warning) return ICONS.warning;
  return ICONS.error;
}

/**
 * ステータス色を取得
 */
function getStatusColor(value, thresholds) {
  if (typeof value !== 'number') return COLORS.blue;
  if (value >= thresholds.good) return COLORS.green;
  if (value >= thresholds.warning) return COLORS.yellow;
  return COLORS.red;
}

/**
 * ダッシュボードヘッダーを表示
 */
function displayHeader() {
  const now = new Date();
  console.log(`${COLORS.bright}${COLORS.cyan}${ICONS.dashboard} Suptia CI/CD メトリクス ダッシュボード${COLORS.reset}`);
  console.log(`${COLORS.cyan}更新日時: ${now.toLocaleString('ja-JP')}${COLORS.reset}`);
  console.log('='.repeat(80));
}

/**
 * CI/CDメトリクスサマリーを表示
 */
function displayCIMetricsSummary(metrics) {
  if (!metrics || metrics.length === 0) {
    console.log(`\n${COLORS.yellow}${ICONS.warning} CI/CDメトリクスが見つかりません${COLORS.reset}`);
    return;
  }

  console.log(`\n${COLORS.bright}${ICONS.build} CI/CD パフォーマンス${COLORS.reset}`);
  console.log('-'.repeat(40));

  const successRate = calculateSuccessRate(metrics);
  const jobStats = calculateJobDurationStats(metrics);

  // 成功率
  if (successRate) {
    const icon = getStatusIcon(successRate.rate, { good: 95, warning: 85 });
    const color = getStatusColor(successRate.rate, { good: 95, warning: 85 });
    console.log(`${color}${icon} ワークフロー成功率: ${formatPercentage(successRate.rate)}${COLORS.reset} (${successRate.successful}/${successRate.total})`);
  }

  // 平均実行時間（上位3ジョブ）
  if (Object.keys(jobStats).length > 0) {
    console.log(`\n${COLORS.blue}${ICONS.time} ジョブ実行時間 (上位3):${COLORS.reset}`);
    Object.entries(jobStats)
      .sort((a, b) => b[1].avg - a[1].avg)
      .slice(0, 3)
      .forEach(([jobName, stats], index) => {
        const color = stats.avg > 300000 ? COLORS.red : stats.avg > 120000 ? COLORS.yellow : COLORS.green;
        console.log(`  ${index + 1}. ${jobName}: ${color}${formatTime(stats.avg)}${COLORS.reset}`);
      });
  }

  console.log(`\n${COLORS.blue}${ICONS.info} データ期間: 最新${metrics.length}回の実行${COLORS.reset}`);
}

/**
 * デプロイメントメトリクスサマリーを表示
 */
function displayDeploymentMetricsSummary(deploymentData) {
  if (!deploymentData || !deploymentData.metrics) {
    console.log(`\n${COLORS.yellow}${ICONS.warning} デプロイメントメトリクスが見つかりません${COLORS.reset}`);
    return;
  }

  console.log(`\n${COLORS.bright}${ICONS.deploy} デプロイメント パフォーマンス${COLORS.reset}`);
  console.log('-'.repeat(40));

  const { metrics } = deploymentData;

  // デプロイ成功率
  const icon = getStatusIcon(metrics.success_rate, { good: 95, warning: 85 });
  const color = getStatusColor(metrics.success_rate, { good: 95, warning: 85 });
  console.log(`${color}${icon} デプロイ成功率: ${formatPercentage(metrics.success_rate)}${COLORS.reset} (${metrics.successful_deployments}/${metrics.total_deployments})`);

  // 環境別成功率
  console.log(`\n${COLORS.blue}${ICONS.info} 環境別成功率:${COLORS.reset}`);
  Object.entries(metrics.environments).forEach(([env, data]) => {
    if (data.count > 0) {
      const envIcon = getStatusIcon(data.success_rate, { good: 95, warning: 85 });
      const envColor = getStatusColor(data.success_rate, { good: 95, warning: 85 });
      console.log(`  ${envColor}${envIcon} ${env}: ${formatPercentage(data.success_rate)}${COLORS.reset} (${data.success}/${data.count})`);
    }
  });

  // パフォーマンス統計
  if (metrics.avg_build_time > 0 || metrics.avg_deploy_time > 0) {
    console.log(`\n${COLORS.blue}${ICONS.time} 平均実行時間:${COLORS.reset}`);
    if (metrics.avg_build_time > 0) {
      const buildColor = metrics.avg_build_time > 300000 ? COLORS.red : metrics.avg_build_time > 120000 ? COLORS.yellow : COLORS.green;
      console.log(`  ${buildColor}ビルド時間: ${formatTime(metrics.avg_build_time)}${COLORS.reset}`);
    }
    if (metrics.avg_deploy_time > 0) {
      const deployColor = metrics.avg_deploy_time > 600000 ? COLORS.red : metrics.avg_deploy_time > 300000 ? COLORS.yellow : COLORS.green;
      console.log(`  ${deployColor}デプロイ時間: ${formatTime(metrics.avg_deploy_time)}${COLORS.reset}`);
    }
  }

  // 最近の失敗
  if (metrics.recent_failures && metrics.recent_failures.length > 0) {
    console.log(`\n${COLORS.red}${ICONS.error} 最近の失敗: ${metrics.recent_failures.length}件${COLORS.reset}`);
  }
}

/**
 * アラートとアクションアイテムを表示
 */
function displayAlertsAndActions(ciMetrics, deploymentData) {
  console.log(`\n${COLORS.bright}${ICONS.warning} アラート & アクションアイテム${COLORS.reset}`);
  console.log('-'.repeat(40));

  const alerts = [];
  const actions = [];

  // CI/CDアラート
  if (ciMetrics && ciMetrics.length > 0) {
    const successRate = calculateSuccessRate(ciMetrics);
    const jobStats = calculateJobDurationStats(ciMetrics);

    if (successRate && successRate.rate < 90) {
      alerts.push(`${COLORS.red}🚨 ワークフロー成功率が90%を下回っています (${formatPercentage(successRate.rate)})${COLORS.reset}`);
      actions.push('• 失敗したワークフローのログを確認し、根本原因を特定してください');
    }

    const slowJobs = Object.entries(jobStats).filter(([_, stats]) => stats.avg > 300000);
    if (slowJobs.length > 0) {
      alerts.push(`${COLORS.yellow}⚠️ 実行時間の長いジョブがあります: ${slowJobs.map(([name]) => name).join(', ')}${COLORS.reset}`);
      actions.push('• 長時間実行されるジョブの最適化を検討してください');
    }
  }

  // デプロイメントアラート
  if (deploymentData && deploymentData.metrics) {
    const { metrics } = deploymentData;

    if (metrics.success_rate < 95) {
      alerts.push(`${COLORS.red}🚨 デプロイ成功率が95%を下回っています (${formatPercentage(metrics.success_rate)})${COLORS.reset}`);
      actions.push('• デプロイ失敗の原因を調査し、デプロイプロセスを改善してください');
    }

    if (metrics.environments.production && metrics.environments.production.success_rate < 98) {
      alerts.push(`${COLORS.red}🚨 本番環境デプロイ成功率が低下しています (${formatPercentage(metrics.environments.production.success_rate)})${COLORS.reset}`);
      actions.push('• 本番デプロイプロセスの安定性を向上させてください');
    }

    if (metrics.avg_build_time > 300000) {
      alerts.push(`${COLORS.yellow}⚠️ ビルド時間が長すぎます (${formatTime(metrics.avg_build_time)})${COLORS.reset}`);
      actions.push('• ビルドプロセスの最適化を検討してください');
    }

    if (metrics.recent_failures && metrics.recent_failures.length > 3) {
      alerts.push(`${COLORS.yellow}⚠️ 最近のデプロイ失敗が多発しています (${metrics.recent_failures.length}件)${COLORS.reset}`);
      actions.push('• デプロイ失敗のパターンを分析し、予防策を実装してください');
    }
  }

  // アラート表示
  if (alerts.length > 0) {
    alerts.forEach(alert => console.log(alert));
  } else {
    console.log(`${COLORS.green}${ICONS.success} 現在、重要なアラートはありません${COLORS.reset}`);
  }

  // アクションアイテム表示
  if (actions.length > 0) {
    console.log(`\n${COLORS.bright}📋 推奨アクション:${COLORS.reset}`);
    actions.forEach(action => console.log(action));
  }
}

/**
 * 利用可能なコマンドを表示
 */
function displayAvailableCommands() {
  console.log(`\n${COLORS.bright}🛠️ 利用可能なコマンド${COLORS.reset}`);
  console.log('-'.repeat(40));
  console.log(`${COLORS.cyan}npm run ci:metrics${COLORS.reset}          - CI/CDメトリクス詳細分析`);
  console.log(`${COLORS.cyan}npm run deploy:metrics${COLORS.reset}      - デプロイメントメトリクス詳細分析`);
  console.log(`${COLORS.cyan}npm run metrics:all${COLORS.reset}         - 全メトリクス分析`);
  console.log(`${COLORS.cyan}npm run commit:metrics${COLORS.reset}      - Pre-commitメトリクス表示`);
  console.log(`${COLORS.cyan}npm run diagnose:all${COLORS.reset}        - 問題診断ツール実行`);
}

/**
 * メイン処理
 */
function main() {
  const args = process.argv.slice(2);
  const compact = args.includes('--compact');

  displayHeader();

  // CI/CDメトリクスを読み込み
  const ciMetrics = loadMetrics(30);
  displayCIMetricsSummary(ciMetrics);

  // デプロイメントメトリクスを読み込み
  const deploymentData = loadDeploymentMetrics();
  displayDeploymentMetricsSummary(deploymentData);

  if (!compact) {
    // アラートとアクションアイテムを表示
    displayAlertsAndActions(ciMetrics, deploymentData);

    // 利用可能なコマンドを表示
    displayAvailableCommands();
  }

  console.log(`\n${COLORS.bright}${COLORS.green}ダッシュボード更新完了${COLORS.reset}`);
}

// スクリプト実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { displayHeader, displayCIMetricsSummary, displayDeploymentMetricsSummary };