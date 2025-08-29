#!/usr/bin/env node

/**
 * 依存関係解決機能の検証スクリプト
 */

// TypeScriptファイルを動的にインポート
const { TestFrameworkManager } = await import('./test-framework-manager.ts');
import { promises as fs } from 'fs';
import { join } from 'path';

/**
 * 依存関係解決機能の検証
 */
async function verifyDependencyResolution() {
  console.log('🔍 依存関係解決機能の検証を開始');
  console.log('='.repeat(50));

  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  try {
    const manager = new TestFrameworkManager();
    await manager.initialize();

    // テスト1: 基本的な依存関係検出
    console.log('\n📋 Test 1: 基本的な依存関係検出');
    try {
      const dependencies = manager.getDependencies();
      
      if (dependencies.length > 0) {
        console.log('✅ 依存関係の検出に成功');
        results.passed++;
        results.tests.push({ name: '依存関係検出', status: 'passed' });
      } else {
        throw new Error('依存関係が検出されませんでした');
      }
    } catch (error) {
      console.log('❌ 依存関係の検出に失敗:', error.message);
      results.failed++;
      results.tests.push({ name: '依存関係検出', status: 'failed', error: error.message });
    }

    // テスト2: バージョン互換性チェック
    console.log('\n📋 Test 2: バージョン互換性チェック');
    try {
      // プライベートメソッドのテスト
      const isCompatible1 = await manager.isVersionCompatible('^29.1.0', '^29.0.0');
      const isCompatible2 = await manager.isVersionCompatible('~29.0.1', '~29.0.0');
      const isNotCompatible = await manager.isVersionCompatible('^28.0.0', '^29.0.0');

      if (isCompatible1 && isCompatible2 && !isNotCompatible) {
        console.log('✅ バージョン互換性チェックが正常に動作');
        results.passed++;
        results.tests.push({ name: 'バージョン互換性チェック', status: 'passed' });
      } else {
        throw new Error('バージョン互換性チェックの結果が期待と異なります');
      }
    } catch (error) {
      console.log('❌ バージョン互換性チェックに失敗:', error.message);
      results.failed++;
      results.tests.push({ name: 'バージョン互換性チェック', status: 'failed', error: error.message });
    }

    // テスト3: 依存関係解決の実行
    console.log('\n📋 Test 3: 依存関係解決の実行');
    try {
      const resolutionResult = await manager.resolveDependencies();
      
      if (resolutionResult && typeof resolutionResult === 'object') {
        console.log('✅ 依存関係解決の実行に成功');
        console.log(`   - インストール: ${resolutionResult.installed.length}個`);
        console.log(`   - 更新: ${resolutionResult.updated.length}個`);
        console.log(`   - 失敗: ${resolutionResult.failed.length}個`);
        console.log(`   - 競合: ${resolutionResult.conflicts.length}個`);
        
        results.passed++;
        results.tests.push({ 
          name: '依存関係解決実行', 
          status: 'passed',
          details: {
            installed: resolutionResult.installed.length,
            updated: resolutionResult.updated.length,
            failed: resolutionResult.failed.length,
            conflicts: resolutionResult.conflicts.length
          }
        });
      } else {
        throw new Error('依存関係解決の結果が無効です');
      }
    } catch (error) {
      console.log('❌ 依存関係解決の実行に失敗:', error.message);
      results.failed++;
      results.tests.push({ name: '依存関係解決実行', status: 'failed', error: error.message });
    }

    // テスト4: 競合検出機能
    console.log('\n📋 Test 4: 競合検出機能');
    try {
      // テスト用の競合シナリオを作成
      const testPackageJson = {
        devDependencies: {
          'jest': '^29.0.0',
          'vitest': '^0.34.0' // Jestと競合するテストランナー
        }
      };

      // 一時的なテスト環境を作成
      const tempDir = join(process.cwd(), '.kiro', 'temp', 'conflict-test');
      await fs.mkdir(tempDir, { recursive: true });
      await fs.writeFile(
        join(tempDir, 'package.json'), 
        JSON.stringify(testPackageJson, null, 2)
      );

      // 元のディレクトリを保存
      const originalCwd = process.cwd();
      
      try {
        // テストディレクトリに移動
        process.chdir(tempDir);
        
        const testManager = new TestFrameworkManager();
        await testManager.initialize();
        const result = await testManager.resolveDependencies();
        
        // 競合が検出されることを確認
        const hasConflicts = result.conflicts.length > 0;
        const hasPeerConflict = result.conflicts.some(c => c.conflictType === 'peer');
        
        if (hasConflicts && hasPeerConflict) {
          console.log('✅ 競合検出機能が正常に動作');
          results.passed++;
          results.tests.push({ name: '競合検出機能', status: 'passed' });
        } else {
          throw new Error('期待される競合が検出されませんでした');
        }
      } finally {
        // 元のディレクトリに戻る
        process.chdir(originalCwd);
        
        // テスト環境をクリーンアップ
        try {
          await fs.rm(tempDir, { recursive: true, force: true });
        } catch (cleanupError) {
          console.warn('⚠️ テスト環境のクリーンアップに失敗:', cleanupError.message);
        }
      }
    } catch (error) {
      console.log('❌ 競合検出機能のテストに失敗:', error.message);
      results.failed++;
      results.tests.push({ name: '競合検出機能', status: 'failed', error: error.message });
    }

    // テスト5: エラーハンドリング
    console.log('\n📋 Test 5: エラーハンドリング');
    try {
      // 無効なpackage.jsonでのテスト
      const tempDir = join(process.cwd(), '.kiro', 'temp', 'error-test');
      await fs.mkdir(tempDir, { recursive: true });
      await fs.writeFile(join(tempDir, 'package.json'), 'invalid json');

      const originalCwd = process.cwd();
      
      try {
        process.chdir(tempDir);
        
        const testManager = new TestFrameworkManager();
        await testManager.initialize();
        
        // エラーが発生してもクラッシュしないことを確認
        const dependencies = testManager.getDependencies();
        const hasErrorIssues = dependencies.some(dep => 
          dep.issues.some(issue => issue.includes('確認に失敗'))
        );
        
        if (hasErrorIssues) {
          console.log('✅ エラーハンドリングが正常に動作');
          results.passed++;
          results.tests.push({ name: 'エラーハンドリング', status: 'passed' });
        } else {
          throw new Error('エラーハンドリングが期待通りに動作しませんでした');
        }
      } finally {
        process.chdir(originalCwd);
        
        try {
          await fs.rm(tempDir, { recursive: true, force: true });
        } catch (cleanupError) {
          console.warn('⚠️ テスト環境のクリーンアップに失敗:', cleanupError.message);
        }
      }
    } catch (error) {
      console.log('❌ エラーハンドリングのテストに失敗:', error.message);
      results.failed++;
      results.tests.push({ name: 'エラーハンドリング', status: 'failed', error: error.message });
    }

    // テスト6: パフォーマンステスト
    console.log('\n📋 Test 6: パフォーマンステスト');
    try {
      const startTime = Date.now();
      
      // 依存関係解決を複数回実行してパフォーマンスを測定
      for (let i = 0; i < 3; i++) {
        await manager.resolveDependencies();
      }
      
      const endTime = Date.now();
      const averageTime = (endTime - startTime) / 3;
      
      // 1回あたり5秒以内であることを確認
      if (averageTime < 5000) {
        console.log(`✅ パフォーマンステスト合格 (平均 ${averageTime.toFixed(0)}ms)`);
        results.passed++;
        results.tests.push({ 
          name: 'パフォーマンステスト', 
          status: 'passed',
          details: { averageTime: Math.round(averageTime) }
        });
      } else {
        throw new Error(`パフォーマンスが基準を下回りました (平均 ${averageTime.toFixed(0)}ms > 5000ms)`);
      }
    } catch (error) {
      console.log('❌ パフォーマンステストに失敗:', error.message);
      results.failed++;
      results.tests.push({ name: 'パフォーマンステスト', status: 'failed', error: error.message });
    }

    // 結果の表示
    console.log('\n📊 検証結果サマリー');
    console.log('='.repeat(30));
    console.log(`✅ 成功: ${results.passed}個`);
    console.log(`❌ 失敗: ${results.failed}個`);
    console.log(`📊 成功率: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);

    // 詳細結果の保存
    const reportPath = '.kiro/reports/dependency-resolution-verification.json';
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        passed: results.passed,
        failed: results.failed,
        successRate: (results.passed / (results.passed + results.failed)) * 100
      },
      tests: results.tests,
      environment: {
        nodeVersion: process.version,
        platform: process.platform
      }
    };

    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 詳細レポートを保存: ${reportPath}`);

    if (results.failed === 0) {
      console.log('\n🎉 すべてのテストが成功しました！');
      return true;
    } else {
      console.log('\n⚠️ 一部のテストが失敗しました。詳細を確認してください。');
      return false;
    }

  } catch (error) {
    console.error('\n❌ 検証中に予期しないエラーが発生しました:', error);
    
    if (error instanceof Error) {
      console.error('エラー詳細:', error.message);
      if (error.stack) {
        console.error('スタックトレース:', error.stack);
      }
    }
    
    return false;
  }
}

// メイン実行
if (import.meta.url === `file://${process.argv[1]}`) {
  verifyDependencyResolution().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ 予期しないエラー:', error);
    process.exit(1);
  });
}

export { verifyDependencyResolution };