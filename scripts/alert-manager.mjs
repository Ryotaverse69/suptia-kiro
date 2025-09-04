#!/usr/bin/env node

/**
 * アラート管理システム
 * 各種通知チャネルへのアラート送信を管理
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * アラート設定
 */
const ALERT_CONFIG = {
  channels: {
    console: { enabled: true },
    webhook: { 
      enabled: process.env.ALERT_WEBHOOK_URL ? true : false,
      url: process.env.ALERT_WEBHOOK_URL,
    },
    email: {
      enabled: process.env.ALERT_EMAIL_ENABLED === 'true',
      smtp: {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      },
      from: process.env.ALERT_EMAIL_FROM,
      to: process.env.ALERT_EMAIL_TO?.split(',') || [],
    },
    slack: {
      enabled: process.env.SLACK_WEBHOOK_URL ? true : false,
      webhookUrl: process.env.SLACK_WEBHOOK_URL,
      channel: process.env.SLACK_CHANNEL || '#alerts',
    },
  },
  
  // アラート抑制設定
  suppression: {
    enabled: true,
    cooldownMinutes: 30, // 同じアラートを30分間抑制
    maxAlertsPerHour: 10, // 1時間あたり最大10件
  },
  
  // アラート重要度設定
  severity: {
    critical: {
      color: '#FF0000',
      emoji: '🔴',
      priority: 1,
    },
    warning: {
      color: '#FFA500',
      emoji: '🟡',
      priority: 2,
    },
    info: {
      color: '#0000FF',
      emoji: '🔵',
      priority: 3,
    },
  },
  
  alertHistoryFile: 'alert-history.json',
};

/**
 * アラート履歴管理
 */
class AlertHistory {
  constructor() {
    this.history = this.loadHistory();
  }
  
  loadHistory() {
    try {
      if (existsSync(ALERT_CONFIG.alertHistoryFile)) {
        const data = readFileSync(ALERT_CONFIG.alertHistoryFile, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.warn('Failed to load alert history:', error.message);
    }
    return { alerts: [], suppressions: {} };
  }
  
  saveHistory() {
    try {
      // 過去24時間のデータのみ保持
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      this.history.alerts = this.history.alerts.filter(alert => 
        new Date(alert.timestamp) > oneDayAgo
      );
      
      // 期限切れの抑制設定を削除
      Object.keys(this.history.suppressions).forEach(key => {
        if (new Date(this.history.suppressions[key].expiresAt) < new Date()) {
          delete this.history.suppressions[key];
        }
      });
      
      writeFileSync(ALERT_CONFIG.alertHistoryFile, JSON.stringify(this.history, null, 2));
    } catch (error) {
      console.error('Failed to save alert history:', error.message);
    }
  }
  
  addAlert(alert) {
    this.history.alerts.push({
      ...alert,
      id: this.generateAlertId(alert),
      timestamp: new Date().toISOString(),
    });
    this.saveHistory();
  }
  
  generateAlertId(alert) {
    return `${alert.type}_${alert.domain || 'global'}_${Date.now()}`;
  }
  
  shouldSuppressAlert(alert) {
    if (!ALERT_CONFIG.suppression.enabled) return false;
    
    const suppressionKey = `${alert.type}_${alert.domain || 'global'}`;
    const suppression = this.history.suppressions[suppressionKey];
    
    if (suppression && new Date(suppression.expiresAt) > new Date()) {
      return true;
    }
    
    // 1時間あたりのアラート数制限
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentAlerts = this.history.alerts.filter(a => 
      new Date(a.timestamp) > oneHourAgo
    );
    
    if (recentAlerts.length >= ALERT_CONFIG.suppression.maxAlertsPerHour) {
      return true;
    }
    
    return false;
  }
  
  suppressAlert(alert) {
    const suppressionKey = `${alert.type}_${alert.domain || 'global'}`;
    const expiresAt = new Date(Date.now() + ALERT_CONFIG.suppression.cooldownMinutes * 60 * 1000);
    
    this.history.suppressions[suppressionKey] = {
      alertType: alert.type,
      domain: alert.domain,
      suppressedAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
    };
    
    this.saveHistory();
  }
}

/**
 * コンソール通知
 */
async function sendConsoleAlert(alert) {
  const severity = ALERT_CONFIG.severity[alert.severity] || ALERT_CONFIG.severity.info;
  const timestamp = new Date().toISOString();
  
  console.log(`${severity.emoji} [${alert.severity.toUpperCase()}] ${timestamp}`);
  console.log(`   Type: ${alert.type}`);
  console.log(`   Message: ${alert.message}`);
  
  if (alert.domain) {
    console.log(`   Domain: ${alert.domain}`);
  }
  
  if (alert.details) {
    console.log(`   Details: ${JSON.stringify(alert.details, null, 2)}`);
  }
  
  console.log('');
}

/**
 * Webhook通知
 */
async function sendWebhookAlert(alert) {
  if (!ALERT_CONFIG.channels.webhook.enabled) return;
  
  try {
    const payload = {
      timestamp: new Date().toISOString(),
      severity: alert.severity,
      type: alert.type,
      message: alert.message,
      domain: alert.domain,
      details: alert.details,
      source: 'suptia-domain-monitor',
    };
    
    const response = await fetch(ALERT_CONFIG.channels.webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });
    
    if (!response.ok) {
      throw new Error(`Webhook returned ${response.status}: ${response.statusText}`);
    }
    
    console.log('✅ Webhook alert sent successfully');
  } catch (error) {
    console.error('❌ Failed to send webhook alert:', error.message);
  }
}

/**
 * Slack通知
 */
async function sendSlackAlert(alert) {
  if (!ALERT_CONFIG.channels.slack.enabled) return;
  
  try {
    const severity = ALERT_CONFIG.severity[alert.severity] || ALERT_CONFIG.severity.info;
    
    const payload = {
      channel: ALERT_CONFIG.channels.slack.channel,
      username: 'Domain Monitor',
      icon_emoji: ':warning:',
      attachments: [
        {
          color: severity.color,
          title: `${severity.emoji} ${alert.type.toUpperCase()} Alert`,
          text: alert.message,
          fields: [
            {
              title: 'Severity',
              value: alert.severity.toUpperCase(),
              short: true,
            },
            {
              title: 'Domain',
              value: alert.domain || 'N/A',
              short: true,
            },
            {
              title: 'Timestamp',
              value: new Date().toISOString(),
              short: false,
            },
          ],
          footer: 'Suptia Domain Monitor',
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };
    
    if (alert.details) {
      payload.attachments[0].fields.push({
        title: 'Details',
        value: JSON.stringify(alert.details, null, 2),
        short: false,
      });
    }
    
    const response = await fetch(ALERT_CONFIG.channels.slack.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });
    
    if (!response.ok) {
      throw new Error(`Slack webhook returned ${response.status}: ${response.statusText}`);
    }
    
    console.log('✅ Slack alert sent successfully');
  } catch (error) {
    console.error('❌ Failed to send Slack alert:', error.message);
  }
}

/**
 * メール通知
 */
async function sendEmailAlert(alert) {
  if (!ALERT_CONFIG.channels.email.enabled) return;
  
  try {
    // Node.js環境でのメール送信（nodemailerが必要）
    console.log('📧 Email alert would be sent in production environment');
    console.log(`   To: ${ALERT_CONFIG.channels.email.to.join(', ')}`);
    console.log(`   Subject: [${alert.severity.toUpperCase()}] ${alert.type} - ${alert.domain || 'Domain Monitor'}`);
    console.log(`   Message: ${alert.message}`);
    
    // 実際のメール送信実装は本番環境で有効化
    /*
    const nodemailer = await import('nodemailer');
    
    const transporter = nodemailer.createTransporter(ALERT_CONFIG.channels.email.smtp);
    
    const mailOptions = {
      from: ALERT_CONFIG.channels.email.from,
      to: ALERT_CONFIG.channels.email.to.join(', '),
      subject: `[${alert.severity.toUpperCase()}] ${alert.type} - ${alert.domain || 'Domain Monitor'}`,
      html: generateEmailHTML(alert),
    };
    
    await transporter.sendMail(mailOptions);
    console.log('✅ Email alert sent successfully');
    */
  } catch (error) {
    console.error('❌ Failed to send email alert:', error.message);
  }
}

/**
 * メールHTML生成
 */
function generateEmailHTML(alert) {
  const severity = ALERT_CONFIG.severity[alert.severity] || ALERT_CONFIG.severity.info;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Domain Monitor Alert</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .alert { border-left: 4px solid ${severity.color}; padding: 15px; background: #f9f9f9; }
        .severity { color: ${severity.color}; font-weight: bold; }
        .details { background: #f0f0f0; padding: 10px; margin: 10px 0; border-radius: 4px; }
        .timestamp { color: #666; font-size: 0.9em; }
      </style>
    </head>
    <body>
      <div class="alert">
        <h2>${severity.emoji} Domain Monitor Alert</h2>
        <p><strong>Severity:</strong> <span class="severity">${alert.severity.toUpperCase()}</span></p>
        <p><strong>Type:</strong> ${alert.type}</p>
        <p><strong>Domain:</strong> ${alert.domain || 'N/A'}</p>
        <p><strong>Message:</strong> ${alert.message}</p>
        
        ${alert.details ? `
          <div class="details">
            <strong>Details:</strong>
            <pre>${JSON.stringify(alert.details, null, 2)}</pre>
          </div>
        ` : ''}
        
        <p class="timestamp">Alert generated at: ${new Date().toISOString()}</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * アラート送信メイン関数
 */
async function sendAlert(alert) {
  const history = new AlertHistory();
  
  // アラート抑制チェック
  if (history.shouldSuppressAlert(alert)) {
    console.log(`🔇 Alert suppressed: ${alert.type} for ${alert.domain || 'global'}`);
    return;
  }
  
  // アラート履歴に追加
  history.addAlert(alert);
  
  // 抑制設定を追加
  history.suppressAlert(alert);
  
  // 各チャネルに送信
  const sendPromises = [];
  
  if (ALERT_CONFIG.channels.console.enabled) {
    sendPromises.push(sendConsoleAlert(alert));
  }
  
  if (ALERT_CONFIG.channels.webhook.enabled) {
    sendPromises.push(sendWebhookAlert(alert));
  }
  
  if (ALERT_CONFIG.channels.slack.enabled) {
    sendPromises.push(sendSlackAlert(alert));
  }
  
  if (ALERT_CONFIG.channels.email.enabled) {
    sendPromises.push(sendEmailAlert(alert));
  }
  
  // 並列送信
  await Promise.allSettled(sendPromises);
}

/**
 * 複数アラートの一括送信
 */
async function sendAlerts(alerts) {
  if (!Array.isArray(alerts) || alerts.length === 0) return;
  
  console.log(`📢 Sending ${alerts.length} alerts...`);
  
  for (const alert of alerts) {
    await sendAlert(alert);
  }
  
  console.log('✅ All alerts processed');
}

/**
 * アラート履歴レポート生成
 */
function generateAlertReport() {
  const history = new AlertHistory();
  
  if (history.history.alerts.length === 0) {
    console.log('📊 No alert history available');
    return;
  }
  
  console.log('📊 Alert History Report');
  console.log('======================');
  console.log(`Report generated: ${new Date().toISOString()}`);
  console.log(`Total alerts: ${history.history.alerts.length}`);
  console.log('');
  
  // 重要度別統計
  const severityStats = {};
  history.history.alerts.forEach(alert => {
    severityStats[alert.severity] = (severityStats[alert.severity] || 0) + 1;
  });
  
  console.log('📈 Alerts by Severity:');
  Object.entries(severityStats).forEach(([severity, count]) => {
    const config = ALERT_CONFIG.severity[severity] || ALERT_CONFIG.severity.info;
    console.log(`   ${config.emoji} ${severity}: ${count}`);
  });
  console.log('');
  
  // タイプ別統計
  const typeStats = {};
  history.history.alerts.forEach(alert => {
    typeStats[alert.type] = (typeStats[alert.type] || 0) + 1;
  });
  
  console.log('📋 Alerts by Type:');
  Object.entries(typeStats).forEach(([type, count]) => {
    console.log(`   • ${type}: ${count}`);
  });
  console.log('');
  
  // 最近のアラート
  const recentAlerts = history.history.alerts
    .filter(alert => new Date(alert.timestamp) > new Date(Date.now() - 60 * 60 * 1000))
    .slice(-5);
  
  if (recentAlerts.length > 0) {
    console.log('🕐 Recent Alerts (last hour):');
    recentAlerts.forEach(alert => {
      const config = ALERT_CONFIG.severity[alert.severity] || ALERT_CONFIG.severity.info;
      console.log(`   ${config.emoji} ${alert.timestamp}: ${alert.type} - ${alert.message}`);
    });
  } else {
    console.log('✅ No recent alerts');
  }
}

/**
 * テストアラート送信
 */
async function sendTestAlert() {
  const testAlert = {
    type: 'test_alert',
    severity: 'info',
    message: 'This is a test alert from the domain monitoring system',
    domain: 'suptia.com',
    details: {
      test: true,
      timestamp: new Date().toISOString(),
    },
  };
  
  console.log('🧪 Sending test alert...');
  await sendAlert(testAlert);
  console.log('✅ Test alert sent');
}

/**
 * メイン実行
 */
async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'test':
      await sendTestAlert();
      break;
      
    case 'report':
      generateAlertReport();
      break;
      
    case 'send':
      // JSON形式のアラートを標準入力から受け取って送信
      const input = process.argv[3];
      if (input) {
        try {
          const alert = JSON.parse(input);
          await sendAlert(alert);
        } catch (error) {
          console.error('Invalid JSON input:', error.message);
          process.exit(1);
        }
      } else {
        console.error('Usage: node alert-manager.mjs send \'{"type":"test","severity":"info","message":"test"}\'');
        process.exit(1);
      }
      break;
      
    default:
      console.log('Usage: node alert-manager.mjs [test|report|send]');
      console.log('');
      console.log('Commands:');
      console.log('  test   - Send a test alert');
      console.log('  report - Generate alert history report');
      console.log('  send   - Send alert from JSON input');
      console.log('');
      console.log('Environment Variables:');
      console.log('  ALERT_WEBHOOK_URL     - Webhook URL for alerts');
      console.log('  SLACK_WEBHOOK_URL     - Slack webhook URL');
      console.log('  SLACK_CHANNEL         - Slack channel (default: #alerts)');
      console.log('  ALERT_EMAIL_ENABLED   - Enable email alerts (true/false)');
      console.log('  SMTP_HOST             - SMTP server host');
      console.log('  SMTP_PORT             - SMTP server port');
      console.log('  SMTP_USER             - SMTP username');
      console.log('  SMTP_PASS             - SMTP password');
      console.log('  ALERT_EMAIL_FROM      - From email address');
      console.log('  ALERT_EMAIL_TO        - To email addresses (comma-separated)');
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
  sendAlert,
  sendAlerts,
  generateAlertReport,
  sendTestAlert,
  AlertHistory,
  ALERT_CONFIG,
};