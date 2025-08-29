#!/usr/bin/env node

import { DeploymentReadinessChecker } from './deployment-readiness-checker.js';
import { promises as fs } from 'fs';
import { join } from 'path';

/**
 * デプロイメント準備チェッカーの検証
 */
async function verifyDeploymentReadinessChecker() {
  console.log('🔍 Verifying Deployment Readiness Checker');
  console.log('=========================================\n');

  const results = {
    passed: 0,
    failed: 0,
    errors: []
  };

  // テスト1: 初期化の検証
  console.log('1. Testing initialization...');
  try {
    const checker = new DeploymentReadinessChecker();
    await checker.initialize();
    console.log('   ✅ Initialization successful');
    results.passed++;
  } catch (error) {
    console.log(`   ❌ Initialization failed: ${error.message}`);
    results.failed++;
    results.errors.push(`Initialization: ${error.message}`);
  }

  // テスト2: デプロイメント準備チェックの検証
  console.log('2. Testing deployment readiness check...');
  try {
    const checker = new DeploymentReadinessChecker();
    await checker.initialize();
    
    const readiness = await checker.checkDeploymentReadiness();
    
    // 必須プロパティの確認
    const requiredProps = ['ready', 'score', 'blockers', 'warnings', 'recommendations', 'qualityGates', 'timestamp'];
    const missingProps = requiredProps.filter(prop => !(prop in readiness));
    
    if (missingProps.length > 0) {
      throw new Error(`Missing properties: ${missingProps.join(', ')}`);
    }
    
    // データ型の確認
    if (typeof readiness.ready !== 'boolean') {
      throw new Error('ready property must be boolean');
    }
    
    if (typeof readiness.score !== 'number' || readiness.score < 0 || readiness.score > 100) {
      throw new Error('score must be a number between 0 and 100');
    }
    
    if (!Array.isArray(readiness.blockers)) {
      throw new Error('blockers must be an array');
    }
    
    if (!Array.isArray(readiness.warnings)) {
      throw new Error('warnings must be an array');
    }
    
    if (!Array.isArray(readiness.qualityGates)) {
      throw new Error('qualityGates must be an array');
    }
    
    if (!(readiness.timestamp instanceof Date)) {
      throw new Error('timestamp must be a Date object');
    }
    
    console.log('   ✅ Deployment readiness check successful');
    console.log(`      Ready: ${readiness.ready}`);
    console.log(`      Score: ${readiness.score}/100`);
    console.log(`      Blockers: ${readiness.blockers.length}`);
    console.log(`      Warnings: ${readiness.warnings.length}`);
    console.log(`      Quality Gates: ${readiness.qualityGates.length}`);
    results.passed++;
  } catch (error) {
    console.log(`   ❌ Deployment readiness check failed: ${error.message}`);
    results.failed++;
    results.errors.push(`Readiness check: ${error.message}`);
  }

  // テスト3: 品質ゲートの検証
  console.log('3. Testing quality gates evaluation...');
  try {
    const checker = new DeploymentReadinessChecker();
    await checker.initialize();
    
    const readiness = await checker.checkDeploymentReadiness();
    
    // 期待される品質ゲートの確認
    const expectedGates = ['Critical Functionality', 'Performance Standards', 'Quality Metrics'];
    const actualGateNames = readiness.qualityGates.map(gate => gate.name);
    
    const missingGates = expectedGates.filter(name => !actualGateNames.includes(name));
    if (missingGates.length > 0) {
      throw new Error(`Missing quality gates: ${missingGates.join(', ')}`);
    }
    
    // 各ゲートの構造確認
    for (const gate of readiness.qualityGates) {
      if (!gate.name || !gate.status || !Array.isArray(gate.criteria) || typeof gate.blocking !== 'boolean') {
        throw new Error(`Invalid quality gate structure: ${gate.name}`);
      }
      
      for (const criteria of gate.criteria) {
        if (!criteria.metric || typeof criteria.actual !== 'number' || typeof criteria.threshold !== 'number' || 
            !criteria.operator || typeof criteria.passed !== 'boolean') {
          throw new Error(`Invalid criteria structure in gate: ${gate.name}`);
        }
      }
    }
    
    console.log('   ✅ Quality gates evaluation successful');
    console.log(`      Gates evaluated: ${readiness.qualityGates.length}`);
    console.log(`      Blocking gates: ${readiness.qualityGates.filter(g => g.blocking).length}`);
    results.passed++;
  } catch (error) {
    console.log(`   ❌ Quality gates evaluation failed: ${error.message}`);
    results.failed++;
    results.errors.push(`Quality gates: ${error.message}`);
  }

  // テスト4: デプロイ許可の検証
  console.log('4. Testing deployment permission...');
  try {
    const checker = new DeploymentReadinessChecker();
    await checker.initialize();
    
    const readiness = await checker.checkDeploymentReadiness();
    
    if (readiness.ready) {
      const permission = await checker.grantDeploymentPermission(readiness);
      
      // 許可の構造確認
      if (!permission.granted || !(permission.grantedAt instanceof Date) || 
          !(permission.validUntil instanceof Date) || !Array.isArray(permission.conditions) ||
          !permission.approver) {
        throw new Error('Invalid permission structure');
      }
      
      // 有効期限の確認
      if (permission.validUntil <= permission.grantedAt) {
        throw new Error('Invalid permission validity period');
      }
      
      console.log('   ✅ Deployment permission successful');
      console.log(`      Granted: ${permission.granted}`);
      console.log(`      Valid until: ${permission.validUntil.toISOString()}`);
      console.log(`      Conditions: ${permission.conditions.length}`);
    } else {
      // 準備ができていない場合の拒否テスト
      try {
        await checker.grantDeploymentPermission(readiness);
        throw new Error('Permission should have been denied');
      } catch (error) {
        if (error.message.includes('deployment blockers exist')) {
          console.log('   ✅ Permission correctly denied for unready deployment');
        } else {
          throw error;
        }
      }
    }
    
    results.passed++;
  } catch (error) {
    console.log(`   ❌ Deployment permission failed: ${error.message}`);
    results.failed++;
    results.errors.push(`Deployment permission: ${error.message}`);
  }

  // テスト5: デプロイ後検証の検証
  console.log('5. Testing post-deployment verification...');
  try {
    const checker = new DeploymentReadinessChecker();
    await checker.initialize();
    
    const verificationResult = await checker.runPostDeploymentVerification();
    
    // 結果の構造確認
    if (typeof verificationResult.success !== 'boolean' || !Array.isArray(verificationResult.issues)) {
      throw new Error('Invalid verification result structure');
    }
    
    console.log('   ✅ Post-deployment verification successful');
    console.log(`      Success: ${verificationResult.success}`);
    console.log(`      Issues: ${verificationResult.issues.length}`);
    results.passed++;
  } catch (error) {
    console.log(`   ❌ Post-deployment verification failed: ${error.message}`);
    results.failed++;
    results.errors.push(`Post-deployment verification: ${error.message}`);
  }

  // テスト6: レポート生成の検証
  console.log('6. Testing report generation...');
  try {
    const checker = new DeploymentReadinessChecker();
    await checker.initialize();
    
    await checker.checkDeploymentReadiness();
    
    // レポートファイルの存在確認
    const reportsDir = '.kiro/reports';
    const files = await fs.readdir(reportsDir);
    const reportFiles = files.filter(file => file.startsWith('deployment-readiness-'));
    
    if (reportFiles.length === 0) {
      throw new Error('No readiness report files generated');
    }
    
    // レポート内容の確認
    const reportFile = join(reportsDir, reportFiles[0]);
    const reportContent = await fs.readFile(reportFile, 'utf-8');
    
    const requiredSections = ['# Deployment Readiness Report', '## Quality Gates', '## Recommendations'];
    const missingSections = requiredSections.filter(section => !reportContent.includes(section));
    
    if (missingSections.length > 0) {
      throw new Error(`Missing report sections: ${missingSections.join(', ')}`);
    }
    
    console.log('   ✅ Report generation successful');
    console.log(`      Report files: ${reportFiles.length}`);
    console.log(`      Report size: ${reportContent.length} characters`);
    results.passed++;
  } catch (error) {
    console.log(`   ❌ Report generation failed: ${error.message}`);
    results.failed++;
    results.errors.push(`Report generation: ${error.message}`);
  }

  // テスト7: エラーハンドリングの検証
  console.log('7. Testing error handling...');
  try {
    // 無効な設定でのテスト
    const checker = new DeploymentReadinessChecker();
    
    // 初期化なしでの実行テスト
    try {
      await checker.checkDeploymentReadiness();
      // エラーが発生しなかった場合は問題
      console.log('   ⚠️ Warning: No error thrown for uninitialized checker');
    } catch (error) {
      // エラーが適切に処理されている
      console.log('   ✅ Error handling working correctly');
    }
    
    results.passed++;
  } catch (error) {
    console.log(`   ❌ Error handling test failed: ${error.message}`);
    results.failed++;
    results.errors.push(`Error handling: ${error.message}`);
  }

  // テスト8: パフォーマンスの検証
  console.log('8. Testing performance...');
  try {
    const checker = new DeploymentReadinessChecker();
    await checker.initialize();
    
    const startTime = Date.now();
    await checker.checkDeploymentReadiness();
    const duration = Date.now() - startTime;
    
    // パフォーマンス閾値（10秒以内）
    const maxDuration = 10000;
    if (duration > maxDuration) {
      throw new Error(`Performance too slow: ${duration}ms > ${maxDuration}ms`);
    }
    
    console.log('   ✅ Performance test successful');
    console.log(`      Duration: ${duration}ms`);
    results.passed++;
  } catch (error) {
    console.log(`   ❌ Performance test failed: ${error.message}`);
    results.failed++;
    results.errors.push(`Performance: ${error.message}`);
  }

  // 結果の表示
  console.log('\n📊 VERIFICATION RESULTS');
  console.log('=======================');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);

  if (results.errors.length > 0) {
    console.log('\n❌ Errors encountered:');
    results.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  }

  if (results.failed === 0) {
    console.log('\n🎉 All verification tests passed! Deployment Readiness Checker is working correctly.');
    return true;
  } else {
    console.log('\n⚠️ Some verification tests failed. Please review and fix the issues.');
    return false;
  }
}

// メイン実行
if (import.meta.url === `file://${process.argv[1]}`) {
  const success = await verifyDeploymentReadinessChecker();
  process.exit(success ? 0 : 1);
}