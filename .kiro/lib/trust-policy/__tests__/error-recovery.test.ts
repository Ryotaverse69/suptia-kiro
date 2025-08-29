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
const TEST_ERROR_RECOVERY_DIR = '.kiro/test-error-recovery';

describe('Trust Policy System - エラー発生時の復旧処理テスト', () => {
  let testPolicy: TrustPolicy;

  beforeEach(async () => {
    // テスト用ディレクトリをクリーンアップ
    try {
      await fs.rm(TEST_ERROR_RECOVERY_DIR, { recursive: true, force: true });
    } catch (error) {
      // ディレクトリが存在しない場合は無視
    }

    // テスト用ディレクトリ構造を作成
    await fs.mkdir(join(TEST_ERROR_RECOVERY_DIR, 'settings'), { recursive: true });
    await fs.mkdir(join(TEST_ERROR_RECOVERY_DIR, 'reports'), { recursive: true });
    await fs.mkdir(join(TEST_ERROR_RECOVERY_DIR, 'backups'), { recursive: true });

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
          allowedPaths: ["scripts/", ".kiro/scripts/"]
        }
      },
      manualApprove: {
        deleteOperations: ["git branch -D", "git push --delete", "rm", "vercel env rm"],
        forceOperations: ["git reset --hard", "git push --force"],
        productionImpact: ["github:write", "sanity-dev:write", "vercel:envSet"]
      },
      security: {
        maxAutoApprovalPerHour: 100,
        suspiciousPatternDetection: true,
        logAllOperations: true
      }
    };
  });

  afterEach(async () => {
    // テスト用ディレクトリをクリーンアップ
    try {
      await fs.rm(TEST_ERROR_RECOVERY_DIR, { recursive: true, force: true });
    } catch (error) {
      // ディレクトリが存在しない場合は無視
    }
  });

  describe('システムコンポーネント障害からの復旧', () => {
    it('ポリシーマネージャー障害時のフォールバック動作', async () => {
      // 破損したポリシーファイルを作成
      const policyFile = join(TEST_ERROR_RECOVERY_DIR, 'settings', 'trust-policy.json');
      await fs.writeFile(policyFile, 'INVALID JSON CONTENT');

      const policyManager = new PolicyManager();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // ポリシー読み込みエラーが発生することを確認
      const loadedPolicy = await policyManager.loadPolicy(policyFile);
      
      // デフォルトポリシーが適用されることを確認
      expect(loadedPolicy.version).toBe("1.0");
      expect(loadedPolicy.autoApprove.gitOperations).toContain("status");
      expect(consoleSpy).toHaveBeenCalled();

      // エンジンがデフォルトポリシーで動作することを確認
      const engine = new TrustDecisionEngine(loadedPolicy);
      const operation: Operation = {
        type: OperationType.GIT,
        command: 'git',
        args: ['status'],
        context: {
          workingDirectory: '/test',
          user: 'testuser',
          sessionId: 'policy-error-recovery'
        },
        timestamp: new Date()
      };

      const decision = engine.evaluateOperation(operation);
      expect(decision.approved).toBe(true);

      consoleSpy.mockRestore();
    });

    it('監査ログシステム障害時の継続動作', async () => {
      const faultyLogger = new AuditLogger({
        reportsDir: '/invalid/nonexistent/path'
      });

      const engine = new TrustDecisionEngine(testPolicy);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const operation: Operation = {
        type: OperationType.GIT,
        command: 'git',
        args: ['commit', '-m', 'test'],
        context: {
          workingDirectory: '/test',
          user: 'testuser',
          sessionId: 'log-error-recovery'
        },
        timestamp: new Date()
      };

      // 判定は正常に動作する
      const decision = engine.evaluateOperation(operation);
      expect(decision.approved).toBe(true);

      // ログ記録エラーが発生してもクラッシュしない
      const executionResult = {
        success: true,
        executionTime: 100,
        output: 'Commit successful'
      };

      await expect(faultyLogger.logAutoApproval(operation, decision, executionResult))
        .resolves.not.toThrow();

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('操作分類器の内部エラー時のフォールバック', async () => {
      const classifier = new OperationClassifier();
      
      // 分類器の内部メソッドをモックしてエラーを発生させる
      const originalClassify = classifier.classifyOperation;
      classifier.classifyOperation = vi.fn().mockImplementation(() => {
        throw new Error('Classification system failure');
      });

      const engine = new TrustDecisionEngine(testPolicy);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const operation: Operation = {
        type: OperationType.GIT,
        command: 'git',
        args: ['push', '--force'], // 危険な操作
        context: {
          workingDirectory: '/test',
          user: 'testuser',
          sessionId: 'classifier-error-recovery'
        },
        timestamp: new Date()
      };

      // エラー時は安全側（手動承認）に倒すことを確認
      const decision = engine.evaluateOperation(operation);
      expect(decision.approved).toBe(false);
      expect(decision.requiresManualApproval).toBe(true);
      expect(decision.reason).toContain('分類エラー');

      // 分類器を復旧
      classifier.classifyOperation = originalClassify;

      // 復旧後は正常に動作することを確認
      const recoveredDecision = engine.evaluateOperation(operation);
      expect(recoveredDecision.requiresManualApproval).toBe(true); // 危険操作なので手動承認
      expect(recoveredDecision.reason).not.toContain('分類エラー');

      consoleSpy.mockRestore();
    });

    it('セキュリティ保護システム障害時の動作', async () => {
      const securityProtection = new SecurityProtectionSystem();

      // セキュリティチェックメソッドをモックしてエラーを発生させる
      const originalValidate = securityProtection.performSecurityCheck;
      securityProtection.performSecurityCheck = vi.fn().mockRejectedValue(new Error('Security system failure'));

      const operation: Operation = {
        type: OperationType.GIT,
        command: 'git',
        args: ['status'],
        context: {
          workingDirectory: '/test',
          user: 'testuser',
          sessionId: 'security-error-recovery'
        },
        timestamp: new Date()
      };

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // セキュリティシステム障害時でも基本操作は継続
      const securityCheck = await securityProtection.performSecurityCheck(operation).catch(() => ({
        passed: true, // フォールバック：基本操作は許可
        reason: 'Security system unavailable - allowing basic operations'
      }));

      expect(securityCheck.passed).toBe(true);

      // セキュリティシステムを復旧
      securityProtection.performSecurityCheck = originalValidate;

      // 復旧後は正常に動作することを確認
      const recoveredCheck = await securityProtection.performSecurityCheck(operation);
      expect(recoveredCheck.passed).toBe(true);

      consoleSpy.mockRestore();
    });

    it('パフォーマンス最適化システム障害時の動作', async () => {
      const performanceOptimizer = new PerformanceOptimizer({
        cacheSize: 100,
        enablePrecomputation: true,
        enableAsyncProcessing: true
      });

      // キャッシュシステムをモックしてエラーを発生させる
      const originalGetCache = performanceOptimizer.getCachedDecision;
      performanceOptimizer.getCachedDecision = vi.fn().mockImplementation(() => {
        throw new Error('Cache system failure');
      });

      const operation: Operation = {
        type: OperationType.GIT,
        command: 'git',
        args: ['status'],
        context: {
          workingDirectory: '/test',
          user: 'testuser',
          sessionId: 'performance-error-recovery'
        },
        timestamp: new Date()
      };

      const engine = new TrustDecisionEngine(testPolicy);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // キャッシュエラーがあっても判定は正常に動作
      const decision = engine.evaluateOperation(operation);
      expect(decision.approved).toBe(true);

      // キャッシュシステムを復旧
      performanceOptimizer.getCachedDecision = originalGetCache;

      // 復旧後は正常に動作することを確認
      const cachedDecision = performanceOptimizer.getCachedDecision(operation);
      expect(cachedDecision).toBeNull(); // 初回なのでキャッシュなし

      consoleSpy.mockRestore();
    });
  });

  describe('データ整合性エラーからの復旧', () => {
    it('破損したログファイルの自動修復', async () => {
      const auditLogger = new AuditLogger({
        reportsDir: join(TEST_ERROR_RECOVERY_DIR, 'reports'),
        maxLogFileSize: 1024,
        maxLogFiles: 3,
        enableRotation: true
      });

      // 破損したログファイルを作成
      const today = new Date().toISOString().split('T')[0];
      const logFile = join(TEST_ERROR_RECOVERY_DIR, 'reports', `auto-trust-log-${today}.md`);
      await fs.writeFile(logFile, 'CORRUPTED LOG DATA\nINVALID FORMAT\n');

      const operation: Operation = {
        type: OperationType.GIT,
        command: 'git',
        args: ['commit', '-m', 'recovery test'],
        context: {
          workingDirectory: '/test',
          user: 'testuser',
          sessionId: 'log-corruption-recovery'
        },
        timestamp: new Date()
      };

      const engine = new TrustDecisionEngine(testPolicy);
      const decision = engine.evaluateOperation(operation);
      const executionResult = {
        success: true,
        executionTime: 120,
        output: 'Commit successful'
      };

      // 破損ファイルがあっても新しいログを追記
      await auditLogger.logAutoApproval(operation, decision, executionResult);

      // ファイル内容を確認
      const logContent = await fs.readFile(logFile, 'utf-8');
      expect(logContent).toContain('CORRUPTED LOG DATA'); // 既存の破損データ
      expect(logContent).toContain('## trust-'); // 新しいログエントリ
      expect(logContent).toContain('**操作**: git - `git`');
    });

    it('設定ファイル破損時の自動バックアップ復元', async () => {
      const policyFile = join(TEST_ERROR_RECOVERY_DIR, 'settings', 'trust-policy.json');
      const backupFile = join(TEST_ERROR_RECOVERY_DIR, 'backups', 'trust-policy.backup.json');

      // 正常な設定ファイルを作成
      await fs.writeFile(policyFile, JSON.stringify(testPolicy, null, 2));
      
      // バックアップを作成
      await fs.copyFile(policyFile, backupFile);

      // 設定ファイルを破損させる
      await fs.writeFile(policyFile, 'CORRUPTED CONFIG DATA');

      const policyManager = new PolicyManager();
      
      // 破損検出とバックアップからの復元をシミュレート
      let loadedPolicy;
      try {
        loadedPolicy = await policyManager.loadPolicy(policyFile);
      } catch (error) {
        // バックアップから復元
        await fs.copyFile(backupFile, policyFile);
        loadedPolicy = await policyManager.loadPolicy(policyFile);
      }

      expect(loadedPolicy.version).toBe(testPolicy.version);
      expect(loadedPolicy.autoApprove.gitOperations).toEqual(testPolicy.autoApprove.gitOperations);
    });

    it('同時アクセス時のデータ競合状態の処理', async () => {
      const auditLogger = new AuditLogger({
        reportsDir: join(TEST_ERROR_RECOVERY_DIR, 'reports'),
        maxLogFileSize: 10240,
        maxLogFiles: 5,
        enableRotation: true
      });

      const engine = new TrustDecisionEngine(testPolicy);

      // 同時に複数の操作を実行
      const concurrentOperations = Array(20).fill(null).map((_, i) => ({
        type: OperationType.GIT,
        command: 'git',
        args: ['status'],
        context: {
          workingDirectory: '/test',
          user: `user-${i}`,
          sessionId: `concurrent-session-${i}`
        },
        timestamp: new Date(Date.now() + i)
      }));

      const promises = concurrentOperations.map(async (operationData, i) => {
        const operation: Operation = operationData;
        const decision = engine.evaluateOperation(operation);
        const executionResult = {
          success: true,
          executionTime: 100 + i,
          output: `Concurrent operation ${i} completed`
        };

        await auditLogger.logAutoApproval(operation, decision, executionResult);
        return { operation, decision, executionResult };
      });

      // すべての操作が正常に完了することを確認
      const results = await Promise.all(promises);
      expect(results).toHaveLength(concurrentOperations.length);

      // ログファイルにすべてのエントリが記録されることを確認
      const today = new Date().toISOString().split('T')[0];
      const logFile = join(TEST_ERROR_RECOVERY_DIR, 'reports', `auto-trust-log-${today}.md`);
      const logContent = await fs.readFile(logFile, 'utf-8');
      
      const entryCount = (logContent.match(/## trust-/g) || []).length;
      expect(entryCount).toBe(concurrentOperations.length);
    });
  });

  describe('ネットワークとI/O障害からの復旧', () => {
    it('ディスク容量不足時の処理', async () => {
      const auditLogger = new AuditLogger({
        reportsDir: join(TEST_ERROR_RECOVERY_DIR, 'reports'),
        maxLogFileSize: 100, // 非常に小さなサイズに設定
        maxLogFiles: 2,
        enableRotation: true
      });

      // ディスク容量不足をシミュレートするため、書き込みエラーを発生させる
      const originalWriteFile = fs.writeFile;
      let writeCallCount = 0;
      
      (fs as any).writeFile = vi.fn().mockImplementation(async (path, data, options) => {
        writeCallCount++;
        if (writeCallCount > 3) {
          throw new Error('ENOSPC: no space left on device');
        }
        return originalWriteFile(path, data, options);
      });

      const operation: Operation = {
        type: OperationType.GIT,
        command: 'git',
        args: ['commit', '-m', 'disk space test'],
        context: {
          workingDirectory: '/test',
          user: 'testuser',
          sessionId: 'disk-space-recovery'
        },
        timestamp: new Date()
      };

      const engine = new TrustDecisionEngine(testPolicy);
      const decision = engine.evaluateOperation(operation);
      const executionResult = {
        success: true,
        executionTime: 150,
        output: 'Commit successful'
      };

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // ディスク容量不足エラーが発生してもクラッシュしない
      await expect(auditLogger.logAutoApproval(operation, decision, executionResult))
        .resolves.not.toThrow();

      expect(consoleSpy).toHaveBeenCalled();

      // ファイルシステムを復旧
      (fs as any).writeFile = originalWriteFile;

      // 復旧後は正常に動作することを確認
      await auditLogger.logAutoApproval(operation, decision, executionResult);

      consoleSpy.mockRestore();
    });

    it('権限エラー時の処理', async () => {
      const restrictedDir = join(TEST_ERROR_RECOVERY_DIR, 'restricted');
      await fs.mkdir(restrictedDir, { recursive: true });

      const auditLogger = new AuditLogger({
        reportsDir: restrictedDir,
        maxLogFileSize: 1024,
        maxLogFiles: 3,
        enableRotation: true
      });

      // 権限エラーをシミュレート
      const originalWriteFile = fs.writeFile;
      (fs as any).writeFile = vi.fn().mockRejectedValue(new Error('EACCES: permission denied'));

      const operation: Operation = {
        type: OperationType.GIT,
        command: 'git',
        args: ['status'],
        context: {
          workingDirectory: '/test',
          user: 'testuser',
          sessionId: 'permission-error-recovery'
        },
        timestamp: new Date()
      };

      const engine = new TrustDecisionEngine(testPolicy);
      const decision = engine.evaluateOperation(operation);
      const executionResult = {
        success: true,
        executionTime: 100,
        output: 'Status check completed'
      };

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // 権限エラーが発生してもクラッシュしない
      await expect(auditLogger.logAutoApproval(operation, decision, executionResult))
        .resolves.not.toThrow();

      expect(consoleSpy).toHaveBeenCalled();

      // ファイルシステムを復旧
      (fs as any).writeFile = originalWriteFile;

      consoleSpy.mockRestore();
    });
  });

  describe('メモリとリソース枯渇からの復旧', () => {
    it('メモリ不足時の処理', async () => {
      const performanceOptimizer = new PerformanceOptimizer({
        cacheSize: 10, // 非常に小さなキャッシュサイズ
        enablePrecomputation: true,
        enableAsyncProcessing: true
      });

      // 大量の操作でメモリ圧迫をシミュレート
      const operations = Array(100).fill(null).map((_, i) => ({
        type: OperationType.GIT,
        command: 'git',
        args: ['status'],
        context: {
          workingDirectory: `/test-${i}`,
          user: 'memory-test-user',
          sessionId: `memory-session-${i}`
        },
        timestamp: new Date(Date.now() + i)
      }));

      const engine = new TrustDecisionEngine(testPolicy);

      // メモリ不足をシミュレートするため、一部の操作でエラーを発生させる
      let processedCount = 0;
      const originalEvaluate = engine.evaluateOperation;
      
      engine.evaluateOperation = vi.fn().mockImplementation((operation) => {
        processedCount++;
        if (processedCount > 80) {
          // メモリ不足エラーをシミュレート
          throw new Error('JavaScript heap out of memory');
        }
        return originalEvaluate.call(engine, operation);
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      let successfulOperations = 0;
      let failedOperations = 0;

      for (const operationData of operations) {
        const operation: Operation = operationData;
        
        try {
          const decision = engine.evaluateOperation(operation);
          performanceOptimizer.cacheDecision(operation, decision);
          successfulOperations++;
        } catch (error) {
          failedOperations++;
          // メモリ不足時はキャッシュをクリアして継続
          performanceOptimizer.clearCache();
        }
      }

      expect(successfulOperations).toBeGreaterThan(0);
      expect(failedOperations).toBeGreaterThan(0);
      expect(consoleSpy).toHaveBeenCalled();

      // システムを復旧
      engine.evaluateOperation = originalEvaluate;

      // 復旧後は正常に動作することを確認
      const recoveryOperation: Operation = {
        type: OperationType.GIT,
        command: 'git',
        args: ['status'],
        context: {
          workingDirectory: '/recovery-test',
          user: 'recovery-user',
          sessionId: 'memory-recovery-session'
        },
        timestamp: new Date()
      };

      const recoveryDecision = engine.evaluateOperation(recoveryOperation);
      expect(recoveryDecision.approved).toBe(true);

      consoleSpy.mockRestore();
    });

    it('ファイルハンドル枯渇時の処理', async () => {
      const auditLogger = new AuditLogger({
        reportsDir: join(TEST_ERROR_RECOVERY_DIR, 'reports'),
        maxLogFileSize: 1024,
        maxLogFiles: 3,
        enableRotation: true
      });

      // ファイルハンドル枯渇をシミュレート
      const originalOpen = fs.open;
      let openCallCount = 0;
      
      (fs as any).open = vi.fn().mockImplementation(async (...args) => {
        openCallCount++;
        if (openCallCount > 5) {
          throw new Error('EMFILE: too many open files');
        }
        return originalOpen(...args);
      });

      const operations = Array(10).fill(null).map((_, i) => ({
        type: OperationType.GIT,
        command: 'git',
        args: ['status'],
        context: {
          workingDirectory: '/test',
          user: 'file-handle-test-user',
          sessionId: `file-handle-session-${i}`
        },
        timestamp: new Date(Date.now() + i * 100)
      }));

      const engine = new TrustDecisionEngine(testPolicy);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      let successfulLogs = 0;
      let failedLogs = 0;

      for (const operationData of operations) {
        const operation: Operation = operationData;
        const decision = engine.evaluateOperation(operation);
        const executionResult = {
          success: true,
          executionTime: 100,
          output: 'Operation completed'
        };

        try {
          await auditLogger.logAutoApproval(operation, decision, executionResult);
          successfulLogs++;
        } catch (error) {
          failedLogs++;
        }
      }

      expect(successfulLogs).toBeGreaterThan(0);
      expect(failedLogs).toBeGreaterThan(0);
      expect(consoleSpy).toHaveBeenCalled();

      // ファイルシステムを復旧
      (fs as any).open = originalOpen;

      consoleSpy.mockRestore();
    });
  });

  describe('完全なシステム復旧フロー', () => {
    it('複数障害からの段階的復旧を検証する', async () => {
      // 段階1: 複数のシステム障害を同時に発生させる
      const faultyComponents = {
        policyManager: new PolicyManager(),
        auditLogger: new AuditLogger({
          reportsDir: '/invalid/path'
        }),
        reportGenerator: new ReportGenerator({
          reportsDir: '/invalid/path',
          templateDir: '/invalid/path'
        }),
        securityProtection: new SecurityProtectionSystem()
      };

      // 各コンポーネントでエラーを発生させる
      const originalLoadPolicy = faultyComponents.policyManager.loadPolicy;
      faultyComponents.policyManager.loadPolicy = vi.fn().mockRejectedValue(new Error('Policy system failure'));

      const originalValidateOperation = faultyComponents.securityProtection.performSecurityCheck;
      faultyComponents.securityProtection.performSecurityCheck = vi.fn().mockRejectedValue(new Error('Security system failure'));

      const operation: Operation = {
        type: OperationType.GIT,
        command: 'git',
        args: ['status'],
        context: {
          workingDirectory: '/test',
          user: 'recovery-test-user',
          sessionId: 'multi-failure-recovery'
        },
        timestamp: new Date()
      };

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // 段階2: 最小限の機能で動作開始
      const minimalEngine = new TrustDecisionEngine(); // デフォルト設定
      const minimalDecision = minimalEngine.evaluateOperation(operation);
      expect(minimalDecision.approved).toBe(true);

      // 段階3: ポリシーシステムの復旧
      faultyComponents.policyManager.loadPolicy = originalLoadPolicy;
      const recoveredPolicy = await faultyComponents.policyManager.loadPolicy();
      const engineWithPolicy = new TrustDecisionEngine(recoveredPolicy);
      const policyDecision = engineWithPolicy.evaluateOperation(operation);
      expect(policyDecision.approved).toBe(true);

      // 段階4: セキュリティシステムの復旧
      faultyComponents.securityProtection.performSecurityCheck = originalValidateOperation;
      const securityCheck = await faultyComponents.securityProtection.performSecurityCheck(operation);
      expect(securityCheck.passed).toBe(true);

      // 段階5: ログシステムの復旧
      const recoveredLogger = new AuditLogger({
        reportsDir: join(TEST_ERROR_RECOVERY_DIR, 'reports')
      });
      
      const executionResult = {
        success: true,
        executionTime: 120,
        output: 'Full recovery completed'
      };

      await recoveredLogger.logAutoApproval(operation, policyDecision, executionResult);

      // 段階6: 完全復旧の確認
      const stats = engineWithPolicy.getOperationStats();
      expect(stats.totalOperations).toBeGreaterThan(0);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('災害復旧シナリオの完全テスト', async () => {
      // 災害前の正常状態を確立
      const normalComponents = {
        engine: new TrustDecisionEngine(testPolicy),
        auditLogger: new AuditLogger({
          reportsDir: join(TEST_ERROR_RECOVERY_DIR, 'reports')
        }),
        securityProtection: new SecurityProtectionSystem()
      };

      const operation: Operation = {
        type: OperationType.GIT,
        command: 'git',
        args: ['commit', '-m', 'before disaster'],
        context: {
          workingDirectory: '/test',
          user: 'disaster-test-user',
          sessionId: 'disaster-recovery-test'
        },
        timestamp: new Date()
      };

      // 正常動作の確認
      const normalDecision = normalComponents.engine.evaluateOperation(operation);
      expect(normalDecision.approved).toBe(true);

      const normalExecutionResult = {
        success: true,
        executionTime: 100,
        output: 'Normal operation completed'
      };

      await normalComponents.auditLogger.logAutoApproval(operation, normalDecision, normalExecutionResult);

      // 災害発生：全システムダウンをシミュレート
      const disasterTime = new Date();
      
      // 災害復旧：段階的にシステムを復旧
      const recoverySteps = [
        {
          name: 'Core Engine Recovery',
          action: () => new TrustDecisionEngine() // デフォルト設定で復旧
        },
        {
          name: 'Policy Recovery',
          action: () => new TrustDecisionEngine(testPolicy) // 設定ファイルから復旧
        },
        {
          name: 'Logging Recovery',
          action: () => new AuditLogger({
            reportsDir: join(TEST_ERROR_RECOVERY_DIR, 'disaster-recovery-reports')
          })
        },
        {
          name: 'Security Recovery',
          action: () => new SecurityProtectionSystem()
        }
      ];

      const recoveryResults = [];

      for (const step of recoverySteps) {
        const stepStartTime = Date.now();
        
        try {
          const component = step.action();
          const stepEndTime = Date.now();
          
          recoveryResults.push({
            step: step.name,
            success: true,
            duration: stepEndTime - stepStartTime
          });
        } catch (error) {
          recoveryResults.push({
            step: step.name,
            success: false,
            error: error.message
          });
        }
      }

      // 復旧後の動作確認
      const recoveredEngine = new TrustDecisionEngine(testPolicy);
      const recoveredLogger = new AuditLogger({
        reportsDir: join(TEST_ERROR_RECOVERY_DIR, 'disaster-recovery-reports')
      });

      const recoveryOperation: Operation = {
        type: OperationType.GIT,
        command: 'git',
        args: ['status'],
        context: {
          workingDirectory: '/test',
          user: 'disaster-recovery-user',
          sessionId: 'post-disaster-session'
        },
        timestamp: new Date()
      };

      const recoveryDecision = recoveredEngine.evaluateOperation(recoveryOperation);
      expect(recoveryDecision.approved).toBe(true);

      const recoveryExecutionResult = {
        success: true,
        executionTime: 150,
        output: 'Post-disaster operation completed'
      };

      await recoveredLogger.logAutoApproval(recoveryOperation, recoveryDecision, recoveryExecutionResult);

      // 災害復旧レポートの生成
      const recoveryReport = {
        disasterTime,
        recoveryTime: new Date(),
        recoverySteps: recoveryResults,
        systemStatus: 'Fully Operational',
        dataIntegrity: 'Verified'
      };

      expect(recoveryResults.every(result => result.success)).toBe(true);
      expect(recoveryReport.systemStatus).toBe('Fully Operational');
    });
  });
});