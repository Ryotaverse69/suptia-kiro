#!/usr/bin/env node

/**
 * エラーハンドリングとメッセージ表示のユーティリティ
 */

import chalk from 'chalk';
import { existsSync, readFileSync } from 'fs';

export class ErrorHandler {
  constructor() {
    this.errorPatterns = this.loadErrorPatterns();
  }

  /**
   * エラーパターンを読み込み
   */
  loadErrorPatterns() {
    return {
      git: {
        'GH006': {
          message: 'masterブランチは保護されており、直接pushできません',
          solution: 'devブランチに切り替えてからpushしてください',
          commands: ['git switch dev', 'git push origin dev']
        },
        'CONFLICT': {
          message: 'マージコンフリクトが発生しました',
          solution: 'コンフリクトを手動で解決してください',
          commands: ['git status', 'code .', 'git add .', 'git commit -m "resolve: merge conflict"']
        },
        'EADDRINUSE': {
          message: 'ポートが既に使用されています',
          solution: '使用中のプロセスを終了するか、別のポートを使用してください',
          commands: ['lsof -ti:3000 | xargs kill -9', 'npm run dev -- --port 3001']
        }
      },
      npm: {
        'ENOENT': {
          message: 'ファイルまたはコマンドが見つかりません',
          solution: '依存関係を再インストールしてください',
          commands: ['rm -rf node_modules package-lock.json', 'npm install']
        },
        'peer dep missing': {
          message: 'ピア依存関係が不足しています',
          solution: '不足している依存関係をインストールしてください',
          commands: ['npm install --save-peer']
        }
      },
      build: {
        'Module not found': {
          message: 'モジュールが見つかりません',
          solution: 'importパスを確認するか、依存関係をインストールしてください',
          commands: ['npm install', 'npm run typecheck']
        },
        'Out of memory': {
          message: 'メモリ不足でビルドが失敗しました',
          solution: 'Node.jsのメモリ制限を増やしてください',
          commands: ['export NODE_OPTIONS="--max-old-space-size=4096"', 'npm run build']
        }
      },
      test: {
        'Cannot find module': {
          message: 'テストモジュールが見つかりません',
          solution: 'テストファイルのimportパスを確認してください',
          commands: ['npm run test -- --verbose']
        },
        'Timeout': {
          message: 'テストがタイムアウトしました',
          solution: 'テストのタイムアウト時間を延長するか、テストを最適化してください',
          commands: ['npm run test -- --testTimeout=10000']
        }
      }
    };
  }

  /**
   * エラーを解析して適切なメッセージを返す
   */
  analyzeError(error, context = 'general') {
    const errorText = typeof error === 'string' ? error : error.message || error.toString();
    
    // エラーパターンをマッチング
    for (const [category, patterns] of Object.entries(this.errorPatterns)) {
      for (const [pattern, info] of Object.entries(patterns)) {
        if (errorText.includes(pattern)) {
          return {
            category,
            pattern,
            message: info.message,
            solution: info.solution,
            commands: info.commands,
            severity: this.getSeverity(pattern),
            context
          };
        }
      }
    }

    // パターンにマッチしない場合のデフォルト処理
    return {
      category: 'unknown',
      pattern: 'unknown',
      message: '予期しないエラーが発生しました',
      solution: 'エラーメッセージを確認し、適切な対処を行ってください',
      commands: ['npm run diagnose:git', 'npm run diagnose:ci'],
      severity: 'error',
      context,
      rawError: errorText
    };
  }

  /**
   * エラーの重要度を判定
   */
  getSeverity(pattern) {
    const criticalPatterns = ['GH006', 'Out of memory', 'CONFLICT'];
    const warningPatterns = ['peer dep missing', 'EADDRINUSE'];
    
    if (criticalPatterns.some(p => pattern.includes(p))) {
      return 'critical';
    } else if (warningPatterns.some(p => pattern.includes(p))) {
      return 'warning';
    }
    return 'error';
  }

  /**
   * エラーメッセージを整形して表示
   */
  displayError(errorInfo) {
    const { severity, message, solution, commands, context } = errorInfo;
    
    // 重要度に応じた色分け
    const severityColors = {
      critical: chalk.red.bold,
      error: chalk.red,
      warning: chalk.yellow,
      info: chalk.blue
    };
    
    const severityIcons = {
      critical: '🚨',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };

    const color = severityColors[severity] || chalk.red;
    const icon = severityIcons[severity] || '❌';

    console.log(color(`\n${icon} ${message}`));
    console.log(chalk.gray(`コンテキスト: ${context}`));
    console.log(chalk.blue(`\n💡 解決方法: ${solution}`));
    
    if (commands && commands.length > 0) {
      console.log(chalk.bold('\n🔧 実行コマンド:'));
      commands.forEach(cmd => {
        console.log(chalk.green(`  $ ${cmd}`));
      });
    }

    // 関連ドキュメントの提案
    this.suggestDocumentation(errorInfo);
  }

  /**
   * 関連ドキュメントを提案
   */
  suggestDocumentation(errorInfo) {
    const { category, context } = errorInfo;
    
    console.log(chalk.bold('\n📚 関連ドキュメント:'));
    
    // カテゴリ別のドキュメント提案
    const docSuggestions = {
      git: [
        'docs/TROUBLESHOOTING.md - Git関連の問題',
        'docs/DEVELOPMENT_WORKFLOW.md - 開発フロー'
      ],
      npm: [
        'docs/TROUBLESHOOTING.md - 依存関係の問題',
        'docs/ONBOARDING.md - 環境セットアップ'
      ],
      build: [
        'docs/TROUBLESHOOTING.md - ビルドエラー',
        'docs/QUICK_REFERENCE.md - よくあるコマンド'
      ],
      test: [
        'docs/TROUBLESHOOTING.md - テストエラー',
        'apps/web/src/test/setup.ts - テスト設定'
      ]
    };

    const suggestions = docSuggestions[category] || [
      'docs/TROUBLESHOOTING.md - 一般的な問題',
      'docs/DEVELOPMENT_WORKFLOW.md - 開発フロー'
    ];

    suggestions.forEach(suggestion => {
      console.log(chalk.gray(`  • ${suggestion}`));
    });
  }

  /**
   * エラーログを記録
   */
  logError(errorInfo, additionalContext = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      ...errorInfo,
      ...additionalContext,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        cwd: process.cwd()
      }
    };

    // 開発環境では詳細ログを表示
    if (process.env.NODE_ENV === 'development') {
      console.log(chalk.gray('\n🔍 詳細ログ:'));
      console.log(chalk.gray(JSON.stringify(logEntry, null, 2)));
    }

    return logEntry;
  }

  /**
   * 複数のエラーをまとめて処理
   */
  handleMultipleErrors(errors, context = 'batch') {
    console.log(chalk.bold(`\n📋 ${errors.length}個のエラーが検出されました\n`));

    const errorsByCategory = {};
    const errorsBySeverity = {};

    errors.forEach((error, index) => {
      const errorInfo = this.analyzeError(error, `${context}-${index + 1}`);
      
      // カテゴリ別に分類
      if (!errorsByCategory[errorInfo.category]) {
        errorsByCategory[errorInfo.category] = [];
      }
      errorsByCategory[errorInfo.category].push(errorInfo);

      // 重要度別に分類
      if (!errorsBySeverity[errorInfo.severity]) {
        errorsBySeverity[errorInfo.severity] = [];
      }
      errorsBySeverity[errorInfo.severity].push(errorInfo);
    });

    // 重要度順に表示（critical > error > warning > info）
    const severityOrder = ['critical', 'error', 'warning', 'info'];
    
    severityOrder.forEach(severity => {
      if (errorsBySeverity[severity]) {
        console.log(chalk.bold(`\n${severity.toUpperCase()} (${errorsBySeverity[severity].length}件):`));
        errorsBySeverity[severity].forEach((errorInfo, index) => {
          console.log(chalk.gray(`\n${index + 1}. ${errorInfo.message}`));
          console.log(chalk.blue(`   解決方法: ${errorInfo.solution}`));
        });
      }
    });

    // 優先対応項目の提案
    this.suggestPriority(errorsBySeverity);
  }

  /**
   * 優先対応項目を提案
   */
  suggestPriority(errorsBySeverity) {
    console.log(chalk.bold('\n🎯 優先対応項目:'));

    if (errorsBySeverity.critical) {
      console.log(chalk.red('1. 🚨 緊急対応が必要な項目を最初に解決してください'));
      errorsBySeverity.critical.forEach(error => {
        console.log(chalk.red(`   • ${error.message}`));
      });
    }

    if (errorsBySeverity.error) {
      console.log(chalk.yellow('2. ❌ エラー項目を解決してください'));
      console.log(chalk.gray(`   ${errorsBySeverity.error.length}件のエラーがあります`));
    }

    if (errorsBySeverity.warning) {
      console.log(chalk.blue('3. ⚠️  警告項目を確認してください'));
      console.log(chalk.gray(`   ${errorsBySeverity.warning.length}件の警告があります`));
    }

    console.log(chalk.bold('\n🚀 推奨アクション:'));
    console.log(chalk.green('• 緊急項目から順番に対応'));
    console.log(chalk.green('• 各修正後に関連テストを実行'));
    console.log(chalk.green('• 全て解決後にCI/CDチェックを実行'));
  }

  /**
   * 成功メッセージを表示
   */
  displaySuccess(message, nextSteps = []) {
    console.log(chalk.green(`\n🎉 ${message}`));
    
    if (nextSteps.length > 0) {
      console.log(chalk.bold('\n🚀 次のステップ:'));
      nextSteps.forEach((step, index) => {
        console.log(chalk.blue(`${index + 1}. ${step}`));
      });
    }
  }

  /**
   * 進行状況を表示
   */
  displayProgress(current, total, message) {
    const percentage = Math.round((current / total) * 100);
    const progressBar = '█'.repeat(Math.round(percentage / 5)) + '░'.repeat(20 - Math.round(percentage / 5));
    
    console.log(chalk.blue(`\n[${progressBar}] ${percentage}% - ${message}`));
  }
}

export default ErrorHandler;