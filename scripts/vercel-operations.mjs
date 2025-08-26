#!/usr/bin/env node

/**
 * Vercel Operations Script
 * Vercel CLIを使用した自動化スクリプト
 */

import { execSync } from 'child_process';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

class VercelOperations {
  constructor() {
    this.reportsDir = join(process.cwd(), '.kiro', 'reports');
    mkdirSync(this.reportsDir, { recursive: true });
  }

  /**
   * Vercel CLIコマンドを実行
   */
  execVercel(command, options = {}) {
    try {
      console.log(`🚀 実行中: vercel ${command}`);
      const result = execSync(`vercel ${command}`, {
        encoding: 'utf8',
        stdio: options.silent ? 'pipe' : 'inherit',
        ...options
      });
      return result;
    } catch (error) {
      console.error(`❌ エラー: vercel ${command}`);
      console.error(error.message);
      throw error;
    }
  }

  /**
   * デプロイメント一覧を取得
   */
  async listDeployments(limit = 10) {
    console.log('\n📋 デプロイメント一覧取得');
    try {
      const result = this.execVercel('ls', { silent: true });
      console.log(result);
      return result;
    } catch (error) {
      console.error('デプロイメント一覧の取得に失敗しました');
      return null;
    }
  }

  /**
   * プロジェクト一覧を取得
   */
  async listProjects() {
    console.log('\n📁 プロジェクト一覧取得');
    try {
      const result = this.execVercel('project ls', { silent: true });
      console.log(result);
      return result;
    } catch (error) {
      console.error('プロジェクト一覧の取得に失敗しました');
      return null;
    }
  }

  /**
   * ドメイン一覧を取得
   */
  async listDomains() {
    console.log('\n🌐 ドメイン一覧取得');
    try {
      const result = this.execVercel('domains ls', { silent: true });
      console.log(result);
      return result;
    } catch (error) {
      console.error('ドメイン一覧の取得に失敗しました');
      return null;
    }
  }

  /**
   * 環境変数一覧を取得
   */
  async listEnvVars() {
    console.log('\n🔐 環境変数一覧取得');
    try {
      const result = this.execVercel('env ls', { silent: true });
      console.log(result);
      return result;
    } catch (error) {
      console.error('環境変数一覧の取得に失敗しました');
      return null;
    }
  }

  /**
   * プロジェクト情報を取得
   */
  async getProjectInfo() {
    console.log('\n📊 プロジェクト情報取得');
    try {
      const result = this.execVercel('project', { silent: true });
      console.log(result);
      return result;
    } catch (error) {
      console.error('プロジェクト情報の取得に失敗しました');
      return null;
    }
  }

  /**
   * デプロイメント状況の監視
   */
  async monitorDeployments() {
    console.log('\n👀 デプロイメント監視開始');
    
    const data = {
      timestamp: new Date().toISOString(),
      deployments: null,
      projects: null,
      domains: null,
      envVars: null,
      projectInfo: null
    };

    // 各種情報を取得
    data.deployments = await this.listDeployments(5);
    data.projects = await this.listProjects();
    data.domains = await this.listDomains();
    data.envVars = await this.listEnvVars();
    data.projectInfo = await this.getProjectInfo();

    // レポート生成
    const reportPath = join(this.reportsDir, `vercel-status-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    writeFileSync(reportPath, JSON.stringify(data, null, 2));
    
    console.log(`\n📄 レポート生成: ${reportPath}`);
    return data;
  }

  /**
   * 緊急時のロールバック
   */
  async rollback(deploymentUrl) {
    console.log(`\n🔄 ロールバック実行: ${deploymentUrl}`);
    
    if (!deploymentUrl) {
      console.error('❌ デプロイメントURLが必要です');
      return false;
    }

    try {
      // 指定されたデプロイメントにプロモート
      this.execVercel(`promote ${deploymentUrl}`);
      console.log('✅ ロールバック完了');
      return true;
    } catch (error) {
      console.error('❌ ロールバック失敗');
      return false;
    }
  }

  /**
   * ヘルスチェック
   */
  async healthCheck() {
    console.log('\n🏥 Vercelヘルスチェック');
    
    const checks = {
      cli: false,
      auth: false,
      project: false,
      deployments: false
    };

    try {
      // CLI存在確認
      execSync('which vercel', { stdio: 'pipe' });
      checks.cli = true;
      console.log('✅ Vercel CLI: インストール済み');
    } catch {
      console.log('❌ Vercel CLI: 未インストール');
    }

    try {
      // 認証確認
      this.execVercel('whoami', { silent: true });
      checks.auth = true;
      console.log('✅ 認証: 成功');
    } catch {
      console.log('❌ 認証: 失敗');
    }

    try {
      // プロジェクト確認
      this.execVercel('project', { silent: true });
      checks.project = true;
      console.log('✅ プロジェクト: 接続済み');
    } catch {
      console.log('❌ プロジェクト: 未接続');
    }

    try {
      // デプロイメント確認
      this.execVercel('ls', { silent: true });
      checks.deployments = true;
      console.log('✅ デプロイメント: アクセス可能');
    } catch {
      console.log('❌ デプロイメント: アクセス不可');
    }

    return checks;
  }

  /**
   * 使用方法を表示
   */
  showUsage() {
    console.log(`
🚀 Vercel Operations Script

## 基本コマンド

### 情報取得
node scripts/vercel-operations.mjs --deployments    # デプロイメント一覧
node scripts/vercel-operations.mjs --projects       # プロジェクト一覧  
node scripts/vercel-operations.mjs --domains        # ドメイン一覧
node scripts/vercel-operations.mjs --env            # 環境変数一覧
node scripts/vercel-operations.mjs --info           # プロジェクト情報

### 監視・管理
node scripts/vercel-operations.mjs --monitor        # 全体監視
node scripts/vercel-operations.mjs --health         # ヘルスチェック
node scripts/vercel-operations.mjs --rollback URL   # ロールバック

### 前提条件
1. Vercel CLIのインストール: npm i -g vercel
2. 認証: vercel login
3. プロジェクト接続: vercel link

## 自動化例

### package.jsonに追加
{
  "scripts": {
    "vercel:status": "node scripts/vercel-operations.mjs --monitor",
    "vercel:health": "node scripts/vercel-operations.mjs --health",
    "vercel:rollback": "node scripts/vercel-operations.mjs --rollback"
  }
}

### 定期監視（cron）
# 毎時間実行
0 * * * * cd /path/to/project && npm run vercel:status
`);
  }
}

// メイン実行
async function main() {
  const ops = new VercelOperations();
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.length === 0) {
    ops.showUsage();
    return;
  }

  if (args.includes('--health')) {
    await ops.healthCheck();
    return;
  }

  if (args.includes('--monitor')) {
    await ops.monitorDeployments();
    return;
  }

  if (args.includes('--deployments')) {
    await ops.listDeployments();
    return;
  }

  if (args.includes('--projects')) {
    await ops.listProjects();
    return;
  }

  if (args.includes('--domains')) {
    await ops.listDomains();
    return;
  }

  if (args.includes('--env')) {
    await ops.listEnvVars();
    return;
  }

  if (args.includes('--info')) {
    await ops.getProjectInfo();
    return;
  }

  if (args.includes('--rollback')) {
    const urlIndex = args.indexOf('--rollback') + 1;
    const url = args[urlIndex];
    await ops.rollback(url);
    return;
  }

  console.log('❌ 不明なオプションです。--help で使用方法を確認してください。');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default VercelOperations;