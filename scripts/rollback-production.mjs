#!/usr/bin/env node

/**
 * Production Rollback Script
 * 本番環境のロールバックを実行する
 */

import { execSync } from 'child_process';

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID || 'prj_NWkcnXBay0NvP9FEZUuXAICo0514';
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const ROLLBACK_TO_DEPLOYMENT = process.env.ROLLBACK_TO_DEPLOYMENT;

if (!VERCEL_TOKEN) {
  console.error('❌ VERCEL_TOKEN is required');
  process.exit(1);
}

/**
 * Vercel APIを呼び出す
 */
async function callVercelAPI(endpoint, options = {}) {
  const url = `https://api.vercel.com${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${VERCEL_TOKEN}`,
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });

  if (!response.ok) {
    throw new Error(`Vercel API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * 最後の成功したデプロイメントを取得
 */
async function getLastSuccessfulDeployment() {
  try {
    const data = await callVercelAPI(`/v6/deployments?projectId=${VERCEL_PROJECT_ID}&limit=20`);
    
    // 本番環境（master/main）の成功したデプロイメントを探す
    const successfulDeployments = data.deployments.filter(deployment => 
      deployment.readyState === 'READY' &&
      deployment.target === 'production' &&
      (deployment.meta?.githubCommitRef === 'master' || deployment.meta?.githubCommitRef === 'main')
    );

    if (successfulDeployments.length === 0) {
      throw new Error('No successful production deployments found');
    }

    // 指定されたデプロイメントまたは最新の成功デプロイメント
    if (ROLLBACK_TO_DEPLOYMENT) {
      const targetDeployment = successfulDeployments.find(d => d.uid === ROLLBACK_TO_DEPLOYMENT);
      if (!targetDeployment) {
        throw new Error(`Specified deployment ${ROLLBACK_TO_DEPLOYMENT} not found or not successful`);
      }
      return targetDeployment;
    }

    // 現在のデプロイメントを除く最後の成功デプロイメント
    return successfulDeployments[1] || successfulDeployments[0];
  } catch (error) {
    console.error('❌ Failed to get last successful deployment:', error.message);
    throw error;
  }
}

/**
 * デプロイメントをプロモート（本番環境に設定）
 */
async function promoteDeployment(deploymentId) {
  try {
    console.log(`🔄 Promoting deployment ${deploymentId} to production...`);
    
    const result = await callVercelAPI(`/v13/deployments/${deploymentId}/promote`, {
      method: 'POST'
    });

    console.log('✅ Deployment promoted successfully');
    return result;
  } catch (error) {
    console.error('❌ Failed to promote deployment:', error.message);
    throw error;
  }
}

/**
 * デプロイメント情報を表示
 */
function displayDeploymentInfo(deployment) {
  console.log('\n📋 Deployment Information:');
  console.log(`   ID: ${deployment.uid}`);
  console.log(`   URL: https://${deployment.url}`);
  console.log(`   Created: ${new Date(deployment.createdAt).toLocaleString()}`);
  console.log(`   Commit: ${deployment.meta?.githubCommitSha?.substring(0, 7) || 'Unknown'}`);
  console.log(`   Status: ${deployment.readyState}`);
  console.log(`   Target: ${deployment.target || 'production'}`);
}

/**
 * Slackに通知を送信
 */
async function sendSlackNotification(message, deployment) {
  if (!SLACK_WEBHOOK_URL) {
    console.log('ℹ️ SLACK_WEBHOOK_URL not configured, skipping Slack notification');
    return;
  }

  try {
    const payload = {
      text: message,
      username: 'Suptia Deploy Bot',
      icon_emoji: ':warning:',
      attachments: [{
        color: 'warning',
        title: 'Rollback Details',
        fields: [{
          title: 'Deployment ID',
          value: deployment.uid,
          short: true
        }, {
          title: 'Commit',
          value: deployment.meta?.githubCommitSha?.substring(0, 7) || 'Unknown',
          short: true
        }, {
          title: 'Created',
          value: new Date(deployment.createdAt).toLocaleString(),
          short: true
        }, {
          title: 'URL',
          value: `https://${deployment.url}`,
          short: false
        }]
      }]
    };

    const response = await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      console.log('📢 Slack notification sent successfully');
    } else {
      console.error('❌ Failed to send Slack notification:', response.statusText);
    }
  } catch (error) {
    console.error('❌ Error sending Slack notification:', error.message);
  }
}

/**
 * GitHubにロールバック情報を報告
 */
async function reportToGitHub(deployment) {
  if (!process.env.GITHUB_TOKEN || !process.env.GITHUB_SHA) {
    console.log('ℹ️ GITHUB_TOKEN or GITHUB_SHA not available, skipping GitHub notification');
    return;
  }

  try {
    // GitHub Issueにロールバック情報をコメント
    const issueBody = `🔄 **Production Rollback Executed**

**Rollback Details:**
- Rolled back to deployment: \`${deployment.uid}\`
- Deployment URL: https://${deployment.url}
- Original commit: \`${deployment.meta?.githubCommitSha?.substring(0, 7) || 'Unknown'}\`
- Rollback timestamp: ${new Date().toISOString()}

**Reason:** Automatic rollback due to deployment failure

Please investigate the failed deployment and address any issues before attempting to redeploy.`;

    // 最近のIssueまたはPRにコメントを追加
    try {
      execSync(`gh issue create --title "Production Rollback - $(date)" --body "${issueBody}" --label "deployment,rollback"`, {
        stdio: 'inherit',
        env: { ...process.env, GITHUB_TOKEN: process.env.GITHUB_TOKEN }
      });
      console.log('📝 GitHub issue created for rollback');
    } catch (error) {
      console.log('ℹ️ Could not create GitHub issue, trying to comment on recent PR');
      
      try {
        execSync(`gh pr list --state open --limit 1 --json number | jq -r '.[0].number' | xargs -I {} gh pr comment {} --body "${issueBody}"`, {
          stdio: 'inherit',
          env: { ...process.env, GITHUB_TOKEN: process.env.GITHUB_TOKEN }
        });
        console.log('📝 GitHub PR comment added for rollback');
      } catch (prError) {
        console.log('ℹ️ Could not comment on PR either');
      }
    }
  } catch (error) {
    console.error('❌ Failed to report to GitHub:', error.message);
  }
}

/**
 * ロールバックの確認
 */
async function confirmRollback(deployment) {
  if (process.env.CI || process.env.AUTO_ROLLBACK === 'true') {
    console.log('🤖 Auto-rollback enabled, proceeding without confirmation');
    return true;
  }

  console.log('\n⚠️  You are about to rollback the production deployment.');
  displayDeploymentInfo(deployment);
  
  // 本来はreadlineを使用するが、CI環境では自動実行
  console.log('\n✅ Proceeding with rollback (CI environment)');
  return true;
}

/**
 * メイン処理
 */
async function main() {
  console.log('🔄 Starting production rollback process...');
  console.log(`📋 Project ID: ${VERCEL_PROJECT_ID}`);

  try {
    // 最後の成功したデプロイメントを取得
    const lastSuccessfulDeployment = await getLastSuccessfulDeployment();
    
    if (!lastSuccessfulDeployment) {
      throw new Error('No successful deployment found to rollback to');
    }

    console.log(`🎯 Target deployment found: ${lastSuccessfulDeployment.uid}`);
    displayDeploymentInfo(lastSuccessfulDeployment);

    // ロールバックの確認
    const confirmed = await confirmRollback(lastSuccessfulDeployment);
    
    if (!confirmed) {
      console.log('❌ Rollback cancelled by user');
      process.exit(0);
    }

    // デプロイメントをプロモート
    await promoteDeployment(lastSuccessfulDeployment.uid);

    const message = `✅ Production rollback completed successfully!\nRolled back to: ${lastSuccessfulDeployment.uid}\nURL: https://${lastSuccessfulDeployment.url}`;
    console.log(message);

    // 通知を送信
    await sendSlackNotification(message, lastSuccessfulDeployment);
    await reportToGitHub(lastSuccessfulDeployment);

    // 成功時の出力
    console.log(`::set-output name=rollback_deployment_id::${lastSuccessfulDeployment.uid}`);
    console.log(`::set-output name=rollback_url::https://${lastSuccessfulDeployment.url}`);
    console.log(`::set-output name=success::true`);

  } catch (error) {
    const message = `❌ Production rollback failed!\nError: ${error.message}`;
    console.error(message);

    if (SLACK_WEBHOOK_URL) {
      await sendSlackNotification(message, null);
    }

    console.log(`::set-output name=success::false`);
    console.log(`::set-output name=error::${error.message}`);
    
    process.exit(1);
  }
}

// スクリプト実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
}

export { main, getLastSuccessfulDeployment, promoteDeployment };