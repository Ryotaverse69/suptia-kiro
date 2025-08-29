import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock "server-only" module
vi.mock('server-only', () => ({}));

describe('Token Protection', () => {
  let originalWindow: any;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalWindow = global.window;
    originalEnv = { ...process.env };
    
    // Ensure we're in server environment
    delete (global as any).window;
  });

  afterEach(() => {
    global.window = originalWindow;
    process.env = originalEnv;
  });

  describe('getSanityTokenConfig', () => {
    it('トークンが設定されている場合の設定を返す', async () => {
      process.env.SANITY_API_TOKEN = 'test-token-123';
      
      const { getSanityTokenConfig } = await import('../token-protection');
      const config = getSanityTokenConfig();
      
      expect(config.hasToken).toBe(true);
      expect(config.canWrite).toBe(true);
      expect(config.token).toBe('test-token-123');
    });

    it('トークンが設定されていない場合の設定を返す', async () => {
      delete process.env.SANITY_API_TOKEN;
      
      const { getSanityTokenConfig } = await import('../token-protection');
      const config = getSanityTokenConfig();
      
      expect(config.hasToken).toBe(false);
      expect(config.canWrite).toBe(false);
      expect(config.token).toBeUndefined();
    });
  });

  describe('validateClientSideEnvironment', () => {
    it('サーバーサイドでは正常に動作する', async () => {
      const { validateClientSideEnvironment } = await import('../token-protection');
      
      expect(() => validateClientSideEnvironment()).not.toThrow();
    });

    it('クライアントサイドではエラーを投げる', async () => {
      // Simulate client-side environment
      (global as any).window = {};
      
      const { validateClientSideEnvironment } = await import('../token-protection');
      
      expect(() => validateClientSideEnvironment()).toThrow(
        'Token protection utilities cannot be used client-side'
      );
    });
  });

  describe('createSafeClientConfig', () => {
    it('安全なクライアント設定を作成する', async () => {
      process.env.NEXT_PUBLIC_SANITY_PROJECT_ID = 'test-project';
      process.env.NEXT_PUBLIC_SANITY_DATASET = 'production';
      
      const { createSafeClientConfig } = await import('../token-protection');
      const config = createSafeClientConfig();
      
      expect(config.projectId).toBe('test-project');
      expect(config.dataset).toBe('production');
      expect(config.useCdn).toBe(true);
      expect(config.perspective).toBe('published');
      expect(config).not.toHaveProperty('token');
    });

    it('クライアントサイドでは使用できない', async () => {
      (global as any).window = {};
      
      const { createSafeClientConfig } = await import('../token-protection');
      
      expect(() => createSafeClientConfig()).toThrow();
    });
  });

  describe('createServerClientConfig', () => {
    it('トークン付きサーバー設定を作成する', async () => {
      process.env.NEXT_PUBLIC_SANITY_PROJECT_ID = 'test-project';
      process.env.NEXT_PUBLIC_SANITY_DATASET = 'production';
      process.env.SANITY_API_TOKEN = 'server-token-123';
      
      const { createServerClientConfig } = await import('../token-protection');
      const config = createServerClientConfig();
      
      expect(config.projectId).toBe('test-project');
      expect(config.dataset).toBe('production');
      expect(config.useCdn).toBe(false);
      expect(config.token).toBe('server-token-123');
      expect(config.perspective).toBe('previewDrafts');
    });

    it('トークンなしサーバー設定を作成する', async () => {
      process.env.NEXT_PUBLIC_SANITY_PROJECT_ID = 'test-project';
      process.env.NEXT_PUBLIC_SANITY_DATASET = 'production';
      delete process.env.SANITY_API_TOKEN;
      
      const { createServerClientConfig } = await import('../token-protection');
      const config = createServerClientConfig();
      
      expect(config.projectId).toBe('test-project');
      expect(config.dataset).toBe('production');
      expect(config.useCdn).toBe(false);
      expect(config.token).toBeUndefined();
      expect(config.perspective).toBe('published');
    });
  });

  describe('auditClientSideExposure', () => {
    it('サーバーサイドで監査を実行する', async () => {
      const { auditClientSideExposure } = await import('../token-protection');
      const result = auditClientSideExposure();
      
      expect(result.safe).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('クライアントサイドでは監査を拒否する', async () => {
      (global as any).window = {};
      
      const { auditClientSideExposure } = await import('../token-protection');
      const result = auditClientSideExposure();
      
      expect(result.safe).toBe(false);
      expect(result.issues).toContain('Token protection audit cannot run client-side');
    });
  });

  describe('Security Validation', () => {
    it('機密環境変数の露出を検出する', async () => {
      // This test simulates what would happen if tokens were accidentally exposed
      const mockWindow = {
        SANITY_API_TOKEN: 'exposed-token',
      };
      (global as any).window = mockWindow;
      
      const { validateClientSideEnvironment } = await import('../token-protection');
      
      // The function should detect this as a security issue
      expect(() => validateClientSideEnvironment()).toThrow();
    });

    it('公開環境変数は許可する', async () => {
      process.env.NEXT_PUBLIC_SANITY_PROJECT_ID = 'public-project-id';
      process.env.NEXT_PUBLIC_SANITY_DATASET = 'production';
      
      const { createSafeClientConfig } = await import('../token-protection');
      
      expect(() => createSafeClientConfig()).not.toThrow();
    });
  });

  describe('Type Safety', () => {
    it('SanityTokenConfigの型が正しい', async () => {
      process.env.SANITY_API_TOKEN = 'test-token';
      
      const { getSanityTokenConfig } = await import('../token-protection');
      const config = getSanityTokenConfig();
      
      // TypeScript should enforce these properties
      expect(typeof config.hasToken).toBe('boolean');
      expect(typeof config.canWrite).toBe('boolean');
      expect(typeof config.token === 'string' || config.token === undefined).toBe(true);
    });
  });

  describe('Integration with Existing Clients', () => {
    it('既存のsanityPublicクライアントと互換性がある', async () => {
      process.env.NEXT_PUBLIC_SANITY_PROJECT_ID = 'test-project';
      process.env.NEXT_PUBLIC_SANITY_DATASET = 'production';
      
      const { createSafeClientConfig } = await import('../token-protection');
      const config = createSafeClientConfig();
      
      // Should match the structure expected by Sanity client
      expect(config).toHaveProperty('projectId');
      expect(config).toHaveProperty('dataset');
      expect(config).toHaveProperty('apiVersion');
      expect(config).toHaveProperty('useCdn');
      expect(config).toHaveProperty('perspective');
    });

    it('既存のsanityServerクライアントと互換性がある', async () => {
      process.env.NEXT_PUBLIC_SANITY_PROJECT_ID = 'test-project';
      process.env.NEXT_PUBLIC_SANITY_DATASET = 'production';
      process.env.SANITY_API_TOKEN = 'server-token';
      
      const { createServerClientConfig } = await import('../token-protection');
      const config = createServerClientConfig();
      
      // Should match the structure expected by Sanity client
      expect(config).toHaveProperty('projectId');
      expect(config).toHaveProperty('dataset');
      expect(config).toHaveProperty('apiVersion');
      expect(config).toHaveProperty('useCdn');
      expect(config).toHaveProperty('token');
      expect(config).toHaveProperty('perspective');
    });
  });
});