/**
 * ヘルスチェック API エンドポイント
 * 本番環境の稼働状況とシステム状態を確認
 */

import { NextResponse } from 'next/server';
import { sanity } from '@/lib/sanity.client';

// システム情報の取得
function getSystemInfo() {
  return {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    deployment: {
      vercel: {
        url: process.env.VERCEL_URL,
        region: process.env.VERCEL_REGION,
        deploymentId: process.env.VERCEL_DEPLOYMENT_ID,
      },
    },
  };
}

// Sanity 接続テスト
async function checkSanityConnection() {
  try {
    const startTime = Date.now();

    // 簡単なクエリでSanity接続をテスト
    const result = await sanity.fetch(
      `*[_type == "product"][0]{_id, name}`,
      {},
      {
        cache: 'no-store',
      }
    );

    const responseTime = Date.now() - startTime;

    return {
      status: 'healthy',
      responseTime,
      connected: true,
      sampleData: result ? 'available' : 'empty',
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// 環境変数チェック
function checkEnvironmentVariables() {
  const requiredVars = [
    'NEXT_PUBLIC_SANITY_PROJECT_ID',
    'NEXT_PUBLIC_SANITY_DATASET',
    'NEXT_PUBLIC_SITE_URL',
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);

  return {
    status: missing.length === 0 ? 'healthy' : 'unhealthy',
    required: requiredVars.length,
    configured: requiredVars.length - missing.length,
    missing,
  };
}

// ISR 設定チェック
function checkISRConfiguration() {
  const productRevalidate = parseInt(
    process.env.PRODUCT_REVALIDATE_TIME || '3600',
    10
  );
  const listingRevalidate = parseInt(
    process.env.LISTING_REVALIDATE_TIME || '600',
    10
  );

  return {
    status: 'healthy',
    configuration: {
      productRevalidateTime: productRevalidate,
      listingRevalidateTime: listingRevalidate,
    },
  };
}

// メモリ使用量チェック（Node.js環境）
function checkMemoryUsage() {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const usage = process.memoryUsage();
    const formatBytes = (bytes: number) =>
      Math.round((bytes / 1024 / 1024) * 100) / 100;

    return {
      status: 'healthy',
      usage: {
        rss: `${formatBytes(usage.rss)} MB`,
        heapTotal: `${formatBytes(usage.heapTotal)} MB`,
        heapUsed: `${formatBytes(usage.heapUsed)} MB`,
        external: `${formatBytes(usage.external)} MB`,
      },
    };
  }

  return {
    status: 'unavailable',
    message: 'Memory usage not available in this environment',
  };
}

export async function GET() {
  try {
    const startTime = Date.now();

    // 並行してヘルスチェックを実行
    const [sanityHealth, envHealth, isrHealth, memoryHealth] =
      await Promise.all([
        checkSanityConnection(),
        Promise.resolve(checkEnvironmentVariables()),
        Promise.resolve(checkISRConfiguration()),
        Promise.resolve(checkMemoryUsage()),
      ]);

    const totalResponseTime = Date.now() - startTime;

    // 全体的な健康状態を判定
    const overallStatus = [
      sanityHealth.status,
      envHealth.status,
      isrHealth.status,
    ].includes('unhealthy')
      ? 'unhealthy'
      : 'healthy';

    const healthData = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      responseTime: totalResponseTime,
      system: getSystemInfo(),
      checks: {
        sanity: sanityHealth,
        environment: envHealth,
        isr: isrHealth,
        memory: memoryHealth,
      },
    };

    // ステータスコードを設定
    const statusCode = overallStatus === 'healthy' ? 200 : 503;

    return NextResponse.json(healthData, {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (error) {
    console.error('Health check error:', error);

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        system: getSystemInfo(),
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  }
}

// HEAD リクエストでの軽量ヘルスチェック
export async function HEAD() {
  try {
    // 基本的な環境変数チェックのみ
    const envHealth = checkEnvironmentVariables();
    const status = envHealth.status === 'healthy' ? 200 : 503;

    return new Response(null, {
      status,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Status': envHealth.status,
        'X-Health-Timestamp': new Date().toISOString(),
      },
    });
  } catch (error) {
    return new Response(null, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Status': 'unhealthy',
        'X-Health-Error':
          error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}
