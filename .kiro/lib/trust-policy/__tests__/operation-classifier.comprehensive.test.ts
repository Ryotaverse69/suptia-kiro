import { describe, it, expect, beforeEach } from 'vitest';
import { OperationClassifier } from '../operation-classifier.js';
import { Operation, OperationType, RiskLevel } from '../types.js';

describe('OperationClassifier - 包括的テスト', () => {
  let classifier: OperationClassifier;

  beforeEach(() => {
    classifier = new OperationClassifier();
  });

  describe('各操作タイプの分類テスト', () => {
    describe('Git操作の詳細分類', () => {
      it('すべての自動承認対象Git操作を正しく分類する', () => {
        const autoApproveOps = [
          'status', 'commit', 'push', 'pull', 'merge', 'log',
          'diff', 'show', 'branch', 'checkout', 'switch', 'add',
          'stash', 'tag', 'remote', 'config', 'init', 'clone'
        ];

        autoApproveOps.forEach(op => {
          const operation: Operation = {
            type: OperationType.GIT,
            command: 'git',
            args: [op, 'additional-arg'],
            context: {
              workingDirectory: '/test',
              user: 'test-user',
              sessionId: 'test-session'
            },
            timestamp: new Date()
          };

          const result = classifier.classifyOperation(operation);
          expect(result.requiresManualApproval, `${op} should be auto-approved`).toBe(false);
          expect(result.patterns).toContain('auto-approve');
          expect(result.riskLevel).toBeLessThanOrEqual(RiskLevel.MEDIUM);
        });
      });

      it('すべての手動承認対象Git操作を正しく分類する', () => {
        const manualApproveOps = [
          { args: ['branch', '-D', 'feature'], reason: '削除系操作' },
          { args: ['push', '--delete', 'origin', 'branch'], reason: '削除系操作' },
          { args: ['reset', '--hard', 'HEAD~1'], reason: '強制系操作' },
          { args: ['push', '--force', 'origin', 'main'], reason: '強制系操作' },
          { args: ['push', '-f', 'origin', 'main'], reason: '強制系操作' },
          { args: ['rebase', '--force-rebase'], reason: '強制系操作' },
          { args: ['clean', '-fd'], reason: '強制系操作' }
        ];

        manualApproveOps.forEach(({ args, reason }) => {
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
          expect(result.requiresManualApproval, `git ${args.join(' ')} should require manual approval`).toBe(true);
          expect(result.riskLevel).toBe(RiskLevel.HIGH);
          expect(result.reason).toContain(reason);
        });
      });

      it('Git操作の引数順序に関係なく正しく分類する', () => {
        const variations = [
          ['push', '--force', 'origin', 'main'],
          ['push', 'origin', 'main', '--force'],
          ['push', '--force-with-lease', 'origin', 'main'],
          ['push', 'origin', '--force', 'main']
        ];

        variations.forEach(args => {
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
          expect(result.requiresManualApproval, `git ${args.join(' ')} should require manual approval`).toBe(true);
          expect(result.patterns).toContain('force');
        });
      });
    });

    describe('ファイル操作の詳細分類', () => {
      it('すべての自動承認対象ファイル操作を正しく分類する', () => {
        const autoApproveOps = [
          { command: 'touch', args: ['file.txt'] },
          { command: 'mkdir', args: ['-p', 'dir/subdir'] },
          { command: 'cp', args: ['source.txt', 'dest.txt'] },
          { command: 'mv', args: ['old.txt', 'new.txt'] },
          { command: 'cat', args: ['file.txt'] },
          { command: 'ls', args: ['-la', 'directory'] },
          { command: 'find', args: ['.', '-name', '*.txt'] },
          { command: 'grep', args: ['-r', 'pattern', '.'] },
          { command: 'echo', args: ['content', '>', 'file.txt'] },
          { command: 'tee', args: ['file.txt'] }
        ];

        autoApproveOps.forEach(({ command, args }) => {
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
          expect(result.requiresManualApproval, `${command} ${args.join(' ')} should be auto-approved`).toBe(false);
          expect(result.patterns).toContain('auto-approve');
        });
      });

      it('すべての手動承認対象ファイル操作を正しく分類する', () => {
        const manualApproveOps = [
          { command: 'rm', args: ['file.txt'], reason: '削除系操作' },
          { command: 'rm', args: ['-f', 'file.txt'], reason: '削除系操作' },
          { command: 'rm', args: ['-rf', 'directory'], reason: '削除系操作' },
          { command: 'rmdir', args: ['directory'], reason: '削除系操作' },
          { command: 'unlink', args: ['file.txt'], reason: '削除系操作' },
          { command: 'dd', args: ['if=/dev/zero', 'of=file'], reason: '強制系操作' },
          { command: 'shred', args: ['-vfz', 'file.txt'], reason: '強制系操作' }
        ];

        manualApproveOps.forEach(({ command, args, reason }) => {
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
          expect(result.requiresManualApproval, `${command} ${args.join(' ')} should require manual approval`).toBe(true);
          expect(result.riskLevel).toBe(RiskLevel.HIGH);
          expect(result.reason).toContain(reason);
        });
      });

      it('ファイルパスに基づく分類を正しく行う', () => {
        const sensitiveFiles = [
          '/etc/passwd',
          '/etc/shadow',
          '/root/.ssh/id_rsa',
          '~/.ssh/id_rsa',
          '.env',
          '.env.production',
          'config/production.json'
        ];

        sensitiveFiles.forEach(filePath => {
          const operation: Operation = {
            type: OperationType.FILE,
            command: 'rm',
            args: [filePath],
            context: {
              workingDirectory: '/test',
              user: 'test-user',
              sessionId: 'test-session'
            },
            timestamp: new Date()
          };

          const result = classifier.classifyOperation(operation);
          expect(result.requiresManualApproval, `Deleting ${filePath} should require manual approval`).toBe(true);
          expect(result.riskLevel).toBe(RiskLevel.HIGH);
        });
      });
    });

    describe('CLI操作の詳細分類', () => {
      it('Vercel CLI読み取り系操作を正しく分類する', () => {
        const readOps = [
          ['env', 'ls'],
          ['env', 'ls', '--environment', 'production'],
          ['domains', 'ls'],
          ['deployments', 'ls'],
          ['deployments', 'ls', '--limit', '10'],
          ['status'],
          ['whoami'],
          ['projects', 'ls'],
          ['teams', 'ls'],
          ['logs', 'deployment-id']
        ];

        readOps.forEach(args => {
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
          expect(result.requiresManualApproval, `vercel ${args.join(' ')} should be auto-approved`).toBe(false);
          expect(result.patterns).toContain('auto-approve');
        });
      });

      it('Vercel CLI書き込み系操作を正しく分類する', () => {
        const writeOps = [
          { args: ['env', 'add', 'VAR', 'value'], reason: '本番環境に影響' },
          { args: ['env', 'rm', 'VAR'], reason: '削除系操作' },
          { args: ['domain', 'add', 'example.com'], reason: '本番環境に影響' },
          { args: ['domain', 'rm', 'example.com'], reason: '削除系操作' },
          { args: ['deploy', '--prod'], reason: '本番環境に影響' },
          { args: ['alias', 'set', 'deployment-url', 'alias'], reason: '本番環境に影響' },
          { args: ['secrets', 'add', 'secret-name', 'value'], reason: '本番環境に影響' },
          { args: ['secrets', 'rm', 'secret-name'], reason: '削除系操作' }
        ];

        writeOps.forEach(({ args, reason }) => {
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
          expect(result.requiresManualApproval, `vercel ${args.join(' ')} should require manual approval`).toBe(true);
          expect(result.riskLevel).toBe(RiskLevel.HIGH);
          expect(result.reason).toContain(reason);
        });
      });

      it('npm/yarn/pnpm操作を正しく分類する', () => {
        const packageManagers = ['npm', 'yarn', 'pnpm'];
        
        packageManagers.forEach(pm => {
          // 安全な操作
          const safeOps = [
            ['run', 'test'],
            ['run', 'build'],
            ['run', 'dev'],
            ['install'],
            ['list'],
            ['outdated'],
            ['audit']
          ];

          safeOps.forEach(args => {
            const operation: Operation = {
              type: OperationType.SCRIPT,
              command: pm,
              args,
              context: {
                workingDirectory: '/test',
                user: 'test-user',
                sessionId: 'test-session'
              },
              timestamp: new Date()
            };

            const result = classifier.classifyOperation(operation);
            expect(result.requiresManualApproval, `${pm} ${args.join(' ')} should be auto-approved`).toBe(false);
          });

          // 危険な操作
          const dangerousOps = [
            ['publish'],
            ['unpublish'],
            ['deprecate']
          ];

          dangerousOps.forEach(args => {
            const operation: Operation = {
              type: OperationType.SCRIPT,
              command: pm,
              args,
              context: {
                workingDirectory: '/test',
                user: 'test-user',
                sessionId: 'test-session'
              },
              timestamp: new Date()
            };

            const result = classifier.classifyOperation(operation);
            expect(result.requiresManualApproval, `${pm} ${args.join(' ')} should require manual approval`).toBe(true);
          });
        });
      });
    });

    describe('スクリプト実行の詳細分類', () => {
      it('許可されたスクリプト拡張子を正しく分類する', () => {
        const allowedScripts = [
          { command: 'node', args: ['script.mjs'] },
          { command: 'node', args: ['scripts/report.mjs'] },
          { command: 'node', args: ['.kiro/scripts/init.mjs'] },
          { command: 'deno', args: ['run', 'script.ts'] },
          { command: 'python3', args: ['script.py'] },
          { command: 'bash', args: ['script.sh'] }
        ];

        allowedScripts.forEach(({ command, args }) => {
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
          expect(result.requiresManualApproval, `${command} ${args.join(' ')} should be auto-approved`).toBe(false);
          expect(result.patterns).toContain('auto-approve');
        });
      });

      it('許可されたパス内のスクリプトを正しく分類する', () => {
        const allowedPaths = [
          'scripts/',
          '.kiro/scripts/',
          'tools/',
          'bin/'
        ];

        allowedPaths.forEach(path => {
          const operation: Operation = {
            type: OperationType.SCRIPT,
            command: 'node',
            args: [`${path}test-script.mjs`],
            context: {
              workingDirectory: '/test',
              user: 'test-user',
              sessionId: 'test-session'
            },
            timestamp: new Date()
          };

          const result = classifier.classifyOperation(operation);
          expect(result.requiresManualApproval, `Script in ${path} should be auto-approved`).toBe(false);
          expect(result.patterns).toContain('auto-approve');
        });
      });

      it('システムコマンドを適切に分類する', () => {
        const systemCommands = [
          { command: 'sudo', args: ['rm', '-rf', '/'], shouldRequireApproval: true },
          { command: 'chmod', args: ['777', '/etc/passwd'], shouldRequireApproval: true },
          { command: 'chown', args: ['root:root', 'file'], shouldRequireApproval: true },
          { command: 'systemctl', args: ['stop', 'nginx'], shouldRequireApproval: true },
          { command: 'service', args: ['apache2', 'restart'], shouldRequireApproval: true }
        ];

        systemCommands.forEach(({ command, args, shouldRequireApproval }) => {
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
          expect(result.requiresManualApproval).toBe(shouldRequireApproval);
          if (shouldRequireApproval) {
            expect(result.riskLevel).toBe(RiskLevel.HIGH);
          }
        });
      });
    });

    describe('MCP操作の詳細分類', () => {
      it('GitHub MCP操作を正しく分類する', () => {
        const githubOps = [
          // 読み取り系（自動承認）
          { tool: 'list_repositories', shouldRequireApproval: false },
          { tool: 'get_repository', shouldRequireApproval: false },
          { tool: 'list_issues', shouldRequireApproval: false },
          { tool: 'get_issue', shouldRequireApproval: false },
          { tool: 'list_pull_requests', shouldRequireApproval: false },
          { tool: 'get_pull_request', shouldRequireApproval: false },
          { tool: 'search_repositories', shouldRequireApproval: false },
          { tool: 'get_file_contents', shouldRequireApproval: false },
          
          // 書き込み系（手動承認）
          { tool: 'create_repository', shouldRequireApproval: true },
          { tool: 'update_repository', shouldRequireApproval: true },
          { tool: 'delete_repository', shouldRequireApproval: true },
          { tool: 'create_issue', shouldRequireApproval: true },
          { tool: 'update_issue', shouldRequireApproval: true },
          { tool: 'create_pull_request', shouldRequireApproval: true },
          { tool: 'merge_pull_request', shouldRequireApproval: true },
          { tool: 'create_or_update_file', shouldRequireApproval: true },
          { tool: 'delete_file', shouldRequireApproval: true }
        ];

        githubOps.forEach(({ tool, shouldRequireApproval }) => {
          const operation: Operation = {
            type: OperationType.MCP,
            command: 'mcp-call',
            args: ['github', tool],
            context: {
              workingDirectory: '/test',
              user: 'test-user',
              sessionId: 'test-session',
              mcpServer: 'github',
              mcpTool: tool
            },
            timestamp: new Date()
          };

          const result = classifier.classifyOperation(operation);
          expect(result.requiresManualApproval, `GitHub ${tool} should ${shouldRequireApproval ? 'require' : 'not require'} manual approval`).toBe(shouldRequireApproval);
          
          if (shouldRequireApproval) {
            expect(result.patterns).toContain('production-impact');
            expect(result.riskLevel).toBe(RiskLevel.HIGH);
          } else {
            expect(result.riskLevel).toBeLessThanOrEqual(RiskLevel.MEDIUM);
          }
        });
      });

      it('Sanity MCP操作を正しく分類する', () => {
        const sanityOps = [
          // 読み取り系（自動承認）
          { tool: 'query_documents', shouldRequireApproval: false },
          { tool: 'get_schema', shouldRequireApproval: false },
          { tool: 'list_datasets', shouldRequireApproval: false },
          { tool: 'list_projects', shouldRequireApproval: false },
          { tool: 'semantic_search', shouldRequireApproval: false },
          
          // 書き込み系（手動承認）
          { tool: 'create_document', shouldRequireApproval: true },
          { tool: 'update_document', shouldRequireApproval: true },
          { tool: 'patch_document', shouldRequireApproval: true },
          { tool: 'document_action', shouldRequireApproval: true },
          { tool: 'create_dataset', shouldRequireApproval: true },
          { tool: 'delete_dataset', shouldRequireApproval: true },
          { tool: 'create_release', shouldRequireApproval: true },
          { tool: 'release_action', shouldRequireApproval: true }
        ];

        sanityOps.forEach(({ tool, shouldRequireApproval }) => {
          const operation: Operation = {
            type: OperationType.MCP,
            command: 'mcp-call',
            args: ['sanity-dev', tool],
            context: {
              workingDirectory: '/test',
              user: 'test-user',
              sessionId: 'test-session',
              mcpServer: 'sanity-dev',
              mcpTool: tool
            },
            timestamp: new Date()
          };

          const result = classifier.classifyOperation(operation);
          expect(result.requiresManualApproval, `Sanity ${tool} should ${shouldRequireApproval ? 'require' : 'not require'} manual approval`).toBe(shouldRequireApproval);
          
          if (shouldRequireApproval) {
            expect(result.patterns).toContain('production-impact');
            expect(result.riskLevel).toBe(RiskLevel.HIGH);
          }
        });
      });

      it('その他のMCP操作を正しく分類する', () => {
        const otherMcpOps = [
          // filesystem（自動承認）
          { server: 'filesystem', tool: 'read_file', shouldRequireApproval: false },
          { server: 'filesystem', tool: 'write_file', shouldRequireApproval: false },
          { server: 'filesystem', tool: 'list_directory', shouldRequireApproval: false },
          
          // fetch（自動承認）
          { server: 'fetch', tool: 'fetch', shouldRequireApproval: false },
          
          // brave-search（自動承認）
          { server: 'brave-search', tool: 'brave_web_search', shouldRequireApproval: false }
        ];

        otherMcpOps.forEach(({ server, tool, shouldRequireApproval }) => {
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
          expect(result.requiresManualApproval, `${server} ${tool} should ${shouldRequireApproval ? 'require' : 'not require'} manual approval`).toBe(shouldRequireApproval);
        });
      });
    });
  });

  describe('エッジケースとエラーハンドリング', () => {
    it('null/undefined値を適切に処理する', () => {
      const edgeCases = [
        { command: '', args: [] },
        { command: null as any, args: [] },
        { command: 'git', args: null as any },
        { command: 'git', args: [null as any] },
        { command: 'git', args: [undefined as any] }
      ];

      edgeCases.forEach(({ command, args }) => {
        const operation: Operation = {
          type: OperationType.UNKNOWN,
          command: command || '',
          args: args || [],
          context: {
            workingDirectory: '/test',
            user: 'test-user',
            sessionId: 'test-session'
          },
          timestamp: new Date()
        };

        expect(() => classifier.classifyOperation(operation)).not.toThrow();
        const result = classifier.classifyOperation(operation);
        expect(result).toBeDefined();
        expect(result.operationType).toBeDefined();
      });
    });

    it('非常に長い引数リストを適切に処理する', () => {
      const longArgs = Array(1000).fill('very-long-argument-string-that-might-cause-performance-issues');
      
      const operation: Operation = {
        type: OperationType.GIT,
        command: 'git',
        args: ['status', ...longArgs],
        context: {
          workingDirectory: '/test',
          user: 'test-user',
          sessionId: 'test-session'
        },
        timestamp: new Date()
      };

      const startTime = Date.now();
      const result = classifier.classifyOperation(operation);
      const endTime = Date.now();

      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(1000); // 1秒以内で処理完了
    });

    it('特殊文字を含む引数を適切に処理する', () => {
      const specialChars = [
        '$(rm -rf /)',
        '`rm -rf /`',
        '; rm -rf /',
        '&& rm -rf /',
        '|| rm -rf /',
        '| rm -rf /',
        '> /dev/null',
        '< /etc/passwd',
        '*',
        '?',
        '[a-z]',
        '{1..10}',
        '~',
        '$HOME',
        '\\n\\r\\t'
      ];

      specialChars.forEach(specialChar => {
        const operation: Operation = {
          type: OperationType.GIT,
          command: 'git',
          args: ['commit', '-m', specialChar],
          context: {
            workingDirectory: '/test',
            user: 'test-user',
            sessionId: 'test-session'
          },
          timestamp: new Date()
        };

        expect(() => classifier.classifyOperation(operation)).not.toThrow();
        const result = classifier.classifyOperation(operation);
        expect(result).toBeDefined();
      });
    });

    it('Unicode文字を含む引数を適切に処理する', () => {
      const unicodeStrings = [
        '日本語のコミットメッセージ',
        'Émojis: 🚀🔥💯',
        'العربية',
        'Русский',
        '中文',
        '한국어',
        '🎉✨🌟⭐️🔥💯🚀'
      ];

      unicodeStrings.forEach(unicodeStr => {
        const operation: Operation = {
          type: OperationType.GIT,
          command: 'git',
          args: ['commit', '-m', unicodeStr],
          context: {
            workingDirectory: '/test',
            user: 'test-user',
            sessionId: 'test-session'
          },
          timestamp: new Date()
        };

        const result = classifier.classifyOperation(operation);
        expect(result).toBeDefined();
        expect(result.requiresManualApproval).toBe(false);
      });
    });
  });

  describe('パフォーマンステスト', () => {
    it('大量の操作を高速で分類する', () => {
      const operations: Operation[] = Array(1000).fill(null).map((_, i) => ({
        type: OperationType.GIT,
        command: 'git',
        args: ['status'],
        context: {
          workingDirectory: '/test',
          user: 'test-user',
          sessionId: `test-session-${i}`
        },
        timestamp: new Date()
      }));

      const startTime = Date.now();
      
      operations.forEach(operation => {
        classifier.classifyOperation(operation);
      });
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const avgTimePerOperation = totalTime / operations.length;

      expect(avgTimePerOperation).toBeLessThan(1); // 1ms以内/操作
      expect(totalTime).toBeLessThan(1000); // 全体で1秒以内
    });

    it('複雑なパターンマッチングを効率的に実行する', () => {
      const complexOperations = [
        { command: 'git', args: ['push', '--force-with-lease', '--set-upstream', 'origin', 'feature/very-long-branch-name-with-special-chars-123'] },
        { command: 'vercel', args: ['env', 'add', 'VERY_LONG_ENVIRONMENT_VARIABLE_NAME_WITH_UNDERSCORES', 'very-long-value-that-might-contain-sensitive-information'] },
        { command: 'rm', args: ['-rf', '/very/deep/directory/structure/with/many/subdirectories/and/files'] }
      ];

      const startTime = Date.now();
      
      complexOperations.forEach(({ command, args }) => {
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

        classifier.classifyOperation(operation);
      });
      
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(100); // 100ms以内
    });
  });
});