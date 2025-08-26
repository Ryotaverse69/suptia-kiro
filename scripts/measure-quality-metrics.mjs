#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

/**
 * 品質メトリクスを測定・レポートするスクリプト
 */

const METRICS_FILE = 'quality-metrics.json';

function runCommand(command, options = {}) {
  try {
    const result = execSync(command, { 
      encoding: 'utf8', 
      stdio: 'pipe',
      ...options 
    });
    return { success: true, output: result };
  } catch (error) {
    return { success: false, error: error.message, output: error.stdout || '' };
  }
}

function measureBuildSuccess() {
  console.log(chalk.blue('📦 ビルド成功率を測定中...'));
  
  const result = runCommand('pnpm run build', { cwd: 'apps/web' });
  return {
    buildSuccess: result.success,
    buildTime: result.success ? 'success' : 'failed',
    timestamp: new Date().toISOString()
  };
}

function measureTestCoverage() {
  console.log(chalk.blue('🧪 テストカバレッジを測定中...'));
  
  const result = runCommand('pnpm run test:coverage', { cwd: 'apps/web' });
  
  let coverage = {
    lines: 0,
    functions: 0,
    branches: 0,
    statements: 0
  };
  
  if (result.success) {
    try {
      const coveragePath = path.join('apps/web/coverage/coverage-final.json');
      if (fs.existsSync(coveragePath)) {
        const coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
        
        let totalLines = 0, coveredLines = 0;
        let totalFunctions = 0, coveredFunctions = 0;
        let totalBranches = 0, coveredBranches = 0;
        let totalStatements = 0, coveredStatements = 0;
        
        Object.values(coverageData).forEach(file => {
          // Statements (most accurate metric)
          const statements = file.s || {};
          totalStatements += Object.keys(statements).length;
          coveredStatements += Object.values(statements).filter(count => count > 0).length;
          
          // Functions
          const functions = file.f || {};
          totalFunctions += Object.keys(functions).length;
          coveredFunctions += Object.values(functions).filter(count => count > 0).length;
          
          // Branches
          const branches = file.b || {};
          totalBranches += Object.keys(branches).length;
          coveredBranches += Object.values(branches).filter(branch => 
            Array.isArray(branch) ? branch.some(count => count > 0) : branch > 0
          ).length;
          
          // Lines (use statement map for more accurate line counting)
          const statementMap = file.statementMap || {};
          const lineSet = new Set();
          Object.values(statementMap).forEach(stmt => {
            if (stmt.start && stmt.start.line) {
              lineSet.add(stmt.start.line);
            }
          });
          totalLines += lineSet.size;
          
          // Count covered lines based on covered statements
          const coveredLineSet = new Set();
          Object.entries(statements).forEach(([stmtId, count]) => {
            if (count > 0 && statementMap[stmtId] && statementMap[stmtId].start) {
              coveredLineSet.add(statementMap[stmtId].start.line);
            }
          });
          coveredLines += coveredLineSet.size;
        });
        
        coverage = {
          lines: totalLines > 0 ? Math.round((coveredLines / totalLines) * 100) : 0,
          functions: totalFunctions > 0 ? Math.round((coveredFunctions / totalFunctions) * 100) : 0,
          branches: totalBranches > 0 ? Math.round((coveredBranches / totalBranches) * 100) : 0,
          statements: totalStatements > 0 ? Math.round((coveredStatements / totalStatements) * 100) : 0
        };
      }
    } catch (error) {
      console.warn(chalk.yellow('⚠️  カバレッジデータの解析に失敗:', error.message));
    }
  }
  
  return {
    testSuccess: result.success,
    coverage,
    timestamp: new Date().toISOString()
  };
}

function measureCodeQuality() {
  console.log(chalk.blue('🔍 コード品質を測定中...'));
  
  const lintResult = runCommand('pnpm run lint:check', { cwd: 'apps/web' });
  const formatResult = runCommand('pnpm run format:check', { cwd: 'apps/web' });
  const typeResult = runCommand('pnpm run type-check');
  
  let qualityScore = 0;
  const checks = [];
  
  if (lintResult.success) {
    qualityScore += 1;
    checks.push({ name: 'lint', status: 'pass' });
  } else {
    checks.push({ name: 'lint', status: 'fail', error: lintResult.error });
  }
  
  if (formatResult.success) {
    qualityScore += 1;
    checks.push({ name: 'format', status: 'pass' });
  } else {
    checks.push({ name: 'format', status: 'fail', error: formatResult.error });
  }
  
  if (typeResult.success) {
    qualityScore += 1;
    checks.push({ name: 'typecheck', status: 'pass' });
  } else {
    checks.push({ name: 'typecheck', status: 'fail', error: typeResult.error });
  }
  
  return {
    qualityScore: `${qualityScore}/3`,
    qualityPercentage: Math.round((qualityScore / 3) * 100),
    checks,
    timestamp: new Date().toISOString()
  };
}

function generateReport(metrics) {
  console.log(chalk.green('\\n📊 品質メトリクス レポート'));
  console.log(chalk.gray('='.repeat(50)));
  
  // ビルド成功率
  console.log(chalk.blue('\\n📦 ビルド:'));
  console.log(`   状態: ${metrics.build.buildSuccess ? chalk.green('✅ 成功') : chalk.red('❌ 失敗')}`);
  
  // テストカバレッジ
  console.log(chalk.blue('\\n🧪 テストカバレッジ:'));
  console.log(`   テスト実行: ${metrics.test.testSuccess ? chalk.green('✅ 成功') : chalk.red('❌ 失敗')}`);
  console.log(`   Lines: ${metrics.test.coverage.lines}%`);
  console.log(`   Functions: ${metrics.test.coverage.functions}%`);
  console.log(`   Branches: ${metrics.test.coverage.branches}%`);
  console.log(`   Statements: ${metrics.test.coverage.statements}%`);
  
  // コード品質
  console.log(chalk.blue('\\n🔍 コード品質:'));
  console.log(`   スコア: ${metrics.quality.qualityScore} (${metrics.quality.qualityPercentage}%)`);
  metrics.quality.checks.forEach(check => {
    const status = check.status === 'pass' ? chalk.green('✅') : chalk.red('❌');
    console.log(`   ${check.name}: ${status}`);
  });
  
  // 目標との比較
  console.log(chalk.blue('\\n🎯 目標達成状況:'));
  const buildTarget = metrics.build.buildSuccess ? '✅' : '❌';
  const coverageTarget = metrics.test.coverage.lines >= 70 ? '✅' : '❌';
  const qualityTarget = metrics.quality.qualityPercentage >= 90 ? '✅' : '❌';
  
  console.log(`   ビルド成功率 95%+: ${buildTarget}`);
  console.log(`   テストカバレッジ 70%+: ${coverageTarget} (現在: ${metrics.test.coverage.lines}%)`);
  console.log(`   コード品質 90%+: ${qualityTarget} (現在: ${metrics.quality.qualityPercentage}%)`);
  
  console.log(chalk.gray('\\n' + '='.repeat(50)));
}

function saveMetrics(metrics) {
  try {
    let history = [];
    if (fs.existsSync(METRICS_FILE)) {
      history = JSON.parse(fs.readFileSync(METRICS_FILE, 'utf8'));
    }
    
    history.push({
      timestamp: new Date().toISOString(),
      ...metrics
    });
    
    // 最新の50件のみ保持
    if (history.length > 50) {
      history = history.slice(-50);
    }
    
    fs.writeFileSync(METRICS_FILE, JSON.stringify(history, null, 2));
    console.log(chalk.green(`\\n💾 メトリクスを ${METRICS_FILE} に保存しました`));
  } catch (error) {
    console.error(chalk.red('❌ メトリクスの保存に失敗:', error.message));
  }
}

async function main() {
  console.log(chalk.bold.blue('🚀 品質メトリクス測定を開始...\\n'));
  
  const metrics = {
    build: measureBuildSuccess(),
    test: measureTestCoverage(),
    quality: measureCodeQuality()
  };
  
  generateReport(metrics);
  saveMetrics(metrics);
  
  console.log(chalk.green('\\n✅ 品質メトリクス測定完了'));
}

main().catch(error => {
  console.error(chalk.red('❌ エラーが発生しました:', error.message));
  process.exit(1);
});