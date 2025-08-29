#!/usr/bin/env node

/**
 * 依存関係解決機能のデモ実行スクリプト
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';

async function runDependencyResolutionDemo() {
  console.log('🚀 依存関係解決機能のデモを実行');
  console.log('='.repeat(50));

  try {
    // TypeScriptファイルを直接実行するためのテストコードを作成
    const testCode = `
import { TestFrameworkManager } from '../lib/trust-policy/test-framework-manager';

async function demonstrateDependencyResolution() {
  console.log('🚀 依存関係解決機能のデモンストレーション');
  console.log('='.repeat(50));

  try {
    const manager = new TestFrameworkManager();

    // 1. 初期化
    console.log('\\n📋 Step 1: TestFrameworkManagerの初期化');
    await manager.initialize();

    // 2. 現在の依存関係状況を表示
    console.log('\\n📦 Step 2: 現在の依存関係状況');
    const dependencies = manager.getDependencies();
    
    console.log(\`\\n📊 依存関係サマリー:\`);
    console.log(\`- 総数: \${dependencies.length}個\`);
    console.log(\`- インストール済み: \${dependencies.filter(d => d.installed).length}個\`);
    console.log(\`- 不足: \${dependencies.filter(d => !d.installed && d.required).length}個\`);
    console.log(\`- 非互換: \${dependencies.filter(d => d.installed && !d.compatible).length}個\`);

    // 3. 詳細な依存関係情報を表示
    console.log('\\n📋 Step 3: 依存関係の詳細');
    for (const dep of dependencies.slice(0, 5)) { // 最初の5個のみ表示
      const status = dep.installed 
        ? (dep.compatible ? '✅ OK' : '⚠️ 非互換') 
        : (dep.required ? '❌ 不足' : '⏭️ オプション');
      
      console.log(\`\${status} \${dep.name}@\${dep.version}\`);
      
      if (dep.installedVersion) {
        console.log(\`   インストール済み: \${dep.installedVersion}\`);
      }
      
      if (dep.issues.length > 0) {
        dep.issues.slice(0, 2).forEach(issue => {
          console.log(\`   ⚠️ \${issue}\`);
        });
      }
    }

    // 4. 依存関係の解決を実行
    console.log('\\n🔧 Step 4: 依存関係の解決を実行');
    const resolutionResult = await manager.resolveDependencies();

    // 5. 解決結果を表示
    console.log('\\n📊 Step 5: 解決結果');
    console.log(\`✅ インストール済み: \${resolutionResult.installed.length}個\`);
    console.log(\`🔄 更新済み: \${resolutionResult.updated.length}個\`);
    console.log(\`❌ 失敗: \${resolutionResult.failed.length}個\`);
    console.log(\`🚨 競合: \${resolutionResult.conflicts.length}個\`);

    // 6. 推奨事項を表示
    if (resolutionResult.recommendations.length > 0) {
      console.log('\\n💡 Step 6: 推奨事項');
      resolutionResult.recommendations.slice(0, 3).forEach((recommendation, index) => {
        console.log(\`\${index + 1}. \${recommendation}\`);
      });
    }

    console.log('\\n✅ 依存関係解決機能のデモが完了しました');
    return true;

  } catch (error) {
    console.error('\\n❌ デモ実行中にエラーが発生しました:', error.message);
    return false;
  }
}

demonstrateDependencyResolution().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ 予期しないエラー:', error);
  process.exit(1);
});
`;

    // 一時的なテストファイルを作成
    const tempTestFile = '.kiro/temp/dependency-resolution-demo.ts';
    await fs.mkdir('.kiro/temp', { recursive: true });
    await fs.writeFile(tempTestFile, testCode);

    // ts-nodeを使用してTypeScriptファイルを実行
    const result = await runTypeScriptFile(tempTestFile);

    // 一時ファイルを削除
    try {
      await fs.unlink(tempTestFile);
    } catch (error) {
      console.warn('⚠️ 一時ファイルの削除に失敗:', error.message);
    }

    if (result.success) {
      console.log('\\n🎉 デモンストレーションが正常に完了しました！');
      return true;
    } else {
      console.log('\\n❌ デモンストレーションが失敗しました');
      console.log(result.output);
      return false;
    }

  } catch (error) {
    console.error('❌ デモ実行中にエラーが発生しました:', error);
    return false;
  }
}

/**
 * TypeScriptファイルの実行
 */
async function runTypeScriptFile(filePath) {
  return new Promise((resolve) => {
    // ts-nodeまたはnpx tsx を使用してTypeScriptファイルを実行
    const tsNode = spawn('npx', ['tsx', filePath], {
      stdio: 'pipe',
      cwd: process.cwd()
    });

    let output = '';
    let errorOutput = '';

    tsNode.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      process.stdout.write(text); // リアルタイム出力
    });

    tsNode.stderr.on('data', (data) => {
      const text = data.toString();
      errorOutput += text;
      process.stderr.write(text); // リアルタイム出力
    });

    tsNode.on('close', (code) => {
      resolve({
        success: code === 0,
        output: output + errorOutput,
        exitCode: code
      });
    });

    tsNode.on('error', (error) => {
      resolve({
        success: false,
        output: error.message,
        error: error.message
      });
    });
  });
}

// メイン実行
if (import.meta.url === `file://${process.argv[1]}`) {
  runDependencyResolutionDemo().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ 予期しないエラー:', error);
    process.exit(1);
  });
}

export { runDependencyResolutionDemo };