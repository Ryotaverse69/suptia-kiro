#!/usr/bin/env node

/**
 * 依存関係解決機能のデモンストレーション
 */

// TypeScriptファイルを動的にインポート
const { TestFrameworkManager } = await import('./test-framework-manager.ts');

async function demonstrateDependencyResolution() {
  console.log('🚀 依存関係解決機能のデモンストレーション');
  console.log('='.repeat(50));

  try {
    const manager = new TestFrameworkManager();

    // 1. 初期化
    console.log('\n📋 Step 1: TestFrameworkManagerの初期化');
    await manager.initialize();

    // 2. 現在の依存関係状況を表示
    console.log('\n📦 Step 2: 現在の依存関係状況');
    const dependencies = manager.getDependencies();
    
    console.log(`\n📊 依存関係サマリー:`);
    console.log(`- 総数: ${dependencies.length}個`);
    console.log(`- インストール済み: ${dependencies.filter(d => d.installed).length}個`);
    console.log(`- 不足: ${dependencies.filter(d => !d.installed && d.required).length}個`);
    console.log(`- 非互換: ${dependencies.filter(d => d.installed && !d.compatible).length}個`);

    // 3. 詳細な依存関係情報を表示
    console.log('\n📋 Step 3: 依存関係の詳細');
    for (const dep of dependencies) {
      const status = dep.installed 
        ? (dep.compatible ? '✅ OK' : '⚠️ 非互換') 
        : (dep.required ? '❌ 不足' : '⏭️ オプション');
      
      console.log(`${status} ${dep.name}@${dep.version}`);
      
      if (dep.installedVersion) {
        console.log(`   インストール済み: ${dep.installedVersion}`);
      }
      
      if (dep.issues.length > 0) {
        dep.issues.forEach(issue => {
          console.log(`   ⚠️ ${issue}`);
        });
      }
      
      if (dep.conflictsWith && dep.conflictsWith.length > 0) {
        console.log(`   🚨 競合: ${dep.conflictsWith.join(', ')}`);
      }
    }

    // 4. 依存関係の解決を実行
    console.log('\n🔧 Step 4: 依存関係の解決を実行');
    const resolutionResult = await manager.resolveDependencies();

    // 5. 解決結果を表示
    console.log('\n📊 Step 5: 解決結果');
    console.log(`✅ インストール済み: ${resolutionResult.installed.length}個`);
    resolutionResult.installed.forEach(pkg => {
      console.log(`   - ${pkg}`);
    });

    console.log(`🔄 更新済み: ${resolutionResult.updated.length}個`);
    resolutionResult.updated.forEach(pkg => {
      console.log(`   - ${pkg}`);
    });

    console.log(`❌ 失敗: ${resolutionResult.failed.length}個`);
    resolutionResult.failed.forEach(pkg => {
      console.log(`   - ${pkg}`);
    });

    // 6. 競合情報を表示
    if (resolutionResult.conflicts.length > 0) {
      console.log('\n🚨 Step 6: 検出された競合');
      resolutionResult.conflicts.forEach((conflict, index) => {
        console.log(`\n${index + 1}. ${conflict.package1} vs ${conflict.package2}`);
        console.log(`   タイプ: ${conflict.conflictType}`);
        console.log(`   重要度: ${conflict.severity}`);
        console.log(`   説明: ${conflict.description}`);
        console.log(`   解決策: ${conflict.resolution}`);
      });
    }

    // 7. 推奨事項を表示
    if (resolutionResult.recommendations.length > 0) {
      console.log('\n💡 Step 7: 推奨事項');
      resolutionResult.recommendations.forEach((recommendation, index) => {
        console.log(`${index + 1}. ${recommendation}`);
      });
    }

    // 8. 最終状態の確認
    console.log('\n🔍 Step 8: 解決後の状態確認');
    const finalDependencies = manager.getDependencies();
    const stillMissing = finalDependencies.filter(d => !d.installed && d.required);
    const stillIncompatible = finalDependencies.filter(d => d.installed && !d.compatible);

    if (stillMissing.length === 0 && stillIncompatible.length === 0) {
      console.log('✅ すべての依存関係が解決されました！');
    } else {
      console.log(`⚠️ 未解決の問題: 不足 ${stillMissing.length}個, 非互換 ${stillIncompatible.length}個`);
      
      if (stillMissing.length > 0) {
        console.log('\n❌ 未解決の不足依存関係:');
        stillMissing.forEach(dep => {
          console.log(`   - ${dep.name}@${dep.version}`);
          console.log(`     理由: ${dep.autoInstallable ? '自動インストール失敗' : '手動インストール必要'}`);
        });
      }

      if (stillIncompatible.length > 0) {
        console.log('\n⚠️ 未解決の非互換依存関係:');
        stillIncompatible.forEach(dep => {
          console.log(`   - ${dep.name}: ${dep.installedVersion} → ${dep.version}`);
        });
      }
    }

    console.log('\n✅ 依存関係解決機能のデモが完了しました');

  } catch (error) {
    console.error('\n❌ デモ実行中にエラーが発生しました:', error);
    
    if (error instanceof Error) {
      console.error('エラー詳細:', error.message);
      if (error.stack) {
        console.error('スタックトレース:', error.stack);
      }
    }
    
    process.exit(1);
  }
}

// メイン実行
if (import.meta.url === `file://${process.argv[1]}`) {
  demonstrateDependencyResolution().catch(error => {
    console.error('❌ 予期しないエラー:', error);
    process.exit(1);
  });
}

export { demonstrateDependencyResolution };