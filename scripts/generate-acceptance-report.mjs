#!/usr/bin/env node

/**
 * 受け入れテスト結果レポート生成
 * テスト結果を詳細なMarkdownレポートとして出力
 */

import fs from 'fs';
import path from 'path';

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

function generateMarkdownReport(reportData) {
  const { timestamp, summary, details, errors } = reportData;
  const date = new Date(timestamp).toLocaleString('ja-JP');
  
  let markdown = `# Suptia Git Workflow 受け入れテスト結果

## 実行概要

- **実行日時**: ${date}
- **成功**: ${summary.passed}
- **失敗**: ${summary.failed}
- **合計**: ${summary.total}
- **成功率**: ${((summary.passed / summary.total) * 100).toFixed(1)}%

## 結果サマリー

`;

  if (summary.failed === 0) {
    markdown += `✅ **全てのテストが成功しました！**

Suptia Git Workflow の実装が完了し、全要件を満たしています。

`;
  } else {
    markdown += `❌ **${summary.failed}個のテストが失敗しました**

以下の問題を修正してください。

`;
  }

  // 詳細結果
  markdown += `## 詳細結果

| テスト名 | 状態 | メッセージ |
|---------|------|----------|
`;

  details.forEach(detail => {
    const status = detail.status === 'PASSED' ? '✅ 成功' : 
                  detail.status === 'FAILED' ? '❌ 失敗' : '⚠️ エラー';
    const message = detail.message.replace(/\n/g, ' ').substring(0, 100);
    markdown += `| ${detail.name} | ${status} | ${message} |\n`;
  });

  // エラー詳細
  if (errors.length > 0) {
    markdown += `
## エラー詳細

`;
    errors.forEach((error, index) => {
      markdown += `### ${index + 1}. ${error.test}

\`\`\`
${error.error}
\`\`\`

`;
    });
  }

  // 要件マッピング
  markdown += `
## 要件検証状況

### Requirement 1: ブランチ構成の確立
`;
  const req1Tests = details.filter(d => d.name.includes('1.'));
  req1Tests.forEach(test => {
    const status = test.status === 'PASSED' ? '✅' : '❌';
    markdown += `- ${status} ${test.name}\n`;
  });

  markdown += `
### Requirement 2: 開発フローの自動化
`;
  const req2Tests = details.filter(d => d.name.includes('2.'));
  req2Tests.forEach(test => {
    const status = test.status === 'PASSED' ? '✅' : '❌';
    markdown += `- ${status} ${test.name}\n`;
  });

  markdown += `
### Requirement 3: ブランチ保護とセキュリティ
`;
  const req3Tests = details.filter(d => d.name.includes('3.'));
  req3Tests.forEach(test => {
    const status = test.status === 'PASSED' ? '✅' : '❌';
    markdown += `- ${status} ${test.name}\n`;
  });

  markdown += `
### Requirement 4: CI/CD パイプラインの実装
`;
  const req4Tests = details.filter(d => d.name.includes('4.'));
  req4Tests.forEach(test => {
    const status = test.status === 'PASSED' ? '✅' : '❌';
    markdown += `- ${status} ${test.name}\n`;
  });

  markdown += `
### Requirement 5: Vercel 連携とデプロイ自動化
`;
  const req5Tests = details.filter(d => d.name.includes('5.'));
  req5Tests.forEach(test => {
    const status = test.status === 'PASSED' ? '✅' : '❌';
    markdown += `- ${status} ${test.name}\n`;
  });

  markdown += `
### Requirement 6: ブランチクリーンアップの自動化
`;
  const req6Tests = details.filter(d => d.name.includes('6.'));
  req6Tests.forEach(test => {
    const status = test.status === 'PASSED' ? '✅' : '❌';
    markdown += `- ${status} ${test.name}\n`;
  });

  markdown += `
### Requirement 7: 開発者体験の最適化
`;
  const req7Tests = details.filter(d => d.name.includes('7.'));
  req7Tests.forEach(test => {
    const status = test.status === 'PASSED' ? '✅' : '❌';
    markdown += `- ${status} ${test.name}\n`;
  });

  markdown += `
### Requirement 8: 監視と品質保証
`;
  const req8Tests = details.filter(d => d.name.includes('8.'));
  req8Tests.forEach(test => {
    const status = test.status === 'PASSED' ? '✅' : '❌';
    markdown += `- ${status} ${test.name}\n`;
  });

  markdown += `
### エンドツーエンドテスト
`;
  const e2eTests = details.filter(d => d.name.includes('E2E'));
  e2eTests.forEach(test => {
    const status = test.status === 'PASSED' ? '✅' : '❌';
    markdown += `- ${status} ${test.name}\n`;
  });

  // 推奨事項
  markdown += `
## 推奨事項

### 成功した場合
- 定期的な受け入れテストの実行を推奨します
- 新機能追加時は関連テストの更新を検討してください
- メトリクス収集を継続し、パフォーマンスを監視してください

### 失敗した場合
- 失敗したテストの詳細を確認し、根本原因を特定してください
- 必要に応じて設定ファイルやスクリプトを修正してください
- 修正後は再度受け入れテストを実行してください

## 次のステップ

1. **開発フロー実践**: 実際の開発作業でワークフローを使用してみてください
2. **チーム共有**: 開発チームメンバーにワークフローを共有してください
3. **継続改善**: 使用中に発見した問題点を記録し、改善を検討してください

---

*このレポートは自動生成されました。詳細な情報は \`acceptance-test-report.json\` を参照してください。*
`;

  return markdown;
}

async function main() {
  const reportPath = 'acceptance-test-report.json';
  const markdownPath = 'acceptance-test-report.md';

  try {
    // JSONレポートファイルの存在確認
    if (!fs.existsSync(reportPath)) {
      log('受け入れテストレポートが見つかりません。先に受け入れテストを実行してください。', colors.red);
      log('実行コマンド: npm run acceptance:run', colors.blue);
      process.exit(1);
    }

    // JSONレポート読み込み
    const reportData = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    
    // Markdownレポート生成
    const markdownReport = generateMarkdownReport(reportData);
    
    // ファイル保存
    fs.writeFileSync(markdownPath, markdownReport);
    
    log(`✅ 受け入れテストレポートを生成しました: ${markdownPath}`, colors.green);
    
    // サマリー表示
    log(`\n📊 テスト結果サマリー:`, colors.blue);
    log(`   成功: ${reportData.summary.passed}`, colors.green);
    log(`   失敗: ${reportData.summary.failed}`, colors.red);
    log(`   成功率: ${((reportData.summary.passed / reportData.summary.total) * 100).toFixed(1)}%`);

  } catch (error) {
    log(`❌ レポート生成中にエラーが発生しました: ${error.message}`, colors.red);
    process.exit(1);
  }
}

// スクリプト実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { generateMarkdownReport };