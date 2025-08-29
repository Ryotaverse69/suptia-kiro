import { Operation, TrustDecision, TrustPolicy, RiskLevel, OperationType, ExecutionResult } from './types.js';
import { PolicyManager } from './policy-manager.js';
import { OperationClassifier } from './operation-classifier.js';
import { AuditLogger } from './audit-logger.js';
import { SecurityProtectionSystem, SecurityAction } from './security-protection.js';
import { PerformanceOptimizer } from './performance-optimizer.js';

/**
 * Trust判定エンジン - 操作要求を受け取り、自動承認・手動承認を判定するメインエンジン
 * 
 * 要件7.1, 8.1に基づいて実装：
 * - 操作要求を受け取り、自動承認・手動承認の判定を行う
 * - ポリシー評価器とセキュリティ検証器を統合
 * - 100ms以内の高速判定処理を実現
 */
export class TrustDecisionEngine {
  private policyManager: PolicyManager;
  private operationClassifier: OperationClassifier;
  private securityProtectionSystem: SecurityProtectionSystem;
  private securityVerifier: SecurityVerifier;
  private policyEvaluator: PolicyEvaluator;
  private auditLogger: AuditLogger;
  
  // パフォーマンス最適化システム
  private performanceOptimizer: PerformanceOptimizer;
  private performanceMetrics: PerformanceMetrics;
  
  // 従来のキャッシュ機能（後方互換性のため）
  private decisionCache: Map<string, CachedDecision>;
  private readonly CACHE_TTL = 60000; // 1分間キャッシュ
  private readonly MAX_CACHE_SIZE = 1000;

  constructor() {
    this.policyManager = new PolicyManager();
    this.operationClassifier = new OperationClassifier();
    this.securityProtectionSystem = new SecurityProtectionSystem();
    this.securityVerifier = new SecurityVerifier();
    this.policyEvaluator = new PolicyEvaluator();
    this.auditLogger = new AuditLogger();
    this.performanceOptimizer = new PerformanceOptimizer();
    this.performanceMetrics = new PerformanceMetrics();
    this.decisionCache = new Map();
    
    // 初期化時に頻繁操作の事前計算を実行
    this.initializePerformanceOptimization();
  }

  /**
   * 操作要求を評価し、Trust判定を行う
   * 要件7.1: 100ms以内の高速判定処理
   * パフォーマンス最適化システムを使用
   */
  async evaluateOperation(operation: Operation): Promise<TrustDecision> {
    const startTime = performance.now();
    
    try {
      // 1. パフォーマンス最適化システムによる高速評価を試行
      const optimizedDecision = await this.performanceOptimizer.optimizedEvaluate(operation);
      if (optimizedDecision) {
        this.recordPerformance(startTime, 'optimized');
        return optimizedDecision;
      }

      // 2. 従来のキャッシュチェック（フォールバック）
      const cacheKey = this.generateCacheKey(operation);
      const cachedDecision = this.getCachedDecision(cacheKey);
      if (cachedDecision) {
        this.recordPerformance(startTime, 'cache-hit');
        return cachedDecision.decision;
      }

      // 1. 包括的セキュリティ保護チェック（最優先）
      const securityCheckResult = await this.securityProtectionSystem.performSecurityCheck(operation);
      if (!securityCheckResult.passed) {
        const decision: TrustDecision = {
          approved: false,
          requiresManualApproval: true,
          reason: securityCheckResult.reason,
          riskLevel: securityCheckResult.riskLevel
        };
        
        // セキュリティアクションに応じた追加処理
        await this.handleSecurityAction(securityCheckResult.action, operation, securityCheckResult);
        
        this.cacheDecision(cacheKey, decision);
        this.recordPerformance(startTime, 'security-blocked');
        return decision;
      }

      // 2. 従来のセキュリティ検証（後方互換性のため）
      const securityResult = await this.securityVerifier.verifyOperation(operation);
      if (!securityResult.isSecure) {
        const decision: TrustDecision = {
          approved: false,
          requiresManualApproval: true,
          reason: `セキュリティ検証失敗: ${securityResult.reason}`,
          riskLevel: RiskLevel.CRITICAL
        };
        
        this.cacheDecision(cacheKey, decision);
        this.recordPerformance(startTime, 'security-blocked');
        return decision;
      }

      // 3. 操作分類
      const classification = this.operationClassifier.classifyOperation(operation);

      // 4. ポリシー評価
      const policy = await this.policyManager.loadPolicy();
      const policyResult = await this.policyEvaluator.evaluateAgainstPolicy(
        operation, 
        classification, 
        policy
      );

      // 5. 最終判定
      const decision = this.makeFinalDecision(operation, classification, policyResult, securityResult);

      // キャッシュに保存
      this.cacheDecision(cacheKey, decision);
      
      // パフォーマンス記録
      this.recordPerformance(startTime, 'success');
      
      return decision;
    } catch (error) {
      console.error('Trust判定エンジンでエラーが発生しました:', error);
      
      // エラー時は安全側に倒す（要件8.1）
      const fallbackDecision: TrustDecision = {
        approved: false,
        requiresManualApproval: true,
        reason: `システムエラーのため手動承認が必要です: ${error instanceof Error ? error.message : 'Unknown error'}`,
        riskLevel: RiskLevel.HIGH
      };
      
      this.recordPerformance(startTime, 'error');
      return fallbackDecision;
    }
  }

  /**
   * ポリシー設定を更新する
   */
  async updatePolicy(policy: TrustPolicy): Promise<void> {
    await this.policyManager.updatePolicy(policy);
    this.clearCache(); // ポリシー更新時はキャッシュをクリア
  }

  /**
   * 操作履歴を取得する
   */
  getOperationHistory(): OperationLog[] {
    return this.performanceMetrics.getOperationHistory();
  }

  /**
   * パフォーマンス統計を取得する
   */
  getPerformanceStats(): PerformanceStats {
    const basicStats = this.performanceMetrics.getStats();
    const optimizedStats = this.performanceOptimizer.getPerformanceStats();
    
    return {
      ...basicStats,
      optimization: optimizedStats
    };
  }

  /**
   * パフォーマンス最適化の初期化
   */
  private async initializePerformanceOptimization(): Promise<void> {
    try {
      // 頻繁操作の事前計算を非同期で実行
      setImmediate(async () => {
        await this.performanceOptimizer.precomputeFrequentOperations();
      });
    } catch (error) {
      console.error('パフォーマンス最適化の初期化に失敗しました:', error);
    }
  }

  /**
   * 手動でパフォーマンス最適化を実行
   */
  async optimizePerformance(): Promise<void> {
    await this.performanceOptimizer.precomputeFrequentOperations();
  }

  /**
   * 操作実行結果をログに記録する
   * 要件4.1, 4.2に基づいて実装
   */
  async logOperationResult(
    operation: Operation,
    decision: TrustDecision,
    executionResult?: ExecutionResult,
    user?: string,
    sessionId?: string
  ): Promise<void> {
    try {
      if (decision.requiresManualApproval) {
        // 手動承認操作のログ記録
        await this.auditLogger.logManualApproval(
          operation,
          decision,
          executionResult,
          user,
          sessionId
        );
      } else {
        // 自動承認操作のログ記録
        await this.auditLogger.logAutoApproval(
          operation,
          decision,
          executionResult,
          user,
          sessionId
        );
      }
    } catch (error) {
      // 要件4.4: ログ記録失敗時はエラーを報告し、操作は継続
      console.error('操作結果のログ記録に失敗しました:', error);
    }
  }

  /**
   * 監査ログの統計情報を取得する
   */
  async getAuditLogStats(days: number = 7): Promise<{
    autoApprovals: number;
    manualApprovals: number;
    errors: number;
    totalOperations: number;
  }> {
    return await this.auditLogger.getLogStats(days);
  }

  /**
   * セキュリティ統計を取得する
   */
  async getSecurityStats(days: number = 7): Promise<any> {
    return await this.securityProtectionSystem.getSecurityStats(days);
  }

  /**
   * セキュリティ状態を取得する
   */
  getSecurityState(): any {
    return this.securityProtectionSystem.getSecurityState();
  }

  /**
   * 手動承認モードから自動承認モードに復帰する
   */
  async restoreAutoApprovalMode(reason: string = 'Manual restoration'): Promise<void> {
    await this.securityProtectionSystem.restoreAutoApprovalMode(reason);
  }

  /**
   * セキュリティアクションを処理する
   */
  private async handleSecurityAction(
    action: SecurityAction, 
    operation: Operation, 
    securityResult: any
  ): Promise<void> {
    switch (action) {
      case SecurityAction.SWITCH_TO_MANUAL_MODE:
        console.warn('セキュリティ保護により手動承認モードに切り替えました');
        break;
        
      case SecurityAction.RESTORE_DEFAULT_CONFIG:
        console.warn('設定ファイル改ざんを検出し、デフォルト設定に復帰しました');
        break;
        
      case SecurityAction.REJECT_AND_LOG:
        console.warn('セキュリティ脅威を検出し、操作を拒否しました');
        break;
        
      case SecurityAction.ALLOW:
        // 何もしない
        break;
        
      default:
        console.warn('未知のセキュリティアクション:', action);
    }

    // セキュリティイベントをログに記録
    await this.auditLogger.logSecurityEvent({
      type: 'security_action',
      description: `セキュリティアクション実行: ${action}`,
      timestamp: new Date(),
      severity: action === SecurityAction.ALLOW ? 'info' : 'high',
      details: {
        operation: {
          command: operation.command,
          args: operation.args,
          type: operation.type
        },
        securityResult
      }
    });
  }

  /**
   * 最終判定を行う
   */
  private makeFinalDecision(
    operation: Operation,
    classification: any,
    policyResult: PolicyEvaluationResult,
    securityResult: SecurityVerificationResult
  ): TrustDecision {
    // セキュリティ検証で問題がある場合は手動承認
    if (!securityResult.isSecure) {
      return {
        approved: false,
        requiresManualApproval: true,
        reason: `セキュリティ上の理由: ${securityResult.reason}`,
        riskLevel: RiskLevel.HIGH
      };
    }

    // 分類結果で手動承認が必要な場合
    if (classification.requiresManualApproval) {
      return {
        approved: false,
        requiresManualApproval: true,
        reason: classification.reason,
        riskLevel: classification.riskLevel
      };
    }

    // ポリシー評価で拒否された場合
    if (!policyResult.allowed) {
      return {
        approved: false,
        requiresManualApproval: true,
        reason: `ポリシー違反: ${policyResult.reason}`,
        riskLevel: policyResult.riskLevel || RiskLevel.MEDIUM
      };
    }

    // すべてのチェックを通過した場合は自動承認
    return {
      approved: true,
      requiresManualApproval: false,
      reason: policyResult.reason || '自動承認されました',
      riskLevel: classification.riskLevel
    };
  }

  /**
   * キャッシュキーを生成する
   */
  private generateCacheKey(operation: Operation): string {
    const keyData = {
      command: operation.command,
      args: operation.args.join(' '),
      type: operation.type,
      mcpServer: operation.context?.mcpServer,
      mcpTool: operation.context?.mcpTool
    };
    
    return JSON.stringify(keyData);
  }

  /**
   * キャッシュされた判定を取得する
   */
  private getCachedDecision(cacheKey: string): CachedDecision | null {
    const cached = this.decisionCache.get(cacheKey);
    if (!cached) {
      return null;
    }

    // TTLチェック
    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.decisionCache.delete(cacheKey);
      return null;
    }

    return cached;
  }

  /**
   * 判定をキャッシュに保存する
   */
  private cacheDecision(cacheKey: string, decision: TrustDecision): void {
    // キャッシュサイズ制限
    if (this.decisionCache.size >= this.MAX_CACHE_SIZE) {
      // 最も古いエントリを削除
      const oldestKey = this.decisionCache.keys().next().value;
      this.decisionCache.delete(oldestKey);
    }

    this.decisionCache.set(cacheKey, {
      decision,
      timestamp: Date.now()
    });
  }

  /**
   * キャッシュをクリアする
   */
  private clearCache(): void {
    this.decisionCache.clear();
  }

  /**
   * パフォーマンスを記録する
   */
  private recordPerformance(startTime: number, result: string): void {
    const duration = performance.now() - startTime;
    this.performanceMetrics.record(duration, result);
    
    // 100ms以内の目標を超えた場合は警告
    if (duration > 100) {
      console.warn(`Trust判定処理が目標時間を超過しました: ${duration.toFixed(2)}ms`);
    }
  }
}

/**
 * セキュリティ検証器 - セキュリティ上の脅威を検出
 * 要件8.1に基づいて実装
 */
class SecurityVerifier {
  private suspiciousPatternDetector: SuspiciousPatternDetector;
  private rateLimit: Map<string, RateLimitInfo>;
  private readonly RATE_LIMIT_WINDOW = 3600000; // 1時間

  constructor() {
    this.suspiciousPatternDetector = new SuspiciousPatternDetector();
    this.rateLimit = new Map();
  }

  /**
   * 操作のセキュリティ検証を行う
   */
  async verifyOperation(operation: Operation): Promise<SecurityVerificationResult> {
    try {
      // 1. 不審なパターンの検出
      const suspiciousResult = this.suspiciousPatternDetector.detect(operation);
      if (suspiciousResult.isSuspicious) {
        return {
          isSecure: false,
          reason: `不審なパターンを検出: ${suspiciousResult.reason}`,
          riskLevel: RiskLevel.HIGH
        };
      }

      // 2. レート制限チェック
      const rateLimitResult = this.checkRateLimit(operation);
      if (!rateLimitResult.allowed) {
        return {
          isSecure: false,
          reason: `レート制限に達しました: ${rateLimitResult.reason}`,
          riskLevel: RiskLevel.MEDIUM
        };
      }

      // 3. 外部からの不正操作要求チェック
      const externalRequestResult = this.checkExternalRequest(operation);
      if (!externalRequestResult.allowed) {
        return {
          isSecure: false,
          reason: `外部からの不正な操作要求: ${externalRequestResult.reason}`,
          riskLevel: RiskLevel.HIGH
        };
      }

      return {
        isSecure: true,
        reason: 'セキュリティ検証を通過しました',
        riskLevel: RiskLevel.LOW
      };
    } catch (error) {
      console.error('セキュリティ検証中にエラーが発生しました:', error);
      return {
        isSecure: false,
        reason: `セキュリティ検証エラー: ${error instanceof Error ? error.message : 'Unknown error'}`,
        riskLevel: RiskLevel.HIGH
      };
    }
  }

  /**
   * レート制限をチェックする
   */
  private checkRateLimit(operation: Operation): { allowed: boolean; reason: string } {
    const user = operation.context?.user || 'unknown';
    const now = Date.now();
    
    // 古いエントリをクリーンアップ
    this.cleanupRateLimit(now);
    
    const rateLimitInfo = this.rateLimit.get(user) || { count: 0, windowStart: now };
    
    // 新しいウィンドウの場合はリセット
    if (now - rateLimitInfo.windowStart > this.RATE_LIMIT_WINDOW) {
      rateLimitInfo.count = 0;
      rateLimitInfo.windowStart = now;
    }
    
    rateLimitInfo.count++;
    this.rateLimit.set(user, rateLimitInfo);
    
    // デフォルトの制限値（ポリシーから取得すべきだが、フォールバック値として）
    const maxOperationsPerHour = 1000;
    
    if (rateLimitInfo.count > maxOperationsPerHour) {
      return {
        allowed: false,
        reason: `1時間あたりの操作制限(${maxOperationsPerHour})を超過しました`
      };
    }
    
    return { allowed: true, reason: 'レート制限内です' };
  }

  /**
   * 外部からの不正操作要求をチェックする
   */
  private checkExternalRequest(operation: Operation): { allowed: boolean; reason: string } {
    // セッションIDの検証
    if (!operation.context?.sessionId) {
      return {
        allowed: false,
        reason: 'セッションIDが不正です'
      };
    }

    // ユーザー情報の検証
    if (!operation.context?.user) {
      return {
        allowed: false,
        reason: 'ユーザー情報が不正です'
      };
    }

    return { allowed: true, reason: '正当な操作要求です' };
  }

  /**
   * 古いレート制限エントリをクリーンアップ
   */
  private cleanupRateLimit(now: number): void {
    for (const [user, info] of this.rateLimit.entries()) {
      if (now - info.windowStart > this.RATE_LIMIT_WINDOW) {
        this.rateLimit.delete(user);
      }
    }
  }
}

/**
 * 不審なパターン検出器
 */
class SuspiciousPatternDetector {
  private readonly SUSPICIOUS_PATTERNS = [
    // 異常な頻度での操作
    /(.+)\s+(.+)\s+(.+)\s+(.+)\s+(.+)/g, // 異常に長いコマンド
    // 不審なファイルパス
    /\.\.\//g, // ディレクトリトラバーサル
    /\/etc\/|\/var\/|\/usr\/|\/root\//g, // システムディレクトリ
    // 不審なコマンド
    /curl\s+.*\|\s*sh/g, // パイプ経由でのスクリプト実行
    /wget\s+.*\|\s*sh/g,
    // エンコードされた文字列
    /base64|eval|exec/g
  ];

  detect(operation: Operation): { isSuspicious: boolean; reason: string } {
    const fullCommand = `${operation.command} ${operation.args.join(' ')}`;
    
    for (const pattern of this.SUSPICIOUS_PATTERNS) {
      if (pattern.test(fullCommand)) {
        return {
          isSuspicious: true,
          reason: `不審なパターンにマッチしました: ${pattern.source}`
        };
      }
    }

    // 異常な頻度チェック（同じ操作が短時間で繰り返される）
    if (this.isAbnormalFrequency(operation)) {
      return {
        isSuspicious: true,
        reason: '異常な頻度で同じ操作が実行されています'
      };
    }

    return { isSuspicious: false, reason: '不審なパターンは検出されませんでした' };
  }

  private isAbnormalFrequency(operation: Operation): boolean {
    // 実装は簡略化（実際には操作履歴を追跡する必要がある）
    return false;
  }
}

/**
 * ポリシー評価器 - ポリシー設定に基づいて操作を評価
 */
class PolicyEvaluator {
  async evaluateAgainstPolicy(
    operation: Operation,
    classification: any,
    policy: TrustPolicy
  ): Promise<PolicyEvaluationResult> {
    try {
      // 自動承認対象かチェック
      if (this.isAutoApproveOperation(operation, classification, policy)) {
        return {
          allowed: true,
          reason: 'ポリシーにより自動承認されました',
          riskLevel: classification.riskLevel
        };
      }

      // 手動承認対象かチェック
      if (this.isManualApproveOperation(operation, classification, policy)) {
        return {
          allowed: false,
          reason: 'ポリシーにより手動承認が必要です',
          riskLevel: classification.riskLevel
        };
      }

      // デフォルトは手動承認
      return {
        allowed: false,
        reason: 'ポリシーに明示的な許可がないため手動承認が必要です',
        riskLevel: RiskLevel.MEDIUM
      };
    } catch (error) {
      console.error('ポリシー評価中にエラーが発生しました:', error);
      return {
        allowed: false,
        reason: `ポリシー評価エラー: ${error instanceof Error ? error.message : 'Unknown error'}`,
        riskLevel: RiskLevel.HIGH
      };
    }
  }

  private isAutoApproveOperation(
    operation: Operation,
    classification: any,
    policy: TrustPolicy
  ): boolean {
    const command = operation.command.toLowerCase();
    const args = operation.args.map(arg => arg.toLowerCase());

    // Git操作のチェック
    if (classification.operationType === OperationType.GIT) {
      return policy.autoApprove.gitOperations.some(op => 
        args.includes(op) || args.join(' ').includes(op)
      );
    }

    // ファイル操作のチェック
    if (classification.operationType === OperationType.FILE) {
      return policy.autoApprove.fileOperations.some(op => 
        command === op || command.includes(op)
      );
    }

    // CLI操作のチェック
    if (classification.operationType === OperationType.CLI) {
      const cliOps = policy.autoApprove.cliOperations[command];
      if (cliOps) {
        return cliOps.some(op => args.join(' ').includes(op));
      }
    }

    // スクリプト実行のチェック
    if (classification.operationType === OperationType.SCRIPT) {
      const hasAllowedExtension = args.some(arg =>
        policy.autoApprove.scriptExecution.extensions.some(ext => arg.endsWith(ext))
      );
      
      const hasAllowedPath = args.some(arg =>
        policy.autoApprove.scriptExecution.allowedPaths.some(path => arg.startsWith(path))
      );

      return hasAllowedExtension || hasAllowedPath;
    }

    return false;
  }

  private isManualApproveOperation(
    operation: Operation,
    classification: any,
    policy: TrustPolicy
  ): boolean {
    const fullCommand = `${operation.command} ${operation.args.join(' ')}`;

    // 削除系操作のチェック
    const isDeletion = policy.manualApprove.deleteOperations.some(pattern =>
      this.matchesPattern(fullCommand, pattern)
    );

    // 強制系操作のチェック
    const isForce = policy.manualApprove.forceOperations.some(pattern =>
      this.matchesPattern(fullCommand, pattern)
    );

    // 本番影響操作のチェック
    const isProductionImpact = policy.manualApprove.productionImpact.some(pattern =>
      this.matchesPattern(fullCommand, pattern)
    );

    return isDeletion || isForce || isProductionImpact;
  }

  private matchesPattern(text: string, pattern: string): boolean {
    if (pattern === '*') return true;
    return text.toLowerCase().includes(pattern.toLowerCase());
  }
}

/**
 * パフォーマンス監視クラス
 */
class PerformanceMetrics {
  private operations: OperationLog[] = [];
  private readonly MAX_HISTORY = 1000;

  record(duration: number, result: string): void {
    const log: OperationLog = {
      id: this.generateId(),
      timestamp: new Date(),
      duration,
      operationType: OperationType.UNKNOWN,
      command: '',
      args: [],
      approved: result === 'success',
      approvalType: result === 'cache-hit' ? 'auto' : 'manual',
      executionTime: duration,
      result: result === 'success' ? 'success' : 'failure'
    };

    this.operations.push(log);

    // 履歴サイズ制限
    if (this.operations.length > this.MAX_HISTORY) {
      this.operations.shift();
    }
  }

  getOperationHistory(): OperationLog[] {
    return [...this.operations];
  }

  getStats(): PerformanceStats {
    const totalOperations = this.operations.length;
    const successfulOperations = this.operations.filter(op => op.result === 'success').length;
    const averageDuration = totalOperations > 0 
      ? this.operations.reduce((sum, op) => sum + op.executionTime, 0) / totalOperations 
      : 0;
    
    const cacheHits = this.operations.filter(op => op.approvalType === 'auto').length;
    const cacheHitRate = totalOperations > 0 ? (cacheHits / totalOperations) * 100 : 0;

    return {
      totalOperations,
      successfulOperations,
      successRate: totalOperations > 0 ? (successfulOperations / totalOperations) * 100 : 0,
      averageDuration,
      cacheHitRate,
      operationsUnder100ms: this.operations.filter(op => op.executionTime < 100).length
    };
  }

  private generateId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// 型定義
interface CachedDecision {
  decision: TrustDecision;
  timestamp: number;
}

interface SecurityVerificationResult {
  isSecure: boolean;
  reason: string;
  riskLevel: RiskLevel;
}

interface PolicyEvaluationResult {
  allowed: boolean;
  reason: string;
  riskLevel?: RiskLevel;
}

interface RateLimitInfo {
  count: number;
  windowStart: number;
}

interface OperationLog {
  id: string;
  timestamp: Date;
  operationType: OperationType;
  command: string;
  args: string[];
  approved: boolean;
  approvalType: 'auto' | 'manual';
  executionTime: number;
  result: 'success' | 'failure' | 'cancelled';
  duration?: number;
  errorMessage?: string;
}

interface PerformanceStats {
  totalOperations: number;
  successfulOperations: number;
  successRate: number;
  averageDuration: number;
  cacheHitRate: number;
  operationsUnder100ms: number;
  optimization?: any;
}