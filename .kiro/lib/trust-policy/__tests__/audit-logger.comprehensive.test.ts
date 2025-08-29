import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import { join } from 'path';
import { AuditLogger } from '../audit-logger.js';
import { Operation, TrustDecision, ExecutionResult, OperationType, RiskLevel } from '../types.js';

// テスト用のディレクトリ
const TEST_REPORTS_DIR = '.kiro/test-reports-comprehensive';

describe('AuditLogger - 包括的テスト', () => {
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
      maxLogFileSize: 2048, // 2KB (テスト用に小さく設定)
      maxLogFiles: 5,
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

  describe('ログ記録の詳細テスト', () => {
    describe('自動承認ログの詳細記録', () => {
      it('すべての操作タイプの自動承認ログを正しく記録する', async () => {
        const operationTypes = [
          { type: OperationType.GIT, command: 'git', args: ['status'] },
          { type: OperationType.FILE, command: 'touch', args: ['file.txt'] },
          { type: OperationType.CLI, command: 'vercel', args: ['status'] },
          { type: OperationType.SCRIPT, command: 'node', args: ['script.mjs'] },
          { type: OperationType.MCP, command: 'mcp-call', args: ['github', 'list_repos'] }
        ];

        for (const { type, command, args } of operationTypes) {
          const operation: Operation = {
            type,
            command,
            args,
            context: {
              workingDirectory: '/test',
              user: 'testuser',
              sessionId: 'test-session'
            },
            timestamp: new Date('2025-08-27T10:00:00Z')
          };

          await auditLogger.logAutoApproval(operation, mockDecision, mockExecutionResult);
        }

        const logFile = join(TEST_REPORTS_DIR, 'auto-trust-log-2025-08-27.md');
        const logContent = await fs.readFile(logFile, 'utf-8');

        // すべての操作タイプがログに記録されていることを確認
        expect(logContent).toContain('**操作**: git - `git`');
        expect(logContent).toContain('**操作**: file - `touch`');
        expect(logContent).toContain('**操作**: cli - `vercel`');
        expect(logContent).toContain('**操作**: script - `node`');
        expect(logContent).toContain('**操作**: mcp - `mcp-call`');
      });

      it('リスクレベル別のログ記録を正しく行う', async () => {
        const riskLevels = [
          { level: RiskLevel.LOW, emoji: '🟢' },
          { level: RiskLevel.MEDIUM, emoji: '🟡' },
          { level: RiskLevel.HIGH, emoji: '🔴' }
        ];

        for (const { level, emoji } of riskLevels) {
          const decision: TrustDecision = {
            ...mockDecision,
            riskLevel: level
          };

          await auditLogger.logAutoApproval(mockOperation, decision, mockExecutionResult);
        }

        const logFile = join(TEST_REPORTS_DIR, 'auto-trust-log-2025-08-27.md');
        const logContent = await fs.readFile(logFile, 'utf-8');

        // すべてのリスクレベルの絵文字が記録されていることを確認
        riskLevels.forEach(({ emoji }) => {
          expect(logContent).toContain(emoji);
        });
      });

      it('実行結果の詳細情報を正しく記録する', async () => {
        const executionResults = [
          {
            result: { success: true, executionTime: 100, output: 'Success output' },
            expectedStatus: '✅ SUCCESS',
            expectedTime: '100ms'
          },
          {
            result: { success: false, executionTime: 200, errorMessage: 'Error occurred' },
            expectedStatus: '❌ FAILED',
            expectedTime: '200ms'
          },
          {
            result: { success: true, executionTime: 0 },
            expectedStatus: '✅ SUCCESS',
            expectedTime: '0ms'
          }
        ];

        for (const { result, expectedStatus, expectedTime } of executionResults) {
          await auditLogger.logAutoApproval(mockOperation, mockDecision, result);
        }

        const logFile = join(TEST_REPORTS_DIR, 'auto-trust-log-2025-08-27.md');
        const logContent = await fs.readFile(logFile, 'utf-8');

        executionResults.forEach(({ expectedStatus, expectedTime }) => {
          expect(logContent).toContain(`**結果**: ${expectedStatus}`);
          expect(logContent).toContain(`**実行時間**: ${expectedTime}`);
        });
      });

      it('長い出力を適切に切り詰める', async () => {
        const longOutput = 'A'.repeat(2000); // 2000文字の長い出力
        const longResult: ExecutionResult = {
          success: true,
          executionTime: 100,
          output: longOutput
        };

        await auditLogger.logAutoApproval(mockOperation, mockDecision, longResult);

        const logFile = join(TEST_REPORTS_DIR, 'auto-trust-log-2025-08-27.md');
        const logContent = await fs.readFile(logFile, 'utf-8');

        // 出力が切り詰められていることを確認
        expect(logContent).toContain('...[truncated]');
        expect(logContent).not.toContain('A'.repeat(1000));
      });
    });

    describe('手動承認ログの詳細記録', () => {
      it('承認・拒否の両パターンを正しく記録する', async () => {
        const approvalCases = [
          {
            decision: { ...mockDecision, approved: true, requiresManualApproval: true },
            expectedStatus: '✅ 承認'
          },
          {
            decision: { ...mockDecision, approved: false, requiresManualApproval: true },
            expectedStatus: '❌ 拒否'
          }
        ];

        for (const { decision, expectedStatus } of approvalCases) {
          await auditLogger.logManualApproval(mockOperation, decision, mockExecutionResult);
        }

        const logFile = join(TEST_REPORTS_DIR, 'manual-trust-log-2025-08-27.md');
        const logContent = await fs.readFile(logFile, 'utf-8');

        approvalCases.forEach(({ expectedStatus }) => {
          expect(logContent).toContain(`**判定**: 手動承認 - ${expectedStatus}`);
        });
      });

      it('手動承認の理由を詳細に記録する', async () => {
        const reasons = [
          '削除系操作のため手動承認が必要',
          '強制系操作のため手動承認が必要',
          '本番環境に影響する操作のため手動承認が必要',
          'セキュリティ上の理由により手動承認が必要'
        ];

        for (const reason of reasons) {
          const decision: TrustDecision = {
            ...mockDecision,
            requiresManualApproval: true,
            reason
          };

          await auditLogger.logManualApproval(mockOperation, decision, mockExecutionResult);
        }

        const logFile = join(TEST_REPORTS_DIR, 'manual-trust-log-2025-08-27.md');
        const logContent = await fs.readFile(logFile, 'utf-8');

        reasons.forEach(reason => {
          expect(logContent).toContain(`**理由**: ${reason}`);
        });
      });

      it('ユーザー情報とセッション情報を正しく記録する', async () => {
        const userSessions = [
          { user: 'user1', sessionId: 'session-123' },
          { user: 'user2', sessionId: 'session-456' },
          { user: 'admin', sessionId: 'admin-session-789' }
        ];

        for (const { user, sessionId } of userSessions) {
          const manualDecision: TrustDecision = {
            ...mockDecision,
            requiresManualApproval: true
          };

          await auditLogger.logManualApproval(mockOperation, manualDecision, mockExecutionResult, user, sessionId);
        }

        const logFile = join(TEST_REPORTS_DIR, 'manual-trust-log-2025-08-27.md');
        const logContent = await fs.readFile(logFile, 'utf-8');

        userSessions.forEach(({ user, sessionId }) => {
          expect(logContent).toContain(`**ユーザー**: ${user}`);
          expect(logContent).toContain(`**セッション**: ${sessionId}`);
        });
      });
    });

    describe('エラーログの詳細記録', () => {
      it('システムエラーを詳細に記録する', async () => {
        const errors = [
          new Error('File system error'),
          new Error('Network timeout'),
          new Error('Permission denied'),
          new Error('Invalid configuration')
        ];

        for (const error of errors) {
          await auditLogger.logError(error, mockOperation, 'System error occurred');
        }

        const logFile = join(TEST_REPORTS_DIR, 'trust-error-log-2025-08-27.md');
        const logContent = await fs.readFile(logFile, 'utf-8');

        errors.forEach(error => {
          expect(logContent).toContain(error.message);
        });
        expect(logContent).toContain('System error occurred');
      });

      it('スタックトレースを適切に記録する', async () => {
        const errorWithStack = new Error('Test error');
        errorWithStack.stack = 'Error: Test error\n    at test.js:1:1\n    at main.js:2:2';

        await auditLogger.logError(errorWithStack, mockOperation, 'Error with stack trace');

        const logFile = join(TEST_REPORTS_DIR, 'trust-error-log-2025-08-27.md');
        const logContent = await fs.readFile(logFile, 'utf-8');

        expect(logContent).toContain('**スタックトレース**:');
        expect(logContent).toContain('at test.js:1:1');
        expect(logContent).toContain('at main.js:2:2');
      });
    });
  });

  describe('ファイルローテーションの詳細テスト', () => {
    describe('サイズベースローテーション', () => {
      it('ファイルサイズ上限を超えた場合に新しいファイルを作成する', async () => {
        // 大きなログエントリを作成してファイルサイズを超過させる
        const largeOperation = {
          ...mockOperation,
          args: Array(200).fill('very-long-argument-to-increase-file-size-significantly')
        };

        // 複数回ログを記録してファイルサイズを超過させる
        for (let i = 0; i < 10; i++) {
          await auditLogger.logAutoApproval(largeOperation, mockDecision, mockExecutionResult);
        }

        const files = await fs.readdir(TEST_REPORTS_DIR);
        const logFiles = files.filter(f => f.startsWith('auto-trust-log-'));
        
        // ローテーションが発生してファイルが複数作成されることを確認
        expect(logFiles.length).toBeGreaterThan(1);
      });

      it('ローテーション後のファイル名が正しい形式になる', async () => {
        // ファイルサイズを超過させる
        const largeOperation = {
          ...mockOperation,
          args: Array(200).fill('large-content')
        };

        for (let i = 0; i < 10; i++) {
          await auditLogger.logAutoApproval(largeOperation, mockDecision, mockExecutionResult);
        }

        const files = await fs.readdir(TEST_REPORTS_DIR);
        const logFiles = files.filter(f => f.startsWith('auto-trust-log-'));
        
        // ファイル名の形式を確認
        logFiles.forEach(fileName => {
          expect(fileName).toMatch(/^auto-trust-log-\d{4}-\d{2}-\d{2}(-\d+)?\.md$/);
        });
      });

      it('各ローテーションファイルが適切なヘッダーを持つ', async () => {
        // ファイルサイズを超過させる
        const largeOperation = {
          ...mockOperation,
          args: Array(200).fill('large-content')
        };

        for (let i = 0; i < 10; i++) {
          await auditLogger.logAutoApproval(largeOperation, mockDecision, mockExecutionResult);
        }

        const files = await fs.readdir(TEST_REPORTS_DIR);
        const logFiles = files.filter(f => f.startsWith('auto-trust-log-'));
        
        // 各ファイルのヘッダーを確認
        for (const fileName of logFiles) {
          const filePath = join(TEST_REPORTS_DIR, fileName);
          const content = await fs.readFile(filePath, 'utf-8');
          
          expect(content).toContain('# 自動承認ログ');
          expect(content).toContain('Trust承認システムの監査ログ');
          expect(content).toContain('**ファイル**:');
        }
      });
    });

    describe('ファイル数制限', () => {
      it('最大ファイル数を超えた場合に古いファイルを削除する', async () => {
        // maxLogFiles = 5 に設定されているので、6つ目のファイルで古いものが削除される
        const dates = [
          '2025-08-20', '2025-08-21', '2025-08-22', 
          '2025-08-23', '2025-08-24', '2025-08-25', '2025-08-26'
        ];
        
        // 各日付のログファイルを作成
        for (const date of dates) {
          const logFile = join(TEST_REPORTS_DIR, `auto-trust-log-${date}.md`);
          await fs.mkdir(TEST_REPORTS_DIR, { recursive: true });
          await fs.writeFile(logFile, `# Test log for ${date}\nTest content\n`);
          
          // ファイルの作成時刻を調整（古い順になるように）
          const fileDate = new Date(date);
          await fs.utimes(logFile, fileDate, fileDate);
        }

        // 新しいログを記録（クリーンアップをトリガー）
        await auditLogger.logAutoApproval(mockOperation, mockDecision);

        // ファイル数を確認
        const files = await fs.readdir(TEST_REPORTS_DIR);
        const logFiles = files.filter(f => f.startsWith('auto-trust-log-'));
        
        expect(logFiles.length).toBeLessThanOrEqual(6); // maxLogFiles(5) + 現在のファイル(1)
      });

      it('削除されるファイルが最も古いファイルであることを確認', async () => {
        const dates = ['2025-08-20', '2025-08-21', '2025-08-22', '2025-08-23', '2025-08-24', '2025-08-25'];
        
        // 各日付のログファイルを作成
        for (const date of dates) {
          const logFile = join(TEST_REPORTS_DIR, `auto-trust-log-${date}.md`);
          await fs.mkdir(TEST_REPORTS_DIR, { recursive: true });
          await fs.writeFile(logFile, `# Test log for ${date}\n`);
          
          const fileDate = new Date(date);
          await fs.utimes(logFile, fileDate, fileDate);
        }

        // 新しいログを記録
        await auditLogger.logAutoApproval(mockOperation, mockDecision);

        const files = await fs.readdir(TEST_REPORTS_DIR);
        const logFiles = files.filter(f => f.startsWith('auto-trust-log-'));
        
        // 最も古いファイル（2025-08-20）が削除されていることを確認
        expect(logFiles).not.toContain('auto-trust-log-2025-08-20.md');
        
        // 新しいファイルは残っていることを確認
        expect(logFiles).toContain('auto-trust-log-2025-08-25.md');
      });
    });

    describe('日付ベースローテーション', () => {
      it('日付が変わった場合に新しいファイルを作成する', async () => {
        // 異なる日付でログを記録
        const dates = [
          new Date('2025-08-25T10:00:00Z'),
          new Date('2025-08-26T10:00:00Z'),
          new Date('2025-08-27T10:00:00Z')
        ];

        for (const date of dates) {
          const operation = { ...mockOperation, timestamp: date };
          await auditLogger.logAutoApproval(operation, mockDecision, mockExecutionResult);
        }

        const files = await fs.readdir(TEST_REPORTS_DIR);
        const logFiles = files.filter(f => f.startsWith('auto-trust-log-'));
        
        // 各日付のファイルが作成されることを確認
        expect(logFiles).toContain('auto-trust-log-2025-08-25.md');
        expect(logFiles).toContain('auto-trust-log-2025-08-26.md');
        expect(logFiles).toContain('auto-trust-log-2025-08-27.md');
      });

      it('同じ日付内では同じファイルに追記される', async () => {
        const sameDate = new Date('2025-08-27T10:00:00Z');
        
        // 同じ日付で複数回ログを記録
        for (let i = 0; i < 5; i++) {
          const operation = { ...mockOperation, timestamp: sameDate };
          await auditLogger.logAutoApproval(operation, mockDecision, mockExecutionResult);
        }

        const files = await fs.readdir(TEST_REPORTS_DIR);
        const logFiles = files.filter(f => f.startsWith('auto-trust-log-2025-08-27'));
        
        // 同じ日付のファイルは1つだけ（サイズ制限に達していない場合）
        expect(logFiles.length).toBe(1);
        
        // ファイル内容に複数のエントリが含まれることを確認
        const logFile = join(TEST_REPORTS_DIR, logFiles[0]);
        const content = await fs.readFile(logFile, 'utf-8');
        const entryCount = (content.match(/## trust-/g) || []).length;
        expect(entryCount).toBe(5);
      });
    });
  });

  describe('ログ統計とメトリクス', () => {
    describe('統計情報の詳細計算', () => {
      it('複数日にわたる統計を正しく計算する', async () => {
        const testData = [
          { date: '2025-08-25', autoCount: 10, manualCount: 2 },
          { date: '2025-08-26', autoCount: 15, manualCount: 3 },
          { date: '2025-08-27', autoCount: 20, manualCount: 1 }
        ];

        for (const { date, autoCount, manualCount } of testData) {
          const timestamp = new Date(`${date}T10:00:00Z`);
          
          // 自動承認ログを記録
          for (let i = 0; i < autoCount; i++) {
            const operation = { ...mockOperation, timestamp };
            await auditLogger.logAutoApproval(operation, mockDecision, mockExecutionResult);
          }
          
          // 手動承認ログを記録
          for (let i = 0; i < manualCount; i++) {
            const operation = { ...mockOperation, timestamp };
            const manualDecision = { ...mockDecision, requiresManualApproval: true };
            await auditLogger.logManualApproval(operation, manualDecision, mockExecutionResult);
          }
        }

        const stats = await auditLogger.getLogStats(7);

        expect(stats.autoApprovals).toBe(45); // 10 + 15 + 20
        expect(stats.manualApprovals).toBe(6); // 2 + 3 + 1
        expect(stats.totalOperations).toBe(51);
        expect(stats.autoApprovalRate).toBeCloseTo(88.24, 2); // 45/51 * 100
      });

      it('エラー統計を正しく計算する', async () => {
        // 正常な操作
        await auditLogger.logAutoApproval(mockOperation, mockDecision, mockExecutionResult);
        
        // エラーのある操作
        const errorResult: ExecutionResult = {
          success: false,
          executionTime: 100,
          errorMessage: 'Test error'
        };
        await auditLogger.logAutoApproval(mockOperation, mockDecision, errorResult);
        
        // システムエラー
        await auditLogger.logError(new Error('System error'), mockOperation, 'Test system error');

        const stats = await auditLogger.getLogStats(1);

        expect(stats.totalOperations).toBe(2);
        expect(stats.errors).toBe(1); // システムエラーのみカウント
        expect(stats.failedOperations).toBe(1); // 実行失敗した操作
      });

      it('期間指定による統計フィルタリングが正しく動作する', async () => {
        const dates = [
          new Date('2025-08-20T10:00:00Z'), // 7日前
          new Date('2025-08-24T10:00:00Z'), // 3日前
          new Date('2025-08-27T10:00:00Z')  // 今日
        ];

        for (const date of dates) {
          const operation = { ...mockOperation, timestamp: date };
          await auditLogger.logAutoApproval(operation, mockDecision, mockExecutionResult);
        }

        // 過去3日間の統計
        const stats3Days = await auditLogger.getLogStats(3);
        expect(stats3Days.totalOperations).toBe(2); // 3日前と今日

        // 過去7日間の統計
        const stats7Days = await auditLogger.getLogStats(7);
        expect(stats7Days.totalOperations).toBe(3); // すべて
      });
    });

    describe('パフォーマンスメトリクス', () => {
      it('実行時間の統計を正しく計算する', async () => {
        const executionTimes = [100, 200, 150, 300, 50];
        
        for (const time of executionTimes) {
          const result: ExecutionResult = {
            success: true,
            executionTime: time,
            output: 'Test output'
          };
          await auditLogger.logAutoApproval(mockOperation, mockDecision, result);
        }

        const stats = await auditLogger.getLogStats(1);

        expect(stats.averageExecutionTime).toBe(160); // (100+200+150+300+50)/5
        expect(stats.maxExecutionTime).toBe(300);
        expect(stats.minExecutionTime).toBe(50);
      });

      it('操作タイプ別の統計を正しく計算する', async () => {
        const operationTypes = [
          { type: OperationType.GIT, count: 5 },
          { type: OperationType.FILE, count: 3 },
          { type: OperationType.CLI, count: 2 },
          { type: OperationType.MCP, count: 1 }
        ];

        for (const { type, count } of operationTypes) {
          for (let i = 0; i < count; i++) {
            const operation = { ...mockOperation, type };
            await auditLogger.logAutoApproval(operation, mockDecision, mockExecutionResult);
          }
        }

        const stats = await auditLogger.getLogStats(1);

        expect(stats.operationsByType.git).toBe(5);
        expect(stats.operationsByType.file).toBe(3);
        expect(stats.operationsByType.cli).toBe(2);
        expect(stats.operationsByType.mcp).toBe(1);
      });
    });
  });

  describe('エラーハンドリングとリカバリ', () => {
    describe('ファイルシステムエラー', () => {
      it('ディスク容量不足時の適切な処理', async () => {
        // ファイル書き込みをモックしてエラーを発生させる
        const originalWriteFile = fs.writeFile;
        const writeFileSpy = vi.spyOn(fs, 'writeFile').mockRejectedValue(new Error('ENOSPC: no space left on device'));
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        await auditLogger.logAutoApproval(mockOperation, mockDecision, mockExecutionResult);

        expect(consoleSpy).toHaveBeenCalledWith(
          '自動承認ログの記録に失敗しました:',
          expect.any(Error)
        );

        writeFileSpy.mockRestore();
        consoleSpy.mockRestore();
      });

      it('権限エラー時の適切な処理', async () => {
        const writeFileSpy = vi.spyOn(fs, 'writeFile').mockRejectedValue(new Error('EACCES: permission denied'));
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        await auditLogger.logAutoApproval(mockOperation, mockDecision, mockExecutionResult);

        expect(consoleSpy).toHaveBeenCalledWith(
          '自動承認ログの記録に失敗しました:',
          expect.any(Error)
        );

        writeFileSpy.mockRestore();
        consoleSpy.mockRestore();
      });

      it('ディレクトリ作成失敗時の適切な処理', async () => {
        const mkdirSpy = vi.spyOn(fs, 'mkdir').mockRejectedValue(new Error('EACCES: permission denied'));
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        await auditLogger.logAutoApproval(mockOperation, mockDecision, mockExecutionResult);

        expect(consoleSpy).toHaveBeenCalledWith(
          '自動承認ログの記録に失敗しました:',
          expect.any(Error)
        );

        mkdirSpy.mockRestore();
        consoleSpy.mockRestore();
      });
    });

    describe('データ整合性', () => {
      it('破損したログファイルからの復旧', async () => {
        // 破損したログファイルを作成
        const corruptedLogFile = join(TEST_REPORTS_DIR, 'auto-trust-log-2025-08-27.md');
        await fs.mkdir(TEST_REPORTS_DIR, { recursive: true });
        await fs.writeFile(corruptedLogFile, 'Corrupted content without proper format');

        // 新しいログを記録（破損ファイルがあっても正常に動作することを確認）
        await auditLogger.logAutoApproval(mockOperation, mockDecision, mockExecutionResult);

        const logContent = await fs.readFile(corruptedLogFile, 'utf-8');
        
        // 新しいログが正しく追記されることを確認
        expect(logContent).toContain('## trust-');
        expect(logContent).toContain('**操作**: git - `git`');
      });

      it('不完全なログエントリの処理', async () => {
        // 不完全なログエントリを持つファイルを作成
        const incompleteLogFile = join(TEST_REPORTS_DIR, 'auto-trust-log-2025-08-27.md');
        await fs.mkdir(TEST_REPORTS_DIR, { recursive: true });
        await fs.writeFile(incompleteLogFile, `# 自動承認ログ - 2025-08-27

## trust-incomplete-entry
**時刻**: 2025-08-27T09:00:00.000Z
**操作**: git - \`git\`
// 不完全なエントリ（終了していない）
`);

        // 新しいログを記録
        await auditLogger.logAutoApproval(mockOperation, mockDecision, mockExecutionResult);

        const logContent = await fs.readFile(incompleteLogFile, 'utf-8');
        
        // 新しいログが正しく追記されることを確認
        const entryCount = (logContent.match(/## trust-/g) || []).length;
        expect(entryCount).toBe(2); // 不完全なエントリ + 新しいエントリ
      });
    });

    describe('同時アクセス処理', () => {
      it('複数の同時ログ記録要求を適切に処理する', async () => {
        const promises = Array(10).fill(null).map((_, i) => {
          const operation = {
            ...mockOperation,
            args: [`operation-${i}`]
          };
          return auditLogger.logAutoApproval(operation, mockDecision, mockExecutionResult);
        });

        // すべての記録が完了することを確認
        await Promise.all(promises);

        const logFile = join(TEST_REPORTS_DIR, 'auto-trust-log-2025-08-27.md');
        const logContent = await fs.readFile(logFile, 'utf-8');
        
        // すべてのエントリが記録されることを確認
        const entryCount = (logContent.match(/## trust-/g) || []).length;
        expect(entryCount).toBe(10);
        
        // 各操作が記録されることを確認
        for (let i = 0; i < 10; i++) {
          expect(logContent).toContain(`operation-${i}`);
        }
      });
    });
  });

  describe('パフォーマンステスト', () => {
    it('大量のログ記録を効率的に処理する', async () => {
      const logCount = 1000;
      const startTime = Date.now();

      const promises = Array(logCount).fill(null).map((_, i) => {
        const operation = {
          ...mockOperation,
          args: [`bulk-operation-${i}`]
        };
        return auditLogger.logAutoApproval(operation, mockDecision, mockExecutionResult);
      });

      await Promise.all(promises);
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const avgTimePerLog = totalTime / logCount;

      expect(avgTimePerLog).toBeLessThan(10); // 10ms以内/ログ
      expect(totalTime).toBeLessThan(10000); // 全体で10秒以内
    });

    it('大きなログファイルの読み込みを効率的に処理する', async () => {
      // 大きなログファイルを作成
      for (let i = 0; i < 100; i++) {
        const operation = {
          ...mockOperation,
          args: [`large-file-operation-${i}`]
        };
        await auditLogger.logAutoApproval(operation, mockDecision, mockExecutionResult);
      }

      const startTime = Date.now();
      const stats = await auditLogger.getLogStats(1);
      const endTime = Date.now();

      expect(stats.totalOperations).toBe(100);
      expect(endTime - startTime).toBeLessThan(1000); // 1秒以内
    });
  });
});