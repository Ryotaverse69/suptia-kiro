import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import { join } from 'path';
import { DeploymentReadinessChecker, DeploymentReadiness, DeploymentBlocker, DeploymentWarning } from '../deployment-readiness-checker.js';

// モックの設定
vi.mock('../quality-assurance-controller.js', () => ({
  QualityAssuranceController: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    runQualityCheck: vi.fn().mockResolvedValue({
      overall: 'pass',
      componentInitialization: { successRate: 100 }
    }),
    runBasicHealthCheck: vi.fn().mockResolvedValue(undefined)
  }))
}));

vi.mock('../performance-monitor.js', () => ({
  PerformanceMonitor: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    checkPerformanceThresholds: vi.fn().mockResolvedValue({
      averageDecisionTime: 80,
      memoryUsage: 256
    }),
    quickPerformanceCheck: vi.fn().mockResolvedValue({
      withinThresholds: true
    })
  }))
}));

vi.mock('../test-framework-manager.js', () => ({
  TestFrameworkManager: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    runAllTests: vi.fn().mockResolvedValue({
      acceptance: {
        totalTests: 10,
        passedTests: 10
      },
      coverage: {
        percentage: 85
      }
    }),
    runCriticalFunctionalityTests: vi.fn().mockResolvedValue({
      success: true
    }),
    runAuditLogTests: vi.fn().mockResolvedValue({
      success: true
    })
  }))
}));

describe('DeploymentReadinessChecker', () => {
  let checker: DeploymentReadinessChecker;
  let testDir: string;

  beforeEach(async () => {
    testDir = join(process.cwd(), '.kiro', 'test-reports');
    await fs.mkdir(testDir, { recursive: true });
    
    checker = new DeploymentReadinessChecker();
    await checker.initialize();
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // テストディレクトリの削除に失敗しても続行
    }
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      const newChecker = new DeploymentReadinessChecker();
      await expect(newChecker.initialize()).resolves.not.toThrow();
    });

    it('should create reports directory', async () => {
      const newChecker = new DeploymentReadinessChecker();
      await newChecker.initialize();
      
      const reportsDir = '.kiro/reports';
      const stats = await fs.stat(reportsDir);
      expect(stats.isDirectory()).toBe(true);
    });
  });

  describe('checkDeploymentReadiness', () => {
    it('should return ready status when all quality gates pass', async () => {
      const readiness = await checker.checkDeploymentReadiness();

      expect(readiness.ready).toBe(true);
      expect(readiness.score).toBeGreaterThan(90);
      expect(readiness.blockers).toHaveLength(0);
      expect(readiness.qualityGates).toHaveLength(3);
      expect(readiness.timestamp).toBeInstanceOf(Date);
    });

    it('should identify blockers when critical tests fail', async () => {
      // モックを更新して失敗ケースをシミュレート
      const mockTestManager = vi.mocked(checker['testManager']);
      mockTestManager.runAllTests.mockResolvedValueOnce({
        acceptance: {
          totalTests: 10,
          passedTests: 8 // 2つのテストが失敗
        },
        coverage: {
          percentage: 85
        }
      });

      const readiness = await checker.checkDeploymentReadiness();

      expect(readiness.ready).toBe(false);
      expect(readiness.blockers.length).toBeGreaterThan(0);
      expect(readiness.score).toBeLessThan(100);
    });

    it('should identify warnings for non-blocking quality issues', async () => {
      // モックを更新して警告ケースをシミュレート
      const mockTestManager = vi.mocked(checker['testManager']);
      mockTestManager.runAllTests.mockResolvedValueOnce({
        acceptance: {
          totalTests: 10,
          passedTests: 10
        },
        coverage: {
          percentage: 75 // 閾値以下
        }
      });

      const readiness = await checker.checkDeploymentReadiness();

      expect(readiness.ready).toBe(true); // 非ブロッキングなので準備完了
      expect(readiness.warnings.length).toBeGreaterThan(0);
      expect(readiness.warnings[0].category).toBe('test_coverage');
    });

    it('should calculate readiness score correctly', async () => {
      const readiness = await checker.checkDeploymentReadiness();

      expect(readiness.score).toBeGreaterThanOrEqual(0);
      expect(readiness.score).toBeLessThanOrEqual(100);
      expect(typeof readiness.score).toBe('number');
    });

    it('should generate appropriate recommendations', async () => {
      const readiness = await checker.checkDeploymentReadiness();

      expect(readiness.recommendations).toBeInstanceOf(Array);
      expect(readiness.recommendations.length).toBeGreaterThan(0);
      expect(readiness.recommendations.some(rec => rec.includes('✅'))).toBe(true);
    });

    it('should save readiness report to file', async () => {
      await checker.checkDeploymentReadiness();

      const reportsDir = '.kiro/reports';
      const files = await fs.readdir(reportsDir);
      const reportFiles = files.filter(file => file.startsWith('deployment-readiness-'));
      
      expect(reportFiles.length).toBeGreaterThan(0);
    });
  });

  describe('quality gate evaluation', () => {
    it('should evaluate critical functionality gate correctly', async () => {
      const readiness = await checker.checkDeploymentReadiness();
      
      const criticalGate = readiness.qualityGates.find(gate => gate.name === 'Critical Functionality');
      expect(criticalGate).toBeDefined();
      expect(criticalGate?.blocking).toBe(true);
      expect(criticalGate?.status).toBe('pass');
    });

    it('should evaluate performance standards gate correctly', async () => {
      const readiness = await checker.checkDeploymentReadiness();
      
      const performanceGate = readiness.qualityGates.find(gate => gate.name === 'Performance Standards');
      expect(performanceGate).toBeDefined();
      expect(performanceGate?.blocking).toBe(true);
      expect(performanceGate?.status).toBe('pass');
    });

    it('should evaluate quality metrics gate correctly', async () => {
      const readiness = await checker.checkDeploymentReadiness();
      
      const qualityGate = readiness.qualityGates.find(gate => gate.name === 'Quality Metrics');
      expect(qualityGate).toBeDefined();
      expect(qualityGate?.blocking).toBe(false);
      expect(qualityGate?.status).toBe('pass');
    });
  });

  describe('grantDeploymentPermission', () => {
    it('should grant permission when deployment is ready', async () => {
      const readiness = await checker.checkDeploymentReadiness();
      
      if (readiness.ready) {
        const permission = await checker.grantDeploymentPermission(readiness);

        expect(permission.granted).toBe(true);
        expect(permission.grantedAt).toBeInstanceOf(Date);
        expect(permission.validUntil).toBeInstanceOf(Date);
        expect(permission.conditions).toBeInstanceOf(Array);
        expect(permission.approver).toBe('Quality Assurance System');
      }
    });

    it('should reject permission when deployment is not ready', async () => {
      const notReadyReadiness: DeploymentReadiness = {
        ready: false,
        score: 50,
        blockers: [{
          id: 'test-blocker',
          category: 'critical_test_failure',
          description: 'Test failure',
          impact: 'High',
          resolution: 'Fix tests',
          autoFixable: false
        }],
        warnings: [],
        recommendations: [],
        qualityGates: [],
        timestamp: new Date()
      };

      await expect(checker.grantDeploymentPermission(notReadyReadiness))
        .rejects.toThrow('Cannot grant deployment permission: deployment blockers exist');
    });

    it('should save permission to file', async () => {
      const readiness = await checker.checkDeploymentReadiness();
      
      if (readiness.ready) {
        await checker.grantDeploymentPermission(readiness);

        const reportsDir = '.kiro/reports';
        const files = await fs.readdir(reportsDir);
        const permissionFiles = files.filter(file => file.startsWith('deployment-permission-'));
        
        expect(permissionFiles.length).toBeGreaterThan(0);
      }
    });
  });

  describe('runPostDeploymentVerification', () => {
    it('should run post-deployment verification successfully', async () => {
      const result = await checker.runPostDeploymentVerification();

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('issues');
      expect(result.issues).toBeInstanceOf(Array);
    });

    it('should detect issues when health check fails', async () => {
      // モックを更新してヘルスチェック失敗をシミュレート
      const mockQualityController = vi.mocked(checker['qualityController']);
      mockQualityController.runBasicHealthCheck.mockRejectedValueOnce(new Error('Health check failed'));

      const result = await checker.runPostDeploymentVerification();

      expect(result.success).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues.some(issue => issue.includes('Health check failed'))).toBe(true);
    });

    it('should detect performance issues after deployment', async () => {
      // モックを更新してパフォーマンス問題をシミュレート
      const mockPerformanceMonitor = vi.mocked(checker['performanceMonitor']);
      mockPerformanceMonitor.quickPerformanceCheck.mockResolvedValueOnce({
        withinThresholds: false
      });

      const result = await checker.runPostDeploymentVerification();

      expect(result.success).toBe(false);
      expect(result.issues.some(issue => issue.includes('Performance degradation'))).toBe(true);
    });
  });

  describe('blocker and warning categorization', () => {
    it('should categorize blockers correctly', async () => {
      // テスト失敗をシミュレート
      const mockTestManager = vi.mocked(checker['testManager']);
      mockTestManager.runAllTests.mockResolvedValueOnce({
        acceptance: {
          totalTests: 10,
          passedTests: 8
        },
        coverage: {
          percentage: 85
        }
      });

      const readiness = await checker.checkDeploymentReadiness();

      if (readiness.blockers.length > 0) {
        const testBlocker = readiness.blockers.find(b => b.category === 'critical_test_failure');
        expect(testBlocker).toBeDefined();
      }
    });

    it('should categorize warnings correctly', async () => {
      // カバレッジ不足をシミュレート
      const mockTestManager = vi.mocked(checker['testManager']);
      mockTestManager.runAllTests.mockResolvedValueOnce({
        acceptance: {
          totalTests: 10,
          passedTests: 10
        },
        coverage: {
          percentage: 75
        }
      });

      const readiness = await checker.checkDeploymentReadiness();

      const coverageWarning = readiness.warnings.find(w => w.category === 'test_coverage');
      expect(coverageWarning).toBeDefined();
    });
  });

  describe('report generation', () => {
    it('should generate comprehensive readiness report', async () => {
      const readiness = await checker.checkDeploymentReadiness();

      const reportsDir = '.kiro/reports';
      const files = await fs.readdir(reportsDir);
      const reportFile = files.find(file => file.startsWith('deployment-readiness-'));
      
      if (reportFile) {
        const reportContent = await fs.readFile(join(reportsDir, reportFile), 'utf-8');
        
        expect(reportContent).toContain('# Deployment Readiness Report');
        expect(reportContent).toContain('## Quality Gates');
        expect(reportContent).toContain('## Recommendations');
        expect(reportContent).toContain(readiness.ready ? '✅ READY' : '🚫 NOT READY');
      }
    });

    it('should include all quality gates in report', async () => {
      const readiness = await checker.checkDeploymentReadiness();

      const reportsDir = '.kiro/reports';
      const files = await fs.readdir(reportsDir);
      const reportFile = files.find(file => file.startsWith('deployment-readiness-'));
      
      if (reportFile) {
        const reportContent = await fs.readFile(join(reportsDir, reportFile), 'utf-8');
        
        expect(reportContent).toContain('Critical Functionality');
        expect(reportContent).toContain('Performance Standards');
        expect(reportContent).toContain('Quality Metrics');
      }
    });
  });

  describe('error handling', () => {
    it('should handle initialization errors gracefully', async () => {
      // ファイルシステムエラーをシミュレート
      vi.spyOn(fs, 'mkdir').mockRejectedValueOnce(new Error('Permission denied'));

      const newChecker = new DeploymentReadinessChecker();
      await expect(newChecker.initialize()).rejects.toThrow('Failed to initialize DeploymentReadinessChecker');
    });

    it('should handle quality check errors gracefully', async () => {
      // 品質チェックエラーをシミュレート
      const mockQualityController = vi.mocked(checker['qualityController']);
      mockQualityController.runQualityCheck.mockRejectedValueOnce(new Error('Quality check failed'));

      await expect(checker.checkDeploymentReadiness()).rejects.toThrow('Failed to check deployment readiness');
    });

    it('should handle post-deployment verification errors gracefully', async () => {
      // 検証エラーをシミュレート
      const mockQualityController = vi.mocked(checker['qualityController']);
      mockQualityController.runBasicHealthCheck.mockRejectedValueOnce(new Error('Verification failed'));

      const result = await checker.runPostDeploymentVerification();

      expect(result.success).toBe(false);
      expect(result.issues.some(issue => issue.includes('Post-deployment verification failed'))).toBe(true);
    });
  });
});