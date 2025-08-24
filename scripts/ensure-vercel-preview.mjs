#!/usr/bin/env node

/**
 * Vercel Preview確実取得スクリプト
 * devプッシュで確実にPreview URLを取得し、必要に応じてデプロイメントをトリガーする
 */

import { execSync } from 'child_process';
import fs from 'fs';

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID || 'prj_NWkcnXBay0NvP9FEZUuXAICo0514';
const GITHUB_SHA = process.env.GITHUB_SHA;
const GITHUB_REF_NAME = process.env.GITHUB_REF_NAME;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

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

if (!VERCEL_TOKEN) {
  logError('VERCEL_TOKEN environment variable is required');
  process.exit(1);
}

if (!GITHUB_SHA) {
  logError('GITHUB_SHA environment variable is required');
  process.exit(1);
}

/**
 * Vercel APIからデプロイメント情報を取得
 */
async function getDeploymentByCommit(sha, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(
        `https://api.vercel.com/v6/deployments?projectId=${VERCEL_PROJECT_ID}&gitSource.sha=${sha}&limit=10`,
        {
          headers: {
            'Authorization': `Bearer ${VERCEL_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Vercel API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const deployment = data.deployments?.[0];
      
      if (deployment) {
        logSuccess(`デプロイメントを発見: ${deployment.uid} (状態: ${deployment.readyState})`);
        return deployment;
      }
      
      if (i < retries - 1) {
        logInfo(`デプロイメントが見つかりません。${5}秒後に再試行... (${i + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    } catch (error) {
      logError(`デプロイメント取得エラー (試行 ${i + 1}/${retries}): ${error.message}`);
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }
  
  return null;
}

/**
 * 新しいデプロイメントをトリガー
 */
async function triggerDeployment() {
  try {
    logInfo('新しいデプロイメントをトリガーしています...');
    
    const response = await fetch(`https://api.vercel.com/v13/deployments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'suptia-kiro',
        project: VERCEL_PROJECT_ID,
        gitSource: {
          type: 'github',
          repo: 'Ryotaverse69/suptia-kiro',
          ref: GITHUB_REF_NAME || 'dev',
          sha: GITHUB_SHA
        },
        target: 'preview'
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Deployment trigger failed: ${response.status} ${errorData}`);
    }

    const deployment = await response.json();
    logSuccess(`新しいデプロイメントをトリガーしました: ${deployment.uid}`);
    return deployment;
  } catch (error) {
    logError(`デプロイメントトリガーエラー: ${error.message}`);
    return null;
  }
}

/**
 * デプロイメントの完了を待機
 */
async function waitForDeployment(deploymentId, maxWaitTime = 600000) { // 10分
  const startTime = Date.now();
  let lastState = '';
  
  logInfo(`デプロイメント完了を待機中: ${deploymentId}`);
  
  while (Date.now() - startTime < maxWaitTime) {
    try {
      const response = await fetch(
        `https://api.vercel.com/v13/deployments/${deploymentId}`,
        {
          headers: {
            'Authorization': `Bearer ${VERCEL_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Vercel API error: ${response.status}`);
      }

      const deployment = await response.json();
      
      if (deployment.readyState !== lastState) {
        logInfo(`デプロイメント状態: ${deployment.readyState}`);
        lastState = deployment.readyState;
      }
      
      if (deployment.readyState === 'READY') {
        logSuccess('デプロイメントが完了しました！');
        return deployment;
      } else if (deployment.readyState === 'ERROR') {
        logError('デプロイメントが失敗しました');
        
        // エラー詳細を取得
        try {
          const eventsResponse = await fetch(
            `https://api.vercel.com/v3/deployments/${deploymentId}/events`,
            {
              headers: {
                'Authorization': `Bearer ${VERCEL_TOKEN}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          if (eventsResponse.ok) {
            const events = await eventsResponse.json();
            const errorEvents = events.filter(e => e.type === 'error');
            if (errorEvents.length > 0) {
              logError(`エラー詳細: ${errorEvents[0].payload.text}`);
            }
          }
        } catch (e) {
          // エラー詳細取得に失敗しても続行
        }
        
        throw new Error('Deployment failed');
      } else if (deployment.readyState === 'CANCELED') {
        throw new Error('Deployment was canceled');
      }

      await new Promise(resolve => setTimeout(resolve, 15000)); // 15秒待機
    } catch (error) {
      logError(`デプロイメント状態確認エラー: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, 15000));
    }
  }

  throw new Error('Deployment timeout');
}

/**
 * GitHub PRにコメントを投稿
 */
async function commentOnPR(previewUrl, deploymentId) {
  if (!GITHUB_TOKEN) {
    logWarning('GITHUB_TOKEN が設定されていないため、PRコメントをスキップします');
    return;
  }

  try {
    // 最近のオープンなPRを取得
    const prsResponse = await fetch(
      `https://api.github.com/repos/Ryotaverse69/suptia-kiro/pulls?state=open&head=Ryotaverse69:dev`,
      {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );

    if (prsResponse.ok) {
      const prs = await prsResponse.json();
      
      for (const pr of prs) {
        const commentBody = `🚀 **Preview Environment Updated**

Preview URL: ${previewUrl}
Deployment ID: \`${deploymentId}\`
Commit: \`${GITHUB_SHA}\`

The preview environment has been automatically updated with the latest changes from the \`dev\` branch.`;

        const commentResponse = await fetch(
          `https://api.github.com/repos/Ryotaverse69/suptia-kiro/issues/${pr.number}/comments`,
          {
            method: 'POST',
            headers: {
              'Authorization': `token ${GITHUB_TOKEN}`,
              'Accept': 'application/vnd.github.v3+json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ body: commentBody })
          }
        );

        if (commentResponse.ok) {
          logSuccess(`PR #${pr.number} にコメントを投稿しました`);
        } else {
          logWarning(`PR #${pr.number} へのコメント投稿に失敗しました`);
        }
      }
    }
  } catch (error) {
    logWarning(`PRコメント投稿エラー: ${error.message}`);
  }
}

/**
 * メイン処理
 */
async function main() {
  logHeader('Vercel Preview 確実取得開始');
  log(`実行時刻: ${new Date().toLocaleString('ja-JP')}`);
  log(`コミットSHA: ${GITHUB_SHA}`);
  log(`ブランチ: ${GITHUB_REF_NAME}`);

  try {
    // Step 1: 既存のデプロイメントを探す
    logHeader('Step 1: 既存デプロイメント検索');
    let deployment = await getDeploymentByCommit(GITHUB_SHA);
    
    // Step 2: デプロイメントが見つからない場合は新しくトリガー
    if (!deployment) {
      logHeader('Step 2: 新規デプロイメントトリガー');
      deployment = await triggerDeployment();
      
      if (!deployment) {
        throw new Error('デプロイメントのトリガーに失敗しました');
      }
      
      // 少し待ってから再度検索
      await new Promise(resolve => setTimeout(resolve, 10000));
      deployment = await getDeploymentByCommit(GITHUB_SHA) || deployment;
    }

    // Step 3: デプロイメント完了を待機
    logHeader('Step 3: デプロイメント完了待機');
    if (deployment.readyState !== 'READY') {
      deployment = await waitForDeployment(deployment.uid);
    }

    // Step 4: Preview URL生成
    const previewUrl = `https://${deployment.url}`;
    logSuccess(`Preview URL: ${previewUrl}`);

    // Step 5: GitHub Actionsの出力として設定
    if (process.env.GITHUB_ACTIONS) {
      execSync(`echo "preview_url=${previewUrl}" >> $GITHUB_OUTPUT`);
      execSync(`echo "deployment_id=${deployment.uid}" >> $GITHUB_OUTPUT`);
      execSync(`echo "deployment_ready=true" >> $GITHUB_OUTPUT`);
    }

    // Step 6: PRにコメント投稿
    logHeader('Step 6: PRコメント投稿');
    await commentOnPR(previewUrl, deployment.uid);

    // Step 7: 結果保存
    const result = {
      success: true,
      previewUrl,
      deploymentId: deployment.uid,
      deploymentState: deployment.readyState,
      timestamp: new Date().toISOString(),
      commit: GITHUB_SHA,
      branch: GITHUB_REF_NAME
    };

    fs.writeFileSync('vercel-preview-result.json', JSON.stringify(result, null, 2));
    logSuccess('結果をvercel-preview-result.jsonに保存しました');

    logHeader('完了');
    logSuccess('Vercel Preview URLの取得が完了しました！');
    
    return result;

  } catch (error) {
    logError(`処理失敗: ${error.message}`);
    
    // エラー結果保存
    const errorResult = {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      commit: GITHUB_SHA,
      branch: GITHUB_REF_NAME
    };

    fs.writeFileSync('vercel-preview-result.json', JSON.stringify(errorResult, null, 2));
    
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

export { main as ensureVercelPreview };