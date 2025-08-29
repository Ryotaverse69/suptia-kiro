/**
 * セキュリティヘッダー管理ユーティリティ
 * 
 * 要件1.1-1.7に対応：
 * - 厳格なCSP設定（script-src 'self'、unsafe-inline禁止）
 * - GA4サポート（コメント形式）
 * - 必須セキュリティヘッダー設定
 */

/**
 * 本番環境用の厳格なCSPを生成
 * @param nonce - スクリプト用のnonce値（オプション）
 * @returns CSPポリシー文字列
 */
export function generateCSP(nonce?: string): string {
  const scriptSrc = nonce 
    ? `script-src 'self' 'nonce-${nonce}'`
    : "script-src 'self'";

  const policies = [
    "default-src 'self'",
    scriptSrc, // 厳格：unsafe-inline禁止
    "style-src 'self' 'unsafe-inline'", // Tailwind CSS用
    "img-src 'self' https://cdn.sanity.io data:",
    "connect-src 'self' https://*.sanity.io",
    "font-src 'self' data:",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
    
    // GA4サポート（コメント形式 - 必要時にアンコメント）:
    // `script-src 'self' ${nonce ? `'nonce-${nonce}'` : ''} https://www.googletagmanager.com`,
    // "connect-src 'self' https://*.sanity.io https://www.google-analytics.com https://analytics.google.com",
  ];

  return policies.join("; ");
}

/**
 * 開発環境用の緩いCSPを生成
 * @returns 開発用CSPポリシー文字列
 */
export function generateDevCSP(): string {
  const policies = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js開発用
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' https://cdn.sanity.io data: blob:",
    "connect-src 'self' https://*.sanity.io ws: wss:", // HMR用WebSocket
    "font-src 'self' data:",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ];

  return policies.join("; ");
}

/**
 * 標準セキュリティヘッダーを取得
 * @returns セキュリティヘッダーオブジェクト
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
    'X-DNS-Prefetch-Control': 'on',
  };
}

/**
 * レスポンスにセキュリティヘッダーを適用
 * @param response - Response オブジェクト
 * @param nonce - CSP用nonce（オプション）
 */
export function applySecurityHeaders(response: Response, nonce?: string): void {
  const isDev = process.env.NODE_ENV === 'development';
  
  // CSP設定
  const csp = isDev ? generateDevCSP() : generateCSP(nonce);
  response.headers.set('Content-Security-Policy', csp);
  
  // その他のセキュリティヘッダー
  const securityHeaders = getSecurityHeaders();
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
}

/**
 * 許可されたドメインかチェック
 * @param url - チェック対象のURL
 * @returns 許可されている場合true
 */
export function isAllowedDomain(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    // 許可ドメインリスト
    const allowedDomains = [
      'cdn.sanity.io',
      'suptia.com',
      'www.suptia.com',
      'localhost',
      '127.0.0.1',
    ];
    
    // サブドメイン許可
    const allowedSubdomains = [
      '.sanity.io',
      '.suptia.com',
    ];
    
    // 完全一致チェック
    if (allowedDomains.includes(hostname)) {
      return true;
    }
    
    // サブドメインチェック
    return allowedSubdomains.some(domain => hostname.endsWith(domain));
  } catch {
    return false;
  }
}

/**
 * 外部URLをサニタイズ
 * @param url - サニタイズ対象のURL
 * @returns サニタイズされたURL、または無効な場合null
 */
export function sanitizeExternalUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    
    // 許可されていないドメインは拒否
    if (!isAllowedDomain(url)) {
      return null;
    }
    
    // localhostのHTTPは許可
    if (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1') {
      return url;
    }
    
    // HTTPをHTTPSに強制変換
    if (urlObj.protocol === 'http:') {
      urlObj.protocol = 'https:';
    }
    
    return urlObj.toString();
  } catch {
    return null;
  }
}