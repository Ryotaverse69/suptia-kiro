#!/usr/bin/env node

/**
 * CI/CDパイプラインの失敗を診断し、解決方法を提案するスクリプト
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import chalk from 'chalk';

class CIDiagnostics {
  constructor() {
    this.checks = [
      { name: 'format:check', command: 'npm run format:check', fix: 'npm run format' },
      { name: 'lint', command: 'npm run lint', fix: 'npm run lint:fix' },
      { name: 'test', command: 'npm run test -- --run', fix: 'テストコードの修正が必要' },
      { name: 'typecheck', command: 'npm run typecheck', fix: 'TypeScript型エラーの修正が必要' },
      { name: 'build', command: 'npm run build', fix: 'ビルドエラーの修正が必要' },
      { name: 'headers', command: 'npm run headers', fix: 'vercel.json のヘッダー設定確認' },
      { name: 'jsonld', command: 'npm run jsonld', fix: '構造化データの修正が必要' },
      { name: 'dod:check', command: 'npm run dod:check', fix: 'Definition of Done項目の完了が必要' }
    ];
    this.results = [];
  }

  /**
   * 診断を実行
   */
  async diagnose() {
    console.log(chalk.blue('🔍 CI/CDパイプラインの診断を開始します...\n'));

    // 環境チェック
    await this.checkEnvironment();

    // 各チェックを実行
    for (const check of this.checks) {
      await this.runCheck(check);
    }

    this.displayResults();
    this.suggestFixes();
  }

  /**
   * 環境をチェック
   */
  async checkEnvironment() {
    console.log(chalk.blue('📋 環境チェック中...'));

    // Node.js バージョン確認
    try {
      const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
      const majorVersion = parseInt(nodeVersion.replace('v', '').split('.')[0]);
      
      if (majorVersion >= 18) {
        console.log(chalk.green(`✅ Node.js ${nodeVersion} (推奨バージョン)`));
      } else {
        console.log(chalk.red(`❌ Node.js ${nodeVersion} (v18以上が必要)`));
        this.results.push({
          check: 'environment',
          status: 'failed',
          error: `Node.js ${nodeVersion} は古すぎます`,
          fix: 'Node.js v18以上にアップグレードしてください'
        });
      }
    } catch (error) {
      console.log(chalk.red('❌ Node.js が見つかりません'));
    }

    // npm 依存関係確認
    if (existsSync('node_modules')) {
      console.log(chalk.green('✅ node_modules が存在します'));
    } else {
      console.log(chalk.red('❌ node_modules が見つかりません'));
      this.results.push({
        check: 'environment',
        status: 'failed',
        error: 'node_modules が見つかりません',
        fix: 'npm install を実行してください'
      });
    }

    // 環境変数ファイル確認
    if (existsSync('apps/web/.env.local')) {
      console.log(chalk.green('✅ 環境変数ファイルが存在します'));
    } else {
      console.log(chalk.yellow('⚠️  .env.local が見つかりません'));
      this.results.push({
        check: 'environment',
        status: 'warning',
        error: '.env.local が見つかりません',
        fix: 'apps/web/.env.local.example をコピーして .env.local を作成してください'
      });
    }

    console.log('');
  }

  /**
   * 個別チェックを実行
   */
  async runCheck(check) {
    console.log(chalk.blue(`🔍 ${check.name} をチェック中...`));

    try {
      const startTime = Date.now();
      execSync(check.command, { stdio: 'pipe', timeout: 300000 }); // 5分タイムアウト
      const duration = Date.now() - startTime;

      console.log(chalk.green(`✅ ${check.name} 成功 (${duration}ms)`));
      this.results.push({
        check: check.name,
        status: 'passed',
        duration
      });
    } catch (error) {
      const errorOutput = error.stdout?.toString() || error.stderr?.toString() || error.message;
      console.log(chalk.red(`❌ ${check.name} 失敗`));
      
      this.results.push({
        check: check.name,
        status: 'failed',
        error: this.parseError(check.name, errorOutput),
        fix: check.fix,
        rawError: errorOutput
      });
    }
  }

  /**
   * エラーメッセージを解析
   */
  parseError(checkName, errorOutput) {
    switch (checkName) {
      case 'format:check':
        return this.parseFormatError(errorOutput);
      case 'lint':
        return this.parseLintError(errorOutput);
      case 'test':
        return this.parseTestError(errorOutput);
      case 'typecheck':
        return this.parseTypecheckError(errorOutput);
      case 'build':
        return this.parseBuildError(errorOutput);
      case 'headers':
        return this.parseHeadersError(errorOutput);
      case 'jsonld':
        return this.parseJsonldError(errorOutput);
      case 'dod:check':
        return this.parseDodError(errorOutput);
      default:
        return errorOutput.split('\n').slice(0, 5).join('\n');
    }
  }

  /**
   * フォーマットエラーを解析
   */
  parseFormatError(output) {
    const lines = output.split('\n');
    const fileLines = lines.filter(line => line.includes('.ts') || line.includes('.tsx') || line.includes('.js') || line.includes('.jsx'));
    
    if (fileLines.length > 0) {
      return `フォーマットが必要なファイル:\n${fileLines.slice(0, 10).join('\n')}`;
    }
    return 'コードフォーマットの問題が検出されました';
  }

  /**
   * Lintエラーを解析
   */
  parseLintError(output) {
    const lines = output.split('\n');
    const errorLines = lines.filter(line => 
      line.includes('error') || line.includes('warning')
    );
    
    if (errorLines.length > 0) {
      return `ESLintエラー:\n${errorLines.slice(0, 10).join('\n')}`;
    }
    return 'ESLintエラーが検出されました';
  }

  /**
   * テストエラーを解析
   */
  parseTestError(output) {
    const lines = output.split('\n');
    const failedTests = lines.filter(line => 
      line.includes('FAIL') || line.includes('✕') || line.includes('Expected')
    );
    
    if (failedTests.length > 0) {
      return `テスト失敗:\n${failedTests.slice(0, 10).join('\n')}`;
    }
    return 'テストが失敗しました';
  }

  /**
   * TypeScriptエラーを解析
   */
  parseTypecheckError(output) {
    const lines = output.split('\n');
    const typeErrors = lines.filter(line => 
      line.includes('error TS') || line.includes('Type ')
    );
    
    if (typeErrors.length > 0) {
      return `TypeScriptエラー:\n${typeErrors.slice(0, 10).join('\n')}`;
    }
    return 'TypeScript型チェックエラーが検出されました';
  }

  /**
   * ビルドエラーを解析
   */
  parseBuildError(output) {
    const lines = output.split('\n');
    const buildErrors = lines.filter(line => 
      line.includes('Error:') || line.includes('Failed to compile')
    );
    
    if (buildErrors.length > 0) {
      return `ビルドエラー:\n${buildErrors.slice(0, 10).join('\n')}`;
    }
    return 'ビルドが失敗しました';
  }

  /**
   * ヘッダーエラーを解析
   */
  parseHeadersError(output) {
    if (output.includes('Missing security header')) {
      return 'セキュリティヘッダーが不足しています';
    }
    return 'セキュリティヘッダーの検証に失敗しました';
  }

  /**
   * JSON-LDエラーを解析
   */
  parseJsonldError(output) {
    if (output.includes('Invalid JSON-LD')) {
      return 'JSON-LD構造化データが無効です';
    }
    return '構造化データの検証に失敗しました';
  }

  /**
   * DoDエラーを解析
   */
  parseDodError(output) {
    const lines = output.split('\n');
    const dodErrors = lines.filter(line => 
      line.includes('✗') || line.includes('Missing')
    );
    
    if (dodErrors.length > 0) {
      return `Definition of Done未完了項目:\n${dodErrors.slice(0, 10).join('\n')}`;
    }
    return 'Definition of Done項目が未完了です';
  }

  /**
   * 結果を表示
   */
  displayResults() {
    console.log('\n' + chalk.bold('📊 CI/CD診断結果') + '\n');

    const passed = this.results.filter(r => r.status === 'passed');
    const failed = this.results.filter(r => r.status === 'failed');
    const warnings = this.results.filter(r => r.status === 'warning');

    console.log(chalk.green(`✅ 成功: ${passed.length}`));
    console.log(chalk.red(`❌ 失敗: ${failed.length}`));
    console.log(chalk.yellow(`⚠️  警告: ${warnings.length}`));

    if (failed.length === 0 && warnings.length === 0) {
      console.log(chalk.green('\n🎉 すべてのチェックが成功しました！'));
      console.log(chalk.green('PRを作成する準備ができています。'));
      return;
    }

    // 失敗したチェックの詳細
    if (failed.length > 0) {
      console.log(chalk.red.bold('\n❌ 失敗したチェック:'));
      failed.forEach(result => {
        console.log(chalk.red(`\n• ${result.check}`));
        console.log(chalk.gray(`  エラー: ${result.error}`));
        console.log(chalk.blue(`  修正方法: ${result.fix}`));
      });
    }

    // 警告の詳細
    if (warnings.length > 0) {
      console.log(chalk.yellow.bold('\n⚠️  警告:'));
      warnings.forEach(result => {
        console.log(chalk.yellow(`\n• ${result.check}`));
        console.log(chalk.gray(`  警告: ${result.error}`));
        console.log(chalk.blue(`  推奨対応: ${result.fix}`));
      });
    }
  }

  /**
   * 修正方法を提案
   */
  suggestFixes() {
    const failed = this.results.filter(r => r.status === 'failed');
    
    if (failed.length === 0) {
      return;
    }

    console.log(chalk.bold('\n🔧 自動修正可能な項目:') + '\n');

    const autoFixable = failed.filter(r => 
      r.check === 'format:check' || r.check === 'lint'
    );

    if (autoFixable.length > 0) {
      console.log(chalk.green('以下のコマンドで自動修正できます:'));
      autoFixable.forEach(result => {
        if (result.check === 'format:check') {
          console.log(chalk.blue('  npm run format'));
        } else if (result.check === 'lint') {
          console.log(chalk.blue('  npm run lint:fix'));
        }
      });
    }

    const manualFix = failed.filter(r => 
      !['format:check', 'lint'].includes(r.check)
    );

    if (manualFix.length > 0) {
      console.log(chalk.bold('\n🛠️  手動修正が必要な項目:') + '\n');
      manualFix.forEach(result => {
        console.log(chalk.yellow(`• ${result.check}: ${result.fix}`));
      });
    }

    console.log(chalk.bold('\n📚 参考資料:'));
    console.log(chalk.gray('• トラブルシューティングガイド: docs/TROUBLESHOOTING.md'));
    console.log(chalk.gray('• 開発フローガイド: docs/DEVELOPMENT_WORKFLOW.md'));
    console.log(chalk.gray('• クイックリファレンス: docs/QUICK_REFERENCE.md'));
  }

  /**
   * 特定のチェックのみ実行
   */
  async runSpecificCheck(checkName) {
    const check = this.checks.find(c => c.name === checkName);
    if (!check) {
      console.log(chalk.red(`❌ チェック '${checkName}' が見つかりません`));
      console.log(chalk.blue('利用可能なチェック:'));
      this.checks.forEach(c => console.log(chalk.gray(`  • ${c.name}`)));
      return;
    }

    console.log(chalk.blue(`🔍 ${checkName} のみを実行します...\n`));
    await this.runCheck(check);
    
    const result = this.results[0];
    if (result.status === 'passed') {
      console.log(chalk.green(`\n✅ ${checkName} は正常です`));
    } else {
      console.log(chalk.red(`\n❌ ${checkName} で問題が見つかりました:`));
      console.log(chalk.gray(`エラー: ${result.error}`));
      console.log(chalk.blue(`修正方法: ${result.fix}`));
    }
  }
}

// コマンドライン引数の処理
const args = process.argv.slice(2);
const specificCheck = args.find(arg => arg.startsWith('--check='))?.split('=')[1];

// スクリプト実行
if (import.meta.url === `file://${process.argv[1]}`) {
  const diagnostics = new CIDiagnostics();
  
  if (specificCheck) {
    diagnostics.runSpecificCheck(specificCheck).catch(error => {
      console.error(chalk.red('診断中にエラーが発生しました:'), error.message);
      process.exit(1);
    });
  } else {
    diagnostics.diagnose().catch(error => {
      console.error(chalk.red('診断中にエラーが発生しました:'), error.message);
      process.exit(1);
    });
  }
}

export default CIDiagnostics;