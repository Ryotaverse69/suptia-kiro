import { NextRequest, NextResponse } from "next/server";
import {
  getRateLimitStats,
  getRateLimitViolations,
} from "@/lib/security/rate-limit";

/**
 * レート制限統計API（管理者用）
 * 本番環境では適切な認証が必要
 */
export async function GET(request: NextRequest) {
  try {
    // 本番環境では管理者認証をここで実装
    // if (!isAdmin(request)) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const { searchParams } = new URL(request.url);
    const violationLimit = searchParams.get("violationLimit");
    const limit = violationLimit ? parseInt(violationLimit, 10) : 100;

    // 統計情報を取得
    const stats = getRateLimitStats();
    const violations = getRateLimitViolations(limit);

    // 違反の時間別集計
    const now = new Date();
    const hourlyViolations = violations.reduce(
      (acc, violation) => {
        const hour = new Date(violation.timestamp).getHours();
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      },
      {} as Record<number, number>,
    );

    // 経路別違反集計
    const routeViolations = violations.reduce(
      (acc, violation) => {
        acc[violation.route] = (acc[violation.route] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // IPハッシュ別違反集計（上位10件）
    const ipViolations = violations.reduce(
      (acc, violation) => {
        acc[violation.ipHash] = (acc[violation.ipHash] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const topViolatingIPs = Object.entries(ipViolations)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([ipHash, count]) => ({ ipHash, count }));

    const response = {
      success: true,
      data: {
        overview: {
          ...stats,
          violationsInLast24Hours: violations.filter(
            (v) =>
              new Date(v.timestamp).getTime() >
              now.getTime() - 24 * 60 * 60 * 1000,
          ).length,
        },
        violations: {
          recent: violations.slice(-20), // 最新20件
          hourlyDistribution: hourlyViolations,
          routeDistribution: routeViolations,
          topViolatingIPs,
        },
        metadata: {
          totalViolationsReturned: violations.length,
          requestedLimit: limit,
          generatedAt: now.toISOString(),
        },
      },
      meta: {
        timestamp: now.toISOString(),
        requestId: crypto.randomUUID(),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Rate limit stats API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "レート制限統計の取得に失敗しました",
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
 * レート制限データをクリア（開発・テスト用）
 */
export async function DELETE(request: NextRequest) {
  try {
    // 本番環境では管理者認証とさらなる制限が必要
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "本番環境ではレート制限データのクリアは許可されていません",
          },
        },
        { status: 403 },
      );
    }

    // 開発環境でのみ実行
    const { clearRateLimitData } = await import("@/lib/security/rate-limit");
    clearRateLimitData();

    return NextResponse.json({
      success: true,
      data: {
        message: "レート制限データがクリアされました",
        clearedAt: new Date().toISOString(),
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    });
  } catch (error) {
    console.error("Rate limit clear API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "レート制限データのクリアに失敗しました",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 },
    );
  }
}
