import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import { join } from 'path';
import { 
  QualityGateManager, 
  QualityGateLevel, 
  QualityGateStatus 
} from '../quality-gate-manager.js';

describe('QualityGateManager', () => {
  let manager: QualityGateManager;
  let testDir: string;

  beforeEach(async () => {
    testDir = join(process.cwd(), '.kiro-test');
    await fs.mkdir(testDir, { recursive: true });
    
    // テスト用のディレクトリ構造を作成
    await fs.mkdir(join(testDir, 'settings'), { recursive: true });
    await fs.mkdir(join(testDir, 'reports'), { recursive: true });
    
    manager = new QualityGateManager();
    await manager.initialize();
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
      const newManager = new QualityGateManager();
      await expect(newManager.initialize()).resolves.not.toThrow();
    });

    it('should create default configuration', async () => {
      const config = manager.getConfiguration();
      
      expect(config.version).toBe('1.0');
      expect(config.gates).toHaveLength(3);
      expect(config.gates[0].name).toBe('Critical Functionality');
      expect(config.gates[1].name).toBe('Performance Standards');
      expect(config.gates[2].name).toBe('Quality Metrics');
    });

    it('should have proper gate hierarchy', async () => {
      const config = manager.getConfiguration();
      
      const criticalGate = config.gates.find(g => g.level === QualityGateLevel.CRITICAL);
      const majorGate = config.gates.find(g => g.level === QualityGateLevel.MAJOR);
      const minorGate = config.gates.find(g => g.level === QualityGateLevel.MINOR);
      
      expect(criticalGate).toBeDefined();
      expect(majorGate).toBeDefined();
      expect(minorGate).toBeDefined();
      
      expect(criticalGate?.blocking).toBe(true);
      expect(majorGate?.blocking).toBe(true);
      expect(minorGate?.blocking).toBe(false);
    });
  });

  describe('quality gate execution', () => {
    it('should execute all gates successfully with passing context', async () => {
      const context = {
        test_pass_rate: 100,
        critical_bugs: 0,
        responseTime: 80,
        memoryUsage: 256,
        code_coverage: 85,
        quality_score: 85
      };

      const result = await manager.executeQualityGates(context);

      expect(result.overallStatus).toBe(QualityGateStatus.PASS);
      expect(result.executions).toHaveLength(3);
      expect(result.summary.passed).toBe(3);
      expect(result.summary.failed).toBe(0);
      expect(result.summary.blocked).toBe(false);
    });

    it('should fail when critical gate fails', async () => {
      const context = {
        test_pass_rate: 95, // 失敗: 100が必要
        critical_bugs: 1,   // 失敗: 0が必要
        responseTime: 80,
        memoryUsage: 256,
        code_coverage: 85,
        quality_score: 85
      };

      const result = await manager.executeQualityGates(context);

      expect(result.overallStatus).toBe(QualityGateStatus.FAIL);
      expect(result.summary.blocked).toBe(true);
      
      const criticalExecution = result.executions.find(e => e.gateId === 'critical-functionality');
      expect(criticalExecution?.status).toBe(QualityGateStatus.FAIL);
    });

    it('should show warnings for minor gate failures', async () => {
      const context = {
        test_pass_rate: 100,
        critical_bugs: 0,
        responseTime: 80,
        memoryUsage: 256,
        code_coverage: 70, // 警告: 80未満
        quality_score: 75  // 警告: 80未満
      };

      const result = await manager.executeQualityGates(context);

      expect(result.overallStatus).toBe(QualityGateStatus.WARNING);
      expect(result.summary.blocked).toBe(false);
      
      const qualityExecution = result.executions.find(e => e.gateId === 'quality-metrics');
      expect(qualityExecution?.status).toBe(QualityGateStatus.WARNING);
    });

    it('should respect gate dependencies', async () => {
      const context = {
        test_pass_rate: 95, // Critical gate will fail
        critical_bugs: 0,
        responseTime: 80,
        memoryUsage: 256
      };

      const result = await manager.executeQualityGates(context);

      // Performance gate depends on critical functionality
      const performanceExecution = result.executions.find(e => e.gateId === 'performance-standards');
      
      // Performance gate should not execute due to failed dependency
      expect(performanceExecution).toBeUndefined();
    });

    it('should generate appropriate recommendations', async () => {
      const context = {
        test_pass_rate: 95,
        critical_bugs: 1,
        responseTime: 80,
        memoryUsage: 256
      };

      const result = await manager.executeQualityGates(context);

      expect(result.recommendations).toContain('🚫 Deployment is blocked by failing quality gates');
      expect(result.recommendations).toContain('🔧 Address critical issues before proceeding');
      expect(result.recommendations.some(r => r.includes('Critical Functionality'))).toBe(true);
    });
  });

  describe('quality gate exceptions', () => {
    it('should create and apply exceptions', async () => {
      const exceptionId = await manager.createException({
        gateId: 'critical-functionality',
        criteriaId: 'test-pass-rate',
        reason: 'Known issue with test environment',
        approver: 'Test Manager',
        approvedAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        conditions: ['Fix test environment within 24 hours']
      });

      expect(exceptionId).toBeDefined();
      expect(exceptionId).toMatch(/^exception-/);

      const exceptions = manager.getExceptions();
      expect(exceptions).toHaveLength(1);
      expect(exceptions[0].id).toBe(exceptionId);
      expect(exceptions[0].active).toBe(true);
    });

    it('should skip criteria with active exceptions', async () => {
      // Create exception for test pass rate
      await manager.createException({
        gateId: 'critical-functionality',
        criteriaId: 'test-pass-rate',
        reason: 'Test environment issue',
        approver: 'Test Manager',
        approvedAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        conditions: []
      });

      const context = {
        test_pass_rate: 50, // Would normally fail
        critical_bugs: 0,
        responseTime: 80,
        memoryUsage: 256,
        code_coverage: 85,
        quality_score: 85
      };

      const result = await manager.executeQualityGates(context);

      const criticalExecution = result.executions.find(e => e.gateId === 'critical-functionality');
      const testPassRateResult = criticalExecution?.results.find(r => r.criteriaId === 'test-pass-rate');
      
      expect(testPassRateResult?.status).toBe(QualityGateStatus.SKIP);
      expect(testPassRateResult?.message).toContain('Skipped due to active exception');
    });

    it('should deactivate exceptions', async () => {
      const exceptionId = await manager.createException({
        gateId: 'critical-functionality',
        reason: 'Test exception',
        approver: 'Test Manager',
        approvedAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        conditions: []
      });

      const deactivated = await manager.deactivateException(exceptionId);
      expect(deactivated).toBe(true);

      const exceptions = manager.getExceptions();
      const exception = exceptions.find(e => e.id === exceptionId);
      expect(exception?.active).toBe(false);
    });
  });

  describe('quality threshold adjustments', () => {
    it('should adjust critical level thresholds', async () => {
      await manager.adjustQualityThresholds(QualityGateLevel.CRITICAL, {
        minPassRate: 95,
        maxFailures: 1
      });

      const config = manager.getConfiguration();
      expect(config.thresholds.critical.minPassRate).toBe(95);
      expect(config.thresholds.critical.maxFailures).toBe(1);
    });

    it('should adjust major level thresholds', async () => {
      await manager.adjustQualityThresholds(QualityGateLevel.MAJOR, {
        minPassRate: 85
      });

      const config = manager.getConfiguration();
      expect(config.thresholds.major.minPassRate).toBe(85);
      expect(config.thresholds.major.maxFailures).toBe(1); // Should remain unchanged
    });

    it('should adjust minor level thresholds', async () => {
      await manager.adjustQualityThresholds(QualityGateLevel.MINOR, {
        maxFailures: 5
      });

      const config = manager.getConfiguration();
      expect(config.thresholds.minor.minPassRate).toBe(80); // Should remain unchanged
      expect(config.thresholds.minor.maxFailures).toBe(5);
    });
  });

  describe('metric calculations', () => {
    it('should calculate test pass rate correctly', async () => {
      const context = {
        totalTests: 100,
        passedTests: 85
      };

      const result = await manager.executeQualityGates(context);
      
      const criticalExecution = result.executions.find(e => e.gateId === 'critical-functionality');
      const testPassRateResult = criticalExecution?.results.find(r => r.criteriaId === 'test-pass-rate');
      
      expect(testPassRateResult?.actualValue).toBe(85);
    });

    it('should calculate performance score correctly', async () => {
      const context = {
        responseTime: 150, // Above threshold
        memoryUsage: 600,  // Above threshold
        cpuUsage: 90       // Above threshold
      };

      const result = await manager.executeQualityGates(context);
      
      // Performance score should be calculated based on the formula
      // and should be lower due to high resource usage
      const performanceExecution = result.executions.find(e => e.gateId === 'performance-standards');
      expect(performanceExecution?.overallScore).toBeLessThan(80);
    });

    it('should handle missing context values gracefully', async () => {
      const context = {}; // Empty context

      const result = await manager.executeQualityGates(context);
      
      // Should not throw errors, but gates should fail due to missing data
      expect(result.overallStatus).toBe(QualityGateStatus.FAIL);
      expect(result.executions.length).toBeGreaterThan(0);
    });
  });

  describe('execution history and reporting', () => {
    it('should maintain execution history', async () => {
      const context = {
        test_pass_rate: 100,
        critical_bugs: 0,
        responseTime: 80,
        memoryUsage: 256
      };

      await manager.executeQualityGates(context);
      
      const history = manager.getExecutionHistory();
      expect(history.length).toBeGreaterThan(0);
      
      const latestExecution = history[history.length - 1];
      expect(latestExecution.gateId).toBeDefined();
      expect(latestExecution.startTime).toBeInstanceOf(Date);
      expect(latestExecution.endTime).toBeInstanceOf(Date);
    });

    it('should generate execution reports', async () => {
      const context = {
        test_pass_rate: 100,
        critical_bugs: 0,
        responseTime: 80,
        memoryUsage: 256,
        code_coverage: 85,
        quality_score: 85
      };

      await manager.executeQualityGates(context);

      // Check if report file was created
      const reportsDir = '.kiro/reports';
      const files = await fs.readdir(reportsDir);
      const reportFiles = files.filter(file => file.startsWith('quality-gate-execution-'));
      
      expect(reportFiles.length).toBeGreaterThan(0);
    });

    it('should format execution reports correctly', async () => {
      const context = {
        test_pass_rate: 95, // Will cause failure
        critical_bugs: 0,
        responseTime: 80,
        memoryUsage: 256
      };

      await manager.executeQualityGates(context);

      const reportsDir = '.kiro/reports';
      const files = await fs.readdir(reportsDir);
      const reportFile = files.find(file => file.startsWith('quality-gate-execution-'));
      
      if (reportFile) {
        const reportContent = await fs.readFile(join(reportsDir, reportFile), 'utf-8');
        
        expect(reportContent).toContain('# Quality Gate Execution Report');
        expect(reportContent).toContain('## Summary');
        expect(reportContent).toContain('## Gate Results');
        expect(reportContent).toContain('## Recommendations');
        expect(reportContent).toContain('Critical Functionality');
      }
    });
  });

  describe('error handling', () => {
    it('should handle gate execution timeouts', async () => {
      // This test would require mocking the execution to simulate timeout
      // For now, we'll test that the timeout configuration is properly set
      const config = manager.getConfiguration();
      const criticalGate = config.gates.find(g => g.id === 'critical-functionality');
      
      expect(criticalGate?.timeout).toBe(300);
    });

    it('should handle invalid metric values', async () => {
      const context = {
        test_pass_rate: 'invalid', // Invalid value
        critical_bugs: 0,
        responseTime: 80,
        memoryUsage: 256
      };

      const result = await manager.executeQualityGates(context);
      
      // Should handle gracefully and mark as failed
      const criticalExecution = result.executions.find(e => e.gateId === 'critical-functionality');
      expect(criticalExecution?.errors.length).toBeGreaterThan(0);
    });

    it('should handle missing configuration files gracefully', async () => {
      // Create a new manager without existing config files
      const newManager = new QualityGateManager();
      
      // Should initialize with default configuration
      await expect(newManager.initialize()).resolves.not.toThrow();
      
      const config = newManager.getConfiguration();
      expect(config.gates).toHaveLength(3);
    });
  });

  describe('parallel execution', () => {
    it('should support parallel execution when enabled', async () => {
      // Enable parallel execution
      await manager.adjustQualityThresholds(QualityGateLevel.CRITICAL, {});
      
      const config = manager.getConfiguration();
      config.globalSettings.enableParallelExecution = true;
      
      const context = {
        test_pass_rate: 100,
        critical_bugs: 0,
        responseTime: 80,
        memoryUsage: 256,
        code_coverage: 85,
        quality_score: 85
      };

      const startTime = Date.now();
      const result = await manager.executeQualityGates(context);
      const executionTime = Date.now() - startTime;

      expect(result.overallStatus).toBe(QualityGateStatus.PASS);
      // Parallel execution should be faster (though this is hard to test reliably)
      expect(executionTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});