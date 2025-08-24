#!/usr/bin/env node

/**
 * Deployment Notification Helper
 * デプロイメント関連の通知を統一的に管理する
 */

import { execSync } from 'child_process';

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_SHA = process.env.GITHUB_SHA;
const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY;
const GITHUB_RUN_ID = process.env.GITHUB_RUN_ID;
const GITHUB_SERVER_URL = process.env.GITHUB_SERVER_URL || 'https://github.com';

/**
 * Slackに通知を送信
 */
async function sendSlackNotification(type, data) {
  if (!SLACK_WEBHOOK_URL) {
    console.log('ℹ️ SLACK_WEBHOOK_URL not configured, skipping Slack notification');
    return;
  }

  const notifications = {
    deployment_success: {
      text: `✅ Production deployment successful!`,
      color: 'good',
      emoji: ':rocket:'
    },
    deployment_failure: {
      text: `❌ Production deployment failed!`,
      color: 'danger',
      emoji: ':x:'
    },
    rollback_success: {
      text: `🔄 Production rollback completed successfully!`,
      color: 'warning',
      emoji: ':warning:'
    },
    rollback_failure: {
      text: `❌ Production rollback failed!`,
      color: 'danger',
      emoji: ':x:'
    }
  };

  const notification = notifications[type];
  if (!notification) {
    throw new Error(`Unknown notification type: ${type}`);
  }

  try {
    const fields = [
      {
        title: 'Commit',
        value: GITHUB_SHA?.substring(0, 7) || 'Unknown',
        short: true
      },
      {
        title: 'Repository',
        value: GITHUB_REPOSITORY || 'Unknown',
        short: true
      }
    ];

    if (data.url) {
      fields.push({
        title: 'URL',
        value: data.url,
        short: false
      });
    }

    if (data.error) {
      fields.push({
        title: 'Error',
        value: data.error,
        short: false
      });
    }

    if (data.deploymentId) {
      fields.push({
        title: 'Deployment ID',
        value: data.deploymentId,
        short: true
      });
    }

    if (GITHUB_RUN_ID) {
      fields.push({
        title: 'Workflow Run',
        value: `${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}`,
        short: false
      });
    }

    const payload = {
      text: notification.text,
      username: 'Suptia Deploy Bot',
      icon_emoji: notification.emoji,
      attachments: [{
        color: notification.color,
        fields,
        footer: 'Suptia CI/CD',
        ts: Math.floor(Date.now() / 1000)
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
 * GitHubにデプロイメントステータスを作成
 */
async function createGitHubDeployment(environment, success, deploymentUrl, error) {
  if (!GITHUB_TOKEN || !GITHUB_SHA) {
    console.log('ℹ️ GITHUB_TOKEN or GITHUB_SHA not available, skipping GitHub deployment status');
    return;
  }

  try {
    // デプロイメントを作成
    const deploymentPayload = {
      ref: GITHUB_SHA,
      environment,
      auto_merge: false,
      required_contexts: [],
      production_environment: environment === 'production'
    };

    const deploymentResult = execSync(`gh api repos/:owner/:repo/deployments --method POST --input -`, {
      input: JSON.stringify(deploymentPayload),
      encoding: 'utf8',
      env: { ...process.env, GITHUB_TOKEN }
    });

    const deployment = JSON.parse(deploymentResult);
    console.log(`📝 GitHub deployment created: ${deployment.id}`);

    // デプロイメントステータスを作成
    const state = success ? 'success' : 'failure';
    const description = success 
      ? `${environment} deployment completed successfully`
      : `${environment} deployment failed: ${error || 'Unknown error'}`;

    const statusPayload = {
      state,
      target_url: deploymentUrl || `${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}`,
      description,
      environment,
      environment_url: deploymentUrl
    };

    execSync(`gh api repos/:owner/:repo/deployments/${deployment.id}/statuses --method POST --input -`, {
      input: JSON.stringify(statusPayload),
      stdio: 'inherit',
      env: { ...process.env, GITHUB_TOKEN }
    });

    console.log(`📝 GitHub deployment status updated: ${state}`);
    return deployment.id;
  } catch (error) {
    console.error('❌ Failed to create GitHub deployment:', error.message);
  }
}

/**
 * GitHubにIssueを作成
 */
async function createGitHubIssue(title, body, labels = []) {
  if (!GITHUB_TOKEN) {
    console.log('ℹ️ GITHUB_TOKEN not available, skipping GitHub issue creation');
    return;
  }

  try {
    const labelsArg = labels.length > 0 ? labels.map(l => `--label "${l}"`).join(' ') : '';
    const command = `gh issue create --title "${title}" --body "${body}" ${labelsArg}`;
    
    execSync(command, {
      stdio: 'inherit',
      env: { ...process.env, GITHUB_TOKEN }
    });

    console.log('📝 GitHub issue created successfully');
  } catch (error) {
    console.error('❌ Failed to create GitHub issue:', error.message);
  }
}

/**
 * メイン処理
 */
async function main() {
  const [type, ...args] = process.argv.slice(2);
  
  if (!type) {
    console.error('Usage: node notify-deployment.mjs <type> [options]');
    console.error('Types: deployment_success, deployment_failure, rollback_success, rollback_failure');
    process.exit(1);
  }

  const data = {};
  
  // コマンドライン引数から情報を取得
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace('--', '');
    const value = args[i + 1];
    if (key && value) {
      data[key] = value;
    }
  }

  // 環境変数から情報を取得
  if (process.env.DEPLOYMENT_URL) data.url = process.env.DEPLOYMENT_URL;
  if (process.env.DEPLOYMENT_ID) data.deploymentId = process.env.DEPLOYMENT_ID;
  if (process.env.ERROR_MESSAGE) data.error = process.env.ERROR_MESSAGE;

  console.log(`📢 Sending ${type} notification...`);
  console.log(`📋 Data:`, data);

  try {
    // Slack通知を送信
    await sendSlackNotification(type, data);

    // GitHub デプロイメントステータスを作成
    const environment = type.includes('rollback') ? 'production-rollback' : 'production';
    const success = type.includes('success');
    await createGitHubDeployment(environment, success, data.url, data.error);

    // 失敗時はIssueを作成
    if (!success && type.includes('deployment')) {
      const title = `🚨 Production Deployment Failed - ${new Date().toISOString().split('T')[0]}`;
      const body = `**Production deployment failed**

**Details:**
- Commit: \`${GITHUB_SHA?.substring(0, 7) || 'Unknown'}\`
- Error: ${data.error || 'Unknown error'}
- Workflow: ${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}
- Timestamp: ${new Date().toISOString()}

**Next Steps:**
1. Check the workflow logs for detailed error information
2. Fix any issues in the code
3. Test the fix locally and in preview environment
4. Redeploy when ready

${data.deploymentId ? `**Deployment ID:** \`${data.deploymentId}\`` : ''}`;

      await createGitHubIssue(title, body, ['deployment', 'bug', 'urgent']);
    }

    console.log('✅ Notifications sent successfully');
  } catch (error) {
    console.error('❌ Failed to send notifications:', error.message);
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

export { sendSlackNotification, createGitHubDeployment, createGitHubIssue };