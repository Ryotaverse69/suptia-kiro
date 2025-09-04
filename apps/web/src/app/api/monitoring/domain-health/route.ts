/**
 * ドメインヘルス監視API
 * 監視データの取得とリアルタイム状態確認
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * 監視データファイルのパス
 */
const MONITORING_FILES = {
  healthLog: 'domain-health-log.json',
  alerts: 'domain-alerts.json',
  alertHistory: 'alert-history.json',
};

/**
 * 監視データの読み込み
 */
function loadMonitoringData(filename: string) {
  try {
    const filePath = join(process.cwd(), filename);
    if (existsSync(filePath)) {
      const data = readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.warn(`Failed to load monitoring data from ${filename}:`, error);
  }
  return null;
}

/**
 * 現在のドメインヘルス状態を取得
 */
async function getCurrentDomainHealth() {
  try {
    // ヘルスチェックAPIから最新データを取得
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/health`, {
      signal: AbortSignal.timeout(5000),
    });
    
    if (response.ok) {
      return await response.json();
    } else {
      throw new Error(`Health API returned ${response.status}`);
    }
  } catch (error) {
    return {
      status: 'error',
      message: `Failed to fetch current health: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 監視統計の計算
 */
function calculateMonitoringStats(healthLog: any, alerts: any) {
  const stats = {
    uptime: {
      percentage: 0,
      totalChecks: 0,
      healthyChecks: 0,
    },
    performance: {
      averageResponseTime: 0,
      maxResponseTime: 0,
      minResponseTime: Infinity,
    },
    alerts: {
      total: 0,
      critical: 0,
      warning: 0,
      info: 0,
      last24Hours: 0,
    },
    domains: {} as Record<string, any>,
  };
  
  if (healthLog && healthLog.checks) {
    const checks = healthLog.checks;
    stats.uptime.totalChecks = checks.length;
    
    // アップタイム計算
    const healthyChecks = checks.filter((check: any) => 
      check.summary && check.summary.critical === 0
    );
    stats.uptime.healthyChecks = healthyChecks.length;
    stats.uptime.percentage = checks.length > 0 ? 
      (healthyChecks.length / checks.length) * 100 : 0;
    
    // パフォーマンス統計
    const responseTimes: number[] = [];
    checks.forEach((check: any) => {
      Object.values(check.checks || {}).forEach((domainCheck: any) => {
        if (domainCheck && typeof domainCheck === 'object' && domainCheck.performance) {
          const responseTime = domainCheck.performance.responseTime;
          if (typeof responseTime === 'number') {
            responseTimes.push(responseTime);
          }
        }
      });
    });
    
    if (responseTimes.length > 0) {
      stats.performance.averageResponseTime = 
        responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
      stats.performance.maxResponseTime = Math.max(...responseTimes);
      stats.performance.minResponseTime = Math.min(...responseTimes);
    }
    
    // ドメイン別統計
    const domainStats: Record<string, any> = {};
    checks.forEach((check: any) => {
      Object.entries(check.checks || {}).forEach(([domain, domainCheck]: [string, any]) => {
        if (typeof domainCheck === 'object' && domainCheck.status) {
          if (!domainStats[domain]) {
            domainStats[domain] = {
              totalChecks: 0,
              healthyChecks: 0,
              warningChecks: 0,
              criticalChecks: 0,
            };
          }
          
          domainStats[domain].totalChecks++;
          
          if (domainCheck.status === 'healthy') {
            domainStats[domain].healthyChecks++;
          } else if (domainCheck.status === 'warning') {
            domainStats[domain].warningChecks++;
          } else if (domainCheck.status === 'critical') {
            domainStats[domain].criticalChecks++;
          }
        }
      });
    });
    
    // ドメイン別アップタイム計算
    Object.entries(domainStats).forEach(([domain, data]: [string, any]) => {
      stats.domains[domain] = {
        ...data,
        uptime: data.totalChecks > 0 ? (data.healthyChecks / data.totalChecks) * 100 : 0,
      };
    });
  }
  
  // アラート統計
  if (alerts) {
    const allAlerts = Array.isArray(alerts) ? alerts : [];
    stats.alerts.total = allAlerts.length;
    
    allAlerts.forEach((alert: any) => {
      if (alert.severity === 'critical') stats.alerts.critical++;
      else if (alert.severity === 'warning') stats.alerts.warning++;
      else stats.alerts.info++;
    });
    
    // 過去24時間のアラート
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    stats.alerts.last24Hours = allAlerts.filter((alert: any) => 
      new Date(alert.timestamp) > oneDayAgo
    ).length;
  }
  
  return stats;
}

/**
 * GET: 監視データの取得
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'summary';
    
    switch (type) {
      case 'current':
        // 現在のヘルス状態
        const currentHealth = await getCurrentDomainHealth();
        return NextResponse.json({
          status: 'success',
          data: currentHealth,
          timestamp: new Date().toISOString(),
        });
        
      case 'history':
        // 監視履歴
        const healthLog = loadMonitoringData(MONITORING_FILES.healthLog);
        return NextResponse.json({
          status: 'success',
          data: healthLog || { checks: [], alerts: [] },
          timestamp: new Date().toISOString(),
        });
        
      case 'alerts':
        // アラート履歴
        const alerts = loadMonitoringData(MONITORING_FILES.alerts);
        const alertHistory = loadMonitoringData(MONITORING_FILES.alertHistory);
        
        return NextResponse.json({
          status: 'success',
          data: {
            current: alerts || [],
            history: alertHistory || { alerts: [], suppressions: {} },
          },
          timestamp: new Date().toISOString(),
        });
        
      case 'stats':
        // 統計情報
        const statsHealthLog = loadMonitoringData(MONITORING_FILES.healthLog);
        const statsAlerts = loadMonitoringData(MONITORING_FILES.alerts);
        const stats = calculateMonitoringStats(statsHealthLog, statsAlerts);
        
        return NextResponse.json({
          status: 'success',
          data: stats,
          timestamp: new Date().toISOString(),
        });
        
      case 'summary':
      default:
        // サマリー情報（デフォルト）
        const [summaryHealth, summaryHealthLog, summaryAlerts] = await Promise.all([
          getCurrentDomainHealth(),
          loadMonitoringData(MONITORING_FILES.healthLog),
          loadMonitoringData(MONITORING_FILES.alerts),
        ]);
        
        const summaryStats = calculateMonitoringStats(summaryHealthLog, summaryAlerts);
        
        return NextResponse.json({
          status: 'success',
          data: {
            current: summaryHealth,
            stats: summaryStats,
            lastUpdate: new Date().toISOString(),
          },
          timestamp: new Date().toISOString(),
        });
    }
  } catch (error) {
    console.error('Domain health API error:', error);
    
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

/**
 * POST: 手動ヘルスチェック実行
 */
export async function POST(request: NextRequest) {
  try {
    // 認証チェック（簡易版）
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        status: 'error',
        message: 'Unauthorized',
      }, { status: 401 });
    }
    
    const token = authHeader.substring(7);
    if (token !== process.env.MONITORING_API_TOKEN) {
      return NextResponse.json({
        status: 'error',
        message: 'Invalid token',
      }, { status: 403 });
    }
    
    const body = await request.json();
    const action = body.action;
    
    switch (action) {
      case 'run_check':
        // 手動ヘルスチェック実行
        try {
          const { execSync } = await import('child_process');
          const result = execSync('node scripts/monitor-domain-health.mjs check', {
            encoding: 'utf8',
            timeout: 30000,
          });
          
          return NextResponse.json({
            status: 'success',
            message: 'Health check executed successfully',
            result: JSON.parse(result),
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          return NextResponse.json({
            status: 'error',
            message: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            timestamp: new Date().toISOString(),
          }, { status: 500 });
        }
        
      case 'clear_alerts':
        // アラート履歴クリア
        try {
          const { writeFileSync } = await import('fs');
          writeFileSync(MONITORING_FILES.alerts, JSON.stringify([], null, 2));
          writeFileSync(MONITORING_FILES.alertHistory, JSON.stringify({ alerts: [], suppressions: {} }, null, 2));
          
          return NextResponse.json({
            status: 'success',
            message: 'Alert history cleared',
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          return NextResponse.json({
            status: 'error',
            message: `Failed to clear alerts: ${error instanceof Error ? error.message : 'Unknown error'}`,
            timestamp: new Date().toISOString(),
          }, { status: 500 });
        }
        
      default:
        return NextResponse.json({
          status: 'error',
          message: 'Invalid action',
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Domain health POST API error:', error);
    
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}