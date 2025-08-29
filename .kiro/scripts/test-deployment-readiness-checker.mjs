#!/usr/bin/env node

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import { join } from 'path';

/**
 * デプロイメント準備チェッカーのテスト実行
 */
async function testDeploymentReadinessChecker() {
  console.log('🧪 Testing Deployment Readiness Checker');
  console.log('=======================================\n');

  const testResults = {
    unit: { passed: false, duration: 0, error: null },
    demo: { passed: false, duration: 0, error: null },
    verification: { passed: false, duration: 0, error: null },
    integration: { passed: false, duration: 0, error: null }
  };

  // 1. ユニットテストの実行
  console.log('1. Running unit tests...');
  try {
    const startTime = Date.now();
    await runCommand('npm', ['test', '.kiro/lib/trust-policy/__tests__/deployment-readiness-checker.test.ts']);
    testResults.unit.duration = Date.now() - startTime;
    testResults.unit.passed = true;
    console.log(`   ✅ Unit tests passed (${testResults.unit.duration}ms)\n`);
  } catch (error) {
    testResults.unit.error = error.message;
    console.log(`   ❌ Unit tests failed: ${error.message}\n`);
  }

  // 2. デモスクリプトの実行
  console.log('2. Running demo script...');
  try {
    const startTime = Date.now();
    await runCommand('node', ['.kiro/lib/trust-policy/demo-deployment-readiness-checker.mjs']);
    testResults.demo.duration = Date.now() - startTime;
    testResults.demo.passed = true;
    console.log(`   ✅ Demo script passed (${testResults.demo.duration}ms)\n`);
  } catch (error) {
    testResults.demo.error = error.message;
    console.log(`   ❌ Demo script failed: ${error.message}\n`);
  }

  // 3. 検証スクリプトの実行
  console.log('3. Running verification script...');
  try {
    const startTime = Date.now();
    await runCommand('node', ['.kiro/lib/trust-policy/verify-deployment-readiness-checker.mjs']);
    testResults.verification.duration = Date.now() - startTime;
    testResults.verification.passed = true;
    console.log(`   ✅ Verification script passed (${testResults.verification.duration}ms)\n`);
  } catch (error) {
    testResults.verification.error = error.message;
    console.log(`   ❌ Verification script failed: ${error.message}\n`);
  }

  // 4. 統合テストの実行
  console.log('4. Running integration tests...');
  try {
    const startTime = Date.now();
    await runIntegrationTest();
    testResults.integration.duration = Date.now() - startTime;
    testResults.integration.passed = true;
    console.log(`   ✅ Integration tests passed (${testResults.integration.duration}ms)\n`);
  } catch (error) {
    testResults.integration.error = error.message;
    console.log(`   ❌ Integration tests failed: ${error.message}\n`);
  }

  // 結果の集計
  const totalTests = Object.keys(testResults).length;
  const passedTests = Object.values(testResults).filter(result => result.passed).length;
  const totalDuration = Object.values(testResults).reduce((sum, result) => sum + result.duration, 0);

  console.log('📊 TEST RESULTS SUMMARY');
  console.log('=======================');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  console.log(`Total Duration: ${totalDuration}ms`);
  console.log();

  // 詳細結果
  console.log('📋 Detailed Results:');
  Object.entries(testResults).forEach(([testName, result]) => {
    const status = result.passed ? '✅' : '❌';
    console.log(`   ${status} ${testName}: ${result.duration}ms`);
    if (result.error) {
      console.log(`      Error: ${result.error}`);
    }
  });

  // 生成されたファイルの確認
  console.log('\n📁 Generated Files:');
  await checkGeneratedFiles();

  // 推奨事項
  console.log('\n💡 Recommendations:');
  if (passedTests === totalTests) {
    console.log('   🎉 All tests passed! Deployment Readiness Checker is ready for use.');
    console.log('   📋 Consider running periodic tests to ensure continued functionality.');
  } else {
    console.log('   ⚠️ Some tests failed. Please review and fix the issues before deployment.');
    console.log('   🔍 Check the error messages above for specific failure details.');
  }

  return passedTests === totalTests;
}

/**
 * コマンドの実行
 */
function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, { 
      stdio: 'pipe',
      shell: true 
    });

    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`Command failed with code ${code}: ${stderr || stdout}`));
      }
    });

    process.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * 統合テストの実行
 */
async function runIntegrationTest() {
  const { DeploymentReadinessChecker } = await import('../.kiro/lib/trust-policy/deployment-readiness-checker.js');
  
  // 実際のワークフローをシミュレート
  const checker = new DeploymentReadinessChecker();
  await checker.initialize();

  // 1. 準備状況チェック
  const readiness = await checker.checkDeploymentReadiness();
  if (!readiness || typeof readiness.ready !== 'boolean') {
    throw new Error('Invalid readiness check result');
  }

  // 2. 品質ゲートの確認
  if (!Array.isArray(readiness.qualityGates) || readiness.qualityGates.length === 0) {
    throw new Error('No quality gates evaluated');
  }

  // 3. デプロイ許可のテスト（準備ができている場合）
  if (readiness.ready) {
    const permission = await checker.grantDeploymentPermission(readiness);
    if (!permission.granted) {
      throw new Error('Permission should be granted for ready deployment');
    }
  }

  // 4. デプロイ後検証
  const verification = await checker.runPostDeploymentVerification();
  if (typeof verification.success !== 'boolean') {
    throw new Error('Invalid post-deployment verification result');
  }

  console.log('      Integration test workflow completed successfully');
}

/**
 * 生成されたファイルの確認
 */
async function checkGeneratedFiles() {
  try {
    const reportsDir = '.kiro/reports';
    const files = await fs.readdir(reportsDir);
    
    const deploymentFiles = files.filter(file => 
      file.startsWith('deployment-readiness-') || 
      file.startsWith('deployment-permission-')
    );

    if (deploymentFiles.length > 0) {
      deploymentFiles.forEach(file => {
        console.log(`   📄 ${file}`);
      });
    } else {
      console.log('   ⚠️ No deployment files found in reports directory');
    }

    // ファイルサイズの確認
    for (const file of deploymentFiles) {
      const filePath = join(reportsDir, file);
      const stats = await fs.stat(filePath);
      if (stats.size === 0) {
        console.log(`   ⚠️ Warning: ${file} is empty`);
      }
    }

  } catch (error) {
    console.log(`   ❌ Error checking generated files: ${error.message}`);
  }
}

/**
 * パフォーマンステスト
 */
async function runPerformanceTest() {
  console.log('\n⚡ Performance Test');
  console.log('==================');

  const { DeploymentReadinessChecker } = await import('../.kiro/lib/trust-policy/deployment-readiness-checker.js');
  
  const iterations = 5;
  const durations = [];

  for (let i = 0; i < iterations; i++) {
    const checker = new DeploymentReadinessChecker();
    await checker.initialize();

    const startTime = Date.now();
    await checker.checkDeploymentReadiness();
    const duration = Date.now() - startTime;
    
    durations.push(duration);
    console.log(`   Iteration ${i + 1}: ${duration}ms`);
  }

  const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
  const minDuration = Math.min(...durations);
  const maxDuration = Math.max(...durations);

  console.log(`   Average: ${avgDuration.toFixed(1)}ms`);
  console.log(`   Min: ${minDuration}ms`);
  console.log(`   Max: ${maxDuration}ms`);

  // パフォーマンス基準の確認
  const performanceThreshold = 5000; // 5秒
  if (avgDuration > performanceThreshold) {
    console.log(`   ⚠️ Warning: Average duration (${avgDuration.toFixed(1)}ms) exceeds threshold (${performanceThreshold}ms)`);
  } else {
    console.log(`   ✅ Performance within acceptable range`);
  }
}

// メイン実行
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const success = await testDeploymentReadinessChecker();
    
    // パフォーマンステストの実行
    await runPerformanceTest();
    
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  }
}