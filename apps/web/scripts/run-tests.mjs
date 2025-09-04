#!/usr/bin/env node

/**
 * テスト実行スクリプト
 * 単体テスト、統合テスト、E2Eテストを順次実行
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function runCommand(command, description) {
  log(`\n${colors.blue}🚀 ${description}${colors.reset}`);
  log(`${colors.cyan}実行中: ${command}${colors.reset}`);
  
  try {
    const startTime = Date.now();
    execSync(command, { stdio: 'inherit', cwd: process.cwd() });
    const duration = Date.now() - startTime;
    log(`${colors.green}✅ ${description} 完了 (${duration}ms)${colors.reset}`);
    return true;
  } catch (error) {
    log(`${colors.red}❌ ${description} 失敗${colors.reset}`);
    log(`${colors.red}エラー: ${error.message}${colors.reset}`);
    return false;
  }
}

async function main() {
  log(`${colors.bright}${colors.magenta}🧪 サプティア テストスイート実行${colors.reset}`);
  log(`${colors.cyan}開始時刻: ${new Date().toLocaleString('ja-JP')}${colors.reset}`);

  const testResults = {
    unit: false,
    integration: false,
    e2e: false,
    accessibility: false,
  };

  // 1. 単体テスト実行
  log(`\n${colors.yellow}📋 Phase 1: 単体テスト${colors.reset}`);
  testResults.unit = runCommand('pnpm test:unit', '単体テスト');

  // 2. 統合テスト実行
  log(`\n${colors.yellow}📋 Phase 2: 統合テスト${colors.reset}`);
  testResults.integration = runCommand('pnpm test:integration', '統合テスト');

  // 3. E2Eテスト実行（開発サーバーが起動している場合のみ）
  log(`\n${colors.yellow}📋 Phase 3: E2Eテスト${colors.reset}`);
  
  // 開発サーバーの起動確認
  try {
    const response = await fetch('http://localhost:3000');
    if (response.ok) {
      testResults.e2e = runCommand('pnpm test:e2e', 'E2Eテスト');
    } else {
      log(`${colors.yellow}⚠️  開発サーバーが起動していないため、E2Eテストをスキップします${colors.reset}`);
      log(`${colors.cyan}E2Eテストを実行するには、別のターミナルで 'pnpm dev' を実行してください${colors.reset}`);
    }
  } catch (error) {
    log(`${colors.yellow}⚠️  開発サーバーが起動していないため、E2Eテストをスキップします${colors.reset}`);
    log(`${colors.cyan}E2Eテストを実行するには、別のターミナルで 'pnpm dev' を実行してください${colors.reset}`);
  }

  // 4. アクセシビリティテスト実行
  log(`\n${colors.yellow}📋 Phase 4: アクセシビリティテスト${colors.reset}`);
  if (testResults.e2e !== false) {
    testResults.accessibility = runCommand('pnpm test:accessibility', 'アクセシビリティテスト');
  } else {
    log(`${colors.yellow}⚠️  E2Eテストがスキップされたため、アクセシビリティテストもスキップします${colors.reset}`);
  }

  // 結果サマリー
  log(`\n${colors.bright}${colors.magenta}📊 テスト結果サマリー${colors.reset}`);
  log(`${colors.cyan}完了時刻: ${new Date().toLocaleString('ja-JP')}${colors.reset}`);
  
  const results = [
    { name: '単体テスト', result: testResults.unit },
    { name: '統合テスト', result: testResults.integration },
    { name: 'E2Eテスト', result: testResults.e2e },
    { name: 'アクセシビリティテスト', result: testResults.accessibility },
  ];

  results.forEach(({ name, result }) => {
    if (result === true) {
      log(`${colors.green}✅ ${name}: 成功${colors.reset}`);
    } else if (result === false) {
      log(`${colors.red}❌ ${name}: 失敗${colors.reset}`);
    } else {
      log(`${colors.yellow}⏭️  ${name}: スキップ${colors.reset}`);
    }
  });

  // 全体の成功/失敗判定
  const failedTests = results.filter(r => r.result === false);
  const skippedTests = results.filter(r => r.result === null);

  if (failedTests.length === 0) {
    log(`\n${colors.green}${colors.bright}🎉 すべてのテストが成功しました！${colors.reset}`);
    if (skippedTests.length > 0) {
      log(`${colors.yellow}📝 ${skippedTests.length}個のテストがスキップされました${colors.reset}`);
    }
    process.exit(0);
  } else {
    log(`\n${colors.red}${colors.bright}💥 ${failedTests.length}個のテストが失敗しました${colors.reset}`);
    failedTests.forEach(({ name }) => {
      log(`${colors.red}  - ${name}${colors.reset}`);
    });
    process.exit(1);
  }
}

// エラーハンドリング
process.on('unhandledRejection', (error) => {
  log(`${colors.red}未処理のエラー: ${error.message}${colors.reset}`);
  process.exit(1);
});

process.on('SIGINT', () => {
  log(`\n${colors.yellow}テスト実行が中断されました${colors.reset}`);
  process.exit(1);
});

main().catch((error) => {
  log(`${colors.red}スクリプト実行エラー: ${error.message}${colors.reset}`);
  process.exit(1);
});