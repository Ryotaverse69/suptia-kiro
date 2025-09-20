#!/usr/bin/env node

/**
 * 環境変数検証スクリプト
 * 本番デプロイ前に必要な環境変数が設定されているかチェック
 */

import { readFileSync } from 'fs';
import { join } from 'path';

// 必須環境変数の定義
const REQUIRED_ENV_VARS = {
  // Sanity Configuration
  NEXT_PUBLIC_SANITY_PROJECT_ID: {
    description: 'Sanity プロジェクト ID',
    example: 'your-project-id',
    public: true,
  },
  NEXT_PUBLIC_SANITY_DATASET: {
    description: 'Sanity データセット名',
    example: 'production',
    public: true,
  },
  NEXT_PUBLIC_SANITY_API_VERSION: {
    description: 'Sanity API バージョン',
    example: '2023-05-03',
    public: true,
  },
  SANITY_API_TOKEN: {
    description: 'Sanity API トークン（書き込み権限）',
    example: 'sk...',
    public: false,
    sensitive: true,
  },
  
  // Site Configuration
  NEXT_PUBLIC_SITE_URL: {
    description: 'サイトのベース URL',
    example: 'https://suptia.com',
    public: true,
  },
  NEXT_PUBLIC_SITE_NAME: {
    description: 'サイト名',
    example: 'サプティア',
    public: true,
  },
};

// オプション環境変数の定義
const OPTIONAL_ENV_VARS = {
  // Analytics
  NEXT_PUBLIC_GA_ID: {
    description: 'Google Analytics ID',
    example: 'G-XXXXXXXXXX',
    public: true,
  },
  NEXT_PUBLIC_VERCEL_ANALYTICS_ID: {
    description: 'Vercel Analytics ID',
    example: 'your-analytics-id',
    public: true,
  },
  
  // ISR Configuration
  PRODUCT_REVALIDATE_TIME: {
    description: '商品ページの再検証時間（秒）',
    example: '3600',
    public: false,
    default: '3600',
  },
  LISTING_REVALIDATE_TIME: {
    description: '一覧ページの再検証時間（秒）',
    example: '600',
    public: false,
    default: '600',
  },
  
  // Webhook
  SANITY_WEBHOOK_SECRET: {
    description: 'Sanity Webhook シークレット',
    example: 'your-webhook-secret',
    public: false,
    sensitive: true,
  },
  
  // External APIs
  EXCHANGE_RATE_API_KEY: {
    description: '為替レート API キー',
    example: 'your-api-key',
    public: false,
    sensitive: true,
  },
  
  // Monitoring
  SENTRY_DSN: {
    description: 'Sentry DSN',
    example: 'https://...@sentry.io/...',
    public: false,
    sensitive: true,
  },
};

// 色付きログ用のユーティリティ
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

function colorLog(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 環境変数の検証
function validateEnvVar(name, config, value) {
  const issues = [];
  
  if (!value) {
    issues.push('未設定');
    return issues;
  }
  
  // 長さチェック
  if (config.sensitive && value.length < 10) {
    issues.push('値が短すぎる可能性があります');
  }
  
  // URL形式チェック
  if (name.includes('URL') && !value.match(/^https?:\/\//)) {
    issues.push('有効なURLではありません');
  }
  
  // プロジェクトIDチェック
  if (name === 'NEXT_PUBLIC_SANITY_PROJECT_ID' && value === 'your-project-id') {
    issues.push('デフォルト値のままです');
  }
  
  // APIトークンチェック
  if (name === 'SANITY_API_TOKEN' && !value.startsWith('sk')) {
    issues.push('Sanity APIトークンの形式が正しくありません');
  }
  
  return issues;
}

// .env.local の読み込み
function loadEnvFile() {
  try {
    const envPath = join(process.cwd(), '.env.local');
    const envContent = readFileSync(envPath, 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^#][^=]+)=(.*)$/);
      if (match) {
        const [, key, value] = match;
        envVars[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
      }
    });
    
    return envVars;
  } catch (error) {
    colorLog('yellow', '⚠️  .env.local ファイルが見つかりません');
    return {};
  }
}

// メイン検証関数
function verifyEnvironmentVariables() {
  colorLog('cyan', '🔍 環境変数の検証を開始します...\n');
  
  const envVars = { ...process.env, ...loadEnvFile() };
  let hasErrors = false;
  let hasWarnings = false;
  
  // 必須環境変数のチェック
  colorLog('blue', '📋 必須環境変数のチェック:');
  console.log('');
  
  for (const [name, config] of Object.entries(REQUIRED_ENV_VARS)) {
    const value = envVars[name];
    const issues = validateEnvVar(name, config, value);
    
    if (!value) {
      colorLog('red', `❌ ${name}`);
      console.log(`   説明: ${config.description}`);
      console.log(`   例: ${config.example}`);
      console.log(`   公開: ${config.public ? 'はい' : 'いいえ'}`);
      hasErrors = true;
    } else if (issues.length > 0) {
      colorLog('yellow', `⚠️  ${name}`);
      console.log(`   値: ${config.sensitive ? '[HIDDEN]' : value}`);
      issues.forEach(issue => console.log(`   問題: ${issue}`));
      hasWarnings = true;
    } else {
      colorLog('green', `✅ ${name}`);
      console.log(`   値: ${config.sensitive ? '[HIDDEN]' : value}`);
    }
    console.log('');
  }
  
  // オプション環境変数のチェック
  colorLog('blue', '📋 オプション環境変数のチェック:');
  console.log('');
  
  for (const [name, config] of Object.entries(OPTIONAL_ENV_VARS)) {
    const value = envVars[name];
    const issues = validateEnvVar(name, config, value);
    
    if (!value) {
      if (config.default) {
        colorLog('cyan', `ℹ️  ${name} (デフォルト値を使用)`);
        console.log(`   デフォルト: ${config.default}`);
      } else {
        colorLog('yellow', `⚠️  ${name} (未設定)`);
        console.log(`   説明: ${config.description}`);
        console.log(`   例: ${config.example}`);
      }
    } else if (issues.length > 0) {
      colorLog('yellow', `⚠️  ${name}`);
      console.log(`   値: ${config.sensitive ? '[HIDDEN]' : value}`);
      issues.forEach(issue => console.log(`   問題: ${issue}`));
      hasWarnings = true;
    } else {
      colorLog('green', `✅ ${name}`);
      console.log(`   値: ${config.sensitive ? '[HIDDEN]' : value}`);
    }
    console.log('');
  }
  
  // 結果サマリー
  console.log('='.repeat(60));
  
  if (hasErrors) {
    colorLog('red', '❌ 検証失敗: 必須環境変数が不足しています');
    console.log('');
    colorLog('white', '対処方法:');
    console.log('1. .env.local ファイルを作成');
    console.log('2. .env.local.example を参考に環境変数を設定');
    console.log('3. Vercel ダッシュボードで本番環境変数を設定');
    console.log('');
    process.exit(1);
  } else if (hasWarnings) {
    colorLog('yellow', '⚠️  検証完了: 警告があります');
    console.log('');
    colorLog('white', '推奨事項:');
    console.log('- 警告項目を確認して適切な値を設定してください');
    console.log('- 本番環境では全ての環境変数を適切に設定してください');
    console.log('');
  } else {
    colorLog('green', '✅ 検証成功: 全ての環境変数が適切に設定されています');
    console.log('');
  }
  
  // 次のステップ
  colorLog('cyan', '📝 次のステップ:');
  console.log('1. npm run build でビルドテスト');
  console.log('2. npm run test でテスト実行');
  console.log('3. npm run lighthouse:ci でパフォーマンステスト');
  console.log('4. Vercel にデプロイ');
  console.log('');
}

// Sanity 接続テスト
async function testSanityConnection() {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION;
  
  if (!projectId || !dataset || !apiVersion) {
    colorLog('yellow', '⚠️  Sanity 設定が不完全なため接続テストをスキップします');
    return;
  }
  
  try {
    colorLog('cyan', '🔗 Sanity 接続テストを実行中...');
    
    const url = `https://${projectId}.api.sanity.io/${apiVersion}/data/query/${dataset}?query=*[_type=="product"][0]`;
    const response = await fetch(url);
    
    if (response.ok) {
      colorLog('green', '✅ Sanity 接続テスト成功');
    } else {
      colorLog('red', `❌ Sanity 接続テスト失敗: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    colorLog('red', `❌ Sanity 接続テスト失敗: ${error.message}`);
  }
}

// メイン実行
async function main() {
  verifyEnvironmentVariables();
  await testSanityConnection();
}

main().catch(error => {
  colorLog('red', `❌ エラーが発生しました: ${error.message}`);
  process.exit(1);
});