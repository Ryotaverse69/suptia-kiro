#!/usr/bin/env node

/**
 * Vercel デプロイエラー取得スクリプト
 * 最新のデプロイメントエラーを詳細に分析
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const COLORS = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function executeCommand(command, options = {}) {
  try {
    const result = execSync(command, { 
      encoding: 'utf8', 
      stdio: 'pipe',
      ...options 
    });
    return { success: true, output: result.trim() };
  } catch (error) {
    return { 
      success: false, 
      error: error.message, 
      output: error.stdout?.toString() || '',
      stderr: error.stderr?.toString() || ''
    };
  }
}

function parseDeploymentInfo(output) {
  try {
    const lines = output.split('\n');
    const deployments = [];
    
    for (const line of lines) {
      if (line.trim() && !line.includes('Age') && !line.includes('---')) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 4) {
          deployments.push({
            url: parts[0],
            state: parts[1],
            age: parts[2],
            source: parts.slice(3).join(' ')
          });
        }
      }
    }
    
    return deployments;
  } catch (error) {
    return [];
  }
}

async function main() {
  log('🔍 Vercel デプロイエラー診断開始', 'cyan');
  log('', 'reset');

  // 1. 認証状態確認
  log('👤 認証状態の確認', 'blue');
  const whoami = executeCommand('vercel whoami');
  if (whoami.success) {
    log(`✅ 認証済み: ${whoami.output}`, 'green');
  } else {
    log(`❌ 認証エラー: ${whoami.error}`, 'red');
    log('💡 解決方法: vercel login を実行してください', 'yellow');
    return;
  }
  log('', 'reset');

  // 2. プロジェクト一覧取得
  log('📋 プロジェクト一覧の取得', 'blue');
  const projects = executeCommand('vercel projects list');
  if (projects.success) {
    log('✅ プロジェクト一覧取得成功', 'green');
    log(projects.output.split('\n').slice(0, 10).join('\n'), 'reset');
  } else {
    log(`❌ プロジェクト一覧取得失敗: ${projects.error}`, 'red');
  }
  log('', 'reset');

  // 3. 最新デプロイメント一覧
  log('🚀 最新デプロイメント一覧', 'blue');
  const deployments = executeCommand('vercel list');
  if (deployments.success) {
    log('✅ デプロイメント一覧取得成功', 'green');
    const deploymentList = parseDeploymentInfo(deployments.output);
    
    deploymentList.slice(0, 10).forEach((deployment, index) => {
      const statusColor = deployment.state === 'READY' ? 'green' : 
                         deployment.state === 'ERROR' ? 'red' : 
                         deployment.state === 'BUILDING' ? 'yellow' : 'reset';
      
      log(`${index + 1}. ${deployment.url}`, 'cyan');
      log(`   状態: ${deployment.state}`, statusColor);
      log(`   経過時間: ${deployment.age}`, 'reset');
      log(`   ソース: ${deployment.source}`, 'reset');
      log('', 'reset');
    });
    
    // エラー状態のデプロイメントを特定
    const errorDeployments = deploymentList.filter(d => d.state === 'ERROR' || d.state === 'CANCELED');
    if (errorDeployments.length > 0) {
      log('🚨 エラー状態のデプロイメントが見つかりました:', 'red');
      errorDeployments.forEach(deployment => {
        log(`   - ${deployment.url} (${deployment.state})`, 'red');
      });
      
      // 最初のエラーデプロイメントの詳細ログを取得
      if (errorDeployments[0]) {
        log('📋 エラーデプロイメントの詳細ログ:', 'blue');
        const errorLogs = executeCommand(`vercel logs ${errorDeployments[0].url}`);
        if (errorLogs.success) {
          log(errorLogs.output, 'red');
        }
      }
    }
  } else {
    log(`❌ デプロイメント一覧取得失敗: ${deployments.error}`, 'red');
  }
  log('', 'reset');

  // 4. 最新デプロイメントのログ取得
  log('📄 最新デプロイメントのログ取得', 'blue');
  
  // まず最新のデプロイメントURLを取得
  const latestDeployment = executeCommand('vercel list');
  if (latestDeployment.success) {
    const deploymentList = parseDeploymentInfo(latestDeployment.output);
    if (deploymentList.length > 0) {
      const latestUrl = deploymentList[0].url;
      log(`📋 最新デプロイメント: ${latestUrl}`, 'cyan');
      
      const deploymentLogs = executeCommand(`vercel logs ${latestUrl}`);
      if (deploymentLogs.success) {
        log('✅ ログ取得成功', 'green');
        const logLines = deploymentLogs.output.split('\n');
        
        // エラーログをフィルタリング
        const errorLogs = logLines.filter(line => 
          line.toLowerCase().includes('error') || 
          line.toLowerCase().includes('failed') ||
          line.toLowerCase().includes('exception') ||
          line.includes('❌') ||
          line.includes('✗')
        );
        
        if (errorLogs.length > 0) {
          log('🚨 エラーログが見つかりました:', 'red');
          errorLogs.slice(0, 10).forEach(errorLog => {
            log(`   ${errorLog}`, 'red');
          });
        } else {
          log('✅ エラーログは見つかりませんでした', 'green');
        }
        
        // 最新ログの一部を表示
        log('📋 最新ログ (最新10行):', 'blue');
        logLines.slice(-10).forEach(line => {
          if (line.trim()) {
            log(`   ${line}`, 'reset');
          }
        });
      } else {
        log(`❌ ログ取得失敗: ${deploymentLogs.error}`, 'red');
      }
    } else {
      log('❌ デプロイメントが見つかりませんでした', 'red');
    }
  } else {
    log(`❌ デプロイメント一覧取得失敗: ${latestDeployment.error}`, 'red');
  }
  log('', 'reset');

  // 5. プロジェクト情報の詳細確認
  log('🔧 プロジェクト詳細情報の確認', 'blue');
  const projectInfo = executeCommand('vercel project ls');
  if (projectInfo.success) {
    log('✅ プロジェクト情報取得成功', 'green');
    log(projectInfo.output, 'reset');
  } else {
    log(`❌ プロジェクト情報取得失敗: ${projectInfo.error}`, 'red');
  }
  log('', 'reset');

  // 6. レポート生成
  const reportDir = '.kiro/reports';
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  const reportPath = path.join(reportDir, 'vercel-error-report.md');
  const timestamp = new Date().toISOString();
  
  const report = `# Vercel エラー診断レポート

生成日時: ${timestamp}

## 認証状態
${whoami.success ? `✅ 認証済み: ${whoami.output}` : `❌ 認証エラー: ${whoami.error}`}

## デプロイメント状況
\`\`\`
${deployments.success ? deployments.output : deployments.error}
\`\`\`

## 最新ログ
\`\`\`
${deploymentLogs ? (deploymentLogs.success ? deploymentLogs.output : deploymentLogs.error) : 'ログ取得なし'}
\`\`\`

## プロジェクト情報
\`\`\`
${projectInfo.success ? projectInfo.output : 'プロジェクト情報取得なし'}
\`\`\`

## 推奨アクション

1. エラー状態のデプロイメントがある場合は、該当URLのログを詳細確認
2. ビルドエラーがある場合は、依存関係やコード修正を検討
3. 認証エラーがある場合は、\`vercel login\` を実行
4. チームアクセスエラーがある場合は、\`vercel teams switch\` を実行
`;
  
  fs.writeFileSync(reportPath, report);
  log(`📄 詳細レポートを生成しました: ${reportPath}`, 'green');
  
  log('', 'reset');
  log('🎯 診断完了', 'green');
}

main().catch(console.error);