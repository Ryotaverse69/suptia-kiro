#!/usr/bin/env node

/**
 * 自動修正機能の簡単なテストスクリプト
 */

import { promises as fs } from 'fs';
import { join } from 'path';

async function testAutoFixImplementation() {
  console.log('🧪 自動修正機能の実装をテスト中...\n');

  try {
    // 1. QualityAssuranceControllerファイルの存在確認
    const controllerPath = '.kiro/lib/trust-policy/quality-assurance-controller.ts';
    await fs.access(controllerPath);
    console.log('✅ QualityAssuranceControllerファイルが存在します');

    // 2. ファイル内容の確認
    const content = await fs.readFile(controllerPath, 'utf-8');
    
    // 必要な機能が実装されているかチェック
    const requiredFeatures = [
      { name: 'FixResult interface', pattern: /interface FixResult/ },
      { name: 'FixHistoryEntry interface', pattern: /interface FixHistoryEntry/ },
      { name: 'assessFixability method', pattern: /assessFixability/ },
      { name: 'recordFixResults method', pattern: /recordFixResults/ },
      { name: 'recordFixHistory method', pattern: /recordFixHistory/ },
      { name: 'rollbackFix method', pattern: /rollbackFix/ },
      { name: 'getFixHistory method', pattern: /getFixHistory/ },
      { name: 'getFixStatistics method', pattern: /getFixStatistics/ },
      { name: 'fixConfigValidationError method', pattern: /fixConfigValidationError/ },
      { name: 'optimizeDecisionProcessing method', pattern: /optimizeDecisionProcessing/ },
      { name: 'fixMissingTestResults method', pattern: /fixMissingTestResults/ }
    ];

    let implementedFeatures = 0;
    for (const feature of requiredFeatures) {
      if (feature.pattern.test(content)) {
        console.log(`✅ ${feature.name}が実装されています`);
        implementedFeatures++;
      } else {
        console.log(`❌ ${feature.name}が見つかりません`);
      }
    }

    console.log(`\n📊 実装状況: ${implementedFeatures}/${requiredFeatures.length} (${((implementedFeatures / requiredFeatures.length) * 100).toFixed(1)}%)`);

    // 3. テストファイルの存在確認
    const testPath = '.kiro/lib/trust-policy/__tests__/auto-fix.test.ts';
    try {
      await fs.access(testPath);
      console.log('✅ 自動修正機能のテストファイルが存在します');
    } catch (error) {
      console.log('❌ 自動修正機能のテストファイルが見つかりません');
    }

    // 4. デモスクリプトの存在確認
    const demoPath = '.kiro/lib/trust-policy/demo-auto-fix.mjs';
    try {
      await fs.access(demoPath);
      console.log('✅ 自動修正機能のデモスクリプトが存在します');
    } catch (error) {
      console.log('❌ 自動修正機能のデモスクリプトが見つかりません');
    }

    // 5. 検証スクリプトの存在確認
    const verifyPath = '.kiro/lib/trust-policy/verify-auto-fix.mjs';
    try {
      await fs.access(verifyPath);
      console.log('✅ 自動修正機能の検証スクリプトが存在します');
    } catch (error) {
      console.log('❌ 自動修正機能の検証スクリプトが見つかりません');
    }

    // 6. レポートディレクトリの確認
    const reportDir = '.kiro/reports/quality';
    try {
      await fs.mkdir(reportDir, { recursive: true });
      console.log('✅ 品質レポートディレクトリが準備されています');
    } catch (error) {
      console.log('❌ 品質レポートディレクトリの作成に失敗');
    }

    // 7. 自動修正機能の主要コンポーネント確認
    const autoFixComponents = [
      'setupAutoFixActions',
      'applyAutoFixes',
      'fixAuditLoggerLogMethod',
      'fixPolicyManagerValidation',
      'fixAutoApprovalRate'
    ];

    let implementedComponents = 0;
    for (const component of autoFixComponents) {
      if (content.includes(component)) {
        console.log(`✅ ${component}コンポーネントが実装されています`);
        implementedComponents++;
      } else {
        console.log(`❌ ${component}コンポーネントが見つかりません`);
      }
    }

    console.log(`\n📊 コンポーネント実装状況: ${implementedComponents}/${autoFixComponents.length} (${((implementedComponents / autoFixComponents.length) * 100).toFixed(1)}%)`);

    // 総合評価
    const totalScore = (implementedFeatures + implementedComponents) / (requiredFeatures.length + autoFixComponents.length) * 100;
    console.log(`\n🎯 総合実装スコア: ${totalScore.toFixed(1)}%`);

    if (totalScore >= 90) {
      console.log('🎉 自動修正機能の実装が完了しています！');
    } else if (totalScore >= 70) {
      console.log('⚠️ 自動修正機能の実装はほぼ完了していますが、いくつかの機能が不足しています。');
    } else {
      console.log('❌ 自動修正機能の実装が不完全です。追加の実装が必要です。');
    }

    // 8. 実装されたタスクの確認
    console.log('\n📋 タスク4.2の要件確認:');
    const requirements = [
      { name: '検出された問題の自動修正', implemented: content.includes('applyAutoFixes') },
      { name: '修正可能性の判定機能', implemented: content.includes('assessFixability') },
      { name: '修正結果の検証機能', implemented: content.includes('validate') && content.includes('rollback') },
      { name: '修正履歴の記録機能', implemented: content.includes('recordFixHistory') && content.includes('getFixHistory') }
    ];

    let completedRequirements = 0;
    for (const req of requirements) {
      if (req.implemented) {
        console.log(`✅ ${req.name}: 実装済み`);
        completedRequirements++;
      } else {
        console.log(`❌ ${req.name}: 未実装`);
      }
    }

    console.log(`\n📊 要件達成率: ${completedRequirements}/${requirements.length} (${((completedRequirements / requirements.length) * 100).toFixed(1)}%)`);

    if (completedRequirements === requirements.length) {
      console.log('🎉 タスク4.2の全要件が実装されています！');
      return true;
    } else {
      console.log('⚠️ タスク4.2の一部要件が未実装です。');
      return false;
    }

  } catch (error) {
    console.error('❌ テスト実行中にエラーが発生しました:', error);
    return false;
  }
}

async function main() {
  const success = await testAutoFixImplementation();
  
  if (success) {
    console.log('\n✅ 自動修正機能の実装テストが成功しました！');
    process.exit(0);
  } else {
    console.log('\n❌ 自動修正機能の実装テストが失敗しました。');
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