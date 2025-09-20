/**
 * Sanity Webhook用の再検証APIエンドポイント
 * Requirements: 32.2 - ISR設定とWebhookによる自動再検証
 */

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { getRevalidationPaths, CACHE_TAGS } from '@/lib/revalidation';

// Webhook署名の検証
function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  return `sha256=${expectedSignature}` === signature;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-sanity-signature');
    const webhookSecret = process.env.SANITY_WEBHOOK_SECRET;

    // 本番環境では署名検証を必須とする
    if (process.env.NODE_ENV === 'production') {
      if (!signature || !webhookSecret) {
        console.error('Missing webhook signature or secret');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      if (!verifyWebhookSignature(body, signature, webhookSecret)) {
        console.error('Invalid webhook signature');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }

    const payload = JSON.parse(body);
    const { _type: documentType, slug } = payload;

    console.log(
      `Received webhook for ${documentType}:`,
      slug?.current || 'no-slug'
    );

    // ドキュメントタイプに基づいて再検証パスを決定
    const pathsToRevalidate = getRevalidationPaths(documentType, slug?.current);

    // パスの再検証
    const revalidationPromises = pathsToRevalidate.map(async path => {
      try {
        revalidatePath(path);
        console.log(`Revalidated path: ${path}`);
        return { path, success: true };
      } catch (error) {
        console.error(`Failed to revalidate path ${path}:`, error);
        return {
          path,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });

    // キャッシュタグの再検証
    const tagRevalidationPromises = [];

    switch (documentType) {
      case 'product':
        tagRevalidationPromises.push(
          revalidateTag(CACHE_TAGS.PRODUCTS),
          revalidateTag(CACHE_TAGS.SEARCH),
          revalidateTag(CACHE_TAGS.POPULAR)
        );
        break;
      case 'ingredient':
        tagRevalidationPromises.push(revalidateTag(CACHE_TAGS.INGREDIENTS));
        break;
      case 'brand':
        tagRevalidationPromises.push(revalidateTag(CACHE_TAGS.BRANDS));
        break;
    }

    // すべての再検証を並行実行
    const [pathResults] = await Promise.all([
      Promise.all(revalidationPromises),
      Promise.all(tagRevalidationPromises),
    ]);

    const successfulPaths = pathResults.filter(r => r.success).map(r => r.path);
    const failedPaths = pathResults.filter(r => !r.success);

    console.log(
      `Revalidation completed. Success: ${successfulPaths.length}, Failed: ${failedPaths.length}`
    );

    return NextResponse.json({
      success: true,
      revalidated: successfulPaths,
      failed: failedPaths,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Webhook processing error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// GET リクエストでの手動再検証（開発・テスト用）
export async function GET(request: NextRequest) {
  // 本番環境では無効化
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Manual revalidation not allowed in production' },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path');
  const tag = searchParams.get('tag');

  try {
    if (path) {
      revalidatePath(path);
      return NextResponse.json({
        success: true,
        message: `Revalidated path: ${path}`,
        timestamp: new Date().toISOString(),
      });
    }

    if (tag) {
      revalidateTag(tag);
      return NextResponse.json({
        success: true,
        message: `Revalidated tag: ${tag}`,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      { error: 'Missing path or tag parameter' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Manual revalidation error:', error);

    return NextResponse.json(
      {
        error: 'Revalidation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
