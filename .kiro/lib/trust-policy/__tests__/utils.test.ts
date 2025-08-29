import { describe, it, expect } from 'vitest';
import {
  isGitOperation,
  isFileOperation,
  isCliOperation,
  isScriptOperation,
  isMcpOperation,
  isDeleteOperation,
  isForceOperation,
  isProductionImpactOperation,
  matchesPattern,
  normalizeCommand,
  mergePolicies,
  clonePolicy
} from '../utils.js';
import { Operation, OperationType, TrustPolicy } from '../types.js';

describe('Trust Policy Utils', () => {
  const createOperation = (type: OperationType, command: string): Operation => ({
    type,
    command,
    args: [],
    context: {
      workingDirectory: '/test',
      user: 'testuser',
      sessionId: 'test-session'
    },
    timestamp: new Date()
  });

  describe('Operation Type Detection', () => {
    it('Git操作を正しく判定する', () => {
      const gitOp = createOperation(OperationType.GIT, 'git status');
      const gitCommandOp = createOperation(OperationType.CLI, 'git commit -m "test"');
      const nonGitOp = createOperation(OperationType.FILE, 'ls -la');

      expect(isGitOperation(gitOp)).toBe(true);
      expect(isGitOperation(gitCommandOp)).toBe(true);
      expect(isGitOperation(nonGitOp)).toBe(false);
    });

    it('ファイル操作を正しく判定する', () => {
      const fileOp = createOperation(OperationType.FILE, 'touch test.txt');
      const mkdirOp = createOperation(OperationType.CLI, 'mkdir test');
      const gitOp = createOperation(OperationType.GIT, 'git status');

      expect(isFileOperation(fileOp)).toBe(true);
      expect(isFileOperation(mkdirOp)).toBe(true);
      expect(isFileOperation(gitOp)).toBe(false);
    });

    it('CLI操作を正しく判定する', () => {
      const cliOp = createOperation(OperationType.CLI, 'vercel status');
      const npmOp = createOperation(OperationType.CLI, 'npm install');
      const fileOp = createOperation(OperationType.FILE, 'touch test.txt');

      expect(isCliOperation(cliOp)).toBe(true);
      expect(isCliOperation(npmOp)).toBe(true);
      expect(isCliOperation(fileOp)).toBe(false);
    });

    it('スクリプト操作を正しく判定する', () => {
      const scriptOp = createOperation(OperationType.SCRIPT, 'node script.js');
      const mjsOp = createOperation(OperationType.CLI, 'node test.mjs');
      const gitOp = createOperation(OperationType.GIT, 'git status');

      expect(isScriptOperation(scriptOp)).toBe(true);
      expect(isScriptOperation(mjsOp)).toBe(true);
      expect(isScriptOperation(gitOp)).toBe(false);
    });

    it('MCP操作を正しく判定する', () => {
      const mcpOp = createOperation(OperationType.MCP, 'github:write');
      const sanityOp = createOperation(OperationType.CLI, 'sanity-dev:create');
      const gitOp = createOperation(OperationType.GIT, 'git status');

      expect(isMcpOperation(mcpOp)).toBe(true);
      expect(isMcpOperation(sanityOp)).toBe(true);
      expect(isMcpOperation(gitOp)).toBe(false);
    });
  });

  describe('Dangerous Operation Detection', () => {
    it('削除系操作を正しく判定する', () => {
      expect(isDeleteOperation('rm -rf test')).toBe(true);
      expect(isDeleteOperation('git branch -D feature')).toBe(true);
      expect(isDeleteOperation('vercel env rm TEST')).toBe(true);
      expect(isDeleteOperation('git status')).toBe(false);
    });

    it('強制系操作を正しく判定する', () => {
      expect(isForceOperation('git push --force')).toBe(true);
      expect(isForceOperation('git push -f')).toBe(true);
      expect(isForceOperation('git reset --hard')).toBe(true);
      expect(isForceOperation('git push origin main')).toBe(false);
    });

    it('本番環境影響操作を正しく判定する', () => {
      expect(isProductionImpactOperation('github:write')).toBe(true);
      expect(isProductionImpactOperation('sanity-dev:write')).toBe(true);
      expect(isProductionImpactOperation('vercel:envSet')).toBe(true);
      expect(isProductionImpactOperation('git status')).toBe(false);
    });
  });

  describe('Pattern Matching', () => {
    it('完全一致パターンをマッチする', () => {
      const patterns = ['git status', 'git commit'];
      
      expect(matchesPattern('git status', patterns)).toBe(true);
      expect(matchesPattern('GIT STATUS', patterns)).toBe(true);
      expect(matchesPattern('git push', patterns)).toBe(false);
    });

    it('ワイルドカードパターンをマッチする', () => {
      const patterns = ['git *', 'vercel env *'];
      
      expect(matchesPattern('git status', patterns)).toBe(true);
      expect(matchesPattern('git commit -m "test"', patterns)).toBe(true);
      expect(matchesPattern('vercel env ls', patterns)).toBe(true);
      expect(matchesPattern('npm install', patterns)).toBe(false);
    });

    it('部分一致パターンをマッチする', () => {
      const patterns = ['status', 'commit'];
      
      expect(matchesPattern('git status', patterns)).toBe(true);
      expect(matchesPattern('git commit -m "test"', patterns)).toBe(true);
      expect(matchesPattern('git push', patterns)).toBe(false);
    });
  });

  describe('Command Normalization', () => {
    it('コマンドを正規化する', () => {
      expect(normalizeCommand('  GIT   STATUS  ')).toBe('git status');
      expect(normalizeCommand('Git\tCommit\n')).toBe('git commit');
      expect(normalizeCommand('VERCEL ENV LS')).toBe('vercel env ls');
    });
  });

  describe('Policy Operations', () => {
    const basePolicy: TrustPolicy = {
      version: "1.0",
      lastUpdated: "2025-08-27T10:00:00Z",
      autoApprove: {
        gitOperations: ["status"],
        fileOperations: ["read"],
        cliOperations: { vercel: ["status"] },
        scriptExecution: { extensions: [".mjs"], allowedPaths: ["scripts/"] }
      },
      manualApprove: {
        deleteOperations: ["rm -rf"],
        forceOperations: ["git push --force"],
        productionImpact: ["github:write"]
      },
      security: {
        maxAutoApprovalPerHour: 1000,
        suspiciousPatternDetection: true,
        logAllOperations: true
      }
    };

    it('ポリシーをマージする', () => {
      const override = {
        version: "1.1",
        autoApprove: {
          gitOperations: ["status", "commit"]
        }
      };

      const merged = mergePolicies(basePolicy, override);

      expect(merged.version).toBe("1.1");
      expect(merged.autoApprove.gitOperations).toEqual(["status", "commit"]);
      expect(merged.autoApprove.fileOperations).toEqual(["read"]); // 元の値を保持
    });

    it('ポリシーをクローンする', () => {
      const cloned = clonePolicy(basePolicy);

      expect(cloned).toEqual(basePolicy);
      expect(cloned).not.toBe(basePolicy); // 異なるオブジェクト
      expect(cloned.autoApprove).not.toBe(basePolicy.autoApprove); // 深いクローン
    });
  });
});