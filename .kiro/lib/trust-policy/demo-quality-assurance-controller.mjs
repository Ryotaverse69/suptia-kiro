#!/usr/bin/env node

/**
 * QualityAssuranceController デモスクリプト
 */

// TypeScriptファイルを動的にインポート
const { QualityAssuranceController } = await import('./quality-assurance-controller.ts');

async function runDemo() {
  console.log('🧪 QualityAssuranceController デモを開始します...\n');

  try {
    // コントローラーのインスタンス作成
    const controller = new QualityAssuranceController();
    
    console.log('📋 1. 品質保証コントローラーの初期化');
    await controller.initialize();
    console.log('✅ 初期化完了\n');

    console.log('📋 2. 品質チェックの実行');
    const result = await controller.performQualityCheck();
    
    console.log('📊 品質チェック結果:');
    console.log(`- 総問題数: ${result.summary.total}`);
    console.log(`- 重大: ${result.summary.critical}`);
    console.log(`- 高: ${result.summary.high}`);
    console.log(`- 中: ${result.summary.medium}`);
    console.log(`- 低: ${result.summary.low}`);
    console.log(`- 自動修正済み: ${result.summary.autoFixed}`);
    console.log(`- 品質チェック合格: ${result.passed ? '✅' : '❌'}\n`);

    if (result.issues.length > 0) {
      console.log('🔍 検出された問題:');
      result.issues.forEach((issue, index) => {
        const statusIcon = issue.fixApplied ? '✅' : '⚠️';
        console.log(`${index + 1}. ${statusIcon} [${issue.severity.toUpperCase()}] ${issue.component}: ${issue.description}`);
        if (issue.fixApplied && issue.fixDetails) {
          console.log(`   修正内容: ${issue.fixDetails}`);
        }
      });
      console.log();
    }

    if (result.recommendations.length > 0) {
      console.log('💡 推奨事項:');
      result.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });
      console.log();
    }

    console.log('📋 3. 修正統計の取得');
    const stats = controller.getFixStatistics();
    console.log('📊 修正統計:');
    console.log(`- 総修正数: ${stats.totalFixes}`);
    console.log(`- 成功: ${stats.successfulFixes}`);
    console.log(`- 失敗: ${stats.failedFixes}`);
    console.log(`- 修正タイプ別:`, stats.fixesByType);
    console.log(`- 最近の修正: ${stats.recentFixes.length}件\n`);

    console.log('📋 4. 修正履歴の確認');
    const history = controller.getFixHistory();
    if (history.length > 0) {
      console.log('📜 修正履歴:');
      history.slice(0, 3).forEach((entry, index) => {
        console.log(`${index + 1}. ${entry.description} (${entry.success ? '成功' : '失敗'})`);
        console.log(`   実行日時: ${entry.appliedAt.toISOString()}`);
        console.log(`   修正タイプ: ${entry.fixType}`);
      });
    } else {
      console.log('📜 修正履歴はありません');
    }

    console.log('\n🎉 QualityAssuranceController デモが完了しました！');
    
    // 結果の判定
    if (result.passed) {
      console.log('✅ 品質チェックに合格しています');
      process.exit(0);
    } else {
      console.log('⚠️ 品質チェックで問題が検出されました');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ デモ実行中にエラーが発生しました:', error);
    process.exit(1);
  }
}

// デモの実行
runDemo().catch(console.error);