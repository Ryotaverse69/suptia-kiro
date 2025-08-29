#!/usr/bin/env node

/**
 * 自動修正機能のデモンストレーション
 * 
 * 品質問題の検出から自動修正、検証、履歴記録までの
 * 一連の流れを実演します。
 */

import { QualityAssuranceController } from './quality-assurance-controller.ts';
import { promises as fs } from 'fs';

async function main() {
  console.log('🚀 自動修正機能デモを開始します...\n');

  try {
    // 品質保証コントローラーを初期化
    const controller = new QualityAssuranceController();
    await controller.initialize();

    console.log('📊 品質チェックを実行中...');
    const qualityResult = await controller.performQualityCheck();

    console.log('\n=== 品質チェック結果 ===');
    console.log(`総合判定: ${qualityResult.passed ? '✅ 合格' : '❌ 不合格'}`);
    console.log(`検出された問題: ${qualityResult.summary.total}件`);
    console.log(`- Critical: ${qualityResult.summary.critical}件`);
    console.log(`- High: ${qualityResult.summary.high}件`);
    console.log(`- Medium: ${qualityResult.summary.medium}件`);
    console.log(`- Low: ${qualityResult.summary.low}件`);
    console.log(`自動修正済み: ${qualityResult.summary.autoFixed}件`);

    if (qualityResult.issues.length > 0) {
      console.log('\n=== 検出された問題 ===');
      qualityResult.issues.forEach((issue, index) => {
        const statusIcon = issue.fixApplied ? '✅' : issue.autoFixable ? '🔧' : '⚠️';
        const severityIcon = {
          critical: '🚨',
          high: '⚠️',
          medium: '📝',
          low: '💡'
        }[issue.severity];
        
        console.log(`${index + 1}. ${statusIcon} ${severityIcon} [${issue.component}] ${issue.description}`);
        if (issue.fixApplied && issue.fixDetails) {
          console.log(`   └─ 修正済み: ${issue.fixDetails}`);
        } else if (issue.autoFixable) {
          console.log(`   └─ 自動修正可能`);
        }
      });
    }

    if (qualityResult.recommendations.length > 0) {
      console.log('\n=== 推奨事項 ===');
      qualityResult.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });
    }

    // 修正統計を表示
    console.log('\n=== 修正統計 ===');
    const stats = controller.getFixStatistics();
    console.log(`総修正回数: ${stats.totalFixes}回`);
    console.log(`成功: ${stats.successfulFixes}回`);
    console.log(`失敗: ${stats.failedFixes}回`);
    
    if (Object.keys(stats.fixesByType).length > 0) {
      console.log('\n修正タイプ別統計:');
      Object.entries(stats.fixesByType).forEach(([type, count]) => {
        console.log(`- ${type}: ${count}回`);
      });
    }

    if (stats.recentFixes.length > 0) {
      console.log('\n=== 最近の修正履歴 ===');
      stats.recentFixes.slice(0, 5).forEach((fix, index) => {
        const statusIcon = fix.success ? '✅' : '❌';
        console.log(`${index + 1}. ${statusIcon} ${fix.description}`);
        console.log(`   └─ ${fix.appliedAt.toLocaleString()} (${fix.fixType})`);
      });
    }

    // 品質状態の総合評価
    console.log('\n=== 品質状態評価 ===');
    const qualityStatus = await controller.getQualityStatus();
    const statusIcon = {
      excellent: '🌟',
      good: '✅',
      warning: '⚠️',
      critical: '🚨'
    }[qualityStatus.status];
    
    console.log(`品質スコア: ${qualityStatus.score}/100 ${statusIcon}`);
    console.log(`ステータス: ${qualityStatus.status}`);
    console.log(`最終チェック: ${qualityStatus.lastCheck?.toLocaleString()}`);

    // 品質改善の進捗
    console.log('\n=== 品質改善進捗 ===');
    const progress = await controller.trackQualityProgress();
    const trendIcon = {
      improving: '📈',
      stable: '➡️',
      declining: '📉'
    }[progress.trend];
    
    console.log(`トレンド: ${progress.trend} ${trendIcon}`);
    console.log(`解決済み問題: ${progress.resolvedIssues}件`);
    console.log(`新規問題: ${progress.newIssues}件`);

    if (progress.scoreHistory.length > 0) {
      console.log('\nスコア履歴:');
      progress.scoreHistory.slice(-5).forEach(entry => {
        console.log(`- ${entry.date}: ${entry.score}点`);
      });
    }

    // デモ用の追加テスト
    console.log('\n=== 自動修正機能テスト ===');
    
    // 1. 意図的に問題を作成してテスト
    console.log('1. AuditLoggerのlogメソッドを削除...');
    const auditLogger = controller.auditLogger;
    const originalLogMethod = auditLogger.log;
    delete auditLogger.log;
    
    // 2. 品質チェックを再実行
    console.log('2. 品質チェックを再実行...');
    const recheck = await controller.performQualityCheck();
    const logMethodIssue = recheck.issues.find(issue => 
      issue.id === 'audit-logger-missing-log-method'
    );
    
    if (logMethodIssue) {
      console.log(`✅ 問題を検出: ${logMethodIssue.description}`);
      if (logMethodIssue.fixApplied) {
        console.log('✅ 自動修正が適用されました');
        
        // 3. 修正結果を検証
        if (typeof auditLogger.log === 'function') {
          console.log('✅ logメソッドが正常に復元されました');
          
          // 4. ログ機能をテスト
          await auditLogger.log({ test: 'auto-fix demo', timestamp: new Date() });
          console.log('✅ ログ機能が正常に動作しています');
        }
      }
    }

    // 5. ロールバック機能のテスト
    console.log('\n3. ロールバック機能をテスト...');
    const fixHistory = controller.getFixHistory();
    const latestFix = fixHistory[fixHistory.length - 1];
    
    if (latestFix) {
      console.log(`最新の修正をロールバック: ${latestFix.description}`);
      const rollbackResult = await controller.rollbackFix(latestFix.id);
      
      if (rollbackResult) {
        console.log('✅ ロールバックが成功しました');
        
        // ロールバック後の状態を確認
        if (typeof auditLogger.log === 'undefined') {
          console.log('✅ logメソッドが正常に削除されました');
        }
        
        // 元のメソッドを復元
        auditLogger.log = originalLogMethod;
        console.log('✅ 元のlogメソッドを復元しました');
      } else {
        console.log('❌ ロールバックに失敗しました');
      }
    }

    console.log('\n🎉 自動修正機能デモが完了しました！');
    
    // レポートファイルの場所を表示
    console.log('\n📁 生成されたレポート:');
    const reportFiles = await fs.readdir('.kiro/reports/quality').catch(() => []);
    reportFiles.forEach(file => {
      console.log(`- .kiro/reports/quality/${file}`);
    });

  } catch (error) {
    console.error('❌ デモ実行中にエラーが発生しました:', error);
    process.exit(1);
  }
}

// スクリプトが直接実行された場合のみmain関数を呼び出し
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { main };