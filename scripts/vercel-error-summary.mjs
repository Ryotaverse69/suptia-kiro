#!/usr/bin/env node

/**
 * Vercel エラーサマリー
 * 最新のエラー状況を簡潔に表示
 */

import { execSync } from 'child_process';

const COLORS = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

async function main() {
  log('🔍 Vercel エラーサマリー', 'cyan');
  log('', 'reset');

  try {
    // 1. 認証確認
    const whoami = execSync('vercel whoami', { encoding: 'utf8' }).trim();
    log(`✅ 認証済み: ${whoami}`, 'green');
    log('', 'reset');

    // 2. 最新のデプロイメント状況を確認
    log('🚀 最新デプロイメント状況:', 'blue');
    
    // 最新5件のデプロイメントを手動で確認
    const deploymentUrls = [
      'https://suptia-kiro-9f1adfqq7-ryotaverses-projects.vercel.app',
      'https://suptia-kiro-8q1guk2yh-ryotaverses-projects.vercel.app',
      'https://suptia-kiro-1z2d99exr-ryotaverses-projects.vercel.app',
      'https://suptia-kiro-llj3ps6yr-ryotaverses-projects.vercel.app',
      'https://suptia-kiro-1em82atyk-ryotaverses-projects.vercel.app'
    ];

    for (let i = 0; i < deploymentUrls.length; i++) {
      const url = deploymentUrls[i];
      log(`\n${i + 1}. ${url}`, 'cyan');
      
      try {
        const inspect = execSync(`vercel inspect ${url}`, { 
          encoding: 'utf8',
          stdio: 'pipe'
        });
        
        // ステータスを抽出
        const statusMatch = inspect.match(/status\s+●\s+(Error|Ready)/i);
        const status = statusMatch ? statusMatch[1] : 'Unknown';
        
        const statusColor = status === 'Ready' ? 'green' : 'red';
        const statusIcon = status === 'Ready' ? '✅' : '❌';
        
        log(`   ${statusIcon} ステータス: ${status}`, statusColor);
        
        // エラーの場合、ビルド情報を表示
        if (status === 'Error') {
          const buildMatch = inspect.match(/Builds\s*\n\s*╶\s*([^\n]+)/);
          if (buildMatch) {
            log(`   🔧 ビルド: ${buildMatch[1]}`, 'yellow');
          }
        }
        
      } catch (error) {
        log(`   ❌ 詳細取得失敗: ${error.message}`, 'red');
      }
    }

    // 3. 推奨アクション
    log('\n💡 推奨アクション:', 'yellow');
    log('   1. 最新のエラーデプロイメントを詳細確認:', 'reset');
    log('      vercel inspect https://suptia-kiro-9f1adfqq7-ryotaverses-projects.vercel.app', 'cyan');
    log('   2. ローカルビルドテスト:', 'reset');
    log('      cd apps/web && npm run build', 'cyan');
    log('   3. 環境変数確認:', 'reset');
    log('      vercel env ls', 'cyan');

  } catch (error) {
    log(`❌ エラー: ${error.message}`, 'red');
  }

  log('\n🎯 サマリー完了', 'green');
}

main().catch(console.error);