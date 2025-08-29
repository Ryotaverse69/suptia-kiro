import { promises as fs } from 'fs';
import { join } from 'path';
import { QualityAssuranceController } from './quality-assurance-controller.js';
import { PerformanceMonitor } from './performance-monitor.js';
import { TestFrameworkManager } from './test-framework-manager.js';
/**
 * デプロイメント準備状況を確認し、デプロイ可能性を判定するクラス
 */
export class DeploymentReadinessChecker {
    qualityController;
    performanceMonitor;
    testManager;
    reportsDir;
    constructor() {
        this.qualityController = new QualityAssuranceController();
        this.performanceMonitor = new PerformanceMonitor();
        this.testManager = new TestFrameworkManager();
        this.reportsDir = '.kiro/reports';
    }
    /**
     * 初期化処理
     */
    async initialize() {
        try {
            await fs.mkdir(this.reportsDir, { recursive: true });
            await this.qualityController.initialize();
            await this.performanceMonitor.initialize();
            await this.testManager.initialize();
        }
        catch (error) {
            throw new Error(`Failed to initialize DeploymentReadinessChecker: ${error.message}`);
        }
    }
    /**
     * デプロイメント準備状況の包括的チェック
     */
    async checkDeploymentReadiness() {
        const timestamp = new Date();
        try {
            // 品質チェックの実行
            const qualityResult = await this.qualityController.runQualityCheck();
            // パフォーマンスチェックの実行
            const performanceResult = await this.performanceMonitor.checkPerformanceThresholds();
            // テスト結果の確認
            const testResults = await this.testManager.runAllTests();
            // 品質ゲートの評価
            const qualityGates = await this.evaluateQualityGates(qualityResult, performanceResult, testResults);
            // ブロッカーと警告の特定
            const blockers = this.identifyBlockers(qualityGates, qualityResult, performanceResult);
            const warnings = this.identifyWarnings(qualityGates, qualityResult, performanceResult);
            // デプロイ準備スコアの計算
            const score = this.calculateReadinessScore(qualityGates, blockers, warnings);
            // 推奨事項の生成
            const recommendations = this.generateRecommendations(blockers, warnings, qualityResult);
            const readiness = {
                ready: blockers.length === 0,
                score,
                blockers,
                warnings,
                recommendations,
                qualityGates,
                timestamp
            };
            // 結果をレポートとして保存
            await this.saveReadinessReport(readiness);
            return readiness;
        }
        catch (error) {
            throw new Error(`Failed to check deployment readiness: ${error.message}`);
        }
    }
    /**
     * 品質ゲートの評価
     */
    async evaluateQualityGates(qualityResult, performanceResult, testResults) {
        const gates = [];
        // Critical Functionality Gate
        const criticalGate = await this.evaluateCriticalFunctionalityGate(qualityResult, testResults);
        gates.push(criticalGate);
        // Performance Standards Gate
        const performanceGate = await this.evaluatePerformanceGate(performanceResult);
        gates.push(performanceGate);
        // Quality Metrics Gate
        const qualityGate = await this.evaluateQualityMetricsGate(qualityResult, testResults);
        gates.push(qualityGate);
        return gates;
    }
    /**
     * Critical Functionality Gateの評価
     */
    async evaluateCriticalFunctionalityGate(qualityResult, testResults) {
        const criteria = [];
        // 受け入れテスト成功率
        const acceptancePassRate = testResults.acceptance ?
            (testResults.acceptance.passedTests / testResults.acceptance.totalTests) * 100 : 0;
        criteria.push({
            metric: 'acceptance_test_pass_rate',
            actual: acceptancePassRate,
            threshold: 100,
            operator: '==',
            passed: acceptancePassRate === 100
        });
        // コンポーネント初期化成功率
        const initSuccessRate = qualityResult.componentInitialization ?
            qualityResult.componentInitialization.successRate : 0;
        criteria.push({
            metric: 'component_initialization_success',
            actual: initSuccessRate,
            threshold: 100,
            operator: '==',
            passed: initSuccessRate === 100
        });
        const allPassed = criteria.every(c => c.passed);
        return {
            name: 'Critical Functionality',
            status: allPassed ? 'pass' : 'fail',
            criteria,
            blocking: true
        };
    }
    /**
     * Performance Standards Gateの評価
     */
    async evaluatePerformanceGate(performanceResult) {
        const criteria = [];
        // 平均判定時間
        const avgDecisionTime = performanceResult.averageDecisionTime || 0;
        criteria.push({
            metric: 'average_decision_time',
            actual: avgDecisionTime,
            threshold: 100,
            operator: '<=',
            passed: avgDecisionTime <= 100
        });
        // メモリ使用量
        const memoryUsage = performanceResult.memoryUsage || 0;
        criteria.push({
            metric: 'memory_usage',
            actual: memoryUsage,
            threshold: 512,
            operator: '<=',
            passed: memoryUsage <= 512
        });
        const allPassed = criteria.every(c => c.passed);
        return {
            name: 'Performance Standards',
            status: allPassed ? 'pass' : 'fail',
            criteria,
            blocking: true
        };
    }
    /**
     * Quality Metrics Gateの評価
     */
    async evaluateQualityMetricsGate(qualityResult, testResults) {
        const criteria = [];
        // コードカバレッジ
        const codeCoverage = testResults.coverage ? testResults.coverage.percentage : 0;
        criteria.push({
            metric: 'code_coverage',
            actual: codeCoverage,
            threshold: 80,
            operator: '>=',
            passed: codeCoverage >= 80
        });
        // テスト成功率
        const testSuccessRate = this.calculateOverallTestSuccessRate(testResults);
        criteria.push({
            metric: 'test_success_rate',
            actual: testSuccessRate,
            threshold: 95,
            operator: '>=',
            passed: testSuccessRate >= 95
        });
        const allPassed = criteria.every(c => c.passed);
        return {
            name: 'Quality Metrics',
            status: allPassed ? 'pass' : (criteria.some(c => !c.passed) ? 'warning' : 'pass'),
            criteria,
            blocking: false
        };
    }
    /**
     * 全体的なテスト成功率の計算
     */
    calculateOverallTestSuccessRate(testResults) {
        let totalTests = 0;
        let passedTests = 0;
        Object.values(testResults).forEach((result) => {
            if (result && typeof result === 'object' && 'totalTests' in result) {
                totalTests += result.totalTests;
                passedTests += result.passedTests;
            }
        });
        return totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
    }
    /**
     * デプロイメントブロッカーの特定
     */
    identifyBlockers(qualityGates, qualityResult, performanceResult) {
        const blockers = [];
        // ブロッキングゲートの失敗をブロッカーとして追加
        qualityGates.forEach(gate => {
            if (gate.blocking && gate.status === 'fail') {
                gate.criteria.forEach(criteria => {
                    if (!criteria.passed) {
                        blockers.push({
                            id: `gate_${gate.name.toLowerCase().replace(/\s+/g, '_')}_${criteria.metric}`,
                            category: this.categorizeBlocker(criteria.metric),
                            description: `${gate.name}: ${criteria.metric} failed (${criteria.actual} ${criteria.operator} ${criteria.threshold})`,
                            impact: 'Deployment will be blocked until this issue is resolved',
                            resolution: this.getResolutionForMetric(criteria.metric),
                            autoFixable: this.isAutoFixable(criteria.metric)
                        });
                    }
                });
            }
        });
        return blockers;
    }
    /**
     * デプロイメント警告の特定
     */
    identifyWarnings(qualityGates, qualityResult, performanceResult) {
        const warnings = [];
        // 非ブロッキングゲートの失敗を警告として追加
        qualityGates.forEach(gate => {
            if (!gate.blocking && gate.status !== 'pass') {
                gate.criteria.forEach(criteria => {
                    if (!criteria.passed) {
                        warnings.push({
                            id: `warning_${gate.name.toLowerCase().replace(/\s+/g, '_')}_${criteria.metric}`,
                            category: this.categorizeWarning(criteria.metric),
                            description: `${gate.name}: ${criteria.metric} below recommended threshold (${criteria.actual} ${criteria.operator} ${criteria.threshold})`,
                            recommendation: this.getRecommendationForMetric(criteria.metric)
                        });
                    }
                });
            }
        });
        return warnings;
    }
    /**
     * ブロッカーのカテゴリ分類
     */
    categorizeBlocker(metric) {
        if (metric.includes('test'))
            return 'critical_test_failure';
        if (metric.includes('performance') || metric.includes('time') || metric.includes('memory'))
            return 'performance_threshold';
        if (metric.includes('security'))
            return 'security_issue';
        return 'dependency_issue';
    }
    /**
     * 警告のカテゴリ分類
     */
    categorizeWarning(metric) {
        if (metric.includes('coverage'))
            return 'test_coverage';
        if (metric.includes('performance') || metric.includes('time'))
            return 'performance_warning';
        return 'quality_degradation';
    }
    /**
     * メトリクスに対する解決策の取得
     */
    getResolutionForMetric(metric) {
        const resolutions = {
            'acceptance_test_pass_rate': 'Fix failing acceptance tests and ensure all test cases pass',
            'component_initialization_success': 'Fix component initialization issues and ensure all components start properly',
            'average_decision_time': 'Optimize performance to reduce decision time below 100ms',
            'memory_usage': 'Optimize memory usage to stay below 512MB threshold'
        };
        return resolutions[metric] || 'Review and fix the identified issue';
    }
    /**
     * メトリクスに対する推奨事項の取得
     */
    getRecommendationForMetric(metric) {
        const recommendations = {
            'code_coverage': 'Increase test coverage by adding more comprehensive tests',
            'test_success_rate': 'Investigate and fix intermittent test failures'
        };
        return recommendations[metric] || 'Monitor this metric and consider improvements';
    }
    /**
     * 自動修正可能かどうかの判定
     */
    isAutoFixable(metric) {
        const autoFixableMetrics = [
            'component_initialization_success'
        ];
        return autoFixableMetrics.includes(metric);
    }
    /**
     * デプロイ準備スコアの計算
     */
    calculateReadinessScore(qualityGates, blockers, warnings) {
        let score = 100;
        // ブロッキングゲートの失敗は大幅減点
        const blockingFailures = qualityGates.filter(gate => gate.blocking && gate.status === 'fail').length;
        score -= blockingFailures * 30;
        // 非ブロッキングゲートの失敗は軽微な減点
        const nonBlockingFailures = qualityGates.filter(gate => !gate.blocking && gate.status === 'fail').length;
        score -= nonBlockingFailures * 10;
        // 警告による減点
        score -= warnings.length * 5;
        return Math.max(0, score);
    }
    /**
     * 推奨事項の生成
     */
    generateRecommendations(blockers, warnings, qualityResult) {
        const recommendations = [];
        if (blockers.length > 0) {
            recommendations.push('🚫 Deployment is currently blocked. Address the following critical issues:');
            blockers.forEach(blocker => {
                recommendations.push(`  • ${blocker.description}`);
                recommendations.push(`    Resolution: ${blocker.resolution}`);
            });
        }
        if (warnings.length > 0) {
            recommendations.push('⚠️ Consider addressing these quality concerns before deployment:');
            warnings.forEach(warning => {
                recommendations.push(`  • ${warning.description}`);
                recommendations.push(`    Recommendation: ${warning.recommendation}`);
            });
        }
        if (blockers.length === 0) {
            recommendations.push('✅ All critical quality gates passed. Deployment is ready.');
            recommendations.push('🔍 Run final pre-deployment verification before proceeding.');
        }
        return recommendations;
    }
    /**
     * デプロイ許可の発行
     */
    async grantDeploymentPermission(readiness) {
        if (!readiness.ready) {
            throw new Error('Cannot grant deployment permission: deployment blockers exist');
        }
        const permission = {
            granted: true,
            grantedAt: new Date(),
            validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24時間有効
            conditions: [
                'All critical quality gates must remain passing',
                'No new critical issues must be introduced',
                'Post-deployment verification must be completed'
            ],
            approver: 'Quality Assurance System'
        };
        // 許可をファイルに保存
        const permissionFile = join(this.reportsDir, `deployment-permission-${Date.now()}.json`);
        await fs.writeFile(permissionFile, JSON.stringify(permission, null, 2));
        return permission;
    }
    /**
     * デプロイ後検証の実行
     */
    async runPostDeploymentVerification() {
        const issues = [];
        try {
            // 基本的なヘルスチェック
            const healthCheck = await this.performHealthCheck();
            if (!healthCheck.healthy) {
                issues.push(`Health check failed: ${healthCheck.error}`);
            }
            // パフォーマンス検証
            const performanceCheck = await this.performanceMonitor.quickPerformanceCheck();
            if (!performanceCheck.withinThresholds) {
                issues.push('Performance degradation detected after deployment');
            }
            // 重要機能の動作確認
            const functionalityCheck = await this.verifyCriticalFunctionality();
            if (!functionalityCheck.allWorking) {
                issues.push('Critical functionality issues detected');
            }
            return {
                success: issues.length === 0,
                issues
            };
        }
        catch (error) {
            issues.push(`Post-deployment verification failed: ${error.message}`);
            return { success: false, issues };
        }
    }
    /**
     * ヘルスチェックの実行
     */
    async performHealthCheck() {
        try {
            // システムの基本的な動作確認
            await this.qualityController.runBasicHealthCheck();
            return { healthy: true };
        }
        catch (error) {
            return { healthy: false, error: error.message };
        }
    }
    /**
     * 重要機能の動作確認
     */
    async verifyCriticalFunctionality() {
        const failures = [];
        try {
            // Trust判定エンジンの動作確認
            const trustEngineCheck = await this.testManager.runCriticalFunctionalityTests();
            if (!trustEngineCheck.success) {
                failures.push('Trust decision engine verification failed');
            }
            // 監査ログの動作確認
            const auditLogCheck = await this.testManager.runAuditLogTests();
            if (!auditLogCheck.success) {
                failures.push('Audit logging verification failed');
            }
            return {
                allWorking: failures.length === 0,
                failures
            };
        }
        catch (error) {
            failures.push(`Critical functionality verification error: ${error.message}`);
            return { allWorking: false, failures };
        }
    }
    /**
     * 準備状況レポートの保存
     */
    async saveReadinessReport(readiness) {
        const timestamp = readiness.timestamp.toISOString().split('T')[0];
        const reportFile = join(this.reportsDir, `deployment-readiness-${timestamp}.md`);
        const report = this.generateReadinessReport(readiness);
        await fs.writeFile(reportFile, report);
    }
    /**
     * 準備状況レポートの生成
     */
    generateReadinessReport(readiness) {
        const { ready, score, blockers, warnings, qualityGates, timestamp } = readiness;
        let report = `# Deployment Readiness Report

**Generated:** ${timestamp.toISOString()}
**Status:** ${ready ? '✅ READY' : '🚫 NOT READY'}
**Score:** ${score}/100

## Summary

${ready ?
            '🎉 **Deployment is approved!** All critical quality gates have passed.' :
            '⚠️ **Deployment is blocked.** Critical issues must be resolved before deployment.'}

## Quality Gates

`;
        qualityGates.forEach(gate => {
            const status = gate.status === 'pass' ? '✅' : gate.status === 'fail' ? '❌' : '⚠️';
            const blocking = gate.blocking ? ' (BLOCKING)' : '';
            report += `### ${status} ${gate.name}${blocking}\n\n`;
            gate.criteria.forEach(criteria => {
                const criteriaStatus = criteria.passed ? '✅' : '❌';
                report += `- ${criteriaStatus} **${criteria.metric}**: ${criteria.actual} ${criteria.operator} ${criteria.threshold}\n`;
            });
            report += '\n';
        });
        if (blockers.length > 0) {
            report += `## 🚫 Deployment Blockers (${blockers.length})

`;
            blockers.forEach((blocker, index) => {
                report += `### ${index + 1}. ${blocker.description}

**Category:** ${blocker.category}
**Impact:** ${blocker.impact}
**Resolution:** ${blocker.resolution}
**Auto-fixable:** ${blocker.autoFixable ? 'Yes' : 'No'}

`;
            });
        }
        if (warnings.length > 0) {
            report += `## ⚠️ Warnings (${warnings.length})

`;
            warnings.forEach((warning, index) => {
                report += `### ${index + 1}. ${warning.description}

**Category:** ${warning.category}
**Recommendation:** ${warning.recommendation}

`;
            });
        }
        report += `## Recommendations

`;
        readiness.recommendations.forEach(rec => {
            report += `${rec}\n`;
        });
        return report;
    }
}
