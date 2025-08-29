/**
 * TestFrameworkManagerのテスト
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { promises as fs } from 'fs';
import { join } from 'path';
import { TestFrameworkManager, TestType, MissingMethod, DependencyInfo } from '../test-framework-manager';

describe('TestFrameworkManager', () => {
  let manager: TestFrameworkManager;
  let testDir: string;

  beforeEach(async () => {
    testDir = join(process.cwd(), '.kiro-test-framework-manager');
    await fs.mkdir(testDir, { recursive: true });
    
    // テスト用のディレクトリ構造を作成
    await fs.mkdir(join(testDir, 'lib', 'trust-policy', '__tests__'), { recursive: true });
    await fs.mkdir(join(testDir, 'reports', 'test-results'), { recursive: true });
    
    manager = new TestFrameworkManager();
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // クリーンアップエラーは無視
    }
  });

  describe('初期化', () => {
    it('正常に初期化できる', async () => {
      await expect(manager.initialize()).resolves.not.toThrow();
      expect(manager.isInitialized()).toBe(true);
    });

    it('初期化後に必要なディレクトリが作成される', async () => {
      await manager.initialize();

      const expectedDirs = [
        '.kiro/lib/trust-policy/__tests__/fixtures',
        '.kiro/lib/trust-policy/__tests__/mocks',
        '.kiro/lib/trust-policy/__tests__/utils',
        '.kiro/reports/test-results',
        '.kiro/reports/coverage',
        '.kiro/temp/test-data'
      ];

      for (const dir of expectedDirs) {
        const exists = await fs.access(dir).then(() => true).catch(() => false);
        expect(exists).toBe(true);
      }
    });
  });

  describe('テスト環境の初期化', () => {
    it('テスト環境を正常に初期化できる', async () => {
      await manager.initialize();
      await expect(manager.initializeTestEnvironment()).resolves.not.toThrow();
    });

    it('テスト設定ファイルが作成される', async () => {
      await manager.initialize();
      await manager.initializeTestEnvironment();

      // jest.config.jsの存在確認
      const jestConfigExists = await fs.access('jest.config.js').then(() => true).catch(() => false);
      expect(jestConfigExists).toBe(true);

      // テストセットアップファイルの存在確認
      const setupFileExists = await fs.access('.kiro/lib/trust-policy/__tests__/setup.ts').then(() => true).catch(() => false);
      expect(setupFileExists).toBe(true);
    });

    it('テストデータが準備される', async () => {
      await manager.initialize();
      await manager.initializeTestEnvironment();

      const fixturesDir = '.kiro/lib/trust-policy/__tests__/fixtures';
      const files = await fs.readdir(fixturesDir);
      
      expect(files).toContain('sample-policy.json');
      expect(files).toContain('sample-operation.json');
    });
  });

  describe('不足メソッドの検出', () => {
    it('不足メソッドを正しく検出する', async () => {
      // テスト用のコンポーネントファイルを作成
      const testComponentPath = '.kiro/lib/trust-policy/test-component.ts';
      const testComponentContent = `
export class TestComponent {
  constructor() {}
  
  // initializeメソッドが不足している
  someMethod() {
    return 'test';
  }
}`;

      await fs.writeFile(testComponentPath, testComponentContent);

      await manager.initialize();
      const missingMethods = manager.getMissingMethods();

      // AuditLogger, MetricsCollector, ErrorHandlerの不足メソッドが検出されることを確認
      expect(missingMethods.length).toBeGreaterThan(0);
      
      const criticalMethods = missingMethods.filter(method => method.severity === 'critical');
      expect(criticalMethods.length).toBeGreaterThan(0);

      // クリーンアップ
      await fs.unlink(testComponentPath).catch(() => {});
    });

    it('不足メソッドの詳細情報が正しく設定される', async () => {
      await manager.initialize();
      const missingMethods = manager.getMissingMethods();

      if (missingMethods.length > 0) {
        const method = missingMethods[0];
        expect(method.className).toBeDefined();
        expect(method.methodName).toBeDefined();
        expect(method.expectedSignature).toBeDefined();
        expect(method.filePath).toBeDefined();
        expect(method.severity).toMatch(/^(critical|high|medium|low)$/);
        expect(typeof method.autoFixable).toBe('boolean');
      }
    });
  });

  describe('不足メソッドの自動追加', () => {
    it('自動修正可能なメソッドを追加できる', async () => {
      // テスト用のクラスファイルを作成
      const testFilePath = join(testDir, 'test-class.ts');
      const originalContent = `
export class TestClass {
  constructor() {}
  
  existingMethod() {
    return 'existing';
  }
}`;

      await fs.writeFile(testFilePath, originalContent);

      // 不足メソッドを手動で追加
      const missingMethod: MissingMethod = {
        className: 'TestClass',
        methodName: 'initialize',
        expectedSignature: '(): Promise<void>',
        filePath: testFilePath,
        severity: 'critical',
        autoFixable: true
      };

      (manager as any).detectedMissingMethods = [missingMethod];

      await manager.addMissingMethods();

      // ファイルが更新されたことを確認
      const updatedContent = await fs.readFile(testFilePath, 'utf-8');
      expect(updatedContent).toContain('initialize');
      expect(updatedContent).toContain('async initialize()');
    });

    it('自動修正不可能なメソッドはスキップされる', async () => {
      const testFilePath = join(testDir, 'test-class.ts');
      const originalContent = `
export class TestClass {
  constructor() {}
}`;

      await fs.writeFile(testFilePath, originalContent);

      const missingMethod: MissingMethod = {
        className: 'TestClass',
        methodName: 'complexMethod',
        expectedSignature: '(param: ComplexType): ComplexReturn',
        filePath: testFilePath,
        severity: 'low',
        autoFixable: false
      };

      (manager as any).detectedMissingMethods = [missingMethod];

      await manager.addMissingMethods();

      // ファイルが変更されていないことを確認
      const updatedContent = await fs.readFile(testFilePath, 'utf-8');
      expect(updatedContent).not.toContain('complexMethod');
    });
  });

  describe('依存関係の解決', () => {
    it('依存関係の状況を正しく確認する', async () => {
      await manager.initialize();
      const dependencies = manager.getDependencies();

      expect(Array.isArray(dependencies)).toBe(true);
      
      if (dependencies.length > 0) {
        const dep = dependencies[0];
        expect(dep.name).toBeDefined();
        expect(dep.version).toBeDefined();
        expect(typeof dep.required).toBe('boolean');
        expect(typeof dep.installed).toBe('boolean');
        expect(typeof dep.compatible).toBe('boolean');
        expect(Array.isArray(dep.issues)).toBe(true);
      }
    });

    it('依存関係の解決処理が正常に実行される', async () => {
      await manager.initialize();
      
      // 依存関係解決は実際のnpmコマンドを実行するため、
      // テスト環境では実行をスキップまたはモック化
      await expect(manager.resolveDependencies()).resolves.not.toThrow();
    });
  });

  describe('テストの実行', () => {
    it('ユニットテストを実行できる', async () => {
      await manager.initialize();
      
      // テスト用のテストファイルを作成
      const testFilePath = '.kiro/lib/trust-policy/__tests__/sample.test.ts';
      const testContent = `
describe('Sample Test', () => {
  it('should pass', () => {
    expect(true).toBe(true);
  });
});`;

      await fs.writeFile(testFilePath, testContent);

      const result = await manager.runTests(TestType.UNIT);

      expect(result.testType).toBe(TestType.UNIT);
      expect(result.status).toMatch(/^(pass|fail|skip)$/);
      expect(typeof result.totalTests).toBe('number');
      expect(typeof result.passedTests).toBe('number');
      expect(typeof result.failedTests).toBe('number');
      expect(typeof result.duration).toBe('number');
      expect(result.startTime).toBeInstanceOf(Date);
      expect(result.endTime).toBeInstanceOf(Date);
      expect(Array.isArray(result.errors)).toBe(true);

      // クリーンアップ
      await fs.unlink(testFilePath).catch(() => {});
    });

    it('統合テストを実行できる', async () => {
      await manager.initialize();
      
      const result = await manager.runTests(TestType.INTEGRATION);
      expect(result.testType).toBe(TestType.INTEGRATION);
    });

    it('受け入れテストを実行できる', async () => {
      await manager.initialize();
      
      const result = await manager.runTests(TestType.ACCEPTANCE);
      expect(result.testType).toBe(TestType.ACCEPTANCE);
    });

    it('パフォーマンステストを実行できる', async () => {
      await manager.initialize();
      
      const result = await manager.runTests(TestType.PERFORMANCE);
      expect(result.testType).toBe(TestType.PERFORMANCE);
    });

    it('テスト実行オプションを指定できる', async () => {
      await manager.initialize();
      
      const options = {
        pattern: 'sample',
        timeout: 10000,
        maxConcurrency: 2,
        coverage: true
      };

      const result = await manager.runTests(TestType.UNIT, options);
      expect(result.testType).toBe(TestType.UNIT);
    });

    it('テストファイルが見つからない場合はスキップされる', async () => {
      await manager.initialize();
      
      const result = await manager.runTests(TestType.UNIT, { pattern: 'nonexistent' });
      expect(result.status).toBe('skip');
      expect(result.totalTests).toBe(0);
    });
  });

  describe('テスト環境設定', () => {
    it('デフォルトのテスト環境設定を取得できる', () => {
      const config = manager.getTestEnvironmentConfig();

      expect(config.nodeVersion).toBeDefined();
      expect(config.testRunner).toMatch(/^(jest|vitest|mocha)$/);
      expect(typeof config.timeout).toBe('number');
      expect(typeof config.maxConcurrency).toBe('number');
      expect(Array.isArray(config.setupFiles)).toBe(true);
      expect(Array.isArray(config.teardownFiles)).toBe(true);
      expect(typeof config.environmentVariables).toBe('object');
    });

    it('テスト環境変数が正しく設定される', async () => {
      await manager.initialize();
      await manager.initializeTestEnvironment();

      expect(process.env.NODE_ENV).toBe('test');
      expect(process.env.TZ).toBe('UTC');
      expect(process.env.KIRO_TEST_MODE).toBe('true');
      expect(process.env.KIRO_LOG_LEVEL).toBe('error');
    });
  });

  describe('エラーハンドリング', () => {
    it('初期化エラーを適切に処理する', async () => {
      // 権限のないディレクトリへの書き込みを試行してエラーを発生させる
      const originalMkdir = fs.mkdir;
      (fs as any).mkdir = jest.fn().mockRejectedValue(new Error('Permission denied'));

      await expect(manager.initialize()).rejects.toThrow();

      // 元の関数を復元
      (fs as any).mkdir = originalMkdir;
    });

    it('テスト実行エラーを適切に処理する', async () => {
      await manager.initialize();

      // 存在しないテストファイルでテストを実行
      const result = await manager.runTests(TestType.UNIT, { pattern: 'nonexistent-error-test' });
      
      expect(result.status).toBe('skip');
      expect(result.totalTests).toBe(0);
    });

    it('依存関係解決エラーを適切に処理する', async () => {
      await manager.initialize();

      // 依存関係解決は外部コマンドに依存するため、
      // エラーが発生してもプロセスが停止しないことを確認
      await expect(manager.resolveDependencies()).resolves.not.toThrow();
    });
  });

  describe('統合テスト', () => {
    it('完全なワークフローが正常に動作する', async () => {
      // 1. 初期化
      await manager.initialize();
      expect(manager.isInitialized()).toBe(true);

      // 2. テスト環境の初期化
      await manager.initializeTestEnvironment();

      // 3. 不足メソッドの検出と追加
      const missingMethods = manager.getMissingMethods();
      expect(Array.isArray(missingMethods)).toBe(true);

      if (missingMethods.some(method => method.autoFixable)) {
        await manager.addMissingMethods();
      }

      // 4. 依存関係の確認
      const dependencies = manager.getDependencies();
      expect(Array.isArray(dependencies)).toBe(true);

      // 5. テストの実行
      const testResult = await manager.runTests(TestType.UNIT);
      expect(testResult).toBeDefined();
      expect(testResult.testType).toBe(TestType.UNIT);

      console.log('✅ TestFrameworkManager統合テストが完了しました');
    });
  });
});