#!/usr/bin/env node

/**
 * PersonaWarnings統合テスト実行スクリプト
 * 
 * このスクリプトは以下のテストを順次実行します：
 * 1. 基本的な単体テスト
 * 2. 統合テスト
 * 3. アクセシビリティテスト
 * 4. パフォーマンステスト
 * 5. WCAG準拠テスト
 */

import { execSync } from 'child_process';
import { writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const TEST_RESULTS_DIR = join(process.cwd(), 'test-results');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');

// テスト結果ディレクトリを作成
if (!existsSync(TEST_RESULTS_DIR)) {
  execSync(`mkdir -p ${TEST_RESULTS_DIR}`);
}

// テストスイート定義
const testSuites = [
  {
    name: 'Unit Tests',
    pattern: 'PersonaWarnings.test.tsx',
    description: '基本的な単体テスト'
  },
  {
    name: 'Integration Tests', 
    pattern: 'PersonaWarnings.integration.test.tsx',
    description: '実際のSanityデータとの統合テスト'
  },
  {
    name: 'Accessibility Tests',
    pattern: 'PersonaWarnings.accessibility.test.tsx', 
    description: 'アクセシビリティ機能テスト'
  },
  {
    name: 'Performance Tests',
    pattern: 'PersonaWarnings.performance.test.tsx',
    description: 'パフォーマンステスト'
  },
  {
    name: 'WCAG Compliance Tests',
    pattern: 'PersonaWarnings.wcag.test.tsx',
    description: 'WCAG 2.1 AA準拠テスト'
  },
  {
    name: 'End-to-End Integration',
    pattern: 'page.integration.test.tsx',
    description: 'ページ全体のエンドツーエンドテスト'
  }
];

// テスト結果を格納する配列
const results = [];

console.log('🚀 PersonaWarnings統合テスト開始');
console.log('=====================================\n');

// 各テストスイートを実行
for (const suite of testSuites) {
  console.log(`📋 ${suite.name} 実行中...`);
  console.log(`   ${suite.description}`);
  
  const startTime = Date.now();
  
  try {
    // vitestでテストを実行
    const command = `npx vitest run --testNamePattern="${suite.pattern}" --reporter=verbose`;
    const output = execSync(command, { 
      encoding: 'utf8',
      cwd: process.cwd(),
      stdio: 'pipe'
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`   ✅ 成功 (${duration}ms)\n`);
    
    results.push({
      suite: suite.name,
      status: 'PASS',
      duration,
      output: output.substring(0, 1000) // 出力を制限
    });
    
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`   ❌ 失敗 (${duration}ms)`);
    console.log(`   エラー: ${error.message.substring(0, 200)}...\n`);
    
    results.push({
      suite: suite.name,
      status: 'FAIL',
      duration,
      error: error.message.substring(0, 500)
    });
  }
}

// 結果サマリーを生成
console.log('📊 テスト結果サマリー');
console.log('=====================================');

const passedTests = results.filter(r => r.status === 'PASS').length;
const failedTests = results.filter(r => r.status === 'FAIL').length;
const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

console.log(`✅ 成功: ${passedTests}/${results.length}`);
console.log(`❌ 失敗: ${failedTests}/${results.length}`);
console.log(`⏱️  総実行時間: ${totalDuration}ms`);

// 詳細結果を表示
console.log('\n📋 詳細結果:');
results.forEach(result => {
  const status = result.status === 'PASS' ? '✅' : '❌';
  console.log(`${status} ${result.suite}: ${result.duration}ms`);
  if (result.error) {
    console.log(`   エラー: ${result.error}`);
  }
});

// 結果をJSONファイルに保存
const reportData = {
  timestamp: new Date().toISOString(),
  summary: {
    total: results.length,
    passed: passedTests,
    failed: failedTests,
    totalDuration
  },
  results,
  environment: {
    node: process.version,
    platform: process.platform,
    arch: process.arch
  }
};

const reportFile = join(TEST_RESULTS_DIR, `persona-warnings-integration-test-${TIMESTAMP}.json`);
writeFileSync(reportFile, JSON.stringify(reportData, null, 2));

console.log(`\n📄 詳細レポート: ${reportFile}`);

// マークダウンレポートも生成
const markdownReport = generateMarkdownReport(reportData);
const markdownFile = join(TEST_RESULTS_DIR, `persona-warnings-integration-test-${TIMESTAMP}.md`);
writeFileSync(markdownFile, markdownReport);

console.log(`📄 マークダウンレポート: ${markdownFile}`);

// 失敗があった場合は終了コード1で終了
if (failedTests > 0) {
  console.log('\n❌ 一部のテストが失敗しました');
  process.exit(1);
} else {
  console.log('\n🎉 すべてのテストが成功しました！');
  process.exit(0);
}

/**
 * マークダウンレポートを生成
 */
function generateMarkdownReport(data) {
  return `# PersonaWarnings統合テストレポート

## 実行概要

- **実行日時**: ${data.timestamp}
- **総テスト数**: ${data.summary.total}
- **成功**: ${data.summary.passed}
- **失敗**: ${data.summary.failed}
- **総実行時間**: ${data.summary.totalDuration}ms

## 環境情報

- **Node.js**: ${data.environment.node}
- **プラットフォーム**: ${data.environment.platform}
- **アーキテクチャ**: ${data.environment.arch}

## テスト結果詳細

${data.results.map(result => `
### ${result.suite}

- **ステータス**: ${result.status === 'PASS' ? '✅ 成功' : '❌ 失敗'}
- **実行時間**: ${result.duration}ms

${result.error ? `**エラー詳細**:
\`\`\`
${result.error}
\`\`\`` : ''}

${result.output ? `**出力**:
\`\`\`
${result.output}
\`\`\`` : ''}
`).join('\n')}

## 推奨事項

${data.summary.failed > 0 ? `
### 🔧 修正が必要な項目

失敗したテストについて以下を確認してください：

1. **依存関係**: jest-axeとaxe-coreが正しくインストールされているか
2. **モック設定**: 外部依存関係が適切にモックされているか  
3. **非同期処理**: waitForが適切に設定されているか
4. **DOM状態**: テスト間でDOMが適切にクリーンアップされているか

` : `
### 🎉 テスト成功

すべてのテストが成功しました！以下の機能が正常に動作することが確認されました：

- ✅ 基本的な警告表示機能
- ✅ 実際のSanityデータとの統合
- ✅ アクセシビリティ機能（キーボードナビゲーション、スクリーンリーダー対応）
- ✅ パフォーマンス（大量データ処理、メモリ効率）
- ✅ WCAG 2.1 AA準拠
- ✅ エンドツーエンド統合

`}

## 次のステップ

1. **継続的インテグレーション**: これらのテストをCI/CDパイプラインに組み込む
2. **パフォーマンス監視**: 本番環境でのパフォーマンス指標を監視
3. **アクセシビリティ監査**: 定期的なアクセシビリティ監査の実施
4. **ユーザビリティテスト**: 実際のユーザーによるテストの実施

---

*このレポートは自動生成されました - ${new Date().toISOString()}*
`;
}