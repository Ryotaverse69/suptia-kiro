/**
 * Domain Whitelist for LLM Agent Safety
 * 許可ドメインの管理とネットワークアクセス制限
 */

// 許可されたドメインのリスト
export const ALLOWED_DOMAINS = [
  // Sanity CMS
  '*.sanity.io',
  'sanity.io',
  'cdn.sanity.io',
  'api.sanity.io',
  
  // 自社ドメイン
  '*.suptia.com',
  'suptia.com',
  'www.suptia.com',
  'api.suptia.com',
  
  // 開発環境
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  
  // Vercel API
  'api.vercel.com',
  
  // ローカルネットワーク（開発用）
  '192.168.*',
  '10.*',
  '172.16.*',
] as const;

// 明示的に禁止されたドメイン
export const BLOCKED_DOMAINS = [
  // 一般的な危険ドメイン
  'bit.ly',
  'tinyurl.com',
  'goo.gl',
  't.co',
  
  // ファイル共有サービス
  'dropbox.com',
  'drive.google.com',
  'onedrive.live.com',
  
  // 外部API（許可されていない）
  'api.github.com',
  'api.twitter.com',
  'graph.facebook.com',
] as const;

export interface DomainValidationResult {
  isAllowed: boolean;
  reason: string;
  domain: string;
  riskLevel: 'safe' | 'suspicious' | 'blocked';
}

export class DomainWhitelist {
  /**
   * ドメインがワイルドカードパターンにマッチするかチェック
   */
  private static matchesWildcard(domain: string, pattern: string): boolean {
    if (!pattern.includes('*')) {
      return domain === pattern;
    }

    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*');
    
    const regex = new RegExp(`^${regexPattern}$`, 'i');
    return regex.test(domain);
  }

  /**
   * URLからドメインを抽出
   */
  private static extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.toLowerCase();
    } catch {
      // URLが無効な場合、そのまま返す
      return url.toLowerCase();
    }
  }

  /**
   * ドメインが許可リストに含まれているかチェック
   */
  static isDomainAllowed(domain: string): boolean {
    const normalizedDomain = this.extractDomain(domain);
    
    return ALLOWED_DOMAINS.some(allowedDomain => 
      this.matchesWildcard(normalizedDomain, allowedDomain)
    );
  }

  /**
   * ドメインが明示的に禁止されているかチェック
   */
  static isDomainBlocked(domain: string): boolean {
    const normalizedDomain = this.extractDomain(domain);
    
    return BLOCKED_DOMAINS.some(blockedDomain => 
      this.matchesWildcard(normalizedDomain, blockedDomain)
    );
  }

  /**
   * URLのネットワークアクセスを検証
   */
  static validateNetworkAccess(url: string): DomainValidationResult {
    const domain = this.extractDomain(url);

    // 明示的に禁止されたドメインをチェック
    if (this.isDomainBlocked(domain)) {
      return {
        isAllowed: false,
        reason: `ドメイン '${domain}' は明示的に禁止されています`,
        domain,
        riskLevel: 'blocked',
      };
    }

    // 許可されたドメインをチェック
    if (this.isDomainAllowed(domain)) {
      return {
        isAllowed: true,
        reason: `ドメイン '${domain}' は許可されています`,
        domain,
        riskLevel: 'safe',
      };
    }

    // 許可リストにないドメイン
    return {
      isAllowed: false,
      reason: `ドメイン '${domain}' は許可リストに含まれていません`,
      domain,
      riskLevel: 'suspicious',
    };
  }

  /**
   * 複数のURLを一括検証
   */
  static validateMultipleUrls(urls: string[]): DomainValidationResult[] {
    return urls.map(url => this.validateNetworkAccess(url));
  }

  /**
   * 許可されたドメインのリストを取得
   */
  static getAllowedDomains(): readonly string[] {
    return ALLOWED_DOMAINS;
  }

  /**
   * 禁止されたドメインのリストを取得
   */
  static getBlockedDomains(): readonly string[] {
    return BLOCKED_DOMAINS;
  }

  /**
   * セキュリティログの生成
   */
  static logDomainAccess(url: string, result: DomainValidationResult): void {
    if (!result.isAllowed) {
      console.warn('[SECURITY] Domain access blocked:', {
        url,
        domain: result.domain,
        reason: result.reason,
        riskLevel: result.riskLevel,
        timestamp: new Date().toISOString(),
      });
    } else {
      console.info('[SECURITY] Domain access allowed:', {
        url,
        domain: result.domain,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * フェッチリクエストの事前検証
   */
  static validateFetchRequest(url: string): boolean {
    const result = this.validateNetworkAccess(url);
    this.logDomainAccess(url, result);
    return result.isAllowed;
  }
}

export default DomainWhitelist;