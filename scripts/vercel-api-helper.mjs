#!/usr/bin/env node

/**
 * Vercel API Helper
 * fetchサーバーを使用してVercel APIを呼び出すヘルパー関数
 */

import { readFileSync } from 'fs';
import { join } from 'path';

class VercelAPIHelper {
  constructor() {
    this.baseUrl = 'https://api.vercel.com';
    this.token = process.env.VERCEL_TOKEN;
    
    if (!this.token) {
      console.warn('⚠️ VERCEL_TOKEN環境変数が設定されていません');
    }
  }

  /**
   * Vercel APIの基本ヘッダーを取得
   */
  getHeaders() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * デプロイメント一覧を取得
   * 
   * @param {string} projectId - プロジェクトID
   * @param {Object} options - オプション
   * @param {string} options.branch - ブランチ名
   * @param {string} options.state - デプロイメント状態
   * @param {number} options.limit - 取得件数（デフォルト: 5）
   */
  async listDeployments(projectId, options = {}) {
    const { branch, state, limit = 5 } = options;
    
    let url = `${this.baseUrl}/v6/deployments`;
    const params = new URLSearchParams();
    
    if (projectId) params.append('projectId', projectId);
    if (branch) params.append('branch', branch);
    if (state) params.append('state', state);
    params.append('limit', limit.toString());
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    console.log(`📡 Vercel API呼び出し: GET ${url}`);
    console.log('💡 fetchサーバーを使用してください:');
    console.log(`mcp_fetch_fetch({ url: "${url}", headers: ${JSON.stringify(this.getHeaders())} })`);
    
    return {
      url,
      headers: this.getHeaders(),
      method: 'GET'
    };
  }

  /**
   * デプロイメント詳細を取得
   * 
   * @param {string} deploymentId - デプロイメントID
   */
  async getDeployment(deploymentId) {
    const url = `${this.baseUrl}/v13/deployments/${deploymentId}`;
    
    console.log(`📡 Vercel API呼び出し: GET ${url}`);
    console.log('💡 fetchサーバーを使用してください:');
    console.log(`mcp_fetch_fetch({ url: "${url}", headers: ${JSON.stringify(this.getHeaders())} })`);
    
    return {
      url,
      headers: this.getHeaders(),
      method: 'GET'
    };
  }

  /**
   * プロジェクト情報を取得
   * 
   * @param {string} projectId - プロジェクトID
   */
  async getProject(projectId) {
    const url = `${this.baseUrl}/v9/projects/${projectId}`;
    
    console.log(`📡 Vercel API呼び出し: GET ${url}`);
    console.log('💡 fetchサーバーを使用してください:');
    console.log(`mcp_fetch_fetch({ url: "${url}", headers: ${JSON.stringify(this.getHeaders())} })`);
    
    return {
      url,
      headers: this.getHeaders(),
      method: 'GET'
    };
  }

  /**
   * ドメイン一覧を取得
   * 
   * @param {string} projectId - プロジェクトID
   */
  async listDomains(projectId) {
    const url = `${this.baseUrl}/v9/projects/${projectId}/domains`;
    
    console.log(`📡 Vercel API呼び出し: GET ${url}`);
    console.log('💡 fetchサーバーを使用してください:');
    console.log(`mcp_fetch_fetch({ url: "${url}", headers: ${JSON.stringify(this.getHeaders())} })`);
    
    return {
      url,
      headers: this.getHeaders(),
      method: 'GET'
    };
  }

  /**
   * 環境変数一覧を取得
   * 
   * @param {string} projectId - プロジェクトID
   */
  async envList(projectId) {
    const url = `${this.baseUrl}/v9/projects/${projectId}/env`;
    
    console.log(`📡 Vercel API呼び出し: GET ${url}`);
    console.log('💡 fetchサーバーを使用してください:');
    console.log(`mcp_fetch_fetch({ url: "${url}", headers: ${JSON.stringify(this.getHeaders())} })`);
    
    return {
      url,
      headers: this.getHeaders(),
      method: 'GET'
    };
  }

  /**
   * 使用例を表示
   */
  showExamples() {
    console.log(`
🚀 Vercel API Helper 使用例

## 基本的な使い方

1. 環境変数を設定:
   export VERCEL_TOKEN="your-vercel-token"

2. プロジェクトIDを確認:
   - Vercelダッシュボードから取得
   - または \`vercel project ls\` コマンドで確認

3. このヘルパーを使用してAPI呼び出し情報を取得:
   node scripts/vercel-api-helper.mjs

## 実際のAPI呼び出し例

### デプロイメント一覧取得
\`\`\`javascript
const helper = new VercelAPIHelper();
const request = await helper.listDeployments('your-project-id', { limit: 10 });
// fetchサーバーで実行:
// mcp_fetch_fetch({ url: request.url, headers: request.headers })
\`\`\`

### プロジェクト情報取得
\`\`\`javascript
const request = await helper.getProject('your-project-id');
// fetchサーバーで実行:
// mcp_fetch_fetch({ url: request.url, headers: request.headers })
\`\`\`

## 注意事項

- VERCEL_TOKEN環境変数が必要
- api.vercel.comはドメインホワイトリストに追加済み
- 読み取り系操作のみ（書き込み系は手動実装が必要）
`);
  }
}

// メイン実行
async function main() {
  const helper = new VercelAPIHelper();
  
  if (process.argv.includes('--examples')) {
    helper.showExamples();
    return;
  }

  // 簡単なテスト実行
  console.log('🔧 Vercel API Helper テスト\n');
  
  const projectId = 'your-project-id'; // 実際のプロジェクトIDに置き換え
  
  console.log('1. デプロイメント一覧取得:');
  await helper.listDeployments(projectId);
  
  console.log('\n2. プロジェクト情報取得:');
  await helper.getProject(projectId);
  
  console.log('\n3. ドメイン一覧取得:');
  await helper.listDomains(projectId);
  
  console.log('\n4. 環境変数一覧取得:');
  await helper.envList(projectId);
  
  console.log('\n💡 実際のAPI呼び出しは上記のfetchサーバー呼び出しを使用してください');
}

// スクリプトが直接実行された場合のみmainを実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default VercelAPIHelper;