/**
 * セキュリティ設定
 * 本番環境対応のセキュリティ強化
 */

import { NextRequest, NextResponse } from 'next/server';
import { env, isProduction } from './env-validation';

/**
 * セキュリティヘッダーの設定
 */
export function getSecurityHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    // XSS Protection
    'X-XSS-Protection': '1; mode=block',
    
    // Content Type Options
    'X-Content-Type-Options': 'nosniff',
    
    // Frame Options
    'X-Frame-Options': 'DENY',
    
    // Referrer Policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Permissions Policy
    'Permissions-Policy': [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'interest-cohort=()'
    ].join(', '),
  };
  
  // 本番環境でのみ追加のセキュリティヘッダー
  if (isProduction) {
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload';
    
    // Content Security Policy
    headers['Content-Security-Policy'] = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "media-src 'self' https:",
      "connect-src 'self' https://api.sanity.io https://www.google-analytics.com",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests"
    ].join('; ');
  }
  
  return headers;
}

/**
 * CORS設定
 */
export function getCORSHeaders(origin?: string): Record<string, string> {
  const allowedOrigins = [
    env.site.url,
    'https://suptia.com',
    'https://www.suptia.com',
    ...(env.security.corsOrigins || [])
  ];
  
  // 開発環境では localhost を許可
  if (!isProduction) {
    allowedOrigins.push('http://localhost:3000', 'http://localhost:3333');
  }
  
  const isAllowedOrigin = origin && allowedOrigins.includes(origin);
  
  return {
    'Access-Control-Allow-Origin': isAllowedOrigin ? origin : 'null',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * レート制限の設定
 */
interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export const rateLimitConfigs: Record<string, RateLimitConfig> = {
  // API全般
  api: {
    windowMs: 15 * 60 * 1000, // 15分
    maxRequests: 100,
    skipSuccessfulRequests: false,
  },
  
  // 検索API
  search: {
    windowMs: 1 * 60 * 1000, // 1分
    maxRequests: 30,
    skipSuccessfulRequests: true,
  },
  
  // 診断API
  diagnosis: {
    windowMs: 5 * 60 * 1000, // 5分
    maxRequests: 10,
    skipSuccessfulRequests: true,
  },
  
  // 認証API
  auth: {
    windowMs: 15 * 60 * 1000, // 15分
    maxRequests: 5,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  },
};

/**
 * IPアドレスの取得
 */
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (cfConnectingIP) return cfConnectingIP;
  if (realIP) return realIP;
  if (forwarded) return forwarded.split(',')[0].trim();
  
  return 'unknown';
}

/**
 * User-Agentの検証
 */
export function isValidUserAgent(userAgent?: string): boolean {
  if (!userAgent) return false;
  
  // 明らかに悪意のあるUser-Agentをブロック
  const blockedPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /php/i,
  ];
  
  // 本番環境でのみ厳格にチェック
  if (isProduction) {
    return !blockedPatterns.some(pattern => pattern.test(userAgent));
  }
  
  return true;
}

/**
 * リクエストの検証
 */
export function validateRequest(request: NextRequest): {
  isValid: boolean;
  reason?: string;
} {
  const userAgent = request.headers.get('user-agent');
  const referer = request.headers.get('referer');
  const origin = request.headers.get('origin');
  
  // User-Agentの検証
  if (!isValidUserAgent(userAgent || undefined)) {
    return {
      isValid: false,
      reason: 'Invalid User-Agent',
    };
  }
  
  // 本番環境でのOrigin検証
  if (isProduction && request.method !== 'GET') {
    const allowedOrigins = [
      env.site.url,
      'https://suptia.com',
      'https://www.suptia.com',
    ];
    
    if (origin && !allowedOrigins.includes(origin)) {
      return {
        isValid: false,
        reason: 'Invalid Origin',
      };
    }
  }
  
  return { isValid: true };
}

/**
 * セキュリティミドルウェア
 */
export function applySecurityHeaders(response: NextResponse): NextResponse {
  const securityHeaders = getSecurityHeaders();
  
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}

/**
 * エラーレスポンスの生成（情報漏洩を防ぐ）
 */
export function createSecureErrorResponse(
  status: number,
  message?: string
): NextResponse {
  const secureMessages: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
  };
  
  const responseMessage = isProduction 
    ? secureMessages[status] || 'Error'
    : message || secureMessages[status] || 'Error';
  
  const response = NextResponse.json(
    { error: responseMessage },
    { status }
  );
  
  return applySecurityHeaders(response);
}

/**
 * 入力値のサニタイゼーション
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // HTMLタグの除去
    .replace(/javascript:/gi, '') // JavaScriptプロトコルの除去
    .replace(/on\w+=/gi, '') // イベントハンドラーの除去
    .trim();
}

/**
 * SQLインジェクション対策
 */
export function validateSQLInput(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
    /(--|\/\*|\*\/)/g,
    /(\b(SCRIPT|JAVASCRIPT|VBSCRIPT)\b)/gi,
  ];
  
  return !sqlPatterns.some(pattern => pattern.test(input));
}

/**
 * XSS対策
 */
export function validateXSSInput(input: string): boolean {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<img[^>]+src[^>]*>/gi,
  ];
  
  return !xssPatterns.some(pattern => pattern.test(input));
}

/**
 * 包括的な入力検証
 */
export function validateUserInput(input: string): {
  isValid: boolean;
  sanitized: string;
  errors: string[];
} {
  const errors: string[] = [];
  let sanitized = sanitizeInput(input);
  
  if (!validateSQLInput(sanitized)) {
    errors.push('Potential SQL injection detected');
  }
  
  if (!validateXSSInput(sanitized)) {
    errors.push('Potential XSS attack detected');
  }
  
  return {
    isValid: errors.length === 0,
    sanitized,
    errors,
  };
}