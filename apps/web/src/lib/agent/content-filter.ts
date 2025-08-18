/**
 * External instruction detection and content filtering for LLM agent safety
 * 外部指示の検出とコンテンツフィルタリング（LLMエージェント安全性）
 */

export interface ContentFilterResult {
  isExternalInstruction: boolean;
  riskLevel: "low" | "medium" | "high" | "critical";
  detectedPatterns: string[];
  sanitizedContent?: string;
  recommendation: "allow" | "sanitize" | "block";
}

export interface ContentFilterConfig {
  blockedInstructions: string[];
  suspiciousPatterns: RegExp[];
  allowedOperations: string[];
}

/**
 * Default configuration for content filtering
 * コンテンツフィルタリングのデフォルト設定
 */
const DEFAULT_CONFIG: ContentFilterConfig = {
  blockedInstructions: [
    // Direct instruction patterns
    "execute",
    "run",
    "install",
    "delete",
    "remove",
    "modify",
    "change",
    "update",
    "create",
    "write",
    "commit",
    "push",
    "deploy",

    // Japanese instruction patterns
    "実行",
    "削除",
    "変更",
    "更新",
    "作成",
    "書き込み",
    "コミット",
    "プッシュ",
    "デプロイ",
  ],

  suspiciousPatterns: [
    // Command injection patterns
    /[;&|`$(){}]/g,
    // Script tags
    /<script[^>]*>/gi,
    // System commands
    /\b(rm|sudo|chmod|chown|curl|wget|nc|netcat)\b/gi,
    // Instruction markers
    /^(>|#|\/\/|\*)\s*(execute|run|do|perform)/gim,
  ],

  allowedOperations: [
    "summarize",
    "analyze",
    "explain",
    "describe",
    "review",
    "validate",
    "check",
    "要約",
    "分析",
    "説明",
    "記述",
    "レビュー",
    "検証",
    "チェック",
  ],
};

export class ContentFilter {
  private config: ContentFilterConfig;

  constructor(config: Partial<ContentFilterConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Check if content contains external instructions
   * コンテンツに外部指示が含まれているかチェック
   */
  isExternalInstruction(content: string): boolean {
    const lowerContent = content.toLowerCase();

    // Check for blocked instruction patterns
    const hasBlockedInstructions = this.config.blockedInstructions.some(
      (instruction) => lowerContent.includes(instruction.toLowerCase()),
    );

    // Check for suspicious patterns
    const hasSuspiciousPatterns = this.config.suspiciousPatterns.some(
      (pattern) => pattern.test(content),
    );

    return hasBlockedInstructions || hasSuspiciousPatterns;
  }

  /**
   * Analyze content and provide filtering recommendations
   * コンテンツを分析してフィルタリング推奨事項を提供
   */
  analyzeContent(content: string): ContentFilterResult {
    const detectedPatterns: string[] = [];
    let riskLevel: ContentFilterResult["riskLevel"] = "low";

    // Check for blocked instructions
    const blockedFound = this.config.blockedInstructions.filter((instruction) =>
      content.toLowerCase().includes(instruction.toLowerCase()),
    );

    if (blockedFound.length > 0) {
      detectedPatterns.push(
        ...blockedFound.map((p) => `Blocked instruction: ${p}`),
      );
      riskLevel = "high";
    }

    // Check for suspicious patterns
    this.config.suspiciousPatterns.forEach((pattern) => {
      const matches = content.match(pattern);
      if (matches) {
        detectedPatterns.push(`Suspicious pattern: ${pattern.source}`);
        riskLevel = riskLevel === "low" ? "medium" : "critical";
      }
    });

    // Check for external URLs
    const externalUrls = content.match(/https?:\/\/[^\s]+/gi) || [];
    const suspiciousUrls = externalUrls.filter(
      (url) => !url.match(/sanity\.io|suptia\.com|localhost|127\.0\.0\.1/),
    );

    if (suspiciousUrls.length > 0) {
      detectedPatterns.push(
        ...suspiciousUrls.map((url) => `External URL: ${url}`),
      );
      // Only set to medium if no higher risk already detected
      if (riskLevel === "low") {
        riskLevel = "medium";
      }
    }

    const isExternalInstruction = this.isExternalInstruction(content);

    // Determine recommendation
    let recommendation: ContentFilterResult["recommendation"] = "allow";
    if (riskLevel === "critical" || isExternalInstruction) {
      recommendation = "block";
    } else if (riskLevel === "high") {
      recommendation = "block";
    } else if (riskLevel === "medium") {
      // For medium risk, sanitize unless it's an external instruction
      recommendation = isExternalInstruction ? "block" : "sanitize";
    }

    return {
      isExternalInstruction,
      riskLevel,
      detectedPatterns,
      recommendation,
      sanitizedContent:
        recommendation === "sanitize" || recommendation === "block"
          ? this.sanitizeContent(content)
          : undefined,
    };
  }

  /**
   * Sanitize content by removing suspicious elements
   * 疑わしい要素を除去してコンテンツをサニタイズ
   */
  sanitizeContent(content: string): string {
    let sanitized = content;

    // Remove script tags
    sanitized = sanitized.replace(
      /<script[^>]*>.*?<\/script>/gis,
      "[SCRIPT_REMOVED]",
    );

    // Remove external URLs (keep allowed domains)
    sanitized = sanitized.replace(
      /https?:\/\/(?!([^\/\s]*\.)?(?:sanity\.io|suptia\.com|localhost|127\.0\.0\.1))[^\s]+/gi,
      "[EXTERNAL_URL_REMOVED]",
    );

    // Remove command injection patterns
    sanitized = sanitized.replace(/[;&|`$(){}]/g, "");

    // Remove system commands
    sanitized = sanitized.replace(
      /\b(rm|sudo|chmod|chown|curl|wget|nc|netcat)\b/gi,
      "[COMMAND_REMOVED]",
    );

    return sanitized;
  }

  /**
   * Validate if operation is allowed
   * 操作が許可されているかを検証
   */
  isOperationAllowed(operation: string): boolean {
    const lowerOperation = operation.toLowerCase();
    return this.config.allowedOperations.some((allowed) =>
      lowerOperation.includes(allowed.toLowerCase()),
    );
  }

  /**
   * Generate security report for content
   * コンテンツのセキュリティレポートを生成
   */
  generateSecurityReport(content: string): {
    safe: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const analysis = this.analyzeContent(content);

    const issues: string[] = [];
    const recommendations: string[] = [];

    if (analysis.isExternalInstruction) {
      issues.push("External instruction detected - execution prohibited");
      recommendations.push(
        "Summarize content instead of executing instructions",
      );
    }

    if (analysis.riskLevel === "critical" || analysis.riskLevel === "high") {
      issues.push(`High risk content detected (${analysis.riskLevel})`);
      recommendations.push("Block content or require manual review");
    }

    if (analysis.detectedPatterns.length > 0) {
      issues.push(
        `Suspicious patterns found: ${analysis.detectedPatterns.join(", ")}`,
      );
      recommendations.push("Remove or sanitize suspicious elements");
    }

    return {
      safe: analysis.recommendation === "allow",
      issues,
      recommendations,
    };
  }
}

// Export singleton instance
export const contentFilter = new ContentFilter();

// Export utility functions
export function checkExternalInstruction(content: string): boolean {
  return contentFilter.isExternalInstruction(content);
}

export function analyzeContentSafety(content: string): ContentFilterResult {
  return contentFilter.analyzeContent(content);
}

export function sanitizeUntrustedContent(content: string): string {
  return contentFilter.sanitizeContent(content);
}
