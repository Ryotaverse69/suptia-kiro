import { NextRequest, NextResponse } from 'next/server';
import { CacheInvalidationStrategy } from '@/lib/cache-invalidation';
import { headers } from 'next/headers';

/**
 * Webhook endpoint for cache invalidation
 * キャッシュ無効化用のWebhookエンドポイント
 */
export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret for security
    const webhookSecret = process.env.SANITY_WEBHOOK_SECRET;
    const providedSecret = headers().get('x-webhook-secret');

    if (webhookSecret && providedSecret !== webhookSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { _type, slug, action } = body;

    console.log('Revalidation webhook received:', { _type, slug, action });

    // Handle different content types and actions
    switch (_type) {
      case 'product':
        if (action === 'delete') {
          // Product deleted - invalidate all product pages
          await CacheInvalidationStrategy.onBulkProductUpdate();
        } else {
          // Product created/updated - invalidate specific product
          const productSlug = slug?.current || slug;
          await CacheInvalidationStrategy.onProductChange(productSlug);
        }
        break;

      default:
        // For other content types, invalidate site-wide
        await CacheInvalidationStrategy.onSiteContentUpdate();
        break;
    }

    return NextResponse.json({
      success: true,
      message: 'Cache invalidated successfully',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Revalidation webhook error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Manual revalidation endpoint
 * 手動キャッシュ無効化エンドポイント
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');
    const secret = searchParams.get('secret');

    // Verify secret for manual revalidation
    if (secret !== process.env.REVALIDATE_SECRET) {
      return NextResponse.json(
        { error: 'Invalid secret' },
        { status: 401 }
      );
    }

    if (path) {
      // Revalidate specific path
      await CacheInvalidationStrategy.manualRefresh([path]);
    } else {
      // Revalidate all product pages
      await CacheInvalidationStrategy.onBulkProductUpdate();
    }

    return NextResponse.json({
      success: true,
      message: `Revalidated ${path || 'all pages'}`,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Manual revalidation error:', error);
    
    return NextResponse.json(
      { 
        error: 'Revalidation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}