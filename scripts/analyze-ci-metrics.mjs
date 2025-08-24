#!/usr/bin/env node

/**
 * CI/CD Metrics Analyzer
 * 収集されたメトリクスを分析してレポートを生成する
 */

import fs from 'fs';
import path from 'path';

const METRICS_DIR = '.git/ci-metrics';
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
  trend_up: '📈',
  trend_down: '📉',
  trend_flat: '➡️',
  rocket: '🚀',
  build: '🔨',
  test: '🧪',
  deploy: '🚀'
};

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
 * メトリクスファイルを読み込み
 */
function loadMetrics(limit = 50) {
  if (!fs.existsSync(METRICS_DIR)) {
    console.log(`${COLORS.yellow}${ICONS.warning} メトリクスディレクトリが見つかりません: ${METRICS_DIR}${COLORS.reset}`);
    return [];
  }

  const files = fs.readdirSync(METRICS_DIR)
    .filter(f => f.startsWith('ci-metrics-') && f.endsWith('.json'))
    .map(f => ({
      name: f,
      path: path.join(METRICS_DIR, f),
      mtime: fs.statSync(path.join(METRICS_DIR, f)).mtime
    }))
    .sort((a, b) => b.mtime - a.mtime)
    .slice(0, limit);

  const metrics = [];
  for (const file of files) {
    try {
      const data = JSON.parse(fs.readFileSync(file.path, 'utf8'));
      metrics.push(data);
    } catch (error) {
      console.error(`❌ メトリクスファイル読み込みエラー: ${file.name}`, error.message);
    }
  }

  return metrics;
}

/**
 * ワークフロー成功率を計算
 */
function calculateSuccessRate(metrics) {
  const workflowRuns = metrics.filter(m => m.workflow_run);
  if (workflowRuns.length === 0) return null;

  const successful = workflowRuns.filter(m => 
    m.workflow_run.conclusion === 'success'
  ).length;

  return {
    total: workflowRuns.length,
    successful,
    failed: workflowRuns.length - successful,
    rate: (successful / workflowRuns.length) * 100
  };
}

/**
 * デプロイ成功率を計算
 */
function calculateDeploymentSuccessRate(metrics) {
  const deployments = metrics.filter(m => m.deployment && m.deployment.statuses.length > 0);
  if (deployments.length === 0) return null;

  const successful = deployments.filter(m => {
    const latestStatus = m.deployment.statuses[0];
    return latestStatus.state === 'success';
  }).length;

  return {
    total: deployments.length,
    successful,
    failed: deployments.length - successful,
    rate: (successful / deployments.length) * 100
  };
}

/**
 * ジョブ実行時間の統計を計算
 */
function calculateJobDurationStats(metrics) {
  const jobStats = {};

  metrics.forEach(m => {
    if (!m.jobs) return;
    
    m.jobs.forEach(job => {
      if (!job.duration_ms) return;
      
      if (!jobStats[job.name]) {
        jobStats[job.name] = [];
      }
      jobStats[job.name].push(job.duration_ms);
    });
  });

  const stats = {};
  Object.entries(jobStats).forEach(([jobName, durations]) => {
    const sorted = durations.sort((a, b) => a - b);
    stats[jobName] = {
      count: durations.length,
      min: Math.min(...durations),
      max: Math.max(...durations),
      avg: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)]
    };
  });

  return stats;
}

/**
 * テストカバレッジの統計を計算
 */
function calculateCoverageStats(metrics) {
  const coverageData = metrics
    .filter(m => m.test_coverage)
    .map(m => m.test_coverage);

  if (coverageData.length === 0) return null;

  const latest = coverageData[0];
  const avg = {
    lines: coverageData.reduce((sum, c) => sum + c.lines, 0) / coverageData.length,
    statements: coverageData.reduce((sum, c) => sum + c.statements, 0) / coverageData.length,
    functions: coverageData.reduce((sum, c) => sum + c.functions, 0) / coverageData.length,
    branches: coverageData.reduce((sum, c) => sum + c.branches, 0) / coverageData.length
  };

  return {
    latest,
    average: avg,
    count: coverageData.length
  };
}

/**
 * トレンド分析
 */
function analyzeTrends(metrics) {
  if (metrics.length < 5) return null;

  const recent = metrics.slice(0, Math.floor(metrics.length / 2));
  const older = metrics.slice(Math.floor(metrics.length / 2));

  // ワークフロー実行時間のトレンド
  const recentWorkflowTimes = recent
    .filter(m => m.workflow_run && m.workflow_run.run_started_at && m.workflow_run.updated_at)
    .map(m => new Date(m.workflow_run.updated_at) - new Date(m.workflow_run.run_started_at));

  const olderWorkflowTimes = older
    .filter(m => m.workflow_run && m.workflow_run.run_started_at && m.workflow_run.updated_at)
    .map(m => new Date(m.workflow_run.updated_at) - new Date(m.workflow_run.run_started_at));

  let workflowTimeTrend = null;
  if (recentWorkflowTimes.length > 0 && olderWorkflowTimes.length > 0) {
    const recentAvg = recentWorkflowTimes.reduce((sum, t) => sum + t, 0) / recentWorkflowTimes.length;
    const olderAvg = olderWorkflowTimes.reduce((sum, t) => sum + t, 0) / olderWorkflowTimes.length;
    workflowTimeTrend = recentAvg - olderAvg;
  }

  // 成功率のトレンド
  const recentSuccessRate = calculateSuccessRate(recent);
  const olderSuccessRate = calculateSuccessRate(older);
  
  let successRateTrend = null;
  if (recentSuccessRate && olderSuccessRate) {
    successRateTrend = recentSuccessRate.rate - olderSuccessRate.rate;
  }

  return {
    workflowTimeTrend,
    successRateTrend,
    recentCount: recent.length,
    olderCount: older.length
  };
}

/**
 * レポートを生成
 */
function generateReport(metrics) {
  console.log(`${COLORS.bright}${ICONS.chart} CI/CD メトリクス分析レポート${COLORS.reset}\n`);
  
  if (metrics.length === 0) {
    console.log(`${COLORS.yellow}${ICONS.warning} 分析対象のメトリクスが見つかりません${COLORS.reset}`);
    return;
  }

  const latest = metrics[0];
  console.log(`${COLORS.cyan}📅 分析期間: ${new Date(metrics[metrics.length - 1].timestamp).toLocaleDateString('ja-JP')} - ${new Date(latest.timestamp).toLocaleDateString('ja-JP')}${COLORS.reset}`);
  console.log(`${COLORS.cyan}📊 データ件数: ${metrics.length}件${COLORS.reset}\n`);

  // ワークフロー成功率
  const successRate = calculateSuccessRate(metrics);
  if (successRate) {
    const rateColor = successRate.rate >= 95 ? COLORS.green : successRate.rate >= 80 ? COLORS.yellow : COLORS.red;
    const rateIcon = successRate.rate >= 95 ? ICONS.success : successRate.rate >= 80 ? ICONS.warning : ICONS.error;
    
    console.log(`${COLORS.bright}${ICONS.rocket} ワークフロー成功率${COLORS.reset}`);
    console.log(`  ${rateColor}${rateIcon} 成功率: ${formatPercentage(successRate.rate)}${COLORS.reset} (${successRate.successful}/${successRate.total})`);
    console.log(`  ${COLORS.red}❌ 失敗: ${successRate.failed}件${COLORS.reset}\n`);
  }

  // デプロイ成功率
  const deploymentSuccessRate = calculateDeploymentSuccessRate(metrics);
  if (deploymentSuccessRate) {
    const rateColor = deploymentSuccessRate.rate >= 95 ? COLORS.green : deploymentSuccessRate.rate >= 80 ? COLORS.yellow : COLORS.red;
    const rateIcon = deploymentSuccessRate.rate >= 95 ? ICONS.success : deploymentSuccessRate.rate >= 80 ? ICONS.warning : ICONS.error;
    
    console.log(`${COLORS.bright}${ICONS.deploy} デプロイ成功率${COLORS.reset}`);
    console.log(`  ${rateColor}${rateIcon} 成功率: ${formatPercentage(deploymentSuccessRate.rate)}${COLORS.reset} (${deploymentSuccessRate.successful}/${deploymentSuccessRate.total})`);
    console.log(`  ${COLORS.red}❌ 失敗: ${deploymentSuccessRate.failed}件${COLORS.reset}\n`);
  }

  // ジョブ実行時間統計
  const jobStats = calculateJobDurationStats(metrics);
  if (Object.keys(jobStats).length > 0) {
    console.log(`${COLORS.bright}${ICONS.time} ジョブ実行時間統計${COLORS.reset}`);
    
    Object.entries(jobStats)
      .sort((a, b) => b[1].avg - a[1].avg)
      .slice(0, 10)
      .forEach(([jobName, stats]) => {
        const avgColor = stats.avg > 300000 ? COLORS.red : stats.avg > 120000 ? COLORS.yellow : COLORS.green;
        console.log(`  ${COLORS.blue}${jobName}${COLORS.reset}:`);
        console.log(`    平均: ${avgColor}${formatTime(stats.avg)}${COLORS.reset}, 最大: ${formatTime(stats.max)}, 最小: ${formatTime(stats.min)}`);
        console.log(`    実行回数: ${stats.count}回, P95: ${formatTime(stats.p95)}`);
      });
    console.log();
  }

  // テストカバレッジ統計
  const coverageStats = calculateCoverageStats(metrics);
  if (coverageStats) {
    console.log(`${COLORS.bright}${ICONS.test} テストカバレッジ統計${COLORS.reset}`);
    console.log(`  ${COLORS.green}最新:${COLORS.reset}`);
    console.log(`    Lines: ${formatPercentage(coverageStats.latest.lines)}, Statements: ${formatPercentage(coverageStats.latest.statements)}`);
    console.log(`    Functions: ${formatPercentage(coverageStats.latest.functions)}, Branches: ${formatPercentage(coverageStats.latest.branches)}`);
    console.log(`  ${COLORS.blue}平均 (${coverageStats.count}回):${COLORS.reset}`);
    console.log(`    Lines: ${formatPercentage(coverageStats.average.lines)}, Statements: ${formatPercentage(coverageStats.average.statements)}`);
    console.log(`    Functions: ${formatPercentage(coverageStats.average.functions)}, Branches: ${formatPercentage(coverageStats.average.branches)}`);
    console.log();
  }

  // トレンド分析
  const trends = analyzeTrends(metrics);
  if (trends) {
    console.log(`${COLORS.bright}📈 トレンド分析${COLORS.reset}`);
    
    if (trends.workflowTimeTrend !== null) {
      const trendIcon = trends.workflowTimeTrend > 0 ? ICONS.trend_up : trends.workflowTimeTrend < 0 ? ICONS.trend_down : ICONS.trend_flat;
      const trendColor = trends.workflowTimeTrend > 0 ? COLORS.red : trends.workflowTimeTrend < 0 ? COLORS.green : COLORS.yellow;
      console.log(`  ${trendColor}${trendIcon} ワークフロー実行時間: ${trends.workflowTimeTrend > 0 ? '+' : ''}${formatTime(Math.abs(trends.workflowTimeTrend))}${COLORS.reset}`);
    }
    
    if (trends.successRateTrend !== null) {
      const trendIcon = trends.successRateTrend > 0 ? ICONS.trend_up : trends.successRateTrend < 0 ? ICONS.trend_down : ICONS.trend_flat;
      const trendColor = trends.successRateTrend > 0 ? COLORS.green : trends.successRateTrend < 0 ? COLORS.red : COLORS.yellow;
      console.log(`  ${trendColor}${trendIcon} 成功率: ${trends.successRateTrend > 0 ? '+' : ''}${formatPercentage(Math.abs(trends.successRateTrend))}${COLORS.reset}`);
    }
    console.log();
  }

  // 改善提案
  console.log(`${COLORS.bright}💡 改善提案${COLORS.reset}`);
  
  const suggestions = [];
  
  if (successRate && successRate.rate < 90) {
    suggestions.push('• ワークフロー成功率が低下しています。失敗の原因を調査してください');
  }
  
  if (deploymentSuccessRate && deploymentSuccessRate.rate < 95) {
    suggestions.push('• デプロイ成功率が低下しています。デプロイプロセスを見直してください');
  }
  
  const slowJobs = Object.entries(jobStats).filter(([_, stats]) => stats.avg > 300000);
  if (slowJobs.length > 0) {
    suggestions.push(`• 実行時間の長いジョブがあります: ${slowJobs.map(([name]) => name).join(', ')}`);
  }
  
  if (coverageStats && coverageStats.latest.lines < 80) {
    suggestions.push('• テストカバレッジが80%を下回っています。テストを追加してください');
  }
  
  if (trends && trends.workflowTimeTrend > 60000) {
    suggestions.push('• ワークフロー実行時間が増加傾向にあります。パフォーマンス最適化を検討してください');
  }
  
  if (suggestions.length === 0) {
    console.log(`  ${COLORS.green}${ICONS.success} 現在のメトリクスは良好です！${COLORS.reset}`);
  } else {
    suggestions.forEach(suggestion => console.log(`  ${suggestion}`));
  }
}

/**
 * JSON形式でレポートを出力
 */
function generateJSONReport(metrics, outputPath) {
  const report = {
    generated_at: new Date().toISOString(),
    period: {
      start: metrics.length > 0 ? metrics[metrics.length - 1].timestamp : null,
      end: metrics.length > 0 ? metrics[0].timestamp : null,
      count: metrics.length
    },
    workflow_success_rate: calculateSuccessRate(metrics),
    deployment_success_rate: calculateDeploymentSuccessRate(metrics),
    job_duration_stats: calculateJobDurationStats(metrics),
    test_coverage_stats: calculateCoverageStats(metrics),
    trends: analyzeTrends(metrics)
  };

  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  console.log(`📄 JSONレポートを出力: ${outputPath}`);
}

/**
 * メイン処理
 */
function main() {
  const args = process.argv.slice(2);
  const limit = args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1]) || 50 : 50;
  const jsonOutput = args.includes('--json') ? args[args.indexOf('--json') + 1] : null;
  const quiet = args.includes('--quiet');

  const metrics = loadMetrics(limit);
  
  if (!quiet) {
    generateReport(metrics);
  }
  
  if (jsonOutput) {
    generateJSONReport(metrics, jsonOutput);
  }
}

// スクリプト実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { 
  loadMetrics, 
  calculateSuccessRate, 
  calculateDeploymentSuccessRate, 
  calculateJobDurationStats,
  calculateCoverageStats,
  analyzeTrends,
  generateReport 
};