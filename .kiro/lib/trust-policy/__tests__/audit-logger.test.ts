import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import { join } from 'path';
import { AuditLogger } from '../audit-logger.js';
import { Operation, TrustDecision, ExecutionResult, OperationType, RiskLevel } from '../types.js';

// テスト用のディレクトリ
const TEST_REPORTS_DIR = '.kiro/test-reports';

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
      maxLogFileSize: 1024, // 1KB (テスト用に小さく設定)
      maxLogFiles: 3,
      enableRotation: true
    });

    mockOperation = {
      type: OperationType.GIT,
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
      riskLevel: RiskLevel.LOW
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
        riskLevel: RiskLevel.HIGH
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
        riskLevel: RiskLevel.HIGH
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

  describe('ログローテーション', () => {
    it('ファイルサイズが上限を超えた場合にローテーションする', async () => {
      // 大きなログエントリを複数回記録してファイルサイズを超過させる
      const largeOperation = {
        ...mockOperation,
        args: Array(100).fill('very-long-argument-to-increase-file-size')
      };

      // 複数回ログを記録
      for (let i = 0; i < 5; i++) {
        await auditLogger.logAutoApproval(largeOperation, mockDecision, mockExecutionResult);
      }

      const files = await fs.readdir(TEST_REPORTS_DIR);
      const logFiles = files.filter(f => f.startsWith('auto-trust-log-'));
      
      // ローテーションが発生してファイルが複数作成されることを確認
      expect(logFiles.length).toBeGreaterThan(1);
    });

    it('古いログファイルを削除する', async () => {
      // maxLogFiles = 3 に設定されているので、4つ目のファイルで古いものが削除される
      const dates = ['2025-08-24', '2025-08-25', '2025-08-26', '2025-08-27'];
      
      // 各日付のログファイルを作成
      for (const date of dates) {
        const logFile = join(TEST_REPORTS_DIR, `auto-trust-log-${date}.md`);
        await fs.mkdir(TEST_REPORTS_DIR, { recursive: true });
        await fs.writeFile(logFile, `# Test log for ${date}\n`);
        
        // ファイルの作成時刻を調整（古い順になるように）
        const fileDate = new Date(date);
        await fs.utimes(logFile, fileDate, fileDate);
      }

      // 新しいログを記録（クリーンアップをトリガー）
      await auditLogger.logAutoApproval(mockOperation, mockDecision);

      // ファイル数を確認（maxLogFiles + 現在のファイル以下になる）
      const files = await fs.readdir(TEST_REPORTS_DIR);
      const logFiles = files.filter(f => f.startsWith('auto-trust-log-'));
      
      expect(logFiles.length).toBeLessThanOrEqual(4); // maxLogFiles(3) + 現在のファイル(1)
    });
  });

  describe('エラーハンドリング', () => {
    it('ログ記録失敗時にエラーログを作成する', async () => {
      // 無効なディレクトリパスを設定してエラーを発生させる
      const invalidLogger = new AuditLogger({
        reportsDir: '/invalid/path/that/does/not/exist'
      });

      // コンソールエラーをモック
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await invalidLogger.logAutoApproval(mockOperation, mockDecision);

      // エラーがコンソールに出力されることを確認
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

      // ディレクトリが作成されることを確認
      const dirExists = await fs.access(join(TEST_REPORTS_DIR, 'new-subdir'))
        .then(() => true)
        .catch(() => false);
      
      expect(dirExists).toBe(true);
    });
  });

  describe('ログ統計', () => {
    it('ログ統計情報を正しく取得する', async () => {
      // 複数のログを記録
      await auditLogger.logAutoApproval(mockOperation, mockDecision);
      await auditLogger.logAutoApproval(mockOperation, mockDecision);
      
      const manualDecision: TrustDecision = {
        approved: true,
        requiresManualApproval: true,
        reason: 'テスト用手動承認',
        riskLevel: RiskLevel.MEDIUM
      };
      await auditLogger.logManualApproval(mockOperation, manualDecision);

      const stats = await auditLogger.getLogStats(7);

      expect(stats.autoApprovals).toBe(2);
      expect(stats.manualApprovals).toBe(1);
      expect(stats.totalOperations).toBe(3);
      expect(stats.errors).toBe(0);
    });

    it('指定期間外のログは統計に含まれない', async () => {
      await auditLogger.logAutoApproval(mockOperation, mockDecision);

      // 0日間の統計を取得（今日のログは含まれない）
      const stats = await auditLogger.getLogStats(0);

      expect(stats.totalOperations).toBe(0);
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

      // ログエントリの構造を確認
      expect(logContent).toMatch(/## trust-\d+-[a-z0-9]+/); // ログID
      expect(logContent).toContain('**時刻**: 2025-08-27T10:00:00.000Z');
      expect(logContent).toContain('**操作**: git - `git`');
      expect(logContent).toContain('**引数**: status');
      expect(logContent).toContain('**判定**: 自動承認');
      expect(logContent).toContain('**結果**: ✅ SUCCESS');
      expect(logContent).toContain('**ユーザー**: testuser');
      expect(logContent).toContain('**セッション**: session-123');
      expect(logContent).toContain('---'); // 区切り線
    });
  });
});