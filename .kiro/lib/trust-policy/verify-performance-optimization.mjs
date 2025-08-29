#!/usr/bin/env node

/**
 * Trust承認システム パフォーマンス最適化検証スクリプト
 * 
 * 要件7.1, 7.2, 7.3の実装を検証：
 * - 操作パターンキャッシュと頻繁操作の事前計算機能
 * - 非同期処理とメモリ効率化
 * - 高負荷時の承認判定優先度制御
 */

import { TrustDecisionEngine } from './dist/trust-decision-engine.js';
import { PerformanceOptimizer } from './dist/performance-optimizer.js';
import { OperationType } from './dist/types.js';
import { PolicyManager } from './dist/policy-manager.js';

class PerformanceVerification {
  constructor() {
    this.engine = new TrustDecisionEngine();
    this.optimizer = new PerformanceOptimizer();
    this.policyManager = new PolicyManager();
    this.testResults = [];
  }

  /**
   * 検証を実行
   */
  async run() {
    console.log('🔍 Trust承認システム パフォーマンス最適化検証を開始します\n');

    try {
      await this.setupTestEnvironment();
      
      const results = await Promise.all([
        this.verify_Requirement_7_1(),
        this.verify_Requirement_7_2(),
        this.verify_Requirement_7_3()
      ]);

      this.generateVerificationReport(results);
    } catch (error) {
      console.error('❌ 検証中にエラーが発生しました:', error);
      process.exit(1);
    }
  }

  /**
   * テスト環境のセットアップ
   */
  async setupTestEnvironment() {
    console.log('🔧 テスト環境をセットアップ中...');
    
    // テスト用ポリシーを設定
    await this.policyManager.updatePolicy({
      version: '1.0-test',
      lastUpdated: new Date(),
      autoApprove: {
        gitOperations: ['status', 'commit', 'push', 'pull', 'log'],
        fileOperations: ['read', 'write', 'create', 'update'],
        cliOperations: {
          vercel: ['env ls', 'status', 'deployments ls'],
          npm: ['install', 'run build', 'run test']
        },
        scriptExecution: {
          extensions: ['.mjs', '.js'],
          allowedPaths: ['scripts/', '.kiro/scripts/']
        }
      },
      manualApprove: {
        deleteOperations: ['git branch -D', 'rm -rf', 'vercel env rm'],
        forceOperations: ['git push --force', 'git reset --hard'],
        productionImpact: ['vercel env set', 'github:write', 'sanity-dev:write']
      },
      security: {
        maxAutoApprovalPerHour: 1000,
        suspiciousPatternDetection: true,
        logAllOperations: true
      }
    });

    console.log('✅ テスト環境のセットアップが完了しました\n');
  }

  /**
   * 要件7.1の検証: 操作パターンキャッシュと頻繁操作の事前計算機能
   */
  async verify_Requirement_7_1() {
    console.log('📊 要件7.1検証: 操作パターンキャッシュと頻繁操作の事前計算機能');
    console.log('-'.repeat(60));

    const testResults = {
      requirement: '7.1',
      description: '操作パターンキャッシュと頻繁操作の事前計算機能',
      tests: []
    };

    // テスト1: 事前計算機能
    console.log('テスト1: 事前計算機能の動作確認');
    const precomputeStart = performance.now();
    await this.optimizer.precomputeFrequentOperations();
    const precomputeEnd = performance.now();
    const precomputeDuration = precomputeEnd - precomputeStart;

    const precomputeTest = {
      name: '事前計算実行',
      passed: precomputeDuration < 10000, // 10秒以内
      duration: precomputeDuration,
      details: `事前計算時間: ${precomputeDuration.toFixed(2)}ms`
    };
    testResults.tests.push(precomputeTest);
    console.log(`  ${precomputeTest.passed ? '✅' : '❌'} ${precomputeTest.details}`);

    // テスト2: キャッシュ効果の測定
    console.log('テスト2: キャッシュ効果の測定');
    const testOperation = {
      type: OperationType.GIT,
      command: 'git',
      args: ['status'],
      context: { cwd: process.cwd(), user: 'test', sessionId: 'verify-7.1' },
      timestamp: new Date()
    };

    // 初回実行（キャッシュなし）
    const firstRunStart = performance.now();
    await this.engine.evaluateOperation(testOperation);
    const firstRunEnd = performance.now();
    const firstRunDuration = firstRunEnd - firstRunStart;

    // 2回目実行（キャッシュあり）
    const secondRunStart = performance.now();
    await this.engine.evaluateOperation(testOperation);
    const secondRunEnd = performance.now();
    const secondRunDuration = secondRunEnd - secondRunStart;

    const speedup = firstRunDuration / secondRunDuration;
    const cacheTest = {
      name: 'キャッシュ効果',
      passed: speedup > 1.5 && secondRunDuration < 50, // 1.5倍以上高速化、50ms以内
      speedup: speedup,
      details: `高速化率: ${speedup.toFixed(2)}倍, 2回目: ${secondRunDuration.toFixed(2)}ms`
    };
    testResults.tests.push(cacheTest);
    console.log(`  ${cacheTest.passed ? '✅' : '❌'} ${cacheTest.details}`);

    // テスト3: 100ms以内の判定処理
    console.log('テスト3: 100ms以内の判定処理');
    const fastOperations = [
      { type: OperationType.GIT, command: 'git', args: ['status'] },
      { type: OperationType.FILE, command: 'touch', args: ['test.txt'] },
      { type: OperationType.CLI, command: 'vercel', args: ['status'] }
    ];

    let under100msCount = 0;
    const totalTests = fastOperations.length * 10; // 各操作を10回テスト

    for (const baseOp of fastOperations) {
      for (let i = 0; i < 10; i++) {
        const operation = {
          ...baseOp,
          args: [...baseOp.args, `test-${i}`],
          context: { cwd: process.cwd(), user: 'test', sessionId: 'verify-7.1' },
          timestamp: new Date()
        };

        const start = performance.now();
        await this.engine.evaluateOperation(operation);
        const end = performance.now();
        
        if (end - start < 100) {
          under100msCount++;
        }
      }
    }

    const under100msRate = (under100msCount / totalTests) * 100;
    const speedTest = {
      name: '100ms以内判定',
      passed: under100msRate >= 95, // 95%以上が100ms以内
      rate: under100msRate,
      details: `100ms以内達成率: ${under100msRate.toFixed(1)}%`
    };
    testResults.tests.push(speedTest);
    console.log(`  ${speedTest.passed ? '✅' : '❌'} ${speedTest.details}`);

    console.log('');
    return testResults;
  }

  /**
   * 要件7.2の検証: 非同期処理とメモリ効率化
   */
  async verify_Requirement_7_2() {
    console.log('⚡ 要件7.2検証: 非同期処理とメモリ効率化');
    console.log('-'.repeat(60));

    const testResults = {
      requirement: '7.2',
      description: '非同期処理とメモリ効率化',
      tests: []
    };

    // テスト1: 並行処理性能
    console.log('テスト1: 並行処理性能');
    const parallelOperations = Array.from({ length: 50 }, (_, i) => ({
      type: OperationType.GIT,
      command: 'git',
      args: ['status', `parallel-${i}`],
      context: { cwd: process.cwd(), user: 'test', sessionId: 'verify-7.2' },
      timestamp: new Date()
    }));

    const parallelStart = performance.now();
    const parallelPromises = parallelOperations.map(op => this.engine.evaluateOperation(op));
    const parallelResults = await Promise.all(parallelPromises);
    const parallelEnd = performance.now();
    const parallelDuration = parallelEnd - parallelStart;

    const parallelTest = {
      name: '並行処理',
      passed: parallelDuration < 2000 && parallelResults.length === 50, // 2秒以内で50操作完了
      duration: parallelDuration,
      details: `50操作並行処理: ${parallelDuration.toFixed(2)}ms`
    };
    testResults.tests.push(parallelTest);
    console.log(`  ${parallelTest.passed ? '✅' : '❌'} ${parallelTest.details}`);

    // テスト2: メモリ効率性
    console.log('テスト2: メモリ効率性');
    const initialMemory = process.memoryUsage().heapUsed;

    // 大量の操作を実行
    for (let batch = 0; batch < 5; batch++) {
      const batchOperations = Array.from({ length: 100 }, (_, i) => ({
        type: OperationType.GIT,
        command: 'git',
        args: ['status', `batch-${batch}-${i}`],
        context: { cwd: process.cwd(), user: 'test', sessionId: 'verify-7.2' },
        timestamp: new Date()
      }));

      const batchPromises = batchOperations.map(op => this.engine.evaluateOperation(op));
      await Promise.all(batchPromises);
    }

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB

    const memoryTest = {
      name: 'メモリ効率',
      passed: memoryIncrease < 50, // 50MB以内の増加
      increase: memoryIncrease,
      details: `500操作でのメモリ増加: ${memoryIncrease.toFixed(2)}MB`
    };
    testResults.tests.push(memoryTest);
    console.log(`  ${memoryTest.passed ? '✅' : '❌'} ${memoryTest.details}`);

    // テスト3: 非同期処理の安定性
    console.log('テスト3: 非同期処理の安定性');
    const mixedOperations = [
      { type: OperationType.GIT, command: 'git', args: ['status'] },
      { type: OperationType.FILE, command: 'touch', args: ['async-test.txt'] },
      { type: OperationType.CLI, command: 'vercel', args: ['status'] },
      { type: OperationType.GIT, command: 'git', args: ['log', '--oneline'] }
    ];

    const asyncPromises = [];
    for (let i = 0; i < 25; i++) { // 100個の非同期操作
      for (const baseOp of mixedOperations) {
        asyncPromises.push(this.engine.evaluateOperation({
          ...baseOp,
          args: [...baseOp.args, `async-${i}`],
          context: { cwd: process.cwd(), user: 'test', sessionId: 'verify-7.2' },
          timestamp: new Date()
        }));
      }
    }

    const asyncStart = performance.now();
    const asyncResults = await Promise.all(asyncPromises);
    const asyncEnd = performance.now();
    const asyncDuration = asyncEnd - asyncStart;

    const successCount = asyncResults.filter(r => r && r.approved !== undefined).length;
    const asyncTest = {
      name: '非同期安定性',
      passed: successCount === asyncResults.length && asyncDuration < 3000,
      successRate: (successCount / asyncResults.length) * 100,
      details: `100操作非同期処理: ${asyncDuration.toFixed(2)}ms, 成功率: ${((successCount / asyncResults.length) * 100).toFixed(1)}%`
    };
    testResults.tests.push(asyncTest);
    console.log(`  ${asyncTest.passed ? '✅' : '❌'} ${asyncTest.details}`);

    console.log('');
    return testResults;
  }

  /**
   * 要件7.3の検証: 高負荷時の承認判定優先度制御
   */
  async verify_Requirement_7_3() {
    console.log('🔥 要件7.3検証: 高負荷時の承認判定優先度制御');
    console.log('-'.repeat(60));

    const testResults = {
      requirement: '7.3',
      description: '高負荷時の承認判定優先度制御',
      tests: []
    };

    // テスト1: 高負荷状態での動作
    console.log('テスト1: 高負荷状態での動作');
    const highLoadOperations = Array.from({ length: 120 }, (_, i) => ({
      type: OperationType.GIT,
      command: 'git',
      args: ['status', `load-${i}`],
      context: { cwd: process.cwd(), user: 'test', sessionId: 'verify-7.3' },
      timestamp: new Date()
    }));

    const highLoadStart = performance.now();
    const highLoadPromises = highLoadOperations.map(op => this.engine.evaluateOperation(op));
    const highLoadResults = await Promise.all(highLoadPromises);
    const highLoadEnd = performance.now();
    const highLoadDuration = highLoadEnd - highLoadStart;

    const highLoadTest = {
      name: '高負荷処理',
      passed: highLoadResults.length === 120 && highLoadDuration < 5000,
      duration: highLoadDuration,
      details: `120操作高負荷処理: ${highLoadDuration.toFixed(2)}ms`
    };
    testResults.tests.push(highLoadTest);
    console.log(`  ${highLoadTest.passed ? '✅' : '❌'} ${highLoadTest.details}`);

    // テスト2: 優先度制御の動作
    console.log('テスト2: 優先度制御の動作');
    
    // 高優先度操作（削除系）
    const highPriorityOps = Array.from({ length: 5 }, (_, i) => ({
      type: OperationType.GIT,
      command: 'git',
      args: ['branch', '-D', `feature-${i}`],
      context: { cwd: process.cwd(), user: 'test', sessionId: 'verify-7.3' },
      timestamp: new Date()
    }));

    // 低優先度操作（通常操作）
    const lowPriorityOps = Array.from({ length: 95 }, (_, i) => ({
      type: OperationType.GIT,
      command: 'git',
      args: ['status', `normal-${i}`],
      context: { cwd: process.cwd(), user: 'test', sessionId: 'verify-7.3' },
      timestamp: new Date()
    }));

    // 混合して実行
    const mixedOps = [...lowPriorityOps, ...highPriorityOps];
    const priorityStart = performance.now();
    const priorityPromises = mixedOps.map(op => this.engine.evaluateOperation(op));
    const priorityResults = await Promise.all(priorityPromises);
    const priorityEnd = performance.now();
    const priorityDuration = priorityEnd - priorityStart;

    const priorityTest = {
      name: '優先度制御',
      passed: priorityResults.length === 100 && priorityDuration < 4000,
      duration: priorityDuration,
      details: `優先度混合100操作: ${priorityDuration.toFixed(2)}ms`
    };
    testResults.tests.push(priorityTest);
    console.log(`  ${priorityTest.passed ? '✅' : '❌'} ${priorityTest.details}`);

    // テスト3: 負荷回復後の性能
    console.log('テスト3: 負荷回復後の性能');
    
    // 負荷が下がった後の通常操作
    const recoveryOperation = {
      type: OperationType.GIT,
      command: 'git',
      args: ['status'],
      context: { cwd: process.cwd(), user: 'test', sessionId: 'verify-7.3' },
      timestamp: new Date()
    };

    const recoveryStart = performance.now();
    const recoveryResult = await this.engine.evaluateOperation(recoveryOperation);
    const recoveryEnd = performance.now();
    const recoveryDuration = recoveryEnd - recoveryStart;

    const recoveryTest = {
      name: '負荷回復',
      passed: recoveryDuration < 100 && recoveryResult.approved !== undefined,
      duration: recoveryDuration,
      details: `負荷回復後の処理時間: ${recoveryDuration.toFixed(2)}ms`
    };
    testResults.tests.push(recoveryTest);
    console.log(`  ${recoveryTest.passed ? '✅' : '❌'} ${recoveryTest.details}`);

    console.log('');
    return testResults;
  }

  /**
   * 検証レポートを生成
   */
  generateVerificationReport(results) {
    console.log('📋 パフォーマンス最適化検証レポート');
    console.log('='.repeat(60));

    let totalTests = 0;
    let passedTests = 0;

    for (const result of results) {
      console.log(`\n要件${result.requirement}: ${result.description}`);
      console.log('-'.repeat(40));

      for (const test of result.tests) {
        totalTests++;
        if (test.passed) passedTests++;
        
        const status = test.passed ? '✅ PASS' : '❌ FAIL';
        console.log(`  ${status} ${test.name}: ${test.details}`);
      }
    }

    const overallSuccess = passedTests === totalTests;
    const successRate = (passedTests / totalTests) * 100;

    console.log('\n' + '='.repeat(60));
    console.log('📊 総合結果');
    console.log(`テスト成功率: ${passedTests}/${totalTests} (${successRate.toFixed(1)}%)`);
    
    if (overallSuccess) {
      console.log('🎉 すべてのパフォーマンス最適化要件が満たされています！');
      
      // パフォーマンス統計を表示
      const stats = this.engine.getPerformanceStats();
      console.log('\n📈 最終パフォーマンス統計:');
      console.log(`  平均処理時間: ${(stats.averageDuration || 0).toFixed(2)}ms`);
      console.log(`  成功率: ${(stats.successRate || 0).toFixed(1)}%`);
      
      if (stats.optimization) {
        console.log(`  キャッシュヒット率: ${(stats.optimization.cacheHitRate || 0).toFixed(1)}%`);
        console.log(`  現在の負荷: ${stats.optimization.currentLoad || 0}`);
      }
      
      process.exit(0);
    } else {
      console.log('⚠️  一部のテストが失敗しました。実装を確認してください。');
      process.exit(1);
    }
  }
}

// 検証を実行
const verification = new PerformanceVerification();
verification.run().catch(console.error);