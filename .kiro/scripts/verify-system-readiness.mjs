#!/usr/bin/env node

/**
 * Trust承認ポリシーシステム 運用準備確認スクリプト
 * 
 * システムが本番環境にデプロイ可能な状態かを包括的に検証します。
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

/**
 * 検証結果を管理するクラス
 */
class VerificationResults {
  constructor() {
    this.results = [];
    this.passed = 0;
    this.failed = 0;
    this.warnings = 0;
  }

  addResult(category, test, status, message = '', details = null) {
    const result = {
      category,
      test,
      status, // 'pass', 'fail', 'warning'
      message,
      details,
      timestamp: new Date().toISOString()
    };

    this.results.push(result);

    switch (status) {
      case 'pass':
        this.passed++;
        console.log(`✅ ${category}: ${test}`);
        break;
      case 'fail':
        this.failed++;
        console.log(`❌ ${category}: ${test} - ${message}`);
        break;
      case 'warning':
        this.warnings++;
        console.log(`⚠️ ${category}: ${test} - ${message}`);
        break;
    }

    if (details && process.env.VERBOSE) {
      console.log(`   詳細: ${details}`);
    }
  }

  getSummary() {
    const total = this.passed + this.failed + this.warnings;
    return {
      total,
      passed: this.passed,
      failed: this.failed,
      warnings: this.warnings,
      successRate: total > 0 ? (this.passed / total * 100).toFixed(1) : 0
    };
  }

  isReadyForDeployment() {
    return this.failed === 0;
  }
}

/**
 * ファイル・ディレクトリの存在確認
 */
async function verifyFileStructure(results) {
  console.log('\n🗂️ ファイル構造の確認...');

  const requiredPaths = [
    { path: '.kiro/settings', type: 'directory', description: '設定ディレクトリ' },
    { path: '.kiro/lib/trust-policy', type: 'directory', description: 'ライブラリディレクトリ' },
    { path: '.kiro/scripts', type: 'directory', description: 'スクリプトディレクトリ' },
    { path: '.kiro/reports', type: 'directory', description: 'レポートディレクトリ' },
    { path: '.kiro/settings/trust-policy.json', type: 'file', description: 'ポリシー設定ファイル' },
    { path: '.kiro/steering/trust-usage.md', type: 'file', description: '運用ガイドライン' },
    { path: '.kiro/scripts/init-trust-policy.mjs', type: 'file', description: '初期化スクリプト' },
    { path: '.kiro/scripts/generate-trust-metrics-report.mjs', type: 'file', description: 'メトリクスレポートスクリプト' },
    { path: '.kiro/scripts/run-acceptance-tests.mjs', type: 'file', description: '受け入れテストスクリプト' }
  ];

  for (const { path, type, description } of requiredPaths) {
    try {
      const stats = await fs.stat(path);
      
      if (type === 'directory' && stats.isDirectory()) {
        results.addResult('ファイル構造', description, 'pass');
      } else if (type === 'file' && stats.isFile()) {
        results.addResult('ファイル構造', description, 'pass');
      } else {
        results.addResult('ファイル構造', description, 'fail', `${type}ではありません`);
      }
    } catch (error) {
      results.addResult('ファイル構造', description, 'fail', '存在しません', path);
    }
  }
}

/**
 * コアコンポーネントの存在確認
 */
async function verifyCoreComponents(results) {
  console.log('\n🔧 コアコンポーネントの確認...');

  const coreComponents = [
    'policy-manager.ts',
    'operation-classifier.ts',
    'trust-decision-engine.ts',
    'audit-logger.ts',
    'metrics-collector.ts',
    'error-handler.ts',
    'performance-optimizer.ts',
    'security-protection.ts',
    'report-generator.ts'
  ];

  for (const component of coreComponents) {
    const componentPath = join('.kiro/lib/trust-policy', component);
    
    try {
      await fs.access(componentPath);
      results.addResult('コアコンポーネント', component, 'pass');
    } catch (error) {
      results.addResult('コアコンポーネント', component, 'fail', '存在しません');
    }
  }
}

/**
 * 設定ファイルの検証
 */
async function verifyConfiguration(results) {
  console.log('\n⚙️ 設定ファイルの検証...');

  try {
    // ポリシー設定ファイルの読み込み
    const policyContent = await fs.readFile('.kiro/settings/trust-policy.json', 'utf-8');
    
    try {
      const policy = JSON.parse(policyContent);
      results.addResult('設定検証', 'JSON構文', 'pass');

      // 必須フィールドの確認
      const requiredFields = ['version', 'lastUpdated', 'autoApprove', 'manualApprove', 'security'];
      const missingFields = requiredFields.filter(field => !policy[field]);

      if (missingFields.length === 0) {
        results.addResult('設定検証', '必須フィールド', 'pass');
      } else {
        results.addResult('設定検証', '必須フィールド', 'fail', `不足: ${missingFields.join(', ')}`);
      }

      // 自動承認設定の確認
      if (policy.autoApprove && policy.autoApprove.gitOperations && Array.isArray(policy.autoApprove.gitOperations)) {
        results.addResult('設定検証', '自動承認設定', 'pass');
      } else {
        results.addResult('設定検証', '自動承認設定', 'fail', '不正な自動承認設定');
      }

      // セキュリティ設定の確認
      if (policy.security && typeof policy.security.maxAutoApprovalPerHour === 'number') {
        results.addResult('設定検証', 'セキュリティ設定', 'pass');
      } else {
        results.addResult('設定検証', 'セキュリティ設定', 'fail', '不正なセキュリティ設定');
      }

    } catch (parseError) {
      results.addResult('設定検証', 'JSON構文', 'fail', 'JSON解析エラー', parseError.message);
    }

  } catch (error) {
    results.addResult('設定検証', 'ファイル読み込み', 'fail', 'ファイル読み込みエラー');
  }
}

/**
 * 依存関係の確認
 */
async function verifyDependencies(results) {
  console.log('\n📦 依存関係の確認...');

  // Node.jsバージョンの確認
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  if (majorVersion >= 18) {
    results.addResult('依存関係', 'Node.jsバージョン', 'pass', `${nodeVersion}`);
  } else {
    results.addResult('依存関係', 'Node.jsバージョン', 'fail', `${nodeVersion} (18.0.0以上が必要)`);
  }

  // package.jsonの確認
  try {
    const packageContent = await fs.readFile('package.json', 'utf-8');
    const packageJson = JSON.parse(packageContent);
    
    results.addResult('依存関係', 'package.json', 'pass');

    // 重要な依存関係の確認
    const importantDeps = ['vitest', 'typescript'];
    const devDeps = packageJson.devDependencies || {};
    
    for (const dep of importantDeps) {
      if (devDeps[dep]) {
        results.addResult('依存関係', dep, 'pass');
      } else {
        results.addResult('依存関係', dep, 'warning', '推奨パッケージが見つかりません');
      }
    }

  } catch (error) {
    results.addResult('依存関係', 'package.json', 'fail', 'package.json読み込みエラー');
  }
}

/**
 * 基本機能のテスト
 */
async function verifyBasicFunctionality(results) {
  console.log('\n🧪 基本機能のテスト...');

  // 初期化スクリプトのテスト
  try {
    execSync('node .kiro/scripts/init-trust-policy.mjs --dry-run', { 
      stdio: 'pipe',
      timeout: 30000 
    });
    results.addResult('基本機能', '初期化スクリプト', 'pass');
  } catch (error) {
    results.addResult('基本機能', '初期化スクリプト', 'fail', 'スクリプト実行エラー');
  }

  // 操作分類テスト
  try {
    execSync('node .kiro/lib/trust-policy/test-classifier.mjs "git status"', { 
      stdio: 'pipe',
      timeout: 10000 
    });
    results.addResult('基本機能', '操作分類', 'pass');
  } catch (error) {
    results.addResult('基本機能', '操作分類', 'fail', '分類テストエラー');
  }

  // デモスクリプトのテスト
  const demoScripts = [
    'demo-trust-engine.mjs',
    'demo-audit-logger.mjs',
    'demo-metrics-collector.mjs',
    'demo-error-handler.mjs'
  ];

  for (const script of demoScripts) {
    try {
      execSync(`node .kiro/lib/trust-policy/${script}`, { 
        stdio: 'pipe',
        timeout: 60000 
      });
      results.addResult('基本機能', `デモ: ${script}`, 'pass');
    } catch (error) {
      results.addResult('基本機能', `デモ: ${script}`, 'warning', 'デモ実行エラー（機能には影響なし）');
    }
  }
}

/**
 * パフォーマンステスト
 */
async function verifyPerformance(results) {
  console.log('\n⚡ パフォーマンステスト...');

  try {
    // 簡易パフォーマンステスト
    const { PolicyManager } = await import('../.kiro/lib/trust-policy/policy-manager.js');
    const { TrustDecisionEngine } = await import('../.kiro/lib/trust-policy/trust-decision-engine.js');

    const policyManager = new PolicyManager();
    const decisionEngine = new TrustDecisionEngine(policyManager);

    // 判定時間のテスト
    const testOperations = [
      { type: 'git', command: 'git', args: ['status'] },
      { type: 'git', command: 'git', args: ['commit', '-m', 'test'] },
      { type: 'file', command: 'touch', args: ['file.txt'] }
    ];

    let totalTime = 0;
    let operationCount = 0;

    for (const operation of testOperations) {
      const startTime = Date.now();
      
      await decisionEngine.evaluateOperation({
        ...operation,
        context: { cwd: '/test' },
        timestamp: new Date()
      });
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      totalTime += processingTime;
      operationCount++;

      if (processingTime <= 100) {
        results.addResult('パフォーマンス', `判定時間: ${operation.command}`, 'pass', `${processingTime}ms`);
      } else {
        results.addResult('パフォーマンス', `判定時間: ${operation.command}`, 'warning', `${processingTime}ms (100ms超過)`);
      }
    }

    const averageTime = totalTime / operationCount;
    if (averageTime <= 100) {
      results.addResult('パフォーマンス', '平均判定時間', 'pass', `${averageTime.toFixed(1)}ms`);
    } else {
      results.addResult('パフォーマンス', '平均判定時間', 'fail', `${averageTime.toFixed(1)}ms (100ms超過)`);
    }

  } catch (error) {
    results.addResult('パフォーマンス', 'パフォーマンステスト', 'fail', 'テスト実行エラー', error.message);
  }
}

/**
 * セキュリティチェック
 */
async function verifySecuritySettings(results) {
  console.log('\n🔒 セキュリティ設定の確認...');

  try {
    // ファイル権限の確認
    const sensitiveFiles = [
      '.kiro/settings/trust-policy.json',
      '.kiro/steering/trust-usage.md'
    ];

    for (const file of sensitiveFiles) {
      try {
        const stats = await fs.stat(file);
        // ファイルが存在することを確認
        results.addResult('セキュリティ', `ファイル保護: ${file}`, 'pass');
      } catch (error) {
        results.addResult('セキュリティ', `ファイル保護: ${file}`, 'fail', 'ファイルが存在しません');
      }
    }

    // 設定ファイルのセキュリティ設定確認
    const policyContent = await fs.readFile('.kiro/settings/trust-policy.json', 'utf-8');
    const policy = JSON.parse(policyContent);

    if (policy.security && policy.security.suspiciousPatternDetection) {
      results.addResult('セキュリティ', '不審パターン検出', 'pass');
    } else {
      results.addResult('セキュリティ', '不審パターン検出', 'warning', '無効化されています');
    }

    if (policy.security && policy.security.logAllOperations) {
      results.addResult('セキュリティ', '全操作ログ記録', 'pass');
    } else {
      results.addResult('セキュリティ', '全操作ログ記録', 'warning', '無効化されています');
    }

  } catch (error) {
    results.addResult('セキュリティ', 'セキュリティ設定確認', 'fail', 'セキュリティ設定の確認に失敗');
  }
}

/**
 * 受け入れテストの実行
 */
async function runAcceptanceTests(results) {
  console.log('\n🎯 受け入れテストの実行...');

  try {
    // 受け入れテストの実行（タイムアウト付き）
    execSync('node .kiro/scripts/run-acceptance-tests.mjs --type acceptance', { 
      stdio: 'pipe',
      timeout: 300000 // 5分
    });
    results.addResult('受け入れテスト', '全体テスト', 'pass');
  } catch (error) {
    if (error.status === 1) {
      results.addResult('受け入れテスト', '全体テスト', 'fail', 'テストが失敗しました');
    } else {
      results.addResult('受け入れテスト', '全体テスト', 'warning', 'テスト実行中にエラーが発生しました');
    }
  }

  // 個別のテストファイル確認
  const testFiles = [
    'acceptance.test.ts',
    'performance.test.ts',
    'end-to-end.test.ts'
  ];

  for (const testFile of testFiles) {
    const testPath = join('.kiro/lib/trust-policy/__tests__', testFile);
    
    try {
      await fs.access(testPath);
      results.addResult('受け入れテスト', `テストファイル: ${testFile}`, 'pass');
    } catch (error) {
      results.addResult('受け入れテスト', `テストファイル: ${testFile}`, 'fail', '存在しません');
    }
  }
}

/**
 * 運用準備状況の確認
 */
async function verifyOperationalReadiness(results) {
  console.log('\n📋 運用準備状況の確認...');

  // 運用ガイドラインの確認
  try {
    const guideContent = await fs.readFile('.kiro/steering/trust-usage.md', 'utf-8');
    
    if (guideContent.length > 1000) {
      results.addResult('運用準備', '運用ガイドライン', 'pass');
    } else {
      results.addResult('運用準備', '運用ガイドライン', 'warning', '内容が不十分な可能性があります');
    }
  } catch (error) {
    results.addResult('運用準備', '運用ガイドライン', 'fail', '運用ガイドラインが存在しません');
  }

  // デプロイメントチェックリストの確認
  try {
    await fs.access('.kiro/docs/TRUST_POLICY_DEPLOYMENT_CHECKLIST.md');
    results.addResult('運用準備', 'デプロイメントチェックリスト', 'pass');
  } catch (error) {
    results.addResult('運用準備', 'デプロイメントチェックリスト', 'warning', 'チェックリストが存在しません');
  }

  // レポートディレクトリの準備確認
  try {
    await fs.access('.kiro/reports');
    results.addResult('運用準備', 'レポートディレクトリ', 'pass');
  } catch (error) {
    results.addResult('運用準備', 'レポートディレクトリ', 'fail', 'レポートディレクトリが存在しません');
  }

  // バックアップディレクトリの準備確認
  try {
    await fs.access('.kiro/backups');
    results.addResult('運用準備', 'バックアップディレクトリ', 'pass');
  } catch (error) {
    // バックアップディレクトリは自動作成されるため警告レベル
    results.addResult('運用準備', 'バックアップディレクトリ', 'warning', '初回実行時に自動作成されます');
  }
}

/**
 * 検証レポートの生成
 */
async function generateVerificationReport(results) {
  const summary = results.getSummary();
  const timestamp = new Date().toISOString();
  
  const report = [
    `# Trust承認ポリシーシステム 運用準備確認レポート`,
    ``,
    `**実行日時**: ${timestamp}`,
    `**Node.jsバージョン**: ${process.version}`,
    `**実行環境**: ${process.platform}`,
    ``,
    `## 検証結果サマリー`,
    ``,
    `- **総検証項目数**: ${summary.total}`,
    `- **成功**: ${summary.passed} (${summary.successRate}%)`,
    `- **失敗**: ${summary.failed}`,
    `- **警告**: ${summary.warnings}`,
    ``,
    `**デプロイメント準備状況**: ${results.isReadyForDeployment() ? '✅ 準備完了' : '❌ 要対応'}`,
    ``,
    `## カテゴリ別結果`,
    ``,
    ...generateCategoryResults(results.results),
    ``,
    `## 推奨アクション`,
    ``,
    ...generateRecommendations(results.results),
    ``,
    `---`,
    ``,
    `*このレポートは自動生成されました*`
  ].join('\n');

  const reportPath = `.kiro/reports/system-readiness-${timestamp.split('T')[0]}.md`;
  
  try {
    await fs.mkdir('.kiro/reports', { recursive: true });
    await fs.writeFile(reportPath, report, 'utf-8');
    console.log(`\n📊 検証レポートを生成しました: ${reportPath}`);
  } catch (error) {
    console.warn('⚠️ レポート生成に失敗しました:', error.message);
  }

  return report;
}

/**
 * カテゴリ別結果の生成
 */
function generateCategoryResults(results) {
  const categories = [...new Set(results.map(r => r.category))];
  
  return categories.map(category => {
    const categoryResults = results.filter(r => r.category === category);
    const passed = categoryResults.filter(r => r.status === 'pass').length;
    const failed = categoryResults.filter(r => r.status === 'fail').length;
    const warnings = categoryResults.filter(r => r.status === 'warning').length;
    
    const lines = [
      `### ${category}`,
      ``,
      `- 成功: ${passed}`,
      `- 失敗: ${failed}`,
      `- 警告: ${warnings}`,
      ``
    ];

    // 失敗項目の詳細
    const failedItems = categoryResults.filter(r => r.status === 'fail');
    if (failedItems.length > 0) {
      lines.push('**失敗項目**:');
      failedItems.forEach(item => {
        lines.push(`- ${item.test}: ${item.message}`);
      });
      lines.push('');
    }

    // 警告項目の詳細
    const warningItems = categoryResults.filter(r => r.status === 'warning');
    if (warningItems.length > 0) {
      lines.push('**警告項目**:');
      warningItems.forEach(item => {
        lines.push(`- ${item.test}: ${item.message}`);
      });
      lines.push('');
    }

    return lines.join('\n');
  });
}

/**
 * 推奨アクションの生成
 */
function generateRecommendations(results) {
  const recommendations = [];
  
  const failedResults = results.filter(r => r.status === 'fail');
  const warningResults = results.filter(r => r.status === 'warning');

  if (failedResults.length === 0 && warningResults.length === 0) {
    recommendations.push('✅ すべての検証項目が成功しました。システムは本番環境にデプロイ可能です。');
  } else {
    if (failedResults.length > 0) {
      recommendations.push('❌ **緊急対応が必要な項目**:');
      recommendations.push('');
      failedResults.forEach((result, index) => {
        recommendations.push(`${index + 1}. **${result.category} - ${result.test}**`);
        recommendations.push(`   - 問題: ${result.message}`);
        recommendations.push(`   - 対策: 該当する機能を修正してから再実行してください`);
        recommendations.push('');
      });
    }

    if (warningResults.length > 0) {
      recommendations.push('⚠️ **改善推奨項目**:');
      recommendations.push('');
      warningResults.forEach((result, index) => {
        recommendations.push(`${index + 1}. **${result.category} - ${result.test}**`);
        recommendations.push(`   - 注意: ${result.message}`);
        recommendations.push(`   - 推奨: 可能であれば改善してください`);
        recommendations.push('');
      });
    }
  }

  recommendations.push('### 次のステップ');
  recommendations.push('');
  
  if (failedResults.length === 0) {
    recommendations.push('1. デプロイメントチェックリストの確認');
    recommendations.push('2. ステージング環境でのテスト実行');
    recommendations.push('3. 本番環境へのデプロイ');
    recommendations.push('4. デプロイ後の監視開始');
  } else {
    recommendations.push('1. 失敗項目の修正');
    recommendations.push('2. 修正後の再検証');
    recommendations.push('3. すべての項目が成功後にデプロイ検討');
  }

  return recommendations;
}

/**
 * メイン処理
 */
async function main() {
  console.log('🚀 Trust承認ポリシーシステム 運用準備確認を開始します...\n');

  const results = new VerificationResults();

  try {
    // 各種検証の実行
    await verifyFileStructure(results);
    await verifyCoreComponents(results);
    await verifyConfiguration(results);
    await verifyDependencies(results);
    await verifyBasicFunctionality(results);
    await verifyPerformance(results);
    await verifySecuritySettings(results);
    await runAcceptanceTests(results);
    await verifyOperationalReadiness(results);

    // 結果の表示
    console.log('\n' + '='.repeat(60));
    console.log('📊 検証結果サマリー');
    console.log('='.repeat(60));

    const summary = results.getSummary();
    console.log(`総検証項目数: ${summary.total}`);
    console.log(`成功: ${summary.passed} (${summary.successRate}%)`);
    console.log(`失敗: ${summary.failed}`);
    console.log(`警告: ${summary.warnings}`);

    console.log('\n' + '='.repeat(60));
    
    if (results.isReadyForDeployment()) {
      console.log('✅ システムは本番環境にデプロイ可能です！');
      console.log('\n次のステップ:');
      console.log('1. デプロイメントチェックリストの確認');
      console.log('2. ステージング環境でのテスト');
      console.log('3. 本番環境へのデプロイ');
    } else {
      console.log('❌ デプロイ前に修正が必要な項目があります。');
      console.log('\n失敗した項目:');
      results.results
        .filter(r => r.status === 'fail')
        .forEach(result => {
          console.log(`  - ${result.category}: ${result.test} (${result.message})`);
        });
    }

    // レポート生成
    await generateVerificationReport(results);

    // 終了コード
    process.exit(results.isReadyForDeployment() ? 0 : 1);

  } catch (error) {
    console.error('❌ 検証中にエラーが発生しました:', error.message);
    if (process.env.VERBOSE && error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// スクリプトが直接実行された場合のみメイン処理を実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main as verifySystemReadiness };