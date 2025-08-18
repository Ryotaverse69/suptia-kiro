import { createHash } from "crypto";

/**
 * レート制限設定
 * 60 req/10 min/IP の制限を実装
 */
export interface RateLimitConfig {
  windowMs: number; // 600000 (10 minutes)
  maxRequests: number; // 60
  skipSuccessfulRequests: boolean;
  logIpHash: boolean; // IPハッシュをログに記録
  logRoute: boolean; // 経路をログに記録
}

/**
 * レート制限結果
 */
export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number; // 429の場合のRetry-After秒数
}

/**
 * レート制限違反ログ
 */
export interface RateLimitViolationLog {
  ipHash: string;
  route: string;
  timestamp: string;
  requestCount: number;
  userAgent?: string;
}

// メモリベースのレート制限ストレージ（本番環境ではRedis推奨）
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const violationLogs: RateLimitViolationLog[] = [];

/**
 * デフォルトのレート制限設定
 */
const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 10 * 60 * 1000, // 10分
  maxRequests: 60,
  skipSuccessfulRequests: false,
  logIpHash: true,
  logRoute: true,
};

/**
 * IPアドレスをハッシュ化（プライバシー保護）
 */
function hashIP(ip: string): string {
  return createHash("sha256")
    .update(ip + process.env.RATE_LIMIT_SALT || "default-salt")
    .digest("hex")
    .substring(0, 16);
}

/**
 * レート制限チェック
 */
export function checkRateLimit(
  ip: string,
  route: string,
  userAgent?: string,
  config: Partial<RateLimitConfig> = {},
): RateLimitResult {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const ipHash = hashIP(ip);
  const key = `${ipHash}:${route}`;
  const now = Date.now();
  const windowStart = now - finalConfig.windowMs;

  // 古いエントリをクリーンアップ
  for (const [k, v] of requestCounts.entries()) {
    if (v.resetTime < now) {
      requestCounts.delete(k);
    }
  }

  // 現在のリクエスト数を取得
  const current = requestCounts.get(key) || {
    count: 0,
    resetTime: now + finalConfig.windowMs,
  };

  // リセット時間が過ぎている場合は新しいウィンドウを開始
  if (current.resetTime < now) {
    current.count = 0;
    current.resetTime = now + finalConfig.windowMs;
  }

  // 成功時のリクエストをスキップするかどうか
  const shouldIncrement = !finalConfig.skipSuccessfulRequests;

  // リクエスト数をインクリメント（設定に応じて）
  if (shouldIncrement) {
    current.count++;
    requestCounts.set(key, current);
  }

  const remaining = Math.max(0, finalConfig.maxRequests - current.count);
  const success = current.count <= finalConfig.maxRequests;

  // レート制限違反の場合はログに記録
  if (!success && finalConfig.logIpHash && finalConfig.logRoute) {
    const violationLog: RateLimitViolationLog = {
      ipHash,
      route,
      timestamp: new Date().toISOString(),
      requestCount: current.count,
      userAgent,
    };

    violationLogs.push(violationLog);

    // ログサイズ制限（最新1000件のみ保持）
    if (violationLogs.length > 1000) {
      violationLogs.splice(0, violationLogs.length - 1000);
    }

    // コンソールにも出力
    console.warn("Rate limit violation:", {
      ipHash,
      route,
      requestCount: current.count,
      limit: finalConfig.maxRequests,
      userAgent: userAgent?.substring(0, 100), // User-Agentは100文字まで
    });
  }

  return {
    success,
    limit: finalConfig.maxRequests,
    remaining,
    resetTime: current.resetTime,
    retryAfter: success
      ? undefined
      : Math.ceil((current.resetTime - now) / 1000),
  };
}

/**
 * レート制限違反ログを取得
 */
export function getRateLimitViolations(limit = 100): RateLimitViolationLog[] {
  return violationLogs.slice(-limit);
}

/**
 * レート制限統計を取得
 */
export function getRateLimitStats() {
  const now = Date.now();
  const activeKeys = Array.from(requestCounts.entries()).filter(
    ([, v]) => v.resetTime > now,
  );

  return {
    activeConnections: activeKeys.length,
    totalViolations: violationLogs.length,
    recentViolations: violationLogs.filter(
      (log) => new Date(log.timestamp).getTime() > now - 60 * 60 * 1000, // 過去1時間
    ).length,
  };
}

/**
 * レート制限データをクリア（テスト用）
 */
export function clearRateLimitData(): void {
  requestCounts.clear();
  violationLogs.length = 0;
}
