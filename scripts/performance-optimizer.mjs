#!/usr/bin/env node

/**
 * CI/CD Performance Optimizer
 * CI/CDパイプラインのパフォーマンス最適化とキャッシュ戦略を管理
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { createHash } from 'crypto';
import { cpus } from 'os';

const CACHE_DIR = '.git/ci-cache';
const METRICS_DIR = '.git/ci-metrics';
const PERFORMANCE_LOG = path.join(METRICS_DIR, 'performance.json');

/**
 * キャッシュディレクトリを作成
 */
function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
  if (!fs.existsSync(METRICS_DIR)) {
    fs.mkdirSync(METRICS_DIR, { recursive: true });
  }
}

/**
 * パフォーマンスメトリクスを記録
 */
function recordPerformanceMetric(operation, startTime, endTime, metadata = {}) {
  const duration = endTime - startTime;
  const metric = {
    timestamp: new Date().toISOString(),
    operation,
    duration_ms: duration,
    metadata,
    environment: {
      node_version: process.version,
      platform: process.platform,
      memory_usage: process.memoryUsage(),
      ci: !!process.env.CI
    }
  };

  let performanceLog = [];
  if (fs.existsSync(PERFORMANCE_LOG)) {
    try {
      performanceLog = JSON.parse(fs.readFileSync(PERFORMANCE_LOG, 'utf8'));
    } catch (error) {
      console.warn('⚠️ パフォーマンスログの読み込みに失敗:', error.message);
    }
  }

  performanceLog.push(metric);
  
  // 最新1000件のみ保持
  if (performanceLog.length > 1000) {
    performanceLog = performanceLog.slice(-1000);
  }

  fs.writeFileSync(PERFORMANCE_LOG, JSON.stringify(performanceLog, null, 2));
  console.log(`📊 パフォーマンスメトリクス記録: ${operation} (${duration}ms)`);
}

/**
 * 依存関係キャッシュの最適化
 */
async function optimizeDependencyCache() {
  console.log('🔧 依存関係キャッシュを最適化中...');
  const startTime = Date.now();

  try {
    ensureCacheDir();
    
    const packageLockPath = path.join(process.cwd(), 'apps/web/pnpm-lock.yaml');
    const cacheKeyPath = path.join(CACHE_DIR, 'dependency-cache-key.txt');
    
    if (!fs.existsSync(packageLockPath)) {
      console.log('⚠️ pnpm-lock.yamlが見つかりません');
      return false;
    }

    // 現在のキャッシュキーを生成
    const lockfileContent = fs.readFileSync(packageLockPath, 'utf8');
    const currentCacheKey = createHash('sha256')
      .update(lockfileContent)
      .digest('hex');

    // 既存のキャッシュキーと比較
    let existingCacheKey = '';
    if (fs.existsSync(cacheKeyPath)) {
      existingCacheKey = fs.readFileSync(cacheKeyPath, 'utf8').trim();
    }

    const cacheHit = currentCacheKey === existingCacheKey;
    
    if (cacheHit) {
      console.log('✅ 依存関係キャッシュヒット');
      recordPerformanceMetric('dependency-cache', startTime, Date.now(), { 
        cache_hit: true,
        cache_key: currentCacheKey
      });
      return true;
    }

    // キャッシュミスの場合、新しいキーを保存
    fs.writeFileSync(cacheKeyPath, currentCacheKey);
    console.log('📝 新しい依存関係キャッシュキーを保存');
    
    recordPerformanceMetric('dependency-cache', startTime, Date.now(), { 
      cache_hit: false,
      cache_key: currentCacheKey,
      previous_key: existingCacheKey
    });
    
    return false;
  } catch (error) {
    console.error('❌ 依存関係キャッシュ最適化エラー:', error.message);
    recordPerformanceMetric('dependency-cache', startTime, Date.now(), { 
      error: error.message
    });
    return false;
  }
}

/**
 * ビルドキャッシュの最適化
 */
async function optimizeBuildCache() {
  console.log('🔧 ビルドキャッシュを最適化中...');
  const startTime = Date.now();

  try {
    const nextCacheDir = path.join(process.cwd(), 'apps/web/.next/cache');
    
    if (!fs.existsSync(nextCacheDir)) {
      console.log('⚠️ Next.jsキャッシュディレクトリが見つかりません');
      recordPerformanceMetric('build-cache', startTime, Date.now(), { 
        cache_hit: false,
        reason: 'no_cache_dir'
      });
      return false;
    }

    // キャッシュサイズを測定
    const getCacheSize = (dir) => {
      if (!fs.existsSync(dir)) return 0;
      let size = 0;
      const files = fs.readdirSync(dir, { withFileTypes: true });
      for (const file of files) {
        const filePath = path.join(dir, file.name);
        if (file.isDirectory()) {
          size += getCacheSize(filePath);
        } else {
          size += fs.statSync(filePath).size;
        }
      }
      return size;
    };

    const cacheSize = getCacheSize(nextCacheDir);
    console.log(`📦 ビルドキャッシュサイズ: ${(cacheSize / 1024 / 1024).toFixed(2)}MB`);

    recordPerformanceMetric('build-cache', startTime, Date.now(), { 
      cache_size_bytes: cacheSize,
      cache_size_mb: Math.round(cacheSize / 1024 / 1024 * 100) / 100
    });

    return true;
  } catch (error) {
    console.error('❌ ビルドキャッシュ最適化エラー:', error.message);
    recordPerformanceMetric('build-cache', startTime, Date.now(), { 
      error: error.message
    });
    return false;
  }
}

/**
 * 並列実行の最適化
 */
async function optimizeParallelExecution() {
  console.log('🔧 並列実行を最適化中...');
  const startTime = Date.now();

  try {
    // CPU数を取得
    const cpuCount = cpus().length;
    const optimalParallelism = Math.max(1, Math.floor(cpuCount * 0.8));
    
    console.log(`💻 CPU数: ${cpuCount}, 最適並列数: ${optimalParallelism}`);

    // 並列実行設定をファイルに保存
    const parallelConfig = {
      cpu_count: cpuCount,
      optimal_parallelism: optimalParallelism,
      max_parallel_jobs: Math.min(optimalParallelism, 4), // GitHub Actionsの制限を考慮
      updated_at: new Date().toISOString()
    };

    const configPath = path.join(CACHE_DIR, 'parallel-config.json');
    fs.writeFileSync(configPath, JSON.stringify(parallelConfig, null, 2));

    recordPerformanceMetric('parallel-optimization', startTime, Date.now(), parallelConfig);
    
    return parallelConfig;
  } catch (error) {
    console.error('❌ 並列実行最適化エラー:', error.message);
    recordPerformanceMetric('parallel-optimization', startTime, Date.now(), { 
      error: error.message
    });
    return null;
  }
}

/**
 * パフォーマンス分析レポートを生成
 */
function generatePerformanceReport() {
  console.log('📊 パフォーマンス分析レポートを生成中...');

  if (!fs.existsSync(PERFORMANCE_LOG)) {
    console.log('⚠️ パフォーマンスログが見つかりません');
    return null;
  }

  try {
    const performanceLog = JSON.parse(fs.readFileSync(PERFORMANCE_LOG, 'utf8'));
    
    // 操作別の統計を計算
    const operationStats = {};
    performanceLog.forEach(metric => {
      if (!operationStats[metric.operation]) {
        operationStats[metric.operation] = {
          count: 0,
          total_duration: 0,
          min_duration: Infinity,
          max_duration: 0,
          durations: []
        };
      }
      
      const stats = operationStats[metric.operation];
      stats.count++;
      stats.total_duration += metric.duration_ms;
      stats.min_duration = Math.min(stats.min_duration, metric.duration_ms);
      stats.max_duration = Math.max(stats.max_duration, metric.duration_ms);
      stats.durations.push(metric.duration_ms);
    });

    // 平均と中央値を計算
    Object.keys(operationStats).forEach(operation => {
      const stats = operationStats[operation];
      stats.avg_duration = stats.total_duration / stats.count;
      
      const sorted = stats.durations.sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      stats.median_duration = sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid];
      
      delete stats.durations; // メモリ節約
    });

    const report = {
      generated_at: new Date().toISOString(),
      total_metrics: performanceLog.length,
      operation_stats: operationStats,
      recent_performance: performanceLog.slice(-10).map(m => ({
        timestamp: m.timestamp,
        operation: m.operation,
        duration_ms: m.duration_ms
      }))
    };

    const reportPath = path.join(METRICS_DIR, 'performance-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📋 パフォーマンスレポート生成完了: ${reportPath}`);
    return report;
  } catch (error) {
    console.error('❌ パフォーマンスレポート生成エラー:', error.message);
    return null;
  }
}

/**
 * キャッシュクリーンアップ
 */
function cleanupCache() {
  console.log('🧹 キャッシュクリーンアップ中...');
  const startTime = Date.now();

  try {
    if (!fs.existsSync(CACHE_DIR)) {
      console.log('ℹ️ キャッシュディレクトリが存在しません');
      return;
    }

    // 7日以上古いキャッシュファイルを削除
    const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000);
    let deletedCount = 0;
    let totalSize = 0;

    function cleanupDirectory(dir) {
      const files = fs.readdirSync(dir, { withFileTypes: true });
      
      files.forEach(file => {
        const filePath = path.join(dir, file.name);
        
        if (file.isDirectory()) {
          cleanupDirectory(filePath);
          // ディレクトリが空になったら削除
          try {
            fs.rmdirSync(filePath);
          } catch (error) {
            // ディレクトリが空でない場合は無視
          }
        } else {
          const stats = fs.statSync(filePath);
          if (stats.mtime.getTime() < cutoffTime) {
            totalSize += stats.size;
            fs.unlinkSync(filePath);
            deletedCount++;
          }
        }
      });
    }

    cleanupDirectory(CACHE_DIR);
    
    console.log(`🗑️ ${deletedCount}個のキャッシュファイルを削除 (${(totalSize / 1024 / 1024).toFixed(2)}MB)`);
    
    recordPerformanceMetric('cache-cleanup', startTime, Date.now(), {
      deleted_files: deletedCount,
      freed_bytes: totalSize,
      freed_mb: Math.round(totalSize / 1024 / 1024 * 100) / 100
    });
  } catch (error) {
    console.error('❌ キャッシュクリーンアップエラー:', error.message);
    recordPerformanceMetric('cache-cleanup', startTime, Date.now(), { 
      error: error.message
    });
  }
}

/**
 * メイン最適化処理
 */
async function optimize() {
  console.log('🚀 CI/CDパフォーマンス最適化を開始...');
  const overallStartTime = Date.now();

  try {
    ensureCacheDir();

    // 並列で最適化処理を実行
    const results = await Promise.allSettled([
      optimizeDependencyCache(),
      optimizeBuildCache(),
      optimizeParallelExecution()
    ]);

    // 結果をまとめる
    const optimizationResults = {
      dependency_cache: results[0].status === 'fulfilled' ? results[0].value : false,
      build_cache: results[1].status === 'fulfilled' ? results[1].value : false,
      parallel_config: results[2].status === 'fulfilled' ? results[2].value : null
    };

    // パフォーマンスレポートを生成
    const performanceReport = generatePerformanceReport();

    // キャッシュクリーンアップ
    cleanupCache();

    const overallDuration = Date.now() - overallStartTime;
    recordPerformanceMetric('overall-optimization', overallStartTime, Date.now(), {
      results: optimizationResults,
      performance_report_generated: !!performanceReport
    });

    console.log(`✅ CI/CDパフォーマンス最適化完了 (${overallDuration}ms)`);
    console.log('📊 最適化結果:', JSON.stringify(optimizationResults, null, 2));

    return {
      success: true,
      duration_ms: overallDuration,
      results: optimizationResults,
      performance_report: performanceReport
    };
  } catch (error) {
    console.error('❌ CI/CDパフォーマンス最適化エラー:', error.message);
    recordPerformanceMetric('overall-optimization', overallStartTime, Date.now(), { 
      error: error.message
    });
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * コマンドライン引数の処理
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    command: 'optimize',
    report: false,
    cleanup: false
  };

  args.forEach(arg => {
    switch (arg) {
      case '--report':
        options.command = 'report';
        break;
      case '--cleanup':
        options.command = 'cleanup';
        break;
      case '--help':
        console.log(`
CI/CD Performance Optimizer

使用方法:
  node scripts/performance-optimizer.mjs [options]

オプション:
  --report    パフォーマンスレポートのみ生成
  --cleanup   キャッシュクリーンアップのみ実行
  --help      このヘルプを表示

デフォルト: 全体最適化を実行
        `);
        process.exit(0);
    }
  });

  return options;
}

/**
 * メイン処理
 */
async function main() {
  const options = parseArgs();

  try {
    switch (options.command) {
      case 'report':
        generatePerformanceReport();
        break;
      case 'cleanup':
        cleanupCache();
        break;
      case 'optimize':
      default:
        await optimize();
        break;
    }
  } catch (error) {
    console.error('❌ 実行エラー:', error.message);
    process.exit(1);
  }
}

// スクリプト実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
}

export { 
  optimize, 
  optimizeDependencyCache, 
  optimizeBuildCache, 
  optimizeParallelExecution,
  generatePerformanceReport,
  cleanupCache,
  recordPerformanceMetric
};