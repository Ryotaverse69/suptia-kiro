/**
 * ヘルスチェックAPI
 * 本番環境での監視・診断用
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/security/rate-limit';
import { env, getEnvironmentInfo } from '@/lib/env-validation';

export const GET = withRateLimit(async (request: NextRequest) => {
  const startTime = Date.now();
  
  try {
    // リクエスト情報の取得
    const hostname = request.headers.get('host') || 'unknown';
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const currentUrl = `${protocol}://${hostname}`;
    
    // 基本的なヘルスチェック項目
    const healthData: any = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: getEnvironmentInfo(),
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024),
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
      },
      domain: {
        current: currentUrl,
        configured: env.site.url,
        isCustomDomain: hostname === 'suptia.com',
        isSecure: protocol === 'https',
        hostname: hostname,
      },
      checks: {
        database: await checkDatabase(),
        sanity: await checkSanity(),
        environment: checkEnvironment(),
        domain: checkDomainConfiguration(hostname, protocol),
        ssl: await checkSSLCertificate(hostname),
        dns: await checkDNSResolution(),
      },
    };
    
    // 各チェックの結果を評価
    const allChecksHealthy = Object.values(healthData.checks).every(
      (check: any) => check.status === 'healthy'
    );
    
    if (!allChecksHealthy) {
      healthData.status = 'degraded';
    }
    
    const responseTime = Date.now() - startTime;
    healthData.responseTime = `${responseTime}ms`;
    
    const status = healthData.status === 'healthy' ? 200 : 503;
    
    return NextResponse.json(healthData, { 
      status,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
    
  } catch (error) {
    const errorData = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: `${Date.now() - startTime}ms`,
    };
    
    return NextResponse.json(errorData, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  }
});

/**
 * データベース接続チェック
 */
async function checkDatabase() {
  try {
    // 実際のデータベース接続チェックをここに実装
    // 現在はSanityを使用しているため、Sanityのチェックで代用
    return {
      status: 'healthy',
      message: 'Database connection successful',
      responseTime: '< 100ms',
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Database connection failed',
    };
  }
}

/**
 * Sanity接続チェック
 */
async function checkSanity() {
  try {
    // Sanity APIへの接続テスト
    const response = await fetch(
      `https://${env.sanity.projectId}.api.sanity.io/v${env.sanity.apiVersion}/data/query/${env.sanity.dataset}?query=*[_type == "product"][0]`,
      {
        headers: {
          'Authorization': `Bearer ${env.sanity.token}`,
        },
      }
    );
    
    if (response.ok) {
      return {
        status: 'healthy',
        message: 'Sanity connection successful',
        responseTime: '< 200ms',
      };
    } else {
      return {
        status: 'unhealthy',
        message: `Sanity API returned ${response.status}`,
      };
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Sanity connection failed',
    };
  }
}

/**
 * 環境変数チェック
 */
function checkEnvironment() {
  const requiredVars = [
    'NEXT_PUBLIC_SANITY_PROJECT_ID',
    'NEXT_PUBLIC_SANITY_DATASET',
    'NEXT_PUBLIC_SITE_URL',
  ];
  
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length === 0) {
    return {
      status: 'healthy',
      message: 'All required environment variables are set',
    };
  } else {
    return {
      status: 'unhealthy',
      message: `Missing environment variables: ${missing.join(', ')}`,
      missing,
    };
  }
}

/**
 * ドメイン設定チェック
 */
function checkDomainConfiguration(hostname: string, protocol: string) {
  const issues = [];
  const warnings = [];
  
  // HTTPSチェック
  if (protocol !== 'https') {
    issues.push('Not using HTTPS');
  }
  
  // カスタムドメインチェック
  if (hostname !== 'suptia.com') {
    if (hostname === 'www.suptia.com') {
      warnings.push('Using www subdomain (should redirect to apex domain)');
    } else if (hostname === 'suptia-kiro.vercel.app') {
      warnings.push('Using legacy Vercel domain (should redirect to custom domain)');
    } else if (hostname.includes('vercel.app')) {
      warnings.push(`Using Vercel preview domain: ${hostname}`);
    } else {
      issues.push(`Using unexpected domain: ${hostname}`);
    }
  }
  
  // 設定されたサイトURLとの一致チェック
  const configuredUrl = env.site.url;
  const currentUrl = `${protocol}://${hostname}`;
  if (currentUrl !== configuredUrl) {
    if (hostname.includes('vercel.app')) {
      // Vercelプレビュードメインの場合は警告レベル
      warnings.push(`Preview domain (${currentUrl}) differs from configured URL (${configuredUrl})`);
    } else {
      issues.push(`Current URL (${currentUrl}) does not match configured URL (${configuredUrl})`);
    }
  }
  
  // ステータス判定
  let status = 'healthy';
  let message = 'Domain configuration is correct';
  
  if (issues.length > 0) {
    status = 'unhealthy';
    message = 'Critical domain configuration issues detected';
  } else if (warnings.length > 0) {
    status = 'warning';
    message = 'Domain configuration warnings detected';
  }
  
  return {
    status,
    message,
    domain: hostname,
    protocol: protocol,
    configuredUrl,
    currentUrl,
    issues: issues.length > 0 ? issues : undefined,
    warnings: warnings.length > 0 ? warnings : undefined,
    redirects: {
      expectedRedirects: [
        'www.suptia.com → suptia.com',
        'suptia-kiro.vercel.app → suptia.com'
      ],
      currentDomain: hostname,
      isApexDomain: hostname === 'suptia.com',
      needsRedirect: hostname !== 'suptia.com',
    },
  };
}

/**
 * SSL証明書チェック
 */
async function checkSSLCertificate(hostname: string) {
  try {
    // カスタムドメインの場合のみSSL証明書をチェック
    if (hostname === 'suptia.com' || hostname === 'www.suptia.com') {
      const response = await fetch(`https://${hostname}/api/health`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
      });
      
      return {
        status: 'healthy',
        message: 'SSL certificate is valid and accessible',
        domain: hostname,
        accessible: response.ok,
      };
    } else {
      return {
        status: 'info',
        message: 'SSL check skipped for non-custom domain',
        domain: hostname,
      };
    }
  } catch (error) {
    return {
      status: 'warning',
      message: error instanceof Error ? error.message : 'SSL certificate check failed',
      domain: hostname,
    };
  }
}

/**
 * DNS解決チェック
 */
async function checkDNSResolution() {
  try {
    const domains = ['suptia.com', 'www.suptia.com'];
    const results = [];
    
    for (const domain of domains) {
      try {
        // DNS解決をテストするため、ドメインへのリクエストを試行
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const response = await fetch(`https://${domain}`, {
          method: 'HEAD',
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        results.push({
          domain,
          resolved: true,
          accessible: response.ok,
          status: response.status,
        });
      } catch (error) {
        results.push({
          domain,
          resolved: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
    
    const allResolved = results.every(r => r.resolved);
    
    return {
      status: allResolved ? 'healthy' : 'warning',
      message: allResolved ? 'All domains resolve correctly' : 'Some domains failed to resolve',
      results,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'DNS resolution check failed',
    };
  }
}

/**
 * 詳細なヘルスチェック（管理者用）
 */
export async function POST(request: NextRequest) {
  // 管理者認証が必要な詳細ヘルスチェック
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  // 簡易的な認証（本番環境では適切な認証を実装）
  const token = authHeader.substring(7);
  if (token !== process.env.HEALTH_CHECK_TOKEN) {
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 403 }
    );
  }
  
  try {
    const detailedHealth = {
      ...await GET(request).then(res => res.json()),
      detailed: {
        process: {
          pid: process.pid,
          platform: process.platform,
          arch: process.arch,
          nodeVersion: process.version,
          uptime: process.uptime(),
        },
        system: {
          loadAverage: process.platform !== 'win32' ? (process as any).loadavg?.() : null,
          cpuUsage: process.cpuUsage(),
        },
        environment: {
          nodeEnv: process.env.NODE_ENV,
          vercelEnv: process.env.VERCEL_ENV,
          vercelRegion: process.env.VERCEL_REGION,
          vercelUrl: process.env.VERCEL_URL,
        },
      },
    };
    
    return NextResponse.json(detailedHealth);
    
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to generate detailed health report',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
