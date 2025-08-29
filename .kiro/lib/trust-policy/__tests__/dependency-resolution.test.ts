/**
 * 依存関係解決機能のテスト
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestFrameworkManager } from '../test-framework-manager';

// テスト用のモック
vi.mock('fs', () => ({
  promises: {
    access: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
    mkdir: vi.fn(),
    readdir: vi.fn(),
    rm: vi.fn()
  }
}));

vi.mock('child_process', () => ({
  spawn: vi.fn()
}));

describe('TestFrameworkManager - 依存関係解決機能', () => {
  let manager: TestFrameworkManager;

  beforeEach(() => {
    manager = new TestFrameworkManager();
    vi.clearAllMocks();
  });

  describe('基本機能', () => {
    it('TestFrameworkManagerが正常に初期化される', async () => {
      const { promises: fs } = await import('fs');
      const mockFs = fs as any;

      // package.jsonのモック
      const mockPackageJson = {
        dependencies: {},
        devDependencies: {
          'jest': '^29.0.0'
        }
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(mockPackageJson));
      mockFs.access.mockResolvedValue(undefined);
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.readdir.mockResolvedValue([]);

      await expect(manager.initialize()).resolves.not.toThrow();
      expect(manager.isInitialized()).toBe(true);
    });

    it('依存関係情報を取得できる', async () => {
      const { promises: fs } = await import('fs');
      const mockFs = fs as any;

      const mockPackageJson = {
        dependencies: {},
        devDependencies: {}
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(mockPackageJson));
      mockFs.access.mockResolvedValue(undefined);
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.readdir.mockResolvedValue([]);

      await manager.initialize();

      const dependencies = manager.getDependencies();
      expect(dependencies).toBeDefined();
      expect(Array.isArray(dependencies)).toBe(true);
      expect(dependencies.length).toBeGreaterThan(0);
    });

    it('依存関係解決を実行できる', async () => {
      const { promises: fs } = await import('fs');
      const mockFs = fs as any;
      const { spawn } = await import('child_process');
      const mockSpawn = spawn as any;

      // npm installの成功をモック
      const mockChildProcess = {
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 10); // 成功コード
          }
        })
      };
      mockSpawn.mockReturnValue(mockChildProcess);

      const mockPackageJson = {
        dependencies: {},
        devDependencies: {}
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(mockPackageJson));
      mockFs.access.mockResolvedValue(undefined);
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.readdir.mockResolvedValue([]);

      await manager.initialize();
      const result = await manager.resolveDependencies();

      expect(result).toBeDefined();
      expect(result).toHaveProperty('resolved');
      expect(result).toHaveProperty('conflicts');
      expect(result).toHaveProperty('installed');
      expect(result).toHaveProperty('updated');
      expect(result).toHaveProperty('failed');
      expect(result).toHaveProperty('recommendations');
    });
  });

  describe('エラーハンドリング', () => {
    it('package.jsonが存在しない場合でもエラーにならない', async () => {
      const { promises: fs } = await import('fs');
      const mockFs = fs as any;

      mockFs.readFile.mockRejectedValue(new Error('File not found'));
      mockFs.access.mockResolvedValue(undefined);
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.readdir.mockResolvedValue([]);

      await expect(manager.initialize()).resolves.not.toThrow();

      const dependencies = manager.getDependencies();
      expect(dependencies.length).toBeGreaterThan(0);
      
      // エラーが記録されていることを確認
      dependencies.forEach(dep => {
        expect(dep.issues.length).toBeGreaterThan(0);
      });
    });

    it('依存関係解決でエラーが発生しても適切にハンドリングされる', async () => {
      const { promises: fs } = await import('fs');
      const mockFs = fs as any;
      const { spawn } = await import('child_process');
      const mockSpawn = spawn as any;

      // npm installの失敗をモック
      const mockChildProcess = {
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(1), 10); // 失敗コード
          }
        })
      };
      mockSpawn.mockReturnValue(mockChildProcess);

      const mockPackageJson = {
        dependencies: {},
        devDependencies: {}
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(mockPackageJson));
      mockFs.access.mockResolvedValue(undefined);
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.readdir.mockResolvedValue([]);

      await manager.initialize();
      const result = await manager.resolveDependencies();

      expect(result.failed.length).toBeGreaterThan(0);
      expect(result.recommendations).toContain(
        expect.stringContaining('失敗したパッケージの手動インストールを検討してください')
      );
    });
  });

  describe('設定とメタデータ', () => {
    it('テスト環境設定を取得できる', async () => {
      const { promises: fs } = await import('fs');
      const mockFs = fs as any;

      mockFs.readFile.mockResolvedValue(JSON.stringify({}));
      mockFs.access.mockResolvedValue(undefined);
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.readdir.mockResolvedValue([]);

      await manager.initialize();

      const config = manager.getTestEnvironmentConfig();
      expect(config).toBeDefined();
      expect(config).toHaveProperty('nodeVersion');
      expect(config).toHaveProperty('testRunner');
      expect(config).toHaveProperty('timeout');
      expect(config).toHaveProperty('maxConcurrency');
    });

    it('不足メソッド情報を取得できる', async () => {
      const { promises: fs } = await import('fs');
      const mockFs = fs as any;

      mockFs.readFile.mockResolvedValue(JSON.stringify({}));
      mockFs.access.mockResolvedValue(undefined);
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.readdir.mockResolvedValue([]);

      await manager.initialize();

      const missingMethods = manager.getMissingMethods();
      expect(Array.isArray(missingMethods)).toBe(true);
    });
  });
});