#!/usr/bin/env node

/**
 * PerformanceMonitor テストスクリプト
 * パフォーマンス監視システムの動作テスト
 */

import { PerformanceMonitor } from '../lib/trust-policy/performance-monitor.js';
import { OperationType } from '../lib/trust-policy/types.js';

class PerformanceMonitorTester {
  constructor() {
    this.performanceMonitor = new PerformanceMonitor();
    this.testResults = [];
  }

  /**
   * テスト結果を記録
   */
  recordTest(testName, success, details, duration = 0) {
    const result = {
      test: testName,
      success,
      details,
      duration,
      timestamp: new Date()
    };
    
    this.testResults.push(result);
    
    const status = success ? '✅' : '❌';
    const durationInfo = duration > 0 ? ` (${duration.toFixed(2)}ms)` : '';
    console.log(`${status} ${testName}${durationInfo}`);
    if (details) {
      console.log(`   ${details}`);
    }
  }

  /**
   * 初期化テスト
   */
  async testInitialization() {
    console.log('\n🔧 初期化テスト');
    
    try {
      const start = performance.now();
      await this.performanceMonitor.initialize();
      const duration = performance.now() - start;
      
      this.recordTest(
        'PerformanceMonitor初期化',
        true,
        '初期化が正常に完了しました',
        duration
      );
      
      return true;
    } catch (error) {
      this.recordTest(
        'PerformanceMonitor初期化',
        false,
        `初期化エラー: ${error.message}`
      );
      return false;
    }
  }

  /**
   * パフォーマンス測定テスト
   */
  async testPerformanceMeasurement() {
    console.log('\n📊 パフォーマンス測定テスト');

    const testOperations = [
      {
        name: 'Git Status',
        operation: {
          type: OperationType.GIT,
          command: 'git',
          args: ['status'],
          context: {
            workingDirectory: process.cwd(),
            user: 'test-user',
            sessionId: 'test-git-status'
          },
          timestamp: new Date()
        }
      },
      {
        name: 'File Touch',
        operation: {
          type: OperationType.FILE,
          command: 'touch',
          args: ['test-file.tmp'],
          context: {
            workingDirectory: process.cwd(),
            user: 'test-user',
            sessionId: 'test-file-touch'
          },
          timestamp: new Date()
        }
      },
      {
        name: 'Echo Command',
        operation: {
          type: OperationType.CLI,
          command: 'echo',
          args: ['performance-test'],
          context: {
            workingDirectory: process.cwd(),
            user: 'test-user',
            sessionId: 'test-echo'
          },
          timestamp: new Date()
        }
      }
    ];

    let allSuccess = true;

    for (const { name, operation } of testOperations) {
      try {
        const start = performance.now();
        const metrics = await this.performanceMonitor.measurePerformance(operation);
        const duration = performance.now() - start;

        const success = metrics && 
                       typeof metrics.executionTime === 'number' &&
                       typeof metrics.memoryUsage === 'number' &&
                       metrics.status !== undefined;

        this.recordTest(
          `${name} 測定`,
          success,
          success ? 
            `実行時間: ${metrics.executionTime.toFixed(2)}ms, メモリ: ${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB, ステータス: ${metrics.status}` :
            'メトリクス取得に失敗',
          duration
        );

        if (!success) allSuccess = false;

      } catch (error) {
        this.recordTest(
          `${name} 測定`,
          false,
          `測定エラー: ${error.message}`
        );
        allSuccess = false;
      }
    }

    return allSuccess;
  }

  /**
   * パフォーマンステスト修正テスト
   */
  async testPerformanceTestFix() {
    console.log('\n🔧 パフォーマンステスト修正テスト');

    try {
      const start = performance.now();
      const fixResult = await this.performanceMonitor.fixPerformanceTests();
      const duration = performance.now() - start;

      const success = fixResult &&
                     typeof fixResult.success === 'boolean' &&
                     Array.isArray(fixResult.fixedIssues) &&
                     Array.isArray(fixResult.remainingIssues);

      this.recordTest(
        'パフォーマンステスト修正',
        success,
        success ?
          `修正成功: ${fixResult.success}, 修正項目: ${fixResult.fixedIssues.length}件, 残存問題: ${fixResult.remainingIssues.length}件` :
          '修正結果の取得に失敗',
        duration
      );

      if (success && fixResult.fixedIssues.length > 0) {
        console.log('   修正された項目:');
        fixResult.fixedIssues.forEach(issue => {
          console.log(`     - ${issue}`);
        });
      }

      if (success && fixResult.remainingIssues.length > 0) {
        console.log('   残存する問題:');
        fixResult.remainingIssues.forEach(issue => {
          console.log(`     - ${issue}`);
        });
      }

      return success;
    } catch (error) {
      this.recordTest(
        'パフォーマンステスト修正',
        false,
        `修正エラー: ${error.message}`
      );
      return false;
    }
  }

  /**
   * 閾値監視テスト
   */
  async testThresholdMonitoring() {
    console.log('\n🎯 閾値監視テスト');

    try {
      const start = performance.now();
      const thresholdStatus = await this.performanceMonitor.monitorThresholds();
      const duration = performance.now() - start;

      const success = thresholdStatus &&
                     typeof thresholdStatus.overall === 'string' &&
                     Array.isArray(thresholdStatus.violations) &&
                     Array.isArray(thresholdStatus.warnings) &&
                     Array.isArray(thresholdStatus.recommendations);

      this.recordTest(
        '閾値監視',
        success,
        success ?
          `全体ステータス: ${thresholdStatus.overall}, 違反: ${thresholdStatus.violations.length}件, 警告: ${thresholdStatus.warnings.length}件` :
          '閾値監視結果の取得に失敗',
        duration
      );

      if (success && thresholdStatus.violations.length > 0) {
        console.log('   閾値違反:');
        thresholdStatus.violations.forEach(violation => {
          console.log(`     - ${violation.metric}: ${violation.value} > ${violation.threshold}`);
        });
      }

      if (success && thresholdStatus.warnings.length > 0) {
        console.log('   警告:');
        thresholdStatus.warnings.forEach(warning => {
          console.log(`     - ${warning.metric}: ${warning.value} (警告レベル)`);
        });
      }

      return success;
    } catch (error) {
      this.recordTest(
        '閾値監視',
        false,
        `監視エラー: ${error.message}`
      );
      return false;
    }
  }

  /**
   * リアルタイム監視テスト
   */
  async testRealTimeMonitoring() {
    console.log('\n🔍 リアルタイム監視テスト');

    try {
      // 監視開始
      const startTime = performance.now();
      await this.performanceMonitor.startRealTimeMonitoring(200); // 200ms間隔
      
      this.recordTest(
        'リアルタイム監視開始',
        true,
        '監視が正常に開始されました'
      );

      // 2秒間監視を実行
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 監視停止
      this.performanceMonitor.stopRealTimeMonitoring();
      const duration = performance.now() - startTime;
      
      this.recordTest(
        'リアルタイム監視停止',
        true,
        '監視が正常に停止されました',
        duration
      );

      return true;
    } catch (error) {
      this.recordTest(
        'リアルタイム監視',
        false,
        `監視エラー: ${error.message}`
      );
      return false;
    }
  }

  /**
   * レポート生成テスト
   */
  async testReportGeneration() {
    console.log('\n📊 レポート生成テスト');

    try {
      const start = performance.now();
      const report = await this.performanceMonitor.generatePerformanceReport();
      const duration = performance.now() - start;

      const success = report &&
                     typeof report.id === 'string' &&
                     report.timestamp instanceof Date &&
                     report.summary &&
                     report.metrics &&
                     Array.isArray(report.trends) &&
                     Array.isArray(report.alerts) &&
                     Array.isArray(report.recommendations);

      this.recordTest(
        'パフォーマンスレポート生成',
        success,
        success ?
          `レポートID: ${report.id}, 総操作数: ${report.summary.totalOperations}, 平均実行時間: ${report.summary.averageExecutionTime.toFixed(2)}ms` :
          'レポート生成に失敗',
        duration
      );

      if (success) {
        console.log('   レポート詳細:');
        console.log(`     - 期間: ${report.period.start.toLocaleString()} - ${report.period.end.toLocaleString()}`);
        console.log(`     - 成功率: ${report.summary.successRate.toFixed(1)}%`);
        console.log(`     - エラー率: ${report.summary.errorRate.toFixed(1)}%`);
        console.log(`     - トレンド数: ${report.trends.length}`);
        console.log(`     - アラート数: ${report.alerts.length}`);
        console.log(`     - 推奨事項数: ${report.recommendations.length}`);
      }

      return success;
    } catch (error) {
      this.recordTest(
        'パフォーマンスレポート生成',
        false,
        `レポート生成エラー: ${error.message}`
      );
      return false;
    }
  }

  /**
   * 履歴記録テスト
   */
  async testHistoryRecording() {
    console.log('\n📈 履歴記録テスト');

    try {
      const testMetrics = {
        operationType: 'test',
        operationId: 'test-history-001',
        executionTime: 75,
        memoryUsage: 2 * 1024 * 1024, // 2MB
        cpuUsage: 15,
        timestamp: new Date(),
        threshold: {
          executionTime: 100,
          memoryUsage: 512 * 1024 * 1024
        },
        status: 'pass'
      };

      const statsBefore = this.performanceMonitor.getPerformanceStatistics();
      
      const start = performance.now();
      await this.performanceMonitor.recordPerformanceHistory(testMetrics);
      const duration = performance.now() - start;

      const statsAfter = this.performanceMonitor.getPerformanceStatistics();
      const success = statsAfter.historySize > statsBefore.historySize;

      this.recordTest(
        'パフォーマンス履歴記録',
        success,
        success ?
          `履歴サイズ: ${statsBefore.historySize} → ${statsAfter.historySize}` :
          '履歴記録に失敗',
        duration
      );

      return success;
    } catch (error) {
      this.recordTest(
        'パフォーマンス履歴記録',
        false,
        `履歴記録エラー: ${error.message}`
      );
      return false;
    }
  }

  /**
   * 統計情報テスト
   */
  async testStatistics() {
    console.log('\n📊 統計情報テスト');

    try {
      const start = performance.now();
      const stats = this.performanceMonitor.getPerformanceStatistics();
      const duration = performance.now() - start;

      const success = stats &&
                     typeof stats.historySize === 'number' &&
                     typeof stats.alertCount === 'number' &&
                     typeof stats.isMonitoring === 'boolean' &&
                     stats.currentMetrics &&
                     typeof stats.currentMetrics.executionTime === 'object';

      this.recordTest(
        '統計情報取得',
        success,
        success ?
          `履歴: ${stats.historySize}件, アラート: ${stats.alertCount}件, 監視中: ${stats.isMonitoring}` :
          '統計情報の取得に失敗',
        duration
      );

      if (success) {
        console.log('   現在のメトリクス:');
        console.log(`     - 実行時間: ${stats.currentMetrics.executionTime.current.toFixed(2)}ms (平均: ${stats.currentMetrics.executionTime.average.toFixed(2)}ms)`);
        console.log(`     - メモリ使用量: ${(stats.currentMetrics.memoryUsage.current / 1024 / 1024).toFixed(2)}MB`);
        console.log(`     - CPU使用率: ${stats.currentMetrics.cpuUsage.current.toFixed(1)}%`);
      }

      return success;
    } catch (error) {
      this.recordTest(
        '統計情報取得',
        false,
        `統計情報エラー: ${error.message}`
      );
      return false;
    }
  }

  /**
   * 高負荷テスト
   */
  async testHighLoad() {
    console.log('\n⚡ 高負荷テスト');

    try {
      const concurrentOperations = 10;
      const operations = Array(concurrentOperations).fill(null).map((_, i) => ({
        type: OperationType.CLI,
        command: 'echo',
        args: [`load-test-${i}`],
        context: {
          workingDirectory: process.cwd(),
          user: 'load-test-user',
          sessionId: `load-test-${i}`
        },
        timestamp: new Date()
      }));

      const start = performance.now();
      const promises = operations.map(op => this.performanceMonitor.measurePerformance(op));
      const results = await Promise.all(promises);
      const duration = performance.now() - start;

      const successfulResults = results.filter(r => r.status !== 'error');
      const success = successfulResults.length === concurrentOperations;

      this.recordTest(
        `高負荷テスト (${concurrentOperations}並行)`,
        success,
        `成功: ${successfulResults.length}/${concurrentOperations}, 平均実行時間: ${(results.reduce((sum, r) => sum + r.executionTime, 0) / results.length).toFixed(2)}ms`,
        duration
      );

      return success;
    } catch (error) {
      this.recordTest(
        '高負荷テスト',
        false,
        `高負荷テストエラー: ${error.message}`
      );
      return false;
    }
  }

  /**
   * パフォーマンス要件テスト
   */
  async testPerformanceRequirements() {
    console.log('\n⏱️ パフォーマンス要件テスト');

    try {
      const testOperation = {
        type: OperationType.GIT,
        command: 'git',
        args: ['--version'],
        context: {
          workingDirectory: process.cwd(),
          user: 'perf-req-test',
          sessionId: 'perf-req-test'
        },
        timestamp: new Date()
      };

      // 100ms以内の実行時間要件テスト
      const measurements = [];
      for (let i = 0; i < 5; i++) {
        const start = performance.now();
        await this.performanceMonitor.measurePerformance(testOperation);
        measurements.push(performance.now() - start);
      }

      const avgTime = measurements.reduce((sum, time) => sum + time, 0) / measurements.length;
      const meets100msRequirement = avgTime <= 100;

      this.recordTest(
        '100ms以内実行要件',
        meets100msRequirement,
        `平均実行時間: ${avgTime.toFixed(2)}ms (要件: ≤100ms)`,
        avgTime
      );

      return meets100msRequirement;
    } catch (error) {
      this.recordTest(
        'パフォーマンス要件テスト',
        false,
        `要件テストエラー: ${error.message}`
      );
      return false;
    }
  }

  /**
   * 全テストの実行
   */
  async runAllTests() {
    console.log('🧪 PerformanceMonitor テストを開始します...\n');

    const testResults = [];

    // 各テストを順次実行
    testResults.push(await this.testInitialization());
    testResults.push(await this.testPerformanceMeasurement());
    testResults.push(await this.testPerformanceTestFix());
    testResults.push(await this.testThresholdMonitoring());
    testResults.push(await this.testRealTimeMonitoring());
    testResults.push(await this.testReportGeneration());
    testResults.push(await this.testHistoryRecording());
    testResults.push(await this.testStatistics());
    testResults.push(await this.testHighLoad());
    testResults.push(await this.testPerformanceRequirements());

    // 結果のサマリー
    const totalTests = this.testResults.length;
    const successfulTests = this.testResults.filter(r => r.success).length;
    const failedTests = totalTests - successfulTests;
    const successRate = totalTests > 0 ? (successfulTests / totalTests) * 100 : 0;

    console.log('\n📊 テスト結果サマリー:');
    console.log(`総テスト数: ${totalTests}`);
    console.log(`成功: ${successfulTests}`);
    console.log(`失敗: ${failedTests}`);
    console.log(`成功率: ${successRate.toFixed(1)}%`);

    if (failedTests > 0) {
      console.log('\n❌ 失敗したテスト:');
      this.testResults
        .filter(r => !r.success)
        .forEach(result => {
          console.log(`  - ${result.test}: ${result.details}`);
        });
    }

    // パフォーマンス統計
    const avgDuration = this.testResults
      .filter(r => r.duration > 0)
      .reduce((sum, r) => sum + r.duration, 0) / 
      this.testResults.filter(r => r.duration > 0).length;

    if (avgDuration > 0) {
      console.log(`\n⏱️ 平均テスト実行時間: ${avgDuration.toFixed(2)}ms`);
    }

    console.log('\n✅ PerformanceMonitor テストが完了しました');
    
    return successRate >= 80; // 80%以上の成功率で合格
  }
}

async function main() {
  const tester = new PerformanceMonitorTester();
  const success = await tester.runAllTests();
  
  process.exit(success ? 0 : 1);
}

// スクリプトが直接実行された場合のみmain関数を実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { PerformanceMonitorTester };