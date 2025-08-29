#!/usr/bin/env node

/**
 * Trust承認ポリシーシステム受け入れテスト実行スクリプト
 * 
 * システム全体の要件達成を検証し、詳細なレポートを生成します。
 */

import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import { join } from 'path';

/**
 * コマンドライン引数の解析
 */
function parseArguments() {
  const args = process.argv.slice(2);
  
  const options = {
    testType: 'all', // all, acceptance, performance
    verbose: false,
    generateReport: true,
    outputDir: '.kiro/reports/test-results',
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--type':
      case '-t':
        options.testType = args[++i];
        break;
      case '--output':
      case '-o':
        options.outputDir = args[++i];
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--no-report':
        options.generateReport = false;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
      default:
        if (arg.startsWith('-')) {
          console.error(`未知のオプション: ${arg}`);
          process.exit(1);
        }
    }
  }

  return options;
}

/**
 * ヘルプメッセージを表示
 */
function showHelp() {
  console.log(`
Trust承認ポリシーシステム受け入れテスト実行スクリプト

使用方法:
  node .kiro/scripts/run-acceptance-tests.mjs [オプション]

オプション:
  -t, --type TYPE       テストタイプ (all, acceptance, performance) [デフォルト: all]
  -o, --output DIR      出力ディレクトリ [デフォルト: .kiro/reports/test-results]
  -v, --verbose         詳細な実行ログを表示
  --no-report          レポート生成をスキップ
  -h, --help           このヘルプを表示

テストタイプ:
  all          - すべてのテストを実行
  acceptance   - 受け入れテストのみ実行
  performance  - パフォーマンステストのみ実行

例:
  # すべてのテストを実行
  node .kiro/scripts/run-acceptance-tests.mjs

  # パフォーマンステストのみ実行
  node .kiro/scripts/run-acceptance-tests.mjs --type performance

  # 詳細ログ付きで受け入れテストを実行
  node .kiro/scripts/run-acceptance-tests.mjs --type acceptance --verbose
`);
}

/**
 * テスト実行環境の準備
 */
async function prepareTestEnvironment(outputDir) {
  console.log('🔧 テスト実行環境を準備中...');
  
  try {
    await fs.mkdir(outputDir, { recursive: true });
    
    // テスト用の一時ディレクトリをクリーンアップ
    const tempDirs = [
      '.kiro-acceptance-test',
      '.kiro-performance-test',
      '.kiro-error-handler-test',
      '.kiro-metrics-integration-test'
    ];
    
    for (const dir of tempDirs) {
      try {
        await fs.rm(dir, { recursive: true, force: true });
      } catch (error) {
        // ディレクトリが存在しない場合は無視
      }
    }
    
    console.log('✅ テスト実行環境の準備完了');
  } catch (error) {
    console.error('❌ テスト実行環境の準備に失敗しました:', error.message);
    throw error;
  }
}

/**
 * 受け入れテストの実行
 */
async function runAcceptanceTests(verbose) {
  console.log('\n📋 受け入れテストを実行中...');
  
  const testCommand = [
    'npx vitest run',
    '.kiro/lib/trust-policy/__tests__/acceptance.test.ts',
    '--reporter=verbose',
    '--no-coverage'
  ].join(' ');
  
  try {
    const output = execSync(testCommand, { 
      encoding: 'utf-8',
      stdio: verbose ? 'inherit' : 'pipe'
    });
    
    if (!verbose) {
      console.log('✅ 受け入れテスト完了');
    }
    
    return {
      success: true,
      output: output,
      type: 'acceptance'
    };
  } catch (error) {
    console.error('❌ 受け入れテストに失敗しました');
    if (verbose) {
      console.error(error.stdout || error.message);
    }
    
    return {
      success: false,
      output: error.stdout || error.message,
      type: 'acceptance',
      error: error.message
    };
  }
}

/**
 * パフォーマンステストの実行
 */
async function runPerformanceTests(verbose) {
  console.log('\n⚡ パフォーマンステストを実行中...');
  
  const testCommand = [
    'npx vitest run',
    '.kiro/lib/trust-policy/__tests__/performance.test.ts',
    '--reporter=verbose',
    '--no-coverage'
  ].join(' ');
  
  try {
    const output = execSync(testCommand, { 
      encoding: 'utf-8',
      stdio: verbose ? 'inherit' : 'pipe'
    });
    
    if (!verbose) {
      console.log('✅ パフォーマンステスト完了');
    }
    
    return {
      success: true,
      output: output,
      type: 'performance'
    };
  } catch (error) {
    console.error('❌ パフォーマンステストに失敗しました');
    if (verbose) {
      console.error(error.stdout || error.message);
    }
    
    return {
      success: false,
      output: error.stdout || error.message,
      type: 'performance',
      error: error.message
    };
  }
}

/**
 * 統合テストの実行
 */
async function runIntegrationTests(verbose) {
  console.log('\n🔗 統合テストを実行中...');
  
  const testFiles = [
    '.kiro/lib/trust-policy/__tests__/end-to-end.test.ts',
    '.kiro/lib/trust-policy/__tests__/integration.comprehensive.test.ts',
    '.kiro/lib/trust-policy/__tests__/metrics-collector.integration.test.ts'
  ];
  
  const results = [];
  
  for (const testFile of testFiles) {
    try {
      const testCommand = [
        'npx vitest run',
        testFile,
        '--reporter=verbose',
        '--no-coverage'
      ].join(' ');
      
      const output = execSync(testCommand, { 
        encoding: 'utf-8',
        stdio: verbose ? 'inherit' : 'pipe'
      });
      
      results.push({
        success: true,
        output: output,
        file: testFile
      });
      
    } catch (error) {
      console.error(`❌ ${testFile} のテストに失敗しました`);
      
      results.push({
        success: false,
        output: error.stdout || error.message,
        file: testFile,
        error: error.message
      });
    }
  }
  
  const successCount = results.filter(r => r.success).length;
  console.log(`✅ 統合テスト完了 (${successCount}/${results.length} 成功)`);
  
  return {
    success: successCount === results.length,
    results: results,
    type: 'integration'
  };
}

/**
 * テスト結果レポートの生成
 */
async function generateTestReport(testResults, outputDir) {
  console.log('\n📊 テスト結果レポートを生成中...');
  
  const timestamp = new Date().toISOString();
  const reportPath = join(outputDir, `acceptance-test-report-${timestamp.split('T')[0]}.md`);
  
  const report = [
    `# Trust承認ポリシーシステム 受け入れテスト結果レポート`,
    ``,
    `**実行日時**: ${timestamp}`,
    `**実行環境**: Node.js ${process.version}`,
    ``,
    `## 概要`,
    ``,
    generateSummarySection(testResults),
    ``,
    `## 詳細結果`,
    ``,
    ...testResults.map(result => generateDetailSection(result)),
    ``,
    `## 要件達成状況`,
    ``,
    generateRequirementStatus(testResults),
    ``,
    `## 推奨アクション`,
    ``,
    generateRecommendations(testResults),
    ``,
    `---`,
    ``,
    `*このレポートは自動生成されました*`
  ].join('\n');
  
  await fs.writeFile(reportPath, report, 'utf-8');
  
  console.log(`✅ テスト結果レポートを生成しました: ${reportPath}`);
  
  return reportPath;
}

/**
 * サマリーセクションの生成
 */
function generateSummarySection(testResults) {
  const totalTests = testResults.length;
  const passedTests = testResults.filter(r => r.success).length;
  const failedTests = totalTests - passedTests;
  const successRate = totalTests > 0 ? (passedTests / totalTests * 100).toFixed(1) : 0;
  
  return [
    `- **総テスト数**: ${totalTests}`,
    `- **成功**: ${passedTests}`,
    `- **失敗**: ${failedTests}`,
    `- **成功率**: ${successRate}%`,
    ``,
    `### テストタイプ別結果`,
    ``,
    ...testResults.map(result => {
      const status = result.success ? '✅' : '❌';
      const type = result.type || 'unknown';
      return `- **${type}**: ${status} ${result.success ? '成功' : '失敗'}`;
    })
  ].join('\n');
}

/**
 * 詳細セクションの生成
 */
function generateDetailSection(result) {
  const status = result.success ? '✅ 成功' : '❌ 失敗';
  const type = result.type || 'unknown';
  
  const section = [
    `### ${type} テスト: ${status}`,
    ``
  ];
  
  if (result.success) {
    section.push(`テストが正常に完了しました。`);
  } else {
    section.push(`**エラー内容**:`);
    section.push('```');
    section.push(result.error || 'エラー詳細不明');
    section.push('```');
  }
  
  if (result.output && result.output.length > 0) {
    section.push('');
    section.push('**実行ログ**:');
    section.push('```');
    section.push(result.output.substring(0, 1000)); // 最初の1000文字のみ
    if (result.output.length > 1000) {
      section.push('...(省略)');
    }
    section.push('```');
  }
  
  section.push('');
  
  return section.join('\n');
}

/**
 * 要件達成状況の生成
 */
function generateRequirementStatus(testResults) {
  const requirements = [
    { id: '1', name: 'Trust承認ポリシー設定システム', testType: 'acceptance' },
    { id: '2', name: '自動承認対象操作の定義', testType: 'acceptance' },
    { id: '3', name: '手動承認対象操作の定義', testType: 'acceptance' },
    { id: '4', name: '監査ログシステム', testType: 'acceptance' },
    { id: '7', name: 'パフォーマンス最適化', testType: 'performance' },
    { id: '8', name: 'セキュリティ保護', testType: 'acceptance' }
  ];
  
  return requirements.map(req => {
    const relatedTest = testResults.find(r => r.type === req.testType);
    const status = relatedTest?.success ? '✅ 達成' : '❌ 未達成';
    return `- **要件${req.id}**: ${req.name} - ${status}`;
  }).join('\n');
}

/**
 * 推奨アクションの生成
 */
function generateRecommendations(testResults) {
  const recommendations = [];
  
  const failedTests = testResults.filter(r => !r.success);
  
  if (failedTests.length === 0) {
    recommendations.push('✅ すべてのテストが成功しました。システムは本番環境にデプロイ可能です。');
  } else {
    recommendations.push('❌ 以下の問題を解決してから本番環境にデプロイしてください:');
    recommendations.push('');
    
    failedTests.forEach((test, index) => {
      recommendations.push(`${index + 1}. **${test.type}テストの修正**`);
      recommendations.push(`   - 問題: ${test.error || 'テスト失敗'}`);
      recommendations.push(`   - 対策: 該当するテストケースを確認し、コードを修正してください`);
      recommendations.push('');
    });
  }
  
  // 一般的な推奨事項
  recommendations.push('### 一般的な推奨事項');
  recommendations.push('');
  recommendations.push('- 定期的な受け入れテストの実行');
  recommendations.push('- パフォーマンス監視の継続');
  recommendations.push('- セキュリティ設定の定期見直し');
  recommendations.push('- ログ監視とアラート設定の確認');
  
  return recommendations.join('\n');
}

/**
 * テスト結果の要約表示
 */
function displayTestSummary(testResults) {
  console.log('\n📊 テスト実行結果サマリー');
  console.log('================================');
  
  const totalTests = testResults.length;
  const passedTests = testResults.filter(r => r.success).length;
  const failedTests = totalTests - passedTests;
  const successRate = totalTests > 0 ? (passedTests / totalTests * 100).toFixed(1) : 0;
  
  console.log(`総テスト数: ${totalTests}`);
  console.log(`成功: ${passedTests}`);
  console.log(`失敗: ${failedTests}`);
  console.log(`成功率: ${successRate}%`);
  
  console.log('\nテストタイプ別結果:');
  testResults.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const type = result.type || 'unknown';
    console.log(`  ${type}: ${status}`);
  });
  
  if (failedTests > 0) {
    console.log('\n❌ 失敗したテスト:');
    testResults.filter(r => !r.success).forEach(result => {
      console.log(`  - ${result.type}: ${result.error || 'エラー詳細不明'}`);
    });
  }
  
  console.log('\n================================');
}

/**
 * メイン処理
 */
async function main() {
  const options = parseArguments();

  if (options.help) {
    showHelp();
    return;
  }

  console.log('🧪 Trust承認ポリシーシステム受け入れテスト実行開始\n');
  
  if (options.verbose) {
    console.log('実行オプション:', options);
  }

  try {
    // テスト実行環境の準備
    await prepareTestEnvironment(options.outputDir);

    const testResults = [];

    // テストタイプに応じて実行
    switch (options.testType) {
      case 'acceptance':
        testResults.push(await runAcceptanceTests(options.verbose));
        break;
        
      case 'performance':
        testResults.push(await runPerformanceTests(options.verbose));
        break;
        
      case 'all':
      default:
        testResults.push(await runAcceptanceTests(options.verbose));
        testResults.push(await runPerformanceTests(options.verbose));
        
        // 統合テストも実行
        const integrationResult = await runIntegrationTests(options.verbose);
        if (integrationResult.results) {
          testResults.push(...integrationResult.results.map(r => ({
            success: r.success,
            output: r.output,
            type: `integration-${r.file.split('/').pop().replace('.test.ts', '')}`,
            error: r.error
          })));
        }
        break;
    }

    // テスト結果の表示
    displayTestSummary(testResults);

    // レポート生成
    if (options.generateReport) {
      const reportPath = await generateTestReport(testResults, options.outputDir);
      console.log(`\n📋 詳細レポート: ${reportPath}`);
    }

    // 終了コードの決定
    const allPassed = testResults.every(r => r.success);
    
    if (allPassed) {
      console.log('\n✅ すべてのテストが成功しました！システムは本番環境にデプロイ可能です。');
      process.exit(0);
    } else {
      console.log('\n❌ 一部のテストが失敗しました。問題を修正してから再実行してください。');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ テスト実行中にエラーが発生しました:', error.message);
    if (options.verbose && error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// スクリプトが直接実行された場合のみメイン処理を実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main as runAcceptanceTests };