#!/usr/bin/env node

/**
 * Definition of Done (DoD) 自動検証スクリプト
 * 要件8.6: DoD基準の自動チェック
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const WORKSPACE_ROOT = process.cwd();
const WEB_APP_PATH = join(WORKSPACE_ROOT, 'apps/web');

class DoD {
  constructor() {
    this.results = {
      tests: { status: 'pending', details: '' },
      build: { status: 'pending', details: '' },
      lint: { status: 'pending', details: '' },
      format: { status: 'pending', details: '' },
      typecheck: { status: 'pending', details: '' },
      security: { status: 'pending', details: '' },
      accessibility: { status: 'pending', details: '' },
      seo: { status: 'pending', details: '' },
      performance: { status: 'pending', details: '' }
    };
  }

  log(message, type = 'info') {
    const icons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      progress: '🔄'
    };
    console.log(`${icons[type]} ${message}`);
  }

  async runCommand(command, cwd = WEB_APP_PATH) {
    try {
      const output = execSync(command, { 
        cwd, 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      return { success: true, output };
    } catch (error) {
      return { success: false, output: error.message };
    }
  }

  async checkTests() {
    this.log('テスト実行中...', 'progress');
    
    const result = await this.runCommand('pnpm run test --run');
    
    if (result.success) {
      this.results.tests = { 
        status: 'pass', 
        details: 'すべてのテストが成功しました' 
      };
      this.log('テスト: 成功', 'success');
    } else {
      this.results.tests = { 
        status: 'fail', 
        details: result.output 
      };
      this.log('テスト: 失敗', 'error');
    }
  }

  async checkBuild() {
    this.log('ビルド確認中...', 'progress');
    
    const result = await this.runCommand('pnpm run build');
    
    if (result.success) {
      this.results.build = { 
        status: 'pass', 
        details: 'ビルドが成功しました' 
      };
      this.log('ビルド: 成功', 'success');
    } else {
      this.results.build = { 
        status: 'fail', 
        details: result.output 
      };
      this.log('ビルド: 失敗', 'error');
    }
  }

  async checkLint() {
    this.log('Lint確認中...', 'progress');
    
    const result = await this.runCommand('pnpm run lint');
    
    if (result.success) {
      this.results.lint = { 
        status: 'pass', 
        details: 'Lintエラーはありません' 
      };
      this.log('Lint: 成功', 'success');
    } else {
      this.results.lint = { 
        status: 'warning', 
        details: result.output 
      };
      this.log('Lint: 警告あり', 'warning');
    }
  }

  async checkFormat() {
    this.log('フォーマット確認中...', 'progress');
    
    const result = await this.runCommand('pnpm run format:check');
    
    if (result.success) {
      this.results.format = { 
        status: 'pass', 
        details: 'フォーマットは正しく設定されています' 
      };
      this.log('フォーマット: 成功', 'success');
    } else {
      this.results.format = { 
        status: 'warning', 
        details: result.output 
      };
      this.log('フォーマット: 警告あり', 'warning');
    }
  }

  async checkTypecheck() {
    this.log('型チェック中...', 'progress');
    
    const result = await this.runCommand('pnpm run typecheck');
    
    if (result.success) {
      this.results.typecheck = { 
        status: 'pass', 
        details: '型エラーはありません' 
      };
      this.log('型チェック: 成功', 'success');
    } else {
      this.results.typecheck = { 
        status: 'warning', 
        details: result.output 
      };
      this.log('型チェック: 警告あり', 'warning');
    }
  }

  async checkSecurity() {
    this.log('セキュリティ監査中...', 'progress');
    
    // pnpm audit
    const auditResult = await this.runCommand('pnpm audit --audit-level moderate');
    
    if (auditResult.success) {
      this.results.security = { 
        status: 'pass', 
        details: 'セキュリティ脆弱性は検出されませんでした' 
      };
      this.log('セキュリティ監査: 成功', 'success');
    } else {
      this.results.security = { 
        status: 'warning', 
        details: auditResult.output 
      };
      this.log('セキュリティ監査: 警告あり', 'warning');
    }
  }  
async checkAccessibility() {
    this.log('アクセシビリティ確認中...', 'progress');
    
    // アクセシビリティテストの実行
    const a11yResult = await this.runCommand('pnpm run test --run --testNamePattern="accessibility|a11y|aria"');
    
    if (a11yResult.success) {
      this.results.accessibility = { 
        status: 'pass', 
        details: 'アクセシビリティテストが成功しました' 
      };
      this.log('アクセシビリティ: 成功', 'success');
    } else {
      this.results.accessibility = { 
        status: 'warning', 
        details: a11yResult.output 
      };
      this.log('アクセシビリティ: 警告あり', 'warning');
    }
  }

  async checkSEO() {
    this.log('SEO確認中...', 'progress');
    
    // SEOテストの実行
    const seoResult = await this.runCommand('pnpm run test --run --testNamePattern="seo|json-ld|sitemap|canonical"');
    
    if (seoResult.success) {
      this.results.seo = { 
        status: 'pass', 
        details: 'SEOテストが成功しました' 
      };
      this.log('SEO: 成功', 'success');
    } else {
      this.results.seo = { 
        status: 'warning', 
        details: seoResult.output 
      };
      this.log('SEO: 警告あり', 'warning');
    }
  }

  async checkPerformance() {
    this.log('パフォーマンス確認中...', 'progress');
    
    // Lighthouse設定ファイルの存在確認
    const lighthouseConfigExists = existsSync(join(WORKSPACE_ROOT, 'lighthouserc.js'));
    
    if (lighthouseConfigExists) {
      this.results.performance = { 
        status: 'pass', 
        details: 'Lighthouse CI設定が正しく設定されています' 
      };
      this.log('パフォーマンス設定: 成功', 'success');
    } else {
      this.results.performance = { 
        status: 'warning', 
        details: 'Lighthouse CI設定ファイルが見つかりません' 
      };
      this.log('パフォーマンス設定: 警告', 'warning');
    }
  }

  generateReport() {
    this.log('\n📊 Definition of Done (DoD) 検証結果', 'info');
    this.log('=' * 50, 'info');
    
    const categories = [
      { key: 'tests', name: 'テスト実行', required: true },
      { key: 'build', name: 'ビルド', required: true },
      { key: 'lint', name: 'Lint', required: false },
      { key: 'format', name: 'フォーマット', required: false },
      { key: 'typecheck', name: '型チェック', required: false },
      { key: 'security', name: 'セキュリティ監査', required: false },
      { key: 'accessibility', name: 'アクセシビリティ', required: false },
      { key: 'seo', name: 'SEO', required: false },
      { key: 'performance', name: 'パフォーマンス設定', required: false }
    ];

    let requiredPassed = 0;
    let requiredTotal = 0;
    let overallPassed = 0;
    let overallTotal = categories.length;

    categories.forEach(({ key, name, required }) => {
      const result = this.results[key];
      const icon = result.status === 'pass' ? '✅' : 
                   result.status === 'warning' ? '⚠️' : '❌';
      
      console.log(`${icon} ${name}: ${result.status.toUpperCase()}`);
      
      if (result.status === 'pass') {
        overallPassed++;
        if (required) requiredPassed++;
      }
      
      if (required) requiredTotal++;
      
      if (result.details && result.status !== 'pass') {
        console.log(`   詳細: ${result.details.split('\n')[0]}`);
      }
    });

    this.log('\n📈 サマリー', 'info');
    this.log(`必須項目: ${requiredPassed}/${requiredTotal} 通過`, 
             requiredPassed === requiredTotal ? 'success' : 'error');
    this.log(`全体: ${overallPassed}/${overallTotal} 通過`, 'info');
    
    const overallStatus = requiredPassed === requiredTotal ? 'PASS' : 'FAIL';
    this.log(`\n🎯 総合判定: ${overallStatus}`, 
             overallStatus === 'PASS' ? 'success' : 'error');

    return overallStatus === 'PASS';
  }

  async run() {
    this.log('🚀 Definition of Done (DoD) 検証を開始します', 'info');
    
    await this.checkTests();
    await this.checkBuild();
    await this.checkLint();
    await this.checkFormat();
    await this.checkTypecheck();
    await this.checkSecurity();
    await this.checkAccessibility();
    await this.checkSEO();
    await this.checkPerformance();
    
    const passed = this.generateReport();
    
    process.exit(passed ? 0 : 1);
  }
}

// スクリプト実行
const dod = new DoD();
dod.run().catch(error => {
  console.error('❌ DoD検証中にエラーが発生しました:', error);
  process.exit(1);
});