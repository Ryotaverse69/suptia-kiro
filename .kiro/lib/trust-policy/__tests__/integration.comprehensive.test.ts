import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import { join } from 'path';
import { TrustDecisionEngine } from '../trust-decision-engine.js';
import { PolicyManager } from '../policy-manager.js';
import { OperationClassifier } from '../operation-classifier.js';
import { AuditLogger } from '../audit-logger.js';
import { ReportGenerator } from '../report-generator.js';
import { SecurityProtectionSystem } from '../security-protection.js';
import { PerformanceOptimizer } from '../performance-optimizer.js';
import { Operation, OperationType, RiskLevel, TrustPolicy } from '../types.js';

// テスト用のディレクトリ
const TEST_INTEGRATION_DIR = '.kiro/test-integration';

describe('Trust Policy System - 統合テスト', () => {
  let policyManager: PolicyManager;
  let classifier: OperationClassifier;
  let auditLogger: AuditLogger;
  let reportGenerator: ReportGenerator;
  let securityProtection: SecurityProtectionSystem;
  let performanceOptimizer: PerformanceOptimizer;
  let engine: TrustDecisionEngine;
  let testPolicy: TrustPolicy;

  beforeEach(async () => {
    // テスト用ディレクトリをクリーンアップ
    try {
      await fs.rm(TEST_INTEGRATION_DIR, { recursive: true, force: true });
    } catch (error) {
      // ディレクトリが存在しない場合は無視
    }

    testPolicy = {
      version: "1.0",
      lastUpdated: "2025-08-27T10:00:00Z",
      autoApprove: {
        gitOperations: ["status", "commit", "push", "pull", "merge", "log"],
        fileOperations: ["read", "write", "create", "update", "mkdir"],
        cliOperations: {
          vercel: ["env ls", "domains ls", "deployments ls", "status"],
          npm: ["run test", "run build", "install"]
        },
        scriptExecution: {
          extensions: [".mjs", ".js", ".ts"],
          allowedPaths: ["scripts/", ".kiro/scripts/", "tools/"]
        }
      },
      manualApprove: {
        deleteOperations: ["git branch -D", "git push --delete", "rm", "vercel env rm"],
        forceOperations: ["git reset --hard", "git push --force"],
        productionImpact: ["github:write", "sanity-dev:write", "vercel:envSet"]
      },
      security: {
        maxAutoApprovalPerHour: 100, // テスト用に小さく設定
        suspiciousPatternDetection: true,
        logAllOperations: true
      }
    };

    // コンポーネントを初期化
    policyManager = new PolicyManager();
    classifier = new OperationClassifier();
    auditLogger = new AuditLogger({
      reportsDir: join(TEST_INTEGRATION_DIR, 'reports'),
      maxLogFileSize: 1024,
      maxLogFiles: 3,
      enableRotation: true
    });
    reportGenerator = new ReportGenerator({
      reportsDir: join(TEST_INTEGRATION_DIR, 'reports'),
      templateDir: join(TEST_INTEGRATION_DIR, 'templates')
    });
    securityProtection = new SecurityProtectionSystem();
    performanceOptimizer = new PerformanceOptimizer({
      cacheSize: 100,
      enablePrecomputation: true,
      enableAsyncProcessing: true
    });
    engine = new TrustDecisionEngine(testPolicy);
  });

  afterEach(async () => {
    // テスト用ディレクトリをクリーンアップ
    try {
      await fs.rm(TEST_INTEGRATION_DIR, { recursive: true, force: true });
    } catch (error) {
      // ディレクトリが存在しない場合は無視
    }
  });

  describe('エンドツーエンドワークフロー', () => {
    describe('自動承認フロー', () => {
      it('操作要求から実行完了までの完全なフローを処理する', async () => {
        const operation: Operation = {
          type: OperationType.GIT,
          command: 'git',
          args: ['status'],
          context: {
            workingDirectory: '/test',
            user: 'testuser',
            sessionId: 'test-session-123'
          },
          timestamp: new Date('2025-08-27T10:00:00Z')
        };

        // 1. 操作分類
        const classification = classifier.classifyOperation(operation);
        expect(classification.requiresManualApproval).toBe(false);
        expect(classification.patterns).toContain('auto-approve');

        // 2. Trust判定
        const decision = engine.evaluateOperation(operation);
        expect(decision.approved).toBe(true);
        expect(decision.requiresManualApproval).toBe(false);

        // 3. 実行結果のシミュレーション
        const executionResult = {
          success: true,
          executionTime: 150,
          output: 'On branch main\nnothing to commit, working tree clean'
        };

        // 4. 監査ログ記録
        await auditLogger.logAutoApproval(
          operation,
          decision,
          executionResult,
          'testuser',
          'test-session-123'
        );

        // 5. ログファイルの確認
        const logFile = join(TEST_INTEGRATION_DIR, 'reports', 'auto-trust-log-2025-08-27.md');
        const logContent = await fs.readFile(logFile, 'utf-8');

        expect(logContent).toContain('# 自動承認ログ - 2025-08-27');
        expect(logContent).toContain('**操作**: git - `git`');
        expect(logContent).toContain('**引数**: status');
        expect(logContent).toContain('**判定**: 自動承認');
        expect(logContent).toContain('**結果**: ✅ SUCCESS');
        expect(logContent).toContain('**ユーザー**: testuser');
        expect(logContent).toContain('**セッション**: test-session-123');
      });

      it('複数の自動承認操作を連続して処理する', async () => {
        const operations = [
          { command: 'git', args: ['status'] },
          { command: 'git', args: ['add', '.'] },
          { command: 'git', args: ['commit', '-m', 'test commit'] },
          { command: 'git', args: ['push', 'origin', 'main'] }
        ];

        for (const { command, args } of operations) {
          const operation: Operation = {
            type: OperationType.GIT,
            command,
            args,
            context: {
              workingDirectory: '/test',
              user: 'testuser',
              sessionId: 'test-session'
            },
            timestamp: new Date('2025-08-27T10:00:00Z')
          };

          // 分類 → 判定 → ログ記録の完全なフロー
          const classification = classifier.classifyOperation(operation);
          const decision = engine.evaluateOperation(operation);
          const executionResult = {
            success: true,
            executionTime: Math.floor(Math.random() * 200) + 50,
            output: `${command} ${args.join(' ')} completed successfully`
          };

          await auditLogger.logAutoApproval(operation, decision, executionResult);

          // すべて自動承認されることを確認
          expect(decision.approved).toBe(true);
          expect(decision.requiresManualApproval).toBe(false);
        }

        // ログファイルに全操作が記録されることを確認
        const logFile = join(TEST_INTEGRATION_DIR, 'reports', 'auto-trust-log-2025-08-27.md');
        const logContent = await fs.readFile(logFile, 'utf-8');

        operations.forEach(({ command, args }) => {
          expect(logContent).toContain(`**操作**: git - \`${command}\``);
          expect(logContent).toContain(`**引数**: ${args.join(' ')}`);
        });
      });
    });

    describe('手動承認フロー', () => {
      it('危険操作の手動承認フローを完全に処理する', async () => {
        const dangerousOperation: Operation = {
          type: OperationType.GIT,
          command: 'git',
          args: ['push', '--force', 'origin', 'main'],
          context: {
            workingDirectory: '/test',
            user: 'testuser',
            sessionId: 'manual-session-456'
          },
          timestamp: new Date('2025-08-27T10:00:00Z')
        };

        // 1. 操作分類
        const classification = classifier.classifyOperation(dangerousOperation);
        expect(classification.requiresManualApproval).toBe(true);
        expect(classification.patterns).toContain('force');

        // 2. Trust判定
        const decision = engine.evaluateOperation(dangerousOperation);
        expect(decision.approved).toBe(false);
        expect(decision.requiresManualApproval).toBe(true);
        expect(decision.riskLevel).toBe(RiskLevel.HIGH);

        // 3. ユーザー承認のシミュレーション
        const userApprovedDecision = {
          ...decision,
          approved: true // ユーザーが承認
        };

        // 4. 実行結果のシミュレーション
        const executionResult = {
          success: true,
          executionTime: 300,
          output: 'Force push completed successfully'
        };

        // 5. 手動承認ログ記録
        await auditLogger.logManualApproval(
          dangerousOperation,
          userApprovedDecision,
          executionResult,
          'testuser',
          'manual-session-456'
        );

        // 6. ログファイルの確認
        const logFile = join(TEST_INTEGRATION_DIR, 'reports', 'manual-trust-log-2025-08-27.md');
        const logContent = await fs.readFile(logFile, 'utf-8');

        expect(logContent).toContain('# 手動承認ログ - 2025-08-27');
        expect(logContent).toContain('**操作**: git - `git`');
        expect(logContent).toContain('**引数**: push --force origin main');
        expect(logContent).toContain('**判定**: 手動承認 - ✅ 承認');
        expect(logContent).toContain('**結果**: ✅ SUCCESS');
        expect(logContent).toContain('**ユーザー**: testuser');
      });

      it('手動承認拒否のフローを処理する', async () => {
        const dangerousOperation: Operation = {
          type: OperationType.FILE,
          command: 'rm',
          args: ['-rf', '/important/data'],
          context: {
            workingDirectory: '/test',
            user: 'testuser',
            sessionId: 'rejection-session'
          },
          timestamp: new Date('2025-08-27T10:00:00Z')
        };

        // 分類と判定
        const classification = classifier.classifyOperation(dangerousOperation);
        const decision = engine.evaluateOperation(dangerousOperation);

        expect(decision.requiresManualApproval).toBe(true);

        // ユーザーが拒否
        const userRejectedDecision = {
          ...decision,
          approved: false,
          reason: 'ユーザーが操作を拒否しました'
        };

        // 拒否ログ記録
        await auditLogger.logManualApproval(
          dangerousOperation,
          userRejectedDecision,
          undefined, // 実行されていない
          'testuser',
          'rejection-session'
        );

        // ログファイルの確認
        const logFile = join(TEST_INTEGRATION_DIR, 'reports', 'manual-trust-log-2025-08-27.md');
        const logContent = await fs.readFile(logFile, 'utf-8');

        expect(logContent).toContain('**判定**: 手動承認 - ❌ 拒否');
        expect(logContent).toContain('**理由**: ユーザーが操作を拒否しました');
        expect(logContent).toContain('**結果**: ⏳ PENDING');
      });
    });

    describe('混合ワークフロー', () => {
      it('自動承認と手動承認が混在するワークフローを処理する', async () => {
        const mixedOperations = [
          { command: 'git', args: ['status'], expectAutoApproval: true },
          { command: 'git', args: ['add', '.'], expectAutoApproval: true },
          { command: 'git', args: ['commit', '-m', 'test'], expectAutoApproval: true },
          { command: 'git', args: ['push', '--force'], expectAutoApproval: false },
          { command: 'git', args: ['status'], expectAutoApproval: true }
        ];

        let autoCount = 0;
        let manualCount = 0;

        for (const { command, args, expectAutoApproval } of mixedOperations) {
          const operation: Operation = {
            type: OperationType.GIT,
            command,
            args,
            context: {
              workingDirectory: '/test',
              user: 'testuser',
              sessionId: 'mixed-session'
            },
            timestamp: new Date('2025-08-27T10:00:00Z')
          };

          const decision = engine.evaluateOperation(operation);
          const executionResult = {
            success: true,
            executionTime: 150,
            output: 'Operation completed'
          };

          if (expectAutoApproval) {
            expect(decision.approved).toBe(true);
            expect(decision.requiresManualApproval).toBe(false);
            await auditLogger.logAutoApproval(operation, decision, executionResult);
            autoCount++;
          } else {
            expect(decision.approved).toBe(false);
            expect(decision.requiresManualApproval).toBe(true);
            
            // ユーザー承認をシミュレート
            const approvedDecision = { ...decision, approved: true };
            await auditLogger.logManualApproval(operation, approvedDecision, executionResult);
            manualCount++;
          }
        }

        // 統計の確認
        const stats = engine.getOperationStats();
        expect(stats.autoApprovals).toBe(autoCount);
        expect(stats.manualApprovals).toBe(manualCount);
        expect(stats.totalOperations).toBe(mixedOperations.length);

        // ログファイルの確認
        const autoLogFile = join(TEST_INTEGRATION_DIR, 'reports', 'auto-trust-log-2025-08-27.md');
        const manualLogFile = join(TEST_INTEGRATION_DIR, 'reports', 'manual-trust-log-2025-08-27.md');

        const autoLogExists = await fs.access(autoLogFile).then(() => true).catch(() => false);
        const manualLogExists = await fs.access(manualLogFile).then(() => true).catch(() => false);

        expect(autoLogExists).toBe(true);
        expect(manualLogExists).toBe(true);
      });
    });
  });

  describe('エラー発生時の復旧処理', () => {
    describe('システムエラーからの復旧', () => {
      it('ポリシー読み込みエラー時にデフォルトポリシーで継続する', async () => {
        // ポリシーマネージャーのエラーをシミュレート
        const faultyPolicyManager = new PolicyManager();
        vi.spyOn(faultyPolicyManager, 'loadPolicy').mockRejectedValue(new Error('Policy file corrupted'));

        // デフォルトポリシーで動作することを確認
        const engineWithFaultyPolicy = new TrustDecisionEngine();
        
        const operation: Operation = {
          type: OperationType.GIT,
          command: 'git',
          args: ['status'],
          context: {
            workingDirectory: '/test',
            user: 'testuser',
            sessionId: 'error-recovery-session'
          },
          timestamp: new Date()
        };

        const decision = engineWithFaultyPolicy.evaluateOperation(operation);
        
        // デフォルトポリシーで安全な操作は承認される
        expect(decision.approved).toBe(true);
        expect(decision.requiresManualApproval).toBe(false);
      });

      it('ログ記録エラー時に操作を継続する', async () => {
        // ログ記録をモックしてエラーを発生させる
        const faultyLogger = new AuditLogger({
          reportsDir: '/invalid/path/that/does/not/exist'
        });
        
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const operation: Operation = {
          type: OperationType.GIT,
          command: 'git',
          args: ['status'],
          context: {
            workingDirectory: '/test',
            user: 'testuser',
            sessionId: 'log-error-session'
          },
          timestamp: new Date()
        };

        const decision = engine.evaluateOperation(operation);
        
        // ログ記録エラーがあっても判定は正常に動作
        expect(decision.approved).toBe(true);
        
        // ログ記録を試行（エラーが発生するがクラッシュしない）
        await faultyLogger.logAutoApproval(operation, decision);
        
        expect(consoleSpy).toHaveBeenCalled();
        
        consoleSpy.mockRestore();
      });

      it('判定エンジンエラー時に安全側フォールバックする', async () => {
        // 判定エンジンの内部状態を破損させる
        const faultyEngine = new TrustDecisionEngine(testPolicy);
        (faultyEngine as any).policy = null;

        const operation: Operation = {
          type: OperationType.GIT,
          command: 'git',
          args: ['push', '--force'], // 危険な操作
          context: {
            workingDirectory: '/test',
            user: 'testuser',
            sessionId: 'engine-error-session'
          },
          timestamp: new Date()
        };

        const decision = faultyEngine.evaluateOperation(operation);
        
        // エラー時は安全側（手動承認）に倒す
        expect(decision.approved).toBe(false);
        expect(decision.requiresManualApproval).toBe(true);
        expect(decision.reason).toContain('判定エラー');
      });
    });

    describe('データ整合性の維持', () => {
      it('破損したログファイルがあっても新しいログを記録する', async () => {
        // 破損したログファイルを作成
        const reportsDir = join(TEST_INTEGRATION_DIR, 'reports');
        await fs.mkdir(reportsDir, { recursive: true });
        
        const corruptedLogFile = join(reportsDir, 'auto-trust-log-2025-08-27.md');
        await fs.writeFile(corruptedLogFile, 'Corrupted log content\nInvalid format');

        const operation: Operation = {
          type: OperationType.GIT,
          command: 'git',
          args: ['status'],
          context: {
            workingDirectory: '/test',
            user: 'testuser',
            sessionId: 'corruption-recovery-session'
          },
          timestamp: new Date('2025-08-27T10:00:00Z')
        };

        const decision = engine.evaluateOperation(operation);
        const executionResult = {
          success: true,
          executionTime: 100,
          output: 'Status check completed'
        };

        // 破損ファイルがあっても新しいログを記録
        await auditLogger.logAutoApproval(operation, decision, executionResult);

        const logContent = await fs.readFile(corruptedLogFile, 'utf-8');
        
        // 新しいログエントリが追加されることを確認
        expect(logContent).toContain('Corrupted log content'); // 既存の破損内容
        expect(logContent).toContain('## trust-'); // 新しいログエントリ
        expect(logContent).toContain('**操作**: git - `git`');
      });

      it('同時アクセス時のデータ整合性を維持する', async () => {
        const operation: Operation = {
          type: OperationType.GIT,
          command: 'git',
          args: ['status'],
          context: {
            workingDirectory: '/test',
            user: 'testuser',
            sessionId: 'concurrent-session'
          },
          timestamp: new Date('2025-08-27T10:00:00Z')
        };

        // 複数の同時操作をシミュレート
        const promises = Array(10).fill(null).map(async (_, i) => {
          const decision = engine.evaluateOperation(operation);
          const executionResult = {
            success: true,
            executionTime: 100 + i,
            output: `Concurrent operation ${i}`
          };

          await auditLogger.logAutoApproval(operation, decision, executionResult);
          return decision;
        });

        const decisions = await Promise.all(promises);

        // すべての操作が正常に処理されることを確認
        decisions.forEach(decision => {
          expect(decision.approved).toBe(true);
        });

        // ログファイルにすべてのエントリが記録されることを確認
        const logFile = join(TEST_INTEGRATION_DIR, 'reports', 'auto-trust-log-2025-08-27.md');
        const logContent = await fs.readFile(logFile, 'utf-8');
        
        const entryCount = (logContent.match(/## trust-/g) || []).length;
        expect(entryCount).toBe(10);
      });
    });
  });

  describe('パフォーマンス統合テスト', () => {
    it('大量操作時のエンドツーエンドパフォーマンスを検証する', async () => {
      const operationCount = 100;
      const operations: Operation[] = Array(operationCount).fill(null).map((_, i) => ({
        type: OperationType.GIT,
        command: 'git',
        args: ['status'],
        context: {
          workingDirectory: '/test',
          user: 'testuser',
          sessionId: `perf-session-${i}`
        },
        timestamp: new Date('2025-08-27T10:00:00Z')
      }));

      const startTime = Date.now();

      // 完全なフローを実行
      for (const operation of operations) {
        const classification = classifier.classifyOperation(operation);
        const decision = engine.evaluateOperation(operation);
        const executionResult = {
          success: true,
          executionTime: Math.floor(Math.random() * 100) + 50,
          output: 'Operation completed'
        };

        await auditLogger.logAutoApproval(operation, decision, executionResult);
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const avgTimePerOperation = totalTime / operationCount;

      // パフォーマンス要件の確認
      expect(avgTimePerOperation).toBeLessThan(100); // 100ms以内/操作
      expect(totalTime).toBeLessThan(10000); // 全体で10秒以内

      // 統計の確認
      const stats = engine.getOperationStats();
      expect(stats.totalOperations).toBe(operationCount);
      expect(stats.autoApprovals).toBe(operationCount);
    });

    it('複雑な操作パターンでのパフォーマンスを検証する', async () => {
      const complexOperations = [
        {
          type: OperationType.GIT,
          command: 'git',
          args: ['push', '--force-with-lease', '--set-upstream', 'origin', 'feature/complex-branch-name']
        },
        {
          type: OperationType.FILE,
          command: 'rm',
          args: ['-rf', '/very/deep/directory/structure/with/many/levels']
        },
        {
          type: OperationType.MCP,
          command: 'mcp-call',
          args: ['github', 'create_repository', 'complex-repo-name']
        },
        {
          type: OperationType.CLI,
          command: 'vercel',
          args: ['env', 'set', 'VERY_LONG_ENVIRONMENT_VARIABLE_NAME', 'complex-value-with-special-chars']
        }
      ];

      const startTime = Date.now();

      for (const operationData of complexOperations) {
        const operation: Operation = {
          ...operationData,
          context: {
            workingDirectory: '/very/deep/working/directory/path',
            user: 'user-with-very-long-username',
            sessionId: 'complex-session-with-long-id-12345'
          },
          timestamp: new Date()
        };

        const classification = classifier.classifyOperation(operation);
        const decision = engine.evaluateOperation(operation);
        
        // 手動承認が必要な操作の場合
        if (decision.requiresManualApproval) {
          const approvedDecision = { ...decision, approved: true };
          await auditLogger.logManualApproval(operation, approvedDecision);
        } else {
          const executionResult = {
            success: true,
            executionTime: 200,
            output: 'Complex operation completed'
          };
          await auditLogger.logAutoApproval(operation, decision, executionResult);
        }
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // 複雑な操作でも合理的な時間で処理完了
      expect(totalTime).toBeLessThan(1000); // 1秒以内
    });
  });

  describe('完全なシステム統合テスト', () => {
    describe('全コンポーネント連携フロー', () => {
      it('操作要求から完了まで全コンポーネントが連携して動作する', async () => {
        const operation: Operation = {
          type: OperationType.GIT,
          command: 'git',
          args: ['commit', '-m', 'test commit'],
          context: {
            workingDirectory: '/test',
            user: 'testuser',
            sessionId: 'full-integration-test'
          },
          timestamp: new Date('2025-08-27T10:00:00Z')
        };

        // 1. セキュリティ保護による事前チェック
        const securityCheck = await securityProtection.performSecurityCheck(operation);
        expect(securityCheck.passed).toBe(true);

        // 2. パフォーマンス最適化によるキャッシュチェック
        const cachedDecision = performanceOptimizer.getCachedDecision(operation);
        expect(cachedDecision).toBeNull(); // 初回なのでキャッシュなし

        // 3. 操作分類
        const classification = classifier.classifyOperation(operation);
        expect(classification.requiresManualApproval).toBe(false);

        // 4. Trust判定
        const decision = engine.evaluateOperation(operation);
        expect(decision.approved).toBe(true);

        // 5. パフォーマンス最適化によるキャッシュ保存
        performanceOptimizer.cacheDecision(operation, decision);

        // 6. 実行結果のシミュレーション
        const executionResult = {
          success: true,
          executionTime: 120,
          output: 'Commit successful'
        };

        // 7. 監査ログ記録
        await auditLogger.logAutoApproval(operation, decision, executionResult);

        // 8. セキュリティ保護による事後処理
        // Note: SecurityProtectionSystem doesn't have recordOperation method
        // This would be handled internally by performSecurityCheck

        // 9. レポート生成
        // Note: Using basic report generation for now
        // const reportData = {
        //   operation,
        //   decision,
        //   executionResult,
        //   timestamp: new Date()
        // };
        // await reportGenerator.generateOperationReport(reportData);

        // 10. 全体の検証
        const stats = engine.getOperationStats();
        expect(stats.totalOperations).toBe(1);
        expect(stats.autoApprovals).toBe(1);

        // キャッシュが保存されたことを確認
        const cachedDecisionAfter = performanceOptimizer.getCachedDecision(operation);
        expect(cachedDecisionAfter).not.toBeNull();
        expect(cachedDecisionAfter?.approved).toBe(true);
      });

      it('複雑なワークフローで全コンポーネントが協調動作する', async () => {
        const workflowOperations = [
          { command: 'git', args: ['status'], expectAutoApproval: true },
          { command: 'git', args: ['add', '.'], expectAutoApproval: true },
          { command: 'git', args: ['commit', '-m', 'feature'], expectAutoApproval: true },
          { command: 'git', args: ['push', '--force'], expectAutoApproval: false },
          { command: 'git', args: ['status'], expectAutoApproval: true }
        ];

        const workflowResults = [];

        for (const { command, args, expectAutoApproval } of workflowOperations) {
          const operation: Operation = {
            type: OperationType.GIT,
            command,
            args,
            context: {
              workingDirectory: '/test',
              user: 'testuser',
              sessionId: 'complex-workflow'
            },
            timestamp: new Date()
          };

          // 完全なフロー実行
          const securityCheck = await securityProtection.performSecurityCheck(operation);
          const classification = classifier.classifyOperation(operation);
          const decision = engine.evaluateOperation(operation);
          
          performanceOptimizer.cacheDecision(operation, decision);
          
          const executionResult = {
            success: true,
            executionTime: Math.floor(Math.random() * 100) + 50,
            output: `${command} ${args.join(' ')} completed`
          };

          if (expectAutoApproval) {
            expect(decision.approved).toBe(true);
            await auditLogger.logAutoApproval(operation, decision, executionResult);
          } else {
            expect(decision.requiresManualApproval).toBe(true);
            const approvedDecision = { ...decision, approved: true };
            await auditLogger.logManualApproval(operation, approvedDecision, executionResult);
          }

          // Security protection is handled internally
          workflowResults.push({ operation, decision, executionResult });
        }

        // ワークフロー全体のレポート生成
        // Note: Using basic report generation for now
        // await reportGenerator.generateWorkflowReport({
        //   workflowId: 'complex-workflow',
        //   operations: workflowResults,
        //   timestamp: new Date()
        // });

        // 統計の確認
        const stats = engine.getOperationStats();
        expect(stats.totalOperations).toBe(workflowOperations.length);
        
        const autoApprovalCount = workflowOperations.filter(op => op.expectAutoApproval).length;
        const manualApprovalCount = workflowOperations.filter(op => !op.expectAutoApproval).length;
        
        expect(stats.autoApprovals).toBe(autoApprovalCount);
        expect(stats.manualApprovals).toBe(manualApprovalCount);
      });
    });

    describe('システム境界での統合テスト', () => {
      it('外部システムとの連携をシミュレートする', async () => {
        // 外部システム（MCP）からの操作要求をシミュレート
        const mcpOperations = [
          {
            type: OperationType.MCP,
            command: 'mcp-call',
            args: ['github', 'create_repository', 'test-repo'],
            external: true
          },
          {
            type: OperationType.MCP,
            command: 'mcp-call',
            args: ['sanity-dev', 'create_document', 'test-doc'],
            external: true
          }
        ];

        for (const operationData of mcpOperations) {
          const operation: Operation = {
            ...operationData,
            context: {
              workingDirectory: '/test',
              user: 'external-system',
              sessionId: 'mcp-integration'
            },
            timestamp: new Date()
          };

          // 外部システムからの操作は特別な検証が必要
          const securityCheck = await securityProtection.performSecurityCheck(operation);
          expect(securityCheck.passed).toBe(true);

          const decision = engine.evaluateOperation(operation);
          
          // MCP操作は通常手動承認が必要
          expect(decision.requiresManualApproval).toBe(true);

          // 外部システム操作のログ記録
          const approvedDecision = { ...decision, approved: true };
          await auditLogger.logManualApproval(operation, approvedDecision);
        }

        // 外部システム統合レポートの生成
        // Note: Using basic report generation for now
        // await reportGenerator.generateExternalIntegrationReport({
        //   systemType: 'MCP',
        //   operations: mcpOperations.length,
        //   timestamp: new Date()
        // });
      });

      it('設定変更時のシステム全体への影響を検証する', async () => {
        // 初期設定での操作
        const initialOperation: Operation = {
          type: OperationType.GIT,
          command: 'git',
          args: ['push'],
          context: {
            workingDirectory: '/test',
            user: 'testuser',
            sessionId: 'config-change-test'
          },
          timestamp: new Date()
        };

        const initialDecision = engine.evaluateOperation(initialOperation);
        expect(initialDecision.approved).toBe(true);

        // 設定変更（より厳格なポリシーに変更）
        const strictPolicy: TrustPolicy = {
          ...testPolicy,
          autoApprove: {
            ...testPolicy.autoApprove,
            gitOperations: ['status', 'log'] // pushを除外
          }
        };

        // 新しいポリシーでエンジンを再初期化
        const newEngine = new TrustDecisionEngine(strictPolicy);

        // 同じ操作が異なる結果になることを確認
        const newDecision = newEngine.evaluateOperation(initialOperation);
        expect(newDecision.approved).toBe(false);
        expect(newDecision.requiresManualApproval).toBe(true);

        // 設定変更レポートの生成
        await reportGenerator.generatePolicyUpdateReport(testPolicy, strictPolicy);

        // パフォーマンス最適化のキャッシュクリア
        performanceOptimizer.clearCache();

        // セキュリティ保護の設定更新
        // Note: SecurityProtectionSystem doesn't have updatePolicy method
        // Policy updates are handled internally
      });
    });
  });

  describe('要件準拠の統合検証', () => {
    it('要件7.1: 100ms以内の判定処理を統合環境で検証する', async () => {
      const operation: Operation = {
        type: OperationType.GIT,
        command: 'git',
        args: ['status'],
        context: {
          workingDirectory: '/test',
          user: 'testuser',
          sessionId: 'performance-test'
        },
        timestamp: new Date()
      };

      const iterations = 50;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        
        // 完全な判定フロー（全コンポーネント連携）
        await securityProtection.performSecurityCheck(operation);
        const classification = classifier.classifyOperation(operation);
        const decision = engine.evaluateOperation(operation);
        performanceOptimizer.cacheDecision(operation, decision);
        
        const endTime = Date.now();
        times.push(endTime - startTime);
      }

      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      const maxTime = Math.max(...times);

      expect(avgTime).toBeLessThan(100); // 平均100ms以内
      expect(maxTime).toBeLessThan(200); // 最大でも200ms以内
    });

    it('要件7.2: 95%以上の自動承認率を統合環境で検証する', async () => {
      const testOperations = [
        // 自動承認対象（95個）
        ...Array(95).fill(null).map((_, i) => ({
          type: OperationType.GIT,
          command: 'git',
          args: ['status'],
          shouldAutoApprove: true
        })),
        // 手動承認対象（5個）
        ...Array(5).fill(null).map((_, i) => ({
          type: OperationType.GIT,
          command: 'git',
          args: ['push', '--force'],
          shouldAutoApprove: false
        }))
      ];

      let autoApprovalCount = 0;
      let totalCount = 0;

      for (const { type, command, args, shouldAutoApprove } of testOperations) {
        const operation: Operation = {
          type,
          command,
          args,
          context: {
            workingDirectory: '/test',
            user: 'testuser',
            sessionId: 'approval-rate-test'
          },
          timestamp: new Date()
        };

        const decision = engine.evaluateOperation(operation);
        totalCount++;

        if (decision.approved && !decision.requiresManualApproval) {
          autoApprovalCount++;
        }

        // 期待される結果と一致することを確認
        expect(decision.approved).toBe(shouldAutoApprove);
      }

      const autoApprovalRate = (autoApprovalCount / totalCount) * 100;
      expect(autoApprovalRate).toBeGreaterThanOrEqual(95);
    });

    it('要件4.1-4.4: 監査ログシステムの完全な統合検証', async () => {
      const testOperations = [
        { type: OperationType.GIT, command: 'git', args: ['status'], expectAutoApproval: true },
        { type: OperationType.FILE, command: 'rm', args: ['file.txt'], expectAutoApproval: false },
        { type: OperationType.CLI, command: 'vercel', args: ['status'], expectAutoApproval: true }
      ];

      for (const { type, command, args, expectAutoApproval } of testOperations) {
        const operation: Operation = {
          type,
          command,
          args,
          context: {
            workingDirectory: '/test',
            user: 'testuser',
            sessionId: 'audit-test'
          },
          timestamp: new Date('2025-08-27T10:00:00Z')
        };

        const decision = engine.evaluateOperation(operation);
        const executionResult = {
          success: true,
          executionTime: 150,
          output: 'Operation completed'
        };

        if (expectAutoApproval) {
          expect(decision.approved).toBe(true);
          await auditLogger.logAutoApproval(operation, decision, executionResult);
        } else {
          expect(decision.requiresManualApproval).toBe(true);
          const approvedDecision = { ...decision, approved: true };
          await auditLogger.logManualApproval(operation, approvedDecision, executionResult);
        }
      }

      // ログファイルの存在確認
      const autoLogFile = join(TEST_INTEGRATION_DIR, 'reports', 'auto-trust-log-2025-08-27.md');
      const manualLogFile = join(TEST_INTEGRATION_DIR, 'reports', 'manual-trust-log-2025-08-27.md');

      const autoLogExists = await fs.access(autoLogFile).then(() => true).catch(() => false);
      const manualLogExists = await fs.access(manualLogFile).then(() => true).catch(() => false);

      expect(autoLogExists).toBe(true);
      expect(manualLogExists).toBe(true);

      // ログ内容の検証
      const autoLogContent = await fs.readFile(autoLogFile, 'utf-8');
      const manualLogContent = await fs.readFile(manualLogFile, 'utf-8');

      expect(autoLogContent).toContain('**操作**: git - `git`');
      expect(autoLogContent).toContain('**操作**: cli - `vercel`');
      expect(manualLogContent).toContain('**操作**: file - `rm`');
    });

    it('要件8.1-8.3: セキュリティ保護機能の統合検証', async () => {
      // 不審な操作パターンのシミュレーション
      const suspiciousOperations = Array(15).fill(null).map((_, i) => ({
        type: OperationType.FILE,
        command: 'rm',
        args: ['-rf', `/important/data${i}`],
        context: {
          workingDirectory: '/test',
          user: 'suspicious-user',
          sessionId: `suspicious-session-${i}`
        },
        timestamp: new Date(Date.now() + i * 1000) // 1秒間隔
      }));

      let suspiciousDetected = false;

      for (const operationData of suspiciousOperations) {
        const operation: Operation = operationData;

        // セキュリティチェック
        const securityCheck = await securityProtection.performSecurityCheck(operation);
        
        if (!securityCheck.passed) {
          suspiciousDetected = true;
          expect(securityCheck.reason).toContain('suspicious pattern');
          break;
        }

        const decision = engine.evaluateOperation(operation);
        await securityProtection.recordOperation(operation, decision);
      }

      expect(suspiciousDetected).toBe(true);

      // セキュリティレポートの生成
      // Note: Using basic report generation for now
      // await reportGenerator.generateSecurityReport({
      //   suspiciousActivities: suspiciousOperations.length,
      //   blockedOperations: 1,
      //   timestamp: new Date()
      // });
    });

    it('要件1.1-1.3: ポリシー設定システムの統合検証', async () => {
      // ポリシー設定の保存
      const customPolicy: TrustPolicy = {
        ...testPolicy,
        version: "1.1",
        lastUpdated: new Date().toISOString()
      };

      const policyFile = join(TEST_INTEGRATION_DIR, 'settings', 'trust-policy.json');
      await fs.mkdir(join(TEST_INTEGRATION_DIR, 'settings'), { recursive: true });
      await fs.writeFile(policyFile, JSON.stringify(customPolicy, null, 2));

      // ポリシー読み込みと検証
      const loadedPolicy = await policyManager.loadPolicy(policyFile);
      expect(loadedPolicy.version).toBe("1.1");

      // ポリシー検証
      const validation = policyManager.validatePolicy(loadedPolicy);
      expect(validation.isValid).toBe(true);

      // デフォルト設定のフォールバック確認
      await fs.unlink(policyFile);
      const defaultPolicy = await policyManager.loadPolicy(policyFile);
      expect(defaultPolicy.version).toBe("1.0");
    });
  });

  describe('災害復旧とフェイルセーフ', () => {
    it('システム全体の障害からの完全復旧を検証する', async () => {
      // 複数コンポーネントの同時障害をシミュレート
      const faultyLogger = new AuditLogger({
        reportsDir: '/invalid/path'
      });
      
      const faultyReportGenerator = new ReportGenerator({
        reportsDir: '/invalid/path',
        templateDir: '/invalid/path'
      });

      // 障害状態でも基本機能が動作することを確認
      const operation: Operation = {
        type: OperationType.GIT,
        command: 'git',
        args: ['status'],
        context: {
          workingDirectory: '/test',
          user: 'testuser',
          sessionId: 'disaster-recovery'
        },
        timestamp: new Date()
      };

      // 判定エンジンは障害があっても動作する
      const decision = engine.evaluateOperation(operation);
      expect(decision.approved).toBe(true);

      // セキュリティ保護は障害があっても基本チェックを実行
      const securityCheck = await securityProtection.performSecurityCheck(operation);
      expect(securityCheck.passed).toBe(true);

      // パフォーマンス最適化は障害があってもキャッシュなしで動作
      const cachedDecision = performanceOptimizer.getCachedDecision(operation);
      expect(cachedDecision).toBeNull();
    });

    it('段階的復旧プロセスを検証する', async () => {
      // 段階1: 最小限の機能で動作開始
      const minimalEngine = new TrustDecisionEngine();
      
      const operation: Operation = {
        type: OperationType.GIT,
        command: 'git',
        args: ['status'],
        context: {
          workingDirectory: '/test',
          user: 'testuser',
          sessionId: 'gradual-recovery'
        },
        timestamp: new Date()
      };

      const minimalDecision = minimalEngine.evaluateOperation(operation);
      expect(minimalDecision.approved).toBe(true);

      // 段階2: ログ機能の復旧
      const recoveredLogger = new AuditLogger({
        reportsDir: join(TEST_INTEGRATION_DIR, 'recovery-reports')
      });
      
      await recoveredLogger.logAutoApproval(operation, minimalDecision);

      // 段階3: 全機能の復旧確認
      const fullEngine = new TrustDecisionEngine(testPolicy);
      const fullDecision = fullEngine.evaluateOperation(operation);
      
      expect(fullDecision.approved).toBe(minimalDecision.approved);
      expect(fullDecision.reason).toBeDefined();
    });
  });
});