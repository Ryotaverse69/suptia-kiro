#!/usr/bin/env node

/**
 * CI/CD Metrics Collector
 * CI/CDパイプラインの実行時間とステータスを記録する
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const METRICS_DIR = '.git/ci-metrics';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY;
const GITHUB_RUN_ID = process.env.GITHUB_RUN_ID;
const GITHUB_WORKFLOW = process.env.GITHUB_WORKFLOW;
const GITHUB_JOB = process.env.GITHUB_JOB;
const GITHUB_SHA = process.env.GITHUB_SHA;
const GITHUB_REF_NAME = process.env.GITHUB_REF_NAME;

/**
 * メトリクスディレクトリを作成
 */
function ensureMetricsDir() {
  if (!fs.existsSync(METRICS_DIR)) {
    fs.mkdirSync(METRICS_DIR, { recursive: true });
  }
}

/**
 * GitHub APIを呼び出す
 */
async function callGitHubAPI(endpoint, options = {}) {
  if (!GITHUB_TOKEN) {
    throw new Error('GITHUB_TOKEN is required');
  }

  const url = `https://api.github.com${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Suptia-CI-Metrics',
      ...options.headers
    },
    ...options
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * ワークフロー実行情報を取得
 */
async function getWorkflowRunInfo() {
  if (!GITHUB_RUN_ID || !GITHUB_REPOSITORY) {
    console.log('ℹ️ GitHub Actions環境外での実行のため、ワークフロー情報をスキップ');
    return null;
  }

  try {
    const [owner, repo] = GITHUB_REPOSITORY.split('/');
    const run = await callGitHubAPI(`/repos/${owner}/${repo}/actions/runs/${GITHUB_RUN_ID}`);
    
    return {
      id: run.id,
      name: run.name,
      status: run.status,
      conclusion: run.conclusion,
      created_at: run.created_at,
      updated_at: run.updated_at,
      run_started_at: run.run_started_at,
      html_url: run.html_url,
      head_sha: run.head_sha,
      head_branch: run.head_branch,
      event: run.event,
      actor: run.actor?.login
    };
  } catch (error) {
    console.error('❌ Failed to get workflow run info:', error.message);
    return null;
  }
}

/**
 * ワークフロージョブ情報を取得
 */
async function getWorkflowJobs() {
  if (!GITHUB_RUN_ID || !GITHUB_REPOSITORY) {
    return [];
  }

  try {
    const [owner, repo] = GITHUB_REPOSITORY.split('/');
    const jobs = await callGitHubAPI(`/repos/${owner}/${repo}/actions/runs/${GITHUB_RUN_ID}/jobs`);
    
    return jobs.jobs.map(job => ({
      id: job.id,
      name: job.name,
      status: job.status,
      conclusion: job.conclusion,
      created_at: job.created_at,
      started_at: job.started_at,
      completed_at: job.completed_at,
      duration_ms: job.completed_at && job.started_at 
        ? new Date(job.completed_at) - new Date(job.started_at)
        : null,
      steps: job.steps?.map(step => ({
        name: step.name,
        status: step.status,
        conclusion: step.conclusion,
        started_at: step.started_at,
        completed_at: step.completed_at,
        duration_ms: step.completed_at && step.started_at
          ? new Date(step.completed_at) - new Date(step.started_at)
          : null
      })) || []
    }));
  } catch (error) {
    console.error('❌ Failed to get workflow jobs:', error.message);
    return [];
  }
}

/**
 * デプロイメント情報を取得
 */
async function getDeploymentInfo() {
  if (!GITHUB_REPOSITORY || !GITHUB_SHA) {
    return null;
  }

  try {
    const [owner, repo] = GITHUB_REPOSITORY.split('/');
    const deployments = await callGitHubAPI(`/repos/${owner}/${repo}/deployments?sha=${GITHUB_SHA}&per_page=5`);
    
    if (deployments.length === 0) {
      return null;
    }

    const deployment = deployments[0];
    const statuses = await callGitHubAPI(`/repos/${owner}/${repo}/deployments/${deployment.id}/statuses`);
    
    return {
      id: deployment.id,
      sha: deployment.sha,
      ref: deployment.ref,
      environment: deployment.environment,
      created_at: deployment.created_at,
      updated_at: deployment.updated_at,
      statuses: statuses.map(status => ({
        state: status.state,
        description: status.description,
        target_url: status.target_url,
        created_at: status.created_at
      }))
    };
  } catch (error) {
    console.error('❌ Failed to get deployment info:', error.message);
    return null;
  }
}

/**
 * ビルド時間を測定
 */
function measureBuildTime() {
  const buildLogPath = path.join(process.cwd(), 'apps/web/.next/build-manifest.json');
  
  if (!fs.existsSync(buildLogPath)) {
    return null;
  }

  try {
    const stats = fs.statSync(buildLogPath);
    return {
      build_completed_at: stats.mtime.toISOString(),
      build_size_bytes: stats.size
    };
  } catch (error) {
    console.error('❌ Failed to measure build time:', error.message);
    return null;
  }
}

/**
 * テスト結果を取得
 */
function getTestResults() {
  const testResultsPath = path.join(process.cwd(), 'apps/web/coverage/coverage-summary.json');
  
  if (!fs.existsSync(testResultsPath)) {
    return null;
  }

  try {
    const coverage = JSON.parse(fs.readFileSync(testResultsPath, 'utf8'));
    return {
      lines: coverage.total.lines.pct,
      statements: coverage.total.statements.pct,
      functions: coverage.total.functions.pct,
      branches: coverage.total.branches.pct
    };
  } catch (error) {
    console.error('❌ Failed to get test results:', error.message);
    return null;
  }
}

/**
 * メトリクスを収集
 */
async function collectMetrics() {
  console.log('📊 CI/CDメトリクスを収集中...');

  const timestamp = new Date().toISOString();
  const runId = GITHUB_RUN_ID || `local-${Date.now()}`;
  
  const metrics = {
    timestamp,
    run_id: runId,
    workflow: GITHUB_WORKFLOW || 'local',
    job: GITHUB_JOB || 'local',
    sha: GITHUB_SHA || 'unknown',
    branch: GITHUB_REF_NAME || 'unknown',
    workflow_run: null,
    jobs: [],
    deployment: null,
    build: null,
    test_coverage: null,
    environment: {
      node_version: process.version,
      platform: process.platform,
      arch: process.arch,
      ci: !!process.env.CI
    }
  };

  try {
    // ワークフロー実行情報を取得
    metrics.workflow_run = await getWorkflowRunInfo();
    
    // ジョブ情報を取得
    metrics.jobs = await getWorkflowJobs();
    
    // デプロイメント情報を取得
    metrics.deployment = await getDeploymentInfo();
    
    // ビルド情報を取得
    metrics.build = measureBuildTime();
    
    // テスト結果を取得
    metrics.test_coverage = getTestResults();

    console.log('✅ メトリクス収集完了');
    return metrics;
  } catch (error) {
    console.error('❌ メトリクス収集エラー:', error.message);
    metrics.error = error.message;
    return metrics;
  }
}

/**
 * メトリクスを保存
 */
function saveMetrics(metrics) {
  ensureMetricsDir();
  
  const filename = `ci-metrics-${metrics.run_id}-${Date.now()}.json`;
  const filepath = path.join(METRICS_DIR, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(metrics, null, 2));
  console.log(`💾 メトリクスを保存: ${filepath}`);
  
  // 最新のメトリクスファイルへのシンボリックリンクを作成
  const latestPath = path.join(METRICS_DIR, 'latest.json');
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
 * 古いメトリクスファイルをクリーンアップ
 */
function cleanupOldMetrics() {
  if (!fs.existsSync(METRICS_DIR)) {
    return;
  }

  const files = fs.readdirSync(METRICS_DIR)
    .filter(f => f.startsWith('ci-metrics-') && f.endsWith('.json'))
    .map(f => ({
      name: f,
      path: path.join(METRICS_DIR, f),
      mtime: fs.statSync(path.join(METRICS_DIR, f)).mtime
    }))
    .sort((a, b) => b.mtime - a.mtime);

  // 最新50件を保持、それ以外は削除
  const filesToDelete = files.slice(50);
  
  filesToDelete.forEach(file => {
    try {
      fs.unlinkSync(file.path);
      console.log(`🗑️ 古いメトリクスファイルを削除: ${file.name}`);
    } catch (error) {
      console.error(`❌ ファイル削除エラー: ${file.name}`, error.message);
    }
  });
}

/**
 * メイン処理
 */
async function main() {
  try {
    const metrics = await collectMetrics();
    saveMetrics(metrics);
    cleanupOldMetrics();
    
    console.log('🎉 CI/CDメトリクス収集が完了しました');
  } catch (error) {
    console.error('❌ メトリクス収集に失敗:', error.message);
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

export { collectMetrics, saveMetrics, cleanupOldMetrics };