#!/usr/bin/env node

/**
 * 依存関係解決機能のテストスクリプト
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import { join } from 'path';

/**
 * 依存関係解決機能のテスト実行
 */
async function testDependencyResolution() {
  console.log('🧪 依存関係解決機能のテストを開始');
  console.log('='.repeat(50));

  const testResults = {
    unit: null,
    integration: null,
    demo: null,
    verification: null
  };

  try {
    // 1. ユニットテストの実行
    console.log('\n📋 Step 1: ユニットテストの実行');
    try {
      const unitTestResult = await runJestTest('.kiro/lib/trust-policy/__tests__/dependency-resolution.test.ts');
      testResults.unit = unitTestResult;
      
      if (unitTestResult.success) {
        console.log('✅ ユニットテスト成功');
      } else {
        console.log('❌ ユニットテスト失敗');
        console.log(unitTestResult.output);
      }
    } catch (error) {
      console.log('❌ ユニットテスト実行エラー:', error.message);
      testResults.unit = { success: false, error: error.message };
    }

    // 2. 統合テストの実行
    console.log('\n📋 Step 2: 統合テストの実行');
    try {
      const integrationTestResult = await runJestTest('.kiro/lib/trust-policy/__tests__/test-framework-manager.test.ts');
      testResults.integration = integrationTestResult;
      
      if (integrationTestResult.success) {
        console.log('✅ 統合テスト成功');
      } else {
        console.log('❌ 統合テスト失敗');
        console.log(integrationTestResult.output);
      }
    } catch (error) {
      console.log('❌ 統合テスト実行エラー:', error.message);
      testResults.integration = { success: false, error: error.message };
    }

    // 3. デモンストレーションの実行
    console.log('\n📋 Step 3: デモンストレーションの実行');
    try {
      const demoResult = await runNodeScript('.kiro/lib/trust-policy/demo-dependency-resolution.mjs');
      testResults.demo = demoResult;
      
      if (demoResult.success) {
        console.log('✅ デモンストレーション成功');
      } else {
        console.log('❌ デモンストレーション失敗');
        console.log(demoResult.output);
      }
    } catch (error) {
      console.log('❌ デモンストレーション実行エラー:', error.message);
      testResults.demo = { success: false, error: error.message };
    }

    // 4. 検証スクリプトの実行
    console.log('\n📋 Step 4: 検証スクリプトの実行');
    try {
      const verificationResult = await runNodeScript('.kiro/lib/trust-policy/verify-dependency-resolution.mjs');
      testResults.verification = verificationResult;
      
      if (verificationResult.success) {
        console.log('✅ 検証スクリプト成功');
      } else {
        console.log('❌ 検証スクリプト失敗');
        console.log(verificationResult.output);
      }
    } catch (error) {
      console.log('❌ 検証スクリプト実行エラー:', error.message);
      testResults.verification = { success: false, error: error.message };
    }

    // 5. 結果の集計と表示
    console.log('\n📊 テスト結果サマリー');
    console.log('='.repeat(30));

    const results = [
      { name: 'ユニットテスト', result: testResults.unit },
      { name: '統合テスト', result: testResults.integration },
      { name: 'デモンストレーション', result: testResults.demo },
      { name: '検証スクリプト', result: testResults.verification }
    ];

    let passedCount = 0;
    let totalCount = results.length;

    results.forEach(({ name, result }) => {
      if (result && result.success) {
        console.log(`✅ ${name}: 成功`);
        passedCount++;
      } else {
        console.log(`❌ ${name}: 失敗`);
        if (result && result.error) {
          console.log(`   エラー: ${result.error}`);
        }
      }
    });

    const successRate = (passedCount / totalCount) * 100;
    console.log(`\n📊 成功率: ${passedCount}/${totalCount} (${successRate.toFixed(1)}%)`);

    // 6. テストレポートの生成
    const reportPath = '.kiro/reports/dependency-resolution-test-report.json';
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        passed: passedCount,
        total: totalCount,
        successRate: successRate
      },
      results: testResults,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        cwd: process.cwd()
      }
    };

    await fs.mkdir('.kiro/reports', { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 テストレポートを保存: ${reportPath}`);

    // 7. 推奨事項の表示
    if (passedCount < totalCount) {
      console.log('\n💡 推奨事項:');
      
      if (!testResults.unit?.success) {
        console.log('- ユニットテストの失敗を確認し、コードの修正を検討してください');
      }
      
      if (!testResults.integration?.success) {
        console.log('- 統合テストの失敗を確認し、コンポーネント間の連携を見直してください');
      }
      
      if (!testResults.demo?.success) {
        console.log('- デモンストレーションの失敗を確認し、実行環境を見直してください');
      }
      
      if (!testResults.verification?.success) {
        console.log('- 検証スクリプトの失敗を確認し、機能の実装を見直してください');
      }
    }

    if (passedCount === totalCount) {
      console.log('\n🎉 すべてのテストが成功しました！');
      console.log('依存関係解決機能は正常に動作しています。');
      return true;
    } else {
      console.log('\n⚠️ 一部のテストが失敗しました。');
      console.log('詳細を確認して修正を行ってください。');
      return false;
    }

  } catch (error) {
    console.error('\n❌ テスト実行中に予期しないエラーが発生しました:', error);
    
    if (error instanceof Error) {
      console.error('エラー詳細:', error.message);
      if (error.stack) {
        console.error('スタックトレース:', error.stack);
      }
    }
    
    return false;
  }
}

/**
 * Jestテストの実行
 */
async function runJestTest(testFile) {
  return new Promise((resolve) => {
    const jest = spawn('npx', ['jest', testFile, '--verbose'], {
      stdio: 'pipe',
      cwd: process.cwd()
    });

    let output = '';
    let errorOutput = '';

    jest.stdout.on('data', (data) => {
      output += data.toString();
    });

    jest.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    jest.on('close', (code) => {
      resolve({
        success: code === 0,
        output: output + errorOutput,
        exitCode: code
      });
    });

    jest.on('error', (error) => {
      resolve({
        success: false,
        output: error.message,
        error: error.message
      });
    });
  });
}

/**
 * Node.jsスクリプトの実行
 */
async function runNodeScript(scriptPath) {
  return new Promise((resolve) => {
    const node = spawn('node', [scriptPath], {
      stdio: 'pipe',
      cwd: process.cwd()
    });

    let output = '';
    let errorOutput = '';

    node.stdout.on('data', (data) => {
      output += data.toString();
    });

    node.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    node.on('close', (code) => {
      resolve({
        success: code === 0,
        output: output + errorOutput,
        exitCode: code
      });
    });

    node.on('error', (error) => {
      resolve({
        success: false,
        output: error.message,
        error: error.message
      });
    });
  });
}

// メイン実行
if (import.meta.url === `file://${process.argv[1]}`) {
  testDependencyResolution().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ 予期しないエラー:', error);
    process.exit(1);
  });
}

export { testDependencyResolution };