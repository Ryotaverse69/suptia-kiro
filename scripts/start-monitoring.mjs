#!/usr/bin/env node

/**
 * 監視システム統合起動スクリプト
 * 全ての監視機能を統合して管理
 */

import { spawn, execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

/**
 * 監視プロセス管理
 */
class MonitoringManager {
  constructor() {
    this.processes = new Map();
    this.config = this.loadConfig();
    this.isShuttingDown = false;
    
    // シグナルハンドラーの設定
    process.on('SIGINT', () => this.shutdown('SIGINT'));
    process.on('SIGTERM', () => this.shutdown('SIGTERM'));
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      this.shutdown('ERROR');
    });
  }
  
  /**
   * 設定ファイルの読み込み
   */
  loadConfig() {
    try {
      const configPath = join(process.cwd(), 'monitoring-config.json');
      if (existsSync(configPath)) {
        const configData = readFileSync(configPath, 'utf8');
        return JSON.parse(configData);
      }
    } catch (error) {
      console.warn('Failed to load monitoring config:', error.message);
    }
    
    // デフォルト設定
    return {
      monitoring: { enabled: true },
      domains: {
        primary: { monitoring: { checkInterval: 300 } }
      }
    };
  }
  
  /**
   * 監視プロセスの開始
   */
  async startMonitoring() {
    console.log('🚀 Starting Suptia Domain Monitoring System');
    console.log('==========================================');
    
    if (!this.config.monitoring.enabled) {
      console.log('❌ Monitoring is disabled in configuration');
      return;
    }
    
    // 1. ドメインヘルス監視の開始
    await this.startDomainHealthMonitoring();
    
    // 2. SSL証明書監視の開始
    await this.startSSLMonitoring();
    
    // 3. パフォーマンス監視の開始
    await this.startPerformanceMonitoring();
    
    // 4. アラート管理システムの開始
    await this.startAlertManager();
    
    // 5. 監視ダッシュボードの開始
    await this.startDashboard();
    
    console.log('✅ All monitoring services started successfully');
    console.log(`📊 Monitoring dashboard: ${process.env.NEXT_PUBLIC_SITE_URL}/api/monitoring/domain-health`);
    console.log('🔄 Press Ctrl+C to stop monitoring');
    
    // メインループ
    await this.mainLoop();
  }
  
  /**
   * ドメインヘルス監視の開始
   */
  async startDomainHealthMonitoring() {
    console.log('🏥 Starting domain health monitoring...');
    
    try {
      const process = spawn('node', ['scripts/monitor-domain-health.mjs', 'monitor'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, NODE_ENV: 'production' }
      });
      
      this.processes.set('domain-health', process);
      
      process.stdout.on('data', (data) => {
        console.log(`[DOMAIN-HEALTH] ${data.toString().trim()}`);
      });
      
      process.stderr.on('data', (data) => {
        console.error(`[DOMAIN-HEALTH ERROR] ${data.toString().trim()}`);
      });
      
      process.on('exit', (code) => {
        console.log(`[DOMAIN-HEALTH] Process exited with code ${code}`);
        if (!this.isShuttingDown && code !== 0) {
          console.log('🔄 Restarting domain health monitoring...');
          setTimeout(() => this.startDomainHealthMonitoring(), 5000);
        }
      });
      
      console.log('✅ Domain health monitoring started');
    } catch (error) {
      console.error('❌ Failed to start domain health monitoring:', error.message);
    }
  }
  
  /**
   * SSL証明書監視の開始
   */
  async startSSLMonitoring() {
    console.log('🔒 Starting SSL certificate monitoring...');
    
    // SSL監視は日次実行のため、初回チェックのみ実行
    try {
      console.log('🔍 Running initial SSL certificate check...');
      
      const result = execSync('node scripts/monitor-domain-health.mjs check', {
        encoding: 'utf8',
        timeout: 30000
      });
      
      const healthData = JSON.parse(result);
      
      // SSL証明書の状態をチェック
      Object.entries(healthData.checks || {}).forEach(([domain, check]) => {
        if (check.ssl && check.ssl.sslInfo) {
          const sslInfo = check.ssl.sslInfo;
          if (sslInfo.daysUntilExpiry !== undefined) {
            console.log(`🔒 ${domain}: SSL expires in ${sslInfo.daysUntilExpiry} days`);
            
            if (sslInfo.isExpiringSoon) {
              console.log(`⚠️  ${domain}: SSL certificate expires soon!`);
            }
          }
        }
      });
      
      console.log('✅ SSL certificate monitoring initialized');
    } catch (error) {
      console.error('❌ Failed to initialize SSL monitoring:', error.message);
    }
  }
  
  /**
   * パフォーマンス監視の開始
   */
  async startPerformanceMonitoring() {
    console.log('📊 Starting performance monitoring...');
    
    // パフォーマンス監視は定期的にメトリクスを収集
    const performanceInterval = setInterval(async () => {
      try {
        const startTime = Date.now();
        const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/health`, {
          signal: AbortSignal.timeout(10000)
        });
        const responseTime = Date.now() - startTime;
        
        const performanceData = {
          timestamp: new Date().toISOString(),
          responseTime,
          status: response.status,
          ok: response.ok,
        };
        
        // パフォーマンスデータをログに記録
        this.logPerformanceData(performanceData);
        
        // 閾値チェック
        const threshold = this.config.performance?.thresholds?.responseTime?.critical || 5000;
        if (responseTime > threshold) {
          console.log(`⚠️  Performance alert: Response time ${responseTime}ms exceeds threshold ${threshold}ms`);
        }
        
      } catch (error) {
        console.error('Performance monitoring error:', error.message);
      }
    }, 60000); // 1分間隔
    
    this.processes.set('performance-monitor', { kill: () => clearInterval(performanceInterval) });
    
    console.log('✅ Performance monitoring started');
  }
  
  /**
   * アラート管理システムの開始
   */
  async startAlertManager() {
    console.log('🚨 Starting alert management system...');
    
    // アラート管理システムは他のプロセスからの呼び出しで動作
    // テスト用にアラート送信機能を確認
    try {
      execSync('node scripts/alert-manager.mjs test', {
        stdio: 'inherit',
        timeout: 10000
      });
      
      console.log('✅ Alert management system ready');
    } catch (error) {
      console.error('❌ Alert management system test failed:', error.message);
    }
  }
  
  /**
   * 監視ダッシュボードの開始
   */
  async startDashboard() {
    console.log('📊 Starting monitoring dashboard...');
    
    // ダッシュボードはNext.jsアプリケーションの一部として動作
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/monitoring/domain-health?type=summary`, {
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        console.log('✅ Monitoring dashboard accessible');
      } else {
        console.log(`⚠️  Dashboard returned status ${response.status}`);
      }
    } catch (error) {
      console.log('⚠️  Dashboard not accessible:', error.message);
    }
  }
  
  /**
   * パフォーマンスデータのログ記録
   */
  logPerformanceData(data) {
    try {
      const logFile = 'performance-log.json';
      let logData = { entries: [] };
      
      if (existsSync(logFile)) {
        const existingData = readFileSync(logFile, 'utf8');
        logData = JSON.parse(existingData);
      }
      
      logData.entries.push(data);
      
      // 過去24時間のデータのみ保持
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      logData.entries = logData.entries.filter(entry => 
        new Date(entry.timestamp) > oneDayAgo
      );
      
      writeFileSync(logFile, JSON.stringify(logData, null, 2));
    } catch (error) {
      console.error('Failed to log performance data:', error.message);
    }
  }
  
  /**
   * メインループ
   */
  async mainLoop() {
    // 定期的なステータス報告
    const statusInterval = setInterval(() => {
      if (!this.isShuttingDown) {
        console.log(`📊 Monitoring Status: ${this.processes.size} services running`);
        
        // プロセスの健全性チェック
        this.processes.forEach((process, name) => {
          if (process.killed) {
            console.log(`⚠️  Service ${name} has stopped`);
          }
        });
      }
    }, 300000); // 5分間隔
    
    this.processes.set('status-reporter', { kill: () => clearInterval(statusInterval) });
    
    // プロセスが終了するまで待機
    return new Promise((resolve) => {
      process.on('exit', resolve);
    });
  }
  
  /**
   * 監視システムの停止
   */
  async shutdown(signal) {
    if (this.isShuttingDown) return;
    
    this.isShuttingDown = true;
    console.log(`\n🛑 Shutting down monitoring system (${signal})...`);
    
    // 全プロセスの停止
    for (const [name, process] of this.processes) {
      try {
        console.log(`   Stopping ${name}...`);
        if (process.kill) {
          process.kill();
        } else if (process.pid) {
          process.kill('SIGTERM');
        }
      } catch (error) {
        console.error(`   Failed to stop ${name}:`, error.message);
      }
    }
    
    console.log('✅ Monitoring system stopped');
    process.exit(0);
  }
  
  /**
   * 監視レポートの生成
   */
  async generateReport() {
    console.log('📊 Generating monitoring report...');
    
    try {
      // ドメインヘルス監視レポート
      execSync('node scripts/monitor-domain-health.mjs report', {
        stdio: 'inherit'
      });
      
      // アラート履歴レポート
      execSync('node scripts/alert-manager.mjs report', {
        stdio: 'inherit'
      });
      
      console.log('✅ Monitoring report generated');
    } catch (error) {
      console.error('❌ Failed to generate report:', error.message);
    }
  }
}

/**
 * メイン実行
 */
async function main() {
  const command = process.argv[2];
  const manager = new MonitoringManager();
  
  switch (command) {
    case 'start':
      await manager.startMonitoring();
      break;
      
    case 'report':
      await manager.generateReport();
      break;
      
    case 'test':
      console.log('🧪 Testing monitoring components...');
      
      // 各コンポーネントのテスト
      try {
        console.log('Testing domain health check...');
        execSync('node scripts/monitor-domain-health.mjs check', { stdio: 'inherit' });
        
        console.log('Testing alert manager...');
        execSync('node scripts/alert-manager.mjs test', { stdio: 'inherit' });
        
        console.log('✅ All tests passed');
      } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
      }
      break;
      
    default:
      console.log('Usage: node start-monitoring.mjs [start|report|test]');
      console.log('');
      console.log('Commands:');
      console.log('  start  - Start the monitoring system');
      console.log('  report - Generate monitoring reports');
      console.log('  test   - Test monitoring components');
      console.log('');
      console.log('Environment Variables:');
      console.log('  NEXT_PUBLIC_SITE_URL  - Site URL for monitoring');
      console.log('  ALERT_WEBHOOK_URL     - Webhook URL for alerts');
      console.log('  SLACK_WEBHOOK_URL     - Slack webhook URL');
      process.exit(1);
  }
}

// スクリプト直接実行時
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Monitoring system failed:', error);
    process.exit(1);
  });
}

export { MonitoringManager };