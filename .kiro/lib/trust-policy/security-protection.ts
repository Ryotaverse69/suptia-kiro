import { promises as fs } from 'fs';
import { createHash } from 'crypto';
import { Operation, TrustPolicy, RiskLevel, OperationType } from './types.js';
import { PolicyManager } from './policy-manager.js';
import { AuditLogger } from './audit-logger.js';

/**
 * セキュリティ保護システム
 * 要件8.1, 8.2, 8.3に基づいて実装
 */
export class SecurityProtectionSystem {
  private policyManager: PolicyManager;
  private auditLogger: AuditLogger;
  private suspiciousPatternDetector: SuspiciousPatternDetector;
  private configIntegrityVerifier: ConfigIntegrityVerifier;
  private externalRequestValidator: ExternalRequestValidator;
  private securityState: SecurityState;

  constructor() {
    this.policyManager = new PolicyManager();
    this.auditLogger = new AuditLogger();
    this.suspiciousPatternDetector = new SuspiciousPatternDetector();
    this.configIntegrityVerifier = new ConfigIntegrityVerifier();
    this.externalRequestValidator = new ExternalRequestValidator();
    this.securityState = new SecurityState();
  }

  /**
   * 包括的なセキュリティ検証を実行
   * 要件8.1, 8.2, 8.3のすべてを統合
   */
  async performSecurityCheck(operation: Operation): Promise<SecurityCheckResult> {
    try {
      // 1. 設定ファイル改ざん検証（要件8.2）
      const integrityResult = await this.configIntegrityVerifier.verifyConfigIntegrity();
      if (!integrityResult.isValid) {
        await this.handleConfigTampering(integrityResult);
        return {
          passed: false,
          reason: `設定ファイル改ざんを検出: ${integrityResult.reason}`,
          riskLevel: RiskLevel.CRITICAL,
          action: SecurityAction.RESTORE_DEFAULT_CONFIG
        };
      }

      // 2. 外部からの不正操作要求チェック（要件8.3）
      const externalRequestResult = await this.externalRequestValidator.validateRequest(operation);
      if (!externalRequestResult.isValid) {
        await this.handleExternalThreat(operation, externalRequestResult);
        return {
          passed: false,
          reason: `外部からの不正操作要求: ${externalRequestResult.reason}`,
          riskLevel: RiskLevel.HIGH,
          action: SecurityAction.REJECT_AND_LOG
        };
      }

      // 3. 不審な操作パターン検出（要件8.1）
      const suspiciousResult = await this.suspiciousPatternDetector.detectSuspiciousPattern(operation);
      if (suspiciousResult.isSuspicious) {
        await this.handleSuspiciousPattern(operation, suspiciousResult);
        
        // 自動手動承認モード切り替え
        if (suspiciousResult.severity === SuspiciousSeverity.HIGH) {
          await this.switchToManualApprovalMode(suspiciousResult.reason);
          return {
            passed: false,
            reason: `不審なパターンを検出し、手動承認モードに切り替えました: ${suspiciousResult.reason}`,
            riskLevel: RiskLevel.HIGH,
            action: SecurityAction.SWITCH_TO_MANUAL_MODE
          };
        }
      }

      // すべてのチェックを通過
      return {
        passed: true,
        reason: 'セキュリティチェックを通過しました',
        riskLevel: RiskLevel.LOW,
        action: SecurityAction.ALLOW
      };

    } catch (error) {
      console.error('セキュリティチェック中にエラーが発生しました:', error);
      
      // エラー時は安全側に倒す
      return {
        passed: false,
        reason: `セキュリティチェックエラー: ${error instanceof Error ? error.message : 'Unknown error'}`,
        riskLevel: RiskLevel.HIGH,
        action: SecurityAction.REJECT_AND_LOG
      };
    }
  }

  /**
   * セキュリティ状態を取得
   */
  getSecurityState(): SecurityStateInfo {
    return this.securityState.getCurrentState();
  }

  /**
   * 手動承認モードから自動承認モードに復帰
   */
  async restoreAutoApprovalMode(reason: string = 'Manual restoration'): Promise<void> {
    await this.securityState.setManualApprovalMode(false);
    await this.auditLogger.logSecurityEvent({
      type: 'mode_change',
      description: `自動承認モードに復帰: ${reason}`,
      timestamp: new Date(),
      severity: 'info'
    });
    console.log('自動承認モードに復帰しました:', reason);
  }

  /**
   * セキュリティ統計を取得
   */
  async getSecurityStats(days: number = 7): Promise<SecurityStats> {
    const stats = await this.auditLogger.getSecurityEventStats(days);
    const currentState = this.securityState.getCurrentState();
    
    return {
      ...stats,
      currentSecurityLevel: currentState.securityLevel,
      isManualApprovalMode: currentState.isManualApprovalMode,
      lastSecurityIncident: currentState.lastSecurityIncident,
      configIntegrityStatus: await this.configIntegrityVerifier.getIntegrityStatus(),
      threatCount: (stats.securityEvents || 0) + (stats.suspiciousPatterns || 0) + (stats.externalThreats || 0)
    };
  }

  /**
   * 設定ファイル改ざんを処理
   */
  private async handleConfigTampering(integrityResult: ConfigIntegrityResult): Promise<void> {
    console.error('設定ファイル改ざんを検出しました:', integrityResult.reason);
    
    // セキュリティイベントをログに記録
    await this.auditLogger.logSecurityEvent({
      type: 'config_tampering',
      description: `設定ファイル改ざんを検出: ${integrityResult.reason}`,
      timestamp: new Date(),
      severity: 'critical',
      details: integrityResult.details
    });

    // デフォルト設定に復帰
    try {
      const defaultPolicy = await this.policyManager.loadDefaultPolicy();
      await this.policyManager.updatePolicy(defaultPolicy, true);
      
      console.log('デフォルト設定に復帰しました');
      
      await this.auditLogger.logSecurityEvent({
        type: 'config_restored',
        description: 'デフォルト設定に復帰しました',
        timestamp: new Date(),
        severity: 'info'
      });
    } catch (error) {
      console.error('デフォルト設定への復帰に失敗しました:', error);
      
      await this.auditLogger.logSecurityEvent({
        type: 'config_restore_failed',
        description: `デフォルト設定への復帰に失敗: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        severity: 'critical'
      });
    }
  }

  /**
   * 外部脅威を処理
   */
  private async handleExternalThreat(operation: Operation, result: ExternalRequestValidationResult): Promise<void> {
    console.warn('外部からの不正操作要求を検出しました:', result.reason);
    
    // セキュリティイベントをログに記録
    await this.auditLogger.logSecurityEvent({
      type: 'external_threat',
      description: `外部からの不正操作要求: ${result.reason}`,
      timestamp: new Date(),
      severity: 'high',
      details: {
        operation: {
          command: operation.command,
          args: operation.args,
          type: operation.type
        },
        context: operation.context,
        threatIndicators: result.threatIndicators
      }
    });

    // セキュリティレベルを上げる
    await this.securityState.elevateSecurityLevel('external_threat_detected');
  }

  /**
   * 不審なパターンを処理
   */
  private async handleSuspiciousPattern(operation: Operation, result: SuspiciousPatternResult): Promise<void> {
    console.warn('不審な操作パターンを検出しました:', result.reason);
    
    // セキュリティイベントをログに記録
    await this.auditLogger.logSecurityEvent({
      type: 'suspicious_pattern',
      description: `不審な操作パターン: ${result.reason}`,
      timestamp: new Date(),
      severity: result.severity === SuspiciousSeverity.HIGH ? 'high' : 'medium',
      details: {
        operation: {
          command: operation.command,
          args: operation.args,
          type: operation.type
        },
        patterns: result.matchedPatterns,
        severity: result.severity,
        confidence: result.confidence
      }
    });

    // 重要度に応じてセキュリティレベルを調整
    if (result.severity === SuspiciousSeverity.HIGH) {
      await this.securityState.elevateSecurityLevel('suspicious_pattern_high');
    }
  }

  /**
   * 手動承認モードに切り替え
   */
  private async switchToManualApprovalMode(reason: string): Promise<void> {
    await this.securityState.setManualApprovalMode(true);
    
    console.warn('手動承認モードに切り替えました:', reason);
    
    await this.auditLogger.logSecurityEvent({
      type: 'mode_change',
      description: `手動承認モードに切り替え: ${reason}`,
      timestamp: new Date(),
      severity: 'high'
    });
  }
}

/**
 * 不審なパターン検出器
 * 要件8.1に基づいて実装
 */
class SuspiciousPatternDetector {
  private operationHistory: OperationHistoryEntry[] = [];
  private readonly MAX_HISTORY = 1000;
  private readonly SUSPICIOUS_PATTERNS = [
    // 異常な頻度での同一操作
    { pattern: /(.+)/, type: 'frequency', threshold: 50, window: 60000 }, // 1分間に50回以上
    
    // 危険なコマンドパターン
    { pattern: /rm\s+-rf\s+\//, type: 'dangerous_command', severity: SuspiciousSeverity.HIGH },
    { pattern: /curl\s+.*\|\s*sh/, type: 'pipe_execution', severity: SuspiciousSeverity.HIGH },
    { pattern: /wget\s+.*\|\s*bash/, type: 'pipe_execution', severity: SuspiciousSeverity.HIGH },
    
    // ディレクトリトラバーサル
    { pattern: /\.\.\//, type: 'directory_traversal', severity: SuspiciousSeverity.MEDIUM },
    
    // システムディレクトリへのアクセス
    { pattern: /\/etc\/|\/var\/|\/usr\/bin\/|\/root\//, type: 'system_access', severity: SuspiciousSeverity.MEDIUM },
    
    // エンコードされた文字列
    { pattern: /base64|eval|exec/, type: 'encoded_execution', severity: SuspiciousSeverity.HIGH },
    
    // 異常に長いコマンド
    { pattern: /.{500,}/, type: 'long_command', severity: SuspiciousSeverity.MEDIUM },
    
    // 複数の危険な操作の組み合わせ
    { pattern: /git\s+reset\s+--hard.*git\s+push\s+--force/, type: 'dangerous_combination', severity: SuspiciousSeverity.HIGH }
  ];

  async detectSuspiciousPattern(operation: Operation): Promise<SuspiciousPatternResult> {
    const fullCommand = `${operation.command} ${operation.args.join(' ')}`;
    const matchedPatterns: string[] = [];
    let maxSeverity = SuspiciousSeverity.LOW;
    let confidence = 0;

    // 履歴に追加
    this.addToHistory(operation);

    // パターンマッチング
    for (const suspiciousPattern of this.SUSPICIOUS_PATTERNS) {
      if (suspiciousPattern.pattern.test(fullCommand)) {
        matchedPatterns.push(suspiciousPattern.type);
        
        if (suspiciousPattern.severity && suspiciousPattern.severity > maxSeverity) {
          maxSeverity = suspiciousPattern.severity;
        }
        
        confidence += 0.3; // パターンマッチごとに信頼度を上げる
      }
    }

    // 頻度チェック
    const frequencyResult = this.checkFrequencyAnomaly(operation);
    if (frequencyResult.isAnomalous) {
      matchedPatterns.push('frequency_anomaly');
      maxSeverity = Math.max(maxSeverity, SuspiciousSeverity.MEDIUM);
      confidence += 0.4;
    }

    // 時間パターンチェック
    const timePatternResult = this.checkTimePatternAnomaly(operation);
    if (timePatternResult.isAnomalous) {
      matchedPatterns.push('time_pattern_anomaly');
      maxSeverity = Math.max(maxSeverity, SuspiciousSeverity.MEDIUM);
      confidence += 0.3;
    }

    const isSuspicious = matchedPatterns.length > 0 && confidence > 0.5;

    return {
      isSuspicious,
      reason: isSuspicious 
        ? `不審なパターンを検出: ${matchedPatterns.join(', ')}`
        : '不審なパターンは検出されませんでした',
      matchedPatterns,
      severity: maxSeverity,
      confidence: Math.min(confidence, 1.0)
    };
  }

  private addToHistory(operation: Operation): void {
    this.operationHistory.push({
      operation,
      timestamp: Date.now()
    });

    // 履歴サイズ制限
    if (this.operationHistory.length > this.MAX_HISTORY) {
      this.operationHistory.shift();
    }
  }

  private checkFrequencyAnomaly(operation: Operation): { isAnomalous: boolean; frequency: number } {
    const now = Date.now();
    const window = 60000; // 1分間
    const threshold = 20; // 1分間に20回以上で異常

    const recentOperations = this.operationHistory.filter(entry => 
      now - entry.timestamp < window &&
      entry.operation.command === operation.command
    );

    return {
      isAnomalous: recentOperations.length > threshold,
      frequency: recentOperations.length
    };
  }

  private checkTimePatternAnomaly(operation: Operation): { isAnomalous: boolean; reason: string } {
    const now = new Date();
    const hour = now.getHours();

    // 深夜の時間帯（午前2時〜5時）での大量操作は不審
    if (hour >= 2 && hour <= 5) {
      const recentCount = this.operationHistory.filter(entry => 
        Date.now() - entry.timestamp < 300000 // 5分間
      ).length;

      if (recentCount > 10) {
        return {
          isAnomalous: true,
          reason: '深夜時間帯での異常な操作頻度'
        };
      }
    }

    return { isAnomalous: false, reason: '' };
  }
}

/**
 * 設定ファイル整合性検証器
 * 要件8.2に基づいて実装
 */
class ConfigIntegrityVerifier {
  private static readonly CONFIG_PATH = '.kiro/settings/trust-policy.json';
  private static readonly CHECKSUM_PATH = '.kiro/settings/.trust-policy.checksum';
  private lastKnownHash: string | null = null;

  async verifyConfigIntegrity(): Promise<ConfigIntegrityResult> {
    try {
      // 現在の設定ファイルのハッシュを計算
      const currentHash = await this.calculateConfigHash();
      
      // 保存されたチェックサムと比較
      const storedHash = await this.getStoredChecksum();
      
      if (!storedHash) {
        // 初回実行時はチェックサムを保存
        await this.saveChecksum(currentHash);
        return {
          isValid: true,
          reason: '初回実行のためチェックサムを保存しました',
          details: { currentHash, storedHash: null }
        };
      }

      if (currentHash !== storedHash) {
        // ハッシュが一致しない場合は改ざんの可能性
        const configContent = await this.getConfigContent();
        const validationResult = await this.validateConfigStructure(configContent);
        
        if (!validationResult.isValid) {
          return {
            isValid: false,
            reason: '設定ファイルが改ざんされ、構造が破損しています',
            details: { 
              currentHash, 
              storedHash, 
              structureErrors: validationResult.errors 
            }
          };
        }

        // 構造は正常だが、ハッシュが異なる場合は正当な更新の可能性
        // タイムスタンプをチェック
        const lastModified = await this.getConfigLastModified();
        const checksumModified = await this.getChecksumLastModified();
        
        if (lastModified > checksumModified) {
          // 設定ファイルの方が新しい場合は正当な更新
          await this.saveChecksum(currentHash);
          return {
            isValid: true,
            reason: '設定ファイルが正当に更新されました',
            details: { currentHash, storedHash, updated: true }
          };
        }

        return {
          isValid: false,
          reason: '設定ファイルのハッシュが一致しません（不正な変更の可能性）',
          details: { currentHash, storedHash }
        };
      }

      return {
        isValid: true,
        reason: '設定ファイルの整合性が確認されました',
        details: { currentHash, storedHash }
      };

    } catch (error) {
      return {
        isValid: false,
        reason: `整合性検証中にエラーが発生しました: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  async getIntegrityStatus(): Promise<ConfigIntegrityStatus> {
    const result = await this.verifyConfigIntegrity();
    return {
      isValid: result.isValid,
      lastChecked: new Date(),
      checksum: await this.calculateConfigHash(),
      details: result.details
    };
  }

  private async calculateConfigHash(): Promise<string> {
    try {
      const content = await fs.readFile(ConfigIntegrityVerifier.CONFIG_PATH, 'utf-8');
      // JSONを正規化してからハッシュ化（フォーマットの違いを無視）
      const normalized = JSON.stringify(JSON.parse(content));
      return createHash('sha256').update(normalized).digest('hex');
    } catch (error) {
      throw new Error(`設定ファイルのハッシュ計算に失敗: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async getStoredChecksum(): Promise<string | null> {
    try {
      return await fs.readFile(ConfigIntegrityVerifier.CHECKSUM_PATH, 'utf-8');
    } catch (error) {
      return null; // ファイルが存在しない場合
    }
  }

  private async saveChecksum(hash: string): Promise<void> {
    await fs.writeFile(ConfigIntegrityVerifier.CHECKSUM_PATH, hash, 'utf-8');
  }

  private async getConfigContent(): Promise<string> {
    return await fs.readFile(ConfigIntegrityVerifier.CONFIG_PATH, 'utf-8');
  }

  private async validateConfigStructure(content: string): Promise<{ isValid: boolean; errors: string[] }> {
    try {
      const config = JSON.parse(content);
      const errors: string[] = [];

      // 必須フィールドの検証
      if (!config.version) errors.push('version field is missing');
      if (!config.lastUpdated) errors.push('lastUpdated field is missing');
      if (!config.autoApprove) errors.push('autoApprove field is missing');
      if (!config.manualApprove) errors.push('manualApprove field is missing');
      if (!config.security) errors.push('security field is missing');

      return { isValid: errors.length === 0, errors };
    } catch (error) {
      return { isValid: false, errors: ['Invalid JSON format'] };
    }
  }

  private async getConfigLastModified(): Promise<number> {
    const stats = await fs.stat(ConfigIntegrityVerifier.CONFIG_PATH);
    return stats.mtime.getTime();
  }

  private async getChecksumLastModified(): Promise<number> {
    try {
      const stats = await fs.stat(ConfigIntegrityVerifier.CHECKSUM_PATH);
      return stats.mtime.getTime();
    } catch (error) {
      return 0; // ファイルが存在しない場合
    }
  }
}

/**
 * 外部要求検証器
 * 要件8.3に基づいて実装
 */
class ExternalRequestValidator {
  private readonly VALID_SESSION_PATTERN = /^kiro_session_[a-zA-Z0-9]{32}$/;
  private readonly VALID_USER_PATTERN = /^[a-zA-Z0-9_-]+$/;
  private readonly SUSPICIOUS_SOURCES = [
    'external_api',
    'webhook',
    'remote_command',
    'unknown_source'
  ];

  async validateRequest(operation: Operation): Promise<ExternalRequestValidationResult> {
    const threatIndicators: string[] = [];
    let riskScore = 0;

    // 1. セッションID検証
    const sessionValidation = this.validateSessionId(operation.context?.sessionId);
    if (!sessionValidation.isValid) {
      threatIndicators.push('invalid_session_id');
      riskScore += 0.4;
    }

    // 2. ユーザー情報検証
    const userValidation = this.validateUser(operation.context?.user);
    if (!userValidation.isValid) {
      threatIndicators.push('invalid_user');
      riskScore += 0.3;
    }

    // 3. 操作元の検証
    const sourceValidation = this.validateOperationSource(operation);
    if (!sourceValidation.isValid) {
      threatIndicators.push('suspicious_source');
      riskScore += 0.5;
    }

    // 4. コマンド構造の検証
    const commandValidation = this.validateCommandStructure(operation);
    if (!commandValidation.isValid) {
      threatIndicators.push('malformed_command');
      riskScore += 0.3;
    }

    // 5. タイミング検証
    const timingValidation = this.validateTiming(operation);
    if (!timingValidation.isValid) {
      threatIndicators.push('suspicious_timing');
      riskScore += 0.2;
    }

    const isValid = riskScore < 0.5; // リスクスコアが0.5未満なら有効

    return {
      isValid,
      reason: isValid 
        ? '外部要求検証を通過しました'
        : `外部要求検証に失敗: ${threatIndicators.join(', ')}`,
      threatIndicators,
      riskScore
    };
  }

  private validateSessionId(sessionId?: string): { isValid: boolean; reason: string } {
    if (!sessionId) {
      return { isValid: false, reason: 'セッションIDが存在しません' };
    }

    if (!this.VALID_SESSION_PATTERN.test(sessionId)) {
      return { isValid: false, reason: 'セッションIDの形式が不正です' };
    }

    return { isValid: true, reason: 'セッションIDは有効です' };
  }

  private validateUser(user?: string): { isValid: boolean; reason: string } {
    if (!user) {
      return { isValid: false, reason: 'ユーザー情報が存在しません' };
    }

    if (!this.VALID_USER_PATTERN.test(user)) {
      return { isValid: false, reason: 'ユーザー名の形式が不正です' };
    }

    return { isValid: true, reason: 'ユーザー情報は有効です' };
  }

  private validateOperationSource(operation: Operation): { isValid: boolean; reason: string } {
    // MCPサーバーからの操作の場合
    if (operation.context?.mcpServer) {
      // 許可されたMCPサーバーのリスト（実際の実装では設定から読み込む）
      const allowedMcpServers = [
        'filesystem',
        'github',
        'sanity-dev',
        'fetch',
        'brave-search'
      ];

      if (!allowedMcpServers.includes(operation.context.mcpServer)) {
        return { isValid: false, reason: '許可されていないMCPサーバーからの要求です' };
      }
    }

    // 不審なソースからの操作をチェック
    const operationSource = this.identifyOperationSource(operation);
    if (this.SUSPICIOUS_SOURCES.includes(operationSource)) {
      return { isValid: false, reason: `不審なソースからの操作: ${operationSource}` };
    }

    return { isValid: true, reason: '操作ソースは有効です' };
  }

  private validateCommandStructure(operation: Operation): { isValid: boolean; reason: string } {
    // コマンドが空でないことを確認
    if (!operation.command || operation.command.trim() === '') {
      return { isValid: false, reason: 'コマンドが空です' };
    }

    // 異常に長いコマンドをチェック
    const fullCommand = `${operation.command} ${operation.args.join(' ')}`;
    if (fullCommand.length > 10000) {
      return { isValid: false, reason: 'コマンドが異常に長すぎます' };
    }

    // 制御文字のチェック
    if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(fullCommand)) {
      return { isValid: false, reason: 'コマンドに制御文字が含まれています' };
    }

    return { isValid: true, reason: 'コマンド構造は有効です' };
  }

  private validateTiming(operation: Operation): { isValid: boolean; reason: string } {
    const now = Date.now();
    const operationTime = operation.timestamp.getTime();

    // 未来の時刻の操作は不正
    if (operationTime > now + 60000) { // 1分の誤差を許容
      return { isValid: false, reason: '未来の時刻の操作です' };
    }

    // 古すぎる操作も不正
    if (now - operationTime > 300000) { // 5分以上古い
      return { isValid: false, reason: '操作が古すぎます' };
    }

    return { isValid: true, reason: 'タイミングは有効です' };
  }

  private identifyOperationSource(operation: Operation): string {
    // 実際の実装では、より詳細なソース識別ロジックを実装
    if (operation.context?.mcpServer) {
      return 'mcp_server';
    }
    
    if (operation.context?.environment === 'external') {
      return 'external_api';
    }

    return 'internal';
  }
}

/**
 * セキュリティ状態管理
 */
class SecurityState {
  private currentState: SecurityStateInfo;
  private readonly STATE_FILE = '.kiro/settings/.security-state.json';

  constructor() {
    this.currentState = {
      securityLevel: SecurityLevel.NORMAL,
      isManualApprovalMode: false,
      lastSecurityIncident: null,
      threatCount: 0,
      lastStateChange: new Date()
    };
    this.loadState();
  }

  getCurrentState(): SecurityStateInfo {
    return { ...this.currentState };
  }

  async setManualApprovalMode(enabled: boolean): Promise<void> {
    this.currentState.isManualApprovalMode = enabled;
    this.currentState.lastStateChange = new Date();
    await this.saveState();
  }

  async elevateSecurityLevel(reason: string): Promise<void> {
    const previousLevel = this.currentState.securityLevel;
    
    // セキュリティレベルを上げる
    if (this.currentState.securityLevel < SecurityLevel.HIGH) {
      this.currentState.securityLevel++;
    }

    this.currentState.lastSecurityIncident = {
      reason,
      timestamp: new Date(),
      previousLevel,
      newLevel: this.currentState.securityLevel
    };
    
    this.currentState.threatCount++;
    this.currentState.lastStateChange = new Date();
    
    await this.saveState();
  }

  private async loadState(): Promise<void> {
    try {
      const content = await fs.readFile(this.STATE_FILE, 'utf-8');
      const savedState = JSON.parse(content);
      
      // 日付オブジェクトを復元
      if (savedState.lastStateChange) {
        savedState.lastStateChange = new Date(savedState.lastStateChange);
      }
      if (savedState.lastSecurityIncident?.timestamp) {
        savedState.lastSecurityIncident.timestamp = new Date(savedState.lastSecurityIncident.timestamp);
      }
      
      this.currentState = { ...this.currentState, ...savedState };
    } catch (error) {
      // ファイルが存在しない場合はデフォルト状態を使用
      console.log('セキュリティ状態ファイルが存在しないため、デフォルト状態を使用します');
    }
  }

  private async saveState(): Promise<void> {
    try {
      const content = JSON.stringify(this.currentState, null, 2);
      await fs.writeFile(this.STATE_FILE, content, 'utf-8');
    } catch (error) {
      console.error('セキュリティ状態の保存に失敗しました:', error);
    }
  }
}

// 型定義
export interface SecurityCheckResult {
  passed: boolean;
  reason: string;
  riskLevel: RiskLevel;
  action: SecurityAction;
}

export enum SecurityAction {
  ALLOW = 'allow',
  REJECT_AND_LOG = 'reject_and_log',
  SWITCH_TO_MANUAL_MODE = 'switch_to_manual_mode',
  RESTORE_DEFAULT_CONFIG = 'restore_default_config'
}

interface SuspiciousPatternResult {
  isSuspicious: boolean;
  reason: string;
  matchedPatterns: string[];
  severity: SuspiciousSeverity;
  confidence: number;
}

enum SuspiciousSeverity {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3
}

interface ConfigIntegrityResult {
  isValid: boolean;
  reason: string;
  details: any;
}

interface ExternalRequestValidationResult {
  isValid: boolean;
  reason: string;
  threatIndicators: string[];
  riskScore: number;
}

interface OperationHistoryEntry {
  operation: Operation;
  timestamp: number;
}

interface SecurityStateInfo {
  securityLevel: SecurityLevel;
  isManualApprovalMode: boolean;
  lastSecurityIncident: SecurityIncident | null;
  threatCount: number;
  lastStateChange: Date;
}

interface SecurityIncident {
  reason: string;
  timestamp: Date;
  previousLevel: SecurityLevel;
  newLevel: SecurityLevel;
}

enum SecurityLevel {
  NORMAL = 1,
  ELEVATED = 2,
  HIGH = 3,
  CRITICAL = 4
}

interface SecurityStats {
  currentSecurityLevel: SecurityLevel;
  isManualApprovalMode: boolean;
  lastSecurityIncident: SecurityIncident | null;
  configIntegrityStatus: ConfigIntegrityStatus;
  threatCount: number;
  securityEvents: number;
  suspiciousPatterns: number;
  externalThreats: number;
}

interface ConfigIntegrityStatus {
  isValid: boolean;
  lastChecked: Date;
  checksum: string;
  details: any;
}