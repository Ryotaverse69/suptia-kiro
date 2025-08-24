#!/usr/bin/env node

/**
 * Deployment Metrics Collector
 * デプロイメントの成功率とパフォーマンスメトリクスを収集・分析する
 */

import fs from 'fs';
import path from 'path';

const DEPLOYMENT_METRICS_DIR = '.git/deployment-metrics';
const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID || 'prj_NWkcnXBay0NvP9FEZUuXAICo0514';
const GITHUB_SHA = process.env.GITHUB_SHA;
const GITHUB_REF_NAME = process.env.GITHUB_REF_NAME;

/**
 * デプロイメントメトリクスディレクトリを作成
 */
function ensureDeploymentMetricsDir() {
  if (!fs.existsSync(DEPLOYMENT_METRICS_DIR)) {
    fs.mkdirSync(DEPLOYMENT_METRICS_DIR, { recursive: true });
  }
}

/**
 * Vercel APIを呼び出す
 */
async function callVercelAPI(endpoint, options = {}) {
  if (!VERCEL_TOKEN) {
    throw new Error('VERCEL_TOKEN is required');
  }

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
 * プロジェクトのデプロイメント履歴を取得
 */
async function getDeploymentHistory(limit = 50) {
  try {
    const data = await callVercelAPI(`/v6/deployments?projectId=${VERCEL_PROJECT_ID}&limit=${limit}`);
    
    return data.deployments.map(deployment => ({
      uid: deployment.uid,
      name: deployment.name,
      url: deployment.url,
      state: deployment.state,
      type: deployment.type,
      target: deployment.target,
      created_at: deployment.createdAt,
      ready: deployment.ready,
      building_at: deployment.buildingAt,
      ready_at: deployment.readyAt,
      canceled_at: deployment.canceledAt,
      error_at: deployment.errorAt,
      source: deployment.source,
      meta: deployment.meta,
      regions: deployment.regions,
      functions: deployment.functions,
      creator: deployment.creator
    }));
  } catch (error) {
    console.error('❌ Failed to get deployment history:', error.message);
    return [];
  }
}

/**
 * 特定のデプロイメントの詳細情報を取得
 */
async function getDeploymentDetails(deploymentId) {
  try {
    const deployment = await callVercelAPI(`/v13/deployments/${deploymentId}`);
    const builds = await callVercelAPI(`/v1/deployments/${deploymentId}/builds`).catch(() => ({ builds: [] }));
    
    return {
      ...deployment,
      builds: builds.builds || []
    };
  } catch (error) {
    console.error(`❌ Failed to get deployment details for ${deploymentId}:`, error.message);
    return null;
  }
}

/**
 * デプロイメントのパフォーマンスメトリクスを計算
 */
function calculateDeploymentMetrics(deployments) {
  const metrics = {
    total_deployments: deployments.length,
    successful_deployments: 0,
    failed_deployments: 0,
    canceled_deployments: 0,
    success_rate: 0,
    avg_build_time: 0,
    avg_deploy_time: 0,
    environments: {
      production: { count: 0, success: 0 },
      preview: { count: 0, success: 0 }
    },
    build_times: [],
    deploy_times: [],
    error_types: {},
    recent_failures: []
  };

  deployments.forEach(deployment => {
    // 環境別統計
    const env = deployment.target === 'production' ? 'production' : 'preview';
    metrics.environments[env].count++;

    // ステータス別統計
    if (deployment.state === 'READY') {
      metrics.successful_deployments++;
      metrics.environments[env].success++;
    } else if (deployment.state === 'ERROR') {
      metrics.failed_deployments++;
      
      // 最近の失敗を記録
      if (metrics.recent_failures.length < 10) {
        metrics.recent_failures.push({
          uid: deployment.uid,
          created_at: deployment.created_at,
          error_at: deployment.error_at,
          meta: deployment.meta
        });
      }
    } else if (deployment.state === 'CANCELED') {
      metrics.canceled_deployments++;
    }

    // ビルド時間の計算
    if (deployment.building_at && deployment.ready_at) {
      const buildTime = new Date(deployment.ready_at) - new Date(deployment.building_at);
      if (buildTime > 0) {
        metrics.build_times.push(buildTime);
      }
    }

    // デプロイ時間の計算
    if (deployment.created_at && deployment.ready_at) {
      const deployTime = new Date(deployment.ready_at) - new Date(deployment.created_at);
      if (deployTime > 0) {
        metrics.deploy_times.push(deployTime);
      }
    }
  });

  // 成功率の計算
  if (metrics.total_deployments > 0) {
    metrics.success_rate = (metrics.successful_deployments / metrics.total_deployments) * 100;
  }

  // 平均時間の計算
  if (metrics.build_times.length > 0) {
    metrics.avg_build_time = metrics.build_times.reduce((sum, time) => sum + time, 0) / metrics.build_times.length;
  }

  if (metrics.deploy_times.length > 0) {
    metrics.avg_deploy_time = metrics.deploy_times.reduce((sum, time) => sum + time, 0) / metrics.deploy_times.length;
  }

  // 環境別成功率
  Object.keys(metrics.environments).forEach(env => {
    const envData = metrics.environments[env];
    if (envData.count > 0) {
      envData.success_rate = (envData.success / envData.count) * 100;
    }
  });

  return metrics;
}

/**
 * デプロイメントメトリクスを収集
 */
async function collectDeploymentMetrics() {
  console.log('📊 デプロイメントメトリクスを収集中...');

  const timestamp = new Date().toISOString();
  
  try {
    // デプロイメント履歴を取得
    const deployments = await getDeploymentHistory(100);
    
    if (deployments.length === 0) {
      console.log('ℹ️ デプロイメント履歴が見つかりません');
      return null;
    }

    // メトリクスを計算
    const metrics = calculateDeploymentMetrics(deployments);
    
    // 最新のデプロイメント詳細を取得
    const latestDeployment = deployments[0];
    let deploymentDetails = null;
    if (latestDeployment) {
      deploymentDetails = await getDeploymentDetails(latestDeployment.uid);
    }

    const result = {
      timestamp,
      project_id: VERCEL_PROJECT_ID,
      sha: GITHUB_SHA,
      branch: GITHUB_REF_NAME,
      metrics,
      latest_deployment: deploymentDetails,
      deployments: deployments.slice(0, 20) // 最新20件のみ保存
    };

    console.log('✅ デプロイメントメトリクス収集完了');
    return result;
  } catch (error) {
    console.error('❌ デプロイメントメトリクス収集エラー:', error.message);
    return {
      timestamp,
      error: error.message,
      project_id: VERCEL_PROJECT_ID,
      sha: GITHUB_SHA,
      branch: GITHUB_REF_NAME
    };
  }
}

/**
 * メトリクスを保存
 */
function saveDeploymentMetrics(metrics) {
  ensureDeploymentMetricsDir();
  
  const filename = `deployment-metrics-${Date.now()}.json`;
  const filepath = path.join(DEPLOYMENT_METRICS_DIR, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(metrics, null, 2));
  console.log(`💾 デプロイメントメトリクスを保存: ${filepath}`);
  
  // 最新のメトリクスファイルへのシンボリックリンクを作成
  const latestPath = path.join(DEPLOYMENT_METRICS_DIR, 'latest.json');
  try {
    if (fs.existsSync(latestPath)) {
      fs.unlinkSync(latestPath);
    }
    fs.symlinkSync(filename, latestPath);
  } catch (error) {
    // シンボリックリンク作成に失敗してもコピーで代用
    fs.copyFileSync(filepath, latestPath);
  }
}

/**
 * デプロイメントメトリクスレポートを生成
 */
function generateDeploymentReport(metricsData) {
  if (!metricsData || !metricsData.metrics) {
    console.log('❌ メトリクスデータが無効です');
    return;
  }

  const { metrics } = metricsData;
  
  console.log('\n📊 デプロイメントメトリクスレポート');
  console.log('=' .repeat(50));
  
  // 基本統計
  console.log(`\n📈 基本統計:`);
  console.log(`  総デプロイ数: ${metrics.total_deployments}`);
  console.log(`  成功: ${metrics.successful_deployments} (${metrics.success_rate.toFixed(1)}%)`);
  console.log(`  失敗: ${metrics.failed_deployments}`);
  console.log(`  キャンセル: ${metrics.canceled_deployments}`);
  
  // 環境別統計
  console.log(`\n🌍 環境別統計:`);
  Object.entries(metrics.environments).forEach(([env, data]) => {
    if (data.count > 0) {
      console.log(`  ${env}: ${data.success}/${data.count} (${data.success_rate.toFixed(1)}%)`);
    }
  });
  
  // パフォーマンス統計
  console.log(`\n⏱️ パフォーマンス統計:`);
  if (metrics.avg_build_time > 0) {
    console.log(`  平均ビルド時間: ${Math.round(metrics.avg_build_time / 1000)}秒`);
  }
  if (metrics.avg_deploy_time > 0) {
    console.log(`  平均デプロイ時間: ${Math.round(metrics.avg_deploy_time / 1000)}秒`);
  }
  
  // 最近の失敗
  if (metrics.recent_failures.length > 0) {
    console.log(`\n❌ 最近の失敗 (${metrics.recent_failures.length}件):`);
    metrics.recent_failures.forEach((failure, index) => {
      const date = new Date(failure.created_at).toLocaleString('ja-JP');
      console.log(`  ${index + 1}. ${failure.uid} (${date})`);
    });
  }
  
  // 改善提案
  console.log(`\n💡 改善提案:`);
  if (metrics.success_rate < 95) {
    console.log('  • デプロイ成功率が95%を下回っています。失敗の原因を調査してください');
  }
  if (metrics.avg_build_time > 300000) { // 5分以上
    console.log('  • ビルド時間が長すぎます。ビルドプロセスの最適化を検討してください');
  }
  if (metrics.environments.production.success_rate < 98) {
    console.log('  • 本番環境のデプロイ成功率が低下しています。本番デプロイプロセスを見直してください');
  }
  
  if (metrics.success_rate >= 95 && metrics.avg_build_time <= 300000) {
    console.log('  ✅ デプロイメントメトリクスは良好です！');
  }
}

/**
 * 古いメトリクスファイルをクリーンアップ
 */
function cleanupOldDeploymentMetrics() {
  if (!fs.existsSync(DEPLOYMENT_METRICS_DIR)) {
    return;
  }

  const files = fs.readdirSync(DEPLOYMENT_METRICS_DIR)
    .filter(f => f.startsWith('deployment-metrics-') && f.endsWith('.json'))
    .map(f => ({
      name: f,
      path: path.join(DEPLOYMENT_METRICS_DIR, f),
      mtime: fs.statSync(path.join(DEPLOYMENT_METRICS_DIR, f)).mtime
    }))
    .sort((a, b) => b.mtime - a.mtime);

  // 最新30件を保持、それ以外は削除
  const filesToDelete = files.slice(30);
  
  filesToDelete.forEach(file => {
    try {
      fs.unlinkSync(file.path);
      console.log(`🗑️ 古いデプロイメントメトリクスファイルを削除: ${file.name}`);
    } catch (error) {
      console.error(`❌ ファイル削除エラー: ${file.name}`, error.message);
    }
  });
}

/**
 * メイン処理
 */
async function main() {
  const args = process.argv.slice(2);
  const showReport = args.includes('--report');
  
  try {
    const metrics = await collectDeploymentMetrics();
    
    if (metrics) {
      saveDeploymentMetrics(metrics);
      
      if (showReport) {
        generateDeploymentReport(metrics);
      }
    }
    
    cleanupOldDeploymentMetrics();
    
    console.log('🎉 デプロイメントメトリクス収集が完了しました');
  } catch (error) {
    console.error('❌ デプロイメントメトリクス収集に失敗:', error.message);
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

export { 
  collectDeploymentMetrics, 
  saveDeploymentMetrics, 
  calculateDeploymentMetrics,
  generateDeploymentReport 
};