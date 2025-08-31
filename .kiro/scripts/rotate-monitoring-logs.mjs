#!/usr/bin/env node

/**
 * 監視ログローテーションスクリプト
 * 監視システムのログファイルを定期的にローテーションし、
 * ディスク容量の管理と古いログの削除を行う
 */

import fs from 'fs';
import path from 'path';

const LOGS_DIR = '.kiro/reports/monitoring';
const MAX_LOG_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_LOG_FILES = 5;
const MAX_LOG_AGE_DAYS = 30;

// ローテーション対象のログファイル
const LOG_FILES = [
  'quality-monitor.log',
  'performance-monitor.log',
  'alerts.log',
  'system-health.log',
  'metrics-collector.log',
  'audit.log'
];

async function rotateMonitoringLogs() {
  console.log('🔄 監視ログのローテーションを開始します...');
  
  try {
    // ログディレクトリの確認・作成
    if (!fs.existsSync(LOGS_DIR)) {
      fs.mkdirSync(LOGS_DIR, { recursive: true });
      console.log(`📁 ログディレクトリを作成しました: ${LOGS_DIR}`);
    }
    
    let rotatedCount = 0;
    let cleanedCount = 0;
    
    // 各ログファイルのローテーション
    for (const logFile of LOG_FILES) {
      const logPath = path.join(LOGS_DIR, logFile);
      
      if (fs.existsSync(logPath)) {
        const rotated = await rotateLogFile(logPath);
        if (rotated) rotatedCount++;
        
        const cleaned = await cleanOldLogFiles(logPath);
        cleanedCount += cleaned;
      } else {
        // ログファイルが存在しない場合は空ファイルを作成
        fs.writeFileSync(logPath, '');
        console.log(`📄 新しいログファイルを作成しました: ${logFile}`);
      }
    }
    
    // 古いレポートファイルのクリーンアップ
    const reportsCleaned = await cleanOldReports();
    
    console.log('✅ ログローテーションが完了しました');
    console.log(`📊 統計:`);
    console.log(`  - ローテーションしたファイル: ${rotatedCount}個`);
    console.log(`  - 削除した古いログ: ${cleanedCount}個`);
    console.log(`  - 削除した古いレポート: ${reportsCleaned}個`);
    
    // ローテーション結果のレポート生成
    await generateRotationReport(rotatedCount, cleanedCount, reportsCleaned);
    
  } catch (error) {
    console.error('❌ ログローテーション中にエラーが発生しました:', error.message);
    throw error;
  }
}

async function rotateLogFile(logPath) {
  try {
    const stats = fs.statSync(logPath);
    
    // ファイルサイズチェック
    if (stats.size <= MAX_LOG_SIZE) {
      return false; // ローテーション不要
    }
    
    console.log(`🔄 ローテーション実行: ${path.basename(logPath)} (${Math.round(stats.size / 1024 / 1024)}MB)`);
    
    // 既存のローテーションファイルをシフト
    for (let i = MAX_LOG_FILES - 1; i > 0; i--) {
      const oldFile = `${logPath}.${i}`;
      const newFile = `${logPath}.${i + 1}`;
      
      if (fs.existsSync(oldFile)) {
        if (i === MAX_LOG_FILES - 1) {
          // 最古のファイルは削除
          fs.unlinkSync(oldFile);
        } else {
          // ファイルをリネーム
          fs.renameSync(oldFile, newFile);
        }
      }
    }
    
    // 現在のログファイルをローテーション
    fs.renameSync(logPath, `${logPath}.1`);
    
    // 新しい空のログファイルを作成
    fs.writeFileSync(logPath, '');
    
    return true;
    
  } catch (error) {
    console.error(`❌ ${path.basename(logPath)} のローテーションに失敗:`, error.message);
    return false;
  }
}

async function cleanOldLogFiles(logPath) {
  let cleanedCount = 0;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - MAX_LOG_AGE_DAYS);
  
  try {
    // ローテーションされたログファイルをチェック
    for (let i = 1; i <= MAX_LOG_FILES; i++) {
      const rotatedFile = `${logPath}.${i}`;
      
      if (fs.existsSync(rotatedFile)) {
        const stats = fs.statSync(rotatedFile);
        
        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(rotatedFile);
          console.log(`🗑️  古いログファイルを削除: ${path.basename(rotatedFile)}`);
          cleanedCount++;
        }
      }
    }
    
  } catch (error) {
    console.error(`❌ 古いログファイルの削除に失敗:`, error.message);
  }
  
  return cleanedCount;
}

async function cleanOldReports() {
  let cleanedCount = 0;
  const reportsDir = '.kiro/reports';
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - MAX_LOG_AGE_DAYS);
  
  try {
    if (!fs.existsSync(reportsDir)) {
      return 0;
    }
    
    const files = fs.readdirSync(reportsDir);
    
    for (const file of files) {
      const filePath = path.join(reportsDir, file);
      const stats = fs.statSync(filePath);
      
      // 古いレポートファイルを削除（.mdファイルのみ）
      if (stats.isFile() && 
          file.endsWith('.md') && 
          stats.mtime < cutoffDate &&
          (file.includes('daily-') || file.includes('hourly-') || file.includes('temp-'))) {
        
        fs.unlinkSync(filePath);
        console.log(`🗑️  古いレポートファイルを削除: ${file}`);
        cleanedCount++;
      }
    }
    
  } catch (error) {
    console.error('❌ 古いレポートファイルの削除に失敗:', error.message);
  }
  
  return cleanedCount;
}

async function generateRotationReport(rotatedCount, cleanedCount, reportsCleaned) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      rotatedFiles: rotatedCount,
      cleanedLogs: cleanedCount,
      cleanedReports: reportsCleaned
    },
    details: {
      logDirectory: LOGS_DIR,
      maxLogSize: `${MAX_LOG_SIZE / 1024 / 1024}MB`,
      maxLogFiles: MAX_LOG_FILES,
      maxLogAgeDays: MAX_LOG_AGE_DAYS
    },
    diskUsage: await getDiskUsage()
  };
  
  const reportFile = path.join('.kiro/reports', `log-rotation-${new Date().toISOString().split('T')[0]}.json`);
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  
  console.log(`📊 ローテーションレポート: ${reportFile}`);
}

async function getDiskUsage() {
  try {
    const logsSize = await getDirectorySize(LOGS_DIR);
    const reportsSize = await getDirectorySize('.kiro/reports');
    
    return {
      logsDirectory: `${Math.round(logsSize / 1024 / 1024)}MB`,
      reportsDirectory: `${Math.round(reportsSize / 1024 / 1024)}MB`,
      total: `${Math.round((logsSize + reportsSize) / 1024 / 1024)}MB`
    };
  } catch (error) {
    return { error: error.message };
  }
}

async function getDirectorySize(dirPath) {
  let totalSize = 0;
  
  if (!fs.existsSync(dirPath)) {
    return 0;
  }
  
  const files = fs.readdirSync(dirPath);
  
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isFile()) {
      totalSize += stats.size;
    } else if (stats.isDirectory()) {
      totalSize += await getDirectorySize(filePath);
    }
  }
  
  return totalSize;
}

// 自動ローテーション設定の確認
async function checkRotationSettings() {
  console.log('⚙️  ローテーション設定:');
  console.log(`  - ログディレクトリ: ${LOGS_DIR}`);
  console.log(`  - 最大ログサイズ: ${MAX_LOG_SIZE / 1024 / 1024}MB`);
  console.log(`  - 最大ログファイル数: ${MAX_LOG_FILES}`);
  console.log(`  - ログ保持期間: ${MAX_LOG_AGE_DAYS}日`);
  console.log(`  - 対象ログファイル: ${LOG_FILES.length}個`);
  
  // 現在のディスク使用量
  const diskUsage = await getDiskUsage();
  console.log(`  - 現在のディスク使用量: ${diskUsage.total}`);
}

// cron設定の生成
function generateCronConfig() {
  const cronConfig = `# 監視ログローテーション設定
# 毎日午前2時に実行
0 2 * * * cd ${process.cwd()} && node .kiro/scripts/rotate-monitoring-logs.mjs

# 毎週日曜日午前3時に詳細クリーンアップ
0 3 * * 0 cd ${process.cwd()} && node .kiro/scripts/rotate-monitoring-logs.mjs --deep-clean
`;
  
  const cronFile = path.join('.kiro/scripts', 'log-rotation.cron');
  fs.writeFileSync(cronFile, cronConfig);
  
  console.log(`📅 cron設定ファイルを生成しました: ${cronFile}`);
  console.log('設定を適用するには以下を実行してください:');
  console.log(`crontab ${cronFile}`);
}

// スクリプトの直接実行時
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    console.log(`
監視ログローテーションスクリプト

使用方法:
  node rotate-monitoring-logs.mjs [オプション]

オプション:
  --help          このヘルプを表示
  --check         現在の設定を確認
  --generate-cron cron設定ファイルを生成
  --deep-clean    詳細クリーンアップを実行

例:
  node rotate-monitoring-logs.mjs
  node rotate-monitoring-logs.mjs --check
  node rotate-monitoring-logs.mjs --generate-cron
`);
    process.exit(0);
  }
  
  if (args.includes('--check')) {
    checkRotationSettings().catch(error => {
      console.error('設定確認でエラーが発生しました:', error);
      process.exit(1);
    });
  } else if (args.includes('--generate-cron')) {
    generateCronConfig();
  } else {
    rotateMonitoringLogs().catch(error => {
      console.error('💥 ログローテーションでエラーが発生しました:', error);
      process.exit(1);
    });
  }
}

export { rotateMonitoringLogs, checkRotationSettings, generateCronConfig };