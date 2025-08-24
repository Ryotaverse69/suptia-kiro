#!/usr/bin/env node

/**
 * Vercel Preview ワークフローテストスクリプト
 * 実装した仕組みが正しく動作するかテストする
 */

import { execSync } from 'child_process';
import fs from 'fs';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

function logHeader(message) {
  log(`\n${colors.bold}=== ${message} ===${colors.reset}`, colors.blue);
}

// テスト結果を格納
const testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  details: []
};

/**
 * テスト実行関数
 */
async function runTest(testName, testFunction) {
  try {
    logInfo(`実行中: ${testName}`);
    const result = await testFunction();
    if (result.success) {
      logSuccess(`${testName}: 成功`);
      testResults.passed++;
      testResults.details.push({ name: testName, status: 'PASSED', message: result.message });
    } else if (result.warning) {
      logWarning(`${testName}: 警告 - ${result.message}`);
      testResults.warnings++;
      testResults.details.push({ name: testName, status: 'WARNING', message: result.message });
    } else {
      logError(`${testName}: 失敗 - ${result.message}`);
      testResults.failed++;
      testResults.details.push({ name: testName, status: 'FAILED', message: result.message });
    }
  } catch (error) {
    logError(`${testName}: エラー - ${error.message}`);
    testResults.failed++;
    testResults.details.push({ name: testName, status: 'ERROR', message: error.message });
  }
}

/**
 * ファイル存在チェック
 */
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

/**
 * 1. 必要なファイルの存在確認
 */
async function testRequiredFiles() {
  const requiredFiles = [
    'vercel.json',
    '.vercelignore',
    '.github/workflows/vercel-preview.yml',
    'scripts/ensure-vercel-preview.mjs',
    'scripts/diagnose-vercel-preview.mjs',
    'scripts/get-preview-url.mjs'
  ];

  const missingFiles = requiredFiles.filter(file => !fileExists(file));
  
  if (missingFiles.length === 0) {
    return { success: true, message: '全ての必要ファイルが存在します' };
  } else {
    return { success: false, message: `不足ファイル: ${missingFiles.join(', ')}` };
  }
}

/**
 * 2. vercel.json設定確認
 */
async function testVercelConfig() {
  if (!fileExists('vercel.json')) {
    return { success: false, message: 'vercel.json が見つかりません' };
  }

  try {
    const config = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
    
    // 必須設定の確認
    const issues = [];
    
    if (!config.git || !config.git.deploymentEnabled || !config.git.deploymentEnabled.dev) {
      issues.push('dev ブランチのデプロイが無効');
    }
    
    if (!config.github || config.github.silent === true) {
      issues.push('GitHub通知が無効');
    }
    
    if (!config.buildCommand) {
      issues.push('buildCommand が設定されていない');
    }
    
    if (!config.outputDirectory) {
      issues.push('outputDirectory が設定されていない');
    }

    if (issues.length === 0) {
      return { success: true, message: 'vercel.json の設定が正しいです' };
    } else {
      return { success: false, message: `設定問題: ${issues.join(', ')}` };
    }
  } catch (error) {
    return { success: false, message: `vercel.json 解析エラー: ${error.message}` };
  }
}

/**
 * 3. GitHub Actions ワークフロー確認
 */
async function testGitHubWorkflow() {
  const workflowFile = '.github/workflows/vercel-preview.yml';
  
  if (!fileExists(workflowFile)) {
    return { success: false, message: 'Vercel Preview ワークフローが見つかりません' };
  }

  try {
    const content = fs.readFileSync(workflowFile, 'utf8');
    
    const checks = [
      { pattern: /on:\s*\n\s*push:\s*\n\s*branches:\s*\[.*dev.*\]/, name: 'dev ブランチプッシュトリガー' },
      { pattern: /pull_request:/, name: 'PR トリガー' },
      { pattern: /VERCEL_TOKEN:\s*\$\{\{\s*secrets\.VERCEL_TOKEN\s*\}\}/, name: 'VERCEL_TOKEN シークレット' },
      { pattern: /VERCEL_PROJECT_ID:\s*\$\{\{\s*secrets\.VERCEL_PROJECT_ID\s*\}\}/, name: 'VERCEL_PROJECT_ID シークレット' },
      { pattern: /node scripts\/ensure-vercel-preview\.mjs/, name: 'Preview確実取得スクリプト実行' },
      { pattern: /gh pr comment/, name: 'PRコメント機能' }
    ];

    const missingChecks = checks.filter(check => !check.pattern.test(content));
    
    if (missingChecks.length === 0) {
      return { success: true, message: 'GitHub Actions ワークフローが正しく設定されています' };
    } else {
      return { success: false, message: `不足設定: ${missingChecks.map(c => c.name).join(', ')}` };
    }
  } catch (error) {
    return { success: false, message: `ワークフロー解析エラー: ${error.message}` };
  }
}

/**
 * 4. スクリプトの構文確認
 */
async function testScriptSyntax() {
  const scripts = [
    'scripts/ensure-vercel-preview.mjs',
    'scripts/diagnose-vercel-preview.mjs',
    'scripts/get-preview-url.mjs'
  ];

  const issues = [];

  for (const script of scripts) {
    try {
      // Node.js構文チェック
      execSync(`node --check ${script}`, { stdio: 'pipe' });
    } catch (error) {
      issues.push(`${script}: 構文エラー`);
    }
  }

  if (issues.length === 0) {
    return { success: true, message: '全スクリプトの構文が正しいです' };
  } else {
    return { success: false, message: issues.join(', ') };
  }
}

/**
 * 5. package.json スクリプト確認
 */
async function testPackageScripts() {
  if (!fileExists('package.json')) {
    return { success: false, message: 'package.json が見つかりません' };
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    const requiredScripts = [
      'preview:ensure',
      'preview:diagnose',
      'preview:get'
    ];

    const missingScripts = requiredScripts.filter(script => !packageJson.scripts[script]);
    
    if (missingScripts.length === 0) {
      return { success: true, message: 'Preview関連スクリプトが正しく設定されています' };
    } else {
      return { success: false, message: `不足スクリプト: ${missingScripts.join(', ')}` };
    }
  } catch (error) {
    return { success: false, message: `package.json 解析エラー: ${error.message}` };
  }
}

/**
 * 6. Git設定確認
 */
async function testGitSetup() {
  try {
    // 現在のブランチ確認
    const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    
    // dev ブランチの存在確認
    const branches = execSync('git branch -a', { encoding: 'utf8' });
    const hasDevBranch = branches.includes('dev');
    
    // リモートリポジトリ確認
    const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
    const isGitHub = remoteUrl.includes('github.com');

    const issues = [];
    
    if (!hasDevBranch) {
      issues.push('dev ブランチが存在しない');
    }
    
    if (!isGitHub) {
      issues.push('GitHub リポジトリではない');
    }

    if (issues.length === 0) {
      return { success: true, message: `Git設定OK (現在: ${currentBranch}, リモート: GitHub)` };
    } else {
      return { success: false, message: issues.join(', ') };
    }
  } catch (error) {
    return { success: false, message: `Git設定エラー: ${error.message}` };
  }
}

/**
 * 7. 環境変数設定確認（ローカル）
 */
async function testEnvironmentSetup() {
  const warnings = [];
  
  if (!process.env.VERCEL_TOKEN) {
    warnings.push('VERCEL_TOKEN が設定されていません（GitHub Secretsで設定が必要）');
  }
  
  if (!process.env.VERCEL_PROJECT_ID) {
    warnings.push('VERCEL_PROJECT_ID が設定されていません（GitHub Secretsで設定が必要）');
  }

  if (warnings.length === 0) {
    return { success: true, message: '環境変数が設定されています' };
  } else {
    return { warning: true, message: warnings.join(', ') };
  }
}

/**
 * メイン処理
 */
async function main() {
  log(`${colors.bold}Vercel Preview ワークフローテスト開始${colors.reset}`, colors.blue);
  log(`実行時刻: ${new Date().toLocaleString('ja-JP')}\n`);

  // 各テスト実行
  await runTest('1. 必要ファイル存在確認', testRequiredFiles);
  await runTest('2. vercel.json設定確認', testVercelConfig);
  await runTest('3. GitHub Actions ワークフロー確認', testGitHubWorkflow);
  await runTest('4. スクリプト構文確認', testScriptSyntax);
  await runTest('5. package.json スクリプト確認', testPackageScripts);
  await runTest('6. Git設定確認', testGitSetup);
  await runTest('7. 環境変数設定確認', testEnvironmentSetup);

  // 結果サマリー
  logHeader('テスト結果サマリー');
  log(`✅ 成功: ${testResults.passed}`, colors.green);
  log(`❌ 失敗: ${testResults.failed}`, colors.red);
  log(`⚠️  警告: ${testResults.warnings}`, colors.yellow);
  log(`📊 合計: ${testResults.passed + testResults.failed + testResults.warnings}`);

  if (testResults.failed > 0) {
    logHeader('失敗したテスト');
    testResults.details
      .filter(detail => detail.status === 'FAILED' || detail.status === 'ERROR')
      .forEach(detail => {
        logError(`${detail.name}: ${detail.message}`);
      });
  }

  if (testResults.warnings > 0) {
    logHeader('警告');
    testResults.details
      .filter(detail => detail.status === 'WARNING')
      .forEach(detail => {
        logWarning(`${detail.name}: ${detail.message}`);
      });
  }

  // 結果をファイルに保存
  const reportPath = 'vercel-preview-workflow-test.json';
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      passed: testResults.passed,
      failed: testResults.failed,
      warnings: testResults.warnings,
      total: testResults.passed + testResults.failed + testResults.warnings
    },
    details: testResults.details
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  logInfo(`テストレポートを保存しました: ${reportPath}`);

  // 次のステップ案内
  logHeader('次のステップ');
  if (testResults.failed === 0) {
    logSuccess('✅ 全てのテストが成功しました！');
    logInfo('次の手順でPreview機能をテストできます：');
    log('1. GitHub Secrets に VERCEL_TOKEN と VERCEL_PROJECT_ID を設定');
    log('2. dev ブランチにプッシュしてワークフローを実行');
    log('3. PRを作成してPreview URLが自動コメントされることを確認');
  } else {
    logError('❌ 修正が必要な問題があります');
    logInfo('上記の失敗項目を修正してから再度テストしてください');
  }

  // 終了コード設定
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// スクリプト実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { main as testVercelPreviewWorkflow };