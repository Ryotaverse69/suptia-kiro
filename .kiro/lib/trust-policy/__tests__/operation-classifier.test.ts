import { describe, it, expect, beforeEach } from 'vitest';
import { OperationClassifier } from '../operation-classifier.js';
import { Operation, OperationType, RiskLevel } from '../types.js';

describe('OperationClassifier', () => {
  let classifier: OperationClassifier;

  beforeEach(() => {
    classifier = new OperationClassifier();
  });

  describe('Git操作の分類', () => {
    it('通常のGit操作を自動承認として分類する', () => {
      const operation: Operation = {
        type: OperationType.GIT,
        command: 'git',
        args: ['status'],
        context: {
          workingDirectory: '/test',
          user: 'test-user',
          sessionId: 'test-session'
        },
        timestamp: new Date()
      };

      const result = classifier.classifyOperation(operation);

      expect(result.operationType).toBe(OperationType.GIT);
      expect(result.riskLevel).toBe(RiskLevel.MEDIUM);
      expect(result.requiresManualApproval).toBe(false);
      expect(result.patterns).toContain('auto-approve');
      expect(result.patterns).toContain('git');
    });

    it('Git削除操作を手動承認として分類する', () => {
      const operation: Operation = {
        type: OperationType.GIT,
        command: 'git',
        args: ['branch', '-D', 'feature-branch'],
        context: {
          workingDirectory: '/test',
          user: 'test-user',
          sessionId: 'test-session'
        },
        timestamp: new Date()
      };

      const result = classifier.classifyOperation(operation);

      expect(result.operationType).toBe(OperationType.GIT);
      expect(result.riskLevel).toBe(RiskLevel.HIGH);
      expect(result.requiresManualApproval).toBe(true);
      expect(result.patterns).toContain('deletion');
      expect(result.reason).toContain('削除系操作');
    });

    it('Git強制操作を手動承認として分類する', () => {
      const operation: Operation = {
        type: OperationType.GIT,
        command: 'git',
        args: ['push', '--force', 'origin', 'main'],
        context: {
          workingDirectory: '/test',
          user: 'test-user',
          sessionId: 'test-session'
        },
        timestamp: new Date()
      };

      const result = classifier.classifyOperation(operation);

      expect(result.operationType).toBe(OperationType.GIT);
      expect(result.riskLevel).toBe(RiskLevel.HIGH);
      expect(result.requiresManualApproval).toBe(true);
      expect(result.patterns).toContain('force');
      expect(result.reason).toContain('強制系操作');
    });

    it('Git reset --hardを手動承認として分類する', () => {
      const operation: Operation = {
        type: OperationType.GIT,
        command: 'git',
        args: ['reset', '--hard', 'HEAD~1'],
        context: {
          workingDirectory: '/test',
          user: 'test-user',
          sessionId: 'test-session'
        },
        timestamp: new Date()
      };

      const result = classifier.classifyOperation(operation);

      expect(result.operationType).toBe(OperationType.GIT);
      expect(result.riskLevel).toBe(RiskLevel.HIGH);
      expect(result.requiresManualApproval).toBe(true);
      expect(result.patterns).toContain('force');
    });
  });

  describe('ファイル操作の分類', () => {
    it('ファイル作成操作を自動承認として分類する', () => {
      const operation: Operation = {
        type: OperationType.FILE,
        command: 'touch',
        args: ['test.txt'],
        context: {
          workingDirectory: '/test',
          user: 'test-user',
          sessionId: 'test-session'
        },
        timestamp: new Date()
      };

      const result = classifier.classifyOperation(operation);

      expect(result.operationType).toBe(OperationType.FILE);
      expect(result.riskLevel).toBe(RiskLevel.LOW);
      expect(result.requiresManualApproval).toBe(false);
      expect(result.patterns).toContain('auto-approve');
    });

    it('ファイル削除操作を手動承認として分類する', () => {
      const operation: Operation = {
        type: OperationType.FILE,
        command: 'rm',
        args: ['-rf', 'important-folder'],
        context: {
          workingDirectory: '/test',
          user: 'test-user',
          sessionId: 'test-session'
        },
        timestamp: new Date()
      };

      const result = classifier.classifyOperation(operation);

      expect(result.operationType).toBe(OperationType.FILE);
      expect(result.riskLevel).toBe(RiskLevel.HIGH);
      expect(result.requiresManualApproval).toBe(true);
      expect(result.patterns).toContain('deletion');
      expect(result.patterns).toContain('force');
    });
  });

  describe('CLI操作の分類', () => {
    it('Vercel読み取り操作を自動承認として分類する', () => {
      const operation: Operation = {
        type: OperationType.CLI,
        command: 'vercel',
        args: ['env', 'ls'],
        context: {
          workingDirectory: '/test',
          user: 'test-user',
          sessionId: 'test-session'
        },
        timestamp: new Date()
      };

      const result = classifier.classifyOperation(operation);

      expect(result.operationType).toBe(OperationType.CLI);
      expect(result.riskLevel).toBe(RiskLevel.MEDIUM);
      expect(result.requiresManualApproval).toBe(false);
      expect(result.patterns).toContain('auto-approve');
    });

    it('Vercel削除操作を手動承認として分類する', () => {
      const operation: Operation = {
        type: OperationType.CLI,
        command: 'vercel',
        args: ['env', 'rm', 'TEST_VAR'],
        context: {
          workingDirectory: '/test',
          user: 'test-user',
          sessionId: 'test-session'
        },
        timestamp: new Date()
      };

      const result = classifier.classifyOperation(operation);

      expect(result.operationType).toBe(OperationType.CLI);
      expect(result.riskLevel).toBe(RiskLevel.HIGH);
      expect(result.requiresManualApproval).toBe(true);
      expect(result.patterns).toContain('deletion');
    });

    it('Vercel本番デプロイを手動承認として分類する', () => {
      const operation: Operation = {
        type: OperationType.CLI,
        command: 'vercel',
        args: ['deploy', '--prod'],
        context: {
          workingDirectory: '/test',
          user: 'test-user',
          sessionId: 'test-session'
        },
        timestamp: new Date()
      };

      const result = classifier.classifyOperation(operation);

      expect(result.operationType).toBe(OperationType.CLI);
      expect(result.riskLevel).toBe(RiskLevel.HIGH);
      expect(result.requiresManualApproval).toBe(true);
      expect(result.patterns).toContain('production-impact');
    });
  });

  describe('スクリプト実行の分類', () => {
    it('.mjsスクリプト実行を自動承認として分類する', () => {
      const operation: Operation = {
        type: OperationType.SCRIPT,
        command: 'node',
        args: ['scripts/report-generator.mjs'],
        context: {
          workingDirectory: '/test',
          user: 'test-user',
          sessionId: 'test-session'
        },
        timestamp: new Date()
      };

      const result = classifier.classifyOperation(operation);

      expect(result.operationType).toBe(OperationType.SCRIPT);
      expect(result.riskLevel).toBe(RiskLevel.MEDIUM);
      expect(result.requiresManualApproval).toBe(false);
      expect(result.patterns).toContain('auto-approve');
    });

    it('npm runスクリプトを自動承認として分類する', () => {
      const operation: Operation = {
        type: OperationType.SCRIPT,
        command: 'npm',
        args: ['run', 'test'],
        context: {
          workingDirectory: '/test',
          user: 'test-user',
          sessionId: 'test-session'
        },
        timestamp: new Date()
      };

      const result = classifier.classifyOperation(operation);

      expect(result.operationType).toBe(OperationType.SCRIPT);
      expect(result.riskLevel).toBe(RiskLevel.MEDIUM);
      expect(result.requiresManualApproval).toBe(false);
      expect(result.patterns).toContain('auto-approve');
    });
  });

  describe('MCP操作の分類', () => {
    it('GitHub読み取り操作を自動承認として分類する', () => {
      const operation: Operation = {
        type: OperationType.MCP,
        command: 'mcp-call',
        args: ['github', 'list_repositories'],
        context: {
          workingDirectory: '/test',
          user: 'test-user',
          sessionId: 'test-session',
          mcpServer: 'github',
          mcpTool: 'list_repositories'
        },
        timestamp: new Date()
      };

      const result = classifier.classifyOperation(operation);

      expect(result.operationType).toBe(OperationType.MCP);
      expect(result.riskLevel).toBe(RiskLevel.LOW);
      expect(result.requiresManualApproval).toBe(false);
    });

    it('GitHub書き込み操作を手動承認として分類する', () => {
      const operation: Operation = {
        type: OperationType.MCP,
        command: 'mcp-call',
        args: ['github', 'create_repository'],
        context: {
          workingDirectory: '/test',
          user: 'test-user',
          sessionId: 'test-session',
          mcpServer: 'github',
          mcpTool: 'create_repository'
        },
        timestamp: new Date()
      };

      const result = classifier.classifyOperation(operation);

      expect(result.operationType).toBe(OperationType.MCP);
      expect(result.riskLevel).toBe(RiskLevel.HIGH);
      expect(result.requiresManualApproval).toBe(true);
      expect(result.patterns).toContain('production-impact');
    });

    it('Sanity削除操作を手動承認として分類する', () => {
      const operation: Operation = {
        type: OperationType.MCP,
        command: 'mcp-call',
        args: ['sanity-dev', 'delete_document'],
        context: {
          workingDirectory: '/test',
          user: 'test-user',
          sessionId: 'test-session',
          mcpServer: 'sanity-dev',
          mcpTool: 'delete_document'
        },
        timestamp: new Date()
      };

      const result = classifier.classifyOperation(operation);

      expect(result.operationType).toBe(OperationType.MCP);
      expect(result.riskLevel).toBe(RiskLevel.HIGH);
      expect(result.requiresManualApproval).toBe(true);
      expect(result.patterns).toContain('deletion');
      expect(result.patterns).toContain('production-impact');
    });
  });

  describe('不明な操作の分類', () => {
    it('不明なコマンドをUNKNOWNとして分類する', () => {
      const operation: Operation = {
        type: OperationType.UNKNOWN,
        command: 'unknown-command',
        args: ['arg1', 'arg2'],
        context: {
          workingDirectory: '/test',
          user: 'test-user',
          sessionId: 'test-session'
        },
        timestamp: new Date()
      };

      const result = classifier.classifyOperation(operation);

      expect(result.operationType).toBe(OperationType.UNKNOWN);
      expect(result.riskLevel).toBe(RiskLevel.LOW);
      expect(result.requiresManualApproval).toBe(false);
    });
  });

  describe('パターンマッチング', () => {
    it('複数のパターンにマッチする操作を正しく分類する', () => {
      const operation: Operation = {
        type: OperationType.GIT,
        command: 'git',
        args: ['push', '--delete', 'origin', 'feature-branch'],
        context: {
          workingDirectory: '/test',
          user: 'test-user',
          sessionId: 'test-session'
        },
        timestamp: new Date()
      };

      const result = classifier.classifyOperation(operation);

      expect(result.operationType).toBe(OperationType.GIT);
      expect(result.riskLevel).toBe(RiskLevel.HIGH);
      expect(result.requiresManualApproval).toBe(true);
      expect(result.patterns).toContain('deletion');
      expect(result.patterns).toContain('git');
      expect(result.patterns).not.toContain('auto-approve');
    });

    it('自動承認対象のGit操作パターンを正しく検出する', () => {
      const operations = [
        { args: ['status'], shouldAutoApprove: true },
        { args: ['commit', '-m', 'test'], shouldAutoApprove: true },
        { args: ['push', 'origin', 'main'], shouldAutoApprove: true },
        { args: ['pull', 'origin', 'main'], shouldAutoApprove: true },
        { args: ['merge', 'feature-branch'], shouldAutoApprove: true },
        { args: ['log', '--oneline'], shouldAutoApprove: true },
        { args: ['diff', 'HEAD~1'], shouldAutoApprove: true },
        { args: ['branch', '-D', 'feature'], shouldAutoApprove: false }, // 削除系
        { args: ['push', '--force'], shouldAutoApprove: false }, // 強制系
      ];

      operations.forEach(({ args, shouldAutoApprove }) => {
        const operation: Operation = {
          type: OperationType.GIT,
          command: 'git',
          args,
          context: {
            workingDirectory: '/test',
            user: 'test-user',
            sessionId: 'test-session'
          },
          timestamp: new Date()
        };

        const result = classifier.classifyOperation(operation);
        expect(result.requiresManualApproval).toBe(!shouldAutoApprove);
        if (shouldAutoApprove) {
          expect(result.patterns).toContain('auto-approve');
        }
      });
    });

    it('Vercel CLI読み取り系操作を正しく検出する', () => {
      const operations = [
        { args: ['env', 'ls'], shouldAutoApprove: true },
        { args: ['domains', 'ls'], shouldAutoApprove: true },
        { args: ['deployments', 'ls'], shouldAutoApprove: true },
        { args: ['status'], shouldAutoApprove: true },
        { args: ['whoami'], shouldAutoApprove: true },
        { args: ['env', 'rm', 'TEST_VAR'], shouldAutoApprove: false }, // 削除系
        { args: ['domain', 'add', 'example.com'], shouldAutoApprove: false }, // 本番影響
      ];

      operations.forEach(({ args, shouldAutoApprove }) => {
        const operation: Operation = {
          type: OperationType.CLI,
          command: 'vercel',
          args,
          context: {
            workingDirectory: '/test',
            user: 'test-user',
            sessionId: 'test-session'
          },
          timestamp: new Date()
        };

        const result = classifier.classifyOperation(operation);
        expect(result.requiresManualApproval).toBe(!shouldAutoApprove);
      });
    });

    it('スクリプト実行パターンを正しく検出する', () => {
      const operations = [
        { command: 'node', args: ['scripts/report.mjs'], shouldAutoApprove: true },
        { command: 'npm', args: ['run', 'test'], shouldAutoApprove: true },
        { command: 'yarn', args: ['run', 'build'], shouldAutoApprove: true },
        { command: 'pnpm', args: ['run', 'dev'], shouldAutoApprove: true },
      ];

      operations.forEach(({ command, args, shouldAutoApprove }) => {
        const operation: Operation = {
          type: OperationType.SCRIPT,
          command,
          args,
          context: {
            workingDirectory: '/test',
            user: 'test-user',
            sessionId: 'test-session'
          },
          timestamp: new Date()
        };

        const result = classifier.classifyOperation(operation);
        expect(result.requiresManualApproval).toBe(!shouldAutoApprove);
        if (shouldAutoApprove) {
          expect(result.patterns).toContain('auto-approve');
        }
      });
    });
  });

  describe('エッジケース', () => {
    it('空のコマンドを適切に処理する', () => {
      const operation: Operation = {
        type: OperationType.UNKNOWN,
        command: '',
        args: [],
        context: {
          workingDirectory: '/test',
          user: 'test-user',
          sessionId: 'test-session'
        },
        timestamp: new Date()
      };

      const result = classifier.classifyOperation(operation);

      expect(result.operationType).toBe(OperationType.UNKNOWN);
      expect(result.requiresManualApproval).toBe(false);
    });

    it('大文字小文字を区別せずに分類する', () => {
      const operation: Operation = {
        type: OperationType.GIT,
        command: 'GIT',
        args: ['STATUS'],
        context: {
          workingDirectory: '/test',
          user: 'test-user',
          sessionId: 'test-session'
        },
        timestamp: new Date()
      };

      const result = classifier.classifyOperation(operation);

      expect(result.operationType).toBe(OperationType.GIT);
      expect(result.requiresManualApproval).toBe(false);
    });

    it('引数に空白が含まれる場合を適切に処理する', () => {
      const operation: Operation = {
        type: OperationType.GIT,
        command: 'git',
        args: ['commit', '-m', 'test message with spaces'],
        context: {
          workingDirectory: '/test',
          user: 'test-user',
          sessionId: 'test-session'
        },
        timestamp: new Date()
      };

      const result = classifier.classifyOperation(operation);

      expect(result.operationType).toBe(OperationType.GIT);
      expect(result.requiresManualApproval).toBe(false);
      expect(result.patterns).toContain('auto-approve');
    });

    it('不正な操作コンテキストを適切に処理する', () => {
      const operation: Operation = {
        type: OperationType.MCP,
        command: 'mcp-call',
        args: ['invalid-server', 'invalid-tool'],
        context: {
          workingDirectory: '/test',
          user: 'test-user',
          sessionId: 'test-session',
          mcpServer: undefined,
          mcpTool: undefined
        },
        timestamp: new Date()
      };

      const result = classifier.classifyOperation(operation);

      expect(result.operationType).toBe(OperationType.MCP);
      expect(result.requiresManualApproval).toBe(false); // 読み取り系として扱う
    });

    it('複雑なファイルパスを含む操作を正しく分類する', () => {
      const operation: Operation = {
        type: OperationType.FILE,
        command: 'cp',
        args: ['/path/to/source/file.txt', '/path/to/destination/file.txt'],
        context: {
          workingDirectory: '/test',
          user: 'test-user',
          sessionId: 'test-session'
        },
        timestamp: new Date()
      };

      const result = classifier.classifyOperation(operation);

      expect(result.operationType).toBe(OperationType.FILE);
      expect(result.requiresManualApproval).toBe(false);
      expect(result.patterns).toContain('auto-approve');
    });
  });

  describe('要件準拠テスト', () => {
    describe('要件2.1: Git通常操作の自動承認', () => {
      it('指定されたGit操作を自動承認する', () => {
        const autoApproveOps = ['status', 'commit', 'push', 'pull', 'merge', 'log'];
        
        autoApproveOps.forEach(op => {
          const operation: Operation = {
            type: OperationType.GIT,
            command: 'git',
            args: [op],
            context: {
              workingDirectory: '/test',
              user: 'test-user',
              sessionId: 'test-session'
            },
            timestamp: new Date()
          };

          const result = classifier.classifyOperation(operation);
          expect(result.requiresManualApproval).toBe(false);
          expect(result.patterns).toContain('auto-approve');
        });
      });
    });

    describe('要件2.2: ローカルファイル操作の自動承認', () => {
      it('ファイル作成・更新操作を自動承認する', () => {
        const fileOps = [
          { command: 'touch', args: ['newfile.txt'] },
          { command: 'mkdir', args: ['newdir'] },
          { command: 'cp', args: ['source.txt', 'dest.txt'] },
          { command: 'mv', args: ['old.txt', 'new.txt'] },
        ];

        fileOps.forEach(({ command, args }) => {
          const operation: Operation = {
            type: OperationType.FILE,
            command,
            args,
            context: {
              workingDirectory: '/test',
              user: 'test-user',
              sessionId: 'test-session'
            },
            timestamp: new Date()
          };

          const result = classifier.classifyOperation(operation);
          expect(result.requiresManualApproval).toBe(false);
          expect(result.patterns).toContain('auto-approve');
        });
      });
    });

    describe('要件2.3: Vercel CLI読み取り系操作の自動承認', () => {
      it('指定されたVercel読み取り操作を自動承認する', () => {
        const vercelReadOps = [
          ['env', 'ls'],
          ['domains', 'ls'],
          ['deployments', 'ls'],
          ['status'],
        ];

        vercelReadOps.forEach(args => {
          const operation: Operation = {
            type: OperationType.CLI,
            command: 'vercel',
            args,
            context: {
              workingDirectory: '/test',
              user: 'test-user',
              sessionId: 'test-session'
            },
            timestamp: new Date()
          };

          const result = classifier.classifyOperation(operation);
          expect(result.requiresManualApproval).toBe(false);
          expect(result.patterns).toContain('auto-approve');
        });
      });
    });

    describe('要件2.4: スクリプト実行の自動承認', () => {
      it('.mjsスクリプト実行を自動承認する', () => {
        const operation: Operation = {
          type: OperationType.SCRIPT,
          command: 'node',
          args: ['scripts/report-generator.mjs'],
          context: {
            workingDirectory: '/test',
            user: 'test-user',
            sessionId: 'test-session'
          },
          timestamp: new Date()
        };

        const result = classifier.classifyOperation(operation);
        expect(result.requiresManualApproval).toBe(false);
        expect(result.patterns).toContain('auto-approve');
      });
    });

    describe('要件3.1: 削除系操作の手動承認', () => {
      it('指定された削除系操作を手動承認とする', () => {
        const deletionOps = [
          { command: 'git', args: ['branch', '-D', 'feature'] },
          { command: 'git', args: ['push', '--delete', 'origin', 'branch'] },
          { command: 'rm', args: ['file.txt'] },
          { command: 'vercel', args: ['env', 'rm', 'VAR'] },
          { command: 'vercel', args: ['domain', 'rm', 'example.com'] },
        ];

        deletionOps.forEach(({ command, args }) => {
          const operation: Operation = {
            type: OperationType.UNKNOWN,
            command,
            args,
            context: {
              workingDirectory: '/test',
              user: 'test-user',
              sessionId: 'test-session'
            },
            timestamp: new Date()
          };

          const result = classifier.classifyOperation(operation);
          expect(result.requiresManualApproval).toBe(true);
          expect(result.patterns).toContain('deletion');
          expect(result.reason).toContain('削除系操作');
        });
      });
    });

    describe('要件3.2: 強制系操作の手動承認', () => {
      it('指定された強制系操作を手動承認とする', () => {
        const forceOps = [
          { command: 'git', args: ['reset', '--hard', 'HEAD~1'] },
          { command: 'git', args: ['push', '--force', 'origin', 'main'] },
          { command: 'rm', args: ['-rf', 'directory'] },
        ];

        forceOps.forEach(({ command, args }) => {
          const operation: Operation = {
            type: OperationType.UNKNOWN,
            command,
            args,
            context: {
              workingDirectory: '/test',
              user: 'test-user',
              sessionId: 'test-session'
            },
            timestamp: new Date()
          };

          const result = classifier.classifyOperation(operation);
          expect(result.requiresManualApproval).toBe(true);
          expect(result.patterns).toContain('force');
          expect(result.reason).toContain('強制系操作');
        });
      });
    });

    describe('要件3.3: 本番環境影響操作の手動承認', () => {
      it('GitHub/Sanity-dev MCP書き込み系操作を手動承認とする', () => {
        const mcpWriteOps = [
          { server: 'github', tool: 'create_repository' },
          { server: 'github', tool: 'update_file' },
          { server: 'sanity-dev', tool: 'create_document' },
          { server: 'sanity-dev', tool: 'delete_document' },
        ];

        mcpWriteOps.forEach(({ server, tool }) => {
          const operation: Operation = {
            type: OperationType.MCP,
            command: 'mcp-call',
            args: [server, tool],
            context: {
              workingDirectory: '/test',
              user: 'test-user',
              sessionId: 'test-session',
              mcpServer: server,
              mcpTool: tool
            },
            timestamp: new Date()
          };

          const result = classifier.classifyOperation(operation);
          expect(result.requiresManualApproval).toBe(true);
          expect(result.patterns).toContain('production-impact');
          expect(result.reason).toContain('本番環境に影響');
        });
      });

      it('Vercel本番影響操作を手動承認とする', () => {
        const vercelProdOps = [
          ['env', 'set', 'VAR', 'value'],
          ['domain', 'add', 'example.com'],
          ['deploy', '--prod'],
        ];

        vercelProdOps.forEach(args => {
          const operation: Operation = {
            type: OperationType.CLI,
            command: 'vercel',
            args,
            context: {
              workingDirectory: '/test',
              user: 'test-user',
              sessionId: 'test-session'
            },
            timestamp: new Date()
          };

          const result = classifier.classifyOperation(operation);
          expect(result.requiresManualApproval).toBe(true);
          expect(result.patterns).toContain('production-impact');
        });
      });
    });
  });
});