#!/usr/bin/env node

/**
 * Vercel MCP Server Test Script
 * Vercel MCPサーバーの動作テストと結果レポート生成
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class VercelMCPTester {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      testSuite: 'Vercel MCP Server',
      tests: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0
      }
    };
  }

  /**
   * テスト結果を記録
   */
  recordTest(name, status, message, details = {}) {
    const test = {
      name,
      status, // 'passed', 'failed', 'skipped'
      message,
      details,
      timestamp: new Date().toISOString()
    };

    this.results.tests.push(test);
    this.results.summary.total++;
    this.results.summary[status]++;

    console.log(`${status === 'passed' ? '✅' : status === 'failed' ? '❌' : '⏭️'} ${name}: ${message}`);
  }

  /**
   * 成功系テスト: 読み取り系操作
   */
  async testReadOperations() {
    console.log('\n🔍 読み取り系操作のテスト');

    // listDeployments テスト
    try {
      // 実際のMCPサーバーが利用可能でない場合はスキップ
      this.recordTest(
        'listDeployments',
        'skipped',
        'MCPサーバー未実装のためスキップ',
        { 
          expectedBehavior: 'プロジェクトのデプロイメント一覧を取得',
          autoApprove: true 
        }
      );
    } catch (error) {
      this.recordTest('listDeployments', 'failed', error.message);
    }

    // getProject テスト
    this.recordTest(
      'getProject',
      'skipped',
      'MCPサーバー未実装のためスキップ',
      { 
        expectedBehavior: 'プロジェクト詳細情報を取得',
        autoApprove: true 
      }
    );

    // listDomains テスト
    this.recordTest(
      'listDomains',
      'skipped',
      'MCPサーバー未実装のためスキップ',
      { 
        expectedBehavior: 'プロジェクトのドメイン一覧を取得',
        autoApprove: true 
      }
    );

    // envList テスト
    this.recordTest(
      'envList',
      'skipped',
      'MCPサーバー未実装のためスキップ',
      { 
        expectedBehavior: '環境変数一覧を取得',
        autoApprove: true 
      }
    );
  }

  /**
   * 失敗系テスト: エラーハンドリング
   */
  async testErrorHandling() {
    console.log('\n🚨 エラーハンドリングのテスト');

    // 認証なしテスト
    this.recordTest(
      'authentication_missing',
      'skipped',
      'MCPサーバー未実装のためスキップ',
      { 
        expectedBehavior: '401 Unauthorized エラーを適切にハンドリング',
        expectedError: 'VERCEL_TOKEN環境変数が未設定' 
      }
    );

    // 403 Forbidden テスト
    this.recordTest(
      'authorization_failed',
      'skipped',
      'MCPサーバー未実装のためスキップ',
      { 
        expectedBehavior: '403 Forbidden エラーを適切にハンドリング',
        expectedError: 'プロジェクトへのアクセス権限なし' 
      }
    );

    // 429 Rate Limit テスト
    this.recordTest(
      'rate_limit_exceeded',
      'skipped',
      'MCPサーバー未実装のためスキップ',
      { 
        expectedBehavior: '429 Too Many Requests エラーを適切にハンドリング',
        expectedError: 'API レート制限に達しました' 
      }
    );
  }

  /**
   * 設定テスト: MCP設定の検証
   */
  async testConfiguration() {
    console.log('\n⚙️ MCP設定のテスト');

    try {
      // MCP設定ファイルの存在確認
      const { readFileSync } = await import('fs');
      const mcpConfig = JSON.parse(readFileSync('.kiro/settings/mcp.json', 'utf8'));
      
      if (mcpConfig.mcpServers['vercel-mcp']) {
        this.recordTest(
          'mcp_config_exists',
          'passed',
          'vercel-mcp設定が正しく存在する',
          { config: mcpConfig.mcpServers['vercel-mcp'] }
        );

        // 自動承認設定の確認
        const autoApprove = mcpConfig.mcpServers['vercel-mcp'].autoApprove;
        const expectedAutoApprove = ['listDeployments', 'getDeployment', 'getProject', 'listDomains', 'envList'];
        
        const isCorrect = expectedAutoApprove.every(op => autoApprove.includes(op)) &&
                         !autoApprove.includes('addDomain') &&
                         !autoApprove.includes('envSet');

        this.recordTest(
          'auto_approve_config',
          isCorrect ? 'passed' : 'failed',
          isCorrect ? '自動承認設定が正しい' : '自動承認設定に問題あり',
          { 
            expected: expectedAutoApprove,
            actual: autoApprove,
            manualApproveRequired: ['addDomain', 'envSet']
          }
        );
      } else {
        this.recordTest(
          'mcp_config_exists',
          'failed',
          'vercel-mcp設定が見つからない'
        );
      }
    } catch (error) {
      this.recordTest(
        'mcp_config_exists',
        'failed',
        `MCP設定ファイルの読み取りエラー: ${error.message}`
      );
    }

    // ドメインホワイトリストの確認
    try {
      const { readFileSync } = await import('fs');
      const whitelistContent = readFileSync('apps/web/src/lib/agent/domain-whitelist.ts', 'utf8');
      
      if (whitelistContent.includes('api.vercel.com')) {
        this.recordTest(
          'domain_whitelist_updated',
          'passed',
          'api.vercel.com がドメインホワイトリストに追加済み'
        );
      } else {
        this.recordTest(
          'domain_whitelist_updated',
          'failed',
          'api.vercel.com がドメインホワイトリストに未追加'
        );
      }
    } catch (error) {
      this.recordTest(
        'domain_whitelist_updated',
        'failed',
        `ドメインホワイトリストの確認エラー: ${error.message}`
      );
    }
  }

  /**
   * すべてのテストを実行
   */
  async runAllTests() {
    console.log('🚀 Vercel MCP Server テスト開始\n');

    await this.testConfiguration();
    await this.testReadOperations();
    await this.testErrorHandling();

    console.log('\n📊 テスト結果サマリー:');
    console.log(`総テスト数: ${this.results.summary.total}`);
    console.log(`✅ 成功: ${this.results.summary.passed}`);
    console.log(`❌ 失敗: ${this.results.summary.failed}`);
    console.log(`⏭️ スキップ: ${this.results.summary.skipped}`);

    return this.results;
  }

  /**
   * レポートをMarkdown形式で生成
   */
  generateMarkdownReport() {
    const { summary, tests, timestamp } = this.results;
    
    let markdown = `# Vercel MCP Server テストレポート

## 概要

- **実行日時**: ${timestamp}
- **総テスト数**: ${summary.total}
- **成功**: ${summary.passed}
- **失敗**: ${summary.failed}
- **スキップ**: ${summary.skipped}

## テスト結果詳細

`;

    tests.forEach(test => {
      const statusIcon = test.status === 'passed' ? '✅' : test.status === 'failed' ? '❌' : '⏭️';
      markdown += `### ${statusIcon} ${test.name}

- **ステータス**: ${test.status}
- **メッセージ**: ${test.message}
- **実行時刻**: ${test.timestamp}

`;

      if (Object.keys(test.details).length > 0) {
        markdown += `**詳細**:
\`\`\`json
${JSON.stringify(test.details, null, 2)}
\`\`\`

`;
      }
    });

    markdown += `## 推奨事項

### 実装が必要な項目

1. **Vercel MCP Server の実装**
   - \`mcp-vercel-api@latest\` パッケージの作成または既存パッケージの特定
   - Vercel REST API との連携実装

2. **エラーハンドリングの強化**
   - 認証エラー (401) の適切な処理
   - 権限エラー (403) の適切な処理  
   - レート制限エラー (429) の適切な処理

3. **環境変数の設定**
   - \`VERCEL_TOKEN\` の設定
   - 適切なスコープ権限の確認

### セキュリティ考慮事項

- 読み取り系操作 (\`listDeployments\`, \`getProject\`, etc.) は自動承認
- 書き込み系操作 (\`addDomain\`, \`envSet\`) は手動承認必須
- \`api.vercel.com\` のみアクセス許可

---

*このレポートは自動生成されました。*
`;

    return markdown;
  }
}

// メイン実行
async function main() {
  const tester = new VercelMCPTester();
  
  try {
    const results = await tester.runAllTests();
    
    // レポートディレクトリの作成
    const reportsDir = join(process.cwd(), '.kiro', 'reports');
    mkdirSync(reportsDir, { recursive: true });
    
    // Markdownレポートの生成
    const markdownReport = tester.generateMarkdownReport();
    const reportPath = join(reportsDir, 'vercel-mcp-test-report.md');
    writeFileSync(reportPath, markdownReport, 'utf8');
    
    console.log(`\n📄 レポートを生成しました: ${reportPath}`);
    
    // 終了コード
    process.exit(results.summary.failed > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('❌ テスト実行中にエラーが発生しました:', error);
    process.exit(1);
  }
}

// スクリプトが直接実行された場合のみmainを実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default VercelMCPTester;