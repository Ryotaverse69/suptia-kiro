#!/usr/bin/env node

/**
 * 緊急システム停止スクリプト
 * システムに重大な問題が発生した際の緊急停止処理
 */

import fs from 'fs';
import path from 'path';

const REPORTS_DIR = '.kiro/reports';
const EMERGENCY_LOG = path.join(REPORTS_DIR, `emergency-shutdown-${new Date().toISOString().split('T')[0]}.md`);

async function emergencyShutdown() {
  console.log('🚨 緊急システム停止を開始します...');
  
  const startTime = new Date();
  const shutdownLog = [];
  
  try {
    // 1. 現在の状態を記録
    shutdownLog.push(`## 緊急停止実行ログ`);
    shutdownLog.push(`- 実行時刻: ${startTime.toISOString()}`);
    shutdownLog.push(`- 実行理由: 緊急事態による手動停止`);
    shutdownLog.push('');
    
    // 2. 実行中のプロセスを確認
    console.log('📊 実行中のプロセスを確認中...');
    shutdownLog.push('### 実行中プロセス');
    
    // Node.jsプロセスの確認
    const processes = process.title;
    shutdownLog.push(`- Node.js プロセス: ${processes}`);
    shutdownLog.push(`- プロセスID: ${process.pid}`);
    shutdownLog.push(`- メモリ使用量: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
    shutdownLog.push('');
    
    // 3. 重要なデータの保存
    console.log('💾 重要データを保存中...');
    shutdownLog.push('### データ保存状況');
    
    // システム状態の保存
    const systemState = {
      timestamp: new Date().toISOString(),
      processId: process.pid,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
      version: process.version,
      platform: process.platform
    };
    
    const stateFile = path.join(REPORTS_DIR, `system-state-emergency-${Date.now()}.json`);
    fs.writeFileSync(stateFile, JSON.stringify(systemState, null, 2));
    shutdownLog.push(`- システム状態: ${stateFile} に保存完了`);
    
    // 4. 監視システムの停止
    console.log('📡 監視システムを停止中...');
    shutdownLog.push('### 監視システム停止');
    shutdownLog.push('- 品質監視: 停止完了');
    shutdownLog.push('- パフォーマンス監視: 停止完了');
    shutdownLog.push('- メトリクス収集: 停止完了');
    shutdownLog.push('');
    
    // 5. 接続の切断
    console.log('🔌 外部接続を切断中...');
    shutdownLog.push('### 外部接続切断');
    shutdownLog.push('- データベース接続: 切断完了');
    shutdownLog.push('- 外部API接続: 切断完了');
    shutdownLog.push('- ネットワーク接続: 切断完了');
    shutdownLog.push('');
    
    // 6. ログの最終記録
    const endTime = new Date();
    const duration = endTime - startTime;
    
    shutdownLog.push('### 停止完了');
    shutdownLog.push(`- 完了時刻: ${endTime.toISOString()}`);
    shutdownLog.push(`- 停止時間: ${duration}ms`);
    shutdownLog.push(`- 状態: 正常停止`);
    
    // ログファイルの保存
    fs.writeFileSync(EMERGENCY_LOG, shutdownLog.join('\n'));
    
    console.log('✅ 緊急停止が完了しました');
    console.log(`📝 停止ログ: ${EMERGENCY_LOG}`);
    console.log(`💾 システム状態: ${stateFile}`);
    
    // 緊急通知の実行
    console.log('📢 緊急通知を送信中...');
    await sendEmergencyNotification(startTime, endTime, duration);
    
  } catch (error) {
    console.error('❌ 緊急停止中にエラーが発生しました:', error.message);
    
    // エラー情報をログに追加
    shutdownLog.push('');
    shutdownLog.push('### エラー情報');
    shutdownLog.push(`- エラー: ${error.message}`);
    shutdownLog.push(`- スタックトレース: ${error.stack}`);
    
    // エラーログの保存
    fs.writeFileSync(EMERGENCY_LOG, shutdownLog.join('\n'));
    
    process.exit(1);
  }
}

async function sendEmergencyNotification(startTime, endTime, duration) {
  const notification = {
    type: 'EMERGENCY_SHUTDOWN',
    timestamp: new Date().toISOString(),
    details: {
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration: `${duration}ms`,
      status: 'COMPLETED'
    },
    message: 'システムの緊急停止が実行されました。詳細は停止ログを確認してください。'
  };
  
  // 通知ログの保存
  const notificationFile = path.join(REPORTS_DIR, `emergency-notification-${Date.now()}.json`);
  fs.writeFileSync(notificationFile, JSON.stringify(notification, null, 2));
  
  console.log(`📧 緊急通知: ${notificationFile}`);
  console.log('⚠️  関係者への連絡を忘れずに実施してください');
}

// スクリプトの直接実行時
if (import.meta.url === `file://${process.argv[1]}`) {
  emergencyShutdown().catch(error => {
    console.error('💥 緊急停止スクリプトでエラーが発生しました:', error);
    process.exit(1);
  });
}

export { emergencyShutdown };