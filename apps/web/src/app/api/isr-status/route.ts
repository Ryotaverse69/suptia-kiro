import { NextResponse } from 'next/server';
import { getISRStatus } from '@/lib/cache-invalidation';

/**
 * ISR Status API endpoint
 * ISRステータス確認APIエンドポイント
 */
export async function GET() {
  try {
    const status = getISRStatus();
    
    return NextResponse.json({
      success: true,
      data: status,
      pages: {
        '/': {
          revalidate: status.config.PRODUCT_LIST,
          description: 'Product listing page - 30 minutes',
        },
        '/products/[slug]': {
          revalidate: status.config.PRODUCT_DETAIL,
          description: 'Product detail pages - 10 minutes',
        },
        '/compare': {
          revalidate: status.config.COMPARE_PAGES,
          description: 'Compare page - 1 hour',
        },
      },
    });

  } catch (error) {
    console.error('ISR status error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get ISR status',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}