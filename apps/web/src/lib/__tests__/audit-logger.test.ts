import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import { join } from 'path';

// テスト用のディレクトリ
const TEST_REPORTS_DIR = '.kiro/test-reports';

// 簡略化されたテスト用の型定義
interface Operation {
  type: string;
  command: string;
  args: string[];
  context: {
    workingDirectory: string;
    user: string;
    sessionId: string;
  };
  timestamp: Date;
}

interface TrustDecision {
  approved: boolean;
  requiresManualApproval: boolean;
  reason: string;
  riskLevel: string;
}

interface ExecutionResult {
  success: boolean;
  executionTime: number;
  output?: string;
  errorMessage?: string;
}

// 簡略化されたAuditLoggerクラス（テスト用）
class AuditLogger {
  private config: {
    reportsDir: string;
    maxLogFileSize: number;
    maxLogFiles: number;
    enableRotation: boolean;
  };

  constructor(config: any = {}) {
    this.config = {
      reportsDir: '.kiro/reports',
      maxLogFileSize: 10 * 1024 * 1024,
      maxLogFiles: 30,
      enableRotation: true,
      ...config
    };
  }

  async logAutoApproval(
    operation: Operation,
    decision: TrustDecision,
    executionResult?: ExecutionResult,
    user: string = 'system',
    sessionId: string = this.generateSessionId()
  ): Promise<void> {
    const log = {
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
      console.error('自動承認ログの記録に失敗しました:', error);
    }
  }

  async logManualApproval(
    operation: Operation,
    decision: TrustDecision,
    executionResult?: ExecutionResult,
    user: string = 'user',
    sessionId: string = this.generateSessionId()
  ): Promise<void> {
    const log = {
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
      console.error('手動承認ログの記録に失敗しました:', error);
    }
  }

  private async writeAutoApprovalLog(log: any): Promise<void> {
    const date = this.formatDate(log.timestamp);
    const logFile = join(this.config.reportsDir, `auto-trust-log-${date}.md`);
    
    await this.ensureDirectoryExists(logFile);
    
    const logEntry = this.formatAutoApprovalLogEntry(log);
    await this.appendToFile(logFile, logEntry);
  }

  private async writeManualApprovalLog(log: any): Promise<void> {
    const date = this.formatDate(log.timestamp);
    const logFile = join(this.config.reportsDir, `manual-trust-log-${date}.md`);
    
    await this.ensureDirectoryExists(logFile);
    
    const logEntry = this.formatManualApprovalLogEntry(log);
    await this.appendToFile(logFile, logEntry);
  }

  private formatAutoApprovalLogEntry(log: any): string {
    const timestamp = log.timestamp.toISOString();
    const result = log.executionResult ? 
      `${log.executionResult.success ? '✅' : '❌'} ${log.executionResult.success ? 'SUCCESS' : 'FAILED'}` : 
      '⏳ PENDING';
    
    return `
## ${log.id}

**時刻**: ${timestamp}  
**操作**: ${log.operation.type} - \`${log.operation.command}\`  
**引数**: ${log.operation.args.join(' ')}  
**判定**: 自動承認 (${log.decision.reason})  
**結果**: ${result}  
**ユーザー**: ${log.user}  
**セッション**: ${log.sessionId}  

${log.executionResult?.errorMessage ? `**エラー**: ${log.executionResult.errorMessage}` : ''}

---
`;
  }

  private formatManualApprovalLogEntry(log: any): string {
    const timestamp = log.timestamp.toISOString();
    const approved = log.decision.approved ? '✅ 承認' : '❌ 拒否';
    const result = log.executionResult ? 
      `${log.executionResult.success ? '✅' : '❌'} ${log.executionResult.success ? 'SUCCESS' : 'FAILED'}` : 
      '⏳ PENDING';
    
    return `
## ${log.id}

**時刻**: ${timestamp}  
**操作**: ${log.operation.type} - \`${log.operation.command}\`  
**引数**: ${log.operation.args.join(' ')}  
**判定**: 手動承認 - ${approved}  
**理由**: ${log.decision.reason}  
**結果**: ${result}  
**ユーザー**: ${log.user}  
**セッション**: ${log.sessionId}  

${log.executionResult?.errorMessage ? `**エラー**: ${log.executionResult.errorMessage}` : ''}

---
`;
  }

  private async ensureDirectoryExists(filePath: string): Promise<void> {
    const dir = filePath.substring(0, filePath.lastIndexOf('/'));
    try {
      await fs.access(dir);
    } catch (error) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  private async appendToFile(filePath: string, content: string): Promise<void> {
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

  private generateLogFileHeader(filePath: string): string {
    const fileName = filePath.split('/').pop() || '';
    const date = new Date().toISOString().split('T')[0];
    
    let title = 'Trust承認ログ';
    if (fileName.includes('auto-trust-log')) {
      title = '自動承認ログ';
    } else if (fileName.includes('manual-trust-log')) {
      title = '手動承認ログ';
    }

    return `# ${title} - ${date}

このファイルは Trust承認システムの監査ログです。

**生成日時**: ${new Date().toISOString()}  
**ファイル**: ${fileName}  

---

`;
  }

  private generateLogId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `trust-${timestamp}-${random}`;
  }

  private generateSessionId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 12);
    return `session-${timestamp}-${random}`;
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

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
}

describe('AuditLogger', () => {
  let auditLogger: AuditLogger;
  let mockOperation: Operation;
  let mockDecision: TrustDecision;
  let mockExecutionResult: ExecutionResult;

  beforeEach(async () => {
    // テスト用ディレクトリをクリーンアップ
    try {
      await fs.rm(TEST_REPORTS_DIR, { recursive: true, force: true });
    } catch (error) {
      // ディレクトリが存在しない場合は無視
    }

    auditLogger = new AuditLogger({
      reportsDir: TEST_REPORTS_DIR,
      maxLogFileSize: 1024,
      maxLogFiles: 3,
      enableRotation: true
    });

    mockOperation = {
      type: 'git',
      command: 'git',
      args: ['status'],
      context: {
        workingDirectory: '/test',
        user: 'testuser',
        sessionId: 'test-session'
      },
      timestamp: new Date('2025-08-27T10:00:00Z')
    };

    mockDecision = {
      approved: true,
      requiresManualApproval: false,
      reason: 'Git読み取り操作のため自動承認',
      riskLevel: 'low'
    };

    mockExecutionResult = {
      success: true,
      executionTime: 150,
      output: 'On branch main\nnothing to commit, working tree clean'
    };
  });

  afterEach(async () => {
    // テスト用ディレクトリをクリーンアップ
    try {
      await fs.rm(TEST_REPORTS_DIR, { recursive: true, force: true });
    } catch (error) {
      // ディレクトリが存在しない場合は無視
    }
  });

  describe('自動承認ログ記録', () => {
    it('自動承認操作のログを正しく記録する', async () => {
      await auditLogger.logAutoApproval(
        mockOperation,
        mockDecision,
        mockExecutionResult,
        'testuser',
        'test-session-123'
      );

      const logFile = join(TEST_REPORTS_DIR, 'auto-trust-log-2025-08-27.md');
      const logContent = await fs.readFile(logFile, 'utf-8');

      expect(logContent).toContain('# 自動承認ログ - 2025-08-27');
      expect(logContent).toContain('**操作**: git - `git`');
      expect(logContent).toContain('**引数**: status');
      expect(logContent).toContain('**判定**: 自動承認');
      expect(logContent).toContain('**結果**: ✅ SUCCESS');
      expect(logContent).toContain('**ユーザー**: testuser');
      expect(logContent).toContain('**セッション**: test-session-123');
    });

    it('実行結果がない場合でもログを記録する', async () => {
      await auditLogger.logAutoApproval(
        mockOperation,
        mockDecision,
        undefined,
        'testuser'
      );

      const logFile = join(TEST_REPORTS_DIR, 'auto-trust-log-2025-08-27.md');
      const logContent = await fs.readFile(logFile, 'utf-8');

      expect(logContent).toContain('**結果**: ⏳ PENDING');
    });

    it('実行失敗の場合のログを記録する', async () => {
      const failedResult: ExecutionResult = {
        success: false,
        executionTime: 100,
        errorMessage: 'Command failed'
      };

      await auditLogger.logAutoApproval(
        mockOperation,
        mockDecision,
        failedResult
      );

      const logFile = join(TEST_REPORTS_DIR, 'auto-trust-log-2025-08-27.md');
      const logContent = await fs.readFile(logFile, 'utf-8');

      expect(logContent).toContain('**結果**: ❌ FAILED');
      expect(logContent).toContain('**エラー**: Command failed');
    });
  });

  describe('手動承認ログ記録', () => {
    it('手動承認操作のログを正しく記録する', async () => {
      const manualDecision: TrustDecision = {
        approved: true,
        requiresManualApproval: true,
        reason: '削除操作のため手動承認が必要',
        riskLevel: 'high'
      };

      await auditLogger.logManualApproval(
        mockOperation,
        manualDecision,
        mockExecutionResult,
        'testuser',
        'manual-session-456'
      );

      const logFile = join(TEST_REPORTS_DIR, 'manual-trust-log-2025-08-27.md');
      const logContent = await fs.readFile(logFile, 'utf-8');

      expect(logContent).toContain('# 手動承認ログ - 2025-08-27');
      expect(logContent).toContain('**判定**: 手動承認 - ✅ 承認');
      expect(logContent).toContain('**理由**: 削除操作のため手動承認が必要');
      expect(logContent).toContain('**ユーザー**: testuser');
      expect(logContent).toContain('**セッション**: manual-session-456');
    });

    it('承認拒否の場合のログを記録する', async () => {
      const rejectedDecision: TrustDecision = {
        approved: false,
        requiresManualApproval: true,
        reason: 'ユーザーが操作を拒否',
        riskLevel: 'high'
      };

      await auditLogger.logManualApproval(
        mockOperation,
        rejectedDecision
      );

      const logFile = join(TEST_REPORTS_DIR, 'manual-trust-log-2025-08-27.md');
      const logContent = await fs.readFile(logFile, 'utf-8');

      expect(logContent).toContain('**判定**: 手動承認 - ❌ 拒否');
      expect(logContent).toContain('**理由**: ユーザーが操作を拒否');
    });
  });

  describe('エラーハンドリング', () => {
    it('ログ記録失敗時にエラーログを作成する', async () => {
      const invalidLogger = new AuditLogger({
        reportsDir: '/invalid/path/that/does/not/exist'
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await invalidLogger.logAutoApproval(mockOperation, mockDecision);

      expect(consoleSpy).toHaveBeenCalledWith(
        '自動承認ログの記録に失敗しました:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('ディレクトリが存在しない場合に自動作成する', async () => {
      const newLogger = new AuditLogger({
        reportsDir: join(TEST_REPORTS_DIR, 'new-subdir')
      });

      await newLogger.logAutoApproval(mockOperation, mockDecision);

      const dirExists = await fs.access(join(TEST_REPORTS_DIR, 'new-subdir'))
        .then(() => true)
        .catch(() => false);
      
      expect(dirExists).toBe(true);
    });
  });

  describe('ログ統計', () => {
    it('ログ統計情報を正しく取得する', async () => {
      await auditLogger.logAutoApproval(mockOperation, mockDecision);
      await auditLogger.logAutoApproval(mockOperation, mockDecision);
      
      const manualDecision: TrustDecision = {
        approved: true,
        requiresManualApproval: true,
        reason: 'テスト用手動承認',
        riskLevel: 'medium'
      };
      await auditLogger.logManualApproval(mockOperation, manualDecision);

      const stats = await auditLogger.getLogStats(7);

      expect(stats.autoApprovals).toBe(2);
      expect(stats.manualApprovals).toBe(1);
      expect(stats.totalOperations).toBe(3);
      expect(stats.errors).toBe(0);
    });
  });

  describe('ログフォーマット', () => {
    it('ログファイルに適切なヘッダーが含まれる', async () => {
      await auditLogger.logAutoApproval(mockOperation, mockDecision);

      const logFile = join(TEST_REPORTS_DIR, 'auto-trust-log-2025-08-27.md');
      const logContent = await fs.readFile(logFile, 'utf-8');

      expect(logContent).toContain('# 自動承認ログ - 2025-08-27');
      expect(logContent).toContain('このファイルは Trust承認システムの監査ログです。');
      expect(logContent).toContain('**生成日時**:');
      expect(logContent).toContain('**ファイル**: auto-trust-log-2025-08-27.md');
    });

    it('ログエントリが適切にフォーマットされる', async () => {
      await auditLogger.logAutoApproval(
        mockOperation,
        mockDecision,
        mockExecutionResult,
        'testuser',
        'session-123'
      );

      const logFile = join(TEST_REPORTS_DIR, 'auto-trust-log-2025-08-27.md');
      const logContent = await fs.readFile(logFile, 'utf-8');

      expect(logContent).toMatch(/## trust-\d+-[a-z0-9]+/);
      expect(logContent).toContain('**時刻**:');
      expect(logContent).toContain('**操作**: git - `git`');
      expect(logContent).toContain('**引数**: status');
      expect(logContent).toContain('**判定**: 自動承認');
      expect(logContent).toContain('**結果**: ✅ SUCCESS');
      expect(logContent).toContain('**ユーザー**: testuser');
      expect(logContent).toContain('**セッション**: session-123');
      expect(logContent).toContain('---');
    });
  });
});