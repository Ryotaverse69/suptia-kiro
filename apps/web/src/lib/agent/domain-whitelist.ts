/**
 * Domain whitelist for network access restrictions
 * ネットワークアクセス制限のためのドメインホワイトリスト
 */

export interface DomainValidationResult {
  allowed: boolean;
  domain: string;
  reason: string;
  matchedPattern?: string;
}

export interface NetworkAccessConfig {
  allowedDomains: string[];
  blockedDomains: string[];
  requireHttps: boolean;
  allowLocalhost: boolean;
}

/**
 * Default allowed domains for Suptia platform
 * Suptiaプラットフォームのデフォルト許可ドメイン
 */
const DEFAULT_ALLOWED_DOMAINS = [
  // Sanity CMS domains
  "*.sanity.io",
  "sanity.io",
  "cdn.sanity.io",
  "api.sanity.io",

  // Company domains
  "*.suptia.com",
  "suptia.com",
  "www.suptia.com",
  "api.suptia.com",

  // Development environments
  "localhost",
  "127.0.0.1",
  "0.0.0.0",

  // Local development ports (common Next.js ports)
  "localhost:3000",
  "localhost:3001",
  "localhost:8080",
  "127.0.0.1:3000",
  "127.0.0.1:3001",
  "127.0.0.1:8080",
];

/**
 * Domains that are explicitly blocked for security reasons
 * セキュリティ上の理由で明示的にブロックされるドメイン
 */
const DEFAULT_BLOCKED_DOMAINS = [
  // Potentially dangerous domains
  "bit.ly",
  "tinyurl.com",
  "goo.gl",
  "t.co",

  // File sharing services
  "dropbox.com",
  "drive.google.com",
  "onedrive.live.com",

  // Code execution services
  "repl.it",
  "codesandbox.io",
  "codepen.io",
  "jsfiddle.net",
];

const DEFAULT_CONFIG: NetworkAccessConfig = {
  allowedDomains: DEFAULT_ALLOWED_DOMAINS,
  blockedDomains: DEFAULT_BLOCKED_DOMAINS,
  requireHttps: true,
  allowLocalhost: true,
};

export class DomainWhitelist {
  private config: NetworkAccessConfig;

  constructor(config: Partial<NetworkAccessConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Extract domain from URL
   * URLからドメインを抽出
   */
  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      // If URL parsing fails, try to extract domain manually
      const match = url.match(/^(?:https?:\/\/)?([^\/\s:]+)/);
      return match ? match[1] : url;
    }
  }

  /**
   * Check if domain matches a pattern (supports wildcards)
   * ドメインがパターンにマッチするかチェック（ワイルドカード対応）
   */
  private matchesDomainPattern(domain: string, pattern: string): boolean {
    // Convert wildcard pattern to regex
    const regexPattern = pattern.replace(/\./g, "\\.").replace(/\*/g, ".*");

    const regex = new RegExp(`^${regexPattern}$`, "i");
    return regex.test(domain);
  }

  /**
   * Validate if domain is allowed
   * ドメインが許可されているかを検証
   */
  isDomainAllowed(domain: string): boolean {
    const result = this.validateDomain(domain);
    return result.allowed;
  }

  /**
   * Comprehensive domain validation
   * 包括的なドメイン検証
   */
  validateDomain(domain: string): DomainValidationResult {
    const cleanDomain = domain.toLowerCase().trim();

    // Check if domain is explicitly blocked
    const blockedPattern = this.config.blockedDomains.find((blocked) =>
      this.matchesDomainPattern(cleanDomain, blocked),
    );

    if (blockedPattern) {
      return {
        allowed: false,
        domain: cleanDomain,
        reason: "Domain is explicitly blocked for security reasons",
        matchedPattern: blockedPattern,
      };
    }

    // Check if domain is in allowed list
    const allowedPattern = this.config.allowedDomains.find((allowed) =>
      this.matchesDomainPattern(cleanDomain, allowed),
    );

    if (allowedPattern) {
      return {
        allowed: true,
        domain: cleanDomain,
        reason: "Domain is in allowed list",
        matchedPattern: allowedPattern,
      };
    }

    // Check localhost special case
    if (this.config.allowLocalhost && this.isLocalhost(cleanDomain)) {
      return {
        allowed: true,
        domain: cleanDomain,
        reason: "Localhost access is permitted",
      };
    }

    // Default: deny
    return {
      allowed: false,
      domain: cleanDomain,
      reason: "Domain not in allowed list",
    };
  }

  /**
   * Validate network access for a URL
   * URLのネットワークアクセスを検証
   */
  validateNetworkAccess(url: string): DomainValidationResult & {
    protocol?: string;
    port?: string;
  } {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      const protocol = urlObj.protocol;
      const port = urlObj.port;

      // Check HTTPS requirement
      if (
        this.config.requireHttps &&
        protocol !== "https:" &&
        !this.isLocalhost(domain)
      ) {
        return {
          allowed: false,
          domain,
          protocol,
          port,
          reason: "HTTPS is required for external domains",
        };
      }

      const domainResult = this.validateDomain(domain);
      return {
        ...domainResult,
        protocol,
        port,
      };
    } catch (error) {
      return {
        allowed: false,
        domain: url,
        reason: `Invalid URL format: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  /**
   * Check if domain is localhost or local IP
   * ドメインがlocalhostまたはローカルIPかチェック
   */
  private isLocalhost(domain: string): boolean {
    const localhostPatterns = ["localhost", "127.0.0.1", "0.0.0.0", "::1"];

    return localhostPatterns.some(
      (pattern) => domain === pattern || domain.startsWith(`${pattern}:`),
    );
  }

  /**
   * Get list of allowed domains
   * 許可されたドメインのリストを取得
   */
  getAllowedDomains(): string[] {
    return [...this.config.allowedDomains];
  }

  /**
   * Get list of blocked domains
   * ブロックされたドメインのリストを取得
   */
  getBlockedDomains(): string[] {
    return [...this.config.blockedDomains];
  }

  /**
   * Add domain to allowed list
   * ドメインを許可リストに追加
   */
  addAllowedDomain(domain: string): void {
    if (!this.config.allowedDomains.includes(domain)) {
      this.config.allowedDomains.push(domain);
    }
  }

  /**
   * Remove domain from allowed list
   * ドメインを許可リストから削除
   */
  removeAllowedDomain(domain: string): void {
    const index = this.config.allowedDomains.indexOf(domain);
    if (index > -1) {
      this.config.allowedDomains.splice(index, 1);
    }
  }

  /**
   * Generate security report for URL access
   * URLアクセスのセキュリティレポートを生成
   */
  generateAccessReport(urls: string[]): {
    allowed: string[];
    blocked: string[];
    warnings: string[];
  } {
    const allowed: string[] = [];
    const blocked: string[] = [];
    const warnings: string[] = [];

    urls.forEach((url) => {
      const result = this.validateNetworkAccess(url);

      if (result.allowed) {
        allowed.push(url);
      } else {
        blocked.push(url);
      }

      // Add warnings for specific cases
      if (result.protocol === "http:" && !this.isLocalhost(result.domain)) {
        warnings.push(`HTTP used for external domain: ${url}`);
      }

      if (result.matchedPattern?.includes("*")) {
        warnings.push(
          `Wildcard pattern matched: ${url} -> ${result.matchedPattern}`,
        );
      }
    });

    return { allowed, blocked, warnings };
  }
}

// Export singleton instance
export const domainWhitelist = new DomainWhitelist();

// Export utility functions
export function isDomainAllowed(domain: string): boolean {
  return domainWhitelist.isDomainAllowed(domain);
}

export function validateNetworkAccess(url: string): DomainValidationResult {
  return domainWhitelist.validateNetworkAccess(url);
}

export function checkUrlSafety(url: string): boolean {
  const result = domainWhitelist.validateNetworkAccess(url);
  return result.allowed;
}

// Export constants for external use
export { DEFAULT_ALLOWED_DOMAINS, DEFAULT_BLOCKED_DOMAINS };
