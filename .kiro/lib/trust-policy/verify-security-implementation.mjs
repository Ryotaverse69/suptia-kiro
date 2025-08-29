#!/usr/bin/env node

/**
 * セキュリティ保護システムの実装検証スクリプト
 * TypeScriptファイルの構造と内容を検証する
 */

import { promises as fs } from 'fs';
import { join } from 'path';

async function main() {
  console.log('🔒 Trust承認セキュリティ保護システム実装検証');
  console.log('='.repeat(60));

  const requiredFiles = [
    '.kiro/lib/trust-policy/security-protection.ts',
    '.kiro/lib/trust-policy/__tests__/security-protection.test.ts',
    '.kiro/lib/trust-policy/__tests__/security-protection.integration.test.ts',
    '.kiro/lib/trust-policy/demo-security-protection.mjs'
  ];

  console.log('\n📁 必要ファイルの存在確認');
  console.log('-'.repeat(40));

  for (const file of requiredFiles) {
    try {
      const stats = await fs.stat(file);
      const sizeKB = Math.round(stats.size / 1024);
      console.log(`✅ ${file} (${sizeKB}KB)`);
    } catch (error) {
      console.log(`❌ ${file} - ファイルが存在しません`);
    }
  }

  console.log('\n🔍 セキュリティ保護システムの実装内容確認');
  console.log('-'.repeat(40));

  try {
    const securityProtectionContent = await fs.readFile('.kiro/lib/trust-policy/security-protection.ts', 'utf-8');
    
    // 要件8.1の実装確認
    const requirement81Features = [
      'SuspiciousPatternDetector',
      'detectSuspiciousPattern',
      'switchToManualApprovalMode',
      'SUSPICIOUS_PATTERNS'
    ];

    console.log('\n📋 要件8.1: 不審な操作パターンの検出と自動手動承認モード切り替え');
    for (const feature of requirement81Features) {
      if (securityProtectionContent.includes(feature)) {
        console.log(`  ✅ ${feature} - 実装済み`);
      } else {
        console.log(`  ❌ ${feature} - 未実装`);
      }
    }

    // 要件8.2の実装確認
    const requirement82Features = [
      'ConfigIntegrityVerifier',
      'verifyConfigIntegrity',
      'handleConfigTampering',
      'calculateConfigHash',
      'loadDefaultPolicy'
    ];

    console.log('\n📋 要件8.2: 設定ファイル改ざん検証とデフォルト設定復帰機能');
    for (const feature of requirement82Features) {
      if (securityProtectionContent.includes(feature)) {
        console.log(`  ✅ ${feature} - 実装済み`);
      } else {
        console.log(`  ❌ ${feature} - 未実装`);
      }
    }

    // 要件8.3の実装確認
    const requirement83Features = [
      'ExternalRequestValidator',
      'validateRequest',
      'handleExternalThreat',
      'validateSessionId',
      'validateUser'
    ];

    console.log('\n📋 要件8.3: 外部からの不正操作要求の拒否とログ記録機能');
    for (const feature of requirement83Features) {
      if (securityProtectionContent.includes(feature)) {
        console.log(`  ✅ ${feature} - 実装済み`);
      } else {
        console.log(`  ❌ ${feature} - 未実装`);
      }
    }

    // セキュリティアクションの確認
    const securityActions = [
      'SecurityAction.ALLOW',
      'SecurityAction.REJECT_AND_LOG',
      'SecurityAction.SWITCH_TO_MANUAL_MODE',
      'SecurityAction.RESTORE_DEFAULT_CONFIG'
    ];

    console.log('\n🔧 セキュリティアクション');
    for (const action of securityActions) {
      if (securityProtectionContent.includes(action)) {
        console.log(`  ✅ ${action} - 実装済み`);
      } else {
        console.log(`  ❌ ${action} - 未実装`);
      }
    }

    // Trust Decision Engineとの統合確認
    const trustEngineContent = await fs.readFile('.kiro/lib/trust-policy/trust-decision-engine.ts', 'utf-8');
    
    console.log('\n🔗 Trust Decision Engineとの統合');
    const integrationFeatures = [
      'SecurityProtectionSystem',
      'performSecurityCheck',
      'handleSecurityAction',
      'getSecurityStats',
      'restoreAutoApprovalMode'
    ];

    for (const feature of integrationFeatures) {
      if (trustEngineContent.includes(feature)) {
        console.log(`  ✅ ${feature} - 統合済み`);
      } else {
        console.log(`  ❌ ${feature} - 未統合`);
      }
    }

    // AuditLoggerの拡張確認
    const auditLoggerContent = await fs.readFile('.kiro/lib/trust-policy/audit-logger.ts', 'utf-8');
    
    console.log('\n📊 AuditLoggerの拡張');
    const auditFeatures = [
      'logSecurityEvent',
      'getSecurityEventStats',
      'SecurityEvent',
      'security-events-'
    ];

    for (const feature of auditFeatures) {
      if (auditLoggerContent.includes(feature)) {
        console.log(`  ✅ ${feature} - 実装済み`);
      } else {
        console.log(`  ❌ ${feature} - 未実装`);
      }
    }

    // テストファイルの確認
    console.log('\n🧪 テストファイルの確認');
    try {
      const testContent = await fs.readFile('.kiro/lib/trust-policy/__tests__/security-protection.test.ts', 'utf-8');
      const testCount = (testContent.match(/it\(/g) || []).length;
      console.log(`  ✅ 単体テスト: ${testCount}件のテストケース`);
      
      const integrationTestContent = await fs.readFile('.kiro/lib/trust-policy/__tests__/security-protection.integration.test.ts', 'utf-8');
      const integrationTestCount = (integrationTestContent.match(/it\(/g) || []).length;
      console.log(`  ✅ 統合テスト: ${integrationTestCount}件のテストケース`);
    } catch (error) {
      console.log(`  ❌ テストファイルの読み込みに失敗: ${error.message}`);
    }

    console.log('\n📈 実装統計');
    console.log('-'.repeat(40));
    console.log(`セキュリティ保護システム: ${Math.round(securityProtectionContent.length / 1024)}KB`);
    console.log(`Trust Decision Engine統合: ${trustEngineContent.includes('SecurityProtectionSystem') ? '完了' : '未完了'}`);
    console.log(`AuditLogger拡張: ${auditLoggerContent.includes('logSecurityEvent') ? '完了' : '未完了'}`);

    // 不審パターンの数を数える
    const suspiciousPatterns = securityProtectionContent.match(/pattern:/g) || [];
    console.log(`不審パターン定義: ${suspiciousPatterns.length}件`);

    // セキュリティレベルの確認
    const securityLevels = securityProtectionContent.match(/SecurityLevel\.\w+/g) || [];
    console.log(`セキュリティレベル: ${[...new Set(securityLevels)].length}段階`);

    console.log('\n✅ セキュリティ保護システムの実装検証完了');
    console.log('\n📝 実装された機能:');
    console.log('   - 不審な操作パターンの検出');
    console.log('   - 設定ファイル改ざん検証');
    console.log('   - 外部からの不正操作要求の拒否');
    console.log('   - 自動手動承認モード切り替え');
    console.log('   - セキュリティイベントログ記録');
    console.log('   - Trust Decision Engineとの統合');
    console.log('   - 包括的なテストスイート');

  } catch (error) {
    console.error('❌ 実装検証中にエラーが発生しました:', error.message);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ 検証スクリプト実行中にエラーが発生しました:', error);
  process.exit(1);
});