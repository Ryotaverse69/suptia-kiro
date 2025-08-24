#!/usr/bin/env node

/**
 * セキュリティ監査スクリプト
 * 包括的なセキュリティチェックを実行し、レポートを生成
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// カラー出力用のユーティリティ
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function log(message, color = 'reset') {
  console.log(colorize(message, color));
}

function logSection(title) {
  console.log('\n' + colorize('='.repeat(60), 'cyan'));
  console.log(colorize(`🔍 ${title}`, 'bold'));
  console.log(colorize('='.repeat(60), 'cyan'));
}

// セキュリティ監査結果を格納するオブジェクト
const auditResults = {
  timestamp: new Date().toISOString(),
  summary: {
    total_checks: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  },
  checks: {}
};

function addResult(checkName, status, details = {}) {
  auditResults.checks[checkName] = {
    status,
    details,
    timestamp: new Date().toISOString()
  };
  
  auditResults.summary.total_checks++;
  if (status === 'passed') auditResults.summary.passed++;
  else if (status === 'failed') auditResults.summary.failed++;
  else if (status === 'warning') auditResults.summary.warnings++;
}

// 1. 環境変数とシークレットのチェック
function checkEnvironmentSecurity() {
  logSection('環境変数・シークレットセキュリティチェック');
  
  try {
    // .envファイルがGitで追跡されていないかチェック（.example除く）
    const trackedEnvFiles = execSync('git ls-files | grep -E "(^|/)\\.env(\\.|$)" | grep -v "\\.example$" || true', { 
      encoding: 'utf8', 
      cwd: rootDir 
    }).trim();
    
    if (trackedEnvFiles) {
      log(`❌ 環境ファイルがGitで追跡されています:`, 'red');
      log(trackedEnvFiles, 'red');
      addResult('env_files_tracked', 'failed', { tracked_files: trackedEnvFiles.split('\n') });
    } else {
      log('✅ 環境ファイルは適切に除外されています', 'green');
      addResult('env_files_tracked', 'passed');
    }
    
    // .gitignoreの必須パターンをチェック
    const gitignorePath = join(rootDir, '.gitignore');
    if (existsSync(gitignorePath)) {
      const gitignoreContent = readFileSync(gitignorePath, 'utf8');
      const requiredPatterns = ['.env', '.env.local', '*.log', 'node_modules/'];
      const missingPatterns = requiredPatterns.filter(pattern => 
        !gitignoreContent.includes(pattern)
      );
      
      if (missingPatterns.length > 0) {
        log(`⚠️  .gitignoreに不足しているパターン: ${missingPatterns.join(', ')}`, 'yellow');
        addResult('gitignore_patterns', 'warning', { missing_patterns: missingPatterns });
      } else {
        log('✅ .gitignoreパターンは適切です', 'green');
        addResult('gitignore_patterns', 'passed');
      }
    }
    
  } catch (error) {
    log(`❌ 環境セキュリティチェックでエラー: ${error.message}`, 'red');
    addResult('env_security', 'failed', { error: error.message });
  }
}

// 2. 依存関係の脆弱性チェック
function checkDependencyVulnerabilities() {
  logSection('依存関係脆弱性チェック');
  
  try {
    // npm auditを実行
    const auditResult = execSync('pnpm audit --json || true', { 
      encoding: 'utf8', 
      cwd: rootDir 
    });
    
    if (auditResult.trim()) {
      const audit = JSON.parse(auditResult);
      const vulnerabilities = audit.metadata?.vulnerabilities || {};
      
      const critical = vulnerabilities.critical || 0;
      const high = vulnerabilities.high || 0;
      const moderate = vulnerabilities.moderate || 0;
      const low = vulnerabilities.low || 0;
      
      log(`脆弱性統計:`, 'blue');
      log(`  Critical: ${critical}`, critical > 0 ? 'red' : 'green');
      log(`  High: ${high}`, high > 0 ? 'red' : 'green');
      log(`  Moderate: ${moderate}`, moderate > 0 ? 'yellow' : 'green');
      log(`  Low: ${low}`, low > 0 ? 'yellow' : 'green');
      
      if (critical > 0 || high > 0) {
        log('❌ 重要な脆弱性が検出されました', 'red');
        addResult('dependency_vulnerabilities', 'failed', vulnerabilities);
      } else if (moderate > 0) {
        log('⚠️  中程度の脆弱性が検出されました', 'yellow');
        addResult('dependency_vulnerabilities', 'warning', vulnerabilities);
      } else {
        log('✅ 重要な脆弱性は検出されませんでした', 'green');
        addResult('dependency_vulnerabilities', 'passed', vulnerabilities);
      }
    } else {
      log('✅ 脆弱性は検出されませんでした', 'green');
      addResult('dependency_vulnerabilities', 'passed', { vulnerabilities: {} });
    }
    
  } catch (error) {
    log(`❌ 依存関係チェックでエラー: ${error.message}`, 'red');
    addResult('dependency_vulnerabilities', 'failed', { error: error.message });
  }
}

// 3. ライセンスコンプライアンスチェック
function checkLicenseCompliance() {
  logSection('ライセンスコンプライアンスチェック');
  
  try {
    // 許可されたライセンスのリスト
    const allowedLicenses = [
      'MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 
      'ISC', '0BSD', 'Unlicense', 'CC0-1.0'
    ];
    
    // license-checkerがインストールされているかチェック
    try {
      execSync('npx license-checker --version', { stdio: 'ignore' });
    } catch {
      log('⚠️  license-checkerがインストールされていません。スキップします。', 'yellow');
      addResult('license_compliance', 'warning', { message: 'license-checker not available' });
      return;
    }
    
    const licenseCheck = execSync(
      `npx license-checker --onlyAllow "${allowedLicenses.join(';')}" --json || true`,
      { encoding: 'utf8', cwd: rootDir }
    );
    
    if (licenseCheck.includes('ERROR')) {
      log('❌ 許可されていないライセンスが検出されました', 'red');
      addResult('license_compliance', 'failed', { message: 'Unauthorized licenses detected' });
    } else {
      log('✅ すべての依存関係が許可されたライセンスを使用しています', 'green');
      addResult('license_compliance', 'passed');
    }
    
  } catch (error) {
    log(`❌ ライセンスチェックでエラー: ${error.message}`, 'red');
    addResult('license_compliance', 'failed', { error: error.message });
  }
}

// 4. セキュリティヘッダーの設定チェック
function checkSecurityHeaders() {
  logSection('セキュリティヘッダー設定チェック');
  
  try {
    // Next.js設定ファイルをチェック
    const nextConfigPath = join(rootDir, 'apps/web/next.config.mjs');
    if (existsSync(nextConfigPath)) {
      const configContent = readFileSync(nextConfigPath, 'utf8');
      
      const requiredHeaders = [
        'X-Frame-Options',
        'X-Content-Type-Options',
        'Referrer-Policy',
        'Permissions-Policy'
      ];
      
      const missingHeaders = requiredHeaders.filter(header => 
        !configContent.includes(header)
      );
      
      if (missingHeaders.length > 0) {
        log(`⚠️  不足しているセキュリティヘッダー: ${missingHeaders.join(', ')}`, 'yellow');
        addResult('security_headers', 'warning', { missing_headers: missingHeaders });
      } else {
        log('✅ セキュリティヘッダーが適切に設定されています', 'green');
        addResult('security_headers', 'passed');
      }
    } else {
      log('⚠️  Next.js設定ファイルが見つかりません', 'yellow');
      addResult('security_headers', 'warning', { message: 'Next.js config not found' });
    }
    
  } catch (error) {
    log(`❌ セキュリティヘッダーチェックでエラー: ${error.message}`, 'red');
    addResult('security_headers', 'failed', { error: error.message });
  }
}

// 5. GitHub設定のセキュリティチェック
function checkGitHubSecurity() {
  logSection('GitHub設定セキュリティチェック');
  
  try {
    // GitHub Actionsワークフローファイルをチェック
    const workflowsDir = join(rootDir, '.github/workflows');
    if (existsSync(workflowsDir)) {
      const workflowFiles = execSync('ls .github/workflows/*.yml 2>/dev/null || true', { 
        encoding: 'utf8', 
        cwd: rootDir 
      }).trim().split('\n').filter(f => f);
      
      let securityWorkflowExists = false;
      let dependabotExists = existsSync(join(rootDir, '.github/dependabot.yml'));
      
      for (const file of workflowFiles) {
        if (file.includes('security') || file.includes('codeql')) {
          securityWorkflowExists = true;
          break;
        }
      }
      
      const checks = [];
      if (securityWorkflowExists) {
        checks.push('✅ セキュリティワークフローが設定されています');
      } else {
        checks.push('⚠️  セキュリティワークフローが設定されていません');
      }
      
      if (dependabotExists) {
        checks.push('✅ Dependabotが設定されています');
      } else {
        checks.push('⚠️  Dependabotが設定されていません');
      }
      
      checks.forEach(check => {
        log(check, check.startsWith('✅') ? 'green' : 'yellow');
      });
      
      const status = securityWorkflowExists && dependabotExists ? 'passed' : 'warning';
      addResult('github_security', status, { 
        security_workflow: securityWorkflowExists,
        dependabot: dependabotExists 
      });
      
    } else {
      log('⚠️  GitHub Actionsワークフローが見つかりません', 'yellow');
      addResult('github_security', 'warning', { message: 'No GitHub workflows found' });
    }
    
  } catch (error) {
    log(`❌ GitHub設定チェックでエラー: ${error.message}`, 'red');
    addResult('github_security', 'failed', { error: error.message });
  }
}

// レポート生成
function generateReport() {
  logSection('セキュリティ監査レポート生成');
  
  const reportPath = join(rootDir, 'security-audit-report.json');
  writeFileSync(reportPath, JSON.stringify(auditResults, null, 2));
  
  // サマリーの表示
  const { summary } = auditResults;
  log('\n📊 監査結果サマリー:', 'bold');
  log(`  総チェック数: ${summary.total_checks}`, 'blue');
  log(`  成功: ${summary.passed}`, 'green');
  log(`  失敗: ${summary.failed}`, summary.failed > 0 ? 'red' : 'green');
  log(`  警告: ${summary.warnings}`, summary.warnings > 0 ? 'yellow' : 'green');
  
  // 総合評価
  if (summary.failed === 0 && summary.warnings === 0) {
    log('\n🎉 セキュリティ監査: 良好', 'green');
  } else if (summary.failed === 0) {
    log('\n⚠️  セキュリティ監査: 注意が必要', 'yellow');
  } else {
    log('\n❌ セキュリティ監査: 問題あり', 'red');
  }
  
  log(`\n📄 詳細レポート: ${reportPath}`, 'cyan');
  
  // 失敗した項目の詳細表示
  if (summary.failed > 0) {
    log('\n🚨 修正が必要な項目:', 'red');
    Object.entries(auditResults.checks)
      .filter(([_, result]) => result.status === 'failed')
      .forEach(([checkName, result]) => {
        log(`  - ${checkName}: ${result.details?.error || 'エラーの詳細を確認してください'}`, 'red');
      });
  }
  
  // 警告項目の表示
  if (summary.warnings > 0) {
    log('\n⚠️  確認が推奨される項目:', 'yellow');
    Object.entries(auditResults.checks)
      .filter(([_, result]) => result.status === 'warning')
      .forEach(([checkName, result]) => {
        log(`  - ${checkName}: ${result.details?.message || '詳細を確認してください'}`, 'yellow');
      });
  }
}

// メイン実行関数
async function main() {
  log(colorize('🛡️  Suptia セキュリティ監査スクリプト', 'bold'));
  log(colorize(`実行日時: ${new Date().toLocaleString('ja-JP')}`, 'cyan'));
  
  try {
    checkEnvironmentSecurity();
    checkDependencyVulnerabilities();
    checkLicenseCompliance();
    checkSecurityHeaders();
    checkGitHubSecurity();
    generateReport();
    
    // 終了コードの設定
    const exitCode = auditResults.summary.failed > 0 ? 1 : 0;
    process.exit(exitCode);
    
  } catch (error) {
    log(`\n❌ 監査実行中にエラーが発生しました: ${error.message}`, 'red');
    process.exit(1);
  }
}

// コマンドライン引数の処理
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
🛡️  Suptia セキュリティ監査スクリプト

使用方法:
  node scripts/security-audit.mjs [オプション]

オプション:
  --help, -h     このヘルプを表示
  
実行される監査項目:
  1. 環境変数・シークレットセキュリティ
  2. 依存関係脆弱性チェック
  3. ライセンスコンプライアンス
  4. セキュリティヘッダー設定
  5. GitHub設定セキュリティ

出力:
  - コンソールに結果を表示
  - security-audit-report.json にレポートを生成
  - 問題がある場合は終了コード1で終了
`);
  process.exit(0);
}

// スクリプト実行
main().catch(error => {
  console.error('予期しないエラー:', error);
  process.exit(1);
});