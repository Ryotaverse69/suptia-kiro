#!/usr/bin/env node

/**
 * PerformanceMonitor デモスクリプト
 * パフォーマンス監視システムの機能をデモンストレーション
 */

import { PerformanceMonitor } from './performance-monitor.js';
import { OperationType } from './types.js';

async function main() {
  console.log('🚀 PerformanceMonitor デモを開始します...\n');

  try {
    // PerformanceMonitorの初期化
    console.log('📊 PerformanceMonitorを初期化中...');
    const performanceMonitor = new PerformanceMonitor();
    await performanceMonitor.initialize();
    console.log('✅ 初期化完了\n');

    // パフォーマンステストの修正デモ
    console.log('🔧 パフォーマンステストの修正をデモ...');
    const fixResult = await performanceMonitor.fixPerformanceTests();
    console.log('修正結果:', {
      success: fixResult.success,
      fixedIssues: fixResult.fixedIssues.length,
      remainingIssues: fixResult.remainingIssues.length,
      executionTime: `${fixResult.executionTime.toFixed(2)}ms`
    });
    console.log('修正された問題:', fixResult.fixedIssues);
    if (fixResult.remainingIssues.length > 0) {
      console.log('残存する問題:', fixResult.remainingIssues);
    }
    console.log();

    // パフォーマンス測定デモ
    console.log('📈 パフォーマンス測定をデモ...');
    
    const testOperations = [
      {
        type: OperationType.GIT,
        command: 'git',
        args: ['status'],
        context: {
          workingDirectory: process.cwd(),
          user: 'demo-user',
          sessionId: 'demo-session-1'
        },
        timestamp: new Date()
      },
      {
        type: OperationType.FILE,
        command: 'touch',
        args: ['test-file.txt'],
        context: {
          workingDirectory: process.cwd(),
          user: 'demo-user',
          sessionId: 'demo-session-2'
        },
        timestamp: new Date()
      },
      {
        type: OperationType.CLI,
        command: 'npm',
        args: ['list'],
        context: {
          workingDirectory: process.cwd(),
          user: 'demo-user',
          sessionId: 'demo-session-3'
        },
        timestamp: new Date()
      }
    ];

    console.log('複数の操作のパフォーマンスを測定中...');
    const measurementResults = [];
    
    for (const [index, operation] of testOperations.entries()) {
      console.log(`  ${index + 1}. ${operation.command} ${operation.args.join(' ')}`);
      const metrics = await performanceMonitor.measurePerformance(operation);
      measurementResults.push(metrics);
      
      console.log(`     実行時間: ${metrics.executionTime.toFixed(2)}ms`);
      console.log(`     メモリ使用量: ${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB`);
      console.log(`     ステータス: ${metrics.status}`);
      
      // パフォーマンス履歴に記録
      await performanceMonitor.recordPerformanceHistory(metrics);
    }
    console.log();

    // 閾値監視デモ
    console.log('🎯 閾値監視をデモ...');
    const thresholdStatus = await performanceMonitor.monitorThresholds();
    console.log('閾値監視結果:', {
      overall: thresholdStatus.overall,
      violations: thresholdStatus.violations.length,
      warnings: thresholdStatus.warnings.length,
      recommendations: thresholdStatus.recommendations.length
    });
    
    if (thresholdStatus.violations.length > 0) {
      console.log('閾値違反:');
      thresholdStatus.violations.forEach(violation => {
        console.log(`  - ${violation.metric}: ${violation.value} > ${violation.threshold}`);
      });
    }
    
    if (thresholdStatus.warnings.length > 0) {
      console.log('警告:');
      thresholdStatus.warnings.forEach(warning => {
        console.log(`  - ${warning.metric}: ${warning.value} (警告レベル)`);
      });
    }
    
    if (thresholdStatus.recommendations.length > 0) {
      console.log('推奨事項:');
      thresholdStatus.recommendations.forEach(rec => {
        console.log(`  - ${rec}`);
      });
    }
    console.log();

    // リアルタイム監視デモ（短時間）
    console.log('🔍 リアルタイム監視をデモ（5秒間）...');
    await performanceMonitor.startRealTimeMonitoring(1000); // 1秒間隔
    
    // 5秒間待機
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    performanceMonitor.stopRealTimeMonitoring();
    console.log('✅ リアルタイム監視を停止しました\n');

    // パフォーマンスレポート生成デモ
    console.log('📊 パフォーマンスレポートを生成中...');
    const report = await performanceMonitor.generatePerformanceReport();
    
    console.log('レポート概要:', {
      id: report.id,
      期間: `${report.period.start.toLocaleString()} - ${report.period.end.toLocaleString()}`,
      総操作数: report.summary.totalOperations,
      平均実行時間: `${report.summary.averageExecutionTime.toFixed(2)}ms`,
      成功率: `${report.summary.successRate.toFixed(1)}%`,
      エラー率: `${report.summary.errorRate.toFixed(1)}%`
    });
    
    console.log('メトリクス統計:');
    console.log(`  実行時間: 最小=${report.metrics.executionTime.min.toFixed(2)}ms, ` +
                `最大=${report.metrics.executionTime.max.toFixed(2)}ms, ` +
                `平均=${report.metrics.executionTime.avg.toFixed(2)}ms, ` +
                `95%ile=${report.metrics.executionTime.p95.toFixed(2)}ms`);
    
    if (report.trends.length > 0) {
      console.log('パフォーマンストレンド:');
      report.trends.forEach(trend => {
        console.log(`  - ${trend.description} (変化率: ${trend.changeRate.toFixed(1)}%)`);
      });
    }
    
    if (report.alerts.length > 0) {
      console.log(`アラート: ${report.alerts.length}件`);
      report.alerts.slice(0, 3).forEach(alert => {
        console.log(`  - ${alert.message} (${alert.severity})`);
      });
    }
    console.log();

    // 統計情報の表示
    console.log('📈 パフォーマンス統計情報:');
    const stats = performanceMonitor.getPerformanceStatistics();
    console.log('統計:', {
      履歴サイズ: stats.historySize,
      アラート数: stats.alertCount,
      監視中: stats.isMonitoring,
      現在のメトリクス: {
        実行時間: `${stats.currentMetrics.executionTime.current.toFixed(2)}ms`,
        メモリ使用量: `${(stats.currentMetrics.memoryUsage.current / 1024 / 1024).toFixed(2)}MB`,
        CPU使用率: `${stats.currentMetrics.cpuUsage.current.toFixed(1)}%`
      }
    });
    console.log();

    // 高負荷シミュレーション
    console.log('⚡ 高負荷シミュレーション...');
    const highLoadPromises = [];
    
    for (let i = 0; i < 20; i++) {
      const operation = {
        type: OperationType.GIT,
        command: 'git',
        args: ['log', '--oneline', '-10'],
        context: {
          workingDirectory: process.cwd(),
          user: 'load-test-user',
          sessionId: `load-test-${i}`
        },
        timestamp: new Date()
      };
      
      highLoadPromises.push(performanceMonitor.measurePerformance(operation));
    }
    
    const highLoadResults = await Promise.all(highLoadPromises);
    const avgLoadTime = highLoadResults.reduce((sum, r) => sum + r.executionTime, 0) / highLoadResults.length;
    const failedOperations = highLoadResults.filter(r => r.status === 'fail').length;
    
    console.log('高負荷テスト結果:', {
      総操作数: highLoadResults.length,
      平均実行時間: `${avgLoadTime.toFixed(2)}ms`,
      失敗数: failedOperations,
      成功率: `${((highLoadResults.length - failedOperations) / highLoadResults.length * 100).toFixed(1)}%`
    });
    console.log();

    // パフォーマンス改善提案
    console.log('💡 パフォーマンス改善提案:');
    const finalReport = await performanceMonitor.generatePerformanceReport();
    if (finalReport.recommendations.length > 0) {
      finalReport.recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec}`);
      });
    } else {
      console.log('  現在のパフォーマンスは良好です');
    }
    console.log();

    console.log('✅ PerformanceMonitor デモが完了しました！');
    console.log('\n📋 デモで実行された機能:');
    console.log('  ✓ パフォーマンステストの修正');
    console.log('  ✓ リアルタイムパフォーマンス測定');
    console.log('  ✓ 閾値監視とアラート');
    console.log('  ✓ パフォーマンス履歴の記録');
    console.log('  ✓ パフォーマンスレポートの生成');
    console.log('  ✓ 高負荷時の動作確認');
    console.log('  ✓ パフォーマンス統計の収集');

  } catch (error) {
    console.error('❌ デモ実行中にエラーが発生しました:', error);
    console.error('スタックトレース:', error.stack);
    process.exit(1);
  }
}

// スクリプトが直接実行された場合のみmain関数を実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main as demoPerformanceMonitor };