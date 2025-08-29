#!/usr/bin/env node

/**
 * Trust承認ポリシーメトリクスレポート生成スクリプト
 * 
 * 日次・週次・月次のメトリクスレポートを生成し、
 * 運用状況の分析と改善提案を提供します。
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { MetricsCollector } from '../.kiro/lib/trust-policy/metrics-collector.js';

/**
 * コマンドライン引数の解析
 */
function parseArguments() {
  const args = process.argv.slice(2);
  
  const options = {
    type: 'daily', // daily, weekly, monthly
    date: null,
    output: null,
    verbose: false,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--type':
      case '-t':
        options.type = args[++i];
        break;
      case '--date':
      case '-d':
        options.date = args[++i];
        break;
      case '--output':
      case '-o':
        options.output = args[++i];
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
      default:
        if (arg.startsWith('-')) {
          console.error(`未知のオプション: ${arg}`);
          process.exit(1);
        }
    }
  }

  return options;
}

/**
 * ヘルプメッセージを表示
 */
function showHelp() {
  console.log(`
Trust承認ポリシーメトリクスレポート生成スクリプト

使用方法:
  node .kiro/scripts/generate-trust-metrics-report.mjs [オプション]

オプション:
  -t, --type TYPE     レポートタイプ (daily, weekly, monthly) [デフォルト: daily]
  -d, --date DATE     対象日付 (YYYY-MM-DD形式) [デフォルト: 今日]
  -o, --output FILE   出力ファイルパス [デフォルト: 自動生成]
  -v, --verbose       詳細な実行ログを表示
  -h, --help          このヘルプを表示

例:
  # 今日の日次レポートを生成
  node .kiro/scripts/generate-trust-metrics-report.mjs

  # 特定日の日次レポートを生成
  node .kiro/scripts/generate-trust-metrics-report.mjs -t daily -d 2025-08-27

  # 週次レポートを生成
  node .kiro/scripts/generate-trust-metrics-report.mjs -t weekly

  # 月次レポートを生成（カスタム出力先）
  node .kiro/scripts/generate-trust-metrics-report.mjs -t monthly -o monthly-report.md

レポートタイプ:
  daily    - 指定日の詳細な操作統計とパフォーマンス分析
  weekly   - 過去7日間のトレンド分析と推奨アクション
  monthly  - 過去30日間の総合分析と長期トレンド
`);
}

/**
 * 日付文字列をパース
 */
function parseDate(dateStr) {
  if (!dateStr) {
    return new Date();
  }

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    throw new Error(`無効な日付形式: ${dateStr} (YYYY-MM-DD形式で指定してください)`);
  }

  return date;
}

/**
 * 月次レポートを生成
 */
async function generateMonthlyReport(collector, endDate) {
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 29); // 30日間
  startDate.setHours(0, 0, 0, 0);
  
  const adjustedEndDate = new Date(endDate);
  adjustedEndDate.setHours(23, 59, 59, 999);

  const monthlyMetrics = await collector.aggregateMetrics(startDate, adjustedEndDate);
  
  // 週別の詳細データも取得
  const weeklyMetrics = [];
  for (let i = 0; i < 4; i++) {
    const weekStart = new Date(startDate);
    weekStart.setDate(weekStart.getDate() + (i * 7));
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    if (weekEnd > adjustedEndDate) {
      weekEnd.setTime(adjustedEndDate.getTime());
    }
    
    const weekMetrics = await collector.aggregateMetrics(weekStart, weekEnd);
    weeklyMetrics.push({
      week: i + 1,
      startDate: weekStart.toISOString().split('T')[0],
      endDate: weekEnd.toISOString().split('T')[0],
      ...weekMetrics
    });
  }

  const report = [
    `# Trust承認ポリシー 月次メトリクスレポート`,
    ``,
    `**期間**: ${startDate.toISOString().split('T')[0]} ～ ${endDate.toISOString().split('T')[0]} (30日間)`,
    `**生成日時**: ${new Date().toISOString()}`,
    ``,
    `## 月間概要`,
    ``,
    `- **総操作数**: ${monthlyMetrics.totalOperations.toLocaleString()}`,
    `- **自動承認**: ${monthlyMetrics.autoApprovedOperations.toLocaleString()} (${monthlyMetrics.autoApprovalRate.toFixed(1)}%)`,
    `- **手動承認**: ${monthlyMetrics.manualApprovedOperations.toLocaleString()} (${(100 - monthlyMetrics.autoApprovalRate).toFixed(1)}%)`,
    `- **1日平均操作数**: ${Math.round(monthlyMetrics.totalOperations / 30).toLocaleString()}`,
    `- **平均処理時間**: ${monthlyMetrics.averageProcessingTime.toFixed(1)}ms`,
    `- **最大処理時間**: ${monthlyMetrics.maxProcessingTime}ms`,
    ``,
    `## 週別推移`,
    ``,
    `| 週 | 期間 | 操作数 | 自動承認率 | 平均処理時間 |`,
    `|----|------|--------|------------|--------------|`,
    ...weeklyMetrics.map(week => 
      `| 第${week.week}週 | ${week.startDate} ～ ${week.endDate} | ${week.totalOperations.toLocaleString()} | ${week.autoApprovalRate.toFixed(1)}% | ${week.averageProcessingTime.toFixed(1)}ms |`
    ),
    ``,
    `## 操作タイプ別統計（月間）`,
    ``,
    ...Object.entries(monthlyMetrics.operationsByType)
      .sort(([,a], [,b]) => b - a)
      .map(([type, count]) => {
        const percentage = (count / monthlyMetrics.totalOperations * 100).toFixed(1);
        return `- **${type}**: ${count.toLocaleString()} (${percentage}%)`;
      }),
    ``,
    `## パフォーマンス分析`,
    ``,
    `### 処理時間分布`,
    `- **高速処理** (<50ms): ${monthlyMetrics.performanceMetrics.fastOperations.toLocaleString()}`,
    `- **通常処理** (50-100ms): ${monthlyMetrics.performanceMetrics.normalOperations.toLocaleString()}`,
    `- **低速処理** (>100ms): ${monthlyMetrics.performanceMetrics.slowOperations.toLocaleString()}`,
    ``,
    `### 目標達成状況`,
    `- **自動承認率目標** (95%以上): ${monthlyMetrics.autoApprovalRate >= 95 ? '✅ 達成' : '❌ 未達成'} (${monthlyMetrics.autoApprovalRate.toFixed(1)}%)`,
    `- **処理時間目標** (100ms以内): ${monthlyMetrics.averageProcessingTime <= 100 ? '✅ 達成' : '❌ 未達成'} (${monthlyMetrics.averageProcessingTime.toFixed(1)}ms)`,
    ``,
    `## 長期トレンド分析`,
    ``,
    generateLongTermTrendAnalysis(weeklyMetrics),
    ``,
    `## 改善提案`,
    ``,
    generateMonthlyRecommendations(monthlyMetrics, weeklyMetrics),
    ``,
    `## 運用効率評価`,
    ``,
    generateOperationalEfficiencyAnalysis(monthlyMetrics),
    ``,
    `---`,
    ``,
    `*このレポートは自動生成されました*`
  ].join('\n');

  return report;
}

/**
 * 長期トレンド分析を生成
 */
function generateLongTermTrendAnalysis(weeklyMetrics) {
  if (weeklyMetrics.length < 2) {
    return '十分なデータがありません。';
  }

  const approvalRates = weeklyMetrics.map(week => week.autoApprovalRate);
  const processingTimes = weeklyMetrics.map(week => week.averageProcessingTime);
  const operationCounts = weeklyMetrics.map(week => week.totalOperations);

  const approvalTrend = calculateTrend(approvalRates);
  const performanceTrend = calculateTrend(processingTimes);
  const volumeTrend = calculateTrend(operationCounts);

  const trends = [
    `- **自動承認率**: ${formatTrend(approvalTrend)} (${approvalRates[0].toFixed(1)}% → ${approvalRates[approvalRates.length - 1].toFixed(1)}%)`,
    `- **処理時間**: ${formatTrend(performanceTrend, true)} (${processingTimes[0].toFixed(1)}ms → ${processingTimes[processingTimes.length - 1].toFixed(1)}ms)`,
    `- **操作量**: ${formatTrend(volumeTrend)} (${operationCounts[0]} → ${operationCounts[operationCounts.length - 1]} 操作/週)`
  ];

  return trends.join('\n');
}

/**
 * 月次改善提案を生成
 */
function generateMonthlyRecommendations(monthlyMetrics, weeklyMetrics) {
  const recommendations = [];

  // 自動承認率の分析
  if (monthlyMetrics.autoApprovalRate < 95) {
    recommendations.push('🔧 **自動承認率改善**');
    recommendations.push('   - 現在の自動承認率が目標を下回っています');
    recommendations.push('   - 手動承認が頻発している操作の分析を推奨');
    recommendations.push('   - ポリシー設定の見直しを検討してください');
    recommendations.push('');
  }

  // パフォーマンスの分析
  if (monthlyMetrics.averageProcessingTime > 100) {
    recommendations.push('⚡ **パフォーマンス改善**');
    recommendations.push('   - 処理時間が目標を超えています');
    recommendations.push('   - システムリソースの確認を推奨');
    recommendations.push('   - キャッシュ機能の最適化を検討してください');
    recommendations.push('');
  }

  // 操作量の変動分析
  const operationCounts = weeklyMetrics.map(week => week.totalOperations);
  const maxOps = Math.max(...operationCounts);
  const minOps = Math.min(...operationCounts.filter(count => count > 0));
  
  if (maxOps > minOps * 2) {
    recommendations.push('📊 **作業パターン分析**');
    recommendations.push('   - 週間操作数に大きな変動があります');
    recommendations.push('   - 作業負荷の平準化を検討してください');
    recommendations.push('   - ピーク時のパフォーマンス対策を推奨');
    recommendations.push('');
  }

  // Trustダイアログの頻度分析
  if (monthlyMetrics.trustDialogDisplayCount > monthlyMetrics.totalOperations * 0.1) {
    recommendations.push('🚨 **ユーザビリティ改善**');
    recommendations.push('   - Trustダイアログの表示頻度が高めです');
    recommendations.push('   - 自動承認対象の拡大を検討してください');
    recommendations.push('   - ユーザーワークフローの最適化を推奨');
    recommendations.push('');
  }

  // 長期トレンドに基づく提案
  if (weeklyMetrics.length >= 3) {
    const recentWeeks = weeklyMetrics.slice(-2);
    const avgRecentApprovalRate = recentWeeks.reduce((sum, week) => sum + week.autoApprovalRate, 0) / recentWeeks.length;
    
    if (avgRecentApprovalRate < monthlyMetrics.autoApprovalRate) {
      recommendations.push('📉 **トレンド注意**');
      recommendations.push('   - 最近の自動承認率が低下傾向にあります');
      recommendations.push('   - 新しい操作パターンの確認を推奨');
      recommendations.push('   - ポリシー設定の定期見直しを検討してください');
      recommendations.push('');
    }
  }

  return recommendations.length > 0 
    ? recommendations.join('\n')
    : '- ✅ 現在の運用状況は良好です。継続的な監視を推奨します。';
}

/**
 * 運用効率評価を生成
 */
function generateOperationalEfficiencyAnalysis(monthlyMetrics) {
  const efficiency = [];

  // 効率性スコアの計算
  const approvalEfficiency = Math.min(monthlyMetrics.autoApprovalRate / 95 * 100, 100);
  const performanceEfficiency = Math.min(100 / monthlyMetrics.averageProcessingTime * 100, 100);
  const overallEfficiency = (approvalEfficiency + performanceEfficiency) / 2;

  efficiency.push(`### 効率性スコア`);
  efficiency.push(`- **自動承認効率**: ${approvalEfficiency.toFixed(1)}% (目標: 95%以上の自動承認率)`);
  efficiency.push(`- **処理性能効率**: ${performanceEfficiency.toFixed(1)}% (目標: 100ms以内の処理時間)`);
  efficiency.push(`- **総合効率**: ${overallEfficiency.toFixed(1)}%`);
  efficiency.push('');

  // 効率性評価
  let rating;
  if (overallEfficiency >= 90) {
    rating = '🌟 優秀';
  } else if (overallEfficiency >= 75) {
    rating = '✅ 良好';
  } else if (overallEfficiency >= 60) {
    rating = '⚠️ 要改善';
  } else {
    rating = '❌ 要対策';
  }

  efficiency.push(`### 総合評価: ${rating}`);
  efficiency.push('');

  // 運用コスト分析
  const dailyOperations = monthlyMetrics.totalOperations / 30;
  const manualInterventions = monthlyMetrics.manualApprovedOperations;
  const timesSaved = monthlyMetrics.autoApprovedOperations * 5; // 1操作あたり5秒節約と仮定

  efficiency.push(`### 運用コスト分析`);
  efficiency.push(`- **1日平均操作数**: ${dailyOperations.toFixed(1)}`);
  efficiency.push(`- **月間手動介入**: ${manualInterventions.toLocaleString()} 回`);
  efficiency.push(`- **推定時間節約**: ${Math.round(timesSaved / 60).toLocaleString()} 分/月`);

  return efficiency.join('\n');
}

/**
 * トレンドを計算（簡易線形回帰）
 */
function calculateTrend(values) {
  if (values.length < 2) return 0;

  const n = values.length;
  const sumX = (n * (n - 1)) / 2;
  const sumY = values.reduce((sum, val) => sum + val, 0);
  const sumXY = values.reduce((sum, val, index) => sum + (index * val), 0);
  const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  return slope;
}

/**
 * トレンドを文字列でフォーマット
 */
function formatTrend(slope, inverse = false) {
  const threshold = 0.1;
  
  if (Math.abs(slope) < threshold) {
    return '➡️ 横ばい';
  }
  
  if (inverse) {
    return slope > threshold ? '📈 悪化傾向' : '📉 改善傾向';
  } else {
    return slope > threshold ? '📈 上昇傾向' : '📉 下降傾向';
  }
}

/**
 * レポートファイルを保存
 */
async function saveReport(report, outputPath, type, date) {
  if (outputPath) {
    await fs.writeFile(outputPath, report, 'utf-8');
    console.log(`✅ レポートを保存しました: ${outputPath}`);
  } else {
    // デフォルトの出力先
    const reportsDir = '.kiro/reports/metrics';
    await fs.mkdir(reportsDir, { recursive: true });
    
    const dateStr = date.toISOString().split('T')[0];
    const defaultPath = join(reportsDir, `${type}-report-${dateStr}.md`);
    
    await fs.writeFile(defaultPath, report, 'utf-8');
    console.log(`✅ レポートを保存しました: ${defaultPath}`);
  }
}

/**
 * メイン処理
 */
async function main() {
  const options = parseArguments();

  if (options.help) {
    showHelp();
    return;
  }

  if (options.verbose) {
    console.log('📊 Trust承認ポリシーメトリクスレポート生成を開始します...\n');
    console.log('実行オプション:', options);
  }

  try {
    // 日付の解析
    const targetDate = parseDate(options.date);
    
    if (options.verbose) {
      console.log(`対象日: ${targetDate.toISOString().split('T')[0]}`);
      console.log(`レポートタイプ: ${options.type}`);
    }

    // メトリクス収集システムの初期化
    const collector = new MetricsCollector({
      enabled: true,
      retentionDays: 90, // レポート生成用に長期保持
      performanceThresholds: {
        fast: 50,
        normal: 100
      }
    });

    await collector.initialize();

    // レポート生成
    let report;
    switch (options.type) {
      case 'daily':
        if (options.verbose) console.log('日次レポートを生成中...');
        report = await collector.generateDailyReport(targetDate);
        break;
        
      case 'weekly':
        if (options.verbose) console.log('週次レポートを生成中...');
        report = await collector.generateWeeklyReport(targetDate);
        break;
        
      case 'monthly':
        if (options.verbose) console.log('月次レポートを生成中...');
        report = await generateMonthlyReport(collector, targetDate);
        break;
        
      default:
        throw new Error(`未対応のレポートタイプ: ${options.type}`);
    }

    // レポートの保存
    await saveReport(report, options.output, options.type, targetDate);

    // 簡易統計の表示
    if (options.verbose) {
      console.log('\n📈 レポート統計:');
      console.log(`   行数: ${report.split('\n').length}`);
      console.log(`   文字数: ${report.length.toLocaleString()}`);
      console.log(`   サイズ: ${Math.round(Buffer.byteLength(report, 'utf8') / 1024)}KB`);
    }

    console.log('\n✅ メトリクスレポートの生成が完了しました！');

  } catch (error) {
    console.error('❌ レポート生成中にエラーが発生しました:', error.message);
    if (options.verbose && error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// スクリプトが直接実行された場合のみメイン処理を実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main as generateTrustMetricsReport };