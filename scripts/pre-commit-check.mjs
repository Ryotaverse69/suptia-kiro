#!/usr/bin/env node

import { execSync } from 'child_process';
import { performance } from 'perf_hooks';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import ErrorHandler from './utils/error-handler.mjs';

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const ICONS = {
  start: '🚀',
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
  time: '⏱️'
};

class PreCommitChecker {
  constructor() {
    this.metrics = {
      startTime: performance.now(),
      steps: [],
      totalTime: 0,
      success: true
    };
    
    // 緊急時のスキップオプション
    this.skipChecks = process.env.SKIP_PRE_COMMIT === 'true';
    this.skipTests = process.env.SKIP_TESTS === 'true';
    this.errorHandler = new ErrorHandler();
  }

  log(message, color = 'reset', icon = '') {
    const colorCode = COLORS[color] || COLORS.reset;
    console.log(`${colorCode}${icon} ${message}${COLORS.reset}`);
  }

  async runStep(name, command, options = {}) {
    const stepStart = performance.now();
    
    this.log(`${name}を実行中...`, 'cyan', ICONS.start);
    
    try {
      if (options.condition && !options.condition()) {
        this.log(`${name}をスキップしました`, 'yellow', ICONS.warning);
        return true;
      }

      const result = execSync(command, { 
        encoding: 'utf8',
        stdio: options.silent ? 'pipe' : 'inherit',
        cwd: process.cwd()
      });
      
      const stepTime = performance.now() - stepStart;
      this.metrics.steps.push({
        name,
        time: stepTime,
        success: true
      });
      
      this.log(`${name}が完了しました (${Math.round(stepTime)}ms)`, 'green', ICONS.success);
      return true;
      
    } catch (error) {
      const stepTime = performance.now() - stepStart;
      const errorInfo = this.errorHandler.analyzeError(error, `pre-commit-${name}`);
      
      this.metrics.steps.push({
        name,
        time: stepTime,
        success: false,
        error: errorInfo.message,
        solution: errorInfo.solution,
        commands: errorInfo.commands
      });
      
      this.log(`${name}が失敗しました (${Math.round(stepTime)}ms)`, 'red', ICONS.error);
      this.log(`エラー: ${errorInfo.message}`, 'red');
      
      // 解決方法を表示
      if (errorInfo.solution) {
        this.log('解決方法:', 'yellow', ICONS.info);
        this.log(`  ${errorInfo.solution}`, 'yellow');
      }
      
      // 実行コマンドを表示
      if (errorInfo.commands && errorInfo.commands.length > 0) {
        this.log('実行コマンド:', 'blue', ICONS.info);
        errorInfo.commands.forEach(cmd => {
          this.log(`  $ ${cmd}`, 'green');
        });
      }
      
      // 従来のヘルプメッセージも表示
      if (options.errorHelp) {
        this.log('追加の解決方法:', 'yellow', ICONS.info);
        options.errorHelp.forEach(help => {
          this.log(`  • ${help}`, 'yellow');
        });
      }
      
      this.metrics.success = false;
      return false;
    }
  }

  async checkStagedFiles() {
    try {
      const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf8' });
      return stagedFiles.trim().split('\n').filter(file => file.length > 0);
    } catch {
      return [];
    }
  }

  async saveMetrics() {
    this.metrics.totalTime = performance.now() - this.metrics.startTime;
    
    const metricsDir = '.git/hooks-metrics';
    if (!fs.existsSync(metricsDir)) {
      fs.mkdirSync(metricsDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString();
    const metricsFile = path.join(metricsDir, `pre-commit-${Date.now()}.json`);
    
    const metricsData = {
      timestamp,
      ...this.metrics,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        skipChecks: this.skipChecks,
        skipTests: this.skipTests
      }
    };
    
    fs.writeFileSync(metricsFile, JSON.stringify(metricsData, null, 2));
    
    // 古いメトリクスファイルを削除（最新10件のみ保持）
    const files = fs.readdirSync(metricsDir)
      .filter(f => f.startsWith('pre-commit-'))
      .sort()
      .reverse();
    
    files.slice(10).forEach(file => {
      fs.unlinkSync(path.join(metricsDir, file));
    });
  }

  async run() {
    this.log('Pre-commit チェックを開始します', 'bright', ICONS.start);
    
    if (this.skipChecks) {
      this.log('SKIP_PRE_COMMIT=true のため、すべてのチェックをスキップします', 'yellow', ICONS.warning);
      return true;
    }

    const stagedFiles = await this.checkStagedFiles();
    if (stagedFiles.length === 0) {
      this.log('ステージされたファイルがありません', 'yellow', ICONS.warning);
      return true;
    }

    this.log(`${stagedFiles.length}個のファイルをチェックします`, 'blue', ICONS.info);

    // Step 1: 軽量なフォーマットチェック（最も高速）
    const formatSuccess = await this.runStep(
      'フォーマットチェック',
      'npx lint-staged',
      {
        errorHelp: [
          'npm run format を実行してフォーマットを修正してください',
          'または git add . でフォーマット済みファイルをステージしてください'
        ]
      }
    );

    if (!formatSuccess) {
      await this.saveMetrics();
      return false;
    }

    // Step 2: TypeScript型チェック（中程度の重さ）
    const typecheckSuccess = await this.runStep(
      'TypeScript型チェック',
      'npm run typecheck',
      {
        errorHelp: [
          '型エラーを修正してください',
          'apps/web/src/ 内のTypeScriptファイルを確認してください',
          'npm run typecheck で詳細なエラーを確認できます'
        ]
      }
    );

    if (!typecheckSuccess) {
      await this.saveMetrics();
      return false;
    }

    // Step 3: Lintチェック（中程度の重さ）
    const lintSuccess = await this.runStep(
      'Lintチェック',
      'npm run lint',
      {
        errorHelp: [
          'npm run lint を実行してLintエラーを確認してください',
          '自動修正可能なエラーは npm run lint -- --fix で修正できます'
        ]
      }
    );

    if (!lintSuccess) {
      await this.saveMetrics();
      return false;
    }

    // Step 4: 環境変数チェック（軽量）
    const envSuccess = await this.runStep(
      '環境変数チェック',
      'npm run env:check',
      {
        errorHelp: [
          '.env.local.example と .env.local の内容を確認してください',
          'Vercelの環境変数設定を確認してください',
          'scripts/check-env-sync.mjs を直接実行して詳細を確認してください'
        ]
      }
    );

    if (!envSuccess) {
      await this.saveMetrics();
      return false;
    }

    // Step 5: テスト実行（最も重い - 条件付き）
    const shouldRunTests = !this.skipTests && stagedFiles.some(file => 
      file.includes('src/') || file.includes('test') || file.includes('spec')
    );

    if (shouldRunTests) {
      const testSuccess = await this.runStep(
        'テスト実行',
        'npm run test',
        {
          condition: () => !this.skipTests,
          errorHelp: [
            'テストが失敗しています。npm run test:watch で詳細を確認してください',
            '緊急時は SKIP_TESTS=true git commit でテストをスキップできます',
            'ただし、テストの修正を忘れずに行ってください'
          ]
        }
      );

      if (!testSuccess) {
        await this.saveMetrics();
        return false;
      }
    } else {
      this.log('テストをスキップしました（対象ファイルなし、またはSKIP_TESTS=true）', 'yellow', ICONS.warning);
    }

    await this.saveMetrics();
    
    this.log(`すべてのチェックが完了しました！ (総時間: ${Math.round(this.metrics.totalTime)}ms)`, 'green', ICONS.success);
    
    // パフォーマンス情報を表示
    this.log('実行時間の詳細:', 'blue', ICONS.time);
    this.metrics.steps.forEach(step => {
      const status = step.success ? ICONS.success : ICONS.error;
      this.log(`  ${status} ${step.name}: ${Math.round(step.time)}ms`, step.success ? 'green' : 'red');
    });

    return true;
  }
}

// メイン実行
const checker = new PreCommitChecker();
const success = await checker.run();

if (!success) {
  console.log('\n' + COLORS.red + ICONS.error + ' Pre-commit チェックが失敗しました' + COLORS.reset);
  console.log(COLORS.yellow + ICONS.info + ' 緊急時は SKIP_PRE_COMMIT=true git commit でスキップできます' + COLORS.reset);
  process.exit(1);
}

process.exit(0);