import { promises as fs } from 'fs';
import { join } from 'path';

export enum QualityGateLevel {
  CRITICAL = 'critical',
  MAJOR = 'major',
  MINOR = 'minor'
}

export enum QualityGateStatus {
  PASS = 'pass',
  FAIL = 'fail',
  WARNING = 'warning',
  SKIP = 'skip'
}

export interface QualityGateCriteria {
  id: string;
  name: string;
  description: string;
  metric: string;
  threshold: number;
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  weight: number; // 重み（1-10）
  mandatory: boolean; // 必須かどうか
  category: string;
}

export interface QualityGateResult {
  criteriaId: string;
  status: QualityGateStatus;
  actualValue: number;
  expectedValue: number;
  operator: string;
  passed: boolean;
  score: number; // 0-100
  message: string;
  timestamp: Date;
}

export interface QualityGate {
  id: string;
  name: string;
  level: QualityGateLevel;
  description: string;
  criteria: QualityGateCriteria[];
  blocking: boolean; // ブロッキングゲートかどうか
  enabled: boolean;
  order: number; // 実行順序
  dependencies: string[]; // 依存する他のゲートのID
  timeout: number; // タイムアウト（秒）
}

export interface QualityGateExecution {
  gateId: string;
  status: QualityGateStatus;
  results: QualityGateResult[];
  overallScore: number;
  executionTime: number;
  startTime: Date;
  endTime: Date;
  errors: string[];
  warnings: string[];
}

export interface QualityGateException {
  id: string;
  gateId: string;
  criteriaId?: string;
  reason: string;
  approver: string;
  approvedAt: Date;
  expiresAt: Date;
  conditions: string[];
  active: boolean;
}

export interface QualityGateConfiguration {
  version: string;
  lastUpdated: Date;
  gates: QualityGate[];
  globalSettings: {
    enableParallelExecution: boolean;
    maxConcurrentGates: number;
    defaultTimeout: number;
    failFast: boolean; // 最初の失敗で停止するか
    retryAttempts: number;
    retryDelay: number; // ミリ秒
  };
  thresholds: {
    critical: {
      minPassRate: number; // 最小合格率
      maxFailures: number; // 最大失敗数
    };
    major: {
      minPassRate: number;
      maxFailures: number;
    };
    minor: {
      minPassRate: number;
      maxFailures: number;
    };
  };
}

/**
 * 品質ゲート管理システム
 * Critical/Major/Minor品質ゲートの実装、段階的品質チェック、
 * 品質基準の動的調整、品質例外の管理機能を提供
 */
export class QualityGateManager {
  private configuration: QualityGateConfiguration;
  private exceptions: QualityGateException[] = [];
  private executionHistory: QualityGateExecution[] = [];
  private configPath: string;
  private exceptionsPath: string;
  private historyPath: string;

  constructor() {
    this.configPath = '.kiro/settings/quality-gates.json';
    this.exceptionsPath = '.kiro/settings/quality-gate-exceptions.json';
    this.historyPath = '.kiro/reports/quality-gate-history.json';
    this.configuration = this.getDefaultConfiguration();
  }

  /**
   * 初期化処理
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir('.kiro/settings', { recursive: true });
      await fs.mkdir('.kiro/reports', { recursive: true });

      // 設定ファイルの読み込み
      await this.loadConfiguration();
      await this.loadExceptions();
      await this.loadExecutionHistory();

      console.log('✅ Quality Gate Manager initialized');
    } catch (error) {
      throw new Error(`Failed to initialize Quality Gate Manager: ${error.message}`);
    }
  }

  /**
   * 品質ゲートの実行
   */
  async executeQualityGates(context: { [key: string]: any } = {}): Promise<{
    overallStatus: QualityGateStatus;
    executions: QualityGateExecution[];
    summary: {
      total: number;
      passed: number;
      failed: number;
      warnings: number;
      skipped: number;
      blocked: boolean;
    };
    recommendations: string[];
  }> {
    const startTime = new Date();
    const executions: QualityGateExecution[] = [];
    let blocked = false;

    try {
      console.log('🚪 Starting quality gate execution...');

      // 有効なゲートを取得し、実行順序でソート
      const enabledGates = this.configuration.gates
        .filter(gate => gate.enabled)
        .sort((a, b) => a.order - b.order);

      console.log(`📋 Found ${enabledGates.length} enabled quality gates`);

      // 段階的実行
      for (const gate of enabledGates) {
        // 依存関係のチェック
        if (!this.checkDependencies(gate, executions)) {
          console.log(`⏭️ Skipping gate ${gate.name} due to unmet dependencies`);
          continue;
        }

        // ゲートの実行
        const execution = await this.executeGate(gate, context);
        executions.push(execution);

        console.log(`${this.getStatusIcon(execution.status)} ${gate.name}: ${execution.status} (${execution.executionTime}ms)`);

        // ブロッキングゲートが失敗した場合
        if (gate.blocking && execution.status === QualityGateStatus.FAIL) {
          blocked = true;
          if (this.configuration.globalSettings.failFast) {
            console.log('🛑 Fail-fast enabled, stopping execution');
            break;
          }
        }
      }

      // 実行履歴に記録
      this.executionHistory.push(...executions);
      await this.saveExecutionHistory();

      // 結果の集計
      const summary = this.calculateSummary(executions);
      const overallStatus = this.determineOverallStatus(executions, blocked);
      const recommendations = this.generateRecommendations(executions, blocked);

      const result = {
        overallStatus,
        executions,
        summary: { ...summary, blocked },
        recommendations
      };

      // 実行レポートの生成
      await this.generateExecutionReport(result, startTime, new Date());

      console.log(`🏁 Quality gate execution completed: ${overallStatus}`);
      return result;

    } catch (error) {
      throw new Error(`Quality gate execution failed: ${error.message}`);
    }
  }

  /**
   * 個別ゲートの実行
   */
  private async executeGate(gate: QualityGate, context: { [key: string]: any }): Promise<QualityGateExecution> {
    const startTime = new Date();
    const results: QualityGateResult[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // タイムアウト設定
      const timeout = gate.timeout || this.configuration.globalSettings.defaultTimeout;
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Gate execution timeout after ${timeout}s`)), timeout * 1000);
      });

      // ゲート実行のPromise
      const executionPromise = this.executeGateCriteria(gate, context, results, errors, warnings);

      // タイムアウトと実行のレース
      await Promise.race([executionPromise, timeoutPromise]);

    } catch (error) {
      errors.push(error.message);
    }

    const endTime = new Date();
    const executionTime = endTime.getTime() - startTime.getTime();

    // 結果の評価
    const { status, overallScore } = this.evaluateGateResults(gate, results, errors);

    return {
      gateId: gate.id,
      status,
      results,
      overallScore,
      executionTime,
      startTime,
      endTime,
      errors,
      warnings
    };
  }

  /**
   * ゲート基準の実行
   */
  private async executeGateCriteria(
    gate: QualityGate,
    context: { [key: string]: any },
    results: QualityGateResult[],
    errors: string[],
    warnings: string[]
  ): Promise<void> {
    for (const criteria of gate.criteria) {
      try {
        // 例外チェック
        if (this.hasActiveException(gate.id, criteria.id)) {
          results.push({
            criteriaId: criteria.id,
            status: QualityGateStatus.SKIP,
            actualValue: 0,
            expectedValue: criteria.threshold,
            operator: criteria.operator,
            passed: true, // 例外により合格扱い
            score: 100,
            message: 'Skipped due to active exception',
            timestamp: new Date()
          });
          continue;
        }

        // メトリクス値の取得
        const actualValue = await this.getMetricValue(criteria.metric, context);
        
        // 基準の評価
        const passed = this.evaluateCriteria(actualValue, criteria.threshold, criteria.operator);
        const score = this.calculateCriteriaScore(actualValue, criteria.threshold, criteria.operator, passed);
        
        results.push({
          criteriaId: criteria.id,
          status: passed ? QualityGateStatus.PASS : QualityGateStatus.FAIL,
          actualValue,
          expectedValue: criteria.threshold,
          operator: criteria.operator,
          passed,
          score,
          message: this.generateCriteriaMessage(criteria, actualValue, passed),
          timestamp: new Date()
        });

      } catch (error) {
        errors.push(`Criteria ${criteria.id}: ${error.message}`);
        results.push({
          criteriaId: criteria.id,
          status: QualityGateStatus.FAIL,
          actualValue: 0,
          expectedValue: criteria.threshold,
          operator: criteria.operator,
          passed: false,
          score: 0,
          message: `Error: ${error.message}`,
          timestamp: new Date()
        });
      }
    }
  }

  /**
   * メトリクス値の取得
   */
  private async getMetricValue(metric: string, context: { [key: string]: any }): Promise<number> {
    // コンテキストから値を取得
    if (context[metric] !== undefined) {
      return Number(context[metric]);
    }

    // 組み込みメトリクスの計算
    switch (metric) {
      case 'test_pass_rate':
        return this.calculateTestPassRate(context);
      case 'code_coverage':
        return this.calculateCodeCoverage(context);
      case 'performance_score':
        return this.calculatePerformanceScore(context);
      case 'security_score':
        return this.calculateSecurityScore(context);
      case 'quality_score':
        return this.calculateQualityScore(context);
      default:
        throw new Error(`Unknown metric: ${metric}`);
    }
  }

  /**
   * テスト合格率の計算
   */
  private calculateTestPassRate(context: { [key: string]: any }): number {
    const totalTests = context.totalTests || 0;
    const passedTests = context.passedTests || 0;
    
    if (totalTests === 0) return 0;
    return (passedTests / totalTests) * 100;
  }

  /**
   * コードカバレッジの計算
   */
  private calculateCodeCoverage(context: { [key: string]: any }): number {
    return context.codeCoverage || 0;
  }

  /**
   * パフォーマンススコアの計算
   */
  private calculatePerformanceScore(context: { [key: string]: any }): number {
    const responseTime = context.responseTime || 0;
    const memoryUsage = context.memoryUsage || 0;
    const cpuUsage = context.cpuUsage || 0;

    // パフォーマンススコアの計算ロジック
    let score = 100;
    
    if (responseTime > 100) score -= Math.min(30, (responseTime - 100) / 10);
    if (memoryUsage > 512) score -= Math.min(30, (memoryUsage - 512) / 50);
    if (cpuUsage > 80) score -= Math.min(40, (cpuUsage - 80) / 2);

    return Math.max(0, score);
  }

  /**
   * セキュリティスコアの計算
   */
  private calculateSecurityScore(context: { [key: string]: any }): number {
    const vulnerabilities = context.vulnerabilities || 0;
    const securityTests = context.securityTestsPassed || 0;
    const totalSecurityTests = context.totalSecurityTests || 1;

    let score = (securityTests / totalSecurityTests) * 100;
    score -= vulnerabilities * 10; // 脆弱性1つにつき10点減点

    return Math.max(0, score);
  }

  /**
   * 品質スコアの計算
   */
  private calculateQualityScore(context: { [key: string]: any }): number {
    const codeSmells = context.codeSmells || 0;
    const duplications = context.duplications || 0;
    const maintainabilityIndex = context.maintainabilityIndex || 100;

    let score = maintainabilityIndex;
    score -= codeSmells * 2; // コードスメル1つにつき2点減点
    score -= duplications * 5; // 重複1つにつき5点減点

    return Math.max(0, score);
  }

  /**
   * 基準の評価
   */
  private evaluateCriteria(actual: number, expected: number, operator: string): boolean {
    switch (operator) {
      case '>': return actual > expected;
      case '<': return actual < expected;
      case '>=': return actual >= expected;
      case '<=': return actual <= expected;
      case '==': return actual === expected;
      case '!=': return actual !== expected;
      default: return false;
    }
  }

  /**
   * 基準スコアの計算
   */
  private calculateCriteriaScore(actual: number, expected: number, operator: string, passed: boolean): number {
    if (passed) {
      // 合格の場合、どれだけ良いかに応じてスコアを調整
      switch (operator) {
        case '>=':
          return Math.min(100, 80 + (actual - expected) / expected * 20);
        case '<=':
          return Math.min(100, 80 + (expected - actual) / expected * 20);
        default:
          return 100;
      }
    } else {
      // 不合格の場合、どれだけ悪いかに応じてスコアを調整
      const diff = Math.abs(actual - expected);
      const ratio = diff / expected;
      return Math.max(0, 50 - ratio * 50);
    }
  }

  /**
   * 基準メッセージの生成
   */
  private generateCriteriaMessage(criteria: QualityGateCriteria, actualValue: number, passed: boolean): string {
    const status = passed ? 'PASS' : 'FAIL';
    return `${criteria.name}: ${actualValue} ${criteria.operator} ${criteria.threshold} - ${status}`;
  }

  /**
   * ゲート結果の評価
   */
  private evaluateGateResults(gate: QualityGate, results: QualityGateResult[], errors: string[]): {
    status: QualityGateStatus;
    overallScore: number;
  } {
    if (errors.length > 0) {
      return { status: QualityGateStatus.FAIL, overallScore: 0 };
    }

    const mandatoryResults = results.filter(r => {
      const criteria = gate.criteria.find(c => c.id === r.criteriaId);
      return criteria?.mandatory;
    });

    const optionalResults = results.filter(r => {
      const criteria = gate.criteria.find(c => c.id === r.criteriaId);
      return !criteria?.mandatory;
    });

    // 必須基準がすべて合格している必要がある
    const mandatoryPassed = mandatoryResults.every(r => r.passed);
    if (!mandatoryPassed) {
      return { status: QualityGateStatus.FAIL, overallScore: 0 };
    }

    // 重み付きスコアの計算
    let totalScore = 0;
    let totalWeight = 0;

    for (const result of results) {
      const criteria = gate.criteria.find(c => c.id === result.criteriaId);
      if (criteria) {
        totalScore += result.score * criteria.weight;
        totalWeight += criteria.weight;
      }
    }

    const overallScore = totalWeight > 0 ? totalScore / totalWeight : 0;

    // レベル別の閾値チェック
    const threshold = this.configuration.thresholds[gate.level];
    if (overallScore >= threshold.minPassRate) {
      return { status: QualityGateStatus.PASS, overallScore };
    } else if (overallScore >= threshold.minPassRate * 0.8) {
      return { status: QualityGateStatus.WARNING, overallScore };
    } else {
      return { status: QualityGateStatus.FAIL, overallScore };
    }
  }

  /**
   * 依存関係のチェック
   */
  private checkDependencies(gate: QualityGate, executions: QualityGateExecution[]): boolean {
    for (const depId of gate.dependencies) {
      const depExecution = executions.find(e => e.gateId === depId);
      if (!depExecution || depExecution.status === QualityGateStatus.FAIL) {
        return false;
      }
    }
    return true;
  }

  /**
   * アクティブな例外の確認
   */
  private hasActiveException(gateId: string, criteriaId?: string): boolean {
    const now = new Date();
    return this.exceptions.some(ex => 
      ex.active &&
      ex.gateId === gateId &&
      (!criteriaId || ex.criteriaId === criteriaId) &&
      ex.expiresAt > now
    );
  }

  /**
   * 結果の集計
   */
  private calculateSummary(executions: QualityGateExecution[]): {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
    skipped: number;
  } {
    return {
      total: executions.length,
      passed: executions.filter(e => e.status === QualityGateStatus.PASS).length,
      failed: executions.filter(e => e.status === QualityGateStatus.FAIL).length,
      warnings: executions.filter(e => e.status === QualityGateStatus.WARNING).length,
      skipped: executions.filter(e => e.status === QualityGateStatus.SKIP).length
    };
  }

  /**
   * 全体ステータスの決定
   */
  private determineOverallStatus(executions: QualityGateExecution[], blocked: boolean): QualityGateStatus {
    if (blocked) return QualityGateStatus.FAIL;
    
    const hasFailures = executions.some(e => e.status === QualityGateStatus.FAIL);
    if (hasFailures) return QualityGateStatus.FAIL;
    
    const hasWarnings = executions.some(e => e.status === QualityGateStatus.WARNING);
    if (hasWarnings) return QualityGateStatus.WARNING;
    
    return QualityGateStatus.PASS;
  }

  /**
   * 推奨事項の生成
   */
  private generateRecommendations(executions: QualityGateExecution[], blocked: boolean): string[] {
    const recommendations: string[] = [];

    if (blocked) {
      recommendations.push('🚫 Deployment is blocked by failing quality gates');
      recommendations.push('🔧 Address critical issues before proceeding');
    }

    const failedExecutions = executions.filter(e => e.status === QualityGateStatus.FAIL);
    if (failedExecutions.length > 0) {
      recommendations.push(`❌ ${failedExecutions.length} quality gate(s) failed`);
      failedExecutions.forEach(exec => {
        const gate = this.configuration.gates.find(g => g.id === exec.gateId);
        if (gate) {
          recommendations.push(`  • ${gate.name}: Review and fix failing criteria`);
        }
      });
    }

    const warningExecutions = executions.filter(e => e.status === QualityGateStatus.WARNING);
    if (warningExecutions.length > 0) {
      recommendations.push(`⚠️ ${warningExecutions.length} quality gate(s) have warnings`);
      recommendations.push('📈 Consider improving these areas for better quality');
    }

    if (executions.every(e => e.status === QualityGateStatus.PASS)) {
      recommendations.push('✅ All quality gates passed successfully');
      recommendations.push('🚀 Ready for deployment');
    }

    return recommendations;
  }

  /**
   * ステータスアイコンの取得
   */
  private getStatusIcon(status: QualityGateStatus): string {
    switch (status) {
      case QualityGateStatus.PASS: return '✅';
      case QualityGateStatus.FAIL: return '❌';
      case QualityGateStatus.WARNING: return '⚠️';
      case QualityGateStatus.SKIP: return '⏭️';
      default: return '❓';
    }
  }

  /**
   * 例外の作成
   */
  async createException(exception: Omit<QualityGateException, 'id' | 'active'>): Promise<string> {
    const id = `exception-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newException: QualityGateException = {
      id,
      active: true,
      ...exception
    };

    this.exceptions.push(newException);
    await this.saveExceptions();

    console.log(`✅ Created quality gate exception: ${id}`);
    return id;
  }

  /**
   * 例外の無効化
   */
  async deactivateException(exceptionId: string): Promise<boolean> {
    const exception = this.exceptions.find(e => e.id === exceptionId);
    if (!exception) {
      return false;
    }

    exception.active = false;
    await this.saveExceptions();

    console.log(`✅ Deactivated quality gate exception: ${exceptionId}`);
    return true;
  }

  /**
   * 品質基準の動的調整
   */
  async adjustQualityThresholds(level: QualityGateLevel, adjustments: {
    minPassRate?: number;
    maxFailures?: number;
  }): Promise<void> {
    if (adjustments.minPassRate !== undefined) {
      this.configuration.thresholds[level].minPassRate = adjustments.minPassRate;
    }
    if (adjustments.maxFailures !== undefined) {
      this.configuration.thresholds[level].maxFailures = adjustments.maxFailures;
    }

    this.configuration.lastUpdated = new Date();
    await this.saveConfiguration();

    console.log(`✅ Adjusted quality thresholds for ${level} level`);
  }

  /**
   * 実行レポートの生成
   */
  private async generateExecutionReport(
    result: any,
    startTime: Date,
    endTime: Date
  ): Promise<void> {
    const timestamp = new Date().toISOString().split('T')[0];
    const reportPath = `.kiro/reports/quality-gate-execution-${timestamp}.md`;

    const report = this.formatExecutionReport(result, startTime, endTime);
    await fs.writeFile(reportPath, report);

    console.log(`📊 Quality gate execution report saved: ${reportPath}`);
  }

  /**
   * 実行レポートのフォーマット
   */
  private formatExecutionReport(result: any, startTime: Date, endTime: Date): string {
    const duration = endTime.getTime() - startTime.getTime();
    
    let report = `# Quality Gate Execution Report

**Execution Time:** ${startTime.toISOString()} - ${endTime.toISOString()}
**Duration:** ${duration}ms
**Overall Status:** ${this.getStatusIcon(result.overallStatus)} ${result.overallStatus}

## Summary

- **Total Gates:** ${result.summary.total}
- **Passed:** ${result.summary.passed} ✅
- **Failed:** ${result.summary.failed} ❌
- **Warnings:** ${result.summary.warnings} ⚠️
- **Skipped:** ${result.summary.skipped} ⏭️
- **Blocked:** ${result.summary.blocked ? 'Yes' : 'No'}

## Gate Results

`;

    result.executions.forEach((execution: QualityGateExecution) => {
      const gate = this.configuration.gates.find(g => g.id === execution.gateId);
      const icon = this.getStatusIcon(execution.status);
      
      report += `### ${icon} ${gate?.name || execution.gateId}

- **Status:** ${execution.status}
- **Score:** ${execution.overallScore.toFixed(1)}/100
- **Execution Time:** ${execution.executionTime}ms
- **Level:** ${gate?.level || 'unknown'}
- **Blocking:** ${gate?.blocking ? 'Yes' : 'No'}

#### Criteria Results

`;

      execution.results.forEach(result => {
        const criteria = gate?.criteria.find(c => c.id === result.criteriaId);
        const resultIcon = result.passed ? '✅' : '❌';
        
        report += `- ${resultIcon} **${criteria?.name || result.criteriaId}**: ${result.actualValue} ${result.operator} ${result.expectedValue} (Score: ${result.score.toFixed(1)})\n`;
      });

      if (execution.errors.length > 0) {
        report += `\n#### Errors\n\n`;
        execution.errors.forEach(error => {
          report += `- ❌ ${error}\n`;
        });
      }

      if (execution.warnings.length > 0) {
        report += `\n#### Warnings\n\n`;
        execution.warnings.forEach(warning => {
          report += `- ⚠️ ${warning}\n`;
        });
      }

      report += '\n';
    });

    report += `## Recommendations

`;
    result.recommendations.forEach((rec: string) => {
      report += `${rec}\n`;
    });

    return report;
  }

  /**
   * デフォルト設定の取得
   */
  private getDefaultConfiguration(): QualityGateConfiguration {
    return {
      version: '1.0',
      lastUpdated: new Date(),
      gates: [
        {
          id: 'critical-functionality',
          name: 'Critical Functionality',
          level: QualityGateLevel.CRITICAL,
          description: 'Essential functionality must work correctly',
          criteria: [
            {
              id: 'test-pass-rate',
              name: 'Test Pass Rate',
              description: 'Percentage of tests that pass',
              metric: 'test_pass_rate',
              threshold: 100,
              operator: '==',
              weight: 10,
              mandatory: true,
              category: 'testing'
            },
            {
              id: 'critical-bugs',
              name: 'Critical Bugs',
              description: 'Number of critical bugs',
              metric: 'critical_bugs',
              threshold: 0,
              operator: '==',
              weight: 10,
              mandatory: true,
              category: 'quality'
            }
          ],
          blocking: true,
          enabled: true,
          order: 1,
          dependencies: [],
          timeout: 300
        },
        {
          id: 'performance-standards',
          name: 'Performance Standards',
          level: QualityGateLevel.MAJOR,
          description: 'Performance requirements must be met',
          criteria: [
            {
              id: 'response-time',
              name: 'Response Time',
              description: 'Average response time in milliseconds',
              metric: 'responseTime',
              threshold: 100,
              operator: '<=',
              weight: 8,
              mandatory: true,
              category: 'performance'
            },
            {
              id: 'memory-usage',
              name: 'Memory Usage',
              description: 'Memory usage in MB',
              metric: 'memoryUsage',
              threshold: 512,
              operator: '<=',
              weight: 6,
              mandatory: false,
              category: 'performance'
            }
          ],
          blocking: true,
          enabled: true,
          order: 2,
          dependencies: ['critical-functionality'],
          timeout: 180
        },
        {
          id: 'quality-metrics',
          name: 'Quality Metrics',
          level: QualityGateLevel.MINOR,
          description: 'Code quality standards',
          criteria: [
            {
              id: 'code-coverage',
              name: 'Code Coverage',
              description: 'Percentage of code covered by tests',
              metric: 'code_coverage',
              threshold: 80,
              operator: '>=',
              weight: 7,
              mandatory: false,
              category: 'quality'
            },
            {
              id: 'code-quality',
              name: 'Code Quality Score',
              description: 'Overall code quality score',
              metric: 'quality_score',
              threshold: 80,
              operator: '>=',
              weight: 5,
              mandatory: false,
              category: 'quality'
            }
          ],
          blocking: false,
          enabled: true,
          order: 3,
          dependencies: [],
          timeout: 120
        }
      ],
      globalSettings: {
        enableParallelExecution: false,
        maxConcurrentGates: 3,
        defaultTimeout: 300,
        failFast: true,
        retryAttempts: 2,
        retryDelay: 1000
      },
      thresholds: {
        critical: {
          minPassRate: 100,
          maxFailures: 0
        },
        major: {
          minPassRate: 90,
          maxFailures: 1
        },
        minor: {
          minPassRate: 80,
          maxFailures: 2
        }
      }
    };
  }

  /**
   * 設定の読み込み
   */
  private async loadConfiguration(): Promise<void> {
    try {
      const content = await fs.readFile(this.configPath, 'utf-8');
      this.configuration = JSON.parse(content);
    } catch (error) {
      // ファイルが存在しない場合はデフォルト設定を保存
      await this.saveConfiguration();
    }
  }

  /**
   * 設定の保存
   */
  private async saveConfiguration(): Promise<void> {
    await fs.writeFile(this.configPath, JSON.stringify(this.configuration, null, 2));
  }

  /**
   * 例外の読み込み
   */
  private async loadExceptions(): Promise<void> {
    try {
      const content = await fs.readFile(this.exceptionsPath, 'utf-8');
      this.exceptions = JSON.parse(content);
    } catch (error) {
      // ファイルが存在しない場合は空の配列
      this.exceptions = [];
    }
  }

  /**
   * 例外の保存
   */
  private async saveExceptions(): Promise<void> {
    await fs.writeFile(this.exceptionsPath, JSON.stringify(this.exceptions, null, 2));
  }

  /**
   * 実行履歴の読み込み
   */
  private async loadExecutionHistory(): Promise<void> {
    try {
      const content = await fs.readFile(this.historyPath, 'utf-8');
      this.executionHistory = JSON.parse(content);
    } catch (error) {
      // ファイルが存在しない場合は空の配列
      this.executionHistory = [];
    }
  }

  /**
   * 実行履歴の保存
   */
  private async saveExecutionHistory(): Promise<void> {
    // 最新の100件のみ保持
    const recentHistory = this.executionHistory.slice(-100);
    await fs.writeFile(this.historyPath, JSON.stringify(recentHistory, null, 2));
  }

  /**
   * 設定の取得
   */
  getConfiguration(): QualityGateConfiguration {
    return { ...this.configuration };
  }

  /**
   * 例外の取得
   */
  getExceptions(): QualityGateException[] {
    return [...this.exceptions];
  }

  /**
   * 実行履歴の取得
   */
  getExecutionHistory(): QualityGateExecution[] {
    return [...this.executionHistory];
  }
}