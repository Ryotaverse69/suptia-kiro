/**
 * ReportGenerator 統合テスト
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import { join } from 'path';
import { ReportGenerator } from '../report-generator.js';
import { PolicyManager } from '../policy-manager.js';
import { TrustPolicy } from '../types.js';

// fsモジュールをモック
vi.mock('fs', () => ({
  promises: {
    mkdir: vi.fn(),
    writeFile: vi.fn(),
    readFile: vi.fn(),
    appendFile: vi.fn()
  }
}));

describe('ReportGenerator Integration Tests', () => {
  let reportGenerator: ReportGenerator;
  let policyManager: PolicyManager;
  let mockFs: any;
  const testReportsDir = '.kiro/test-reports';

  beforeEach(() => {
    reportGenerator = new ReportGenerator(testReportsDir);
    policyManager = new PolicyManager(testReportsDir);
    mockFs = vi.mocked(fs);
    
    // デフォルトのモック設定
    mockFs.mkdir.mockResolvedValue(undefined);
    mockFs.writeFile.mockResolvedValue(undefined);
    mockFs.readFile.mockResolvedValue('{}');
    mockFs.appendFile.mockResolvedValue(undefined);
    
    // console.logをモック
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
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

  describe('PolicyManager統合', () => {
    it('ポリシー更新時に自動的にレポートが生成される', async () => {
      const previousPolicy = createSamplePolicy();
      const newPolicy = createSamplePolicy({
        version: '1.1',
        autoApprove: {
          ...previousPolicy.autoApprove,
          gitOperations: [...previousPolicy.autoApprove.gitOperations, 'pull']
        }
      });

      // 既存ポリシーの読み込みをモック
      mockFs.readFile.mockResolvedValueOnce(JSON.stringify(previousPolicy));

      await policyManager.updatePolicy(newPolicy, true);

      // ポリシーファイルの書き込みが実行されたことを確認
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        '.kiro/settings/trust-policy.json',
        expect.stringContaining('"version": "1.1"'),
        'utf-8'
      );

      // レポートファイルの書き込みが実行されたことを確認
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringMatching(new RegExp(`${testReportsDir}/trust-policy-update-\\d{4}-\\d{2}-\\d{2}\\.md`)),
        expect.stringContaining('# Trust承認ポリシー更新レポート'),
        'utf-8'
      );
    });

    it('レポート生成を無効にしてポリシー更新ができる', async () => {
      const policy = createSamplePolicy({ version: '1.1' });

      await policyManager.updatePolicy(policy, false);

      // ポリシーファイルの書き込みは実行される
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        '.kiro/settings/trust-policy.json',
        expect.stringContaining('"version": "1.1"'),
        'utf-8'
      );

      // レポートファイルの書き込みは実行されない
      const reportCalls = mockFs.writeFile.mock.calls.filter(call => 
        call[0].includes('trust-policy-update-')
      );
      expect(reportCalls).toHaveLength(0);
    });

    it('手動でレポート生成ができる', async () => {
      const previousPolicy = createSamplePolicy();
      const newPolicy = createSamplePolicy({ version: '1.1' });

      await policyManager.generateUpdateReport(previousPolicy, newPolicy, 'manual-user');

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringMatching(new RegExp(`${testReportsDir}/trust-policy-update-\\d{4}-\\d{2}-\\d{2}\\.md`)),
        expect.stringContaining('# Trust承認ポリシー更新レポート'),
        'utf-8'
      );

      const writeCall = mockFs.writeFile.mock.calls.find(call => 
        call[0].includes('trust-policy-update-')
      );
      expect(writeCall[1]).toContain('manual-user');
    });
  });

  describe('エラーハンドリング統合', () => {
    it('レポート生成エラーがポリシー更新を阻害しない', async () => {
      const previousPolicy = createSamplePolicy();
      const newPolicy = createSamplePolicy({ version: '1.1' });

      // 既存ポリシーの読み込みをモック
      mockFs.readFile.mockResolvedValueOnce(JSON.stringify(previousPolicy));
      
      // レポートファイル書き込みでエラーを発生させる
      mockFs.writeFile
        .mockResolvedValueOnce(undefined) // ポリシーファイル書き込みは成功
        .mockRejectedValueOnce(new Error('Disk full')); // レポートファイル書き込みは失敗

      // ポリシー更新は成功するはず
      await expect(policyManager.updatePolicy(newPolicy, true)).resolves.not.toThrow();

      // エラーログが出力されることを確認
      expect(console.error).toHaveBeenCalledWith(
        'Failed to generate policy update report:',
        expect.any(Error)
      );
    });

    it('レポート生成エラーがログに記録される', async () => {
      const previousPolicy = createSamplePolicy();
      const newPolicy = createSamplePolicy({ version: '1.1' });

      // レポート生成でエラーを発生させる
      mockFs.mkdir.mockRejectedValue(new Error('Permission denied'));

      await expect(
        reportGenerator.generatePolicyUpdateReport(previousPolicy, newPolicy, 'test-user')
      ).rejects.toThrow('レポートファイルの保存に失敗しました');
    });

    it('部分的なファイルシステムエラーを適切に処理する', async () => {
      const previousPolicy = createSamplePolicy();
      const newPolicy = createSamplePolicy({ version: '1.1' });

      // ディレクトリ作成は成功、ファイル書き込みは失敗
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockRejectedValue(new Error('No space left on device'));

      await expect(
        reportGenerator.generatePolicyUpdateReport(previousPolicy, newPolicy, 'test-user')
      ).rejects.toThrow('レポートファイルの保存に失敗しました');

      // ディレクトリ作成は実行されたことを確認
      expect(mockFs.mkdir).toHaveBeenCalledWith(testReportsDir, { recursive: true });
    });
  });

  describe('レポート内容の統合検証', () => {
    it('実際のポリシー変更シナリオでレポート内容を検証する', async () => {
      // 実際の運用で発生しそうなポリシー変更をシミュレート
      const previousPolicy = createSamplePolicy();
      const newPolicy = createSamplePolicy({
        version: '2.0',
        autoApprove: {
          gitOperations: ['status', 'commit', 'push', 'pull', 'merge'], // 2つ追加
          fileOperations: ['read', 'write', 'create'], // 1つ追加
          cliOperations: {
            vercel: ['env ls', 'status', 'deployments ls'], // 1つ追加
            git: ['status', 'log'] // 新しいツール追加
          },
          scriptExecution: {
            extensions: ['.mjs', '.js'], // 1つ追加
            allowedPaths: ['scripts/', '.kiro/scripts/'] // 1つ追加
          }
        },
        manualApprove: {
          deleteOperations: ['rm -rf', 'git branch -D', 'vercel env rm'], // 1つ追加
          forceOperations: ['git push --force'], // 変更なし
          productionImpact: ['github:write', 'sanity-dev:write', 'vercel:envSet'] // 1つ追加
        },
        security: {
          maxAutoApprovalPerHour: 2000, // 1000から2000に変更
          suspiciousPatternDetection: false, // trueからfalseに変更（危険）
          logAllOperations: true // 変更なし
        }
      });

      const report = await reportGenerator.generatePolicyUpdateReport(
        previousPolicy,
        newPolicy,
        'integration-test'
      );

      // 変更数の検証
      expect(report.changes.length).toBeGreaterThan(5); // 複数の変更が検出される

      // セキュリティ影響の検証
      expect(report.impactAnalysis.securityImpact.level).toBe('high'); // 不審パターン検出無効化により高リスク

      // パフォーマンス影響の検証
      expect(report.impactAnalysis.performanceImpact.expectedAutoApprovalRateChange).toBeGreaterThan(0); // 自動承認増加

      // ユーザーエクスペリエンス影響の検証
      expect(report.impactAnalysis.userExperienceImpact.trustDialogFrequencyChange).toBeLessThan(0); // ダイアログ減少

      // 期待効果の検証
      expect(report.expectedEffects).toHaveLength(4); // security, performance, usability, maintenance

      // レポートファイルが生成されることを確認
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringMatching(new RegExp(`${testReportsDir}/trust-policy-update-\\d{4}-\\d{2}-\\d{2}\\.md`)),
        expect.stringContaining('# Trust承認ポリシー更新レポート'),
        'utf-8'
      );

      // レポート内容の詳細検証
      const writeCall = mockFs.writeFile.mock.calls.find(call => 
        call[0].includes('trust-policy-update-')
      );
      const markdownContent = writeCall[1] as string;

      expect(markdownContent).toContain('pull');
      expect(markdownContent).toContain('merge');
      expect(markdownContent).toContain('create');
      expect(markdownContent).toContain('deployments ls');
      expect(markdownContent).toContain('vercel env rm');
      expect(markdownContent).toContain('2000');
      expect(markdownContent).toContain('false');
      expect(markdownContent).toContain('高'); // 高リスク
      expect(markdownContent).toContain('効率向上');
    });

    it('変更がない場合のレポート生成を検証する', async () => {
      const policy = createSamplePolicy();

      const report = await reportGenerator.generatePolicyUpdateReport(
        policy,
        policy,
        'no-change-test'
      );

      expect(report.changes).toHaveLength(0);
      expect(report.impactAnalysis.affectedOperations).toHaveLength(0);
      expect(report.impactAnalysis.securityImpact.level).toBe('low');

      // レポートファイルが生成されることを確認
      const writeCall = mockFs.writeFile.mock.calls.find(call => 
        call[0].includes('trust-policy-update-')
      );
      const markdownContent = writeCall[1] as string;

      expect(markdownContent).toContain('変更はありません');
      expect(markdownContent).toContain('影響を受ける操作はありません');
    });
  });

  describe('パフォーマンス統合テスト', () => {
    it('大きなポリシー変更でもレポート生成が完了する', async () => {
      const previousPolicy = createSamplePolicy();
      const newPolicy = createSamplePolicy({
        version: '3.0',
        autoApprove: {
          gitOperations: Array.from({ length: 50 }, (_, i) => `git-op-${i}`),
          fileOperations: Array.from({ length: 30 }, (_, i) => `file-op-${i}`),
          cliOperations: Object.fromEntries(
            Array.from({ length: 10 }, (_, i) => [
              `tool-${i}`,
              Array.from({ length: 20 }, (_, j) => `op-${j}`)
            ])
          ),
          scriptExecution: {
            extensions: Array.from({ length: 10 }, (_, i) => `.ext${i}`),
            allowedPaths: Array.from({ length: 20 }, (_, i) => `path-${i}/`)
          }
        },
        manualApprove: {
          deleteOperations: Array.from({ length: 25 }, (_, i) => `delete-op-${i}`),
          forceOperations: Array.from({ length: 15 }, (_, i) => `force-op-${i}`),
          productionImpact: Array.from({ length: 35 }, (_, i) => `prod-op-${i}`)
        },
        security: {
          maxAutoApprovalPerHour: 5000,
          suspiciousPatternDetection: false,
          logAllOperations: true
        }
      });

      const startTime = Date.now();
      const report = await reportGenerator.generatePolicyUpdateReport(
        previousPolicy,
        newPolicy,
        'performance-test'
      );
      const endTime = Date.now();

      // レポート生成が完了することを確認
      expect(report).toBeDefined();
      expect(report.changes.length).toBeGreaterThan(0);

      // 実行時間が合理的な範囲内であることを確認（10秒以内）
      expect(endTime - startTime).toBeLessThan(10000);

      console.log(`Large policy report generation took ${endTime - startTime}ms`);
    });
  });
});