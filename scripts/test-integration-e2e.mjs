#!/usr/bin/env node

/**
 * 統合テストとエンドツーエンドテストスイート
 * dev → Preview環境デプロイとPR → master → 本番デプロイの完全フローをテストする
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 */

import { execSync } from 'child_process';
import fs from 'fs';
// 動的インポートを使用して、環境変数がない場合でも基本テストを実行
let testPreviewWorkflowForIntegration, testProductionDeployment;

try {
  const previewModule = await import('./test-preview-workflow.mjs');
  testPreviewWorkflowForIntegration = previewModule.testPreviewWorkflowForIntegration;
} catch (error) {
  console.log('⚠️  Preview workflow test module not available');
}

try {
  const productionModule = await import('./test-production-deployment.mjs');
  testProductionDeployment = productionModule.main;
} catch (error) {
  console.log('⚠️  Production deployment test module not available');
}

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * テスト結果を記録する構造体
 */
class TestResults {
  constructor() {
    this.tests = [];
    this.startTime = Date.now();
  }

  addTest(name, status, details = null, error = null) {
    this.tests.push({
      name,
      status, // 'pass', 'fail', 'skip'
      details,
      error,
      timestamp: Date.now()
    });
  }

  getPassCount() {
    return this.tests.filter(t => t.status === 'pass').length;
  }

  getFailCount() {
    return this.tests.filter(t => t.status === 'fail').length;
  }

  getSkipCount() {
    return this.tests.filter(t => t.status === 'skip').length;
  }

  getDuration() {
    return Date.now() - this.startTime;
  }

  generateReport() {
    const duration = Math.round(this.getDuration() / 1000);
    const total = this.tests.length;
    const passed = this.getPassCount();
    const failed = this.getFailCount();
    const skipped = this.getSkipCount();

    return {
      summary: {
        total,
        passed,
        failed,
        skipped,
        duration,
        success: failed === 0
      },
      tests: this.tests
    };
  }
}

/**
 * 前提条件の確認
 */
async function checkPrerequisites(results) {
  log(colors.blue, '🔍 Checking prerequisites...');

  // Git リポジトリの確認
  try {
    execSync('git rev-parse --git-dir', { stdio: 'ignore' });
    results.addTest('Git repository', 'pass', 'Valid git repository');
  } catch (error) {
    results.addTest('Git repository', 'fail', null, 'Not a git repository');
    return false;
  }

  // 必要なブランチの存在確認
  try {
    const branches = execSync('git branch -r', { encoding: 'utf8' });
    const hasMaster = branches.includes('origin/master') || branches.includes('origin/main');
    const hasDev = branches.includes('origin/dev');

    if (hasMaster && hasDev) {
      results.addTest('Required branches', 'pass', 'master and dev branches exist');
    } else {
      results.addTest('Required branches', 'fail', null, `Missing branches: ${!hasMaster ? 'master/main ' : ''}${!hasDev ? 'dev' : ''}`);
      return false;
    }
  } catch (error) {
    results.addTest('Required branches', 'fail', null, 'Failed to check branches');
    return false;
  }

  // GitHub Actions ワークフローの確認
  if (fs.existsSync('.github/workflows/ci.yml')) {
    results.addTest('GitHub Actions workflow', 'pass', 'CI workflow exists');
  } else {
    results.addTest('GitHub Actions workflow', 'fail', null, 'CI workflow missing');
    return false;
  }

  // Vercel 設定の確認
  if (fs.existsSync('vercel.json')) {
    results.addTest('Vercel configuration', 'pass', 'vercel.json exists');
  } else {
    results.addTest('Vercel configuration', 'fail', null, 'vercel.json missing');
    return false;
  }

  // 必要なスクリプトの確認
  const requiredScripts = [
    'scripts/get-preview-url.mjs',
    'scripts/verify-preview-env.mjs',
    'scripts/monitor-production-deployment.mjs',
    'scripts/notify-deployment.mjs'
  ];

  let allScriptsExist = true;
  for (const script of requiredScripts) {
    if (fs.existsSync(script)) {
      results.addTest(`Script: ${script}`, 'pass', 'Script exists');
    } else {
      results.addTest(`Script: ${script}`, 'fail', null, 'Script missing');
      allScriptsExist = false;
    }
  }

  return allScriptsExist;
}

/**
 * dev → Preview環境デプロイフローのテスト
 * Requirements: 2.1, 2.2
 */
async function testDevToPreviewFlow(results) {
  log(colors.cyan, '🧪 Testing dev → Preview deployment flow...');

  try {
    // Preview ワークフローテストを実行
    if (testPreviewWorkflowForIntegration) {
      await testPreviewWorkflowForIntegration();
      results.addTest('Preview workflow configuration', 'pass', 'All preview workflow checks passed');
    } else {
      results.addTest('Preview workflow configuration', 'skip', 'Preview workflow test not available');
    }

    // dev ブランチの状態確認
    const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    if (currentBranch === 'dev') {
      results.addTest('Current branch check', 'pass', 'Currently on dev branch');
      
      // 実際のPreview URLの取得テスト（環境変数がある場合のみ）
      if (process.env.VERCEL_TOKEN) {
        try {
          const previewUrl = execSync('node scripts/get-preview-url.mjs', { 
            encoding: 'utf8',
            timeout: 30000 
          }).trim();
          
          if (previewUrl && previewUrl.includes('vercel.app')) {
            results.addTest('Preview URL generation', 'pass', `Generated URL: ${previewUrl}`);
          } else {
            results.addTest('Preview URL generation', 'fail', null, 'Invalid preview URL format');
          }
        } catch (error) {
          results.addTest('Preview URL generation', 'fail', null, `Failed to get preview URL: ${error.message}`);
        }
      } else {
        results.addTest('Preview URL generation', 'skip', 'VERCEL_TOKEN not available');
      }
    } else {
      results.addTest('Current branch check', 'skip', `Currently on ${currentBranch}, not dev`);
    }

    // Vercel Preview 環境の検証
    try {
      execSync('node scripts/verify-preview-env.mjs', { 
        stdio: 'ignore',
        timeout: 30000 
      });
      results.addTest('Preview environment verification', 'pass', 'Preview environment is properly configured');
    } catch (error) {
      results.addTest('Preview environment verification', 'fail', null, `Preview verification failed: ${error.message}`);
    }

  } catch (error) {
    results.addTest('Preview workflow test', 'fail', null, `Preview workflow test failed: ${error.message}`);
  }
}

/**
 * PR → master → 本番デプロイフローのテスト
 * Requirements: 2.3, 2.4, 2.5, 2.6
 */
async function testPRToProductionFlow(results) {
  log(colors.cyan, '🧪 Testing PR → master → production deployment flow...');

  try {
    // Production デプロイメントテストを実行
    if (testProductionDeployment) {
      await testProductionDeployment();
      results.addTest('Production deployment test', 'pass', 'Production deployment test completed');
    } else {
      results.addTest('Production deployment test', 'skip', 'Production deployment test not available');
    }

    // GitHub Actions CI/CD パイプラインの設定確認
    const ciContent = fs.readFileSync('.github/workflows/ci.yml', 'utf8');
    
    // 必須チェックの確認
    const requiredChecks = [
      { name: 'format:check', pattern: /format.*check|prettier.*check/ },
      { name: 'lint', pattern: /lint/ },
      { name: 'test', pattern: /test/ },
      { name: 'typecheck', pattern: /typecheck|type.*check/ },
      { name: 'build', pattern: /build/ },
      { name: 'headers', pattern: /headers/ },
      { name: 'jsonld', pattern: /jsonld/ }
    ];

    let allChecksConfigured = true;
    for (const check of requiredChecks) {
      if (check.pattern.test(ciContent)) {
        results.addTest(`CI check: ${check.name}`, 'pass', 'Check is configured in CI');
      } else {
        results.addTest(`CI check: ${check.name}`, 'fail', null, 'Check missing from CI');
        allChecksConfigured = false;
      }
    }

    // PR Definition of Done チェックの確認
    if (ciContent.includes('pr-dod-check') || ciContent.includes('check-dod')) {
      results.addTest('PR DoD check', 'pass', 'PR Definition of Done check is configured');
    } else {
      results.addTest('PR DoD check', 'fail', null, 'PR DoD check missing from CI');
      allChecksConfigured = false;
    }

    // 自動マージ設定の確認
    if (ciContent.includes('auto-merge') || ciContent.includes('merge')) {
      results.addTest('Auto-merge configuration', 'pass', 'Auto-merge is configured');
    } else {
      results.addTest('Auto-merge configuration', 'skip', 'Auto-merge configuration not detected');
    }

    // 本番デプロイ設定の確認
    if (ciContent.includes('production') && ciContent.includes('deploy')) {
      results.addTest('Production deployment trigger', 'pass', 'Production deployment is configured');
    } else {
      results.addTest('Production deployment trigger', 'fail', null, 'Production deployment trigger missing');
      allChecksConfigured = false;
    }

  } catch (error) {
    results.addTest('Production flow test', 'fail', null, `Production flow test failed: ${error.message}`);
  }
}

/**
 * エンドツーエンドフローの統合テスト
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 */
async function testEndToEndFlow(results) {
  log(colors.cyan, '🧪 Testing end-to-end integration flow...');

  try {
    // 完全なワークフローの検証
    const workflowSteps = [
      {
        name: 'Developer commits to dev branch',
        check: () => {
          // dev ブランチへのコミット権限確認
          const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
          return currentBranch === 'dev' || execSync('git branch', { encoding: 'utf8' }).includes('dev');
        }
      },
      {
        name: 'Automatic Preview deployment',
        check: () => {
          // Vercel設定でdev ブランチのデプロイが有効か確認
          const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
          return vercelConfig.git?.deploymentEnabled?.dev !== false;
        }
      },
      {
        name: 'PR creation from dev to master',
        check: () => {
          // GitHub Actions でPRトリガーが設定されているか確認
          const ciContent = fs.readFileSync('.github/workflows/ci.yml', 'utf8');
          return ciContent.includes('pull_request') && ciContent.includes('master');
        }
      },
      {
        name: 'CI/CD quality checks execution',
        check: () => {
          // 必須チェックが全て設定されているか確認
          const ciContent = fs.readFileSync('.github/workflows/ci.yml', 'utf8');
          const requiredChecks = ['format', 'lint', 'test', 'typecheck', 'build', 'headers', 'jsonld'];
          return requiredChecks.every(check => ciContent.includes(check));
        }
      },
      {
        name: 'Automatic merge on success',
        check: () => {
          // 自動マージの設定確認（GitHub設定またはCI設定）
          const ciContent = fs.readFileSync('.github/workflows/ci.yml', 'utf8');
          return ciContent.includes('merge') || ciContent.includes('auto-merge');
        }
      },
      {
        name: 'Production deployment on master merge',
        check: () => {
          // master ブランチでの本番デプロイ設定確認
          const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
          const ciContent = fs.readFileSync('.github/workflows/ci.yml', 'utf8');
          return (vercelConfig.git?.deploymentEnabled?.master !== false) || 
                 ciContent.includes('production');
        }
      }
    ];

    for (const step of workflowSteps) {
      try {
        const passed = step.check();
        if (passed) {
          results.addTest(`E2E Step: ${step.name}`, 'pass', 'Step is properly configured');
        } else {
          results.addTest(`E2E Step: ${step.name}`, 'fail', null, 'Step configuration missing or incomplete');
        }
      } catch (error) {
        results.addTest(`E2E Step: ${step.name}`, 'fail', null, `Step check failed: ${error.message}`);
      }
    }

    // ワークフロー全体の整合性チェック
    const allStepsPassed = results.tests
      .filter(t => t.name.startsWith('E2E Step:'))
      .every(t => t.status === 'pass');

    if (allStepsPassed) {
      results.addTest('End-to-end workflow integrity', 'pass', 'All workflow steps are properly configured');
    } else {
      results.addTest('End-to-end workflow integrity', 'fail', null, 'Some workflow steps are missing or misconfigured');
    }

  } catch (error) {
    results.addTest('End-to-end flow test', 'fail', null, `E2E flow test failed: ${error.message}`);
  }
}

/**
 * テスト結果のレポート生成
 */
function generateTestReport(results) {
  const report = results.generateReport();
  
  log(colors.blue, '\n📊 Test Results Summary');
  log(colors.blue, '========================');
  log(colors.blue, `Total tests: ${report.summary.total}`);
  log(colors.green, `Passed: ${report.summary.passed}`);
  log(colors.red, `Failed: ${report.summary.failed}`);
  log(colors.yellow, `Skipped: ${report.summary.skipped}`);
  log(colors.blue, `Duration: ${report.summary.duration}s`);
  
  if (report.summary.success) {
    log(colors.green, '\n🎉 All tests passed!');
  } else {
    log(colors.red, '\n❌ Some tests failed');
  }

  // 詳細結果
  log(colors.blue, '\n📋 Detailed Results:');
  for (const test of report.tests) {
    const statusEmoji = test.status === 'pass' ? '✅' : test.status === 'fail' ? '❌' : '⏭️';
    const statusColor = test.status === 'pass' ? colors.green : test.status === 'fail' ? colors.red : colors.yellow;
    
    log(statusColor, `${statusEmoji} ${test.name}`);
    if (test.details) {
      log(colors.blue, `   ${test.details}`);
    }
    if (test.error) {
      log(colors.red, `   Error: ${test.error}`);
    }
  }

  // レポートファイルの保存
  const reportData = {
    timestamp: new Date().toISOString(),
    ...report
  };

  fs.writeFileSync('test-results-integration-e2e.json', JSON.stringify(reportData, null, 2));
  log(colors.blue, '\n📄 Detailed report saved to: test-results-integration-e2e.json');

  return report.summary.success;
}

/**
 * メイン処理
 */
async function main() {
  log(colors.magenta, '🧪 Integration & End-to-End Test Suite');
  log(colors.magenta, '=====================================');
  log(colors.blue, 'Testing Suptia Git Workflow Implementation');
  log(colors.blue, 'Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6\n');

  const results = new TestResults();

  try {
    // 前提条件の確認
    const prerequisitesPassed = await checkPrerequisites(results);
    if (!prerequisitesPassed) {
      log(colors.red, '❌ Prerequisites check failed. Cannot continue with integration tests.');
      generateTestReport(results);
      process.exit(1);
    }

    // dev → Preview環境デプロイフローのテスト
    await testDevToPreviewFlow(results);

    // PR → master → 本番デプロイフローのテスト
    await testPRToProductionFlow(results);

    // エンドツーエンドフローの統合テスト
    await testEndToEndFlow(results);

    // 結果レポートの生成
    const success = generateTestReport(results);

    if (success) {
      log(colors.green, '\n🎉 Integration and E2E tests completed successfully!');
      log(colors.green, '✅ The Suptia Git workflow is properly implemented and tested.');
      process.exit(0);
    } else {
      log(colors.red, '\n❌ Some integration tests failed.');
      log(colors.red, '   Please review the detailed results above and fix the issues.');
      process.exit(1);
    }

  } catch (error) {
    log(colors.red, `❌ Test suite failed with error: ${error.message}`);
    results.addTest('Test suite execution', 'fail', null, error.message);
    generateTestReport(results);
    process.exit(1);
  }
}

// スクリプトが直接実行された場合
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    log(colors.red, `❌ Unexpected error: ${error.message}`);
    process.exit(1);
  });
}

export { main as runIntegrationE2ETests };