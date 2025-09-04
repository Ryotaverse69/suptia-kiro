#!/usr/bin/env node

/**
 * Vercel 簡易エラー診断スクリプト
 * 最新のデプロイメント状況を素早く確認
 */

import { execSync } from 'child_process';

const COLORS = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function executeCommand(command) {
  try {
    const result = execSync(command, { 
      encoding: 'utf8', 
      stdio: 'pipe',
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer
    });
    return { success: true, output: result.trim() };
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      stderr: error.stderr?.toString() || ''
    };
  }
}

function parseDeployments(output) {
  const lines = output.split('\n');
  const deployments = [];
  
  for (const line of lines) {
    // テーブル形式の行をパース
    if (line.includes('https://suptia-kiro-') && (line.includes('● Error') || line.includes('● Ready'))) {
      // 正規表現で各フィールドを抽出
      const match = line.match(/(\S+)\s+(https:\/\/[^\s]+)\s+●\s+(Error|Ready)/);
      if (match) {
        const [, age, url, status] = match;
        deployments.push({ 
          url: url.trim(), 
          status: status.toUpperCase(), 
          age: age.trim() 
        });
      }
    }
  }
  
  return deployments;
}

async function main() {
  log('🔍 Vercel 簡易診断開始', 'cyan');
  log('', 'reset');

  // 1. 認証確認
  const whoami = executeCommand('vercel whoami');
  if (!whoami.success) {
    log('❌ 認証エラー: vercel login を実行してください', 'red');
    return;
  }
  log(`✅ 認証済み: ${whoami.output}`, 'green');
  log('', 'reset');

  // 2. デプロイメント一覧取得
  log('🚀 デプロイメント状況確認', 'blue');
  const deployments = executeCommand('vercel list');
  
  if (!deployments.success) {
    log(`❌ デプロイメント取得失敗: ${deployments.error}`, 'red');
    return;
  }

  // デバッグ: 実際の出力を確認
  log('🔧 デバッグ: 実際の出力', 'yellow');
  console.log(deployments.output);
  log('', 'reset');
  
  const deploymentList = parseDeployments(deployments.output);
  
  if (deploymentList.length === 0) {
    log('❌ デプロイメントが見つかりませんでした', 'red');
    log('🔧 パース対象の行を確認:', 'yellow');
    const lines = deployments.output.split('\n');
    lines.forEach((line, index) => {
      if (line.includes('https://')) {
        log(`   ${index}: ${line}`, 'cyan');
      }
    });
    return;
  }

  // 3. 状況サマリー
  const errorCount = deploymentList.filter(d => d.status === 'ERROR').length;
  const readyCount = deploymentList.filter(d => d.status === 'READY').length;
  
  log(`📊 デプロイメント状況サマリー:`, 'blue');
  log(`   ✅ 成功: ${readyCount}件`, 'green');
  log(`   ❌ エラー: ${errorCount}件`, 'red');
  log('', 'reset');

  // 4. 最新10件の詳細
  log('📋 最新デプロイメント (10件):', 'blue');
  deploymentList.slice(0, 10).forEach((deployment, index) => {
    const statusColor = deployment.status === 'READY' ? 'green' : 'red';
    const statusIcon = deployment.status === 'READY' ? '✅' : '❌';
    
    log(`${index + 1}. ${statusIcon} ${deployment.status}`, statusColor);
    log(`   URL: ${deployment.url}`, 'cyan');
    log(`   経過時間: ${deployment.age}`, 'reset');
    log('', 'reset');
  });

  // 5. エラーデプロイメントの詳細確認
  const errorDeployments = deploymentList.filter(d => d.status === 'ERROR').slice(0, 3);
  
  if (errorDeployments.length > 0) {
    log('🚨 エラーデプロイメントの詳細確認:', 'red');
    
    for (const deployment of errorDeployments) {
      log(`\n📋 ${deployment.url}`, 'cyan');
      
      const inspect = executeCommand(`vercel inspect ${deployment.url}`);
      if (inspect.success) {
        // ビルド情報を抽出
        const lines = inspect.output.split('\n');
        const buildSection = lines.find(line => line.includes('Builds'));
        if (buildSection) {
          log('   ビルド情報:', 'yellow');
          const buildIndex = lines.indexOf(buildSection);
          for (let i = buildIndex + 1; i < Math.min(buildIndex + 5, lines.length); i++) {
            if (lines[i].trim()) {
              log(`   ${lines[i]}`, 'reset');
            }
          }
        }
      } else {
        log(`   詳細取得失敗: ${inspect.error}`, 'red');
      }
    }
  }

  // 6. 推奨アクション
  log('\n💡 推奨アクション:', 'yellow');
  
  if (errorCount > 0) {
    log('   1. 最新のエラーデプロイメントの詳細を確認:', 'reset');
    log(`      vercel inspect ${errorDeployments[0]?.url}`, 'cyan');
    log('   2. ローカルでビルドテスト:', 'reset');
    log('      npm run build', 'cyan');
    log('   3. 環境変数の確認:', 'reset');
    log('      vercel env ls', 'cyan');
  } else {
    log('   ✅ 全てのデプロイメントが正常です', 'green');
  }

  log('\n🎯 診断完了', 'green');
}

main().catch(console.error);