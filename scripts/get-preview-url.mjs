#!/usr/bin/env node

/**
 * Vercel Preview URL取得スクリプト
 * GitHub ActionsからVercel APIを使用してPreview URLを取得する
 */

import { execSync } from 'child_process';

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID || 'prj_NWkcnXBay0NvP9FEZUuXAICo0514';
const GITHUB_SHA = process.env.GITHUB_SHA;
const GITHUB_REF_NAME = process.env.GITHUB_REF_NAME;

if (!VERCEL_TOKEN) {
  console.error('❌ VERCEL_TOKEN environment variable is required');
  process.exit(1);
}

if (!GITHUB_SHA) {
  console.error('❌ GITHUB_SHA environment variable is required');
  process.exit(1);
}

/**
 * Vercel APIからデプロイメント情報を取得
 */
async function getDeploymentByCommit(sha) {
  try {
    const response = await fetch(
      `https://api.vercel.com/v6/deployments?projectId=${VERCEL_PROJECT_ID}&gitSource.sha=${sha}`,
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
    return data.deployments?.[0];
  } catch (error) {
    console.error('❌ Failed to fetch deployment:', error.message);
    return null;
  }
}

/**
 * デプロイメントの完了を待機
 */
async function waitForDeployment(deploymentId, maxWaitTime = 300000) { // 5分
  const startTime = Date.now();
  
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
      
      if (deployment.readyState === 'READY') {
        return deployment;
      } else if (deployment.readyState === 'ERROR') {
        throw new Error('Deployment failed');
      }

      console.log(`⏳ Deployment status: ${deployment.readyState}, waiting...`);
      await new Promise(resolve => setTimeout(resolve, 10000)); // 10秒待機
    } catch (error) {
      console.error('❌ Error checking deployment status:', error.message);
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }

  throw new Error('Deployment timeout');
}

/**
 * メイン処理
 */
async function main() {
  console.log(`🔍 Looking for deployment with commit SHA: ${GITHUB_SHA}`);
  console.log(`📝 Branch: ${GITHUB_REF_NAME}`);

  // 最初にデプロイメントを探す
  let deployment = await getDeploymentByCommit(GITHUB_SHA);
  
  if (!deployment) {
    console.log('⏳ Deployment not found yet, waiting for Vercel to create it...');
    
    // デプロイメントが作成されるまで待機（最大2分）
    const maxInitialWait = 120000;
    const startTime = Date.now();
    
    while (!deployment && (Date.now() - startTime < maxInitialWait)) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      deployment = await getDeploymentByCommit(GITHUB_SHA);
    }
    
    if (!deployment) {
      console.error('❌ No deployment found for this commit');
      process.exit(1);
    }
  }

  console.log(`✅ Found deployment: ${deployment.uid}`);
  console.log(`📊 Current status: ${deployment.readyState}`);

  // デプロイメントが完了するまで待機
  if (deployment.readyState !== 'READY') {
    console.log('⏳ Waiting for deployment to complete...');
    deployment = await waitForDeployment(deployment.uid);
  }

  const previewUrl = `https://${deployment.url}`;
  console.log(`🚀 Preview URL: ${previewUrl}`);

  // GitHub Actionsの出力として設定
  if (process.env.GITHUB_ACTIONS) {
    execSync(`echo "preview_url=${previewUrl}" >> $GITHUB_OUTPUT`);
    execSync(`echo "deployment_id=${deployment.uid}" >> $GITHUB_OUTPUT`);
  }

  return {
    url: previewUrl,
    deploymentId: deployment.uid,
    status: deployment.readyState
  };
}

// スクリプトが直接実行された場合
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  });
}

export { main as getPreviewUrl };