# 開発者向けガイド - システム品質保証機能

**バージョン:** 2.0  
**最終更新:** 2025-08-29  
**対象:** 開発者、品質保証担当者

## 概要

このドキュメントは、システム品質保証機能の開発・運用・拡張に関する包括的なガイドです。実装完了したすべての機能の詳細な使用方法と、新機能の追加方法について説明します。

## 実装完了機能一覧

### ✅ 完了済みコンポーネント

| コンポーネント | 状態 | 主要機能 |
|---------------|------|----------|
| Quality Assurance Controller | ✅ 完了 | 品質チェック統括、自動修正 |
| Deployment Readiness Checker | ✅ 完了 | デプロイ準備確認、許可発行 |
| Quality Gate Manager | ✅ 完了 | 品質ゲート実行、例外管理 |
| Performance Monitor | ✅ 完了 | パフォーマンス監視、閾値管理 |
| Test Framework Manager | ✅ 完了 | テスト実行統括、依存関係解決 |
| Quality Report Generator | ✅ 完了 | 品質レポート生成、可視化 |
| Quality Dashboard | ✅ 完了 | リアルタイム品質監視 |
| Auto Fix Engine | ✅ 完了 | 自動修正機能 |
| Audit Logger | ✅ 修正完了 | 監査ログ記録 |
| Metrics Collector | ✅ 修正完了 | メトリクス収集 |
| Error Handler | ✅ 修正完了 | エラー処理 |

### ✅ 完了済みテストスイート

| テストタイプ | 状態 | カバレッジ |
|-------------|------|-----------|
| Integration Tests | ✅ 完了 | 全コンポーネント連携 |
| End-to-End Tests | ✅ 完了 | 実際の使用シナリオ |
| Performance Tests | ✅ 修正完了 | パフォーマンス閾値確認 |
| Acceptance Tests | ✅ 修正完了 | 要件適合性確認 |
| Unit Tests | ✅ 完了 | 個別コンポーネント |

## 開発環境セットアップ

### 1. 品質保証機能の初期化

```bash
# 品質保証システムの初期化
node .kiro/scripts/init-trust-policy.mjs

# 設定ファイルの確認
cat .kiro/settings/trust-policy.json
cat .kiro/settings/quality-gates.json

# 初期化確認
node .kiro/scripts/verify-initialization.mjs
```

### 2. 開発用スクリプトの実行

```bash
# 品質チェックの実行
npm run quality:check

# 自動修正のテスト
npm run quality:fix

# パフォーマンステスト
npm run performance:test

# 統合テスト
npm run test:integration

# エンドツーエンドテスト
npm run test:e2e
```

## API使用ガイド

### Quality Assurance Controller

#### 基本的な使用方法

```typescript
import { QualityAssuranceController } from './.kiro/lib/trust-policy/quality-assurance-controller';

async function runQualityCheck() {
  const controller = new QualityAssuranceController();
  
  try {
    // 初期化
    await controller.initialize();
    
    // 品質チェック実行
    const result = await controller.runQualityCheck();
    
    console.log(`品質チェック結果: ${result.passed ? '合格' : '不合格'}`);
    console.log(`検出された問題: ${result.issues.length}件`);
    
    // 自動修正可能な問題を修正
    const autoFixableIssues = result.issues.filter(issue => issue.autoFixable);
    if (autoFixableIssues.length > 0) {
      const fixResults = await controller.autoFixIssues(autoFixableIssues);
      console.log(`${fixResults.filter(r => r.success).length}件の問題を自動修正しました`);
    }
    
    return result;
  } catch (error) {
    console.error('品質チェック実行エラー:', error.message);
    throw error;
  }
}
```

#### 高度な使用方法

```typescript
// カスタム品質チェックの追加
class CustomQualityController extends QualityAssuranceController {
  protected async checkCustomQuality(): Promise<QualityIssue[]> {
    const issues: QualityIssue[] = [];
    
    // カスタムチェックロジック
    const customResult = await this.performCustomCheck();
    
    if (!customResult.passed) {
      issues.push({
        id: 'custom-check-failed',
        type: QualityIssueType.CUSTOM_ISSUE,
        severity: 'high',
        component: 'CustomComponent',
        description: 'Custom quality check failed',
        detectedAt: new Date(),
        autoFixable: true,
        fixApplied: false
      });
    }
    
    return issues;
  }
  
  private async performCustomCheck(): Promise<{ passed: boolean }> {
    // カスタムチェックの実装
    return { passed: true };
  }
}
```

### Deployment Readiness Checker

#### デプロイメント準備確認

```typescript
import { DeploymentReadinessChecker } from './.kiro/lib/trust-policy/deployment-readiness-checker';

async function checkDeploymentReadiness() {
  const checker = new DeploymentReadinessChecker();
  
  try {
    await checker.initialize();
    
    // デプロイメント準備確認
    const readiness = await checker.checkDeploymentReadiness();
    
    console.log(`デプロイ準備: ${readiness.ready ? '完了' : '未完了'}`);
    console.log(`スコア: ${readiness.score}/100`);
    
    if (readiness.ready) {
      // デプロイメント許可発行
      const permission = await checker.grantDeploymentPermission(readiness);
      console.log(`デプロイメント許可発行: ${permission.grantedAt}`);
      
      return permission;
    } else {
      console.log('ブロッカー:');
      readiness.blockers.forEach(blocker => {
        console.log(`- ${blocker.description}`);
        console.log(`  解決方法: ${blocker.resolution}`);
      });
      
      return null;
    }
  } catch (error) {
    console.error('デプロイメント準備確認エラー:', error.message);
    throw error;
  }
}
```

### Quality Gate Manager

#### 品質ゲートの実行

```typescript
import { QualityGateManager } from './.kiro/lib/trust-policy/quality-gate-manager';

async function executeQualityGates() {
  const manager = new QualityGateManager();
  
  try {
    await manager.initialize();
    
    // メトリクスコンテキストの準備
    const context = {
      test_pass_rate: 100,
      critical_bugs: 0,
      responseTime: 85,
      memoryUsage: 256,
      code_coverage: 90,
      quality_score: 88
    };
    
    // 品質ゲート実行
    const result = await manager.executeQualityGates(context);
    
    console.log(`全体ステータス: ${result.overallStatus}`);
    console.log(`実行されたゲート: ${result.summary.total}個`);
    console.log(`合格: ${result.summary.passed}個`);
    console.log(`不合格: ${result.summary.failed}個`);
    
    // 失敗したゲートの詳細
    const failedExecutions = result.executions.filter(e => e.status === 'fail');
    if (failedExecutions.length > 0) {
      console.log('\n失敗したゲート:');
      failedExecutions.forEach(execution => {
        console.log(`- ${execution.gateId}: ${execution.errors.join(', ')}`);
      });
    }
    
    return result;
  } catch (error) {
    console.error('品質ゲート実行エラー:', error.message);
    throw error;
  }
}
```

#### 品質ゲート例外の作成

```typescript
async function createQualityGateException() {
  const manager = new QualityGateManager();
  await manager.initialize();
  
  const exceptionId = await manager.createException({
    gateId: 'critical-functionality',
    criteriaId: 'test-pass-rate',
    reason: 'テスト環境の一時的な問題により、テスト実行が不安定',
    approver: 'QA Manager',
    approvedAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24時間後
    conditions: [
      'テスト環境の修復を24時間以内に完了する',
      '修復後に全テストを再実行する'
    ]
  });
  
  console.log(`例外が作成されました: ${exceptionId}`);
  return exceptionId;
}
```

### Performance Monitor

#### パフォーマンス監視

```typescript
import { PerformanceMonitor } from './.kiro/lib/trust-policy/performance-monitor';

async function monitorPerformance() {
  const monitor = new PerformanceMonitor();
  
  try {
    await monitor.initialize();
    
    // パフォーマンス閾値チェック
    const result = await monitor.checkPerformanceThresholds();
    
    console.log(`平均判定時間: ${result.averageDecisionTime}ms`);
    console.log(`メモリ使用量: ${result.memoryUsage}MB`);
    console.log(`閾値内: ${result.withinThresholds ? 'はい' : 'いいえ'}`);
    
    if (!result.withinThresholds) {
      console.log('閾値違反:');
      result.violations.forEach(violation => {
        console.log(`- ${violation}`);
      });
    }
    
    return result;
  } catch (error) {
    console.error('パフォーマンス監視エラー:', error.message);
    throw error;
  }
}
```

### Test Framework Manager

#### テスト実行管理

```typescript
import { TestFrameworkManager } from './.kiro/lib/trust-policy/test-framework-manager';

async function runAllTests() {
  const testManager = new TestFrameworkManager();
  
  try {
    await testManager.initialize();
    
    // 全テスト実行
    const results = await testManager.runAllTests();
    
    console.log('テスト実行結果:');
    
    if (results.acceptance) {
      const { totalTests, passedTests, failedTests } = results.acceptance;
      console.log(`受け入れテスト: ${passedTests}/${totalTests} 合格`);
    }
    
    if (results.unit) {
      const { totalTests, passedTests, failedTests } = results.unit;
      console.log(`ユニットテスト: ${passedTests}/${totalTests} 合格`);
    }
    
    if (results.integration) {
      const { totalTests, passedTests, failedTests } = results.integration;
      console.log(`統合テスト: ${passedTests}/${totalTests} 合格`);
    }
    
    if (results.coverage) {
      console.log(`カバレッジ: ${results.coverage.percentage}%`);
    }
    
    return results;
  } catch (error) {
    console.error('テスト実行エラー:', error.message);
    throw error;
  }
}
```

## 新機能の追加方法

### 1. 新しい品質チェックの追加

#### ステップ1: 品質問題タイプの定義

```typescript
// .kiro/lib/trust-policy/types.ts
export enum QualityIssueType {
  // 既存のタイプ
  MISSING_METHOD = 'missing_method',
  INVALID_CONFIG = 'invalid_config',
  
  // 新しいタイプを追加
  CUSTOM_SECURITY_ISSUE = 'custom_security_issue',
  CUSTOM_PERFORMANCE_ISSUE = 'custom_performance_issue'
}
```

#### ステップ2: チェック関数の実装

```typescript
// QualityAssuranceController に追加
private async checkCustomSecurity(): Promise<QualityIssue[]> {
  const issues: QualityIssue[] = [];
  
  try {
    // セキュリティチェックロジック
    const securityResult = await this.performSecurityScan();
    
    if (!securityResult.passed) {
      issues.push({
        id: 'custom-security-check-failed',
        type: QualityIssueType.CUSTOM_SECURITY_ISSUE,
        severity: 'critical',
        component: 'SecurityScanner',
        description: 'Custom security vulnerability detected',
        detectedAt: new Date(),
        autoFixable: false,
        fixApplied: false,
        metadata: {
          vulnerabilityType: securityResult.vulnerabilityType,
          affectedFiles: securityResult.affectedFiles
        }
      });
    }
  } catch (error) {
    // エラーハンドリング
    issues.push({
      id: 'security-check-error',
      type: QualityIssueType.CUSTOM_SECURITY_ISSUE,
      severity: 'high',
      component: 'SecurityScanner',
      description: `Security check failed: ${error.message}`,
      detectedAt: new Date(),
      autoFixable: false,
      fixApplied: false
    });
  }
  
  return issues;
}

private async performSecurityScan(): Promise<SecurityScanResult> {
  // セキュリティスキャンの実装
  return {
    passed: true,
    vulnerabilityType: null,
    affectedFiles: []
  };
}
```

#### ステップ3: 自動修正の実装（オプション）

```typescript
// 自動修正アクションの追加
this.autoFixActions.set(QualityIssueType.CUSTOM_SECURITY_ISSUE, {
  issueType: QualityIssueType.CUSTOM_SECURITY_ISSUE,
  description: 'Custom security issue auto-fix',
  execute: async (issue: QualityIssue) => {
    // 自動修正ロジック
    const fixResult = await this.performSecurityFix(issue);
    return {
      success: fixResult.success,
      description: fixResult.description,
      appliedAt: new Date(),
      rollbackAvailable: true
    };
  },
  validate: async (issue: QualityIssue) => {
    // 修正結果の検証
    const validationResult = await this.validateSecurityFix(issue);
    return validationResult.isValid;
  }
});
```

### 2. 新しい品質ゲートの追加

#### ステップ1: 品質ゲート設定の追加

```json
// .kiro/settings/quality-gates.json
{
  "gates": [
    {
      "id": "custom-security-gate",
      "name": "Custom Security Gate",
      "level": "critical",
      "description": "Custom security requirements validation",
      "criteria": [
        {
          "id": "security-score",
          "name": "Security Score",
          "description": "Overall security score",
          "metric": "security_score",
          "threshold": 90,
          "operator": ">=",
          "weight": 10,
          "mandatory": true,
          "category": "security"
        },
        {
          "id": "vulnerability-count",
          "name": "Vulnerability Count",
          "description": "Number of security vulnerabilities",
          "metric": "vulnerability_count",
          "threshold": 0,
          "operator": "==",
          "weight": 10,
          "mandatory": true,
          "category": "security"
        }
      ],
      "blocking": true,
      "enabled": true,
      "order": 5,
      "dependencies": ["critical-functionality"],
      "timeout": 300
    }
  ]
}
```

#### ステップ2: メトリクス計算の実装

```typescript
// QualityGateManager に追加
private calculateSecurityScore(context: { [key: string]: any }): number {
  const vulnerabilityCount = context.vulnerability_count || 0;
  const securityTestsPassed = context.security_tests_passed || 0;
  const totalSecurityTests = context.total_security_tests || 1;
  
  // セキュリティスコアの計算ロジック
  const testPassRate = (securityTestsPassed / totalSecurityTests) * 100;
  const vulnerabilityPenalty = Math.min(vulnerabilityCount * 10, 50);
  
  return Math.max(0, Math.min(100, testPassRate - vulnerabilityPenalty));
}

private calculateVulnerabilityCount(context: { [key: string]: any }): number {
  return context.vulnerability_count || 0;
}
```

### 3. 新しいテストタイプの追加

#### ステップ1: テストタイプの定義

```typescript
// TestFrameworkManager に追加
export enum TestType {
  UNIT = 'unit',
  INTEGRATION = 'integration',
  ACCEPTANCE = 'acceptance',
  PERFORMANCE = 'performance',
  SECURITY = 'security', // 新しいテストタイプ
  ACCESSIBILITY = 'accessibility' // 新しいテストタイプ
}
```

#### ステップ2: テスト実行メソッドの実装

```typescript
async runSecurityTests(): Promise<SecurityTestResult> {
  try {
    console.log('セキュリティテストを実行中...');
    
    // セキュリティテストの実行
    const testResults = await this.executeSecurityTestSuite();
    
    return {
      success: testResults.allPassed,
      totalTests: testResults.total,
      passedTests: testResults.passed,
      failedTests: testResults.failed,
      vulnerabilities: testResults.vulnerabilities,
      securityScore: testResults.securityScore
    };
  } catch (error) {
    console.error('セキュリティテスト実行エラー:', error.message);
    return {
      success: false,
      totalTests: 0,
      passedTests: 0,
      failedTests: 1,
      vulnerabilities: [],
      securityScore: 0,
      error: error.message
    };
  }
}

private async executeSecurityTestSuite(): Promise<SecurityTestSuiteResult> {
  // セキュリティテストスイートの実装
  const tests = [
    this.testSQLInjection(),
    this.testXSSVulnerabilities(),
    this.testAuthenticationSecurity(),
    this.testDataEncryption()
  ];
  
  const results = await Promise.all(tests);
  
  return {
    total: results.length,
    passed: results.filter(r => r.passed).length,
    failed: results.filter(r => !r.passed).length,
    allPassed: results.every(r => r.passed),
    vulnerabilities: results.flatMap(r => r.vulnerabilities || []),
    securityScore: this.calculateSecurityScore(results)
  };
}
```

## デバッグとトラブルシューティング

### 1. ログレベルの設定

```typescript
// 環境変数でログレベルを制御
process.env.LOG_LEVEL = 'debug'; // debug, info, warn, error

// コンポーネント別ログ設定
process.env.QA_CONTROLLER_LOG_LEVEL = 'debug';
process.env.DEPLOYMENT_CHECKER_LOG_LEVEL = 'info';
process.env.QUALITY_GATE_LOG_LEVEL = 'warn';
```

### 2. デバッグモードでの実行

```bash
# デバッグモードで品質チェック実行
DEBUG=true node .kiro/scripts/run-quality-check.mjs

# 特定コンポーネントのデバッグ
DEBUG=quality-assurance node .kiro/lib/trust-policy/demo-quality-assurance-controller.mjs

# 詳細ログ付きテスト実行
VERBOSE=true npm run test:integration
```

### 3. よくある問題と解決方法

#### 問題: 初期化エラー

```
Error: Failed to initialize component
```

**解決方法:**

```bash
# 設定ファイルの確認
cat .kiro/settings/trust-policy.json

# 権限の確認
chmod 644 .kiro/settings/*.json

# 初期化スクリプトの再実行
node .kiro/scripts/init-trust-policy.mjs --force
```

#### 問題: パフォーマンステスト失敗

```
Error: Performance threshold exceeded
```

**解決方法:**

```bash
# パフォーマンス閾値の確認
node .kiro/lib/trust-policy/demo-performance-monitor.mjs

# 閾値の調整（必要に応じて）
# .kiro/settings/performance-thresholds.json を編集

# システムリソースの確認
top
free -h
```

#### 問題: 品質ゲート失敗

```
Error: Quality gate 'critical-functionality' failed
```

**解決方法:**

```bash
# 品質ゲートの詳細確認
node .kiro/lib/trust-policy/demo-quality-gate-manager.mjs

# 例外の作成（必要に応じて）
node -e "
const { QualityGateManager } = require('./.kiro/lib/trust-policy/quality-gate-manager');
const manager = new QualityGateManager();
manager.initialize().then(() => {
  return manager.createException({
    gateId: 'critical-functionality',
    reason: 'Temporary issue',
    approver: 'Developer',
    approvedAt: new Date(),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    conditions: ['Fix within 1 hour']
  });
}).then(id => console.log('Exception created:', id));
"
```

## パフォーマンス最適化

### 1. 並行処理の活用

```typescript
// 品質チェックの並行実行
async runQualityCheck(): Promise<QualityCheckResult> {
  const checks = [
    this.checkComponentInitialization(),
    this.checkConfigurationValidity(),
    this.checkPerformanceDegradation(),
    this.checkTestCoverage()
  ];
  
  // 並行実行でパフォーマンス向上
  const results = await Promise.all(checks);
  
  return this.aggregateResults(results);
}
```

### 2. キャッシュの活用

```typescript
// 結果のキャッシュ
private resultCache = new Map<string, QualityCheckResult>();

async runQualityCheck(): Promise<QualityCheckResult> {
  const cacheKey = this.generateCacheKey();
  
  // キャッシュから結果を取得
  if (this.resultCache.has(cacheKey)) {
    const cachedResult = this.resultCache.get(cacheKey);
    if (this.isCacheValid(cachedResult)) {
      return cachedResult;
    }
  }
  
  // 新しい結果を計算
  const result = await this.performQualityCheck();
  
  // 結果をキャッシュ
  this.resultCache.set(cacheKey, result);
  
  return result;
}
```

### 3. メモリ使用量の最適化

```typescript
// 大量データの処理時はストリーミングを使用
async processLargeDataset(data: LargeDataset): Promise<ProcessResult> {
  const stream = this.createDataStream(data);
  const results: ProcessResult[] = [];
  
  for await (const chunk of stream) {
    const chunkResult = await this.processChunk(chunk);
    results.push(chunkResult);
    
    // メモリ使用量の監視
    if (process.memoryUsage().heapUsed > this.maxMemoryUsage) {
      await this.performGarbageCollection();
    }
  }
  
  return this.aggregateResults(results);
}
```

## セキュリティ考慮事項

### 1. 設定ファイルの保護

```bash
# 適切なファイル権限の設定
chmod 600 .kiro/settings/trust-policy.json
chmod 600 .kiro/settings/quality-gates.json

# 機密情報の暗号化
gpg --symmetric .kiro/settings/sensitive-config.json
```

### 2. 実行環境の分離

```typescript
// サンドボックス環境での実行
import { VM } from 'vm2';

async executeUntrustedCode(code: string): Promise<any> {
  const vm = new VM({
    timeout: 1000,
    sandbox: {
      console: {
        log: (msg: string) => this.logger.info(`Sandbox: ${msg}`)
      }
    }
  });
  
  try {
    return vm.run(code);
  } catch (error) {
    this.logger.error('Sandbox execution error:', error.message);
    throw error;
  }
}
```

### 3. 入力値の検証

```typescript
// 入力値の厳密な検証
import Joi from 'joi';

const qualityCheckSchema = Joi.object({
  checkType: Joi.string().valid('full', 'quick', 'custom').required(),
  options: Joi.object({
    includePerformance: Joi.boolean().default(true),
    includeTests: Joi.boolean().default(true),
    maxDuration: Joi.number().min(1).max(3600).default(300)
  }).default({})
});

async runQualityCheck(input: any): Promise<QualityCheckResult> {
  // 入力値の検証
  const { error, value } = qualityCheckSchema.validate(input);
  if (error) {
    throw new Error(`Invalid input: ${error.message}`);
  }
  
  return this.performQualityCheck(value);
}
```

## 継続的改善

### 1. メトリクスの収集

```typescript
// パフォーマンスメトリクスの収集
class PerformanceMetrics {
  private metrics = new Map<string, number[]>();
  
  recordExecutionTime(operation: string, duration: number): void {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    
    this.metrics.get(operation)!.push(duration);
    
    // 古いデータの削除（最新100件のみ保持）
    const values = this.metrics.get(operation)!;
    if (values.length > 100) {
      values.shift();
    }
  }
  
  getAverageExecutionTime(operation: string): number {
    const values = this.metrics.get(operation) || [];
    if (values.length === 0) return 0;
    
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }
  
  generateReport(): PerformanceReport {
    const report: PerformanceReport = {
      operations: {},
      generatedAt: new Date()
    };
    
    for (const [operation, values] of this.metrics.entries()) {
      report.operations[operation] = {
        averageTime: this.getAverageExecutionTime(operation),
        minTime: Math.min(...values),
        maxTime: Math.max(...values),
        sampleCount: values.length
      };
    }
    
    return report;
  }
}
```

### 2. 自動化された改善提案

```typescript
// 改善提案の自動生成
class ImprovementSuggestionEngine {
  async generateSuggestions(metrics: PerformanceMetrics): Promise<ImprovementSuggestion[]> {
    const suggestions: ImprovementSuggestion[] = [];
    const report = metrics.generateReport();
    
    for (const [operation, stats] of Object.entries(report.operations)) {
      // 実行時間が閾値を超えている場合
      if (stats.averageTime > this.getThreshold(operation)) {
        suggestions.push({
          type: 'performance',
          operation,
          issue: `Average execution time (${stats.averageTime}ms) exceeds threshold`,
          suggestion: 'Consider optimizing the algorithm or adding caching',
          priority: 'high',
          estimatedImpact: 'Reduce execution time by 30-50%'
        });
      }
      
      // 実行時間のばらつきが大きい場合
      const variance = stats.maxTime - stats.minTime;
      if (variance > stats.averageTime * 2) {
        suggestions.push({
          type: 'consistency',
          operation,
          issue: `High variance in execution time (${variance}ms)`,
          suggestion: 'Investigate inconsistent performance patterns',
          priority: 'medium',
          estimatedImpact: 'Improve performance predictability'
        });
      }
    }
    
    return suggestions;
  }
  
  private getThreshold(operation: string): number {
    const thresholds: { [key: string]: number } = {
      'quality-check': 5000,
      'performance-test': 10000,
      'deployment-check': 30000
    };
    
    return thresholds[operation] || 1000;
  }
}
```

## 関連ドキュメント

- [API仕様書](.kiro/docs/API_SPECIFICATION.md)
- [システム品質保証ガイド](.kiro/docs/SYSTEM_QUALITY_ASSURANCE_GUIDE.md)
- [Trust承認ポリシー運用ガイド](.kiro/steering/trust-usage.md)
- [セキュリティガイドライン](.kiro/steering/security.md)

## 更新履歴

| バージョン | 日付 | 変更内容 |
|-----------|------|----------|
| 2.0 | 2025-08-29 | システム品質保証機能実装完了に伴う全面改訂 |
| | | - 実装完了機能の詳細ガイド追加 |
| | | - API使用方法の具体例追加 |
| | | - 新機能追加方法の詳細説明 |
| | | - デバッグ・トラブルシューティング強化 |
| | | - パフォーマンス最適化ガイド追加 |
| | | - セキュリティ考慮事項の詳細化 |
| | | - 継続的改善の仕組み追加 |
| 1.0 | 2025-08-29 | 初版作成 |

---

**注意**: このドキュメントは継続的に更新されます。新機能の追加や改善に伴い、定期的に内容を見直してください。