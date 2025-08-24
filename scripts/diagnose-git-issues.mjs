#!/usr/bin/env node

/**
 * Git運用フローの問題を診断し、解決方法を提案するスクリプト
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import chalk from 'chalk';

class GitDiagnostics {
  constructor() {
    this.issues = [];
    this.suggestions = [];
  }

  /**
   * 診断を実行
   */
  async diagnose() {
    console.log(chalk.blue('🔍 Git運用フローの診断を開始します...\n'));

    await this.checkCurrentBranch();
    await this.checkBranchStatus();
    await this.checkRemoteSync();
    await this.checkWorkingDirectory();
    await this.checkBranchProtection();
    await this.checkRecentErrors();

    this.displayResults();
  }

  /**
   * 現在のブランチをチェック
   */
  async checkCurrentBranch() {
    try {
      const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
      
      if (currentBranch === 'master') {
        this.issues.push({
          type: 'warning',
          message: 'masterブランチで作業しています',
          suggestion: 'devブランチに切り替えることを推奨します: git switch dev'
        });
      } else if (currentBranch === 'dev') {
        console.log(chalk.green('✅ 適切なブランチ（dev）で作業中'));
      } else if (currentBranch) {
        this.issues.push({
          type: 'info',
          message: `フィーチャーブランチ（${currentBranch}）で作業中`,
          suggestion: '作業完了後はdevブランチにマージしてください'
        });
      } else {
        this.issues.push({
          type: 'error',
          message: 'ブランチが特定できません',
          suggestion: 'git status でリポジトリの状態を確認してください'
        });
      }
    } catch (error) {
      this.issues.push({
        type: 'error',
        message: 'Gitリポジトリではない可能性があります',
        suggestion: 'git init でリポジトリを初期化するか、正しいディレクトリに移動してください'
      });
    }
  }

  /**
   * ブランチの状態をチェック
   */
  async checkBranchStatus() {
    try {
      const status = execSync('git status --porcelain', { encoding: 'utf8' });
      
      if (status.trim()) {
        const lines = status.trim().split('\n');
        const staged = lines.filter(line => line.startsWith('A ') || line.startsWith('M ') || line.startsWith('D ')).length;
        const unstaged = lines.filter(line => line.startsWith(' M') || line.startsWith(' D')).length;
        const untracked = lines.filter(line => line.startsWith('??')).length;

        if (unstaged > 0) {
          this.issues.push({
            type: 'warning',
            message: `${unstaged}個のファイルに未ステージの変更があります`,
            suggestion: 'git add . でステージするか、git stash で一時保存してください'
          });
        }

        if (untracked > 0) {
          this.issues.push({
            type: 'info',
            message: `${untracked}個の未追跡ファイルがあります`,
            suggestion: 'git add . で追加するか、.gitignore に追加してください'
          });
        }

        if (staged > 0) {
          console.log(chalk.yellow(`📝 ${staged}個のファイルがコミット待ちです`));
        }
      } else {
        console.log(chalk.green('✅ 作業ディレクトリはクリーンです'));
      }
    } catch (error) {
      this.issues.push({
        type: 'error',
        message: 'Git状態の確認に失敗しました',
        suggestion: 'git status を手動で実行して確認してください'
      });
    }
  }

  /**
   * リモートとの同期状態をチェック
   */
  async checkRemoteSync() {
    try {
      // リモート情報を更新
      execSync('git fetch origin', { stdio: 'pipe' });

      const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
      
      if (currentBranch) {
        try {
          const ahead = execSync(`git rev-list --count origin/${currentBranch}..HEAD`, { encoding: 'utf8' }).trim();
          const behind = execSync(`git rev-list --count HEAD..origin/${currentBranch}`, { encoding: 'utf8' }).trim();

          if (parseInt(ahead) > 0) {
            this.issues.push({
              type: 'info',
              message: `ローカルブランチが${ahead}コミット先行しています`,
              suggestion: `git push origin ${currentBranch} でリモートに反映してください`
            });
          }

          if (parseInt(behind) > 0) {
            this.issues.push({
              type: 'warning',
              message: `ローカルブランチが${behind}コミット遅れています`,
              suggestion: `git pull origin ${currentBranch} で最新を取得してください`
            });
          }

          if (parseInt(ahead) === 0 && parseInt(behind) === 0) {
            console.log(chalk.green('✅ リモートブランチと同期済み'));
          }
        } catch (error) {
          // リモートブランチが存在しない場合
          this.issues.push({
            type: 'warning',
            message: `リモートに${currentBranch}ブランチが存在しません`,
            suggestion: `git push -u origin ${currentBranch} で初回プッシュしてください`
          });
        }
      }
    } catch (error) {
      this.issues.push({
        type: 'warning',
        message: 'リモートとの同期確認に失敗しました',
        suggestion: 'インターネット接続とGitHub認証を確認してください'
      });
    }
  }

  /**
   * 作業ディレクトリの問題をチェック
   */
  async checkWorkingDirectory() {
    // package.json の存在確認
    if (!existsSync('package.json')) {
      this.issues.push({
        type: 'error',
        message: 'package.json が見つかりません',
        suggestion: 'プロジェクトルートディレクトリで実行してください'
      });
      return;
    }

    // node_modules の存在確認
    if (!existsSync('node_modules')) {
      this.issues.push({
        type: 'warning',
        message: 'node_modules が見つかりません',
        suggestion: 'npm install を実行してください'
      });
    }

    // .env.local の存在確認
    if (!existsSync('apps/web/.env.local')) {
      this.issues.push({
        type: 'warning',
        message: '環境変数ファイルが見つかりません',
        suggestion: 'apps/web/.env.local.example をコピーして .env.local を作成してください'
      });
    }

    console.log(chalk.green('✅ プロジェクト構造は正常です'));
  }

  /**
   * ブランチ保護の設定をチェック
   */
  async checkBranchProtection() {
    try {
      const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
      
      if (remoteUrl.includes('github.com')) {
        console.log(chalk.blue('ℹ️  GitHub リポジトリを検出'));
        this.suggestions.push({
          type: 'info',
          message: 'ブランチ保護設定の確認',
          suggestion: 'GitHub Settings > Branches でmasterブランチの保護設定を確認してください'
        });
      }
    } catch (error) {
      // リモートが設定されていない場合は無視
    }
  }

  /**
   * 最近のエラーをチェック
   */
  async checkRecentErrors() {
    try {
      // 最近のコミットでCI失敗がないかチェック
      const recentCommits = execSync('git log --oneline -5', { encoding: 'utf8' });
      
      if (recentCommits.includes('fix:') || recentCommits.includes('hotfix:')) {
        this.issues.push({
          type: 'info',
          message: '最近修正コミットが多く見られます',
          suggestion: 'CI/CDチェックを事前に実行することを推奨します: npm run precommit'
        });
      }
    } catch (error) {
      // エラーは無視
    }
  }

  /**
   * 結果を表示
   */
  displayResults() {
    console.log('\n' + chalk.bold('📊 診断結果') + '\n');

    if (this.issues.length === 0 && this.suggestions.length === 0) {
      console.log(chalk.green('🎉 問題は見つかりませんでした！'));
      return;
    }

    // エラーを表示
    const errors = this.issues.filter(issue => issue.type === 'error');
    if (errors.length > 0) {
      console.log(chalk.red.bold('❌ エラー:'));
      errors.forEach(error => {
        console.log(chalk.red(`  • ${error.message}`));
        console.log(chalk.gray(`    💡 ${error.suggestion}\n`));
      });
    }

    // 警告を表示
    const warnings = this.issues.filter(issue => issue.type === 'warning');
    if (warnings.length > 0) {
      console.log(chalk.yellow.bold('⚠️  警告:'));
      warnings.forEach(warning => {
        console.log(chalk.yellow(`  • ${warning.message}`));
        console.log(chalk.gray(`    💡 ${warning.suggestion}\n`));
      });
    }

    // 情報を表示
    const infos = [...this.issues.filter(issue => issue.type === 'info'), ...this.suggestions];
    if (infos.length > 0) {
      console.log(chalk.blue.bold('ℹ️  情報:'));
      infos.forEach(info => {
        console.log(chalk.blue(`  • ${info.message}`));
        console.log(chalk.gray(`    💡 ${info.suggestion}\n`));
      });
    }

    // 次のステップを提案
    this.suggestNextSteps();
  }

  /**
   * 次のステップを提案
   */
  suggestNextSteps() {
    console.log(chalk.bold('🚀 推奨される次のステップ:') + '\n');

    const hasErrors = this.issues.some(issue => issue.type === 'error');
    const hasWarnings = this.issues.some(issue => issue.type === 'warning');

    if (hasErrors) {
      console.log(chalk.red('1. エラーを修正してください'));
      console.log(chalk.red('2. 修正後、再度診断を実行してください: npm run diagnose:git'));
    } else if (hasWarnings) {
      console.log(chalk.yellow('1. 警告項目を確認し、必要に応じて修正してください'));
      console.log(chalk.yellow('2. 開発を続行する前にCI/CDチェックを実行してください: npm run precommit'));
    } else {
      console.log(chalk.green('1. 開発を続行できます'));
      console.log(chalk.green('2. 変更をコミットする前に: npm run precommit'));
      console.log(chalk.green('3. devブランチにプッシュ: git push origin dev'));
      console.log(chalk.green('4. GitHub UIでPR作成: dev → master'));
    }

    console.log('\n' + chalk.gray('詳細なトラブルシューティング: docs/TROUBLESHOOTING.md'));
  }
}

// スクリプト実行
if (import.meta.url === `file://${process.argv[1]}`) {
  const diagnostics = new GitDiagnostics();
  diagnostics.diagnose().catch(error => {
    console.error(chalk.red('診断中にエラーが発生しました:'), error.message);
    process.exit(1);
  });
}

export default GitDiagnostics;