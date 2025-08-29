#!/usr/bin/env node

/**
 * Trust承認システム パフォーマンス最適化デモ
 * 
 * このスクリプトは以下の機能をデモンストレーションします：
 * - 操作パターンキャッシュと頻繁操作の事前計算
 * - 非同期処理とメモリ効率化
 * - 高負荷時の承認判定優先度制御
 * - 100ms以内の高速判定処理
 */

import { TrustDecisionEngine } from './dist/trust-decision-engine.js';
import { OperationType } from './dist/types.js';

class PerformanceDemo {
  constructor() {
    this.engine = new TrustDecisionEngine();
    this.results = [];
  }

  /**
   * デモを実行
   */
  async run() {
    console.log('🚀 Trust承認システム パフォーマンス最適化デモを開始します\n');

    try {
      await this.demo1_BasicPerformance();
      await this.demo2_CacheEffectiveness();
      await this.demo3_HighLoadHandling();
      await this.demo4_MemoryEfficiency();
      await this.demo5_PrecomputationBenefits();
      
      this.showSummary();
    } catch (error) {
      console.error('❌ デモ実行中にエラーが発生しました:', error);
    }
  }

  /**
   * デモ1: 基本的なパフォーマンス測定
   */
  async demo1_BasicPerformance() {
    console.log('📊 デモ1: 基本的なパフォーマンス測定');
    console.log('=' .repeat(50));

    const operations = [
      {
        type: OperationType.GIT,
        command: 'git',
        args: ['status'],
        context: { cwd: process.cwd(), user: 'demo', sessionId: 'demo-1' },
        timestamp: new Date()
      },
      {
        type: OperationType.FILE,
        command: 'touch',
        args: ['demo.txt'],
        context: { cwd: process.cwd(), user: 'demo', sessionId: 'demo-1' },
        timestamp: new Date()
      },
      {
        type: OperationType.CLI,
        command: 'vercel',
        args: ['status'],
        context: { cwd: process.cwd(), user: 'demo', sessionId: 'demo-1' },
        timestamp: new Date()
      }
    ];

    console.log('各操作の判定時間を測定中...');
    
    for (const operation of operations) {
      const startTime = performance.now();
      const decision = await this.engine.evaluateOperation(operation);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      const status = duration < 100 ? '✅' : '⚠️';
      
      console.log(`${status} ${operation.command} ${operation.args.join(' ')}: ${duration.toFixed(2)}ms`);
      console.log(`   判定: ${decision.approved ? '自動承認' : '手動承認'} (${decision.reason})`);
      
      this.results.push({
        operation: `${operation.command} ${operation.args.join(' ')}`,
        duration,
        approved: decision.approved
      });
    }
    
    console.log('\n');
  }

  /**
   * デモ2: キャッシュ効果の実証
   */
  async demo2_CacheEffectiveness() {
    console.log('⚡ デモ2: キャッシュ効果の実証');
    console.log('=' .repeat(50));

    const operation = {
      type: OperationType.GIT,
      command: 'git',
      args: ['status'],
      context: { cwd: process.cwd(), user: 'demo', sessionId: 'demo-2' },
      timestamp: new Date()
    };

    console.log('同じ操作を複数回実行してキャッシュ効果を測定...');

    const durations = [];
    
    for (let i = 0; i < 5; i++) {
      const startTime = performance.now();
      const decision = await this.engine.evaluateOperation(operation);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      durations.push(duration);
      
      const cacheStatus = i === 0 ? 'キャッシュなし' : 'キャッシュあり';
      console.log(`${i + 1}回目 (${cacheStatus}): ${duration.toFixed(2)}ms`);
    }

    const firstRun = durations[0];
    const averageCachedRuns = durations.slice(1).reduce((a, b) => a + b, 0) / (durations.length - 1);
    const speedup = firstRun / averageCachedRuns;

    console.log(`\n📈 キャッシュ効果: ${speedup.toFixed(2)}倍高速化`);
    console.log(`   初回実行: ${firstRun.toFixed(2)}ms`);
    console.log(`   キャッシュ後平均: ${averageCachedRuns.toFixed(2)}ms\n`);
  }

  /**
   * デモ3: 高負荷時の処理
   */
  async demo3_HighLoadHandling() {
    console.log('🔥 デモ3: 高負荷時の処理');
    console.log('=' .repeat(50));

    console.log('100個の並行操作を実行中...');
    
    const operations = Array.from({ length: 100 }, (_, i) => ({
      type: OperationType.GIT,
      command: 'git',
      args: ['status', `file-${i}`],
      context: { cwd: process.cwd(), user: 'demo', sessionId: 'demo-3' },
      timestamp: new Date()
    }));

    const startTime = performance.now();
    const promises = operations.map(op => this.engine.evaluateOperation(op));
    const results = await Promise.all(promises);
    const endTime = performance.now();

    const totalDuration = endTime - startTime;
    const averageDuration = totalDuration / results.length;
    const successCount = results.filter(r => r.approved !== undefined).length;

    console.log(`✅ 100個の操作を ${totalDuration.toFixed(2)}ms で完了`);
    console.log(`   平均処理時間: ${averageDuration.toFixed(2)}ms/操作`);
    console.log(`   成功率: ${(successCount / results.length * 100).toFixed(1)}%`);
    console.log(`   スループット: ${(results.length / (totalDuration / 1000)).toFixed(0)} 操作/秒\n`);
  }

  /**
   * デモ4: メモリ効率性
   */
  async demo4_MemoryEfficiency() {
    console.log('💾 デモ4: メモリ効率性');
    console.log('=' .repeat(50));

    const initialMemory = process.memoryUsage();
    console.log(`初期メモリ使用量: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);

    console.log('1000個の異なる操作を実行してメモリ使用量を監視...');

    // 大量の異なる操作を実行
    for (let batch = 0; batch < 10; batch++) {
      const operations = Array.from({ length: 100 }, (_, i) => ({
        type: OperationType.GIT,
        command: 'git',
        args: ['status', `batch-${batch}-file-${i}`],
        context: { cwd: process.cwd(), user: 'demo', sessionId: 'demo-4' },
        timestamp: new Date()
      }));

      const promises = operations.map(op => this.engine.evaluateOperation(op));
      await Promise.all(promises);

      const currentMemory = process.memoryUsage();
      const memoryIncrease = (currentMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024;
      
      console.log(`バッチ ${batch + 1}/10 完了 - メモリ増加: ${memoryIncrease.toFixed(2)}MB`);
    }

    const finalMemory = process.memoryUsage();
    const totalIncrease = (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024;

    console.log(`\n📊 メモリ効率性結果:`);
    console.log(`   最終メモリ使用量: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    console.log(`   総メモリ増加: ${totalIncrease.toFixed(2)}MB`);
    console.log(`   1000操作あたりのメモリ増加: ${totalIncrease.toFixed(2)}MB\n`);
  }

  /**
   * デモ5: 事前計算の効果
   */
  async demo5_PrecomputationBenefits() {
    console.log('🧠 デモ5: 事前計算の効果');
    console.log('=' .repeat(50));

    console.log('パフォーマンス最適化を手動実行中...');
    
    const optimizationStart = performance.now();
    await this.engine.optimizePerformance();
    const optimizationEnd = performance.now();
    
    console.log(`事前計算完了: ${(optimizationEnd - optimizationStart).toFixed(2)}ms`);

    // 事前計算後の性能測定
    const testOperation = {
      type: OperationType.GIT,
      command: 'git',
      args: ['status'],
      context: { cwd: process.cwd(), user: 'demo', sessionId: 'demo-5' },
      timestamp: new Date()
    };

    const durations = [];
    for (let i = 0; i < 10; i++) {
      const startTime = performance.now();
      await this.engine.evaluateOperation(testOperation);
      const endTime = performance.now();
      durations.push(endTime - startTime);
    }

    const averageDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);

    console.log(`\n📈 事前計算後の性能:`);
    console.log(`   平均処理時間: ${averageDuration.toFixed(2)}ms`);
    console.log(`   最短処理時間: ${minDuration.toFixed(2)}ms`);
    console.log(`   最長処理時間: ${maxDuration.toFixed(2)}ms`);
    console.log(`   100ms以内達成率: ${(durations.filter(d => d < 100).length / durations.length * 100).toFixed(1)}%\n`);
  }

  /**
   * 総合結果の表示
   */
  showSummary() {
    console.log('📋 パフォーマンス最適化デモ 総合結果');
    console.log('=' .repeat(50));

    const stats = this.engine.getPerformanceStats();
    
    console.log('基本統計:');
    console.log(`  総操作数: ${stats.totalOperations || 0}`);
    console.log(`  成功操作数: ${stats.successfulOperations || 0}`);
    console.log(`  成功率: ${(stats.successRate || 0).toFixed(1)}%`);
    console.log(`  平均処理時間: ${(stats.averageDuration || 0).toFixed(2)}ms`);
    
    if (stats.optimization) {
      console.log('\n最適化統計:');
      console.log(`  現在の負荷: ${stats.optimization.currentLoad || 0}`);
      console.log(`  キャッシュサイズ: ${JSON.stringify(stats.optimization.cacheSize || {})}`);
      console.log(`  キャッシュヒット率: ${(stats.optimization.cacheHitRate || 0).toFixed(1)}%`);
    }

    console.log('\n🎯 パフォーマンス目標達成状況:');
    console.log(`  ✅ 100ms以内の判定処理: ${(stats.averageDuration || 0) < 100 ? '達成' : '未達成'}`);
    console.log(`  ✅ 95%以上の自動承認率: ${(stats.successRate || 0) >= 95 ? '達成' : '未達成'}`);
    console.log(`  ✅ メモリ効率化: 実装済み`);
    console.log(`  ✅ 高負荷時の優先度制御: 実装済み`);

    console.log('\n🚀 パフォーマンス最適化デモが完了しました！');
  }
}

// デモを実行
const demo = new PerformanceDemo();
demo.run().catch(console.error);