import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TrustDecisionEngine } from '../trust-decision-engine.js';
import { Operation, TrustDecision, OperationType, RiskLevel, TrustPolicy } from '../types.js';

describe('TrustDecisionEngine - 包括的テスト', () => {
  let engine: TrustDecisionEngine;
  let mockPolicy: TrustPolicy;

  beforeEach(() => {
    mockPolicy = {
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
        maxAutoApprovalPerHour: 1000,
        suspiciousPatternDetection: true,
        logAllOperations: true
      }
    };

    engine = new TrustDecisionEngine(mockPolicy);
  });

  describe('判定エンジンのコア機能テスト', () => {
    describe('自動承認判定の詳細', () => {
      it('すべての自動承認対象操作を正しく判定する', () => {
        const autoApproveOperations = [
          // Git操作
          { type: OperationType.GIT, command: 'git', args: ['status'] },
          { type: OperationType.GIT, command: 'git', args: ['commit', '-m', 'test'] },
          { type: OperationType.GIT, command: 'git', args: ['push', 'origin', 'main'] },
          { type: OperationType.GIT, command: 'git', args: ['pull', 'origin', 'main'] },
          { type: OperationType.GIT, command: 'git', args: ['merge', 'feature'] },
          { type: OperationType.GIT, command: 'git', args: ['log', '--oneline'] },
          
          // ファイル操作
          { type: OperationType.FILE, command: 'touch', args: ['file.txt'] },
          { type: OperationType.FILE, command: 'mkdir', args: ['directory'] },
          { type: OperationType.FILE, command: 'cp', args: ['src.txt', 'dst.txt'] },
          
          // CLI操作
          { type: OperationType.CLI, command: 'vercel', args: ['env', 'ls'] },
          { type: OperationType.CLI, command: 'vercel', args: ['status'] },
          { type: OperationType.CLI, command: 'npm', args: ['run', 'test'] },
          
          // スクリプト実行
          { type: OperationType.SCRIPT, command: 'node', args: ['scripts/test.mjs'] },
          { type: OperationType.SCRIPT, command: 'npm', args: ['run', 'build'] }
        ];

        autoApproveOperations.forEach(({ type, command, args }) => {
          const operation: Operation = {
            type,
            command,
            args,
            context: {
              workingDirectory: '/test',
              user: 'testuser',
              sessionId: 'test-session'
            },
            timestamp: new Date()
          };

          const decision = engine.evaluateOperation(operation);
          
          expect(decision.approved, `${command} ${args.join(' ')} should be auto-approved`).toBe(true);
          expect(decision.requiresManualApproval).toBe(false);
          expect(decision.riskLevel).toBeLessThanOrEqual(RiskLevel.MEDIUM);
        });
      });

      it('すべての手動承認対象操作を正しく判定する', () => {
        const manualApproveOperations = [
          // 削除系操作
          { type: OperationType.GIT, command: 'git', args: ['branch', '-D', 'feature'] },
          { type: OperationType.GIT, command: 'git', args: ['push', '--delete', 'origin', 'branch'] },
          { type: OperationType.FILE, command: 'rm', args: ['file.txt'] },
          { type: OperationType.CLI, command: 'vercel', args: ['env', 'rm', 'VAR'] },
          
          // 強制系操作
          { type: OperationType.GIT, command: 'git', args: ['reset', '--hard', 'HEAD~1'] },
          { type: OperationType.GIT, command: 'git', args: ['push', '--force', 'origin', 'main'] },
          
          // 本番影響操作
          { type: OperationType.MCP, command: 'mcp-call', args: ['github', 'create_repository'] },
          { type: OperationType.MCP, command: 'mcp-call', args: ['sanity-dev', 'delete_document'] },
          { type: OperationType.CLI, command: 'vercel', args: ['env', 'set', 'VAR', 'value'] }
        ];

        manualApproveOperations.forEach(({ type, command, args }) => {
          const operation: Operation = {
            type,
            command,
            args,
            context: {
              workingDirectory: '/test',
              user: 'testuser',
              sessionId: 'test-session'
            },
            timestamp: new Date()
          };

          const decision = engine.evaluateOperation(operation);
          
          expect(decision.approved, `${command} ${args.join(' ')} should require manual approval`).toBe(false);
          expect(decision.requiresManualApproval).toBe(true);
          expect(decision.riskLevel).toBe(RiskLevel.HIGH);
        });
      });

      it('複合的な判定条件を正しく処理する', () => {
        const complexOperations = [
          {
            operation: {
              type: OperationType.GIT,
              command: 'git',
              args: ['push', '--force-with-lease', 'origin', 'main'],
              context: { workingDirectory: '/test', user: 'testuser', sessionId: 'test-session' },
              timestamp: new Date()
            },
            expectedApproval: false, // 強制系操作
            expectedRisk: RiskLevel.HIGH
          },
          {
            operation: {
              type: OperationType.FILE,
              command: 'rm',
              args: ['-rf', '/important/directory'],
              context: { workingDirectory: '/test', user: 'testuser', sessionId: 'test-session' },
              timestamp: new Date()
            },
            expectedApproval: false, // 削除系 + 強制系
            expectedRisk: RiskLevel.HIGH
          },
          {
            operation: {
              type: OperationType.SCRIPT,
              command: 'node',
              args: ['scripts/safe-report.mjs'],
              context: { workingDirectory: '/test', user: 'testuser', sessionId: 'test-session' },
              timestamp: new Date()
            },
            expectedApproval: true, // 許可されたパス + 拡張子
            expectedRisk: RiskLevel.MEDIUM
          }
        ];

        complexOperations.forEach(({ operation, expectedApproval, expectedRisk }) => {
          const decision = engine.evaluateOperation(operation);
          
          expect(decision.approved).toBe(expectedApproval);
          expect(decision.riskLevel).toBe(expectedRisk);
        });
      });
    });

    describe('セキュリティ制限の詳細', () => {
      it('時間あたりの自動承認制限を正しく適用する', () => {
        const operation: Operation = {
          type: OperationType.GIT,
          command: 'git',
          args: ['status'],
          context: {
            workingDirectory: '/test',
            user: 'testuser',
            sessionId: 'test-session'
          },
          timestamp: new Date()
        };

        // 制限を超えるまで操作を実行
        for (let i = 0; i < mockPolicy.security.maxAutoApprovalPerHour; i++) {
          const decision = engine.evaluateOperation(operation);
          expect(decision.approved).toBe(true);
        }

        // 制限を超えた操作は手動承認が必要
        const decision = engine.evaluateOperation(operation);
        expect(decision.approved).toBe(false);
        expect(decision.requiresManualApproval).toBe(true);
        expect(decision.reason).toContain('時間あたりの自動承認制限');
      });

      it('不審なパターン検出を正しく動作させる', () => {
        const suspiciousOperations = [
          // 短時間での大量の削除操作
          { command: 'rm', args: ['file1.txt'] },
          { command: 'rm', args: ['file2.txt'] },
          { command: 'rm', args: ['file3.txt'] },
          { command: 'rm', args: ['file4.txt'] },
          { command: 'rm', args: ['file5.txt'] }
        ];

        const timestamp = new Date();
        
        suspiciousOperations.forEach(({ command, args }, index) => {
          const operation: Operation = {
            type: OperationType.FILE,
            command,
            args,
            context: {
              workingDirectory: '/test',
              user: 'testuser',
              sessionId: 'test-session'
            },
            timestamp: new Date(timestamp.getTime() + index * 1000) // 1秒間隔
          };

          const decision = engine.evaluateOperation(operation);
          
          if (index >= 3) { // 4回目以降は不審パターンとして検出
            expect(decision.approved).toBe(false);
            expect(decision.reason).toContain('不審なパターン');
          }
        });
      });

      it('ユーザー別の操作制限を正しく適用する', () => {
        const users = ['user1', 'user2', 'user3'];
        const operation: Operation = {
          type: OperationType.GIT,
          command: 'git',
          args: ['status'],
          context: {
            workingDirectory: '/test',
            user: 'user1',
            sessionId: 'test-session'
          },
          timestamp: new Date()
        };

        // user1の制限を超える
        for (let i = 0; i < mockPolicy.security.maxAutoApprovalPerHour; i++) {
          const decision = engine.evaluateOperation(operation);
          expect(decision.approved).toBe(true);
        }

        // user1は制限に達している
        const user1Decision = engine.evaluateOperation(operation);
        expect(user1Decision.approved).toBe(false);

        // user2はまだ制限に達していない
        const user2Operation = { ...operation, context: { ...operation.context, user: 'user2' } };
        const user2Decision = engine.evaluateOperation(user2Operation);
        expect(user2Decision.approved).toBe(true);
      });
    });

    describe('コンテキスト依存の判定', () => {
      it('作業ディレクトリに基づく判定を正しく行う', () => {
        const sensitiveDirectories = [
          '/etc',
          '/root',
          '/usr/bin',
          '/var/log',
          '~/.ssh'
        ];

        sensitiveDirectories.forEach(dir => {
          const operation: Operation = {
            type: OperationType.FILE,
            command: 'rm',
            args: ['file.txt'],
            context: {
              workingDirectory: dir,
              user: 'testuser',
              sessionId: 'test-session'
            },
            timestamp: new Date()
          };

          const decision = engine.evaluateOperation(operation);
          
          expect(decision.approved).toBe(false);
          expect(decision.requiresManualApproval).toBe(true);
          expect(decision.reason).toContain('機密ディレクトリ');
        });
      });

      it('ファイルパスに基づく判定を正しく行う', () => {
        const sensitiveFiles = [
          '.env',
          '.env.production',
          'config/production.json',
          'secrets.json',
          'private.key',
          'id_rsa'
        ];

        sensitiveFiles.forEach(file => {
          const operation: Operation = {
            type: OperationType.FILE,
            command: 'rm',
            args: [file],
            context: {
              workingDirectory: '/test',
              user: 'testuser',
              sessionId: 'test-session'
            },
            timestamp: new Date()
          };

          const decision = engine.evaluateOperation(operation);
          
          expect(decision.approved).toBe(false);
          expect(decision.requiresManualApproval).toBe(true);
          expect(decision.reason).toContain('機密ファイル');
        });
      });

      it('MCP操作のコンテキストを正しく評価する', () => {
        const mcpOperations = [
          {
            server: 'github',
            tool: 'list_repositories',
            expectedApproval: true,
            expectedRisk: RiskLevel.LOW
          },
          {
            server: 'github',
            tool: 'create_repository',
            expectedApproval: false,
            expectedRisk: RiskLevel.HIGH
          },
          {
            server: 'sanity-dev',
            tool: 'query_documents',
            expectedApproval: true,
            expectedRisk: RiskLevel.LOW
          },
          {
            server: 'sanity-dev',
            tool: 'delete_document',
            expectedApproval: false,
            expectedRisk: RiskLevel.HIGH
          }
        ];

        mcpOperations.forEach(({ server, tool, expectedApproval, expectedRisk }) => {
          const operation: Operation = {
            type: OperationType.MCP,
            command: 'mcp-call',
            args: [server, tool],
            context: {
              workingDirectory: '/test',
              user: 'testuser',
              sessionId: 'test-session',
              mcpServer: server,
              mcpTool: tool
            },
            timestamp: new Date()
          };

          const decision = engine.evaluateOperation(operation);
          
          expect(decision.approved).toBe(expectedApproval);
          expect(decision.riskLevel).toBe(expectedRisk);
        });
      });
    });

    describe('エラーハンドリングと回復', () => {
      it('不正な操作データを適切に処理する', () => {
        const invalidOperations = [
          {
            type: OperationType.UNKNOWN,
            command: '',
            args: [],
            context: {
              workingDirectory: '/test',
              user: 'testuser',
              sessionId: 'test-session'
            },
            timestamp: new Date()
          },
          {
            type: OperationType.GIT,
            command: null as any,
            args: null as any,
            context: {
              workingDirectory: '/test',
              user: 'testuser',
              sessionId: 'test-session'
            },
            timestamp: new Date()
          }
        ];

        invalidOperations.forEach(operation => {
          expect(() => engine.evaluateOperation(operation)).not.toThrow();
          
          const decision = engine.evaluateOperation(operation);
          expect(decision).toBeDefined();
          expect(decision.approved).toBe(false); // 安全側に倒す
          expect(decision.reason).toContain('不明な操作');
        });
      });

      it('ポリシー読み込みエラー時のフォールバック', () => {
        const engineWithoutPolicy = new TrustDecisionEngine();
        
        const operation: Operation = {
          type: OperationType.GIT,
          command: 'git',
          args: ['status'],
          context: {
            workingDirectory: '/test',
            user: 'testuser',
            sessionId: 'test-session'
          },
          timestamp: new Date()
        };

        const decision = engineWithoutPolicy.evaluateOperation(operation);
        
        // デフォルトポリシーが適用される
        expect(decision).toBeDefined();
        expect(decision.approved).toBe(true); // git statusは安全な操作
      });

      it('判定処理中のエラーを適切に処理する', () => {
        // 判定処理でエラーが発生する状況をシミュレート
        const corruptedEngine = new TrustDecisionEngine(mockPolicy);
        
        // 内部状態を破損させる
        (corruptedEngine as any).operationHistory = null;
        
        const operation: Operation = {
          type: OperationType.GIT,
          command: 'git',
          args: ['status'],
          context: {
            workingDirectory: '/test',
            user: 'testuser',
            sessionId: 'test-session'
          },
          timestamp: new Date()
        };

        expect(() => corruptedEngine.evaluateOperation(operation)).not.toThrow();
        
        const decision = corruptedEngine.evaluateOperation(operation);
        expect(decision.approved).toBe(false); // エラー時は安全側に倒す
        expect(decision.reason).toContain('判定エラー');
      });
    });

    describe('パフォーマンス要件の検証', () => {
      it('100ms以内での判定処理を実現する', () => {
        const operation: Operation = {
          type: OperationType.GIT,
          command: 'git',
          args: ['status'],
          context: {
            workingDirectory: '/test',
            user: 'testuser',
            sessionId: 'test-session'
          },
          timestamp: new Date()
        };

        const iterations = 100;
        const startTime = Date.now();
        
        for (let i = 0; i < iterations; i++) {
          engine.evaluateOperation(operation);
        }
        
        const endTime = Date.now();
        const avgTime = (endTime - startTime) / iterations;
        
        expect(avgTime).toBeLessThan(100); // 100ms以内
      });

      it('複雑な操作でも高速判定を実現する', () => {
        const complexOperation: Operation = {
          type: OperationType.GIT,
          command: 'git',
          args: [
            'push', '--force-with-lease', '--set-upstream', 'origin',
            'feature/very-long-branch-name-with-many-hyphens-and-descriptive-text'
          ],
          context: {
            workingDirectory: '/very/deep/directory/structure/with/many/levels/of/nesting',
            user: 'user-with-very-long-username-that-might-affect-processing',
            sessionId: 'session-with-very-long-id-that-contains-many-characters-and-numbers-123456789'
          },
          timestamp: new Date()
        };

        const startTime = Date.now();
        const decision = engine.evaluateOperation(complexOperation);
        const endTime = Date.now();
        
        expect(endTime - startTime).toBeLessThan(100); // 100ms以内
        expect(decision).toBeDefined();
      });

      it('大量の履歴データがあっても高速判定を維持する', () => {
        // 大量の操作履歴を作成
        const baseOperation: Operation = {
          type: OperationType.GIT,
          command: 'git',
          args: ['status'],
          context: {
            workingDirectory: '/test',
            user: 'testuser',
            sessionId: 'test-session'
          },
          timestamp: new Date()
        };

        // 1000件の履歴を作成
        for (let i = 0; i < 1000; i++) {
          engine.evaluateOperation(baseOperation);
        }

        // 新しい操作の判定時間を測定
        const newOperation: Operation = {
          ...baseOperation,
          args: ['commit', '-m', 'new commit']
        };

        const startTime = Date.now();
        const decision = engine.evaluateOperation(newOperation);
        const endTime = Date.now();
        
        expect(endTime - startTime).toBeLessThan(100); // 100ms以内
        expect(decision.approved).toBe(true);
      });
    });

    describe('統計とメトリクス', () => {
      it('操作統計を正しく収集する', () => {
        const operations = [
          { type: OperationType.GIT, command: 'git', args: ['status'] },
          { type: OperationType.GIT, command: 'git', args: ['commit', '-m', 'test'] },
          { type: OperationType.FILE, command: 'touch', args: ['file.txt'] },
          { type: OperationType.CLI, command: 'vercel', args: ['status'] },
          { type: OperationType.GIT, command: 'git', args: ['push', '--force'] } // 手動承認
        ];

        operations.forEach(({ type, command, args }) => {
          const operation: Operation = {
            type,
            command,
            args,
            context: {
              workingDirectory: '/test',
              user: 'testuser',
              sessionId: 'test-session'
            },
            timestamp: new Date()
          };

          engine.evaluateOperation(operation);
        });

        const stats = engine.getOperationStats();
        
        expect(stats.totalOperations).toBe(5);
        expect(stats.autoApprovals).toBe(4);
        expect(stats.manualApprovals).toBe(1);
        expect(stats.autoApprovalRate).toBeCloseTo(80, 1); // 4/5 * 100
      });

      it('リスクレベル別の統計を正しく収集する', () => {
        const riskOperations = [
          { args: ['status'], expectedRisk: RiskLevel.LOW },
          { args: ['commit', '-m', 'test'], expectedRisk: RiskLevel.MEDIUM },
          { args: ['push', '--force'], expectedRisk: RiskLevel.HIGH }
        ];

        riskOperations.forEach(({ args, expectedRisk }) => {
          const operation: Operation = {
            type: OperationType.GIT,
            command: 'git',
            args,
            context: {
              workingDirectory: '/test',
              user: 'testuser',
              sessionId: 'test-session'
            },
            timestamp: new Date()
          };

          const decision = engine.evaluateOperation(operation);
          expect(decision.riskLevel).toBe(expectedRisk);
        });

        const stats = engine.getOperationStats();
        
        expect(stats.riskDistribution.low).toBe(1);
        expect(stats.riskDistribution.medium).toBe(1);
        expect(stats.riskDistribution.high).toBe(1);
      });

      it('時間帯別の統計を正しく収集する', () => {
        const timeSlots = [
          new Date('2025-08-27T09:00:00Z'), // 朝
          new Date('2025-08-27T13:00:00Z'), // 昼
          new Date('2025-08-27T18:00:00Z'), // 夕方
          new Date('2025-08-27T22:00:00Z')  // 夜
        ];

        timeSlots.forEach(timestamp => {
          const operation: Operation = {
            type: OperationType.GIT,
            command: 'git',
            args: ['status'],
            context: {
              workingDirectory: '/test',
              user: 'testuser',
              sessionId: 'test-session'
            },
            timestamp
          };

          engine.evaluateOperation(operation);
        });

        const stats = engine.getOperationStats();
        
        expect(stats.hourlyDistribution).toBeDefined();
        expect(Object.keys(stats.hourlyDistribution)).toHaveLength(4);
      });
    });
  });
});