#!/usr/bin/env node

/**
 * カスタムドメインパフォーマンステスト
 * レスポンス時間、スループット、可用性を測定
 */

import https from 'https';

const PRIMARY_DOMAIN = 'suptia.com';
const TEST_PATHS = [
  '/',
  '/about',
  '/products/vitamin-c',
  '/ingredients',
  '/compare',
  '/api/health'
];

/**
 * 単一リクエストのパフォーマンス測定
 */
async function measureRequest(url, options = {}) {
  const startTime = process.hrtime.bigint();
  
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(options.timeout || 10000),
      headers: {
        'User-Agent': 'Suptia-Performance-Test/1.0',
        ...options.headers
      }
    });
    
    const endTime = process.hrtime.bigint();
    const responseTime = Number(endTime - startTime) / 1000000; // ナノ秒をミリ秒に変換
    
    return {
      success: true,
      responseTime,
      statusCode: response.status,
      statusText: response.statusText,
      contentLength: response.headers.get('content-length'),
      contentType: response.headers.get('content-type'),
      cacheControl: response.headers.get('cache-control'),
      server: response.headers.get('server'),
    };
  } catch (error) {
    const endTime = process.hrtime.bigint();
    const responseTime = Number(endTime - startTime) / 1000000;
    
    return {
      success: false,
      responseTime,
      error: error.message,
      errorType: error.name,
    };
  }
}

/**
 * 複数回のリクエストでパフォーマンス統計を計算
 */
async function performanceTest(url, iterations = 10, concurrency = 1) {
  console.log(`📊 パフォーマンステスト: ${url}`);
  console.log(`   反復回数: ${iterations}, 同時実行数: ${concurrency}`);
  
  const results = [];
  const startTime = Date.now();
  
  // 同時実行でテスト
  const batches = Math.ceil(iterations / concurrency);
  
  for (let batch = 0; batch < batches; batch++) {
    const batchPromises = [];
    const batchSize = Math.min(concurrency, iterations - batch * concurrency);
    
    for (let i = 0; i < batchSize; i++) {
      batchPromises.push(measureRequest(url));
    }
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // プログレス表示
    const completed = Math.min((batch + 1) * concurrency, iterations);
    process.stdout.write(`\r   進行状況: ${completed}/${iterations} (${Math.round(completed/iterations*100)}%)`);
  }
  
  console.log(''); // 改行
  
  const totalTime = Date.now() - startTime;
  
  // 統計計算
  const successfulRequests = results.filter(r => r.success);
  const failedRequests = results.filter(r => !r.success);
  
  if (successfulRequests.length === 0) {
    return {
      url,
      totalRequests: iterations,
      successfulRequests: 0,
      failedRequests: iterations,
      successRate: 0,
      totalTime,
      error: 'All requests failed'
    };
  }
  
  const responseTimes = successfulRequests.map(r => r.responseTime);
  responseTimes.sort((a, b) => a - b);
  
  const stats = {
    url,
    totalRequests: iterations,
    successfulRequests: successfulRequests.length,
    failedRequests: failedRequests.length,
    successRate: (successfulRequests.length / iterations) * 100,
    totalTime,
    throughput: (successfulRequests.length / totalTime) * 1000, // requests per second
    
    responseTime: {
      min: Math.min(...responseTimes),
      max: Math.max(...responseTimes),
      mean: responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length,
      median: responseTimes[Math.floor(responseTimes.length / 2)],
      p95: responseTimes[Math.floor(responseTimes.length * 0.95)],
      p99: responseTimes[Math.floor(responseTimes.length * 0.99)],
    },
    
    statusCodes: {},
    errors: {},
  };
  
  // ステータスコード集計
  successfulRequests.forEach(r => {
    stats.statusCodes[r.statusCode] = (stats.statusCodes[r.statusCode] || 0) + 1;
  });
  
  // エラー集計
  failedRequests.forEach(r => {
    const errorKey = r.errorType || 'Unknown';
    stats.errors[errorKey] = (stats.errors[errorKey] || 0) + 1;
  });
  
  return stats;
}

/**
 * 結果表示
 */
function displayResults(stats) {
  console.log(`\n📈 結果: ${stats.url}`);
  console.log(`   成功率: ${stats.successRate.toFixed(1)}% (${stats.successfulRequests}/${stats.totalRequests})`);
  console.log(`   スループット: ${stats.throughput.toFixed(2)} req/sec`);
  
  if (stats.responseTime) {
    console.log(`   レスポンス時間:`);
    console.log(`     最小: ${stats.responseTime.min.toFixed(1)}ms`);
    console.log(`     平均: ${stats.responseTime.mean.toFixed(1)}ms`);
    console.log(`     中央値: ${stats.responseTime.median.toFixed(1)}ms`);
    console.log(`     95%ile: ${stats.responseTime.p95.toFixed(1)}ms`);
    console.log(`     99%ile: ${stats.responseTime.p99.toFixed(1)}ms`);
    console.log(`     最大: ${stats.responseTime.max.toFixed(1)}ms`);
  }
  
  if (Object.keys(stats.statusCodes).length > 0) {
    console.log(`   ステータスコード: ${JSON.stringify(stats.statusCodes)}`);
  }
  
  if (Object.keys(stats.errors).length > 0) {
    console.log(`   エラー: ${JSON.stringify(stats.errors)}`);
  }
}

/**
 * 負荷テスト
 */
async function loadTest(domain, options = {}) {
  const {
    iterations = 50,
    concurrency = 5,
    paths = TEST_PATHS,
    warmup = true
  } = options;
  
  console.log(`🔥 負荷テスト開始: ${domain}`);
  console.log(`   設定: ${iterations}回 x ${concurrency}同時実行`);
  console.log(`   対象パス: ${paths.length}個\n`);
  
  const allResults = [];
  
  // ウォームアップ（オプション）
  if (warmup) {
    console.log('🔥 ウォームアップ中...');
    for (const path of paths) {
      const url = `https://${domain}${path}`;
      await measureRequest(url);
    }
    console.log('✅ ウォームアップ完了\n');
  }
  
  // 各パスに対してテスト実行
  for (const path of paths) {
    const url = `https://${domain}${path}`;
    const stats = await performanceTest(url, iterations, concurrency);
    allResults.push(stats);
    displayResults(stats);
  }
  
  // 全体サマリー
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 全体サマリー');
  console.log(`${'='.repeat(60)}`);
  
  const totalRequests = allResults.reduce((sum, r) => sum + r.totalRequests, 0);
  const totalSuccessful = allResults.reduce((sum, r) => sum + r.successfulRequests, 0);
  const overallSuccessRate = (totalSuccessful / totalRequests) * 100;
  
  const allResponseTimes = allResults
    .filter(r => r.responseTime)
    .flatMap(r => Array(r.successfulRequests).fill(r.responseTime.mean));
  
  const avgResponseTime = allResponseTimes.length > 0
    ? allResponseTimes.reduce((sum, time) => sum + time, 0) / allResponseTimes.length
    : 0;
  
  console.log(`総リクエスト数: ${totalRequests}`);
  console.log(`成功率: ${overallSuccessRate.toFixed(1)}%`);
  console.log(`平均レスポンス時間: ${avgResponseTime.toFixed(1)}ms`);
  
  // パフォーマンス評価
  console.log(`\n🎯 パフォーマンス評価:`);
  
  if (overallSuccessRate >= 99.5) {
    console.log(`✅ 可用性: 優秀 (${overallSuccessRate.toFixed(1)}%)`);
  } else if (overallSuccessRate >= 99.0) {
    console.log(`⚠️  可用性: 良好 (${overallSuccessRate.toFixed(1)}%)`);
  } else {
    console.log(`❌ 可用性: 要改善 (${overallSuccessRate.toFixed(1)}%)`);
  }
  
  if (avgResponseTime <= 200) {
    console.log(`✅ レスポンス時間: 優秀 (${avgResponseTime.toFixed(1)}ms)`);
  } else if (avgResponseTime <= 500) {
    console.log(`⚠️  レスポンス時間: 良好 (${avgResponseTime.toFixed(1)}ms)`);
  } else {
    console.log(`❌ レスポンス時間: 要改善 (${avgResponseTime.toFixed(1)}ms)`);
  }
  
  // JSON出力（CI/CD用）
  if (process.env.OUTPUT_JSON === 'true') {
    const report = {
      timestamp: new Date().toISOString(),
      domain,
      configuration: { iterations, concurrency, paths },
      summary: {
        totalRequests,
        successfulRequests: totalSuccessful,
        successRate: overallSuccessRate,
        averageResponseTime: avgResponseTime,
      },
      results: allResults,
    };
    
    console.log(`\n📄 JSON結果:`);
    console.log(JSON.stringify(report, null, 2));
  }
  
  return allResults;
}

/**
 * メイン実行関数
 */
async function main() {
  const args = process.argv.slice(2);
  const domain = args[0] || PRIMARY_DOMAIN;
  const iterations = parseInt(args[1]) || 20;
  const concurrency = parseInt(args[2]) || 3;
  
  console.log('⚡ カスタムドメインパフォーマンステスト\n');
  
  try {
    await loadTest(domain, {
      iterations,
      concurrency,
      paths: TEST_PATHS,
      warmup: true
    });
    
    console.log('\n🎉 パフォーマンステスト完了');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ パフォーマンステストエラー:', error.message);
    process.exit(1);
  }
}

// スクリプト実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { measureRequest, performanceTest, loadTest };