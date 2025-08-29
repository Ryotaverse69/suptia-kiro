/**
 * ReportGenerator のテスト
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import { join } from 'path';
import { ReportGenerator } from '../report-generator.js';
import { TrustPolicy, RiskLevel } from '../types.js';

// fsモジュールをモック
vi.mock('fs', () => ({
  promises: {
    mkdir: vi.fn(),
    writeFile: vi.fn()
  }
}));

describe('ReportGenerator', () => {
  let reportGenerator: ReportGenerator;
  let mockFs: any;
  const testReportsDir = '.kiro/test-reports';

  beforeEach(() => {
    reportGenerator = new ReportGenerator(testReportsDir);
    mockFs = vi.mocked(fs);
    mockFs.mkdir.mockResolvedValue(undefined);
    mockFs.writeFile.mockResolvedValue(undefined);
    
    // console.logをモック
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const createSamplePolicy = (overrides: Partial<TrustPolicy> = {}): TrustPolicy => ({
    version: '1.0',
    lastUpdated: '2025-08-27T10:00:00Z',
    autoApprove: {
      gitOperations: ['status', 'commit', 'push'],
      fileOperations: ['read', 'write'],
      cliOperations: {
        vercel: ['env ls', 'status']
      },
      scriptExecution: {
        extensions: ['.mjs'],
        allowedPaths: ['scripts/']
      }
    },
    manualApprove: {
      deleteOperations: ['rm -rf', 'git branch -D'],
      forceOperations: ['git push --force'],
      productionImpact: ['github:write', 'sanity-dev:write']
    },
    security: {
      maxAutoApprovalPerHour: 1000,
      suspiciousPatternDetection: true,
      logAllOperations: true
    },
    ...overrides
  });

  describe('generatePolicyUpdateReport', () => {
    it('基本的なレポート生成ができる', async () => {
      const previousPolicy = createSamplePolicy();
      const newPolicy = createSamplePolicy({
        version: '1.1',
        autoApprove: {
          ...previousPolicy.autoApprove,
          gitOperations: ['status', 'commit', 'push', 'pull'] // pullを追加
        }
      });

      const report = await reportGenerator.generatePolicyUpdateReport(
        previousPolicy,
        newPolicy,
        'test-user'
      );

      expect(report).toBeDefined();
      expect(report.id).toMatch(/^trust-policy-\d+-[a-z0-9]+$/);
      expect(report.timestamp).toBeInstanceOf(Date);
      expect(report.previousPolicy).toEqual(previousPolicy);
      expect(report.newPolicy).toEqual(newPolicy);
      expect(report.generatedBy).toBe('test-user');
      expect(report.changes).toHaveLength(1);
      expect(report.changes[0].description).toContain('pull');
    });

    it('変更がない場合は空の変更リストを返す', async () => {
      const policy = createSamplePolicy();

      const report = await reportGenerator.generatePolicyUpdateReport(
        policy,
        policy,
        'test-user'
      );

      expect(report.changes).toHaveLength(0);
      expect(report.impactAnalysis.affectedOperations).toHaveLength(0);
    });

    it('複数の変更を正しく検出する', async () => {
      const previousPolicy = createSamplePolicy();
      const newPolicy = createSamplePolicy({
        version: '1.1',
        autoApprove: {
          ...previousPolicy.autoApprove,
          gitOperations: ['status', 'commit', 'push', 'pull'], // pullを追加
          fileOperations: ['read', 'write', 'create'] // createを追加
        },
        security: {
          ...previousPolicy.security,
          maxAutoApprovalPerHour: 2000 // 1000から2000に変更
        }
      });

      const report = await reportGenerator.generatePolicyUpdateReport(
        previousPolicy,
        newPolicy,
        'test-user'
      );

      expect(report.changes).toHaveLength(3); // git, file, security
      
      const gitChange = report.changes.find(c => c.field === 'gitOperations');
      expect(gitChange?.changeType).toBe('added');
      expect(gitChange?.newValue).toEqual(['pull']);

      const fileChange = report.changes.find(c => c.field === 'fileOperations');
      expect(fileChange?.changeType).toBe('added');
      expect(fileChange?.newValue).toEqual(['create']);

      const securityChange = report.changes.find(c => c.field === 'maxAutoApprovalPerHour');
      expect(securityChange?.changeType).toBe('modified');
      expect(securityChange?.previousValue).toBe(1000);
      expect(securityChange?.newValue).toBe(2000);
    });

    it('削除操作の変更を正しく検出する', async () => {
      const previousPolicy = createSamplePolicy();
      const newPolicy = createSamplePolicy({
        version: '1.1',
        autoApprove: {
          ...previousPolicy.autoApprove,
          gitOperations: ['status', 'commit'] // pushを削除
        }
      });

      const report = await reportGenerator.generatePolicyUpdateReport(
        previousPolicy,
        newPolicy,
        'test-user'
      );

      const gitChange = report.changes.find(c => c.field === 'gitOperations');
      expect(gitChange?.changeType).toBe('removed');
      expect(gitChange?.previousValue).toEqual(['push']);
    });

    it('CLI操作の変更を正しく検出する', async () => {
      const previousPolicy = createSamplePolicy();
      const newPolicy = createSamplePolicy({
        version: '1.1',
        autoApprove: {
          ...previousPolicy.autoApprove,
          cliOperations: {
            vercel: ['env ls', 'status', 'deployments ls'], // deployments lsを追加
            git: ['status'] // 新しいツールを追加
          }
        }
      });

      const report = await reportGenerator.generatePolicyUpdateReport(
        previousPolicy,
        newPolicy,
        'test-user'
      );

      const vercelChange = report.changes.find(c => 
        c.field === 'cliOperations' && 
        c.description.includes('vercel')
      );
      expect(vercelChange?.changeType).toBe('added');

      const gitChange = report.changes.find(c => 
        c.field === 'cliOperations' && 
        c.description.includes('git')
      );
      expect(gitChange?.changeType).toBe('added');
    });

    it('手動承認設定の変更を正しく検出する', async () => {
      const previousPolicy = createSamplePolicy();
      const newPolicy = createSamplePolicy({
        version: '1.1',
        manualApprove: {
          ...previousPolicy.manualApprove,
          deleteOperations: [...previousPolicy.manualApprove.deleteOperations, 'vercel env rm'],
          forceOperations: [] // 全て削除
        }
      });

      const report = await reportGenerator.generatePolicyUpdateReport(
        previousPolicy,
        newPolicy,
        'test-user'
      );

      const deleteChange = report.changes.find(c => c.field === 'deleteOperations');
      expect(deleteChange?.changeType).toBe('added');
      expect(deleteChange?.newValue).toEqual(['vercel env rm']);

      const forceChange = report.changes.find(c => c.field === 'forceOperations');
      expect(forceChange?.changeType).toBe('removed');
      expect(forceChange?.previousValue).toEqual(['git push --force']);
    });

    it('セキュリティ設定の変更を正しく検出する', async () => {
      const previousPolicy = createSamplePolicy();
      const newPolicy = createSamplePolicy({
        version: '1.1',
        security: {
          maxAutoApprovalPerHour: 500, // 1000から500に変更
          suspiciousPatternDetection: false, // trueからfalseに変更
          logAllOperations: true // 変更なし
        }
      });

      const report = await reportGenerator.generatePolicyUpdateReport(
        previousPolicy,
        newPolicy,
        'test-user'
      );

      const maxApprovalChange = report.changes.find(c => c.field === 'maxAutoApprovalPerHour');
      expect(maxApprovalChange?.changeType).toBe('modified');
      expect(maxApprovalChange?.previousValue).toBe(1000);
      expect(maxApprovalChange?.newValue).toBe(500);

      const detectionChange = report.changes.find(c => c.field === 'suspiciousPatternDetection');
      expect(detectionChange?.changeType).toBe('modified');
      expect(detectionChange?.previousValue).toBe(true);
      expect(detectionChange?.newValue).toBe(false);
    });
  });

  describe('影響分析', () => {
    it('セキュリティ影響を正しく分析する', async () => {
      const previousPolicy = createSamplePolicy();
      const newPolicy = createSamplePolicy({
        version: '1.1',
        manualApprove: {
          ...previousPolicy.manualApprove,
          deleteOperations: [] // 削除操作の手動承認を削除（危険）
        },
        security: {
          ...previousPolicy.security,
          suspiciousPatternDetection: false // 不審パターン検出を無効化（危険）
        }
      });

      const report = await reportGenerator.generatePolicyUpdateReport(
        previousPolicy,
        newPolicy,
        'test-user'
      );

      expect(report.impactAnalysis.securityImpact.level).toBe(RiskLevel.HIGH);
      expect(report.impactAnalysis.securityImpact.description).toContain('手動承認の削除');
      expect(report.impactAnalysis.securityImpact.description).toContain('不審パターン検出の無効化');
      expect(report.impactAnalysis.securityImpact.mitigations).toContain('定期的な監査ログの確認');
    });

    it('パフォーマンス影響を正しく分析する', async () => {
      const previousPolicy = createSamplePolicy();
      const newPolicy = createSamplePolicy({
        version: '1.1',
        autoApprove: {
          ...previousPolicy.autoApprove,
          gitOperations: [...previousPolicy.autoApprove.gitOperations, 'pull', 'merge'], // 2つ追加
          fileOperations: [...previousPolicy.autoApprove.fileOperations, 'create', 'delete'] // 2つ追加
        }
      });

      const report = await reportGenerator.generatePolicyUpdateReport(
        previousPolicy,
        newPolicy,
        'test-user'
      );

      expect(report.impactAnalysis.performanceImpact.expectedAutoApprovalRateChange).toBeGreaterThan(0);
      expect(report.impactAnalysis.performanceImpact.expectedResponseTimeChange).toBeLessThan(0); // 短縮
      expect(report.impactAnalysis.performanceImpact.description).toContain('効率向上');
    });

    it('ユーザーエクスペリエンス影響を正しく分析する', async () => {
      const previousPolicy = createSamplePolicy();
      const newPolicy = createSamplePolicy({
        version: '1.1',
        autoApprove: {
          ...previousPolicy.autoApprove,
          gitOperations: [...previousPolicy.autoApprove.gitOperations, 'pull'] // 自動承認を追加
        },
        manualApprove: {
          ...previousPolicy.manualApprove,
          deleteOperations: [...previousPolicy.manualApprove.deleteOperations, 'vercel env rm'] // 手動承認を追加
        }
      });

      const report = await reportGenerator.generatePolicyUpdateReport(
        previousPolicy,
        newPolicy,
        'test-user'
      );

      // 自動承認追加でダイアログ減少、手動承認追加でダイアログ増加
      expect(report.impactAnalysis.userExperienceImpact.trustDialogFrequencyChange).toBeLessThan(0); // 全体的には減少
      expect(report.impactAnalysis.userExperienceImpact.workflowDisruptionLevel).toBe('minimal');
    });
  });

  describe('期待効果分析', () => {
    it('自動承認増加時の期待効果を正しく分析する', async () => {
      const previousPolicy = createSamplePolicy();
      const newPolicy = createSamplePolicy({
        version: '1.1',
        autoApprove: {
          ...previousPolicy.autoApprove,
          gitOperations: [...previousPolicy.autoApprove.gitOperations, 'pull', 'merge']
        }
      });

      const report = await reportGenerator.generatePolicyUpdateReport(
        previousPolicy,
        newPolicy,
        'test-user'
      );

      const performanceEffect = report.expectedEffects.find(e => e.category === 'performance');
      expect(performanceEffect).toBeDefined();
      expect(performanceEffect?.description).toContain('開発効率');
      expect(performanceEffect?.timeframe).toBe('immediate');
      expect(performanceEffect?.measurable).toBe(true);
      expect(performanceEffect?.metrics).toContain('自動承認率');

      const usabilityEffect = report.expectedEffects.find(e => e.category === 'usability');
      expect(usabilityEffect).toBeDefined();
      expect(usabilityEffect?.description).toContain('作業フローの中断が軽減');
    });

    it('セキュリティリスク増加時の期待効果を正しく分析する', async () => {
      const previousPolicy = createSamplePolicy();
      const newPolicy = createSamplePolicy({
        version: '1.1',
        manualApprove: {
          ...previousPolicy.manualApprove,
          deleteOperations: [] // 危険操作の手動承認を削除
        }
      });

      const report = await reportGenerator.generatePolicyUpdateReport(
        previousPolicy,
        newPolicy,
        'test-user'
      );

      const securityEffect = report.expectedEffects.find(e => e.category === 'security');
      expect(securityEffect).toBeDefined();
      expect(securityEffect?.description).toContain('適切な監視と対策が必要');
      expect(securityEffect?.timeframe).toBe('immediate');
      expect(securityEffect?.metrics).toContain('セキュリティインシデント数');
    });
  });

  describe('ファイル保存', () => {
    it('レポートファイルを正しく保存する', async () => {
      const previousPolicy = createSamplePolicy();
      const newPolicy = createSamplePolicy({ version: '1.1' });

      await reportGenerator.generatePolicyUpdateReport(
        previousPolicy,
        newPolicy,
        'test-user'
      );

      expect(mockFs.mkdir).toHaveBeenCalledWith(testReportsDir, { recursive: true });
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringMatching(new RegExp(`${testReportsDir}/trust-policy-update-\\d{4}-\\d{2}-\\d{2}\\.md`)),
        expect.stringContaining('# Trust承認ポリシー更新レポート'),
        'utf-8'
      );
    });

    it('ファイル保存エラーを適切に処理する', async () => {
      mockFs.writeFile.mockRejectedValue(new Error('Permission denied'));

      const previousPolicy = createSamplePolicy();
      const newPolicy = createSamplePolicy({ version: '1.1' });

      await expect(
        reportGenerator.generatePolicyUpdateReport(previousPolicy, newPolicy, 'test-user')
      ).rejects.toThrow('レポートファイルの保存に失敗しました');
    });
  });

  describe('Markdownレポート生成', () => {
    it('完全なMarkdownレポートを生成する', async () => {
      const previousPolicy = createSamplePolicy();
      const newPolicy = createSamplePolicy({
        version: '1.1',
        autoApprove: {
          ...previousPolicy.autoApprove,
          gitOperations: [...previousPolicy.autoApprove.gitOperations, 'pull']
        }
      });

      await reportGenerator.generatePolicyUpdateReport(
        previousPolicy,
        newPolicy,
        'test-user'
      );

      const writeCall = mockFs.writeFile.mock.calls[0];
      const markdownContent = writeCall[1] as string;

      expect(markdownContent).toContain('# Trust承認ポリシー更新レポート');
      expect(markdownContent).toContain('## 基本情報');
      expect(markdownContent).toContain('## 変更概要');
      expect(markdownContent).toContain('## 影響範囲分析');
      expect(markdownContent).toContain('## 期待効果');
      expect(markdownContent).toContain('## 推奨事項');
      expect(markdownContent).toContain('## 設定変更詳細');
      expect(markdownContent).toContain('pull');
    });

    it('変更がない場合のMarkdownレポートを生成する', async () => {
      const policy = createSamplePolicy();

      await reportGenerator.generatePolicyUpdateReport(
        policy,
        policy,
        'test-user'
      );

      const writeCall = mockFs.writeFile.mock.calls[0];
      const markdownContent = writeCall[1] as string;

      expect(markdownContent).toContain('変更はありません');
      expect(markdownContent).toContain('影響を受ける操作はありません');
    });
  });

  describe('エラーハンドリング', () => {
    it('ディレクトリ作成エラーを適切に処理する', async () => {
      mockFs.mkdir.mockRejectedValue(new Error('Permission denied'));

      const previousPolicy = createSamplePolicy();
      const newPolicy = createSamplePolicy({ version: '1.1' });

      await expect(
        reportGenerator.generatePolicyUpdateReport(previousPolicy, newPolicy, 'test-user')
      ).rejects.toThrow('レポートファイルの保存に失敗しました');
    });

    it('不正なポリシーデータを適切に処理する', async () => {
      const previousPolicy = createSamplePolicy();
      const newPolicy = {
        ...createSamplePolicy({ version: '1.1' }),
        autoApprove: {
          ...createSamplePolicy().autoApprove,
          gitOperations: null as any // 不正なデータ
        }
      };

      // エラーが発生せず、適切にnullを処理することを確認
      const report = await reportGenerator.generatePolicyUpdateReport(
        previousPolicy,
        newPolicy,
        'test-user'
      );

      expect(report).toBeDefined();
      expect(report.changes).toBeDefined();
    });
  });
});