#!/usr/bin/env node

/**
 * TestFrameworkManagerの検証スクリプト
 * 
 * TestFrameworkManagerが正しく実装され、動作することを検証します。
 */

import { TestFrameworkManager, TestType } from './test-framework-manager.ts';
import { promises as fs } from 'fs';

class TestFrameworkManagerVerifier {
  constructor() {
    this.manager = null;
    this.testResults = [];
  }

  async initialize() {
    console.log('🔧 TestFrameworkManager検証を初期化中...');
    this.manager = new TestFrameworkManager();
    await this.manager.initialize();
    console.log('✅ 初期化完了\n');
  }

  async runVerification() {
    console.log('🧪 TestFrameworkManagerの検証を開始します...\n');

    const tests = [
      { name: '初期化機能', test: () => this.testInitialization() },
      { name: 'テスト環境設定', test: () => this.testEnvironmentConfig() },
      { name: '不足メソッド検出', test: () => this.testMissingMethodDetection() },
      { name: 'メソッド自動追加', test: () => this.testMethodAutoAddition() },
      { name: '依存関係確認', test: () => this.testDependencyCheck() },
      { name: 'テスト環境初期化', test: () => this.testEnvironmentInitialization() },
      { name: 'テストファイル検索', test: () => this.testTestFileDiscovery() },
      { name: 'テスト実行', test: () => this.testTestExecution() },
      { name: 'エラーハンドリング', test: () => this.testErrorHandling() },
      { name: '統合機能', test: () => this.testIntegrationFeatures() }
    ];

    for (const { name, test } of tests) {
      try {
        console.log(`🔍 ${name}をテスト中...`);
        const result = await test();
        this.testResults.push({ name, success: result.success, details: result.details });
        
        if (result.success) {
          console.log(`✅ ${name}: 成功`);
          if (result.details) {
            console.log(`   └─ ${result.details}`);
          }
        } else {
          console.log(`❌ ${name}: 失敗`);
          if (result.details) {
            console.log(`   └─ ${result.details}`);
          }
        }
      } catch (error) {
        console.log(`❌ ${name}: エラー - ${error.message}`);
        this.testResults.push({ name, success: false, details: error.message });
      }
      console.log('');
    }

    this.printSummary();
  }

  async testInitialization() {
    // 初期化状態の確認
    if (!this.manager.isInitialized()) {
      return { success: false, details: 'マネージャーが初期化されていない' };
    }

    // 必要なディレクトリが作成されているか確認
    const requiredDirs = [
      '.kiro/lib/trust-policy/__tests__/fixtures',
      '.kiro/lib/trust-policy/__tests__/mocks',
      '.kiro/reports/test-results',
      '.kiro/temp/test-data'
    ];

    for (const dir of requiredDirs) {
      const exists = await fs.access(dir).then(() => true).catch(() => false);
      if (!exists) {
        return { success: false, details: `必要なディレクトリが作成されていない: ${dir}` };
      }
    }

    return { success: true, details: '初期化とディレクトリ作成が正常に完了' };
  }

  async testEnvironmentConfig() {
    const config = this.manager.getTestEnvironmentConfig();

    // 必須フィールドの確認
    const requiredFields = ['nodeVersion', 'testRunner', 'timeout', 'maxConcurrency', 'environmentVariables'];
    for (const field of requiredFields) {
      if (config[field] === undefined) {
        return { success: false, details: `設定に必須フィールドが不足: ${field}` };
      }
    }

    // 値の妥当性確認
    if (typeof config.timeout !== 'number' || config.timeout <= 0) {
      return { success: false, details: 'タイムアウト値が不正' };
    }

    if (typeof config.maxConcurrency !== 'number' || config.maxConcurrency <= 0) {
      return { success: false, details: '最大並行数が不正' };
    }

    if (!['jest', 'vitest', 'mocha'].includes(config.testRunner)) {
      return { success: false, details: 'サポートされていないテストランナー' };
    }

    return { success: true, details: `設定が正常 (${config.testRunner}, ${config.timeout}ms, 並行数${config.maxConcurrency})` };
  }

  async testMissingMethodDetection() {
    const missingMethods = this.manager.getMissingMethods();

    if (!Array.isArray(missingMethods)) {
      return { success: false, details: '不足メソッドが配列として返されない' };
    }

    // 不足メソッドの構造確認
    if (missingMethods.length > 0) {
      const method = missingMethods[0];
      const requiredFields = ['className', 'methodName', 'expectedSignature', 'filePath', 'severity', 'autoFixable'];
      
      for (const field of requiredFields) {
        if (method[field] === undefined) {
          return { success: false, details: `不足メソッド情報に必須フィールドが不足: ${field}` };
        }
      }

      // 重要度の妥当性確認
      if (!['critical', 'high', 'medium', 'low'].includes(method.severity)) {
        return { success: false, details: '不正な重要度レベル' };
      }
    }

    return { success: true, details: `${missingMethods.length}個の不足メソッドを検出` };
  }

  async testMethodAutoAddition() {
    // テスト用のクラスファイルを作成
    const testFilePath = '.kiro/temp/test-class-for-verification.ts';
    const originalContent = `
export class TestClassForVerification {
  constructor() {}
  
  existingMethod() {
    return 'existing';
  }
}`;

    try {
      await fs.writeFile(testFilePath, originalContent);

      // 不足メソッドを手動で設定
      const missingMethod = {
        className: 'TestClassForVerification',
        methodName: 'testInitialize',
        expectedSignature: '(): Promise<void>',
        filePath: testFilePath,
        severity: 'critical',
        autoFixable: true
      };

      // 元の不足メソッドリストを保存
      const originalMissingMethods = this.manager.getMissingMethods();
      
      // テスト用の不足メソッドを追加
      (this.manager as any).detectedMissingMethods = [missingMethod];

      // メソッド追加を実行
      await this.manager.addMissingMethods();

      // ファイルが更新されたことを確認
      const updatedContent = await fs.readFile(testFilePath, 'utf-8');
      
      if (!updatedContent.includes('testInitialize')) {
        return { success: false, details: 'メソッドが追加されていない' };
      }

      if (!updatedContent.includes('async testInitialize()')) {
        return { success: false, details: 'メソッドの署名が正しくない' };
      }

      // 元の不足メソッドリストを復元
      (this.manager as any).detectedMissingMethods = originalMissingMethods;

      return { success: true, details: 'メソッドの自動追加が正常に動作' };

    } finally {
      // テストファイルをクリーンアップ
      await fs.unlink(testFilePath).catch(() => {});
    }
  }

  async testDependencyCheck() {
    const dependencies = this.manager.getDependencies();

    if (!Array.isArray(dependencies)) {
      return { success: false, details: '依存関係が配列として返されない' };
    }

    // 依存関係情報の構造確認
    if (dependencies.length > 0) {
      const dep = dependencies[0];
      const requiredFields = ['name', 'version', 'required', 'installed', 'compatible', 'issues'];
      
      for (const field of requiredFields) {
        if (dep[field] === undefined) {
          return { success: false, details: `依存関係情報に必須フィールドが不足: ${field}` };
        }
      }

      if (typeof dep.required !== 'boolean') {
        return { success: false, details: 'required フィールドがboolean型でない' };
      }

      if (typeof dep.installed !== 'boolean') {
        return { success: false, details: 'installed フィールドがboolean型でない' };
      }

      if (!Array.isArray(dep.issues)) {
        return { success: false, details: 'issues フィールドが配列でない' };
      }
    }

    return { success: true, details: `${dependencies.length}個の依存関係を確認` };
  }

  async testEnvironmentInitialization() {
    try {
      await this.manager.initializeTestEnvironment();

      // 作成されるべきファイルの確認
      const expectedFiles = [
        'jest.config.js',
        '.kiro/lib/trust-policy/__tests__/setup.ts',
        '.kiro/lib/trust-policy/__tests__/fixtures/sample-policy.json',
        '.kiro/lib/trust-policy/__tests__/mocks/index.ts'
      ];

      const missingFiles = [];
      for (const file of expectedFiles) {
        const exists = await fs.access(file).then(() => true).catch(() => false);
        if (!exists) {
          missingFiles.push(file);
        }
      }

      if (missingFiles.length > 0) {
        return { success: false, details: `作成されていないファイル: ${missingFiles.join(', ')}` };
      }

      // 環境変数の確認
      const expectedEnvVars = ['NODE_ENV', 'TZ', 'KIRO_TEST_MODE', 'KIRO_LOG_LEVEL'];
      const missingEnvVars = expectedEnvVars.filter(envVar => !process.env[envVar]);

      if (missingEnvVars.length > 0) {
        return { success: false, details: `設定されていない環境変数: ${missingEnvVars.join(', ')}` };
      }

      return { success: true, details: 'テスト環境の初期化が正常に完了' };

    } catch (error) {
      return { success: false, details: `初期化中にエラー: ${error.message}` };
    }
  }

  async testTestFileDiscovery() {
    // テスト用のテストファイルを作成
    const testFiles = [
      '.kiro/lib/trust-policy/__tests__/unit-test.test.ts',
      '.kiro/lib/trust-policy/__tests__/integration-test.integration.test.ts',
      '.kiro/lib/trust-policy/__tests__/acceptance-test.acceptance.test.ts'
    ];

    const testContent = `
describe('Test File Discovery', () => {
  it('should be discovered', () => {
    expect(true).toBe(true);
  });
});`;

    try {
      // テストファイルを作成
      for (const testFile of testFiles) {
        await fs.writeFile(testFile, testContent);
      }

      // ファイル検索のテスト（内部メソッドを直接テストするため、実装に依存）
      // 実際の実装では、runTests メソッドを通じて間接的にテスト
      const unitResult = await this.manager.runTests(TestType.UNIT);
      const integrationResult = await this.manager.runTests(TestType.INTEGRATION);

      // 結果の妥当性確認
      if (typeof unitResult.totalTests !== 'number') {
        return { success: false, details: 'ユニットテストの結果が不正' };
      }

      if (typeof integrationResult.totalTests !== 'number') {
        return { success: false, details: '統合テストの結果が不正' };
      }

      return { success: true, details: 'テストファイルの検索と実行が正常に動作' };

    } finally {
      // テストファイルをクリーンアップ
      for (const testFile of testFiles) {
        await fs.unlink(testFile).catch(() => {});
      }
    }
  }

  async testTestExecution() {
    // 各テストタイプの実行テスト
    const testTypes = [TestType.UNIT, TestType.INTEGRATION, TestType.ACCEPTANCE, TestType.PERFORMANCE];
    
    for (const testType of testTypes) {
      try {
        const result = await this.manager.runTests(testType);

        // 結果の構造確認
        const requiredFields = ['testType', 'status', 'totalTests', 'passedTests', 'failedTests', 'duration', 'startTime', 'endTime', 'errors'];
        for (const field of requiredFields) {
          if (result[field] === undefined) {
            return { success: false, details: `テスト結果に必須フィールドが不足: ${field}` };
          }
        }

        // ステータスの妥当性確認
        if (!['pass', 'fail', 'skip'].includes(result.status)) {
          return { success: false, details: `不正なテストステータス: ${result.status}` };
        }

        // 時間の妥当性確認
        if (!(result.startTime instanceof Date) || !(result.endTime instanceof Date)) {
          return { success: false, details: '開始時刻または終了時刻が不正' };
        }

        if (result.endTime < result.startTime) {
          return { success: false, details: '終了時刻が開始時刻より前' };
        }

      } catch (error) {
        return { success: false, details: `${testType}テスト実行中にエラー: ${error.message}` };
      }
    }

    return { success: true, details: '全テストタイプの実行が正常に動作' };
  }

  async testErrorHandling() {
    // 存在しないパターンでのテスト実行
    try {
      const result = await this.manager.runTests(TestType.UNIT, { pattern: 'nonexistent-test-pattern' });
      
      if (result.status !== 'skip') {
        return { success: false, details: '存在しないテストパターンで適切にスキップされない' };
      }

      if (result.totalTests !== 0) {
        return { success: false, details: '存在しないテストパターンでテスト数が0でない' };
      }

    } catch (error) {
      return { success: false, details: `エラーハンドリングテスト中にエラー: ${error.message}` };
    }

    return { success: true, details: 'エラーハンドリングが正常に動作' };
  }

  async testIntegrationFeatures() {
    // 統合機能のテスト
    try {
      // 1. 初期化状態の確認
      if (!this.manager.isInitialized()) {
        return { success: false, details: 'マネージャーが初期化されていない' };
      }

      // 2. 設定の取得
      const config = this.manager.getTestEnvironmentConfig();
      if (!config || typeof config !== 'object') {
        return { success: false, details: '設定の取得に失敗' };
      }

      // 3. 不足メソッドの取得
      const missingMethods = this.manager.getMissingMethods();
      if (!Array.isArray(missingMethods)) {
        return { success: false, details: '不足メソッドの取得に失敗' };
      }

      // 4. 依存関係の取得
      const dependencies = this.manager.getDependencies();
      if (!Array.isArray(dependencies)) {
        return { success: false, details: '依存関係の取得に失敗' };
      }

      // 5. テスト実行
      const testResult = await this.manager.runTests(TestType.UNIT);
      if (!testResult || typeof testResult !== 'object') {
        return { success: false, details: 'テスト実行結果の取得に失敗' };
      }

      return { success: true, details: '全統合機能が正常に動作' };

    } catch (error) {
      return { success: false, details: `統合機能テスト中にエラー: ${error.message}` };
    }
  }

  printSummary() {
    console.log('='.repeat(60));
    console.log('🧪 TestFrameworkManager検証結果サマリー');
    console.log('='.repeat(60));

    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(result => result.success).length;
    const failedTests = totalTests - passedTests;

    console.log(`総テスト数: ${totalTests}`);
    console.log(`成功: ${passedTests} ✅`);
    console.log(`失敗: ${failedTests} ❌`);
    console.log(`成功率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

    if (failedTests > 0) {
      console.log('\n❌ 失敗したテスト:');
      this.testResults
        .filter(result => !result.success)
        .forEach(result => {
          console.log(`- ${result.name}: ${result.details}`);
        });
    }

    console.log('\n✅ 成功したテスト:');
    this.testResults
      .filter(result => result.success)
      .forEach(result => {
        console.log(`- ${result.name}`);
      });

    const overallStatus = failedTests === 0 ? '✅ 全テスト合格' : '❌ 一部テスト失敗';
    console.log(`\n${overallStatus}`);
    
    if (failedTests === 0) {
      console.log('🎉 TestFrameworkManagerは正常に実装されています！');
    } else {
      console.log('⚠️ TestFrameworkManagerに問題があります。修正が必要です。');
    }

    // 統計情報
    console.log('\n📊 統計情報:');
    if (this.manager) {
      const missingMethods = this.manager.getMissingMethods();
      const dependencies = this.manager.getDependencies();
      
      console.log(`- 検出された不足メソッド: ${missingMethods.length}個`);
      console.log(`- 自動修正可能メソッド: ${missingMethods.filter(m => m.autoFixable).length}個`);
      console.log(`- 確認された依存関係: ${dependencies.length}個`);
      console.log(`- インストール済み依存関係: ${dependencies.filter(d => d.installed).length}個`);
    }
  }
}

async function main() {
  const verifier = new TestFrameworkManagerVerifier();
  
  try {
    await verifier.initialize();
    await verifier.runVerification();
  } catch (error) {
    console.error('❌ 検証中にエラーが発生しました:', error);
    process.exit(1);
  }
}

// スクリプトが直接実行された場合のみmain関数を呼び出し
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { TestFrameworkManagerVerifier, main };