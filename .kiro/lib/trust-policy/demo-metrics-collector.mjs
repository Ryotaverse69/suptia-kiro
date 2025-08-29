#!/usr/bin/env node

/**
 * Trust承認ポリシーメトリクス収集システムのデモンストレーション
 * 
 * このスクリプトはメトリクス収集機能の動作を確認するためのデモです。
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { MetricsCollector } from './metrics-collector.js';

const DEMO_DIR = '.kiro-metrics-demo';

/**
 * デモ環境のセットアップ
 */
async function setupDemoEnvironment() {
  console.log('🔧 メトリクス収集デモ環境をセットアップ中...');
  
  await fs.mkdir(DEMO_DIR, { recursive: true });
  await fs.mkdir(join(DEMO_DIR, 'reports', 'metrics'), { recursive: true });
  
  console.log('✅ デモ環境のセットアップ完了');
}

/**
 * サンプルメトリクスデータの生成
 */
function generateSampleMetrics(date, operationCount = 50) {
  const operations = [
    { type: 'git', commands: [['status'], ['add', '.'], ['commit', '-m', 'update'], ['push']] },
    { type: 'file', commands: [['touch', 'file.txt'], ['mkdir', 'dir'], ['cat', 'file.txt']] },
    { type: 'cli', commands: [['vercel', 'env', 'ls'], ['vercel', 'deployments', 'ls']] }
  ];

  const dangerousOperations = [
    { type: 'git', commands: [['reset', '--hard'], ['push', '--force']] },
    { type: 'file', commands: [['rm', '-rf', 'important']] },
    { type: 'cli', commands: [['vercel', 'env', 'rm', 'API_KEY']] }
  ];

  const metrics = [];
  
  for (let i = 0; i < operationCount; i++) {
    const hour = 9 + Math.floor(i / 6); // 9時から開始、1時間に6操作
    const minute = (i % 6) * 10;
    const timestamp = `${date}T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00.000Z`;
    
    // 90%の確率で通常操作、10%で危険操作
    const isDangerous = Math.random() < 0.1;
    const operationSet = isDangerous ? dangerousOperations : operations;
    const operation = operationSet[Math.floor(Math.random() * operationSet.length)];
    const command = operation.commands[Math.floor(Math.random() * operation.commands.length)];
    
    // 処理時間をシミュレート（通常は30-80ms、危険操作は80-150ms）
    const baseTime = isDangerous ? 80 : 30;
    const variance = isDangerous ? 70 : 50;
    const processingTime = baseTime + Math.random() * variance;
    
    metrics.push({
      timestamp,
      operationType: operation.type,
      command: command[0],
      args: command.slice(1),
      decision: isDangerous ? 'manual' : 'auto',
      processingTime: Math.round(processingTime),
      userId: 'demo-user',
      context: { cwd: '/demo/project' }
    });
  }
  
  return metrics.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

/**
 * 複数日のサンプルデータを作成
 */
async function createSampleData(collector) {
  console.log('📊 サンプルメトリクスデータを生成中...');
  
  const today = new Date();
  const dates = [];
  
  // 過去7日分のデータを生成
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }
  
  for (const [index, date] of dates.entries()) {
    // 日によって操作数を変える（平日は多め、週末は少なめ）
    const dayOfWeek = new Date(date).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const operationCount = isWeekend ? 20 + Math.random() * 20 : 40 + Math.random() * 30;
    
    const metrics = generateSampleMetrics(date, Math.floor(operationCount));
    
    console.log(`   ${date}: ${metrics.length} 操作 (自動承認: ${metrics.filter(m => m.decision === 'auto').length})`);
    
    // メトリクスを記録
    for (const metric of metrics) {
      await collector.recordOperation({
        operationType: metric.operationType,
        command: metric.command,
        args: metric.args,
        decision: metric.decision,
        processingTime: metric.processingTime,
        userId: metric.userId,
        context: metric.context
      });
    }
  }
  
  console.log('✅ サンプルデータの生成完了');
}

/**
 * メトリクス分析のデモ
 */
async function demonstrateMetricsAnalysis(collector) {
  console.log('\n📈 メトリクス分析のデモンストレーション...\n');
  
  const today = new Date();
  
  // 1. 今日のメトリクス分析
  console.log('=== 1. 今日のメトリクス ===');
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);
  
  const todayMetrics = await collector.aggregateMetrics(startOfDay, today);
  
  console.log(`総操作数: ${todayMetrics.totalOperations}`);
  console.log(`自動承認: ${todayMetrics.autoApprovedOperations} (${todayMetrics.autoApprovalRate.toFixed(1)}%)`);
  console.log(`手動承認: ${todayMetrics.manualApprovedOperations} (${(100 - todayMetrics.autoApprovalRate).toFixed(1)}%)`);
  console.log(`平均処理時間: ${todayMetrics.averageProcessingTime.toFixed(1)}ms`);
  console.log(`最大処理時間: ${todayMetrics.maxProcessingTime}ms`);
  
  // 2. 週間メトリクス分析
  console.log('\n=== 2. 週間メトリクス ===');
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);
  
  const weekMetrics = await collector.aggregateMetrics(weekStart, today);
  
  console.log(`週間総操作数: ${weekMetrics.totalOperations}`);
  console.log(`週間自動承認率: ${weekMetrics.autoApprovalRate.toFixed(1)}%`);
  console.log(`1日平均操作数: ${Math.round(weekMetrics.totalOperations / 7)}`);
  console.log(`週間平均処理時間: ${weekMetrics.averageProcessingTime.toFixed(1)}ms`);
  
  // 3. 操作タイプ別分析
  console.log('\n=== 3. 操作タイプ別統計 ===');
  Object.entries(weekMetrics.operationsByType)
    .sort(([,a], [,b]) => b - a)
    .forEach(([type, count]) => {
      const percentage = (count / weekMetrics.totalOperations * 100).toFixed(1);
      console.log(`${type}: ${count} (${percentage}%)`);
    });
  
  // 4. パフォーマンス分析
  console.log('\n=== 4. パフォーマンス分析 ===');
  const { performanceMetrics } = weekMetrics;
  const totalWithTime = performanceMetrics.fastOperations + performanceMetrics.normalOperations + performanceMetrics.slowOperations;
  
  if (totalWithTime > 0) {
    console.log(`高速処理 (<50ms): ${performanceMetrics.fastOperations} (${(performanceMetrics.fastOperations / totalWithTime * 100).toFixed(1)}%)`);
    console.log(`通常処理 (50-100ms): ${performanceMetrics.normalOperations} (${(performanceMetrics.normalOperations / totalWithTime * 100).toFixed(1)}%)`);
    console.log(`低速処理 (>100ms): ${performanceMetrics.slowOperations} (${(performanceMetrics.slowOperations / totalWithTime * 100).toFixed(1)}%)`);
  }
  
  // 5. リアルタイム監視
  console.log('\n=== 5. リアルタイム監視 ===');
  const currentMetrics = await collector.getCurrentMetrics();
  
  console.log(`今日の操作数: ${currentMetrics.todayOperations}`);
  console.log(`今日の自動承認率: ${currentMetrics.todayAutoApprovalRate.toFixed(1)}%`);
  console.log(`直近の平均処理時間: ${currentMetrics.recentAverageProcessingTime.toFixed(1)}ms`);
  console.log(`アラート数: ${currentMetrics.alertsCount}`);
  
  // 目標達成状況の評価
  console.log('\n=== 6. 目標達成状況 ===');
  const autoApprovalTarget = 95;
  const processingTimeTarget = 100;
  
  console.log(`自動承認率目標 (${autoApprovalTarget}%以上): ${weekMetrics.autoApprovalRate >= autoApprovalTarget ? '✅ 達成' : '❌ 未達成'} (${weekMetrics.autoApprovalRate.toFixed(1)}%)`);
  console.log(`処理時間目標 (${processingTimeTarget}ms以内): ${weekMetrics.averageProcessingTime <= processingTimeTarget ? '✅ 達成' : '❌ 未達成'} (${weekMetrics.averageProcessingTime.toFixed(1)}ms)`);
  
  if (weekMetrics.autoApprovalRate < autoApprovalTarget) {
    console.log('\n💡 改善提案:');
    console.log('   - 手動承認が発生している操作の確認');
    console.log('   - 自動承認対象への追加検討');
    console.log('   - ポリシー設定の見直し');
  }
  
  if (weekMetrics.averageProcessingTime > processingTimeTarget) {
    console.log('\n⚡ パフォーマンス改善提案:');
    console.log('   - キャッシュの最適化');
    console.log('   - 判定ロジックの簡素化');
    console.log('   - システムリソースの確認');
  }
}

/**
 * レポート生成のデモ
 */
async function demonstrateReportGeneration(collector) {
  console.log('\n📋 レポート生成のデモンストレーション...\n');
  
  const today = new Date();
  
  // 1. 日次レポート生成
  console.log('=== 1. 日次レポート生成 ===');
  const dailyReport = await collector.generateDailyReport(today);
  
  console.log('日次レポートが生成されました:');
  console.log(dailyReport.split('\n').slice(0, 15).join('\n')); // 最初の15行のみ表示
  console.log('...');
  
  // 2. 週次レポート生成
  console.log('\n=== 2. 週次レポート生成 ===');
  const weeklyReport = await collector.generateWeeklyReport(today);
  
  console.log('週次レポートが生成されました:');
  console.log(weeklyReport.split('\n').slice(0, 20).join('\n')); // 最初の20行のみ表示
  console.log('...');
  
  // 3. レポートファイルの確認
  console.log('\n=== 3. 生成されたレポートファイル ===');
  const metricsDir = join(DEMO_DIR, 'reports', 'metrics');
  
  try {
    const files = await fs.readdir(metricsDir);
    const reportFiles = files.filter(file => file.endsWith('.md'));
    
    console.log('生成されたレポートファイル:');
    reportFiles.forEach(file => {
      console.log(`   - ${file}`);
    });
    
    // メトリクスファイルも確認
    const metricsFiles = files.filter(file => file.endsWith('.jsonl'));
    console.log('\nメトリクスデータファイル:');
    metricsFiles.forEach(file => {
      console.log(`   - ${file}`);
    });
    
  } catch (error) {
    console.warn('レポートファイルの確認に失敗しました:', error.message);
  }
}

/**
 * パフォーマンステストのデモ
 */
async function demonstratePerformanceTest(collector) {
  console.log('\n⚡ パフォーマンステストのデモンストレーション...\n');
  
  console.log('=== メトリクス記録のパフォーマンステスト ===');
  
  const testOperations = 100;
  const startTime = Date.now();
  
  for (let i = 0; i < testOperations; i++) {
    await collector.recordOperation({
      operationType: 'test',
      command: 'test-command',
      args: [`arg${i}`],
      decision: i % 10 === 0 ? 'manual' : 'auto',
      processingTime: 30 + Math.random() * 40,
      userId: 'performance-test'
    });
  }
  
  const endTime = Date.now();
  const totalTime = endTime - startTime;
  const averageTime = totalTime / testOperations;
  
  console.log(`${testOperations} 操作の記録完了:`);
  console.log(`   総時間: ${totalTime}ms`);
  console.log(`   平均時間: ${averageTime.toFixed(2)}ms/操作`);
  console.log(`   スループット: ${(testOperations / (totalTime / 1000)).toFixed(1)} 操作/秒`);
  
  // 集計パフォーマンステスト
  console.log('\n=== メトリクス集計のパフォーマンステスト ===');
  
  const aggregationStart = Date.now();
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - 6);
  
  const aggregated = await collector.aggregateMetrics(weekStart, today);
  
  const aggregationEnd = Date.now();
  const aggregationTime = aggregationEnd - aggregationStart;
  
  console.log(`週間メトリクス集計完了:`);
  console.log(`   処理時間: ${aggregationTime}ms`);
  console.log(`   処理対象: ${aggregated.totalOperations} 操作`);
  console.log(`   処理速度: ${(aggregated.totalOperations / (aggregationTime / 1000)).toFixed(1)} 操作/秒`);
  
  // パフォーマンス評価
  const recordingTarget = 10; // ms/操作
  const aggregationTarget = 1000; // ms
  
  console.log('\n=== パフォーマンス評価 ===');
  console.log(`記録性能目標 (${recordingTarget}ms/操作以内): ${averageTime <= recordingTarget ? '✅ 達成' : '❌ 未達成'} (${averageTime.toFixed(2)}ms)`);
  console.log(`集計性能目標 (${aggregationTarget}ms以内): ${aggregationTime <= aggregationTarget ? '✅ 達成' : '❌ 未達成'} (${aggregationTime}ms)`);
}

/**
 * デモ環境のクリーンアップ
 */
async function cleanupDemoEnvironment() {
  console.log('\n🧹 デモ環境をクリーンアップ中...');
  
  try {
    await fs.rm(DEMO_DIR, { recursive: true, force: true });
    console.log('✅ デモ環境のクリーンアップ完了');
  } catch (error) {
    console.warn('⚠️  クリーンアップに失敗しました:', error.message);
  }
}

/**
 * メイン処理
 */
async function main() {
  console.log('📊 Trust承認ポリシーメトリクス収集システム デモンストレーション\n');
  
  try {
    await setupDemoEnvironment();
    
    // メトリクス収集システムの初期化
    const collector = new MetricsCollector({
      enabled: true,
      retentionDays: 30,
      aggregationInterval: 60,
      performanceThresholds: {
        fast: 50,
        normal: 100
      }
    });
    
    // デモ用のメトリクスディレクトリを設定
    collector.metricsDir = join(DEMO_DIR, 'reports', 'metrics');
    await collector.initialize();
    
    // デモの実行
    await createSampleData(collector);
    await demonstrateMetricsAnalysis(collector);
    await demonstrateReportGeneration(collector);
    await demonstratePerformanceTest(collector);
    
    console.log('\n✅ メトリクス収集システムのデモが完了しました！');
    console.log('\n📋 主な機能:');
    console.log('   - リアルタイムメトリクス記録');
    console.log('   - 自動承認率・処理時間の監視');
    console.log('   - 日次・週次レポート自動生成');
    console.log('   - パフォーマンス分析');
    console.log('   - 目標達成状況の評価');
    console.log('   - 改善提案の自動生成');
    
  } catch (error) {
    console.error('❌ デモ実行中にエラーが発生しました:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  } finally {
    await cleanupDemoEnvironment();
  }
}

// スクリプトが直接実行された場合のみメイン処理を実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ デモ実行に失敗しました:', error.message);
    process.exit(1);
  });
}

export { main as runMetricsCollectorDemo };