#!/usr/bin/env node

/**
 * アプリケーションヘルスチェック
 * 本番環境での動作確認用
 */

import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

/**
 * ヘルスチェック項目
 */
const healthChecks = {
  // 基本的な応答確認
  async basicResponse() {
    try {
      const response = await fetch(`http://${hostname}:${port}/`);
      return {
        name: 'Basic Response',
        status: response.ok ? 'healthy' : 'unhealthy',
        details: {
          status: response.status,
          statusText: response.statusText,
        },
      };
    } catch (error) {
      return {
        name: 'Basic Response',
        status: 'unhealthy',
        details: { error: error.message },
      };
    }
  },

  // API エンドポイントの確認
  async apiHealth() {
    try {
      const response = await fetch(`http://${hostname}:${port}/api/health`);
      const data = await response.json();
      return {
        name: 'API Health',
        status: response.ok ? 'healthy' : 'unhealthy',
        details: data,
      };
    } catch (error) {
      return {
        name: 'API Health',
        status: 'unhealthy',
        details: { error: error.message },
      };
    }
  },

  // ドメイン設定の確認
  async domainConfiguration() {
    try {
      const response = await fetch(`http://${hostname}:${port}/api/health`);
      const data = await response.json();
      
      if (data.checks && data.checks.domain) {
        const domainCheck = data.checks.domain;
        return {
          name: 'Domain Configuration',
          status: domainCheck.status,
          details: {
            currentDomain: domainCheck.domain,
            protocol: domainCheck.protocol,
            configuredUrl: domainCheck.configuredUrl,
            redirects: domainCheck.redirects,
            issues: domainCheck.issues,
            warnings: domainCheck.warnings,
          },
        };
      } else {
        return {
          name: 'Domain Configuration',
          status: 'unknown',
          details: { error: 'Domain check data not available' },
        };
      }
    } catch (error) {
      return {
        name: 'Domain Configuration',
        status: 'unhealthy',
        details: { error: error.message },
      };
    }
  },

  // SSL証明書の確認
  async sslCertificate() {
    try {
      const response = await fetch(`http://${hostname}:${port}/api/health`);
      const data = await response.json();
      
      if (data.checks && data.checks.ssl) {
        const sslCheck = data.checks.ssl;
        return {
          name: 'SSL Certificate',
          status: sslCheck.status,
          details: {
            domain: sslCheck.domain,
            accessible: sslCheck.accessible,
            message: sslCheck.message,
          },
        };
      } else {
        return {
          name: 'SSL Certificate',
          status: 'unknown',
          details: { error: 'SSL check data not available' },
        };
      }
    } catch (error) {
      return {
        name: 'SSL Certificate',
        status: 'unhealthy',
        details: { error: error.message },
      };
    }
  },

  // DNS解決の確認
  async dnsResolution() {
    try {
      const response = await fetch(`http://${hostname}:${port}/api/health`);
      const data = await response.json();
      
      if (data.checks && data.checks.dns) {
        const dnsCheck = data.checks.dns;
        return {
          name: 'DNS Resolution',
          status: dnsCheck.status,
          details: {
            message: dnsCheck.message,
            results: dnsCheck.results,
          },
        };
      } else {
        return {
          name: 'DNS Resolution',
          status: 'unknown',
          details: { error: 'DNS check data not available' },
        };
      }
    } catch (error) {
      return {
        name: 'DNS Resolution',
        status: 'unhealthy',
        details: { error: error.message },
      };
    }
  },

  // 環境変数の確認
  async environmentCheck() {
    const requiredVars = [
      'NEXT_PUBLIC_SANITY_PROJECT_ID',
      'NEXT_PUBLIC_SANITY_DATASET',
      'NEXT_PUBLIC_SITE_URL',
    ];

    const missing = requiredVars.filter(varName => !process.env[varName]);
    
    return {
      name: 'Environment Variables',
      status: missing.length === 0 ? 'healthy' : 'unhealthy',
      details: {
        missing,
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV,
      },
    };
  },

  // メモリ使用量の確認
  async memoryUsage() {
    const usage = process.memoryUsage();
    const maxMemory = 512 * 1024 * 1024; // 512MB
    
    return {
      name: 'Memory Usage',
      status: usage.heapUsed < maxMemory ? 'healthy' : 'warning',
      details: {
        heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
        external: `${Math.round(usage.external / 1024 / 1024)}MB`,
        rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
      },
    };
  },

  // ディスク容量の確認（Node.js 18.17.0+）
  async diskUsage() {
    try {
      const { statSync } = await import('fs');
      const stats = statSync('.');
      
      return {
        name: 'Disk Usage',
        status: 'healthy',
        details: {
          available: 'N/A (statSync does not provide disk space info)',
        },
      };
    } catch (error) {
      return {
        name: 'Disk Usage',
        status: 'unknown',
        details: { error: error.message },
      };
    }
  },
};

/**
 * ヘルスチェック実行
 */
async function runHealthCheck() {
  console.log('🏥 Starting health check...\n');
  
  const results = [];
  const startTime = Date.now();
  
  for (const [name, check] of Object.entries(healthChecks)) {
    try {
      const result = await check();
      results.push(result);
      
      const statusIcon = result.status === 'healthy' ? '✅' : 
                        result.status === 'warning' ? '⚠️' : '❌';
      
      console.log(`${statusIcon} ${result.name}: ${result.status}`);
      
      if (result.details && Object.keys(result.details).length > 0) {
        console.log(`   Details:`, JSON.stringify(result.details, null, 2));
      }
    } catch (error) {
      const result = {
        name: name,
        status: 'error',
        details: { error: error.message },
      };
      results.push(result);
      console.log(`❌ ${name}: error - ${error.message}`);
    }
    console.log('');
  }
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  // 結果サマリー
  const healthy = results.filter(r => r.status === 'healthy').length;
  const warnings = results.filter(r => r.status === 'warning').length;
  const unhealthy = results.filter(r => r.status === 'unhealthy').length;
  const errors = results.filter(r => r.status === 'error').length;
  
  console.log('📊 Health Check Summary:');
  console.log(`   ✅ Healthy: ${healthy}`);
  console.log(`   ⚠️  Warnings: ${warnings}`);
  console.log(`   ❌ Unhealthy: ${unhealthy}`);
  console.log(`   🚨 Errors: ${errors}`);
  console.log(`   ⏱️  Duration: ${duration}ms`);
  
  // 全体的な健康状態
  const overallStatus = errors > 0 || unhealthy > 0 ? 'unhealthy' : 
                       warnings > 0 ? 'warning' : 'healthy';
  
  const statusIcon = overallStatus === 'healthy' ? '✅' : 
                    overallStatus === 'warning' ? '⚠️' : '❌';
  
  console.log(`\n${statusIcon} Overall Status: ${overallStatus.toUpperCase()}`);
  
  // JSON形式での出力（CI/CD用）
  if (process.env.OUTPUT_JSON === 'true') {
    const report = {
      timestamp: new Date().toISOString(),
      overallStatus,
      duration,
      summary: { healthy, warnings, unhealthy, errors },
      results,
    };
    
    console.log('\n📄 JSON Report:');
    console.log(JSON.stringify(report, null, 2));
  }
  
  // 異常がある場合は非ゼロで終了
  process.exit(unhealthy > 0 || errors > 0 ? 1 : 0);
}

/**
 * スタンドアロン実行の場合
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  // Next.jsアプリを起動してからヘルスチェック実行
  if (process.env.STANDALONE_CHECK === 'true') {
    console.log('🚀 Starting Next.js application for health check...');
    
    await app.prepare();
    
    const server = createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error('Error occurred handling', req.url, err);
        res.statusCode = 500;
        res.end('internal server error');
      }
    });
    
    server.listen(port, (err) => {
      if (err) throw err;
      console.log(`> Ready on http://${hostname}:${port}`);
      
      // サーバー起動後にヘルスチェック実行
      setTimeout(async () => {
        await runHealthCheck();
        server.close();
      }, 2000);
    });
  } else {
    // 既に起動中のアプリに対してヘルスチェック実行
    await runHealthCheck();
  }
}

export { healthChecks, runHealthCheck };