import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import { PolicyManager } from '../policy-manager.js';
import { TrustPolicy } from '../types.js';

// fs.readFile と fs.writeFile をモック
vi.mock('fs', () => ({
  promises: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    mkdir: vi.fn(),
    access: vi.fn(),
    stat: vi.fn()
  }
}));

const mockFs = vi.mocked(fs);

describe('PolicyManager - 包括的テスト', () => {
  let policyManager: PolicyManager;
  
  const validPolicy: TrustPolicy = {
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

  beforeEach(() => {
    policyManager = new PolicyManager();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('ポリシー評価の詳細テスト', () => {
    describe('デフォルト設定の動作', () => {
      it('デフォルトポリシーが正しく読み込まれる', async () => {
        mockFs.readFile
          .mockRejectedValueOnce(new Error('ENOENT: no such file or directory'))
          .mockResolvedValueOnce(JSON.stringify(validPolicy));

        const result = await policyManager.loadPolicy();

        expect(result).toEqual(validPolicy);
        expect(mockFs.readFile).toHaveBeenCalledWith('.kiro/settings/trust-policy.json', 'utf-8');
        expect(mockFs.readFile).toHaveBeenCalledWith('.kiro/lib/trust-policy/default-policy.json', 'utf-8');
      });

      it('デフォルトポリシーファイルも存在しない場合はハードコードされたデフォルトを使用', async () => {
        mockFs.readFile
          .mockRejectedValueOnce(new Error('ENOENT: no such file or directory'))
          .mockRejectedValueOnce(new Error('ENOENT: no such file or directory'));

        const result = await policyManager.loadPolicy();

        expect(result).toBeDefined();
        expect(result.version).toBeDefined();
        expect(result.autoApprove).toBeDefined();
        expect(result.manualApprove).toBeDefined();
        expect(result.security).toBeDefined();
      });

      it('デフォルト設定が要件に準拠している', async () => {
        mockFs.readFile
          .mockRejectedValueOnce(new Error('ENOENT: no such file or directory'))
          .mockRejectedValueOnce(new Error('ENOENT: no such file or directory'));

        const defaultPolicy = await policyManager.loadPolicy();

        // 要件2.1: Git通常操作の自動承認
        expect(defaultPolicy.autoApprove.gitOperations).toContain('status');
        expect(defaultPolicy.autoApprove.gitOperations).toContain('commit');
        expect(defaultPolicy.autoApprove.gitOperations).toContain('push');
        expect(defaultPolicy.autoApprove.gitOperations).toContain('pull');
        expect(defaultPolicy.autoApprove.gitOperations).toContain('merge');
        expect(defaultPolicy.autoApprove.gitOperations).toContain('log');

        // 要件2.2: ローカルファイル操作の自動承認
        expect(defaultPolicy.autoApprove.fileOperations).toContain('read');
        expect(defaultPolicy.autoApprove.fileOperations).toContain('write');
        expect(defaultPolicy.autoApprove.fileOperations).toContain('create');
        expect(defaultPolicy.autoApprove.fileOperations).toContain('update');

        // 要件2.3: Vercel CLI読み取り系操作の自動承認
        expect(defaultPolicy.autoApprove.cliOperations.vercel).toContain('env ls');
        expect(defaultPolicy.autoApprove.cliOperations.vercel).toContain('domains ls');
        expect(defaultPolicy.autoApprove.cliOperations.vercel).toContain('deployments ls');
        expect(defaultPolicy.autoApprove.cliOperations.vercel).toContain('status');

        // 要件2.4: スクリプト実行の自動承認
        expect(defaultPolicy.autoApprove.scriptExecution.extensions).toContain('.mjs');
        expect(defaultPolicy.autoApprove.scriptExecution.allowedPaths).toContain('scripts/');

        // 要件3.1: 削除系操作の手動承認
        expect(defaultPolicy.manualApprove.deleteOperations).toContain('git branch -D');
        expect(defaultPolicy.manualApprove.deleteOperations).toContain('rm');

        // 要件3.2: 強制系操作の手動承認
        expect(defaultPolicy.manualApprove.forceOperations).toContain('git reset --hard');
        expect(defaultPolicy.manualApprove.forceOperations).toContain('git push --force');

        // 要件3.3: 本番環境影響操作の手動承認
        expect(defaultPolicy.manualApprove.productionImpact).toContain('github:write');
        expect(defaultPolicy.manualApprove.productionImpact).toContain('sanity-dev:write');
      });
    });

    describe('ポリシー検証の詳細', () => {
      it('すべての必須フィールドの存在を検証する', () => {
        const requiredFields = [
          'version',
          'lastUpdated',
          'autoApprove',
          'manualApprove',
          'security'
        ];

        requiredFields.forEach(field => {
          const invalidPolicy = { ...validPolicy };
          delete (invalidPolicy as any)[field];

          const result = policyManager.validatePolicy(invalidPolicy);
          expect(result.isValid).toBe(false);
          expect(result.errors).toContain(`${field} is required`);
        });
      });

      it('autoApproveセクションの詳細検証', () => {
        const autoApproveFields = [
          'gitOperations',
          'fileOperations',
          'cliOperations',
          'scriptExecution'
        ];

        autoApproveFields.forEach(field => {
          const invalidPolicy = {
            ...validPolicy,
            autoApprove: {
              ...validPolicy.autoApprove,
              [field]: undefined
            }
          };

          const result = policyManager.validatePolicy(invalidPolicy);
          expect(result.isValid).toBe(false);
          expect(result.errors).toContain(`autoApprove.${field} is required`);
        });
      });

      it('manualApproveセクションの詳細検証', () => {
        const manualApproveFields = [
          'deleteOperations',
          'forceOperations',
          'productionImpact'
        ];

        manualApproveFields.forEach(field => {
          const invalidPolicy = {
            ...validPolicy,
            manualApprove: {
              ...validPolicy.manualApprove,
              [field]: undefined
            }
          };

          const result = policyManager.validatePolicy(invalidPolicy);
          expect(result.isValid).toBe(false);
          expect(result.errors).toContain(`manualApprove.${field} is required`);
        });
      });

      it('securityセクションの詳細検証', () => {
        const securityFields = [
          'maxAutoApprovalPerHour',
          'suspiciousPatternDetection',
          'logAllOperations'
        ];

        securityFields.forEach(field => {
          const invalidPolicy = {
            ...validPolicy,
            security: {
              ...validPolicy.security,
              [field]: undefined
            }
          };

          const result = policyManager.validatePolicy(invalidPolicy);
          expect(result.isValid).toBe(false);
          expect(result.errors).toContain(`security.${field} is required`);
        });
      });

      it('配列フィールドの型検証', () => {
        const arrayFields = [
          { path: 'autoApprove.gitOperations', value: 'not-an-array' },
          { path: 'autoApprove.fileOperations', value: 123 },
          { path: 'manualApprove.deleteOperations', value: {} },
          { path: 'manualApprove.forceOperations', value: null }
        ];

        arrayFields.forEach(({ path, value }) => {
          const pathParts = path.split('.');
          const invalidPolicy = JSON.parse(JSON.stringify(validPolicy));
          
          let current = invalidPolicy;
          for (let i = 0; i < pathParts.length - 1; i++) {
            current = current[pathParts[i]];
          }
          current[pathParts[pathParts.length - 1]] = value;

          const result = policyManager.validatePolicy(invalidPolicy);
          expect(result.isValid).toBe(false);
          expect(result.errors).toContain(`${path} must be an array`);
        });
      });

      it('数値フィールドの範囲検証', () => {
        const numericValidations = [
          { field: 'maxAutoApprovalPerHour', value: -1, shouldBeValid: false },
          { field: 'maxAutoApprovalPerHour', value: 0, shouldBeValid: true },
          { field: 'maxAutoApprovalPerHour', value: 1000, shouldBeValid: true },
          { field: 'maxAutoApprovalPerHour', value: 10000, shouldBeValid: true },
          { field: 'maxAutoApprovalPerHour', value: 100000, shouldBeValid: false }
        ];

        numericValidations.forEach(({ field, value, shouldBeValid }) => {
          const testPolicy = {
            ...validPolicy,
            security: {
              ...validPolicy.security,
              [field]: value
            }
          };

          const result = policyManager.validatePolicy(testPolicy);
          expect(result.isValid).toBe(shouldBeValid);
          
          if (!shouldBeValid) {
            expect(result.errors.length).toBeGreaterThan(0);
          }
        });
      });

      it('警告レベルの検証', () => {
        const warningCases = [
          {
            policy: {
              ...validPolicy,
              security: { ...validPolicy.security, maxAutoApprovalPerHour: 15000 }
            },
            expectedWarning: 'maxAutoApprovalPerHour is very high'
          },
          {
            policy: {
              ...validPolicy,
              autoApprove: {
                ...validPolicy.autoApprove,
                gitOperations: Array(100).fill('operation')
              }
            },
            expectedWarning: 'Too many auto-approve operations'
          }
        ];

        warningCases.forEach(({ policy, expectedWarning }) => {
          const result = policyManager.validatePolicy(policy);
          expect(result.isValid).toBe(true);
          expect(result.warnings.some(w => w.includes(expectedWarning))).toBe(true);
        });
      });
    });

    describe('ポリシー更新の詳細', () => {
      it('更新時にバックアップが作成される', async () => {
        mockFs.readFile.mockResolvedValueOnce(JSON.stringify(validPolicy));
        mockFs.writeFile.mockResolvedValueOnce(undefined);
        mockFs.mkdir.mockResolvedValueOnce(undefined);

        const updatedPolicy = { ...validPolicy, version: "1.1" };
        
        await policyManager.updatePolicy(updatedPolicy);

        expect(mockFs.mkdir).toHaveBeenCalledWith('.kiro/backups', { recursive: true });
        expect(mockFs.writeFile).toHaveBeenCalledWith(
          expect.stringMatching(/\.kiro\/backups\/trust-policy\.backup\.\d{4}-\d{2}-\d{2}\.json/),
          JSON.stringify(validPolicy, null, 2),
          'utf-8'
        );
      });

      it('更新時にlastUpdatedが現在時刻に設定される', async () => {
        mockFs.readFile.mockResolvedValueOnce(JSON.stringify(validPolicy));
        mockFs.writeFile.mockResolvedValueOnce(undefined);
        mockFs.mkdir.mockResolvedValueOnce(undefined);

        const beforeUpdate = new Date();
        await policyManager.updatePolicy(validPolicy);
        const afterUpdate = new Date();

        const writeCall = mockFs.writeFile.mock.calls.find(call => 
          call[0] === '.kiro/settings/trust-policy.json'
        );
        expect(writeCall).toBeDefined();

        const writtenContent = JSON.parse(writeCall![1] as string);
        const updatedTime = new Date(writtenContent.lastUpdated);

        expect(updatedTime.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
        expect(updatedTime.getTime()).toBeLessThanOrEqual(afterUpdate.getTime());
      });

      it('部分的な更新が正しく処理される', async () => {
        mockFs.readFile.mockResolvedValueOnce(JSON.stringify(validPolicy));
        mockFs.writeFile.mockResolvedValueOnce(undefined);
        mockFs.mkdir.mockResolvedValueOnce(undefined);

        const partialUpdate = {
          ...validPolicy,
          autoApprove: {
            ...validPolicy.autoApprove,
            gitOperations: [...validPolicy.autoApprove.gitOperations, 'rebase']
          }
        };

        await policyManager.updatePolicy(partialUpdate);

        const writeCall = mockFs.writeFile.mock.calls.find(call => 
          call[0] === '.kiro/settings/trust-policy.json'
        );
        const writtenContent = JSON.parse(writeCall![1] as string);

        expect(writtenContent.autoApprove.gitOperations).toContain('rebase');
        expect(writtenContent.manualApprove).toEqual(validPolicy.manualApprove);
        expect(writtenContent.security).toEqual(validPolicy.security);
      });

      it('無効な更新は拒否される', async () => {
        const invalidUpdate = {
          ...validPolicy,
          version: undefined as any
        };

        await expect(policyManager.updatePolicy(invalidUpdate)).rejects.toThrow(
          'Policy validation failed'
        );

        expect(mockFs.writeFile).not.toHaveBeenCalled();
      });
    });

    describe('キャッシュ機能の詳細', () => {
      it('キャッシュが正しく動作する', async () => {
        mockFs.readFile.mockResolvedValue(JSON.stringify(validPolicy));

        // 最初の読み込み
        await policyManager.loadPolicy();
        
        // 2回目の読み込み（キャッシュから）
        await policyManager.loadPolicy();

        // ファイル読み込みは1回だけ実行される
        expect(mockFs.readFile).toHaveBeenCalledTimes(1);
      });

      it('キャッシュクリア後は再度ファイルを読み込む', async () => {
        mockFs.readFile.mockResolvedValue(JSON.stringify(validPolicy));

        // 最初の読み込み
        await policyManager.loadPolicy();
        
        // キャッシュクリア
        policyManager.clearCache();
        
        // 再度読み込み
        await policyManager.loadPolicy();

        // ファイル読み込みが2回実行される
        expect(mockFs.readFile).toHaveBeenCalledTimes(2);
      });

      it('ポリシー更新後はキャッシュが自動的にクリアされる', async () => {
        mockFs.readFile.mockResolvedValue(JSON.stringify(validPolicy));
        mockFs.writeFile.mockResolvedValue(undefined);
        mockFs.mkdir.mockResolvedValue(undefined);

        // 最初の読み込み
        await policyManager.loadPolicy();
        
        // ポリシー更新
        await policyManager.updatePolicy(validPolicy);
        
        // 再度読み込み（キャッシュがクリアされているので再読み込み）
        await policyManager.loadPolicy();

        // 読み込みが2回実行される（初回 + 更新後）
        expect(mockFs.readFile).toHaveBeenCalledTimes(2);
      });
    });

    describe('エラーハンドリングの詳細', () => {
      it('ファイル読み込みエラーを適切に処理する', async () => {
        mockFs.readFile
          .mockRejectedValueOnce(new Error('Permission denied'))
          .mockRejectedValueOnce(new Error('Default file not found'));

        const result = await policyManager.loadPolicy();

        // ハードコードされたデフォルトポリシーが返される
        expect(result).toBeDefined();
        expect(result.version).toBeDefined();
      });

      it('ファイル書き込みエラーを適切に処理する', async () => {
        mockFs.readFile.mockResolvedValue(JSON.stringify(validPolicy));
        mockFs.writeFile.mockRejectedValue(new Error('Disk full'));
        mockFs.mkdir.mockResolvedValue(undefined);

        await expect(policyManager.updatePolicy(validPolicy)).rejects.toThrow('Disk full');
      });

      it('JSON解析エラーを適切に処理する', async () => {
        mockFs.readFile
          .mockResolvedValueOnce('invalid json content')
          .mockResolvedValueOnce(JSON.stringify(validPolicy));

        const result = await policyManager.loadPolicy();

        // デフォルトポリシーが返される
        expect(result).toEqual(validPolicy);
      });

      it('部分的に破損したJSONを適切に処理する', async () => {
        const partiallyCorruptedJson = JSON.stringify(validPolicy).slice(0, -10);
        
        mockFs.readFile
          .mockResolvedValueOnce(partiallyCorruptedJson)
          .mockResolvedValueOnce(JSON.stringify(validPolicy));

        const result = await policyManager.loadPolicy();

        // デフォルトポリシーが返される
        expect(result).toEqual(validPolicy);
      });
    });

    describe('パフォーマンステスト', () => {
      it('大きなポリシーファイルを効率的に処理する', async () => {
        const largePolicy = {
          ...validPolicy,
          autoApprove: {
            ...validPolicy.autoApprove,
            gitOperations: Array(1000).fill('operation'),
            fileOperations: Array(1000).fill('operation'),
            cliOperations: {
              vercel: Array(1000).fill('operation'),
              npm: Array(1000).fill('operation'),
              yarn: Array(1000).fill('operation')
            }
          }
        };

        mockFs.readFile.mockResolvedValue(JSON.stringify(largePolicy));

        const startTime = Date.now();
        const result = await policyManager.loadPolicy();
        const endTime = Date.now();

        expect(result).toBeDefined();
        expect(endTime - startTime).toBeLessThan(1000); // 1秒以内
      });

      it('複数の同時読み込み要求を効率的に処理する', async () => {
        mockFs.readFile.mockResolvedValue(JSON.stringify(validPolicy));

        const promises = Array(10).fill(null).map(() => policyManager.loadPolicy());
        
        const startTime = Date.now();
        const results = await Promise.all(promises);
        const endTime = Date.now();

        expect(results).toHaveLength(10);
        results.forEach(result => expect(result).toEqual(validPolicy));
        expect(endTime - startTime).toBeLessThan(1000); // 1秒以内
        
        // キャッシュにより、ファイル読み込みは1回だけ
        expect(mockFs.readFile).toHaveBeenCalledTimes(1);
      });
    });
  });
});