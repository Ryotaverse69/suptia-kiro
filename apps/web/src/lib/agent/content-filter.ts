/**
 * LLMエージェント用コンテンツフィルター
 * 外部指示の検出と実行防止を行う
 */

export interface ContentFilterConfig {
  /** 検出対象の危険な指示パターン */
  dangerousPatterns: string[];
  /** 許可される操作パターン */
  allowedPatterns: string[];
  /** 厳格モード（より厳しい検出） */
  strictMode: boolean;
}

export interface FilterResult {
  /** 外部指示が検出されたか */
  isExternalInstruction: boolean;
  /** 検出された危険パターン */
  detectedPatterns: string[];
  /** フィルター後の安全なコンテンツ */
  sanitizedContent: string;
  /** 警告メッセージ */
  warnings: string[];
}

/**
 * デフォルトの危険パターン
 * 外部コンテンツに含まれる可能性のある指示を検出
 * 注意: 単語境界を考慮して誤検出を防ぐ
 */
const DEFAULT_DANGEROUS_PATTERNS = [
  // システム操作（高危険度）
  'sudo',
  'chmod',
  'chown',
  'rm -rf',
  'format',
  'shutdown',
  'reboot',
  
  // ネットワーク操作（高危険度）
  'curl',
  'wget',
  'download',
  'upload',
  
  // データベース操作（高危険度）
  'drop table',
  'truncate',
  'delete from',
  
  // Git操作（中危険度）
  'git commit',
  'git push',
  'git pull',
  'git merge',
  'git reset',
  'git clone',
  
  // 直接的な実行指示（中危険度）
  'execute this',
  'run this',
  'install',
  
  // ファイル操作（中危険度）
  'delete file',
  'remove file',
  'modify file',
  'write file',
  'save file',
  
  // 日本語の危険指示
  '実行して',
  '削除して',
  'ファイルを削除',
  'ファイルを変更',
  'ファイルを作成',
  'コミットして',
  'プッシュして',
];

/**
 * 許可される操作パターン
 * 要約や分析など、安全な操作のみ許可
 */
const DEFAULT_ALLOWED_PATTERNS = [
  'summarize',
  'analyze',
  'explain',
  'describe',
  'list',
  'show',
  'display',
  'view',
  'read',
  'get',
  
  // 日本語の安全な操作
  '要約',
  '分析',
  '説明',
  '表示',
  '確認',
  '取得',
];

export class ContentFilter {
  private config: ContentFilterConfig;

  constructor(config?: Partial<ContentFilterConfig>) {
    this.config = {
      dangerousPatterns: DEFAULT_DANGEROUS_PATTERNS,
      allowedPatterns: DEFAULT_ALLOWED_PATTERNS,
      strictMode: true,
      ...config,
    };
  }

  /**
   * 外部指示が含まれているかを検出
   */
  isExternalInstruction(content: string): boolean {
    const result = this.filterContent(content);
    return result.isExternalInstruction;
  }

  /**
   * コンテンツをフィルタリングして安全化
   */
  filterContent(content: string): FilterResult {
    const detectedPatterns: string[] = [];
    const warnings: string[] = [];
    let isExternalInstruction = false;

    // 危険パターンの検出
    for (const pattern of this.config.dangerousPatterns) {
      const regex = new RegExp(pattern, 'gi');
      if (regex.test(content)) {
        detectedPatterns.push(pattern);
        isExternalInstruction = true;
      }
    }

    // 厳格モードでの追加チェック
    if (this.config.strictMode) {
      // 危険な命令形のみ検出（安全な要約・分析指示は除外）
      const dangerousImperativePatterns = [
        /you\s+should\s+(execute|run|delete|install|modify)/gi,
        /you\s+must\s+(execute|run|delete|install|modify)/gi,
        /しなさい/g,
      ];

      // 安全な指示かどうかをチェック
      const safeJapanesePatterns = [
        /要約/g,
        /分析/g,
        /説明/g,
        /表示/g,
        /確認/g,
        /取得/g,
      ];

      const hasSafePattern = safeJapanesePatterns.some(pattern => pattern.test(content));
      
      // 「してください」は安全パターンが含まれていない場合のみ危険と判定
      if (!hasSafePattern && /してください/g.test(content)) {
        dangerousImperativePatterns.push(/してください/g);
      }
      if (!hasSafePattern && /してくれ/g.test(content)) {
        dangerousImperativePatterns.push(/してくれ/g);
      }

      for (const pattern of dangerousImperativePatterns) {
        if (pattern.test(content)) {
          detectedPatterns.push(pattern.source);
          isExternalInstruction = true;
        }
      }
    }

    // 警告メッセージの生成
    if (isExternalInstruction) {
      warnings.push('外部指示が検出されました。要約のみ実行します。');
      if (detectedPatterns.length > 0) {
        warnings.push(`検出されたパターン: ${detectedPatterns.join(', ')}`);
      }
    }

    // 安全化されたコンテンツの生成
    const sanitizedContent = this.sanitizeContent(content, isExternalInstruction);

    return {
      isExternalInstruction,
      detectedPatterns,
      sanitizedContent,
      warnings,
    };
  }

  /**
   * コンテンツの安全化
   * 外部指示が検出された場合は要約のみを許可
   */
  private sanitizeContent(content: string, hasExternalInstruction: boolean): string {
    if (!hasExternalInstruction) {
      return content;
    }

    // 外部指示が検出された場合は要約プレフィックスを追加
    return `[要約のみ実行] ${content}`;
  }

  /**
   * 設定の更新
   */
  updateConfig(config: Partial<ContentFilterConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 危険パターンの追加
   */
  addDangerousPattern(pattern: string): void {
    if (!this.config.dangerousPatterns.includes(pattern)) {
      this.config.dangerousPatterns.push(pattern);
    }
  }

  /**
   * 許可パターンの追加
   */
  addAllowedPattern(pattern: string): void {
    if (!this.config.allowedPatterns.includes(pattern)) {
      this.config.allowedPatterns.push(pattern);
    }
  }
}

// デフォルトインスタンス
export const defaultContentFilter = new ContentFilter();

/**
 * 簡易フィルター関数
 */
export function filterExternalContent(content: string): FilterResult {
  return defaultContentFilter.filterContent(content);
}

/**
 * 外部指示検出の簡易関数
 */
export function hasExternalInstruction(content: string): boolean {
  return defaultContentFilter.isExternalInstruction(content);
}