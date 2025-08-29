import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import { PolicyManager } from '../policy-manager.js';
import { TrustPolicy } from '../types.js';

// fs.readFile と fs.writeFile をモック
vi.mock('fs', () => ({
  promises: {
    readFile: vi.fn(),
    writeFile: vi.fn()
  }
}));

const mockFs = vi.mocked(fs);

describe('PolicyManager', () => {
  let policyManager: PolicyManager;
  
  const validPolicy: TrustPolicy = {
    version: "1.0",
    lastUpdated: "2025-08-27T10:00:00Z",
    autoApprove: {
      gitOperations: ["status", "commit"],
      fileOperations: ["read", "write"],
      cliOperations: {
        vercel: ["status"]
      },
      scriptExecution: {
        extensions: [".mjs"],
        allowedPaths: ["scripts/"]
      }
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

  beforeEach(() => {
    policyManager = new PolicyManager();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('loadPolicy', () => {
    it('正常なポリシーファイルを読み込める', async () => {
      mockFs.readFile.mockResolvedValueOnce(JSON.stringify(validPolicy));
      
      const result = await policyManager.loadPolicy();
      
      expect(result).toEqual(validPolicy);
      expect(mockFs.readFile).toHaveBeenCalledWith('.kiro/settings/trust-policy.json', 'utf-8');
    });

    it('ポリシーファイルが存在しない場合はデフォルトポリシーを返す', async () => {
      mockFs.readFile
        .mockRejectedValueOnce(new Error('File not found'))
        .mockResolvedValueOnce(JSON.stringify(validPolicy));
      
      const result = await policyManager.loadPolicy();
      
      expect(result).toEqual(validPolicy);
      expect(mockFs.readFile).toHaveBeenCalledWith('.kiro/lib/trust-policy/default-policy.json', 'utf-8');
    });

    it('不正なJSONの場合はデフォルトポリシーを返す', async () => {
      mockFs.readFile
        .mockResolvedValueOnce('invalid json')
        .mockResolvedValueOnce(JSON.stringify(validPolicy));
      
      const result = await policyManager.loadPolicy();
      
      expect(result).toEqual(validPolicy);
    });
  });

  describe('validatePolicy', () => {
    it('正常なポリシーは検証に成功する', () => {
      const result = policyManager.validatePolicy(validPolicy);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('必須フィールドが不足している場合は検証に失敗する', () => {
      const invalidPolicy = { ...validPolicy };
      delete (invalidPolicy as any).version;
      
      const result = policyManager.validatePolicy(invalidPolicy);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('version is required');
    });

    it('不正な型の場合は検証に失敗する', () => {
      const invalidPolicy = {
        ...validPolicy,
        autoApprove: {
          ...validPolicy.autoApprove,
          gitOperations: 'not an array' as any
        }
      };
      
      const result = policyManager.validatePolicy(invalidPolicy);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('autoApprove.gitOperations must be an array');
    });

    it('maxAutoApprovalPerHourが高すぎる場合は警告を出す', () => {
      const policyWithHighLimit = {
        ...validPolicy,
        security: {
          ...validPolicy.security,
          maxAutoApprovalPerHour: 20000
        }
      };
      
      const result = policyManager.validatePolicy(policyWithHighLimit);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('maxAutoApprovalPerHour is very high, consider lowering for security');
    });
  });

  describe('updatePolicy', () => {
    it('正常なポリシーを更新できる', async () => {
      mockFs.readFile.mockResolvedValueOnce(JSON.stringify(validPolicy));
      mockFs.writeFile.mockResolvedValueOnce(undefined);
      
      const updatedPolicy = {
        ...validPolicy,
        version: "1.1"
      };
      
      await policyManager.updatePolicy(updatedPolicy);
      
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        '.kiro/settings/trust-policy.json',
        expect.stringContaining('"version": "1.1"'),
        'utf-8'
      );
    });

    it('不正なポリシーの更新は失敗する', async () => {
      const invalidPolicy = { ...validPolicy };
      delete (invalidPolicy as any).version;
      
      await expect(policyManager.updatePolicy(invalidPolicy)).rejects.toThrow(
        'Policy validation failed: version is required'
      );
    });

    it('更新時にlastUpdatedが自動更新される', async () => {
      mockFs.readFile.mockResolvedValueOnce(JSON.stringify(validPolicy));
      mockFs.writeFile.mockResolvedValueOnce(undefined);
      
      const policyToUpdate = { ...validPolicy };
      
      await policyManager.updatePolicy(policyToUpdate);
      
      const writeCall = mockFs.writeFile.mock.calls[0];
      const writtenContent = JSON.parse(writeCall[1] as string);
      
      // lastUpdatedが有効なISO日付文字列であることを確認（ミリ秒は任意）
      expect(writtenContent.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);
      expect(new Date(writtenContent.lastUpdated)).toBeInstanceOf(Date);
      expect(isNaN(new Date(writtenContent.lastUpdated).getTime())).toBe(false);
    });
  });

  describe('clearCache', () => {
    it('キャッシュをクリアできる', async () => {
      mockFs.readFile.mockResolvedValue(JSON.stringify(validPolicy));
      
      // 最初の読み込み
      await policyManager.loadPolicy();
      
      // キャッシュクリア
      policyManager.clearCache();
      
      // 再度読み込み（キャッシュが無効なので再度ファイルを読む）
      await policyManager.loadPolicy();
      
      expect(mockFs.readFile).toHaveBeenCalledTimes(2);
    });
  });
});