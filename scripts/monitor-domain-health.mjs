#!/usr/bin/env node

/**
 * ドメインヘルス継続監視スクリプト
 * SSL証明書期限、DNS解決、リダイレクト成功率を監視
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * 監視設定
 */
const MONITORING_CONFIG = {
  domains: ['suptia.com', 'www.suptia.com'],
  legacyDomains: ['suptia-kiro.vercel.app'],
  checkInterval: 5 * 60 * 1000, // 5分間隔
  alertThresholds: {
    sslExpiryDays: 30, // SSL証明書期限30日前にアラート
    responseTime: 5000, // 5秒以上でアラート
    errorRate: 0.1, // エラー率10%以上でアラート
    consecutiveFailures: 3, // 連続3回失敗でアラート
  },
  logFile: 'domain-health-log.json',
  alertFile: 'domain-alerts.json',
};

/**
 * ドメインヘルスチェック結果の型定義
 */
class DomainHealthResult {
  constructor() {
    this.timestamp = new Date().toISOString();
    this.checks = {};
    this.alerts = [];
    this.summary = {
      healthy: 0,
      warning: 0,
      critical: 0,
      total: 0,
    };
  }
}

/**
 * SSL証明書情報の取得
 */
async function checkSSLCertificate(domain) {
  try {
    const startTime = Date.now();
    
    // HTTPSリクエストでSSL証明書の有効性を確認
    const response = await fetch(`https://${domain}`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(10000),
    });
    
    const responseTime = Date.now() - startTime;
    
    // SSL証明書の詳細情報を取得（Node.js環境での実装）
    const sslInfo = await getSSLCertificateInfo(domain);
    
    return {
      domain,
      status: response.ok ? 'healthy' : 'warning',
      accessible: response.ok,
      responseTime,
      httpStatus: response.status,
      sslInfo,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      domain,
      status: 'critical',
      accessible: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * SSL証明書の詳細情報取得
 */
async function getSSLCertificateInfo(domain) {
  try {
    const { execSync } = await import('child_process');
    
    // OpenSSLコマンドでSSL証明書情報を取得
    const command = `echo | openssl s_client -servername ${domain} -connect ${domain}:443 2>/dev/null | openssl x509 -noout -dates -subject -issuer`;
    const output = execSync(command, { encoding: 'utf8', timeout: 10000 });
    
    const lines = output.split('\n');
    const info = {};
    
    lines.forEach(line => {
      if (line.startsWith('notBefore=')) {
        info.notBefore = new Date(line.replace('notBefore=', ''));
      } else if (line.startsWith('notAfter=')) {
        info.notAfter = new Date(line.replace('notAfter=', ''));
      } else if (line.startsWith('subject=')) {
        info.subject = line.replace('subject=', '');
      } else if (line.startsWith('issuer=')) {
        info.issuer = line.replace('issuer=', '');
      }
    });
    
    // 期限までの日数を計算
    if (info.notAfter) {
      const daysUntilExpiry = Math.ceil((info.notAfter - new Date()) / (1000 * 60 * 60 * 24));
      info.daysUntilExpiry = daysUntilExpiry;
      info.isExpiringSoon = daysUntilExpiry <= MONITORING_CONFIG.alertThresholds.sslExpiryDays;
    }
    
    return info;
  } catch (error) {
    return {
      error: error.message,
      available: false,
    };
  }
}

/**
 * DNS解決チェック
 */
async function checkDNSResolution(domain) {
  try {
    const startTime = Date.now();
    
    // DNS解決テスト（HTTPリクエストで間接的に確認）
    const response = await fetch(`https://${domain}`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000),
    });
    
    const responseTime = Date.now() - startTime;
    
    return {
      domain,
      status: 'healthy',
      resolved: true,
      responseTime,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      domain,
      status: 'critical',
      resolved: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * リダイレクトチェック
 */
async function checkRedirects() {
  const redirectTests = [
    {
      from: 'https://www.suptia.com',
      to: 'https://suptia.com',
      description: 'WWW to apex domain redirect',
    },
    {
      from: 'http://suptia.com',
      to: 'https://suptia.com',
      description: 'HTTP to HTTPS redirect',
    },
    {
      from: 'http://www.suptia.com',
      to: 'https://suptia.com',
      description: 'HTTP WWW to HTTPS apex redirect',
    },
  ];
  
  const results = [];
  
  for (const test of redirectTests) {
    try {
      const startTime = Date.now();
      
      const response = await fetch(test.from, {
        method: 'HEAD',
        redirect: 'manual',
        signal: AbortSignal.timeout(10000),
      });
      
      const responseTime = Date.now() - startTime;
      const location = response.headers.get('location');
      
      const isCorrectRedirect = response.status >= 300 && response.status < 400 && 
                               location && location.startsWith(test.to);
      
      results.push({
        ...test,
        status: isCorrectRedirect ? 'healthy' : 'warning',
        httpStatus: response.status,
        location,
        responseTime,
        success: isCorrectRedirect,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      results.push({
        ...test,
        status: 'critical',
        error: error.message,
        success: false,
        timestamp: new Date().toISOString(),
      });
    }
  }
  
  return results;
}

/**
 * パフォーマンスメトリクス取得
 */
async function checkPerformanceMetrics(domain) {
  try {
    const startTime = Date.now();
    
    const response = await fetch(`https://${domain}/api/health`, {
      signal: AbortSignal.timeout(15000),
    });
    
    const responseTime = Date.now() - startTime;
    const healthData = await response.json();
    
    return {
      domain,
      status: responseTime <= MONITORING_CONFIG.alertThresholds.responseTime ? 'healthy' : 'warning',
      responseTime,
      healthCheck: healthData,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      domain,
      status: 'critical',
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 監視履歴の読み込み
 */
function loadMonitoringHistory() {
  try {
    if (existsSync(MONITORING_CONFIG.logFile)) {
      const data = readFileSync(MONITORING_CONFIG.logFile, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.warn('Failed to load monitoring history:', error.message);
  }
  return { checks: [], alerts: [] };
}

/**
 * 監視履歴の保存
 */
function saveMonitoringHistory(history) {
  try {
    // 過去24時間のデータのみ保持
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    history.checks = history.checks.filter(check => 
      new Date(check.timestamp) > oneDayAgo
    );
    history.alerts = history.alerts.filter(alert => 
      new Date(alert.timestamp) > oneDayAgo
    );
    
    writeFileSync(MONITORING_CONFIG.logFile, JSON.stringify(history, null, 2));
  } catch (error) {
    console.error('Failed to save monitoring history:', error.message);
  }
}

/**
 * アラート生成
 */
function generateAlerts(currentCheck, history) {
  const alerts = [];
  
  // SSL証明書期限アラート
  Object.values(currentCheck.checks).forEach(check => {
    if (check.sslInfo && check.sslInfo.isExpiringSoon) {
      alerts.push({
        type: 'ssl_expiry',
        severity: 'warning',
        domain: check.domain,
        message: `SSL certificate for ${check.domain} expires in ${check.sslInfo.daysUntilExpiry} days`,
        daysUntilExpiry: check.sslInfo.daysUntilExpiry,
        timestamp: new Date().toISOString(),
      });
    }
  });
  
  // 連続失敗アラート
  const recentChecks = history.checks.slice(-MONITORING_CONFIG.alertThresholds.consecutiveFailures);
  MONITORING_CONFIG.domains.forEach(domain => {
    const domainChecks = recentChecks.map(check => check.checks[domain]).filter(Boolean);
    
    if (domainChecks.length >= MONITORING_CONFIG.alertThresholds.consecutiveFailures) {
      const allFailed = domainChecks.every(check => check.status === 'critical');
      
      if (allFailed) {
        alerts.push({
          type: 'consecutive_failures',
          severity: 'critical',
          domain,
          message: `${domain} has failed ${MONITORING_CONFIG.alertThresholds.consecutiveFailures} consecutive health checks`,
          failureCount: domainChecks.length,
          timestamp: new Date().toISOString(),
        });
      }
    }
  });
  
  // レスポンス時間アラート
  Object.values(currentCheck.checks).forEach(check => {
    if (check.responseTime && check.responseTime > MONITORING_CONFIG.alertThresholds.responseTime) {
      alerts.push({
        type: 'slow_response',
        severity: 'warning',
        domain: check.domain,
        message: `${check.domain} response time (${check.responseTime}ms) exceeds threshold (${MONITORING_CONFIG.alertThresholds.responseTime}ms)`,
        responseTime: check.responseTime,
        threshold: MONITORING_CONFIG.alertThresholds.responseTime,
        timestamp: new Date().toISOString(),
      });
    }
  });
  
  return alerts;
}

/**
 * アラート通知
 */
async function sendAlerts(alerts) {
  if (alerts.length === 0) return;
  
  console.log(`🚨 ${alerts.length} alerts generated:`);
  
  alerts.forEach(alert => {
    const severityIcon = alert.severity === 'critical' ? '🔴' : '🟡';
    console.log(`${severityIcon} [${alert.severity.toUpperCase()}] ${alert.type}: ${alert.message}`);
  });
  
  // アラートファイルに保存
  try {
    const existingAlerts = existsSync(MONITORING_CONFIG.alertFile) ? 
      JSON.parse(readFileSync(MONITORING_CONFIG.alertFile, 'utf8')) : [];
    
    const updatedAlerts = [...existingAlerts, ...alerts];
    
    // 過去24時間のアラートのみ保持
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const filteredAlerts = updatedAlerts.filter(alert => 
      new Date(alert.timestamp) > oneDayAgo
    );
    
    writeFileSync(MONITORING_CONFIG.alertFile, JSON.stringify(filteredAlerts, null, 2));
  } catch (error) {
    console.error('Failed to save alerts:', error.message);
  }
  
  // 本番環境では外部通知システムに送信
  if (process.env.NODE_ENV === 'production') {
    // TODO: Slack、メール、Webhookなどの通知実装
    console.log('📧 Alerts would be sent to notification channels in production');
  }
}

/**
 * 単一のヘルスチェック実行
 */
async function runSingleHealthCheck() {
  console.log('🏥 Running domain health check...');
  
  const result = new DomainHealthResult();
  
  // 各ドメインのSSL証明書とDNSチェック
  for (const domain of MONITORING_CONFIG.domains) {
    console.log(`  Checking ${domain}...`);
    
    const [sslCheck, dnsCheck, perfCheck] = await Promise.all([
      checkSSLCertificate(domain),
      checkDNSResolution(domain),
      checkPerformanceMetrics(domain),
    ]);
    
    result.checks[domain] = {
      ssl: sslCheck,
      dns: dnsCheck,
      performance: perfCheck,
      status: [sslCheck.status, dnsCheck.status, perfCheck.status].includes('critical') ? 'critical' :
              [sslCheck.status, dnsCheck.status, perfCheck.status].includes('warning') ? 'warning' : 'healthy',
    };
  }
  
  // リダイレクトチェック
  console.log('  Checking redirects...');
  result.checks.redirects = await checkRedirects();
  
  // サマリー計算
  const allChecks = Object.values(result.checks).flat();
  result.summary.total = allChecks.length;
  result.summary.healthy = allChecks.filter(check => check.status === 'healthy').length;
  result.summary.warning = allChecks.filter(check => check.status === 'warning').length;
  result.summary.critical = allChecks.filter(check => check.status === 'critical').length;
  
  return result;
}

/**
 * 継続監視の開始
 */
async function startContinuousMonitoring() {
  console.log('🔄 Starting continuous domain health monitoring...');
  console.log(`   Check interval: ${MONITORING_CONFIG.checkInterval / 1000}s`);
  console.log(`   Monitoring domains: ${MONITORING_CONFIG.domains.join(', ')}`);
  
  const history = loadMonitoringHistory();
  
  const runCheck = async () => {
    try {
      const checkResult = await runSingleHealthCheck();
      
      // 履歴に追加
      history.checks.push(checkResult);
      
      // アラート生成
      const alerts = generateAlerts(checkResult, history);
      checkResult.alerts = alerts;
      
      if (alerts.length > 0) {
        history.alerts.push(...alerts);
        await sendAlerts(alerts);
      }
      
      // 履歴保存
      saveMonitoringHistory(history);
      
      // 結果表示
      const statusIcon = checkResult.summary.critical > 0 ? '🔴' : 
                        checkResult.summary.warning > 0 ? '🟡' : '🟢';
      
      console.log(`${statusIcon} Health check completed: ${checkResult.summary.healthy}/${checkResult.summary.total} healthy`);
      
      if (checkResult.summary.critical > 0 || checkResult.summary.warning > 0) {
        console.log(`   Issues: ${checkResult.summary.warning} warnings, ${checkResult.summary.critical} critical`);
      }
      
    } catch (error) {
      console.error('❌ Health check failed:', error.message);
    }
  };
  
  // 初回実行
  await runCheck();
  
  // 定期実行
  setInterval(runCheck, MONITORING_CONFIG.checkInterval);
  
  console.log('✅ Continuous monitoring started');
}

/**
 * 監視レポート生成
 */
function generateMonitoringReport() {
  try {
    const history = loadMonitoringHistory();
    
    if (history.checks.length === 0) {
      console.log('📊 No monitoring data available');
      return;
    }
    
    const latestCheck = history.checks[history.checks.length - 1];
    const recentAlerts = history.alerts.filter(alert => 
      new Date(alert.timestamp) > new Date(Date.now() - 60 * 60 * 1000) // 過去1時間
    );
    
    console.log('📊 Domain Health Monitoring Report');
    console.log('=====================================');
    console.log(`Report generated: ${new Date().toISOString()}`);
    console.log(`Data period: ${history.checks.length} checks over ${Math.round((new Date(latestCheck.timestamp) - new Date(history.checks[0].timestamp)) / (1000 * 60 * 60))} hours`);
    console.log('');
    
    // 最新状態
    console.log('🔍 Current Status:');
    Object.entries(latestCheck.checks).forEach(([domain, check]) => {
      if (typeof check === 'object' && check.status) {
        const statusIcon = check.status === 'healthy' ? '✅' : 
                          check.status === 'warning' ? '⚠️' : '❌';
        console.log(`   ${statusIcon} ${domain}: ${check.status}`);
      }
    });
    console.log('');
    
    // 最近のアラート
    if (recentAlerts.length > 0) {
      console.log('🚨 Recent Alerts (last hour):');
      recentAlerts.forEach(alert => {
        const severityIcon = alert.severity === 'critical' ? '🔴' : '🟡';
        console.log(`   ${severityIcon} ${alert.type}: ${alert.message}`);
      });
    } else {
      console.log('✅ No recent alerts');
    }
    console.log('');
    
    // 統計情報
    const totalChecks = history.checks.length;
    const healthyChecks = history.checks.filter(check => 
      check.summary.critical === 0 && check.summary.warning === 0
    ).length;
    const uptime = ((healthyChecks / totalChecks) * 100).toFixed(2);
    
    console.log('📈 Statistics:');
    console.log(`   Uptime: ${uptime}% (${healthyChecks}/${totalChecks} healthy checks)`);
    console.log(`   Total alerts: ${history.alerts.length}`);
    console.log(`   Critical alerts: ${history.alerts.filter(a => a.severity === 'critical').length}`);
    console.log(`   Warning alerts: ${history.alerts.filter(a => a.severity === 'warning').length}`);
    
  } catch (error) {
    console.error('Failed to generate monitoring report:', error.message);
  }
}

/**
 * メイン実行
 */
async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'check':
      await runSingleHealthCheck().then(result => {
        console.log(JSON.stringify(result, null, 2));
      });
      break;
      
    case 'monitor':
      await startContinuousMonitoring();
      break;
      
    case 'report':
      generateMonitoringReport();
      break;
      
    default:
      console.log('Usage: node monitor-domain-health.mjs [check|monitor|report]');
      console.log('');
      console.log('Commands:');
      console.log('  check   - Run a single health check');
      console.log('  monitor - Start continuous monitoring');
      console.log('  report  - Generate monitoring report');
      process.exit(1);
  }
}

// スクリプト直接実行時
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}

export {
  checkSSLCertificate,
  checkDNSResolution,
  checkRedirects,
  checkPerformanceMetrics,
  runSingleHealthCheck,
  startContinuousMonitoring,
  generateMonitoringReport,
  MONITORING_CONFIG,
};