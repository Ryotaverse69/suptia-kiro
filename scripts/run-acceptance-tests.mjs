#!/usr/bin/env node

/**
 * 受け入れテスト実行ヘルパー
 * 環境準備から実行まで一括で行う
 */

import { execSync } from 'child_process';
import fs from 'fs';
import { runAcceptanceTest } from './acceptance-test.mjs';

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

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
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

function execCommand(command, options = {}) {
  try {
    const result = execSync(command, { 
      encoding: 'utf8', 
      stdio: 'inherit',
      ...options 
    });
    return result;
  } catch (error) {
    throw new Error(`Command failed: ${command}\n${error.message}`);
  }
}

async function prepareEnvironment() {
  log(`${colors.bold}環境準備中...${colors.reset}`, colors.blue);

  // 1. 依存関係のインストール確認
  logInfo('依存関係を確認中...');
  if (!fs.existsSync('node_modules')) {
    logInfo('依存関係をインストール中...');
    execCommand('npm install');
    logSuccess('依存関係のインストールが完了しました');
  } else {
    logSuccess('依存関係は既にインストール済みです');
  }

  // 2. 基本的なファイル構造確認
  logInfo('プロジェクト構造を確認中...');
  const requiredFiles = [
    'package.json',
    'apps/web/package.json',
    '.github/workflows/ci.yml',
    'vercel.json'
  ];

  const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
  if (missingFiles.length > 0) {
    logError(`必須ファイルが不足しています: ${missingFiles.join(', ')}`);
    throw new Error('プロジェクト構造が不完全です');
  }
  logSuccess('プロジェクト構造の確認が完了しました');

  // 3. Git リポジトリ状態確認
  logInfo('Git リポジトリ状態を確認中...');
  try {
    const gitStatus = execSync('git status --porcelain', { encoding: 'utf8', stdio: 'pipe' });
    if (gitStatus.trim()) {
      logWarning('未コミットの変更があります。テスト結果に影響する可能性があります。');
    } else {
      logSuccess('Git リポジトリは clean 状態です');
    }
  } catch (error) {
    logWarning('Git リポジトリの状態確認に失敗しました');
  }

  // 4. 環境変数確認
  logInfo('環境設定を確認中...');
  const envExample = 'apps/web/.env.local.example';
  const envLocal = 'apps/web/.env.local';
  
  if (fs.existsSync(envExample) && !fs.existsSync(envLocal)) {
    logWarning('.env.local が見つかりません。.env.local.example をコピーして設定してください。');
  }

  logSuccess('環境準備が完了しました\n');
}

async function main() {
  log(`${colors.bold}Suptia Git Workflow 受け入れテスト実行${colors.reset}`, colors.blue);
  log(`開始時刻: ${new Date().toLocaleString('ja-JP')}\n`);

  try {
    // 環境準備
    await prepareEnvironment();

    // 受け入れテスト実行
    log(`${colors.bold}受け入れテスト実行中...${colors.reset}`, colors.blue);
    await runAcceptanceTest();

  } catch (error) {
    logError(`\n受け入れテスト実行に失敗しました: ${error.message}`);
    
    // トラブルシューティング情報を表示
    log(`\n${colors.bold}トラブルシューティング:${colors.reset}`, colors.yellow);
    log('1. 依存関係を再インストール: npm install');
    log('2. 環境変数を設定: cp apps/web/.env.local.example apps/web/.env.local');
    log('3. Git リポジトリの状態確認: git status');
    log('4. 詳細なエラーログ: npm run test -- --reporter=verbose');
    
    process.exit(1);
  }
}

// スクリプト実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}