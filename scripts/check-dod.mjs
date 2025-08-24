#!/usr/bin/env node

/**
 * Definition of Done (DoD) Checker
 * 
 * このスクリプトは、プルリクエストが完了の定義（Definition of Done）を満たしているかを確認します。
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import ErrorHandler from './utils/error-handler.mjs';

const DOD_CRITERIA = [
  {
    name: "Code Quality",
    checks: [
      {
        name: "Format Check",
        command: "cd apps/web && pnpm run format:check",
        description: "コードが適切にフォーマットされている"
      },
      {
        name: "Lint Check", 
        command: "cd apps/web && pnpm run lint",
        description: "ESLintルールに準拠している"
      },
      {
        name: "Type Check",
        command: "cd apps/web && pnpm run typecheck", 
        description: "TypeScriptの型エラーがない"
      }
    ]
  },
  {
    name: "Testing",
    checks: [
      {
        name: "Unit Tests",
        command: "cd apps/web && pnpm run test",
        description: "すべてのテストが通過している"
      }
    ]
  },
  {
    name: "Build & Deploy",
    checks: [
      {
        name: "Build Check",
        command: "cd apps/web && pnpm run build",
        description: "アプリケーションが正常にビルドできる"
      }
    ]
  },
  {
    name: "Documentation",
    checks: [
      {
        name: "README Update",
        function: checkReadmeUpdate,
        description: "必要に応じてREADMEが更新されている"
      },
      {
        name: "Changelog Update", 
        function: checkChangelogUpdate,
        description: "重要な変更がCHANGELOGに記録されている"
      }
    ]
  },
  {
    name: "Git Standards",
    checks: [
      {
        name: "Commit Message Format",
        function: checkCommitMessages,
        description: "コミットメッセージが規約に従っている"
      },
      {
        name: "Branch Naming",
        function: checkBranchNaming,
        description: "ブランチ名が規約に従っている"
      }
    ]
  }
];

async function runDoDCheck() {
  const errorHandler = new ErrorHandler();
  
  console.log(chalk.blue('🔍 Definition of Done (DoD) チェックを開始します...\n'));
  
  let totalChecks = 0;
  let passedChecks = 0;
  let failedChecks = 0;
  let skippedChecks = 0;
  const failedItems = [];
  
  for (const category of DOD_CRITERIA) {
    console.log(chalk.bold(`📋 ${category.name}`));
    console.log(chalk.gray('─'.repeat(50)));
    
    for (const check of category.checks) {
      totalChecks++;
      
      try {
        let result;
        
        if (check.command) {
          // コマンド実行チェック
          result = await runCommandCheck(check, errorHandler);
        } else if (check.function) {
          // カスタム関数チェック
          result = await check.function();
        }
        
        if (result.success) {
          console.log(chalk.green(`  ✅ ${check.name}: ${check.description}`));
          passedChecks++;
        } else if (result.skipped) {
          console.log(chalk.yellow(`  ⏭️  ${check.name}: ${result.reason || 'スキップ'}`));
          skippedChecks++;
        } else {
          console.log(chalk.red(`  ❌ ${check.name}: ${result.error || '失敗'}`));
          if (result.details) {
            console.log(chalk.gray(`     詳細: ${result.details}`));
          }
          if (result.solution) {
            console.log(chalk.blue(`     解決方法: ${result.solution}`));
          }
          if (result.commands && result.commands.length > 0) {
            console.log(chalk.blue('     実行コマンド:'));
            result.commands.forEach(cmd => {
              console.log(chalk.green(`       $ ${cmd}`));
            });
          }
          failedChecks++;
          failedItems.push({
            category: category.name,
            check: check.name,
            error: result.error,
            solution: result.solution,
            commands: result.commands
          });
        }
        
      } catch (error) {
        const errorInfo = errorHandler.analyzeError(error, `dod-${check.name}`);
        console.log(chalk.red(`  ❌ ${check.name}: ${errorInfo.message}`));
        console.log(chalk.blue(`     解決方法: ${errorInfo.solution}`));
        failedChecks++;
        failedItems.push({
          category: category.name,
          check: check.name,
          error: errorInfo.message,
          solution: errorInfo.solution,
          commands: errorInfo.commands
        });
      }
    }
    
    console.log('');
  }
  
  // 結果サマリー
  console.log(chalk.bold('📊 DoD チェック結果'));
  console.log(chalk.gray('═'.repeat(50)));
  console.log(`合計チェック数: ${totalChecks}`);
  console.log(chalk.green(`✅ 成功: ${passedChecks}`));
  console.log(chalk.red(`❌ 失敗: ${failedChecks}`));
  console.log(chalk.yellow(`⏭️  スキップ: ${skippedChecks}`));
  
  const successRate = ((passedChecks + skippedChecks) / totalChecks * 100).toFixed(1);
  console.log(`📈 成功率: ${successRate}%`);
  
  if (failedChecks > 0) {
    console.log(chalk.red('\n❌ Definition of Done チェックが失敗しました！'));
    console.log(chalk.red('PRをマージする前に、以下の問題を修正してください。\n'));
    
    // 失敗項目の詳細表示
    console.log(chalk.bold('🔧 修正が必要な項目:'));
    failedItems.forEach((item, index) => {
      console.log(chalk.red(`\n${index + 1}. ${item.category} - ${item.check}`));
      console.log(chalk.gray(`   問題: ${item.error}`));
      if (item.solution) {
        console.log(chalk.blue(`   解決方法: ${item.solution}`));
      }
      if (item.commands && item.commands.length > 0) {
        console.log(chalk.blue('   実行コマンド:'));
        item.commands.forEach(cmd => {
          console.log(chalk.green(`     $ ${cmd}`));
        });
      }
    });
    
    console.log(chalk.bold('\n🚀 推奨アクション:'));
    console.log(chalk.blue('1. 上記のコマンドを実行して問題を修正'));
    console.log(chalk.blue('2. 修正後、再度DoDチェックを実行: npm run dod:check'));
    console.log(chalk.blue('3. 全て成功したらコミット・プッシュ'));
    
    console.log(chalk.gray('\n📚 参考資料:'));
    console.log(chalk.gray('• docs/TROUBLESHOOTING.md - 詳細なトラブルシューティング'));
    console.log(chalk.gray('• docs/DEVELOPMENT_WORKFLOW.md - 開発フロー'));
    
    process.exit(1);
  } else {
    errorHandler.displaySuccess(
      'すべてのDefinition of Done基準を満たしています！',
      [
        'このPRはレビューとマージの準備ができています',
        'GitHub UIでdev → masterのPRを作成してください',
        'CI/CDパイプラインが自動的に実行されます'
      ]
    );
  }
}

async function runCommandCheck(check, errorHandler) {
  try {
    execSync(check.command, { 
      stdio: 'pipe',
      encoding: 'utf8',
      timeout: 60000 // 1分タイムアウト
    });
    return { success: true };
  } catch (error) {
    const errorInfo = errorHandler.analyzeError(error, `command-${check.name}`);
    
    // チェック固有の解決方法を提供
    let solution = errorInfo.solution;
    let commands = errorInfo.commands;
    
    switch (check.name) {
      case 'Format Check':
        solution = 'コードを自動フォーマットしてください';
        commands = ['npm run format'];
        break;
      case 'Lint Check':
        solution = 'ESLintエラーを修正してください';
        commands = ['npm run lint:fix'];
        break;
      case 'Type Check':
        solution = 'TypeScript型エラーを修正してください';
        commands = ['npm run typecheck'];
        break;
      case 'Unit Tests':
        solution = 'テストエラーを修正してください';
        commands = ['npm run test -- --reporter=verbose'];
        break;
      case 'Build Check':
        solution = 'ビルドエラーを修正してください';
        commands = ['npm run build'];
        break;
    }
    
    return { 
      success: false, 
      error: errorInfo.message,
      details: error.message,
      solution,
      commands
    };
  }
}

async function checkReadmeUpdate() {
  try {
    // git diffでREADMEの変更を確認
    const diffOutput = execSync('git diff origin/master...HEAD --name-only', { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    const changedFiles = diffOutput.split('\n').filter(Boolean);
    const hasSignificantChanges = changedFiles.some(file => 
      file.includes('src/') || 
      file.includes('components/') ||
      file.includes('pages/') ||
      file.includes('app/')
    );
    
    const hasReadmeUpdate = changedFiles.some(file => 
      file.toLowerCase().includes('readme')
    );
    
    if (hasSignificantChanges && !hasReadmeUpdate) {
      return {
        success: false,
        error: 'Significant code changes detected but README not updated'
      };
    }
    
    return { success: true };
    
  } catch (error) {
    return { 
      skipped: true, 
      reason: 'Could not check README update (not in git repository or no changes)'
    };
  }
}

async function checkChangelogUpdate() {
  try {
    const changelogPath = 'CHANGELOG.md';
    
    if (!existsSync(changelogPath)) {
      return { 
        skipped: true, 
        reason: 'CHANGELOG.md not found'
      };
    }
    
    // git diffでCHANGELOGの変更を確認
    const diffOutput = execSync('git diff origin/master...HEAD --name-only', { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    const changedFiles = diffOutput.split('\n').filter(Boolean);
    const hasFeatureChanges = changedFiles.some(file => 
      file.includes('src/') || 
      file.includes('components/') ||
      file.includes('pages/') ||
      file.includes('app/')
    );
    
    const hasChangelogUpdate = changedFiles.includes(changelogPath);
    
    if (hasFeatureChanges && !hasChangelogUpdate) {
      return {
        success: false,
        error: 'Feature changes detected but CHANGELOG.md not updated'
      };
    }
    
    return { success: true };
    
  } catch (error) {
    return { 
      skipped: true, 
      reason: 'Could not check CHANGELOG update'
    };
  }
}

async function checkCommitMessages() {
  try {
    // 最新のコミットメッセージを取得
    const commitMessages = execSync('git log origin/master..HEAD --pretty=format:"%s"', { 
      encoding: 'utf8',
      stdio: 'pipe'
    }).split('\n').filter(Boolean);
    
    if (commitMessages.length === 0) {
      return { 
        skipped: true, 
        reason: 'No new commits found'
      };
    }
    
    const conventionalCommitPattern = /^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert)(\(.+\))?: .{1,50}/;
    
    const invalidCommits = commitMessages.filter(msg => 
      !conventionalCommitPattern.test(msg)
    );
    
    if (invalidCommits.length > 0) {
      return {
        success: false,
        error: 'Some commit messages do not follow conventional commit format',
        details: `Invalid commits: ${invalidCommits.slice(0, 3).join(', ')}${invalidCommits.length > 3 ? '...' : ''}`
      };
    }
    
    return { success: true };
    
  } catch (error) {
    return { 
      skipped: true, 
      reason: 'Could not check commit messages'
    };
  }
}

async function checkBranchNaming() {
  try {
    const currentBranch = execSync('git branch --show-current', { 
      encoding: 'utf8',
      stdio: 'pipe'
    }).trim();
    
    // dev ブランチは常に有効
    if (currentBranch === 'dev') {
      return { success: true };
    }
    
    // ブランチ命名規約: feature/*, fix/*, hotfix/*, docs/*, refactor/*, test/*
    const validBranchPattern = /^(feature|fix|hotfix|docs|refactor|test|chore)\/[a-z0-9-]+$/;
    
    if (!validBranchPattern.test(currentBranch)) {
      return {
        success: false,
        error: `Branch name "${currentBranch}" does not follow naming convention`,
        details: 'Expected format: type/description (e.g., feature/user-auth, fix/login-bug)'
      };
    }
    
    return { success: true };
    
  } catch (error) {
    return { 
      skipped: true, 
      reason: 'Could not check branch name'
    };
  }
}

// スクリプトが直接実行された場合のみ実行
if (import.meta.url === `file://${process.argv[1]}`) {
  runDoDCheck().catch(error => {
    console.error('❌ DoD check failed with error:', error.message);
    process.exit(1);
  });
}

export { runDoDCheck };