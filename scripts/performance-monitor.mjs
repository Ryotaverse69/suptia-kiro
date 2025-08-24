#!/usr/bin/env node

/**
 * CI/CD Performance Monitor
 * CI/CDパイプラインのパフォーマンスをリアルタイムで監視
 */

import fs from 'fs';
import path from 'path';

const PERFORMANCE_LOG = '.git/ci-metrics/performance.json';
const THRESHOLDS = {
  workflow_duration_max: 15 * 60 * 1000, // 15分
  job_duration_max: 10 * 60 * 1000,      // 10分
  cache_hit_rate_min: 0.8,               // 80%
  success_rate_min: 0.95                 // 95%
};

/**
 * パフォーマンスメトリクスを読み込み
 */
function loadPerformanceMetrics() {
  if (!fs.existsSync(PERFORMANCE_LOG)) {
    console.log('⚠️ パフォーマンスログが見つかりません');
    return [];
  }

  try {
    return JSON.parse(fs.readFileSync(PERFORMANCE_LOG, 'utf8'));
  } catch (error) {
    console.error('❌ パフォーマンスログの読み込みエラー:', error.message);
    return [];
  }
}

/**
 * 最近のパフォーマンス統計を計算
 */
function calculateRecentStats(metrics, hours = 24) {
  const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
  const recentMetrics = metrics.filter(m => 
    new Date(m.timestamp).getTime() > cutoffTime
  );

  if (recentMetrics.length === 0) {
    return null;
  }

  const stats = {
    total_operations: recentMetrics.length,
    avg_duration: 0,
    max_duration: 0,
    min_duration: Infinity,
    operations_by_type: {},
    cache_stats: {
      total_cache_operations: 0,
      cache_hits: 0,
      cache_misses: 0,
      hit_rate: 0
    },
    performance_issues: []
  };

  // 操作別統計
  recentMetrics.forEach(metric => {
    stats.avg_duration += metric.duration_ms;
    stats.max_duration = Math.max(stats.max_duration, metric.duration_ms);
    stats.min_duration = Math.min(stats.min_duration, metric.duration_ms);

    // 操作タイプ別統計
    if (!stats.operations_by_type[metric.operation]) {
      stats.operations_by_type[metric.operation] = {
        count: 0,
        total_duration: 0,
        avg_duration: 0
      };
    }
    
    const opStats = stats.operations_by_type[metric.operation];
    opStats.count++;
    opStats.total_duration += metric.duration_ms;
    opStats.avg_duration = opStats.total_duration / opStats.count;

    // キャッシュ統計
    if (metric.metadata && typeof metric.metadata.cache_hit === 'boolean') {
      stats.cache_stats.total_cache_operations++;
      if (metric.metadata.cache_hit) {
        stats.cache_stats.cache_hits++;
      } else {
        stats.cache_stats.cache_misses++;
      }
    }

    // パフォーマンス問題の検出
    if (metric.duration_ms > THRESHOLDS.job_duration_max) {
      stats.performance_issues.push({
        type: 'slow_operation',
        operation: metric.operation,
        duration_ms: metric.duration_ms,
        threshold_ms: THRESHOLDS.job_duration_max,
        timestamp: metric.timestamp
      });
    }
  });

  stats.avg_duration = stats.avg_duration / recentMetrics.length;
  
  // キャッシュヒット率を計算
  if (stats.cache_stats.total_cache_operations > 0) {
    stats.cache_stats.hit_rate = stats.cache_stats.cache_hits / stats.cache_stats.total_cache_operations;
  }

  // キャッシュヒット率の問題を検出
  if (stats.cache_stats.hit_rate < THRESHOLDS.cache_hit_rate_min && stats.cache_stats.total_cache_operations > 0) {
    stats.performance_issues.push({
      type: 'low_cache_hit_rate',
      hit_rate: stats.cache_stats.hit_rate,
      threshold: THRESHOLDS.cache_hit_rate_min,
      cache_operations: stats.cache_stats.total_cache_operations
    });
  }

  return stats;
}

/**
 * パフォーマンス推奨事項を生成
 */
function generateRecommendations(stats) {
  const recommendations = [];

  if (!stats) {
    return ['パフォーマンスデータが不足しています。しばらく待ってから再実行してください。'];
  }

  // 実行時間の推奨事項
  if (stats.avg_duration > THRESHOLDS.job_duration_max * 0.8) {
    recommendations.push({
      type: 'performance',
      priority: 'high',
      title: '実行時間の最適化',
      description: `平均実行時間が${Math.round(stats.avg_duration/1000)}秒と長めです。`,
      suggestions: [
        'キャッシュ戦略の見直し',
        '並列実行の最適化',
        '不要な処理の削除',
        'タイムアウト設定の調整'
      ]
    });
  }

  // キャッシュヒット率の推奨事項
  if (stats.cache_stats.hit_rate < THRESHOLDS.cache_hit_rate_min && stats.cache_stats.total_cache_operations > 0) {
    recommendations.push({
      type: 'cache',
      priority: 'medium',
      title: 'キャッシュ効率の改善',
      description: `キャッシュヒット率が${Math.round(stats.cache_stats.hit_rate * 100)}%と低めです。`,
      suggestions: [
        'キャッシュキーの最適化',
        'キャッシュ対象の見直し',
        'キャッシュ有効期限の調整',
        '依存関係の安定化'
      ]
    });
  }

  // 遅い操作の推奨事項
  const slowOperations = Object.entries(stats.operations_by_type)
    .filter(([_, opStats]) => opStats.avg_duration > THRESHOLDS.job_duration_max * 0.6)
    .sort((a, b) => b[1].avg_duration - a[1].avg_duration);

  if (slowOperations.length > 0) {
    recommendations.push({
      type: 'optimization',
      priority: 'medium',
      title: '遅い操作の最適化',
      description: `以下の操作が時間を要しています: ${slowOperations.map(([op]) => op).join(', ')}`,
      suggestions: [
        '操作の並列化',
        'リソース使用量の最適化',
        '処理ロジックの改善',
        'ツール設定の調整'
      ]
    });
  }

  // パフォーマンス問題の推奨事項
  if (stats.performance_issues.length > 0) {
    const issueTypes = [...new Set(stats.performance_issues.map(issue => issue.type))];
    recommendations.push({
      type: 'issues',
      priority: 'high',
      title: 'パフォーマンス問題の解決',
      description: `${stats.performance_issues.length}件のパフォーマンス問題が検出されました: ${issueTypes.join(', ')}`,
      suggestions: [
        '問題の根本原因分析',
        'リソース制限の確認',
        'タイムアウト設定の見直し',
        '監視アラートの設定'
      ]
    });
  }

  return recommendations;
}

/**
 * パフォーマンスレポートを表示
 */
function displayPerformanceReport(stats, recommendations) {
  console.log('\n📊 CI/CD パフォーマンス監視レポート');
  console.log('=' .repeat(50));

  if (!stats) {
    console.log('⚠️ パフォーマンスデータが不足しています');
    return;
  }

  // 基本統計
  console.log('\n📈 基本統計 (過去24時間)');
  console.log(`総操作数: ${stats.total_operations}`);
  console.log(`平均実行時間: ${Math.round(stats.avg_duration/1000)}秒`);
  console.log(`最大実行時間: ${Math.round(stats.max_duration/1000)}秒`);
  console.log(`最小実行時間: ${Math.round(stats.min_duration/1000)}秒`);

  // キャッシュ統計
  if (stats.cache_stats.total_cache_operations > 0) {
    console.log('\n💾 キャッシュ統計');
    console.log(`キャッシュ操作数: ${stats.cache_stats.total_cache_operations}`);
    console.log(`キャッシュヒット: ${stats.cache_stats.cache_hits}`);
    console.log(`キャッシュミス: ${stats.cache_stats.cache_misses}`);
    console.log(`ヒット率: ${Math.round(stats.cache_stats.hit_rate * 100)}%`);
  }

  // 操作別統計
  console.log('\n⚙️ 操作別統計');
  Object.entries(stats.operations_by_type)
    .sort((a, b) => b[1].avg_duration - a[1].avg_duration)
    .forEach(([operation, opStats]) => {
      console.log(`${operation}: ${opStats.count}回, 平均${Math.round(opStats.avg_duration/1000)}秒`);
    });

  // パフォーマンス問題
  if (stats.performance_issues.length > 0) {
    console.log('\n⚠️ パフォーマンス問題');
    stats.performance_issues.forEach(issue => {
      switch (issue.type) {
        case 'slow_operation':
          console.log(`- 遅い操作: ${issue.operation} (${Math.round(issue.duration_ms/1000)}秒)`);
          break;
        case 'low_cache_hit_rate':
          console.log(`- 低いキャッシュヒット率: ${Math.round(issue.hit_rate * 100)}%`);
          break;
      }
    });
  }

  // 推奨事項
  if (recommendations.length > 0) {
    console.log('\n💡 推奨事項');
    recommendations.forEach((rec, index) => {
      console.log(`\n${index + 1}. ${rec.title} (優先度: ${rec.priority})`);
      console.log(`   ${rec.description}`);
      rec.suggestions.forEach(suggestion => {
        console.log(`   • ${suggestion}`);
      });
    });
  } else {
    console.log('\n✅ パフォーマンスは良好です');
  }

  // 健全性スコア
  let healthScore = 100;
  if (stats.avg_duration > THRESHOLDS.job_duration_max * 0.8) healthScore -= 20;
  if (stats.cache_stats.hit_rate < THRESHOLDS.cache_hit_rate_min) healthScore -= 15;
  if (stats.performance_issues.length > 0) healthScore -= stats.performance_issues.length * 10;
  healthScore = Math.max(0, healthScore);

  console.log(`\n🎯 パフォーマンス健全性スコア: ${healthScore}/100`);
  
  if (healthScore >= 90) {
    console.log('✅ 優秀 - パフォーマンスは最適化されています');
  } else if (healthScore >= 70) {
    console.log('⚠️ 良好 - いくつかの改善点があります');
  } else if (healthScore >= 50) {
    console.log('🔶 注意 - パフォーマンスの改善が必要です');
  } else {
    console.log('🔴 危険 - 緊急にパフォーマンス改善が必要です');
  }
}

/**
 * JSON形式でレポートを出力
 */
function outputJsonReport(stats, recommendations, outputPath) {
  const report = {
    generated_at: new Date().toISOString(),
    stats,
    recommendations,
    thresholds: THRESHOLDS
  };

  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  console.log(`📄 JSONレポートを出力: ${outputPath}`);
}

/**
 * メイン処理
 */
function main() {
  const args = process.argv.slice(2);
  const jsonOutput = args.includes('--json');
  const outputPath = args.find(arg => arg.startsWith('--output='))?.split('=')[1] || 'performance-report.json';

  console.log('🔍 CI/CDパフォーマンス監視を開始...');

  const metrics = loadPerformanceMetrics();
  const stats = calculateRecentStats(metrics);
  const recommendations = generateRecommendations(stats);

  if (jsonOutput) {
    outputJsonReport(stats, recommendations, outputPath);
  } else {
    displayPerformanceReport(stats, recommendations);
  }

  // 終了コードの設定（パフォーマンス問題がある場合は1）
  const hasIssues = stats && stats.performance_issues.length > 0;
  process.exit(hasIssues ? 1 : 0);
}

// スクリプト実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { calculateRecentStats, generateRecommendations, loadPerformanceMetrics };