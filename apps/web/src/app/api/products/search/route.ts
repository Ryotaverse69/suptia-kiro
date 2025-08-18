import { NextRequest, NextResponse } from "next/server";
import { ProductSearchSchema, validateInput } from "@/lib/security/validation";
import { z } from "zod";

/**
 * 商品検索API
 * レート制限と入力検証のデモンストレーション
 */
export async function GET(request: NextRequest) {
  try {
    // URLパラメータを取得
    const { searchParams } = new URL(request.url);
    const rawParams = Object.fromEntries(searchParams.entries());

    // 数値パラメータを適切な型に変換
    const processedParams = {
      ...rawParams,
      minPrice: rawParams.minPrice ? Number(rawParams.minPrice) : undefined,
      maxPrice: rawParams.maxPrice ? Number(rawParams.maxPrice) : undefined,
      page: rawParams.page ? Number(rawParams.page) : undefined,
      limit: rawParams.limit ? Number(rawParams.limit) : undefined,
    };

    // 入力検証
    const validation = validateInput(ProductSearchSchema, processedParams);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error,
          meta: {
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 },
      );
    }

    const validatedParams = validation.data;

    // レート制限情報をヘッダーから取得（ミドルウェアで設定済み）
    const rateLimitHeaders = {
      limit: request.headers.get("x-ratelimit-limit"),
      remaining: request.headers.get("x-ratelimit-remaining"),
      reset: request.headers.get("x-ratelimit-reset"),
    };

    // 実際の商品検索ロジック（モック）
    const mockResults = {
      products: [
        {
          id: "product1",
          name: `${validatedParams.query}関連商品1`,
          price: 1500,
          rating: 4.2,
          category: validatedParams.category || "general",
        },
        {
          id: "product2",
          name: `${validatedParams.query}関連商品2`,
          price: 2800,
          rating: 4.5,
          category: validatedParams.category || "general",
        },
      ],
      pagination: {
        page: validatedParams.page,
        limit: validatedParams.limit,
        total: 2,
        totalPages: 1,
      },
      filters: {
        query: validatedParams.query,
        category: validatedParams.category,
        priceRange: {
          min: validatedParams.minPrice,
          max: validatedParams.maxPrice,
        },
        sortBy: validatedParams.sortBy,
        sortOrder: validatedParams.sortOrder,
      },
    };

    // 成功レスポンス
    const response = NextResponse.json({
      success: true,
      data: mockResults,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
        rateLimit: rateLimitHeaders.limit
          ? {
              limit: Number(rateLimitHeaders.limit),
              remaining: Number(rateLimitHeaders.remaining),
              resetTime: Number(rateLimitHeaders.reset),
            }
          : undefined,
      },
    });

    // レート制限ヘッダーを追加
    if (rateLimitHeaders.limit) {
      response.headers.set("X-RateLimit-Limit", rateLimitHeaders.limit);
      response.headers.set(
        "X-RateLimit-Remaining",
        rateLimitHeaders.remaining || "0",
      );
      response.headers.set("X-RateLimit-Reset", rateLimitHeaders.reset || "0");
    }

    return response;
  } catch (error) {
    console.error("Product search API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "サーバー内部エラーが発生しました",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 },
    );
  }
}

/**
 * POST method for advanced search with body parameters
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 入力検証
    const validation = validateInput(ProductSearchSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error,
          meta: {
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 },
      );
    }

    const validatedParams = validation.data;

    // レート制限情報をヘッダーから取得
    const rateLimitHeaders = {
      limit: request.headers.get("x-ratelimit-limit"),
      remaining: request.headers.get("x-ratelimit-remaining"),
      reset: request.headers.get("x-ratelimit-reset"),
    };

    // 高度な検索ロジック（モック）
    const mockResults = {
      products: [
        {
          id: "advanced1",
          name: `高度検索: ${validatedParams.query}`,
          price: 3200,
          rating: 4.7,
          category: validatedParams.category || "premium",
          features: ["高品質", "国産", "無添加"],
        },
      ],
      searchMetadata: {
        searchType: "advanced",
        processingTime: "45ms",
        totalMatches: 1,
      },
      pagination: {
        page: validatedParams.page,
        limit: validatedParams.limit,
        total: 1,
        totalPages: 1,
      },
    };

    const response = NextResponse.json({
      success: true,
      data: mockResults,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
        rateLimit: rateLimitHeaders.limit
          ? {
              limit: Number(rateLimitHeaders.limit),
              remaining: Number(rateLimitHeaders.remaining),
              resetTime: Number(rateLimitHeaders.reset),
            }
          : undefined,
      },
    });

    // レート制限ヘッダーを追加
    if (rateLimitHeaders.limit) {
      response.headers.set("X-RateLimit-Limit", rateLimitHeaders.limit);
      response.headers.set(
        "X-RateLimit-Remaining",
        rateLimitHeaders.remaining || "0",
      );
      response.headers.set("X-RateLimit-Reset", rateLimitHeaders.reset || "0");
    }

    return response;
  } catch (error) {
    console.error("Advanced product search API error:", error);

    // JSON解析エラーの場合
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_JSON",
            message: "無効なJSONデータです",
          },
          meta: {
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "サーバー内部エラーが発生しました",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 },
    );
  }
}
