import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { Operation, TrustDecision, ExecutionResult, SecurityEvent } from './types.js';

export interface AuditLog {
  id: string;
  timestamp: Date;
  operation: Operation;
  decision: TrustDecision;
  executionResult?: ExecutionResult;
  user: string;
  sessionId: string;
}

export interface AuditLoggerConfig {
  reportsDir: string;
  maxLogFileSize: number; // bytes
  maxLogFiles: number;
  enableRotation: boolean;
}

export class AuditLogger {
  private config: AuditLoggerConfig;
  private logQueue: AuditLog[] = [];
  private isProcessing = false;

  constructor(config: Partial<AuditLoggerConfig> = {}) {
    this.config = {
      reportsDir: '.kiro/reports',
      maxLogFileSize: 10 * 1024 * 1024, // 10MB
      maxLogFiles: 30, // 30日分
      enableRotation: true,
      ...config
    };
  }

  /**
   * レポートディレクトリを設定（テスト用）
   */
  setReportsDir(reportsDir: string): void {
    this.config.reportsDir = reportsDir;
  }

  /**
   * AuditLoggerの初期化
   * レポートディレクトリの作成とログファイルの準備を行う
   */
  async initialize(): Promise<void> {
    try {
      // レポートディレクトリの作成
      await this.ensureDirectoryExists(this.config.reportsDir);
      
      // バックアップディレクトリの作成
      const backupDir = join(this.config.reportsDir, 'backups');
      await this.ensureDirectoryExists(backupDir);
      
      // 初期化完了ログの記録
      const initLogPath = join(this.config.reportsDir, 'audit-logger-init.log');
      const initMessage = `[${new Date().toISOString()}] AuditLogger initialized successfully\n`;
      
      try {
        await fs.appendFile(initLogPath, initMessage);
      } catch (error) {
        // 初期化ログの記録に失敗しても処理は継続
        console.warn('初期化ログの記録に失敗しました:', error);
      }
      
      console.log('✅ AuditLogger初期化完了');
    } catch (error) {
      console.error('❌ AuditLogger初期化に失敗しました:', error);
      throw new Error(`AuditLogger initialization failed: ${error.message}`);
    }
  }

  /**
   * 自動承認操作のログを記録（オーバーロード対応）
   */
  async logAutoApproval(
    operationOrData: Operation | {
      operation: string;
      timestamp: string;
      processingTime: number;
      context?: any;
    },
    decision?: TrustDecision,
    executionResult?: ExecutionResult,
    user: string = 'system',
    sessionId: string = this.generateSessionId()
  ): Promise<void> {
    // テスト用の簡易形式をサポート
    if (typeof (operationOrData as any).operation === 'string') {
      const data = operationOrData as {
        operation: string;
        timestamp: string;
        processingTime: number;
        context?: any;
      };
      
      const log: AuditLog = {
        id: this.generateLogId(),
        timestamp: new Date(data.timestamp),
        operation: {
          type: 'git' as any,
          command: data.operation.split(' ')[0],
          args: data.operation.split(' ').slice(1),
          context: data.context || {},
          timestamp: new Date(data.timestamp)
        },
        decision: {
          approved: true,
          reason: 'Auto-approved by test',
          confidence: 1.0,
          timestamp: new Date(data.timestamp)
        },
        user,
        sessionId
      };

      try {
        await this.writeAutoApprovalLog(log);
      } catch (error) {
        console.error('自動承認ログの記録に失敗しました:', error);
        await this.logError('auto-approval-log-failed', error as Error, log);
      }
      return;
    }

    // 通常の形式
    const operation = operationOrData as Operation;
    const log: AuditLog = {
      id: this.generateLogId(),
      timestamp: new Date(),
      operation,
      decision,
      executionResult,
      user,
      sessionId
    };

    try {
      await this.writeAutoApprovalLog(log);
    } catch (error) {
      // 要件4.4: ログ記録失敗時はエラーを報告し、操作は継続
      console.error('自動承認ログの記録に失敗しました:', error);
      await this.logError('auto-approval-log-failed', error as Error, log);
    }
  }

  /**
   * 手動承認操作のログを記録（オーバーロード対応）
   */
  async logManualApproval(
    operationOrData: Operation | {
      operation: string;
      timestamp: string;
      user: string;
      approved: boolean;
      reason: string;
    },
    decision?: TrustDecision,
    executionResult?: ExecutionResult,
    user: string = 'user',
    sessionId: string = this.generateSessionId()
  ): Promise<void> {
    // テスト用の簡易形式をサポート
    if (typeof (operationOrData as any).operation === 'string') {
      const data = operationOrData as {
        operation: string;
        timestamp: string;
        user: string;
        approved: boolean;
        reason: string;
      };
      
      const log: AuditLog = {
        id: this.generateLogId(),
        timestamp: new Date(data.timestamp),
        operation: {
          type: 'git' as any,
          command: data.operation.split(' ')[0],
          args: data.operation.split(' ').slice(1),
          context: {},
          timestamp: new Date(data.timestamp)
        },
        decision: {
          approved: data.approved,
          reason: data.reason,
          confidence: 1.0,
          timestamp: new Date(data.timestamp)
        },
        user: data.user,
        sessionId
      };

      try {
        await this.writeManualApprovalLog(log);
      } catch (error) {
        console.error('手動承認ログの記録に失敗しました:', error);
        await this.logError('manual-approval-log-failed', error as Error, log);
      }
      return;
    }

    // 通常の形式
    const operation = operationOrData as Operation;
    const log: AuditLog = {
      id: this.generateLogId(),
      timestamp: new Date(),
      operation,
      decision,
      executionResult,
      user,
      sessionId
    };

    try {
      await this.writeManualApprovalLog(log);
    } catch (error) {
      // 要件4.4: ログ記録失敗時はエラーを報告し、操作は継続
      console.error('手動承認ログの記録に失敗しました:', error);
      await this.logError('manual-approval-log-failed', error as Error, log);
    }
  }

  /**
   * 自動承認ログファイルに書き込み
   */
  private async writeAutoApprovalLog(log: AuditLog): Promise<void> {
    const date = this.formatDate(log.timestamp);
    const logFile = join(this.config.reportsDir, `auto-trust-log-${date}.md`);
    
    await this.ensureDirectoryExists(dirname(logFile));
    
    // ファイルサイズチェックとローテーション
    if (this.config.enableRotation) {
      await this.checkAndRotateLog(logFile);
    }

    const logEntry = this.formatAutoApprovalLogEntry(log);
    await this.appendToFile(logFile, logEntry);
  }

  /**
   * 手動承認ログファイルに書き込み
   */
  private async writeManualApprovalLog(log: AuditLog): Promise<void> {
    const date = this.formatDate(log.timestamp);
    const logFile = join(this.config.reportsDir, `manual-trust-log-${date}.md`);
    
    await this.ensureDirectoryExists(dirname(logFile));
    
    // ファイルサイズチェックとローテーション
    if (this.config.enableRotation) {
      await this.checkAndRotateLog(logFile);
    }

    const logEntry = this.formatManualApprovalLogEntry(log);
    await this.appendToFile(logFile, logEntry);
  }

  /**
   * エラーログの記録
   */
  private async logError(type: string, error: Error, context?: any): Promise<void> {
    try {
      const date = this.formatDate(new Date());
      const errorLogFile = join(this.config.reportsDir, `trust-error-log-${date}.md`);
      
      await this.ensureDirectoryExists(dirname(errorLogFile));
      
      const errorEntry = this.formatErrorLogEntry(type, error, context);
      await this.appendToFile(errorLogFile, errorEntry);
    } catch (writeError) {
      // エラーログの記録にも失敗した場合は標準出力に出力
      console.error('エラーログの記録に失敗:', writeError);
      console.error('元のエラー:', error);
    }
  }  /**
  
 * ログローテーション機能
   */
  private async checkAndRotateLog(logFile: string): Promise<void> {
    try {
      const stats = await fs.stat(logFile);
      
      // ファイルサイズが上限を超えた場合はローテーション
      if (stats.size > this.config.maxLogFileSize) {
        await this.rotateLogFile(logFile);
      }
    } catch (error) {
      // ファイルが存在しない場合は何もしない
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  /**
   * ログファイルのローテーション実行
   */
  private async rotateLogFile(logFile: string): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const rotatedFile = logFile.replace('.md', `-${timestamp}.md`);
    
    // 現在のファイルをローテーション
    await fs.rename(logFile, rotatedFile);
    
    // 古いログファイルの削除
    await this.cleanupOldLogs(dirname(logFile));
  }

  /**
   * 古いログファイルのクリーンアップ
   */
  private async cleanupOldLogs(logDir: string): Promise<void> {
    try {
      const files = await fs.readdir(logDir);
      const logFiles = files
        .filter(file => file.match(/^(auto|manual|trust-error)-trust-log-.*\.md$/))
        .map(file => ({
          name: file,
          path: join(logDir, file),
          stat: null as any
        }));

      // ファイル情報を取得
      for (const file of logFiles) {
        try {
          file.stat = await fs.stat(file.path);
        } catch (error) {
          // ファイルが削除されている場合はスキップ
          continue;
        }
      }

      // 作成日時でソート（新しい順）
      logFiles
        .filter(file => file.stat)
        .sort((a, b) => b.stat.mtime.getTime() - a.stat.mtime.getTime())
        .slice(this.config.maxLogFiles) // 保持数を超えたファイル
        .forEach(async (file) => {
          try {
            await fs.unlink(file.path);
            console.log(`古いログファイルを削除しました: ${file.name}`);
          } catch (error) {
            console.error(`ログファイルの削除に失敗: ${file.name}`, error);
          }
        });
    } catch (error) {
      console.error('ログファイルのクリーンアップに失敗:', error);
    }
  }

  /**
   * 自動承認ログエントリのフォーマット
   */
  private formatAutoApprovalLogEntry(log: AuditLog): string {
    const timestamp = log.timestamp.toISOString();
    const result = log.executionResult ? 
      `${log.executionResult.success ? '✅' : '❌'} ${log.executionResult.success ? 'SUCCESS' : 'FAILED'}` : 
      '⏳ PENDING';
    
    // 安全な引数処理
    const args = Array.isArray(log.operation.args) ? log.operation.args.join(' ') : (log.operation.args || '');
    
    return `
## ${log.id}

**時刻**: ${timestamp}  
**操作**: ${log.operation.type} - \`${log.operation.command}\`  
**引数**: ${args}  
**判定**: 自動承認 (${log.decision.reason})  
**結果**: ${result}  
**ユーザー**: ${log.user}  
**セッション**: ${log.sessionId}  

${log.executionResult?.errorMessage ? `**エラー**: ${log.executionResult.errorMessage}` : ''}

---
`;
  }

  /**
   * 手動承認ログエントリのフォーマット
   */
  private formatManualApprovalLogEntry(log: AuditLog): string {
    const timestamp = log.timestamp.toISOString();
    const approved = log.decision.approved ? '✅ 承認' : '❌ 拒否';
    const result = log.executionResult ? 
      `${log.executionResult.success ? '✅' : '❌'} ${log.executionResult.success ? 'SUCCESS' : 'FAILED'}` : 
      '⏳ PENDING';
    
    // 安全な引数処理
    const args = Array.isArray(log.operation.args) ? log.operation.args.join(' ') : (log.operation.args || '');
    
    return `
## ${log.id}

**時刻**: ${timestamp}  
**操作**: ${log.operation.type} - \`${log.operation.command}\`  
**引数**: ${args}  
**判定**: 手動承認 - ${approved}  
**理由**: ${log.decision.reason}  
**結果**: ${result}  
**ユーザー**: ${log.user}  
**セッション**: ${log.sessionId}  

${log.executionResult?.errorMessage ? `**エラー**: ${log.executionResult.errorMessage}` : ''}

---
`;
  }

  /**
   * エラーログエントリのフォーマット
   */
  private formatErrorLogEntry(type: string, error: Error, context?: any): string {
    const timestamp = new Date().toISOString();
    
    return `
## エラー: ${type}

**時刻**: ${timestamp}  
**エラー**: ${error.message}  
**スタックトレース**: 
\`\`\`
${error.stack}
\`\`\`

${context ? `**コンテキスト**: 
\`\`\`json
${JSON.stringify(context, null, 2)}
\`\`\`` : ''}

---
`;
  }

  /**
   * ディレクトリの存在確認と作成
   */
  private async ensureDirectoryExists(dir: string): Promise<void> {
    try {
      await fs.access(dir);
    } catch (error) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  /**
   * ファイルに追記
   */
  private async appendToFile(filePath: string, content: string): Promise<void> {
    // ファイルが存在しない場合はヘッダーを追加
    let fileExists = true;
    try {
      await fs.access(filePath);
    } catch (error) {
      fileExists = false;
    }

    if (!fileExists) {
      const header = this.generateLogFileHeader(filePath);
      await fs.writeFile(filePath, header);
    }

    await fs.appendFile(filePath, content);
  }

  /**
   * ログファイルのヘッダー生成
   */
  private generateLogFileHeader(filePath: string): string {
    const fileName = filePath.split('/').pop() || '';
    const date = new Date().toISOString().split('T')[0];
    
    let title = 'Trust承認ログ';
    if (fileName.includes('auto-trust-log')) {
      title = '自動承認ログ';
    } else if (fileName.includes('manual-trust-log')) {
      title = '手動承認ログ';
    } else if (fileName.includes('trust-error-log')) {
      title = 'Trust承認エラーログ';
    }

    return `# ${title} - ${date}

このファイルは Trust承認システムの監査ログです。

**生成日時**: ${new Date().toISOString()}  
**ファイル**: ${fileName}  

---

`;
  }

  /**
   * ユニークなログIDを生成
   */
  private generateLogId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `trust-${timestamp}-${random}`;
  }

  /**
   * セッションIDを生成
   */
  private generateSessionId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 12);
    return `session-${timestamp}-${random}`;
  }

  /**
   * 日付を YYYY-MM-DD 形式でフォーマット
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * セキュリティイベントをログに記録する
   */
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      const timestamp = event.timestamp.toISOString();
      const dateStr = event.timestamp.toISOString().split('T')[0];
      const logPath = join(this.config.reportsDir, `security-events-${dateStr}.md`);

      await this.ensureDirectoryExists(dirname(logPath));

      // ファイルが存在しない場合はヘッダーを追加
      let fileExists = true;
      try {
        await fs.access(logPath);
      } catch (error) {
        fileExists = false;
      }

      if (!fileExists) {
        const header = `# セキュリティイベントログ - ${dateStr}

このファイルは Trust承認システムのセキュリティイベントログです。

**生成日時**: ${new Date().toISOString()}  
**ファイル**: security-events-${dateStr}.md  

---

`;
        await fs.writeFile(logPath, header);
      }

      const logEntry = `## ${event.type.toUpperCase()} - ${event.severity.toUpperCase()}

**時刻**: ${timestamp}
**説明**: ${event.description}
${event.details ? `**詳細**: \`\`\`json\n${JSON.stringify(event.details, null, 2)}\n\`\`\`` : ''}

---

`;

      await fs.appendFile(logPath, logEntry, 'utf-8');
      
      console.log(`セキュリティイベントをログに記録しました: ${logPath}`);
    } catch (error) {
      console.error('セキュリティイベントのログ記録に失敗しました:', error);
      throw error;
    }
  }

  /**
   * セキュリティイベントの統計を取得する
   */
  async getSecurityEventStats(days: number = 7): Promise<{
    securityEvents: number;
    suspiciousPatterns: number;
    externalThreats: number;
    configTampering: number;
  }> {
    const stats = {
      securityEvents: 0,
      suspiciousPatterns: 0,
      externalThreats: 0,
      configTampering: 0
    };

    try {
      const files = await fs.readdir(this.config.reportsDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      for (const file of files) {
        if (!file.match(/^security-events-.*\.md$/)) {
          continue;
        }

        const filePath = join(this.config.reportsDir, file);
        const stat = await fs.stat(filePath);
        
        if (stat.mtime < cutoffDate) {
          continue;
        }

        const content = await fs.readFile(filePath, 'utf-8');
        
        stats.securityEvents += (content.match(/^## \w+/gm) || []).length;
        stats.suspiciousPatterns += (content.match(/SUSPICIOUS_PATTERN/g) || []).length;
        stats.externalThreats += (content.match(/EXTERNAL_THREAT/g) || []).length;
        stats.configTampering += (content.match(/CONFIG_TAMPERING/g) || []).length;
      }
    } catch (error) {
      console.error('セキュリティイベント統計の取得に失敗:', error);
    }

    return stats;
  }

  /**
   * ログローテーションを手動実行
   */
  async rotateLogs(): Promise<void> {
    try {
      const files = await fs.readdir(this.config.reportsDir);
      const logFiles = files.filter(file => 
        file.match(/^(auto|manual|trust-error)-trust-log-.*\.md$/)
      );

      for (const file of logFiles) {
        const filePath = join(this.config.reportsDir, file);
        await this.checkAndRotateLog(filePath);
      }
      
      console.log('✅ ログローテーション完了');
    } catch (error) {
      console.error('❌ ログローテーションに失敗:', error);
      throw error;
    }
  }

  /**
   * ログ統計情報を取得
   */
  async getLogStats(days: number = 7): Promise<{
    autoApprovals: number;
    manualApprovals: number;
    errors: number;
    totalOperations: number;
  }> {
    const stats = {
      autoApprovals: 0,
      manualApprovals: 0,
      errors: 0,
      totalOperations: 0
    };

    try {
      const files = await fs.readdir(this.config.reportsDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      for (const file of files) {
        if (!file.match(/^(auto|manual|trust-error)-trust-log-.*\.md$/)) {
          continue;
        }

        const filePath = join(this.config.reportsDir, file);
        const stat = await fs.stat(filePath);
        
        if (stat.mtime < cutoffDate) {
          continue;
        }

        const content = await fs.readFile(filePath, 'utf-8');
        const entryCount = (content.match(/^## trust-/gm) || []).length;

        if (file.includes('auto-trust-log')) {
          stats.autoApprovals += entryCount;
        } else if (file.includes('manual-trust-log')) {
          stats.manualApprovals += entryCount;
        } else if (file.includes('trust-error-log')) {
          stats.errors += entryCount;
        }
      }

      stats.totalOperations = stats.autoApprovals + stats.manualApprovals;
    } catch (error) {
      console.error('ログ統計の取得に失敗:', error);
    }

    return stats;
  }

  /**
   * 統一されたログ記録メソッド
   */
  async log(entry: AuditLogEntry): Promise<void> {
    if (!this.initialized) {
      await this.ensureLogDirectory();
      this.initialized = true;
    }

    const logLine = JSON.stringify({
      ...entry,
      timestamp: entry.timestamp.toISOString()
    }) + '\n';

    try {
      await fs.appendFile(this.logPath, logLine, 'utf8');
    } catch (error) {
      console.error('Failed to write audit log:', error);
      // Continue execution even if logging fails
    }
  }

  /**
   * ログディレクトリの確保（logメソッド用）
   */
  private async ensureLogDirectory(): Promise<void> {
    const logDir = dirname(this.logPath);
    try {
      await fs.mkdir(logDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create log directory:', error);
      throw error;
    }
  }

}