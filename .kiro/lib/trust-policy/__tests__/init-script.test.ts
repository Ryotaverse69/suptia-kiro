/**
 * 初期化スクリプトのテスト
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const TEST_DIR = '.kiro-test';
const POLICY_FILE = join(TEST_DIR, 'settings', 'trust-policy.json');
const BACKUP_DIR = join(TEST_DIR, 'backups');
const REPORTS_DIR = join(TEST_DIR, 'reports');

describe('初期化スクリプト', () => {
  beforeEach(async () => {
    // テスト用ディレクトリの作成
    await fs.mkdir(TEST_DIR, { recursive: true });
    await fs.mkdir(join(TEST_DIR, 'settings'), { recursive: true });
    await fs.mkdir(join(TEST_DIR, 'lib', 'trust-policy'), { recursive: true });
    
    // デフォルト設定ファイルをコピー
    const defaultPolicy = await fs.readFile('.kiro/lib/trust-policy/default-policy.json', 'utf-8');
    await fs.writeFile(join(TEST_DIR, 'lib', 'trust-policy', 'default-policy.json'), defaultPolicy);
  });

  afterEach(async () => {
    // テスト用ディレクトリの削除
    try {
      await fs.rm(TEST_DIR, { recursive: true, force: true });
    } catch (error) {
      // 削除に失敗しても続行
    }
  });

  describe('基本的な初期化', () => {
    it('新規環境で初期化が正常に実行される', async () => {
      // 初期化スクリプトの実行（ドライラン）
      const result = execSync(
        `cd ${TEST_DIR} && node ../../../.kiro/scripts/init-trust-policy.mjs --dry-run`,
        { encoding: 'utf-8' }
      );

      expect(result).toContain('Trust承認ポリシーシステムの初期化を開始');
      expect(result).toContain('ドライラン');
    });

    it('デフォルト設定ファイルが正しく作成される', async () => {
      // 初期化スクリプトの実行
      execSync(
        `cd ${TEST_DIR} && node ../../../.kiro/scripts/init-trust-policy.mjs --force`,
        { encoding: 'utf-8' }
      );

      // 設定ファイルの存在確認
      const exists = await fs.access(POLICY_FILE).then(() => true).catch(() => false);
      expect(exists).toBe(true);

      // 設定内容の確認
      const content = await fs.readFile(POLICY_FILE, 'utf-8');
      const policy = JSON.parse(content);

      expect(policy.version).toBe('1.0');
      expect(policy.autoApprove).toBeDefined();
      expect(policy.manualApprove).toBeDefined();
      expect(policy.security).toBeDefined();
    });
  });

  describe('バックアップ機能', () => {
    it('既存設定のバックアップが作成される', async () => {
      // 既存設定を作成
      const existingPolicy = {
        version: '0.9',
        lastUpdated: '2025-08-26T10:00:00Z',
        autoApprove: { gitOperations: ['status'] },
        manualApprove: { deleteOperations: [] },
        security: { maxAutoApprovalPerHour: 500 }
      };
      await fs.writeFile(POLICY_FILE, JSON.stringify(existingPolicy, null, 2));

      // 初期化スクリプトの実行
      execSync(
        `cd ${TEST_DIR} && node ../../../.kiro/scripts/init-trust-policy.mjs --force`,
        { encoding: 'utf-8' }
      );

      // バックアップファイルの存在確認
      const backupFiles = await fs.readdir(BACKUP_DIR);
      const backupFile = backupFiles.find(file => file.startsWith('trust-policy.backup.'));
      
      expect(backupFile).toBeDefined();

      // バックアップ内容の確認
      const backupContent = await fs.readFile(join(BACKUP_DIR, backupFile!), 'utf-8');
      const backupData = JSON.parse(backupContent);
      
      expect(backupData.metadata).toBeDefined();
      expect(backupData.content.version).toBe('0.9');
    });
  });

  describe('段階的移行', () => {
    it('既存設定を保持しつつ新機能を追加する', async () => {
      // 既存設定を作成（古いバージョン）
      const existingPolicy = {
        version: '0.9',
        lastUpdated: '2025-08-26T10:00:00Z',
        autoApprove: {
          gitOperations: ['status', 'commit'],
          fileOperations: ['read', 'write']
        },
        manualApprove: {
          deleteOperations: ['rm -rf']
        },
        security: {
          maxAutoApprovalPerHour: 500,
          suspiciousPatternDetection: false
        }
      };
      await fs.writeFile(POLICY_FILE, JSON.stringify(existingPolicy, null, 2));

      // 段階的移行の実行
      execSync(
        `cd ${TEST_DIR} && node ../../../.kiro/scripts/init-trust-policy.mjs --migrate`,
        { encoding: 'utf-8' }
      );

      // 移行後の設定確認
      const content = await fs.readFile(POLICY_FILE, 'utf-8');
      const migratedPolicy = JSON.parse(content);

      // バージョンが更新されている
      expect(migratedPolicy.version).toBe('1.0');

      // 既存の設定が保持されている
      expect(migratedPolicy.autoApprove.gitOperations).toContain('status');
      expect(migratedPolicy.autoApprove.gitOperations).toContain('commit');

      // 新しいデフォルト設定が追加されている
      expect(migratedPolicy.autoApprove.gitOperations).toContain('push');
      expect(migratedPolicy.autoApprove.gitOperations).toContain('pull');

      // セキュリティ設定が保持されている
      expect(migratedPolicy.security.maxAutoApprovalPerHour).toBe(500);
      expect(migratedPolicy.security.suspiciousPatternDetection).toBe(false);
    });

    it('移行ログが正しく生成される', async () => {
      // 既存設定を作成
      const existingPolicy = {
        version: '0.9',
        autoApprove: { gitOperations: ['status'] },
        manualApprove: { deleteOperations: [] },
        security: { maxAutoApprovalPerHour: 500 }
      };
      await fs.writeFile(POLICY_FILE, JSON.stringify(existingPolicy, null, 2));

      // 段階的移行の実行
      execSync(
        `cd ${TEST_DIR} && node ../../../.kiro/scripts/init-trust-policy.mjs --migrate`,
        { encoding: 'utf-8' }
      );

      // 移行ログの確認
      const logPath = join(REPORTS_DIR, 'trust-policy-migration.log');
      const logExists = await fs.access(logPath).then(() => true).catch(() => false);
      expect(logExists).toBe(true);

      const logContent = await fs.readFile(logPath, 'utf-8');
      expect(logContent).toContain('Trust承認ポリシー移行ログ');
      expect(logContent).toContain('既存設定更新');
      expect(logContent).toContain('移行が正常に完了');
    });
  });

  describe('復元機能', () => {
    it('バックアップから正しく復元される', async () => {
      // バックアップファイルを作成
      await fs.mkdir(BACKUP_DIR, { recursive: true });
      const backupData = {
        metadata: {
          originalPath: POLICY_FILE,
          backupTime: '2025-08-27T09:00:00Z',
          reason: 'test',
          hash: 'abcd1234',
          version: '0.9'
        },
        content: {
          version: '0.9',
          autoApprove: { gitOperations: ['status'] },
          manualApprove: { deleteOperations: [] },
          security: { maxAutoApprovalPerHour: 500 }
        }
      };
      const backupFile = 'trust-policy.backup.2025-08-27T09-00-00-000Z.abcd1234.json';
      await fs.writeFile(
        join(BACKUP_DIR, backupFile),
        JSON.stringify(backupData, null, 2)
      );

      // 復元の実行
      execSync(
        `cd ${TEST_DIR} && node ../../../.kiro/scripts/init-trust-policy.mjs --restore=${backupFile}`,
        { encoding: 'utf-8' }
      );

      // 復元された設定の確認
      const content = await fs.readFile(POLICY_FILE, 'utf-8');
      const restoredPolicy = JSON.parse(content);

      expect(restoredPolicy.version).toBe('0.9');
      expect(restoredPolicy.security.maxAutoApprovalPerHour).toBe(500);
    });
  });

  describe('エラーハンドリング', () => {
    it('不正なバックアップファイル指定時にエラーメッセージが表示される', () => {
      expect(() => {
        execSync(
          `cd ${TEST_DIR} && node ../../../.kiro/scripts/init-trust-policy.mjs --restore=nonexistent.json`,
          { encoding: 'utf-8' }
        );
      }).toThrow();
    });

    it('設定ファイルが破損している場合に適切にエラーハンドリングされる', async () => {
      // 破損した設定ファイルを作成
      await fs.writeFile(POLICY_FILE, '{ invalid json }');

      // 移行実行時にエラーが適切に処理される
      expect(() => {
        execSync(
          `cd ${TEST_DIR} && node ../../../.kiro/scripts/init-trust-policy.mjs --migrate`,
          { encoding: 'utf-8' }
        );
      }).toThrow();
    });
  });

  describe('ドライラン機能', () => {
    it('ドライランモードで実際の変更が行われない', async () => {
      // 既存設定を作成
      const existingPolicy = { version: '0.9' };
      await fs.writeFile(POLICY_FILE, JSON.stringify(existingPolicy, null, 2));

      // ドライランで移行実行
      const result = execSync(
        `cd ${TEST_DIR} && node ../../../.kiro/scripts/init-trust-policy.mjs --migrate --dry-run`,
        { encoding: 'utf-8' }
      );

      // 設定ファイルが変更されていない
      const content = await fs.readFile(POLICY_FILE, 'utf-8');
      const policy = JSON.parse(content);
      expect(policy.version).toBe('0.9');

      // ドライランメッセージが表示される
      expect(result).toContain('ドライラン');
      expect(result).toContain('実際の変更は行われていません');
    });
  });
});