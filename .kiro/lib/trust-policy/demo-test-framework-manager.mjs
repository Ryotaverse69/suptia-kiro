#!/usr/bin/env node

/**
 * TestFrameworkManagerのデモンストレーション
 * 
 * テスト環境の管理、不足メソッドの自動追加、
 * 依存関係の解決、テスト実行の統括機能を実演します。
 */

import { TestFrameworkManager, TestType } from './test-framework-manager.ts';
import { promises as fs } from 'fs';

async function main() {
  console.log('🧪 TestFrameworkManagerデモを開始します...\n');

  try {
    // TestFrameworkManagerを初期化
    const manager = new TestFrameworkManager();
    console.log('🔧 TestFrameworkManagerを初期化中...');
    await manager.initialize();
    console.log('✅ 初期化完了\n');

    // テスト環境設定の表示
    console.log('=== テスト環境設定 ===');
    const config = manager.getTestEnvironmentConfig();
    console.log(`Node.js バージョン: ${config.nodeVersion}`);
    console.log(`テストランナー: ${config.testRunner}`);
    console.log(`タイムアウト: ${config.timeout}ms`);
    console.log(`最大並行数: ${config.maxConcurrency}`);
    console.log(`環境変数: ${Object.keys(config.environmentVariables).join(', ')}\n`);

    // 不足メソッドの検出
    console.log('=== 不足メソッドの検出 ===');
    const missingMethods = manager.getMissingMethods();
    console.log(`検出された不足メソッド: ${missingMethods.length}個`);

    if (missingMethods.length > 0) {
      console.log('\n不足メソッドの詳細:');
      missingMethods.forEach((method, index) => {
        const severityIcon = {
          critical: '🚨',
          high: '⚠️',
          medium: '📝',
          low: '💡'
        }[method.severity];
        
        const fixableIcon = method.autoFixable ? '🔧' : '⚠️';
        
        console.log(`${index + 1}. ${severityIcon} ${fixableIcon} [${method.className}] ${method.methodName}`);
        console.log(`   └─ 期待される署名: ${method.expectedSignature}`);
        console.log(`   └─ ファイル: ${method.filePath}`);
        console.log(`   └─ 重要度: ${method.severity}, 自動修正: ${method.autoFixable ? '可能' : '不可'}`);
      });

      // 自動修正可能なメソッドの追加
      const autoFixableMethods = missingMethods.filter(method => method.autoFixable);
      if (autoFixableMethods.length > 0) {
        console.log(`\n🔧 ${autoFixableMethods.length}個の自動修正可能なメソッドを追加中...`);
        await manager.addMissingMethods();
        console.log('✅ 不足メソッドの追加が完了しました');
      }
    } else {
      console.log('✅ 不足メソッドは検出されませんでした');
    }

    // 依存関係の確認
    console.log('\n=== 依存関係の確認 ===');
    const dependencies = manager.getDependencies();
    console.log(`確認された依存関係: ${dependencies.length}個`);

    if (dependencies.length > 0) {
      console.log('\n依存関係の詳細:');
      dependencies.forEach((dep, index) => {
        const statusIcon = dep.installed ? (dep.compatible ? '✅' : '⚠️') : '❌';
        const requiredIcon = dep.required ? '🔴' : '🔵';
        
        console.log(`${index + 1}. ${statusIcon} ${requiredIcon} ${dep.name}@${dep.version}`);
        console.log(`   └─ インストール済み: ${dep.installed ? 'はい' : 'いいえ'}`);
        console.log(`   └─ 互換性: ${dep.compatible ? 'あり' : 'なし'}`);
        console.log(`   └─ 必須: ${dep.required ? 'はい' : 'いいえ'}`);
        
        if (dep.issues.length > 0) {
          console.log(`   └─ 問題: ${dep.issues.join(', ')}`);
        }
      });

      // 依存関係の解決
      const missingDeps = dependencies.filter(dep => !dep.installed && dep.required);
      const incompatibleDeps = dependencies.filter(dep => dep.installed && !dep.compatible);
      
      if (missingDeps.length > 0 || incompatibleDeps.length > 0) {
        console.log(`\n📦 依存関係を解決中... (不足: ${missingDeps.length}個, 非互換: ${incompatibleDeps.length}個)`);
        console.log('⚠️ 実際のnpmコマンドは実行されません（デモモード）');
        // await manager.resolveDependencies(); // 実際の環境では有効化
        console.log('✅ 依存関係の解決が完了しました（シミュレーション）');
      }
    } else {
      console.log('⚠️ 依存関係情報を取得できませんでした');
    }

    // テスト環境の初期化
    console.log('\n=== テスト環境の初期化 ===');
    await manager.initializeTestEnvironment();
    console.log('✅ テスト環境の初期化が完了しました');

    // 作成されたファイルの確認
    const createdFiles = [
      'jest.config.js',
      '.kiro/lib/trust-policy/__tests__/setup.ts',
      '.kiro/lib/trust-policy/__tests__/fixtures/sample-policy.json',
      '.kiro/lib/trust-policy/__tests__/fixtures/sample-operation.json',
      '.kiro/lib/trust-policy/__tests__/mocks/index.ts'
    ];

    console.log('\n作成されたファイル:');
    for (const file of createdFiles) {
      const exists = await fs.access(file).then(() => true).catch(() => false);
      const statusIcon = exists ? '✅' : '❌';
      console.log(`${statusIcon} ${file}`);
    }

    // テストの実行デモ
    console.log('\n=== テスト実行デモ ===');
    
    const testTypes = [
      { type: TestType.UNIT, name: 'ユニットテスト' },
      { type: TestType.INTEGRATION, name: '統合テスト' },
      { type: TestType.ACCEPTANCE, name: '受け入れテスト' },
      { type: TestType.PERFORMANCE, name: 'パフォーマンステスト' }
    ];

    for (const { type, name } of testTypes) {
      console.log(`\n🧪 ${name}を実行中...`);
      
      try {
        const result = await manager.runTests(type, {
          timeout: 10000,
          maxConcurrency: 2,
          coverage: false
        });

        const statusIcon = {
          pass: '✅',
          fail: '❌',
          skip: '⏭️'
        }[result.status];

        console.log(`${statusIcon} ${name}結果: ${result.status}`);
        console.log(`   └─ 総テスト数: ${result.totalTests}`);
        console.log(`   └─ 成功: ${result.passedTests}`);
        console.log(`   └─ 失敗: ${result.failedTests}`);
        console.log(`   └─ スキップ: ${result.skippedTests}`);
        console.log(`   └─ 実行時間: ${result.duration}ms`);

        if (result.errors.length > 0) {
          console.log(`   └─ エラー: ${result.errors.length}件`);
          result.errors.slice(0, 3).forEach((error, index) => {
            console.log(`      ${index + 1}. ${error.testName}: ${error.error}`);
          });
        }
      } catch (error) {
        console.log(`❌ ${name}実行中にエラー: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // テスト結果レポートの確認
    console.log('\n=== テスト結果レポート ===');
    try {
      const reportDir = '.kiro/reports/test-results';
      const reportFiles = await fs.readdir(reportDir);
      
      console.log(`生成されたレポート: ${reportFiles.length}件`);
      reportFiles.slice(-5).forEach(file => {
        console.log(`📊 ${file}`);
      });
    } catch (error) {
      console.log('⚠️ テスト結果レポートの確認に失敗');
    }

    // 統計情報の表示
    console.log('\n=== 統計情報 ===');
    console.log(`初期化状態: ${manager.isInitialized() ? '✅ 完了' : '❌ 未完了'}`);
    console.log(`検出された不足メソッド: ${missingMethods.length}個`);
    console.log(`自動修正可能: ${missingMethods.filter(m => m.autoFixable).length}個`);
    console.log(`確認された依存関係: ${dependencies.length}個`);
    console.log(`インストール済み: ${dependencies.filter(d => d.installed).length}個`);
    console.log(`互換性あり: ${dependencies.filter(d => d.compatible).length}個`);

    // パフォーマンス情報
    const memoryUsage = process.memoryUsage();
    console.log('\nパフォーマンス情報:');
    console.log(`メモリ使用量: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`);
    console.log(`実行時間: ${process.uptime().toFixed(2)}秒`);

    console.log('\n🎉 TestFrameworkManagerデモが完了しました！');

    // 推奨事項の表示
    console.log('\n=== 推奨事項 ===');
    const recommendations = [];

    if (missingMethods.some(m => m.severity === 'critical')) {
      recommendations.push('🚨 重要度が高い不足メソッドがあります。優先的に対応してください。');
    }

    if (dependencies.some(d => !d.installed && d.required)) {
      recommendations.push('📦 必須の依存関係が不足しています。インストールを実行してください。');
    }

    if (dependencies.some(d => d.installed && !d.compatible)) {
      recommendations.push('⚠️ 互換性のない依存関係があります。更新を検討してください。');
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ テスト環境は良好な状態です。');
    }

    recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });

  } catch (error) {
    console.error('❌ デモ実行中にエラーが発生しました:', error);
    process.exit(1);
  }
}

// スクリプトが直接実行された場合のみmain関数を呼び出し
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { main };