#!/usr/bin/env node

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
  time: '⏱️',
  chart: '📊',
  info: 'ℹ️'
};

function formatTime(ms) {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
}

function showMetrics() {
  const metricsDir = '.git/hooks-metrics';
  
  if (!fs.existsSync(metricsDir)) {
    console.log(`${COLORS.yellow}${ICONS.info} メトリクスデータが見つかりません${COLORS.reset}`);
    console.log('Pre-commitフックを実行してからもう一度お試しください');
    return;
  }

  const files = fs.readdirSync(metricsDir)
    .filter(f => f.startsWith('pre-commit-'))
    .sort()
    .reverse()
    .slice(0, 10); // 最新10件

  if (files.length === 0) {
    console.log(`${COLORS.yellow}${ICONS.info} メトリクスデータが見つかりません${COLORS.reset}`);
    return;
  }

  console.log(`${COLORS.bright}${ICONS.chart} Pre-commit メトリクス (最新${files.length}件)${COLORS.reset}\n`);

  const metrics = files.map(file => {
    const data = JSON.parse(fs.readFileSync(path.join(metricsDir, file), 'utf8'));
    return data;
  });

  // 最新の実行結果
  const latest = metrics[0];
  console.log(`${COLORS.cyan}📅 最新実行: ${new Date(latest.timestamp).toLocaleString('ja-JP')}${COLORS.reset}`);
  console.log(`${latest.success ? COLORS.green + ICONS.success : COLORS.red + ICONS.error} 結果: ${latest.success ? '成功' : '失敗'}${COLORS.reset}`);
  console.log(`${COLORS.blue}${ICONS.time} 総実行時間: ${formatTime(latest.totalTime)}${COLORS.reset}\n`);

  // ステップ別詳細
  console.log(`${COLORS.bright}📋 ステップ別実行時間:${COLORS.reset}`);
  latest.steps.forEach(step => {
    const status = step.success ? `${COLORS.green}${ICONS.success}` : `${COLORS.red}${ICONS.error}`;
    console.log(`  ${status} ${step.name}: ${formatTime(step.time)}${COLORS.reset}`);
  });

  // 統計情報
  const successCount = metrics.filter(m => m.success).length;
  const avgTime = metrics.reduce((sum, m) => sum + m.totalTime, 0) / metrics.length;
  
  console.log(`\n${COLORS.bright}📈 統計情報 (過去${metrics.length}回):${COLORS.reset}`);
  console.log(`  成功率: ${COLORS.green}${Math.round(successCount / metrics.length * 100)}%${COLORS.reset} (${successCount}/${metrics.length})`);
  console.log(`  平均実行時間: ${COLORS.blue}${formatTime(avgTime)}${COLORS.reset}`);

  // パフォーマンストレンド
  if (metrics.length >= 3) {
    const recent3 = metrics.slice(0, 3);
    const older3 = metrics.slice(-3);
    const recentAvg = recent3.reduce((sum, m) => sum + m.totalTime, 0) / recent3.length;
    const olderAvg = older3.reduce((sum, m) => sum + m.totalTime, 0) / older3.length;
    const trend = recentAvg - olderAvg;
    
    const trendIcon = trend > 0 ? '📈' : trend < 0 ? '📉' : '➡️';
    const trendColor = trend > 0 ? COLORS.red : trend < 0 ? COLORS.green : COLORS.yellow;
    
    console.log(`  パフォーマンストレンド: ${trendColor}${trendIcon} ${trend > 0 ? '+' : ''}${formatTime(Math.abs(trend))}${COLORS.reset}`);
  }

  // 最も時間のかかるステップ
  const allSteps = latest.steps.reduce((acc, step) => {
    if (!acc[step.name]) acc[step.name] = [];
    acc[step.name].push(step.time);
    return acc;
  }, {});

  console.log(`\n${COLORS.bright}🐌 最も時間のかかるステップ:${COLORS.reset}`);
  Object.entries(allSteps)
    .map(([name, times]) => ({
      name,
      avgTime: times.reduce((sum, t) => sum + t, 0) / times.length
    }))
    .sort((a, b) => b.avgTime - a.avgTime)
    .slice(0, 3)
    .forEach((step, index) => {
      console.log(`  ${index + 1}. ${step.name}: ${COLORS.yellow}${formatTime(step.avgTime)}${COLORS.reset}`);
    });

  // 改善提案
  if (avgTime > 30000) { // 30秒以上
    console.log(`\n${COLORS.yellow}💡 パフォーマンス改善提案:${COLORS.reset}`);
    console.log('  • テストが重い場合は SKIP_TESTS=true でスキップを検討');
    console.log('  • 大きなファイルの変更時は段階的にコミット');
    console.log('  • CI/CDパイプラインでの詳細チェックに依存');
  }
}

showMetrics();