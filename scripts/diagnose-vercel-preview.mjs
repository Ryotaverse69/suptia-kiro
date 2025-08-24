#!/usr/bin/env node

/**
 * Vercel Preview問題診断スクリプト
 * devプッシュでPreviewが出ない原因を特定する
 */

import { execSync } from 'child_process';
import fs from 'fs';

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

// 診断結果を格納
const diagnostics = {
  issues: [],
  recommendations: [],
  status: 'unknown'
};

/**
 * Vercel設定ファイルの診断
 */
function diagnoseVercelConfig() {
  logHeader('Vercel設定ファイル診断');

  try {
    // vercel.json の存在確認
    if (!fs.existsSync('vercel.json')) {
      diagnostics.issues.push('vercel.json ファイルが見つかりません');
      logError('vercel.json ファイルが見つかりません');
      return false;
    }

    const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
    logSuccess('vercel.json ファイルが存在します');

    // Git設定の確認
    if (!vercelConfig.git) {
      diagnostics.issues.push('vercel.json に git 設定がありません');
      logError('git 設定が見つかりません');
    } else if (!vercelConfig.git.deploymentEnabled) {
      diagnostics.issues.push('deploymentEnabled 設定がありません');
      logError('deploymentEnabled 設定がありません');
    } else if (!vercelConfig.git.deploymentEnabled.dev) {
      diagnostics.issues.push('dev ブランチのデプロイが無効になっています');
      logError('dev ブランチのデプロイが無効です');
    } else {
      logSuccess('dev ブランチのデプロイが有効です');
    }

    // GitHub設定の確認
    if (vercelConfig.github) {
      if (vercelConfig.github.silent === true) {
        diagnostics.issues.push('GitHub通知が無効になっています');
        logWarning('GitHub通知が無効です（silent: true）');
      } else {
        logSuccess('GitHub通知が有効です');
      }

      if (vercelConfig.github.autoAlias === false) {
        logInfo('autoAlias が無効です（これは正常です）');
      }
    }

    return true;
  } catch (error) {
    diagnostics.issues.push(`vercel.json 読み込みエラー: ${error.message}`);
    logError(`vercel.json 読み込みエラー: ${error.message}`);
    return false;
  }
}

/**
 * GitHub Actions設定の診断
 */
function diagnoseGitHubActions() {
  logHeader('GitHub Actions設定診断');

  const workflowFiles = [
    '.github/workflows/ci.yml',
    '.github/workflows/ci-optimized.yml'
  ];

  let hasPreviewJob = false;

  for (const workflowFile of workflowFiles) {
    if (fs.existsSync(workflowFile)) {
      logSuccess(`${workflowFile} が存在します`);
      
      const content = fs.readFileSync(workflowFile, 'utf8');
      
      // Preview関連のジョブがあるかチェック
      if (content.includes('preview-deployment') || content.includes('get-preview-url')) {
        hasPreviewJob = true;
        logSuccess(`${workflowFile} にPreview関連のジョブがあります`);
      }

      // dev ブランチでのトリガーがあるかチェック
      if (content.includes('branches: [master, dev]') || content.includes('- dev')) {
        logSuccess(`${workflowFile} でdev ブランチがトリガーに含まれています`);
      } else {
        diagnostics.issues.push(`${workflowFile} でdev ブランチがトリガーに含まれていません`);
        logWarning(`${workflowFile} でdev ブランチがトリガーに含まれていません`);
      }
    }
  }

  if (!hasPreviewJob) {
    diagnostics.issues.push('GitHub ActionsにPreview URL取得ジョブがありません');
    logError('Preview URL取得ジョブが見つかりません');
  }
}

/**
 * 環境変数の診断
 */
function diagnoseEnvironmentVariables() {
  logHeader('環境変数診断');

  const requiredVars = [
    'VERCEL_TOKEN',
    'VERCEL_PROJECT_ID'
  ];

  for (const varName of requiredVars) {
    if (process.env[varName]) {
      logSuccess(`${varName} が設定されています`);
    } else {
      diagnostics.issues.push(`${varName} 環境変数が設定されていません`);
      logError(`${varName} が設定されていません`);
    }
  }

  // GitHub Secrets の確認（実際には確認できないので推奨事項として記録）
  diagnostics.recommendations.push('GitHub SecretsでVERCEL_TOKENが正しく設定されているか確認してください');
  diagnostics.recommendations.push('Vercel Project IDが正しいか確認してください');
}

/**
 * Git設定の診断
 */
function diagnoseGitConfiguration() {
  logHeader('Git設定診断');

  try {
    // 現在のブランチ確認
    const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    logInfo(`現在のブランチ: ${currentBranch}`);

    // リモートリポジトリ確認
    const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
    logInfo(`リモートリポジトリ: ${remoteUrl}`);

    // dev ブランチの存在確認
    const branches = execSync('git branch -a', { encoding: 'utf8' });
    if (branches.includes('dev')) {
      logSuccess('dev ブランチが存在します');
    } else {
      diagnostics.issues.push('dev ブランチが存在しません');
      logError('dev ブランチが存在しません');
    }

    // 最新のコミット確認
    const latestCommit = execSync('git log -1 --oneline', { encoding: 'utf8' }).trim();
    logInfo(`最新のコミット: ${latestCommit}`);

  } catch (error) {
    diagnostics.issues.push(`Git設定エラー: ${error.message}`);
    logError(`Git設定エラー: ${error.message}`);
  }
}

/**
 * Vercel API接続テスト
 */
async function testVercelAPI() {
  logHeader('Vercel API接続テスト');

  const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
  const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID || 'prj_NWkcnXBay0NvP9FEZUuXAICo0514';

  if (!VERCEL_TOKEN) {
    logError('VERCEL_TOKEN が設定されていないため、API接続テストをスキップします');
    return;
  }

  try {
    // プロジェクト情報取得テスト
    const projectResponse = await fetch(`https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}`, {
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (projectResponse.ok) {
      const project = await projectResponse.json();
      logSuccess(`プロジェクト接続成功: ${project.name}`);
      
      // Git設定確認
      if (project.link && project.link.type === 'github') {
        logSuccess(`GitHub連携が設定されています: ${project.link.repo}`);
      } else {
        diagnostics.issues.push('VercelプロジェクトにGitHub連携が設定されていません');
        logError('GitHub連携が設定されていません');
      }
    } else {
      diagnostics.issues.push(`Vercel API接続エラー: ${projectResponse.status}`);
      logError(`プロジェクト情報取得失敗: ${projectResponse.status}`);
    }

    // 最近のデプロイメント確認
    const deploymentsResponse = await fetch(
      `https://api.vercel.com/v6/deployments?projectId=${VERCEL_PROJECT_ID}&limit=5`,
      {
        headers: {
          'Authorization': `Bearer ${VERCEL_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (deploymentsResponse.ok) {
      const deployments = await deploymentsResponse.json();
      logSuccess(`最近のデプロイメント数: ${deployments.deployments.length}`);
      
      const devDeployments = deployments.deployments.filter(d => 
        d.meta && d.meta.githubCommitRef === 'dev'
      );
      
      if (devDeployments.length > 0) {
        logSuccess(`dev ブランチのデプロイメントが見つかりました: ${devDeployments.length}件`);
      } else {
        diagnostics.issues.push('dev ブランチのデプロイメントが見つかりません');
        logWarning('dev ブランチのデプロイメントが見つかりません');
      }
    }

  } catch (error) {
    diagnostics.issues.push(`Vercel API接続エラー: ${error.message}`);
    logError(`Vercel API接続エラー: ${error.message}`);
  }
}

/**
 * 推奨修正案の生成
 */
function generateRecommendations() {
  logHeader('推奨修正案');

  if (diagnostics.issues.length === 0) {
    logSuccess('問題は見つかりませんでした');
    diagnostics.status = 'healthy';
    return;
  }

  diagnostics.status = 'issues_found';

  // 具体的な修正案を生成
  if (diagnostics.issues.some(issue => issue.includes('vercel.json'))) {
    diagnostics.recommendations.push('vercel.json を正しく設定してください');
  }

  if (diagnostics.issues.some(issue => issue.includes('dev ブランチのデプロイが無効'))) {
    diagnostics.recommendations.push('vercel.json で dev ブランチのデプロイを有効にしてください');
  }

  if (diagnostics.issues.some(issue => issue.includes('Preview URL取得ジョブ'))) {
    diagnostics.recommendations.push('GitHub Actions に Preview URL 取得ジョブを追加してください');
  }

  if (diagnostics.issues.some(issue => issue.includes('VERCEL_TOKEN'))) {
    diagnostics.recommendations.push('GitHub Secrets に VERCEL_TOKEN を設定してください');
  }

  if (diagnostics.issues.some(issue => issue.includes('GitHub連携'))) {
    diagnostics.recommendations.push('Vercel プロジェクトで GitHub 連携を設定してください');
  }

  // 推奨事項を表示
  diagnostics.recommendations.forEach((rec, index) => {
    log(`${index + 1}. ${rec}`, colors.yellow);
  });
}

/**
 * メイン診断処理
 */
async function main() {
  log(`${colors.bold}Vercel Preview 問題診断開始${colors.reset}`, colors.blue);
  log(`実行時刻: ${new Date().toLocaleString('ja-JP')}\n`);

  // 各種診断実行
  diagnoseVercelConfig();
  diagnoseGitHubActions();
  diagnoseEnvironmentVariables();
  diagnoseGitConfiguration();
  await testVercelAPI();
  generateRecommendations();

  // 結果サマリー
  logHeader('診断結果サマリー');
  log(`🔍 発見された問題: ${diagnostics.issues.length}件`, diagnostics.issues.length > 0 ? colors.red : colors.green);
  log(`💡 推奨事項: ${diagnostics.recommendations.length}件`, colors.yellow);
  log(`📊 全体ステータス: ${diagnostics.status}`, diagnostics.status === 'healthy' ? colors.green : colors.red);

  if (diagnostics.issues.length > 0) {
    logHeader('発見された問題');
    diagnostics.issues.forEach((issue, index) => {
      log(`${index + 1}. ${issue}`, colors.red);
    });
  }

  // 結果をファイルに保存
  const reportPath = 'vercel-preview-diagnosis.json';
  const report = {
    timestamp: new Date().toISOString(),
    status: diagnostics.status,
    issues: diagnostics.issues,
    recommendations: diagnostics.recommendations,
    summary: {
      issuesCount: diagnostics.issues.length,
      recommendationsCount: diagnostics.recommendations.length
    }
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  logInfo(`診断レポートを保存しました: ${reportPath}`);

  // 終了コード設定
  if (diagnostics.issues.length > 0) {
    logError('\n問題が発見されました。上記の推奨事項に従って修正してください。');
    process.exit(1);
  } else {
    logSuccess('\n診断完了：問題は見つかりませんでした。');
    process.exit(0);
  }
}

// スクリプト実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { main as diagnoseVercelPreview };