#!/usr/bin/env tsx

/**
 * Lighthouse Budget Check Script
 * CI環境でLighthouse予算をチェックするスクリプト
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { 
  LighthouseBudgetManager, 
  PerformanceMetrics,
  BudgetCheckResult 
} from '../../apps/web/src/lib/release/lighthouse-budget';

interface LighthouseReport {
  audits: Record<string, any>;
  categories: Record<string, any>;
}

interface ScriptOptions {
  url?: string;
  outputPath?: string;
  warningOnly?: boolean;
  verbose?: boolean;
}

class LighthouseBudgetChecker {
  private budgetManager: LighthouseBudgetManager;
  private options: ScriptOptions;

  constructor(options: ScriptOptions = {}) {
    this.budgetManager = new LighthouseBudgetManager();
    this.options = {
      url: 'http://localhost:3000',
      outputPath: './lighthouse-report.json',
      warningOnly: true, // デフォルトで警告のみ（ビルド失敗させない）
      verbose: false,
      ...options
    };
  }

  /**
   * Lighthouseを実行してレポートを生成
   */
  async runLighthouse(): Promise<LighthouseReport> {
    const { url, outputPath } = this.options;
    
    console.log(`🚀 Running Lighthouse for ${url}...`);
    
    try {
      // Lighthouseを実行
      const command = [
        'npx lighthouse',
        url,
        '--output=json',
        `--output-path=${outputPath}`,
        '--chrome-flags="--headless --no-sandbox --disable-dev-shm-usage"',
        '--quiet'
      ].join(' ');

      if (this.options.verbose) {
        console.log(`Executing: ${command}`);
      }

      execSync(command, { stdio: 'inherit' });
      
      // レポートファイルを読み込み
      if (!existsSync(outputPath!)) {
        throw new Error(`Lighthouse report not found at ${outputPath}`);
      }

      const reportContent = readFileSync(outputPath!, 'utf-8');
      return JSON.parse(reportContent) as LighthouseReport;
      
    } catch (error) {
      console.error('❌ Failed to run Lighthouse:', error);
      throw error;
    }
  }

  /**
   * 予算チェックを実行
   */
  async checkBudget(): Promise<BudgetCheckResult> {
    try {
      // Lighthouseレポートを生成
      const report = await this.runLighthouse();
      
      // メトリクスを抽出
      const metrics = this.budgetManager.extractMetricsFromLighthouseReport(report);
      
      if (this.options.verbose) {
        console.log('📊 Extracted metrics:', metrics);
      }
      
      // 予算チェックを実行
      const result = this.budgetManager.checkBudget(metrics);
      
      // 結果を出力
      console.log('\n' + this.budgetManager.formatBudgetReport(result));
      
      return result;
      
    } catch (error) {
      console.error('❌ Budget check failed:', error);
      throw error;
    }
  }

  /**
   * CI環境での実行
   */
  async runInCI(): Promise<void> {
    try {
      const result = await this.checkBudget();
      
      if (this.options.warningOnly) {
        // 警告のみモード：エラーがあっても終了コード0
        console.log('\n💡 Running in warning-only mode. Build will continue regardless of budget violations.');
        process.exit(0);
      } else {
        // 厳格モード：エラーがあれば終了コード1
        if (!result.passed) {
          console.log('\n❌ Budget check failed. Exiting with error code 1.');
          process.exit(1);
        } else {
          console.log('\n✅ All budget checks passed!');
          process.exit(0);
        }
      }
      
    } catch (error) {
      console.error('❌ Script execution failed:', error);
      process.exit(1);
    }
  }
}

/**
 * コマンドライン引数を解析
 */
function parseArgs(): ScriptOptions {
  const args = process.argv.slice(2);
  const options: ScriptOptions = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--url':
        options.url = args[++i];
        break;
      case '--output':
        options.outputPath = args[++i];
        break;
      case '--strict':
        options.warningOnly = false;
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--help':
        printHelp();
        process.exit(0);
        break;
    }
  }
  
  return options;
}

/**
 * ヘルプメッセージを表示
 */
function printHelp(): void {
  console.log(`
🚀 Lighthouse Budget Checker

Usage: tsx scripts/release/check-lighthouse-budget.ts [options]

Options:
  --url <url>        Target URL to test (default: http://localhost:3000)
  --output <path>    Output path for Lighthouse report (default: ./lighthouse-report.json)
  --strict           Enable strict mode (fail build on budget violations)
  --verbose          Enable verbose logging
  --help             Show this help message

Examples:
  # Basic usage (warning-only mode)
  tsx scripts/release/check-lighthouse-budget.ts

  # Test specific URL
  tsx scripts/release/check-lighthouse-budget.ts --url http://localhost:3000/products/test

  # Strict mode (fail on violations)
  tsx scripts/release/check-lighthouse-budget.ts --strict

  # Verbose output
  tsx scripts/release/check-lighthouse-budget.ts --verbose
`);
}

/**
 * メイン実行部分
 */
async function main(): Promise<void> {
  console.log('🚀 Lighthouse Budget Checker Starting...\n');
  
  const options = parseArgs();
  const checker = new LighthouseBudgetChecker(options);
  
  await checker.runInCI();
}

// スクリプトが直接実行された場合のみmainを実行
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
}

export { LighthouseBudgetChecker };