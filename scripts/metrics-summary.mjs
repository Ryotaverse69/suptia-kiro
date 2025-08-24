#!/usr/bin/env node

/**
 * Metrics Summary
 * 各種メトリクスの簡潔なサマリーを表示
 */

import { loadMetrics, calculateSuccessRate } from './analyze-ci-metrics.mjs';
import fs from 'fs';
import path from 'path';

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const ICONS = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
  chart: '📊'
};

/**
 * 最新のpre-commitメトリクスを取得
 */
function getLatestPreCommitMetrics() {
  const metricsDir = '.git/hooks-metrics';
  
  if (!fs.existsSync(metricsDir)) {
    return null;
  }

  const files = fs.readdirSync(metricsDir)
    .filter(f => f.startsWith('pre-commit-'))
    .sort()
    .reverse();

  if (files.length === 0) {
    return null;
  }

  try {
    const latestFile = path.join(metricsDir, files[0]);
    return JSON.parse(fs.readFileSync(latestFile, 'utf8'));
  } catch (error) {
    return null;
  }
}

/**
 * 最新のデプロイメントメトリクスを取得
 */
function getLatestDeploymentMetrics() {
  const deploymentMetricsDir = '.git/deployment-metrics';
  const latestPath = path.join(deploymentMetricsDir, 'latest.json');
  
  if (!fs.existsSync(latestPath)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(latestPath, 'utf8'));
  } catch (error) {
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
 * サマリーを表示
 */
function displaySummary() {
  console.log(`${COLORS.bright}${COLORS.cyan}${ICONS.chart} メトリクス サマリー${COLORS.reset}\n`);

  // Pre-commitメトリクス
  const preCommitMetrics = getLatestPreCommitMetrics();
  if (preCommitMetrics) {
    const status = preCommitMetrics.success ? `${COLORS.green}${ICONS.success}` : `${COLORS.red}${ICONS.error}`;
    console.log(`${COLORS.bright}🔧 Pre-commit:${COLORS.reset} ${status} ${formatTime(preCommitMetrics.totalTime)}${COLORS.reset}`);
  } else {
    console.log(`${COLORS.bright}🔧 Pre-commit:${COLORS.reset} ${COLORS.yellow}${ICONS.info} データなし${COLORS.reset}`);
  }

  // CI/CDメトリクス
  const ciMetrics = loadMetrics(10);
  if (ciMetrics.length > 0) {
    const successRate = calculateSuccessRate(ciMetrics);
    if (successRate) {
      const status = successRate.rate >= 95 ? `${COLORS.green}${ICONS.success}` : successRate.rate >= 85 ? `${COLORS.yellow}${ICONS.warning}` : `${COLORS.red}${ICONS.error}`;
      console.log(`${COLORS.bright}🚀 CI/CD:${COLORS.reset} ${status} ${formatPercentage(successRate.rate)} 成功率${COLORS.reset} (${ciMetrics.length}回)`);
    }
  } else {
    console.log(`${COLORS.bright}🚀 CI/CD:${COLORS.reset} ${COLORS.yellow}${ICONS.info} データなし${COLORS.reset}`);
  }

  // デプロイメントメトリクス
  const deploymentMetrics = getLatestDeploymentMetrics();
  if (deploymentMetrics && deploymentMetrics.metrics) {
    const { metrics } = deploymentMetrics;
    const status = metrics.success_rate >= 95 ? `${COLORS.green}${ICONS.success}` : metrics.success_rate >= 85 ? `${COLORS.yellow}${ICONS.warning}` : `${COLORS.red}${ICONS.error}`;
    console.log(`${COLORS.bright}🎯 デプロイ:${COLORS.reset} ${status} ${formatPercentage(metrics.success_rate)} 成功率${COLORS.reset} (${metrics.total_deployments}回)`);
  } else {
    console.log(`${COLORS.bright}🎯 デプロイ:${COLORS.reset} ${COLORS.yellow}${ICONS.info} データなし${COLORS.reset}`);
  }

  // 詳細コマンドの案内
  console.log(`\n${COLORS.blue}詳細: npm run metrics:dashboard${COLORS.reset}`);
}

// スクリプト実行
if (import.meta.url === `file://${process.argv[1]}`) {
  displaySummary();
}

export { displaySummary, getLatestPreCommitMetrics, getLatestDeploymentMetrics };