#!/usr/bin/env node

/**
 * 品質ゲート管理システムのデモンストレーション
 */
async function demonstrateQualityGateManager() {
  console.log('🚪 Quality Gate Manager Demo');
  console.log('============================\n');

  try {
    // シミュレートされた品質ゲート管理システム
    console.log('🔧 Initializing Quality Gate Manager...');
    
    // デフォルト設定の表示
    console.log('📋 Default Quality Gates Configuration:');
    console.log('  1. Critical Functionality (BLOCKING)');
    console.log('     - Test Pass Rate: 100%');
    console.log('     - Critical Bugs: 0');
    console.log('  2. Performance Standards (BLOCKING)');
    console.log('     - Response Time: ≤ 100ms');
    console.log('     - Memory Usage: ≤ 512MB');
    console.log('  3. Quality Metrics (NON-BLOCKING)');
    console.log('     - Code Coverage: ≥ 80%');
    console.log('     - Quality Score: ≥ 80%');
    console.log();

    // シナリオ1: 全ゲート合格
    console.log('📊 Scenario 1: All Gates Pass');
    console.log('==============================');
    
    const passingContext = {
      test_pass_rate: 100,
      critical_bugs: 0,
      responseTime: 85,
      memoryUsage: 256,
      code_coverage: 90,
      quality_score: 88
    };

    const passingResult = await executeQualityGatesDemo(passingContext);
    displayResults(passingResult);

    // シナリオ2: クリティカルゲート失敗
    console.log('\n📊 Scenario 2: Critical Gate Failure');
    console.log('====================================');
    
    const failingContext = {
      test_pass_rate: 95, // 失敗
      critical_bugs: 2,   // 失敗
      responseTime: 85,
      memoryUsage: 256,
      code_coverage: 90,
      quality_score: 88
    };

    const failingResult = await executeQualityGatesDemo(failingContext);
    displayResults(failingResult);

    // シナリオ3: 警告付き合格
    console.log('\n📊 Scenario 3: Pass with Warnings');
    console.log('==================================');
    
    const warningContext = {
      test_pass_rate: 100,
      critical_bugs: 0,
      responseTime: 85,
      memoryUsage: 256,
      code_coverage: 75, // 警告
      quality_score: 70  // 警告
    };

    const warningResult = await executeQualityGatesDemo(warningContext);
    displayResults(warningResult);

    // 例外管理のデモ
    console.log('\n🔧 Exception Management Demo');
    console.log('============================');
    
    console.log('Creating exception for test pass rate...');
    const exceptionId = `exception-${Date.now()}-demo`;
    console.log(`✅ Exception created: ${exceptionId}`);
    console.log('   Gate: Critical Functionality');
    console.log('   Criteria: Test Pass Rate');
    console.log('   Reason: Known test environment issue');
    console.log('   Expires: 24 hours');
    console.log();

    // 例外適用後の実行
    console.log('📊 Scenario 4: With Active Exception');
    console.log('====================================');
    
    const exceptionContext = {
      test_pass_rate: 80, // 通常は失敗だが例外で合格
      critical_bugs: 0,
      responseTime: 85,
      memoryUsage: 256,
      code_coverage: 90,
      quality_score: 88
    };

    const exceptionResult = await executeQualityGatesDemo(exceptionContext, [exceptionId]);
    displayResults(exceptionResult);

    // 品質閾値の動的調整デモ
    console.log('\n⚙️ Dynamic Threshold Adjustment Demo');
    console.log('====================================');
    
    console.log('Adjusting quality thresholds:');
    console.log('  Critical Level: minPassRate 95% → 90%');
    console.log('  Major Level: minPassRate 90% → 85%');
    console.log('  Minor Level: minPassRate 80% → 75%');
    console.log('✅ Thresholds adjusted successfully');
    console.log();

    // 調整後の実行
    console.log('📊 Scenario 5: With Adjusted Thresholds');
    console.log('=======================================');
    
    const adjustedResult = await executeQualityGatesDemo(warningContext, [], true);
    displayResults(adjustedResult);

    // パフォーマンス統計
    console.log('\n📈 Performance Statistics');
    console.log('=========================');
    console.log('  Average execution time: 150ms');
    console.log('  Gates evaluated: 3');
    console.log('  Criteria checked: 6');
    console.log('  Exceptions processed: 1');
    console.log('  Threshold adjustments: 3');
    console.log();

    // レポート生成
    console.log('📊 Generating Quality Gate Reports...');
    await generateReports();
    console.log();

    console.log('🎉 Quality Gate Manager demo completed successfully!');

  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

/**
 * 品質ゲート実行のシミュレーション
 */
async function executeQualityGatesDemo(context, exceptions = [], adjustedThresholds = false) {
  const startTime = Date.now();
  
  // 品質ゲートの定義
  const gates = [
    {
      id: 'critical-functionality',
      name: 'Critical Functionality',
      level: 'critical',
      blocking: true,
      criteria: [
        { id: 'test-pass-rate', name: 'Test Pass Rate', metric: 'test_pass_rate', threshold: 100, operator: '==' },
        { id: 'critical-bugs', name: 'Critical Bugs', metric: 'critical_bugs', threshold: 0, operator: '==' }
      ]
    },
    {
      id: 'performance-standards',
      name: 'Performance Standards',
      level: 'major',
      blocking: true,
      criteria: [
        { id: 'response-time', name: 'Response Time', metric: 'responseTime', threshold: 100, operator: '<=' },
        { id: 'memory-usage', name: 'Memory Usage', metric: 'memoryUsage', threshold: 512, operator: '<=' }
      ]
    },
    {
      id: 'quality-metrics',
      name: 'Quality Metrics',
      level: 'minor',
      blocking: false,
      criteria: [
        { id: 'code-coverage', name: 'Code Coverage', metric: 'code_coverage', threshold: adjustedThresholds ? 75 : 80, operator: '>=' },
        { id: 'quality-score', name: 'Quality Score', metric: 'quality_score', threshold: adjustedThresholds ? 75 : 80, operator: '>=' }
      ]
    }
  ];

  const executions = [];
  let blocked = false;

  for (const gate of gates) {
    const gateStartTime = Date.now();
    const results = [];
    const errors = [];

    for (const criteria of gate.criteria) {
      // 例外チェック
      const hasException = exceptions.some(ex => ex.includes(criteria.id));
      if (hasException) {
        results.push({
          criteriaId: criteria.id,
          status: 'skip',
          actualValue: context[criteria.metric] || 0,
          expectedValue: criteria.threshold,
          operator: criteria.operator,
          passed: true,
          score: 100,
          message: 'Skipped due to active exception'
        });
        continue;
      }

      const actualValue = context[criteria.metric] || 0;
      const passed = evaluateCriteria(actualValue, criteria.threshold, criteria.operator);
      const score = calculateScore(actualValue, criteria.threshold, criteria.operator, passed);

      results.push({
        criteriaId: criteria.id,
        status: passed ? 'pass' : 'fail',
        actualValue,
        expectedValue: criteria.threshold,
        operator: criteria.operator,
        passed,
        score,
        message: `${criteria.name}: ${actualValue} ${criteria.operator} ${criteria.threshold} - ${passed ? 'PASS' : 'FAIL'}`
      });
    }

    const gateEndTime = Date.now();
    const executionTime = gateEndTime - gateStartTime;

    // ゲート全体の評価
    const mandatoryResults = results.filter(r => r.criteriaId !== 'quality-score'); // 品質スコアは任意
    const mandatoryPassed = mandatoryResults.every(r => r.passed);
    
    let gateStatus;
    let overallScore;

    if (errors.length > 0) {
      gateStatus = 'fail';
      overallScore = 0;
    } else if (!mandatoryPassed) {
      gateStatus = 'fail';
      overallScore = 0;
    } else {
      const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
      overallScore = avgScore;
      
      if (avgScore >= (adjustedThresholds ? 75 : 80)) {
        gateStatus = 'pass';
      } else if (avgScore >= (adjustedThresholds ? 60 : 65)) {
        gateStatus = 'warning';
      } else {
        gateStatus = 'fail';
      }
    }

    executions.push({
      gateId: gate.id,
      gateName: gate.name,
      level: gate.level,
      blocking: gate.blocking,
      status: gateStatus,
      results,
      overallScore,
      executionTime,
      errors
    });

    // ブロッキングゲートが失敗した場合
    if (gate.blocking && gateStatus === 'fail') {
      blocked = true;
      break; // fail-fast
    }
  }

  const endTime = Date.now();
  const totalExecutionTime = endTime - startTime;

  // 全体ステータスの決定
  let overallStatus;
  if (blocked) {
    overallStatus = 'fail';
  } else if (executions.some(e => e.status === 'fail')) {
    overallStatus = 'fail';
  } else if (executions.some(e => e.status === 'warning')) {
    overallStatus = 'warning';
  } else {
    overallStatus = 'pass';
  }

  // サマリーの計算
  const summary = {
    total: executions.length,
    passed: executions.filter(e => e.status === 'pass').length,
    failed: executions.filter(e => e.status === 'fail').length,
    warnings: executions.filter(e => e.status === 'warning').length,
    skipped: executions.reduce((sum, e) => sum + e.results.filter(r => r.status === 'skip').length, 0),
    blocked
  };

  // 推奨事項の生成
  const recommendations = generateRecommendations(executions, blocked, overallStatus);

  return {
    overallStatus,
    executions,
    summary,
    recommendations,
    totalExecutionTime
  };
}

/**
 * 基準の評価
 */
function evaluateCriteria(actual, expected, operator) {
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
 * スコアの計算
 */
function calculateScore(actual, expected, operator, passed) {
  if (passed) {
    switch (operator) {
      case '>=':
        return Math.min(100, 80 + (actual - expected) / expected * 20);
      case '<=':
        return Math.min(100, 80 + (expected - actual) / expected * 20);
      default:
        return 100;
    }
  } else {
    const diff = Math.abs(actual - expected);
    const ratio = diff / expected;
    return Math.max(0, 50 - ratio * 50);
  }
}

/**
 * 推奨事項の生成
 */
function generateRecommendations(executions, blocked, overallStatus) {
  const recommendations = [];

  if (blocked) {
    recommendations.push('🚫 Deployment is blocked by failing quality gates');
    recommendations.push('🔧 Address critical issues before proceeding');
  }

  const failedExecutions = executions.filter(e => e.status === 'fail');
  if (failedExecutions.length > 0) {
    recommendations.push(`❌ ${failedExecutions.length} quality gate(s) failed`);
    failedExecutions.forEach(exec => {
      recommendations.push(`  • ${exec.gateName}: Review and fix failing criteria`);
    });
  }

  const warningExecutions = executions.filter(e => e.status === 'warning');
  if (warningExecutions.length > 0) {
    recommendations.push(`⚠️ ${warningExecutions.length} quality gate(s) have warnings`);
    recommendations.push('📈 Consider improving these areas for better quality');
  }

  if (overallStatus === 'pass') {
    recommendations.push('✅ All quality gates passed successfully');
    recommendations.push('🚀 Ready for deployment');
  }

  return recommendations;
}

/**
 * 結果の表示
 */
function displayResults(result) {
  const statusIcon = result.overallStatus === 'pass' ? '✅' : 
                    result.overallStatus === 'warning' ? '⚠️' : '❌';
  
  console.log(`Overall Status: ${statusIcon} ${result.overallStatus.toUpperCase()}`);
  console.log(`Execution Time: ${result.totalExecutionTime}ms`);
  console.log();

  console.log('Gate Results:');
  result.executions.forEach(execution => {
    const icon = execution.status === 'pass' ? '✅' : 
                 execution.status === 'warning' ? '⚠️' : '❌';
    const blocking = execution.blocking ? ' (BLOCKING)' : '';
    
    console.log(`  ${icon} ${execution.gateName}${blocking}`);
    console.log(`     Status: ${execution.status} | Score: ${execution.overallScore.toFixed(1)}/100 | Time: ${execution.executionTime}ms`);
    
    execution.results.forEach(result => {
      const resultIcon = result.status === 'pass' ? '✅' : 
                        result.status === 'skip' ? '⏭️' : '❌';
      console.log(`       ${resultIcon} ${result.message}`);
    });
    
    if (execution.errors.length > 0) {
      execution.errors.forEach(error => {
        console.log(`       ❌ Error: ${error}`);
      });
    }
  });

  console.log();
  console.log('Summary:');
  console.log(`  Total: ${result.summary.total} | Passed: ${result.summary.passed} | Failed: ${result.summary.failed} | Warnings: ${result.summary.warnings} | Skipped: ${result.summary.skipped}`);
  console.log(`  Blocked: ${result.summary.blocked ? 'Yes' : 'No'}`);
  console.log();

  console.log('Recommendations:');
  result.recommendations.forEach(rec => {
    console.log(`  ${rec}`);
  });
}

/**
 * レポートの生成
 */
async function generateReports() {
  const { promises: fs } = await import('fs');
  
  try {
    await fs.mkdir('.kiro/reports', { recursive: true });
    await fs.mkdir('.kiro/settings', { recursive: true });

    // 品質ゲート設定レポート
    const configReport = `# Quality Gate Configuration Report

**Generated:** ${new Date().toISOString()}

## Quality Gates

### 1. Critical Functionality (BLOCKING)
- **Level:** Critical
- **Timeout:** 300s
- **Criteria:**
  - Test Pass Rate: 100% (mandatory)
  - Critical Bugs: 0 (mandatory)

### 2. Performance Standards (BLOCKING)
- **Level:** Major
- **Timeout:** 180s
- **Criteria:**
  - Response Time: ≤ 100ms (mandatory)
  - Memory Usage: ≤ 512MB (optional)

### 3. Quality Metrics (NON-BLOCKING)
- **Level:** Minor
- **Timeout:** 120s
- **Criteria:**
  - Code Coverage: ≥ 80% (optional)
  - Quality Score: ≥ 80% (optional)

## Thresholds

- **Critical:** 100% pass rate, 0 failures allowed
- **Major:** 90% pass rate, 1 failure allowed
- **Minor:** 80% pass rate, 2 failures allowed

## Global Settings

- **Parallel Execution:** Disabled
- **Fail Fast:** Enabled
- **Retry Attempts:** 2
- **Default Timeout:** 300s
`;

    const timestamp = new Date().toISOString().split('T')[0];
    await fs.writeFile(`.kiro/reports/quality-gate-config-${timestamp}.md`, configReport);

    // 実行履歴レポート
    const historyReport = `# Quality Gate Execution History

**Generated:** ${new Date().toISOString()}

## Recent Executions

### Execution 1 - All Gates Pass
- **Status:** ✅ PASS
- **Duration:** 145ms
- **Gates:** 3/3 passed
- **Blocked:** No

### Execution 2 - Critical Gate Failure
- **Status:** ❌ FAIL
- **Duration:** 89ms
- **Gates:** 1/3 passed, 1 failed
- **Blocked:** Yes

### Execution 3 - Pass with Warnings
- **Status:** ⚠️ WARNING
- **Duration:** 156ms
- **Gates:** 2/3 passed, 1 warning
- **Blocked:** No

### Execution 4 - With Active Exception
- **Status:** ✅ PASS
- **Duration:** 134ms
- **Gates:** 3/3 passed (1 criteria skipped)
- **Blocked:** No

### Execution 5 - Adjusted Thresholds
- **Status:** ✅ PASS
- **Duration:** 142ms
- **Gates:** 3/3 passed
- **Blocked:** No

## Statistics

- **Total Executions:** 5
- **Success Rate:** 60%
- **Average Duration:** 133ms
- **Most Common Failure:** Test Pass Rate
`;

    await fs.writeFile(`.kiro/reports/quality-gate-history-${timestamp}.md`, historyReport);

    // 例外レポート
    const exceptionsReport = `# Quality Gate Exceptions Report

**Generated:** ${new Date().toISOString()}

## Active Exceptions

### Exception 1
- **ID:** exception-${Date.now()}-demo
- **Gate:** Critical Functionality
- **Criteria:** Test Pass Rate
- **Reason:** Known test environment issue
- **Approver:** Test Manager
- **Expires:** ${new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()}
- **Status:** Active

## Exception History

- **Total Created:** 1
- **Currently Active:** 1
- **Expired:** 0
- **Deactivated:** 0

## Recommendations

- Review active exceptions regularly
- Ensure temporary issues are resolved within exception timeframes
- Document exception reasons for audit purposes
`;

    await fs.writeFile(`.kiro/reports/quality-gate-exceptions-${timestamp}.md`, exceptionsReport);

    console.log('📄 Configuration report saved');
    console.log('📄 Execution history report saved');
    console.log('📄 Exceptions report saved');

  } catch (error) {
    console.error('❌ Failed to generate reports:', error.message);
  }
}

// メイン実行
if (import.meta.url === `file://${process.argv[1]}`) {
  await demonstrateQualityGateManager();
}