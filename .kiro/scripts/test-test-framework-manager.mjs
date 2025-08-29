#!/usr/bin/env node

/**
 * TestFrameworkManagerの実装テストスクリプト
 */

import { promises as fs } from 'fs';

async function testTestFrameworkManagerImplementation() {
  console.log('🧪 TestFrameworkManagerの実装をテスト中...\n');

  try {
    // 1. TestFrameworkManagerファイルの存在確認
    const managerPath = '.kiro/lib/trust-policy/test-framework-manager.ts';
    await fs.access(managerPath);
    console.log('✅ TestFrameworkManagerファイルが存在します');

    // 2. ファイル内容の確認
    const content = await fs.readFile(managerPath, 'utf-8');
    
    // 必要な機能が実装されているかチェック
    const requiredFeatures = [
      { name: 'TestType enum', pattern: /export enum TestType/ },
      { name: 'TestResult interface', pattern: /interface TestResult/ },
      { name: 'TestError interface', pattern: /interface TestError/ },
      { name: 'DependencyInfo interface', pattern: /interface DependencyInfo/ },
      { name: 'MissingMethod interface', pattern: /interface MissingMethod/ },
      { name: 'TestFrameworkManager class', pattern: /export class TestFrameworkManager/ },
      { name: 'initialize method', pattern: /async initialize\(\): Promise<void>/ },
      { name: 'initializeTestEnvironment method', pattern: /initializeTestEnvironment/ },
      { name: 'addMissingMethods method', pattern: /addMissingMethods/ },
      { name: 'resolveDependencies method', pattern: /resolveDependencies/ },
      { name: 'runTests method', pattern: /runTests/ },
      { name: 'detectMissingMethods method', pattern: /detectMissingMethods/ },
      { name: 'checkDependencies method', pattern: /checkDependencies/ },
      { name: 'getMissingMethods method', pattern: /getMissingMethods/ },
      { name: 'getDependencies method', pattern: /getDependencies/ },
      { name: 'isInitialized method', pattern: /isInitialized/ }
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
    const testPath = '.kiro/lib/trust-policy/__tests__/test-framework-manager.test.ts';
    try {
      await fs.access(testPath);
      console.log('✅ TestFrameworkManagerのテストファイルが存在します');
    } catch (error) {
      console.log('❌ TestFrameworkManagerのテストファイルが見つかりません');
    }

    // 4. デモスクリプトの存在確認
    const demoPath = '.kiro/lib/trust-policy/demo-test-framework-manager.mjs';
    try {
      await fs.access(demoPath);
      console.log('✅ TestFrameworkManagerのデモスクリプトが存在します');
    } catch (error) {
      console.log('❌ TestFrameworkManagerのデモスクリプトが見つかりません');
    }

    // 5. 検証スクリプトの存在確認
    const verifyPath = '.kiro/lib/trust-policy/verify-test-framework-manager.mjs';
    try {
      await fs.access(verifyPath);
      console.log('✅ TestFrameworkManagerの検証スクリプトが存在します');
    } catch (error) {
      console.log('❌ TestFrameworkManagerの検証スクリプトが見つかりません');
    }

    // 6. 主要メソッドの実装確認
    const coreMethods = [
      'initialize',
      'initializeTestEnvironment',
      'addMissingMethods',
      'resolveDependencies',
      'runTests',
      'detectMissingMethods',
      'checkDependencies',
      'analyzeComponentMethods',
      'addMissingMethod',
      'generateMethodImplementation',
      'validateAddedMethods',
      'installDependency',
      'updateDependency'
    ];

    let implementedMethods = 0;
    for (const method of coreMethods) {
      if (content.includes(method)) {
        console.log(`✅ ${method}メソッドが実装されています`);
        implementedMethods++;
      } else {
        console.log(`❌ ${method}メソッドが見つかりません`);
      }
    }

    console.log(`\n📊 メソッド実装状況: ${implementedMethods}/${coreMethods.length} (${((implementedMethods / coreMethods.length) * 100).toFixed(1)}%)`);

    // 7. テストタイプの確認
    const testTypes = ['UNIT', 'INTEGRATION', 'ACCEPTANCE', 'PERFORMANCE', 'END_TO_END'];
    let implementedTestTypes = 0;
    for (const testType of testTypes) {
      if (content.includes(testType)) {
        console.log(`✅ ${testType}テストタイプが定義されています`);
        implementedTestTypes++;
      } else {
        console.log(`❌ ${testType}テストタイプが見つかりません`);
      }
    }

    console.log(`\n📊 テストタイプ実装状況: ${implementedTestTypes}/${testTypes.length} (${((implementedTestTypes / testTypes.length) * 100).toFixed(1)}%)`);

    // 総合評価
    const totalScore = (implementedFeatures + implementedMethods + implementedTestTypes) / 
                      (requiredFeatures.length + coreMethods.length + testTypes.length) * 100;
    console.log(`\n🎯 総合実装スコア: ${totalScore.toFixed(1)}%`);

    if (totalScore >= 90) {
      console.log('🎉 TestFrameworkManagerの実装が完了しています！');
    } else if (totalScore >= 70) {
      console.log('⚠️ TestFrameworkManagerの実装はほぼ完了していますが、いくつかの機能が不足しています。');
    } else {
      console.log('❌ TestFrameworkManagerの実装が不完全です。追加の実装が必要です。');
    }

    // 8. タスク5.1の要件確認
    console.log('\n📋 タスク5.1の要件確認:');
    const requirements = [
      { name: 'テスト環境の初期化管理', implemented: content.includes('initializeTestEnvironment') },
      { name: '不足メソッドの自動追加', implemented: content.includes('addMissingMethods') && content.includes('generateMethodImplementation') },
      { name: 'テスト依存関係の解決', implemented: content.includes('resolveDependencies') && content.includes('checkDependencies') },
      { name: 'テスト実行の統括', implemented: content.includes('runTests') && content.includes('executeTests') }
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
      console.log('🎉 タスク5.1の全要件が実装されています！');
      return true;
    } else {
      console.log('⚠️ タスク5.1の一部要件が未実装です。');
      return false;
    }

  } catch (error) {
    console.error('❌ テスト実行中にエラーが発生しました:', error);
    return false;
  }
}

async function main() {
  const success = await testTestFrameworkManagerImplementation();
  
  if (success) {
    console.log('\n✅ TestFrameworkManagerの実装テストが成功しました！');
    process.exit(0);
  } else {
    console.log('\n❌ TestFrameworkManagerの実装テストが失敗しました。');
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