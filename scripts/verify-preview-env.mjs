#!/usr/bin/env node

/**
 * Vercel Preview環境の設定検証スクリプト
 * Preview環境で必要な環境変数とデプロイ設定を確認する
 */

import { execSync } from 'child_process';

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID || 'prj_NWkcnXBay0NvP9FEZUuXAICo0514';

/**
 * Vercel APIから環境変数を取得
 */
async function getVercelEnvironmentVariables() {
  if (!VERCEL_TOKEN) {
    log(colors.yellow, '⚠️  VERCEL_TOKEN not available - skipping Vercel API checks');
    return null;
  }

  try {
    const response = await fetch(
      `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/env`,
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
    return data.envs || [];
  } catch (error) {
    log(colors.red, `❌ Failed to fetch Vercel environment variables: ${error.message}`);
    return null;
  }
}

/**
 * Preview環境の必須環境変数をチェック
 */
function checkRequiredEnvironmentVariables(envVars) {
  const requiredVars = [
    'NEXT_PUBLIC_SANITY_PROJECT_ID',
    'NEXT_PUBLIC_SANITY_DATASET',
    'NEXT_PUBLIC_SITE_URL',
    'SANITY_API_TOKEN',
    'SANITY_API_VERSION'
  ];

  const previewVars = envVars.filter(env => 
    env.target.includes('preview') || env.target.includes('development')
  );

  const missingVars = [];
  const presentVars = [];

  for (const requiredVar of requiredVars) {
    const found = previewVars.find(env => env.key === requiredVar);
    if (found) {
      presentVars.push({
        key: requiredVar,
        target: found.target,
        type: found.type
      });
    } else {
      missingVars.push(requiredVar);
    }
  }

  return { missingVars, presentVars };
}

/**
 * Preview環境のURL設定をチェック
 */
function checkPreviewUrlConfiguration(envVars) {
  const siteUrlVar = envVars.find(env => 
    env.key === 'NEXT_PUBLIC_SITE_URL' && 
    (env.target.includes('preview') || env.target.includes('development'))
  );

  const issues = [];
  const recommendations = [];

  if (siteUrlVar) {
    // Preview環境では本番ドメインを使用すべきではない
    if (siteUrlVar.value && siteUrlVar.value.includes('suptia.com')) {
      issues.push('Preview environment should not use production domain (suptia.com)');
      recommendations.push('Set NEXT_PUBLIC_SITE_URL to use vercel.app domain for preview environment');
    }

    // プレースホルダー値のチェック
    if (siteUrlVar.value && siteUrlVar.value.includes('localhost')) {
      recommendations.push('Preview environment should use actual preview URL instead of localhost');
    }
  }

  return { issues, recommendations };
}

/**
 * デプロイ設定をチェック
 */
async function checkDeploymentConfiguration() {
  if (!VERCEL_TOKEN) {
    return { issues: [], recommendations: ['Set VERCEL_TOKEN to enable deployment configuration checks'] };
  }

  try {
    const response = await fetch(
      `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}`,
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

    const project = await response.json();
    const issues = [];
    const recommendations = [];

    // Git統合の確認
    if (!project.link) {
      issues.push('Project is not linked to a Git repository');
    } else {
      // dev ブランチのデプロイ設定確認
      const gitSource = project.link;
      if (gitSource.type === 'github') {
        log(colors.blue, `📋 Git integration: ${gitSource.repo} (${gitSource.type})`);
        
        // ブランチ設定の確認（vercel.jsonから）
        try {
          const vercelConfig = JSON.parse(
            execSync('cat vercel.json', { encoding: 'utf8', cwd: process.cwd() })
          );
          
          if (vercelConfig.git?.deploymentEnabled?.dev !== true) {
            issues.push('dev branch deployment is not enabled in vercel.json');
            recommendations.push('Enable dev branch deployment in vercel.json');
          }
        } catch (error) {
          recommendations.push('Ensure vercel.json exists and has proper git deployment configuration');
        }
      }
    }

    return { issues, recommendations };
  } catch (error) {
    return { 
      issues: [`Failed to check deployment configuration: ${error.message}`], 
      recommendations: [] 
    };
  }
}

/**
 * 最近のPreviewデプロイメントをチェック
 */
async function checkRecentPreviewDeployments() {
  if (!VERCEL_TOKEN) {
    return { deployments: [], issues: [] };
  }

  try {
    const response = await fetch(
      `https://api.vercel.com/v6/deployments?projectId=${VERCEL_PROJECT_ID}&limit=10`,
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

    const data = await response.json();
    const deployments = data.deployments || [];
    
    // dev ブランチのデプロイメントをフィルタ
    const devDeployments = deployments.filter(d => 
      d.meta?.githubCommitRef === 'dev' || 
      d.gitSource?.ref === 'dev'
    );

    const issues = [];
    
    if (devDeployments.length === 0) {
      issues.push('No recent deployments found for dev branch');
      issues.push('Verify that dev branch pushes trigger Vercel deployments');
    } else {
      const latestDev = devDeployments[0];
      const deploymentAge = Date.now() - latestDev.createdAt;
      const hoursAgo = Math.floor(deploymentAge / (1000 * 60 * 60));
      
      log(colors.green, `✅ Latest dev deployment: ${latestDev.url}`);
      log(colors.blue, `   Status: ${latestDev.readyState}`);
      log(colors.blue, `   Created: ${hoursAgo} hours ago`);
      
      if (latestDev.readyState === 'ERROR') {
        issues.push('Latest dev deployment failed');
      }
    }

    return { deployments: devDeployments, issues };
  } catch (error) {
    return { 
      deployments: [], 
      issues: [`Failed to check recent deployments: ${error.message}`] 
    };
  }
}

/**
 * メイン検証処理
 */
async function main() {
  log(colors.blue, '🔍 Verifying Vercel Preview Environment Configuration...');
  log(colors.blue, '');

  let totalIssues = 0;
  let totalRecommendations = 0;

  // 1. 環境変数の確認
  log(colors.blue, '📋 Checking environment variables...');
  const envVars = await getVercelEnvironmentVariables();
  
  if (envVars) {
    const { missingVars, presentVars } = checkRequiredEnvironmentVariables(envVars);
    
    if (missingVars.length > 0) {
      totalIssues += missingVars.length;
      log(colors.red, '❌ Missing required environment variables for Preview:');
      for (const varName of missingVars) {
        log(colors.red, `   - ${varName}`);
      }
    }
    
    if (presentVars.length > 0) {
      log(colors.green, '✅ Found required environment variables:');
      for (const varInfo of presentVars) {
        log(colors.green, `   - ${varInfo.key} (${varInfo.target.join(', ')})`);
      }
    }

    // URL設定の確認
    const { issues, recommendations } = checkPreviewUrlConfiguration(envVars);
    totalIssues += issues.length;
    totalRecommendations += recommendations.length;
    
    if (issues.length > 0) {
      log(colors.red, '❌ Preview URL configuration issues:');
      for (const issue of issues) {
        log(colors.red, `   - ${issue}`);
      }
    }
    
    if (recommendations.length > 0) {
      log(colors.yellow, '⚠️  Preview URL recommendations:');
      for (const rec of recommendations) {
        log(colors.yellow, `   - ${rec}`);
      }
    }
  }

  log(colors.blue, '');

  // 2. デプロイ設定の確認
  log(colors.blue, '🚀 Checking deployment configuration...');
  const deployConfig = await checkDeploymentConfiguration();
  totalIssues += deployConfig.issues.length;
  totalRecommendations += deployConfig.recommendations.length;
  
  if (deployConfig.issues.length > 0) {
    log(colors.red, '❌ Deployment configuration issues:');
    for (const issue of deployConfig.issues) {
      log(colors.red, `   - ${issue}`);
    }
  }
  
  if (deployConfig.recommendations.length > 0) {
    log(colors.yellow, '⚠️  Deployment configuration recommendations:');
    for (const rec of deployConfig.recommendations) {
      log(colors.yellow, `   - ${rec}`);
    }
  }

  log(colors.blue, '');

  // 3. 最近のデプロイメント確認
  log(colors.blue, '📈 Checking recent Preview deployments...');
  const deploymentCheck = await checkRecentPreviewDeployments();
  totalIssues += deploymentCheck.issues.length;
  
  if (deploymentCheck.issues.length > 0) {
    log(colors.red, '❌ Recent deployment issues:');
    for (const issue of deploymentCheck.issues) {
      log(colors.red, `   - ${issue}`);
    }
  }

  log(colors.blue, '');

  // 結果サマリー
  if (totalIssues === 0 && totalRecommendations === 0) {
    log(colors.green, '🎉 Preview environment is properly configured!');
    log(colors.green, '   ✅ All required environment variables are set');
    log(colors.green, '   ✅ Deployment configuration is correct');
    log(colors.green, '   ✅ Recent deployments are working');
  } else {
    if (totalIssues > 0) {
      log(colors.red, `❌ Found ${totalIssues} issue(s) that need to be fixed`);
    }
    if (totalRecommendations > 0) {
      log(colors.yellow, `⚠️  Found ${totalRecommendations} recommendation(s) for improvement`);
    }
    
    log(colors.blue, '');
    log(colors.blue, '💡 To fix Preview environment issues:');
    log(colors.blue, '   1. Visit Vercel project dashboard');
    log(colors.blue, '   2. Go to Settings > Environment Variables');
    log(colors.blue, '   3. Ensure all required variables are set for Preview environment');
    log(colors.blue, '   4. Check Settings > Git to verify dev branch deployment is enabled');
    log(colors.blue, '   5. Test by pushing to dev branch and verifying deployment');
    
    if (totalIssues > 0) {
      process.exit(1);
    }
  }
}

// スクリプトが直接実行された場合
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    log(colors.red, `❌ Verification failed: ${error.message}`);
    process.exit(1);
  });
}

export { main as verifyPreviewEnvironment };