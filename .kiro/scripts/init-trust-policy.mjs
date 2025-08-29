#!/usr/bin/env node

/**
 * Trust承認ポリシー初期化スクリプト
 * 既存環境への導入用の初期化とマイグレーション機能
 * 
 * 機能:
 * - デフォルト設定の適用
 * - 既存設定のバックアップ
 * - 段階的移行のためのマイグレーション
 * - 設定の検証と復旧
 */

import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const POLICY_FILE_PATH = '.kiro/settings/trust-policy.json';
const DEFAULT_POLICY_PATH = '.kiro/lib/trust-policy/default-policy.json';
const BACKUP_DIR = '.kiro/backups';
const MIGRATION_LOG_PATH = '.kiro/reports/trust-policy-migration.log';

// 現在の作業ディレクトリを基準とした絶対パス
const resolvePath = (relativePath) => join(process.cwd(), relativePath);

// コマンドライン引数の解析
const args = process.argv.slice(2);
const options = {
  force: args.includes('--force'),
  migrate: args.includes('--migrate'),
  restore: args.find(arg => arg.startsWith('--restore=')),
  dryRun: args.includes('--dry-run'),
  verbose: args.includes('--verbose')
};

/**
 * ディレクトリが存在しない場合は作成
 */
async function ensureDirectory(dirPath) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
    console.log(`✅ ディレクトリを作成しました: ${dirPath}`);
  }
}

/**
 * ファイルが存在するかチェック
 */
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * 設定ファイルのハッシュを計算
 */
function calculateHash(content) {
  return createHash('sha256').update(content).digest('hex').substring(0, 8);
}

/**
 * 既存設定のバックアップを作成
 */
async function createBackup(reason = 'manual') {
  const policyPath = resolvePath(POLICY_FILE_PATH);
  
  if (await fileExists(policyPath)) {
    const backupDirPath = resolvePath(BACKUP_DIR);
    await ensureDirectory(backupDirPath);
    
    const content = await fs.readFile(policyPath, 'utf-8');
    const hash = calculateHash(content);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = join(backupDirPath, `trust-policy.backup.${timestamp}.${hash}.json`);
    
    // バックアップメタデータを含める
    const backupData = {
      metadata: {
        originalPath: POLICY_FILE_PATH,
        backupTime: new Date().toISOString(),
        reason: reason,
        hash: hash,
        version: JSON.parse(content).version || 'unknown'
      },
      content: JSON.parse(content)
    };
    
    await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2), 'utf-8');
    
    if (options.verbose) {
      console.log(`📦 既存設定をバックアップしました: ${backupPath}`);
      console.log(`   理由: ${reason}, ハッシュ: ${hash}`);
    } else {
      console.log(`📦 既存設定をバックアップしました: ${backupPath}`);
    }
    
    return backupPath;
  }
  return null;
}

/**
 * バックアップファイル一覧を取得
 */
async function listBackups() {
  try {
    const backupDirPath = resolvePath(BACKUP_DIR);
    const files = await fs.readdir(backupDirPath);
    const backupFiles = files
      .filter(file => file.startsWith('trust-policy.backup.') && file.endsWith('.json'))
      .sort()
      .reverse(); // 新しい順
    
    return backupFiles;
  } catch {
    return [];
  }
}

/**
 * バックアップから復元
 */
async function restoreFromBackup(backupFile) {
  const backupPath = resolvePath(join(BACKUP_DIR, backupFile));
  
  if (!await fileExists(backupPath)) {
    throw new Error(`バックアップファイルが見つかりません: ${backupPath}`);
  }
  
  const backupContent = await fs.readFile(backupPath, 'utf-8');
  const backupData = JSON.parse(backupContent);
  
  // バックアップデータの形式を確認
  let policyContent;
  if (backupData.metadata && backupData.content) {
    // 新形式（メタデータ付き）
    policyContent = backupData.content;
    console.log(`📋 バックアップ情報:`);
    console.log(`   作成日時: ${backupData.metadata.backupTime}`);
    console.log(`   理由: ${backupData.metadata.reason}`);
    console.log(`   バージョン: ${backupData.metadata.version}`);
  } else {
    // 旧形式（直接ポリシー）
    policyContent = backupData;
  }
  
  // 現在の設定をバックアップ
  await createBackup('before-restore');
  
  // 復元実行
  const policyPath = resolvePath(POLICY_FILE_PATH);
  await fs.writeFile(policyPath, JSON.stringify(policyContent, null, 2), 'utf-8');
  
  console.log(`✅ バックアップから復元しました: ${backupFile}`);
  
  // 復元後の検証
  const isValid = await validatePolicy();
  if (!isValid) {
    console.warn('⚠️  復元されたファイルに問題があります。検証してください。');
  }
}

/**
 * デフォルト設定を適用
 */
async function applyDefaultPolicy() {
  const settingsDir = resolvePath('.kiro/settings');
  await ensureDirectory(settingsDir);
  
  const defaultPolicy = await getDefaultPolicy();
  
  if (options.dryRun) {
    console.log('🔍 ドライラン: デフォルト設定の内容');
    console.log(JSON.stringify(defaultPolicy, null, 2));
    return;
  }
  
  const policyPath = resolvePath(POLICY_FILE_PATH);
  const policyContent = JSON.stringify(defaultPolicy, null, 2);
  await fs.writeFile(policyPath, policyContent, 'utf-8');
  
  console.log(`✅ デフォルト設定を適用しました: ${POLICY_FILE_PATH}`);
}

/**
 * 設定の検証
 */
async function validatePolicy() {
  try {
    const policyPath = resolvePath(POLICY_FILE_PATH);
    const content = await fs.readFile(policyPath, 'utf-8');
    const policy = JSON.parse(content);
    
    // 基本的な検証
    const requiredFields = ['version', 'lastUpdated', 'autoApprove', 'manualApprove', 'security'];
    const missingFields = requiredFields.filter(field => !policy[field]);
    
    if (missingFields.length > 0) {
      console.warn(`⚠️  不足しているフィールド: ${missingFields.join(', ')}`);
      return false;
    }
    
    // 詳細検証
    const validationErrors = [];
    
    // autoApprove構造の検証
    if (!policy.autoApprove.gitOperations || !Array.isArray(policy.autoApprove.gitOperations)) {
      validationErrors.push('autoApprove.gitOperations が配列ではありません');
    }
    
    if (!policy.autoApprove.fileOperations || !Array.isArray(policy.autoApprove.fileOperations)) {
      validationErrors.push('autoApprove.fileOperations が配列ではありません');
    }
    
    // security設定の検証
    if (typeof policy.security.maxAutoApprovalPerHour !== 'number' || policy.security.maxAutoApprovalPerHour < 0) {
      validationErrors.push('security.maxAutoApprovalPerHour が正の数値ではありません');
    }
    
    if (typeof policy.security.suspiciousPatternDetection !== 'boolean') {
      validationErrors.push('security.suspiciousPatternDetection がboolean値ではありません');
    }
    
    if (validationErrors.length > 0) {
      console.warn('⚠️  設定ファイルに問題があります:');
      validationErrors.forEach(error => console.warn(`   - ${error}`));
      return false;
    }
    
    if (options.verbose) {
      console.log('✅ 設定ファイルの詳細検証に成功しました');
    } else {
      console.log('✅ 設定ファイルの検証に成功しました');
    }
    return true;
  } catch (error) {
    console.error('❌ 設定ファイルの検証に失敗しました:', error.message);
    return false;
  }
}

/**
 * 段階的移行の実行
 */
async function performMigration() {
  console.log('🔄 段階的移行を開始します...');
  
  // 移行ログの初期化
  await ensureDirectory('.kiro/reports');
  const migrationLog = [];
  
  try {
    // 現在の設定を確認
    let currentPolicy = null;
    const policyPath = resolvePath(POLICY_FILE_PATH);
    if (await fileExists(policyPath)) {
      const content = await fs.readFile(policyPath, 'utf-8');
      currentPolicy = JSON.parse(content);
      migrationLog.push(`既存設定を検出: バージョン ${currentPolicy.version || 'unknown'}`);
    } else {
      migrationLog.push('既存設定なし - 新規インストール');
    }
    
    // バックアップ作成
    const backupPath = await createBackup('migration');
    if (backupPath) {
      migrationLog.push(`バックアップ作成: ${backupPath}`);
    }
    
    // デフォルト設定の読み込み
    const defaultPolicy = await getDefaultPolicy();
    migrationLog.push(`デフォルト設定読み込み: バージョン ${defaultPolicy.version}`);
    
    // 段階的移行の実行
    let migratedPolicy;
    
    if (currentPolicy) {
      // 既存設定がある場合は段階的にマージ
      migratedPolicy = await mergeConfigurations(currentPolicy, defaultPolicy);
      migrationLog.push('既存設定とデフォルト設定をマージ');
    } else {
      // 新規の場合はデフォルト設定を適用
      migratedPolicy = defaultPolicy;
      migrationLog.push('デフォルト設定を新規適用');
    }
    
    // 移行後の設定を保存
    if (!options.dryRun) {
      await fs.writeFile(policyPath, JSON.stringify(migratedPolicy, null, 2), 'utf-8');
      migrationLog.push('移行後の設定を保存');
    } else {
      migrationLog.push('ドライラン: 設定保存をスキップ');
    }
    
    // 検証
    if (!options.dryRun) {
      const isValid = await validatePolicy();
      migrationLog.push(`設定検証: ${isValid ? '成功' : '失敗'}`);
    }
    
    // 移行ログの保存
    const logContent = [
      `# Trust承認ポリシー移行ログ`,
      ``,
      `**実行日時**: ${new Date().toISOString()}`,
      `**移行タイプ**: ${currentPolicy ? '既存設定更新' : '新規インストール'}`,
      `**ドライラン**: ${options.dryRun ? 'はい' : 'いいえ'}`,
      ``,
      `## 移行手順`,
      ``,
      ...migrationLog.map(log => `- ${log}`),
      ``,
      `## 移行結果`,
      ``,
      options.dryRun ? '⚠️ ドライランのため実際の変更は行われていません' : '✅ 移行が正常に完了しました',
      ``
    ].join('\n');
    
    const migrationLogPath = resolvePath(MIGRATION_LOG_PATH);
    await fs.writeFile(migrationLogPath, logContent, 'utf-8');
    
    console.log('✅ 段階的移行が完了しました');
    console.log(`📋 移行ログ: ${MIGRATION_LOG_PATH}`);
    
    return true;
    
  } catch (error) {
    migrationLog.push(`エラー: ${error.message}`);
    console.error('❌ 移行中にエラーが発生しました:', error.message);
    return false;
  }
}

/**
 * デフォルト設定を取得
 */
async function getDefaultPolicy() {
  let defaultPolicy;
  
  // デフォルトポリシーファイルから読み込み
  const defaultPolicyPath = resolvePath(DEFAULT_POLICY_PATH);
  if (await fileExists(defaultPolicyPath)) {
    const content = await fs.readFile(defaultPolicyPath, 'utf-8');
    defaultPolicy = JSON.parse(content);
  } else {
    // ハードコードされたデフォルト設定
    defaultPolicy = {
      version: "1.0",
      lastUpdated: new Date().toISOString(),
      autoApprove: {
        gitOperations: [
          "status", "commit", "push", "pull", "merge", "log",
          "diff", "show", "branch", "checkout", "switch"
        ],
        fileOperations: ["read", "write", "create", "update", "mkdir"],
        cliOperations: {
          vercel: ["env ls", "domains ls", "deployments ls", "status", "whoami"]
        },
        scriptExecution: {
          extensions: [".mjs"],
          allowedPaths: ["scripts/", ".kiro/scripts/"]
        }
      },
      manualApprove: {
        deleteOperations: [
          "git branch -D", "git push --delete", "rm -rf",
          "vercel env rm", "vercel domain rm"
        ],
        forceOperations: [
          "git reset --hard", "git push --force", "git push -f"
        ],
        productionImpact: [
          "github:write", "sanity-dev:write", "vercel:envSet", "vercel:addDomain"
        ]
      },
      security: {
        maxAutoApprovalPerHour: 1000,
        suspiciousPatternDetection: true,
        logAllOperations: true
      }
    };
  }
  
  // タイムスタンプを更新
  defaultPolicy.lastUpdated = new Date().toISOString();
  
  return defaultPolicy;
}

/**
 * 既存設定とデフォルト設定をマージ
 */
async function mergeConfigurations(currentPolicy, defaultPolicy) {
  const merged = JSON.parse(JSON.stringify(defaultPolicy)); // ディープコピー
  
  // バージョン情報の更新
  merged.version = defaultPolicy.version;
  merged.lastUpdated = new Date().toISOString();
  
  // 既存のカスタム設定を保持
  if (currentPolicy.autoApprove) {
    // 既存の自動承認設定を保持しつつ、新しいデフォルト項目を追加
    if (currentPolicy.autoApprove.gitOperations) {
      const existingOps = new Set(currentPolicy.autoApprove.gitOperations);
      const defaultOps = new Set(defaultPolicy.autoApprove.gitOperations);
      merged.autoApprove.gitOperations = [...new Set([...existingOps, ...defaultOps])];
    }
    
    if (currentPolicy.autoApprove.fileOperations) {
      const existingOps = new Set(currentPolicy.autoApprove.fileOperations);
      const defaultOps = new Set(defaultPolicy.autoApprove.fileOperations);
      merged.autoApprove.fileOperations = [...new Set([...existingOps, ...defaultOps])];
    }
    
    // CLI操作のマージ
    if (currentPolicy.autoApprove.cliOperations) {
      merged.autoApprove.cliOperations = {
        ...defaultPolicy.autoApprove.cliOperations,
        ...currentPolicy.autoApprove.cliOperations
      };
    }
  }
  
  // セキュリティ設定の保持（既存設定を優先）
  if (currentPolicy.security) {
    merged.security = {
      ...defaultPolicy.security,
      ...currentPolicy.security
    };
  }
  
  return merged;
}

/**
 * レポートディレクトリの初期化
 */
async function initializeReportsDirectory() {
  const reportsDir = resolvePath('.kiro/reports');
  await ensureDirectory(reportsDir);
  console.log('✅ レポートディレクトリを初期化しました');
}

/**
 * 運用ガイドラインファイルの作成
 */
async function createUsageGuide() {
  const guidePath = resolvePath('.kiro/steering/trust-usage.md');
  
  if (await fileExists(guidePath)) {
    console.log('ℹ️  運用ガイドラインは既に存在します');
    return;
  }
  
  const steeringDir = resolvePath('.kiro/steering');
  await ensureDirectory(steeringDir);
  
  const guideContent = `# Trust承認ポリシー運用ガイド

## 概要

このガイドでは、Trust承認ポリシーシステムの運用方法について説明します。

## 設定ファイル

- **場所**: \`.kiro/settings/trust-policy.json\`
- **バックアップ**: \`.kiro/backups/\` に自動保存
- **デフォルト設定**: \`.kiro/lib/trust-policy/default-policy.json\`

## 基本的な使用方法

### 設定の確認
\`\`\`bash
cat .kiro/settings/trust-policy.json
\`\`\`

### 設定の初期化
\`\`\`bash
node .kiro/scripts/init-trust-policy.mjs
\`\`\`

### バックアップからの復元
\`\`\`bash
cp .kiro/backups/trust-policy.backup.YYYY-MM-DD.json .kiro/settings/trust-policy.json
\`\`\`

## 設定項目の説明

### autoApprove（自動承認対象）
- **gitOperations**: 自動承認するGit操作
- **fileOperations**: 自動承認するファイル操作
- **cliOperations**: 自動承認するCLI操作
- **scriptExecution**: 自動承認するスクリプト実行

### manualApprove（手動承認対象）
- **deleteOperations**: 削除系操作（危険）
- **forceOperations**: 強制系操作（危険）
- **productionImpact**: 本番環境影響操作（危険）

### security（セキュリティ設定）
- **maxAutoApprovalPerHour**: 1時間あたりの最大自動承認数
- **suspiciousPatternDetection**: 不審パターン検出の有効/無効
- **logAllOperations**: 全操作ログ記録の有効/無効

## トラブルシューティング

### 設定ファイルが破損した場合
1. バックアップから復元
2. 初期化スクリプトを実行
3. デフォルト設定を適用

### 自動承認が機能しない場合
1. 設定ファイルの構文チェック
2. ログファイルの確認
3. キャッシュのクリア

## ベストプラクティス

1. **定期的なバックアップ**: 設定変更前は必ずバックアップを作成
2. **段階的な変更**: 大きな変更は段階的に適用
3. **ログの監視**: 自動承認の動作を定期的に確認
4. **セキュリティ設定の見直し**: 定期的にセキュリティ設定を確認

## 関連ファイル

- 設定ファイル: \`.kiro/settings/trust-policy.json\`
- ログファイル: \`.kiro/reports/auto-trust-log-*.md\`
- バックアップ: \`.kiro/backups/trust-policy.backup.*.json\`
`;

  await fs.writeFile(guidePath, guideContent, 'utf-8');
  console.log(`✅ 運用ガイドラインを作成しました: .kiro/steering/trust-usage.md`);
}

/**
 * ヘルプメッセージを表示
 */
function showHelp() {
  console.log(`
Trust承認ポリシー初期化スクリプト

使用方法:
  node .kiro/scripts/init-trust-policy.mjs [オプション]

オプション:
  --force         既存設定を強制的に上書き
  --migrate       段階的移行を実行（既存設定を保持しつつ更新）
  --restore=FILE  指定したバックアップファイルから復元
  --dry-run       実際の変更を行わずに実行内容を表示
  --verbose       詳細な実行ログを表示
  --help          このヘルプを表示

例:
  # 基本的な初期化
  node .kiro/scripts/init-trust-policy.mjs

  # 段階的移行（推奨）
  node .kiro/scripts/init-trust-policy.mjs --migrate

  # ドライラン（変更内容の確認）
  node .kiro/scripts/init-trust-policy.mjs --migrate --dry-run

  # バックアップから復元
  node .kiro/scripts/init-trust-policy.mjs --restore=trust-policy.backup.2025-08-27.json

  # 強制的な初期化（既存設定を破棄）
  node .kiro/scripts/init-trust-policy.mjs --force
`);
}

/**
 * バックアップ一覧を表示
 */
async function showBackups() {
  const backups = await listBackups();
  
  if (backups.length === 0) {
    console.log('📦 利用可能なバックアップはありません');
    return;
  }
  
  console.log('📦 利用可能なバックアップ:');
  for (const backup of backups.slice(0, 10)) { // 最新10件のみ表示
    try {
      const backupDirPath = resolvePath(BACKUP_DIR);
      const backupPath = join(backupDirPath, backup);
      const content = await fs.readFile(backupPath, 'utf-8');
      const data = JSON.parse(content);
      
      if (data.metadata) {
        console.log(`   ${backup}`);
        console.log(`     作成日時: ${data.metadata.backupTime}`);
        console.log(`     理由: ${data.metadata.reason}`);
        console.log(`     バージョン: ${data.metadata.version}`);
      } else {
        console.log(`   ${backup} (旧形式)`);
      }
    } catch (error) {
      console.log(`   ${backup} (読み込みエラー)`);
    }
  }
  
  if (backups.length > 10) {
    console.log(`   ... 他 ${backups.length - 10} 件`);
  }
}

/**
 * メイン処理
 */
async function main() {
  // ヘルプ表示
  if (args.includes('--help')) {
    showHelp();
    return;
  }
  
  console.log('🚀 Trust承認ポリシーシステムの初期化を開始します...\n');
  
  if (options.verbose) {
    console.log('📋 実行オプション:', options);
  }
  
  try {
    // バックアップから復元
    if (options.restore) {
      const backupFile = options.restore.split('=')[1];
      if (!backupFile) {
        console.error('❌ 復元するバックアップファイルを指定してください');
        console.log('例: --restore=trust-policy.backup.2025-08-27.json');
        await showBackups();
        process.exit(1);
      }
      
      await restoreFromBackup(backupFile);
      console.log('✅ バックアップからの復元が完了しました');
      return;
    }
    
    // 段階的移行
    if (options.migrate) {
      const success = await performMigration();
      if (!success) {
        console.error('❌ 移行に失敗しました');
        process.exit(1);
      }
      
      if (!options.dryRun) {
        // レポートディレクトリの初期化
        await initializeReportsDirectory();
        
        // 運用ガイドラインの作成
        await createUsageGuide();
      }
      
      console.log('\n✅ 段階的移行が完了しました！');
      if (options.dryRun) {
        console.log('\n⚠️  これはドライランです。実際の変更を適用するには --dry-run を外して再実行してください。');
      }
      return;
    }
    
    // 通常の初期化
    const policyPath = resolvePath(POLICY_FILE_PATH);
    const existingConfig = await fileExists(policyPath);
    
    if (existingConfig && !options.force) {
      console.log('⚠️  既存の設定ファイルが見つかりました。');
      console.log('   段階的移行を推奨します: --migrate オプションを使用してください');
      console.log('   強制的に上書きする場合: --force オプションを使用してください');
      console.log('');
      await showBackups();
      return;
    }
    
    // 1. 既存設定のバックアップ
    const backupPath = await createBackup('initialization');
    
    // 2. デフォルト設定の適用
    await applyDefaultPolicy();
    
    if (!options.dryRun) {
      // 3. 設定の検証
      const isValid = await validatePolicy();
      if (!isValid) {
        console.error('❌ 初期化に失敗しました');
        process.exit(1);
      }
      
      // 4. レポートディレクトリの初期化
      await initializeReportsDirectory();
      
      // 5. 運用ガイドラインの作成
      await createUsageGuide();
    }
    
    console.log('\n✅ Trust承認ポリシーシステムの初期化が完了しました！');
    
    if (!options.dryRun) {
      console.log('\n📋 次のステップ:');
      console.log('1. .kiro/steering/trust-usage.md で運用方法を確認');
      console.log('2. .kiro/settings/trust-policy.json で設定をカスタマイズ');
      console.log('3. 実際の操作で動作を確認');
      
      if (backupPath) {
        console.log(`\n💾 既存設定のバックアップ: ${backupPath}`);
      }
    } else {
      console.log('\n⚠️  これはドライランです。実際の変更を適用するには --dry-run を外して再実行してください。');
    }
    
  } catch (error) {
    console.error('❌ 初期化中にエラーが発生しました:', error.message);
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// スクリプトが直接実行された場合のみメイン処理を実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main as initTrustPolicy };