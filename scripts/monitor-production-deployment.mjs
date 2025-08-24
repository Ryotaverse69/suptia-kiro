#!/usr/bin/env node

/**
 * Production Deployment Monitor
 * 本番デプロイの監視とステータス確認を行う
 */

import { execSync } from 'child_process';

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID || 'prj_NWkcnXBay0NvP9FEZUuXAICo0514';
const GITHUB_SHA = process.env.GITHUB_SHA;
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

if (!VERCEL_TOKEN) {
  console.error('❌ VERCEL_TOKEN is required');
  process.exit(1);
}

if (!GITHUB_SHA) {
  console.error('❌ GITHUB_SHA is required');
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
 * 最新のデプロイメントを取得
 */
async function getLatestDeployment() {
  try {
    const data = await callVercelAPI(`/v6/deployments?projectId=${VERCEL_PROJECT_ID}&limit=10`);
    
    // masterブランチの最新デプロイメントを探す
    const masterDeployment = data.deployments.find(deployment => 
      deployment.meta?.githubCommitSha === GITHUB_SHA ||
      (deployment.meta?.githubCommitRef === 'master' || deployment.meta?.githubCommitRef === 'main')
    );

    return masterDeployment;
  } catch (error) {
    console.error('❌ Failed to get latest deployment:', error.message);
    throw error;
  }
}

/**
 * デプロイメントのステータスを監視
 */
async function monitorDeployment(deploymentId) {
  const maxAttempts = 30; // 最大5分間監視
  const interval = 10000; // 10秒間隔

  console.log(`🔍 Monitoring deployment: ${deploymentId}`);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const deployment = await callVercelAPI(`/v13/deployments/${deploymentId}`);
      
      console.log(`📊 Attempt ${attempt}/${maxAttempts} - Status: ${deployment.readyState}`);

      if (deployment.readyState === 'READY') {
        console.log('✅ Deployment completed successfully');
        return {
          success: true,
          deployment,
          url: `https://${deployment.url}`
        };
      }

      if (deployment.readyState === 'ERROR' || deployment.readyState === 'CANCELED') {
        console.error(`❌ Deployment failed with status: ${deployment.readyState}`);
        return {
          success: false,
          deployment,
          error: `Deployment ${deployment.readyState.toLowerCase()}`
        };
      }

      // まだ進行中の場合は待機
      if (attempt < maxAttempts) {
        console.log(`⏳ Waiting ${interval/1000}s before next check...`);
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    } catch (error) {
      console.error(`❌ Error checking deployment status:`, error.message);
      if (attempt === maxAttempts) {
        return {
          success: false,
          error: `Monitoring failed: ${error.message}`
        };
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }

  return {
    success: false,
    error: 'Deployment monitoring timeout'
  };
}

/**
 * Slackに通知を送信
 */
async function sendSlackNotification(message, isError = false) {
  if (!SLACK_WEBHOOK_URL) {
    console.log('ℹ️ SLACK_WEBHOOK_URL not configured, skipping Slack notification');
    return;
  }

  try {
    const payload = {
      text: message,
      username: 'Suptia Deploy Bot',
      icon_emoji: isError ? ':x:' : ':rocket:',
      attachments: [{
        color: isError ? 'danger' : 'good',
        fields: [{
          title: 'Commit',
          value: GITHUB_SHA?.substring(0, 7) || 'Unknown',
          short: true
        }, {
          title: 'Branch',
          value: 'master',
          short: true
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
 * GitHubにデプロイステータスを報告
 */
async function reportToGitHub(success, deploymentUrl, error) {
  if (!process.env.GITHUB_TOKEN) {
    console.log('ℹ️ GITHUB_TOKEN not available, skipping GitHub status update');
    return;
  }

  try {
    const state = success ? 'success' : 'failure';
    const description = success 
      ? 'Production deployment completed successfully'
      : `Production deployment failed: ${error}`;

    const statusPayload = {
      state,
      target_url: deploymentUrl,
      description,
      context: 'vercel/production'
    };

    execSync(`gh api repos/:owner/:repo/statuses/${GITHUB_SHA} --method POST --input -`, {
      input: JSON.stringify(statusPayload),
      stdio: 'inherit',
      env: { ...process.env, GITHUB_TOKEN: process.env.GITHUB_TOKEN }
    });

    console.log(`📝 GitHub status updated: ${state}`);
  } catch (error) {
    console.error('❌ Failed to update GitHub status:', error.message);
  }
}

/**
 * メイン処理
 */
async function main() {
  console.log('🚀 Starting production deployment monitoring...');
  console.log(`📋 Project ID: ${VERCEL_PROJECT_ID}`);
  console.log(`📋 Commit SHA: ${GITHUB_SHA}`);

  try {
    // 最新のデプロイメントを取得
    const deployment = await getLatestDeployment();
    
    if (!deployment) {
      throw new Error('No deployment found for this commit');
    }

    console.log(`🔍 Found deployment: ${deployment.uid}`);
    console.log(`📅 Created: ${new Date(deployment.createdAt).toISOString()}`);

    // デプロイメントを監視
    const result = await monitorDeployment(deployment.uid);

    if (result.success) {
      const message = `✅ Production deployment successful!\nURL: ${result.url}\nCommit: ${GITHUB_SHA?.substring(0, 7)}`;
      console.log(message);
      
      await sendSlackNotification(message, false);
      await reportToGitHub(true, result.url, null);
      
      // 成功時の出力
      console.log(`::set-output name=deployment_url::${result.url}`);
      console.log(`::set-output name=deployment_id::${deployment.uid}`);
      console.log(`::set-output name=success::true`);
    } else {
      const message = `❌ Production deployment failed!\nError: ${result.error}\nCommit: ${GITHUB_SHA?.substring(0, 7)}`;
      console.error(message);
      
      await sendSlackNotification(message, true);
      await reportToGitHub(false, null, result.error);
      
      // 失敗時の出力
      console.log(`::set-output name=success::false`);
      console.log(`::set-output name=error::${result.error}`);
      
      process.exit(1);
    }
  } catch (error) {
    const message = `❌ Production deployment monitoring failed!\nError: ${error.message}\nCommit: ${GITHUB_SHA?.substring(0, 7)}`;
    console.error(message);
    
    await sendSlackNotification(message, true);
    await reportToGitHub(false, null, error.message);
    
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

export { main, monitorDeployment, getLatestDeployment };