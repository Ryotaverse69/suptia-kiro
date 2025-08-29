#!/usr/bin/env node

// import { DeploymentReadinessChecker } from './deployment-readiness-checker.js';

/**
 * デプロイメント準備チェッカーのデモンストレーション
 */
async function demonstrateDeploymentReadinessChecker() {
  console.log('🚀 Deployment Readiness Checker Demo');
  console.log('=====================================\n');

  try {
    // チェッカーの初期化
    console.log('📋 Initializing Deployment Readiness Checker...');
    const checker = new DeploymentReadinessChecker();
    await checker.initialize();
    console.log('✅ Initialization completed\n');

    // デプロイメント準備状況のチェック
    console.log('🔍 Checking deployment readiness...');
    const startTime = Date.now();
    const readiness = await checker.checkDeploymentReadiness();
    const checkDuration = Date.now() - startTime;
    
    console.log(`✅ Readiness check completed in ${checkDuration}ms\n`);

    // 結果の表示
    console.log('📊 DEPLOYMENT READINESS RESULTS');
    console.log('================================');
    console.log(`Status: ${readiness.ready ? '✅ READY FOR DEPLOYMENT' : '🚫 NOT READY'}`);
    console.log(`Score: ${readiness.score}/100`);
    console.log(`Timestamp: ${readiness.timestamp.toISOString()}\n`);

    // 品質ゲートの結果
    console.log('🏁 Quality Gates:');
    readiness.qualityGates.forEach(gate => {
      const status = gate.status === 'pass' ? '✅' : gate.status === 'fail' ? '❌' : '⚠️';
      const blocking = gate.blocking ? ' (BLOCKING)' : '';
      console.log(`  ${status} ${gate.name}${blocking}`);
      
      gate.criteria.forEach(criteria => {
        const criteriaStatus = criteria.passed ? '✅' : '❌';
        console.log(`    ${criteriaStatus} ${criteria.metric}: ${criteria.actual} ${criteria.operator} ${criteria.threshold}`);
      });
    });
    console.log();

    // ブロッカーの表示
    if (readiness.blockers.length > 0) {
      console.log(`🚫 Deployment Blockers (${readiness.blockers.length}):`);
      readiness.blockers.forEach((blocker, index) => {
        console.log(`  ${index + 1}. ${blocker.description}`);
        console.log(`     Category: ${blocker.category}`);
        console.log(`     Auto-fixable: ${blocker.autoFixable ? 'Yes' : 'No'}`);
        console.log(`     Resolution: ${blocker.resolution}`);
      });
      console.log();
    }

    // 警告の表示
    if (readiness.warnings.length > 0) {
      console.log(`⚠️ Warnings (${readiness.warnings.length}):`);
      readiness.warnings.forEach((warning, index) => {
        console.log(`  ${index + 1}. ${warning.description}`);
        console.log(`     Category: ${warning.category}`);
        console.log(`     Recommendation: ${warning.recommendation}`);
      });
      console.log();
    }

    // 推奨事項の表示
    console.log('💡 Recommendations:');
    readiness.recommendations.forEach(rec => {
      console.log(`  ${rec}`);
    });
    console.log();

    // デプロイ許可のテスト
    if (readiness.ready) {
      console.log('🎫 Granting deployment permission...');
      try {
        const permission = await checker.grantDeploymentPermission(readiness);
        console.log('✅ Deployment permission granted!');
        console.log(`   Granted at: ${permission.grantedAt.toISOString()}`);
        console.log(`   Valid until: ${permission.validUntil.toISOString()}`);
        console.log(`   Approver: ${permission.approver}`);
        console.log('   Conditions:');
        permission.conditions.forEach(condition => {
          console.log(`     • ${condition}`);
        });
        console.log();
      } catch (error) {
        console.log(`❌ Failed to grant permission: ${error.message}\n`);
      }
    } else {
      console.log('🚫 Deployment permission denied due to blockers\n');
    }

    // デプロイ後検証のデモ
    console.log('🔍 Running post-deployment verification demo...');
    const verificationResult = await checker.runPostDeploymentVerification();
    
    if (verificationResult.success) {
      console.log('✅ Post-deployment verification passed');
    } else {
      console.log('❌ Post-deployment verification failed');
      console.log('   Issues detected:');
      verificationResult.issues.forEach(issue => {
        console.log(`     • ${issue}`);
      });
    }
    console.log();

    // パフォーマンス統計
    console.log('📈 Performance Statistics:');
    console.log(`   Readiness check duration: ${checkDuration}ms`);
    console.log(`   Quality gates evaluated: ${readiness.qualityGates.length}`);
    console.log(`   Total criteria checked: ${readiness.qualityGates.reduce((sum, gate) => sum + gate.criteria.length, 0)}`);
    console.log();

    // ファイル出力の確認
    console.log('📁 Generated Files:');
    const { promises: fs } = await import('fs');
    const reportsDir = '.kiro/reports';
    
    try {
      const files = await fs.readdir(reportsDir);
      const deploymentFiles = files.filter(file => 
        file.startsWith('deployment-readiness-') || file.startsWith('deployment-permission-')
      );
      
      deploymentFiles.forEach(file => {
        console.log(`   📄 ${file}`);
      });
      
      if (deploymentFiles.length === 0) {
        console.log('   (No deployment files found)');
      }
    } catch (error) {
      console.log(`   ❌ Error reading reports directory: ${error.message}`);
    }

    console.log('\n🎉 Deployment Readiness Checker demo completed successfully!');

  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

/**
 * 詳細なデプロイメント準備状況の分析
 */
async function analyzeDeploymentReadiness() {
  console.log('\n🔬 DETAILED DEPLOYMENT READINESS ANALYSIS');
  console.log('==========================================\n');

  try {
    const checker = new DeploymentReadinessChecker();
    await checker.initialize();

    const readiness = await checker.checkDeploymentReadiness();

    // 品質ゲート分析
    console.log('📊 Quality Gate Analysis:');
    const passedGates = readiness.qualityGates.filter(gate => gate.status === 'pass').length;
    const failedGates = readiness.qualityGates.filter(gate => gate.status === 'fail').length;
    const warningGates = readiness.qualityGates.filter(gate => gate.status === 'warning').length;
    const blockingGates = readiness.qualityGates.filter(gate => gate.blocking).length;

    console.log(`   Total gates: ${readiness.qualityGates.length}`);
    console.log(`   Passed: ${passedGates} ✅`);
    console.log(`   Failed: ${failedGates} ❌`);
    console.log(`   Warnings: ${warningGates} ⚠️`);
    console.log(`   Blocking gates: ${blockingGates}`);
    console.log();

    // リスク分析
    console.log('⚠️ Risk Analysis:');
    const criticalBlockers = readiness.blockers.filter(b => b.category === 'critical_test_failure').length;
    const performanceBlockers = readiness.blockers.filter(b => b.category === 'performance_threshold').length;
    const securityBlockers = readiness.blockers.filter(b => b.category === 'security_issue').length;
    const autoFixableBlockers = readiness.blockers.filter(b => b.autoFixable).length;

    console.log(`   Critical test failures: ${criticalBlockers}`);
    console.log(`   Performance issues: ${performanceBlockers}`);
    console.log(`   Security issues: ${securityBlockers}`);
    console.log(`   Auto-fixable issues: ${autoFixableBlockers}/${readiness.blockers.length}`);
    console.log();

    // 品質トレンド（シミュレート）
    console.log('📈 Quality Trends (Simulated):');
    const previousScore = Math.max(0, readiness.score - Math.random() * 20 + 10);
    const trend = readiness.score > previousScore ? '📈 Improving' : '📉 Declining';
    console.log(`   Current score: ${readiness.score}/100`);
    console.log(`   Previous score: ${previousScore.toFixed(1)}/100`);
    console.log(`   Trend: ${trend}`);
    console.log();

    // 推定修正時間
    console.log('⏱️ Estimated Fix Time:');
    const estimatedHours = readiness.blockers.reduce((total, blocker) => {
      const timeMap = {
        'critical_test_failure': 4,
        'performance_threshold': 6,
        'security_issue': 8,
        'dependency_issue': 2
      };
      return total + (timeMap[blocker.category] || 3);
    }, 0);

    if (estimatedHours > 0) {
      console.log(`   Estimated fix time: ${estimatedHours} hours`);
      console.log(`   Recommended deployment delay: ${Math.ceil(estimatedHours / 8)} business days`);
    } else {
      console.log('   No fixes required - ready for immediate deployment');
    }

  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
  }
}

// メイン実行
if (import.meta.url === `file://${process.argv[1]}`) {
  await demonstrateDeploymentReadinessChecker();
  await analyzeDeploymentReadiness();
}