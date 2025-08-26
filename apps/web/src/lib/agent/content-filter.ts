/**
 * Content Filter for LLM Agent Safety
 * 外部指示の検出と実行防止機能
 */

// 外部指示として検出すべきパターン
const EXTERNAL_INSTRUCTION_PATTERNS = [
  // 直接的な指示
  /ignore\s+(?:previous\s+)?instructions?/i,
  /forget\s+everything/i,
  /new\s+instructions?/i,
  /override\s+instructions?/i,
  /system\s+prompt/i,
  
  // 役割変更の試み
  /you\s+are\s+now/i,
  /act\s+as/i,
  /pretend\s+to\s+be/i,
  /roleplay\s+as/i,
  
  // 制限回避の試み
  /bypass\s+security/i,
  /ignore\s+safety/i,
  /disable\s+filter/i,
  /remove\s+restrictions?/i,
  
  // 情報抽出の試み
  /what\s+are\s+your\s+instructions/i,
  /show\s+me\s+your\s+prompt/i,
  /reveal\s+your\s+system/i,
  
  // 日本語での指示
  /前の指示を無視/i,
  /新しい指示/i,
  /システムプロンプト/i,
  /役割を変更/i,
  /制限を無視/i,
  /セキュリティを回避/i,
];

// 疑わしいコマンドパターン
const SUSPICIOUS_COMMAND_PATTERNS = [
  // システムコマンド
  /rm\s+-rf/i,
  /sudo\s+/i,
  /chmod\s+777/i,
  /curl\s+.*\|\s*sh/i,
  /wget\s+.*\|\s*sh/i,
  
  // Git操作
  /git\s+push\s+--force/i,
  /git\s+reset\s+--hard/i,
  /git\s+clean\s+-fd/i,
  
  // ファイル操作
  />\s*\/etc\//i,
  />\s*\/root\//i,
  />\s*\/home\//i,
];

// 許可されたドメイン以外への接続試行
const EXTERNAL_URL_PATTERNS = [
  /https?:\/\/(?!.*(?:sanity\.io|suptia\.com|localhost|127\.0\.0\.1))/i,
];

export interface ContentFilterResult {
  isBlocked: boolean;
  reason: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  detectedPatterns: string[];
}

export class ContentFilter {
  /**
   * 外部指示が含まれているかチェック
   */
  static isExternalInstruction(content: string): boolean {
    return EXTERNAL_INSTRUCTION_PATTERNS.some(pattern => pattern.test(content));
  }

  /**
   * 疑わしいコマンドが含まれているかチェック
   */
  static hasSuspiciousCommands(content: string): boolean {
    return SUSPICIOUS_COMMAND_PATTERNS.some(pattern => pattern.test(content));
  }

  /**
   * 外部URLへのアクセス試行をチェック
   */
  static hasExternalUrls(content: string): boolean {
    return EXTERNAL_URL_PATTERNS.some(pattern => pattern.test(content));
  }

  /**
   * コンテンツの包括的なフィルタリング
   */
  static filterContent(content: string): ContentFilterResult {
    const detectedPatterns: string[] = [];
    const riskLevels: ContentFilterResult['riskLevel'][] = [];
    const reasons: string[] = [];

    // 外部指示の検出
    if (this.isExternalInstruction(content)) {
      detectedPatterns.push('external_instruction');
      riskLevels.push('critical');
      reasons.push('外部指示の実行試行が検出されました');
    }

    // 疑わしいコマンドの検出
    if (this.hasSuspiciousCommands(content)) {
      detectedPatterns.push('suspicious_command');
      riskLevels.push('high');
      reasons.push('危険なコマンドの実行試行が検出されました');
    }

    // 外部URLの検出
    if (this.hasExternalUrls(content)) {
      detectedPatterns.push('external_url');
      riskLevels.push('medium');
      reasons.push('許可されていないドメインへのアクセス試行が検出されました');
    }

    const isBlocked = detectedPatterns.length > 0;

    // 最も高いリスクレベルを選択
    let finalRiskLevel: ContentFilterResult['riskLevel'] = 'low';
    if (riskLevels.includes('critical')) {
      finalRiskLevel = 'critical';
    } else if (riskLevels.includes('high')) {
      finalRiskLevel = 'high';
    } else if (riskLevels.includes('medium')) {
      finalRiskLevel = 'medium';
    }

    return {
      isBlocked,
      reason: reasons.length > 0 ? reasons[0] : 'コンテンツは安全です',
      riskLevel: finalRiskLevel,
      detectedPatterns,
    };
  }

  /**
   * コンテンツのサニタイゼーション（要約のみ許可）
   */
  static sanitizeContent(content: string): string {
    const filterResult = this.filterContent(content);
    
    if (filterResult.isBlocked) {
      return `[BLOCKED: ${filterResult.reason}] - 要約のみ提供可能です。`;
    }

    return content;
  }

  /**
   * セキュリティログの生成
   */
  static logSecurityEvent(content: string, filterResult: ContentFilterResult): void {
    if (filterResult.isBlocked) {
      console.warn('[SECURITY] Content blocked:', {
        reason: filterResult.reason,
        riskLevel: filterResult.riskLevel,
        detectedPatterns: filterResult.detectedPatterns,
        timestamp: new Date().toISOString(),
        contentPreview: content.substring(0, 100) + '...',
      });
    }
  }
}

export default ContentFilter;