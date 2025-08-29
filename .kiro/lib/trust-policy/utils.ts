import { TrustPolicy, Operation, OperationType } from './types.js';

/**
 * Trust承認ポリシーのユーティリティ関数
 */

/**
 * 操作がGit操作かどうかを判定
 */
export function isGitOperation(operation: Operation): boolean {
  return operation.type === OperationType.GIT || 
         operation.command.startsWith('git ');
}

/**
 * 操作がファイル操作かどうかを判定
 */
export function isFileOperation(operation: Operation): boolean {
  return operation.type === OperationType.FILE ||
         ['mkdir', 'touch', 'cp', 'mv'].some(cmd => operation.command.startsWith(cmd));
}

/**
 * 操作がCLI操作かどうかを判定
 */
export function isCliOperation(operation: Operation): boolean {
  return operation.type === OperationType.CLI ||
         ['vercel', 'npm', 'pnpm', 'yarn'].some(cmd => operation.command.startsWith(cmd));
}

/**
 * 操作がスクリプト実行かどうかを判定
 */
export function isScriptOperation(operation: Operation): boolean {
  return operation.type === OperationType.SCRIPT ||
         operation.command.includes('.mjs') ||
         operation.command.includes('.js') ||
         operation.command.startsWith('node ');
}

/**
 * 操作がMCP操作かどうかを判定
 */
export function isMcpOperation(operation: Operation): boolean {
  return operation.type === OperationType.MCP ||
         operation.context.workingDirectory.includes('mcp') ||
         operation.command.includes('github:') ||
         operation.command.includes('sanity-dev:');
}

/**
 * 削除系操作かどうかを判定
 */
export function isDeleteOperation(command: string): boolean {
  const deletePatterns = [
    'rm -rf',
    'git branch -D',
    'git push --delete',
    'vercel env rm',
    'vercel domain rm',
    'delete',
    'remove'
  ];
  
  return deletePatterns.some(pattern => 
    command.toLowerCase().includes(pattern.toLowerCase())
  );
}

/**
 * 強制系操作かどうかを判定
 */
export function isForceOperation(command: string): boolean {
  const forcePatterns = [
    'git reset --hard',
    'git push --force',
    'git push -f',
    '--force',
    '-f'
  ];
  
  return forcePatterns.some(pattern => 
    command.toLowerCase().includes(pattern.toLowerCase())
  );
}

/**
 * 本番環境影響操作かどうかを判定
 */
export function isProductionImpactOperation(command: string): boolean {
  const productionPatterns = [
    'github:write',
    'sanity-dev:write',
    'vercel:envSet',
    'vercel:addDomain',
    'production',
    'prod'
  ];
  
  return productionPatterns.some(pattern => 
    command.toLowerCase().includes(pattern.toLowerCase())
  );
}

/**
 * ポリシー設定をマージする
 */
export function mergePolicies(base: TrustPolicy, override: Partial<TrustPolicy>): TrustPolicy {
  return {
    ...base,
    ...override,
    autoApprove: {
      ...base.autoApprove,
      ...override.autoApprove
    },
    manualApprove: {
      ...base.manualApprove,
      ...override.manualApprove
    },
    security: {
      ...base.security,
      ...override.security
    }
  };
}

/**
 * ポリシー設定を深くクローンする
 */
export function clonePolicy(policy: TrustPolicy): TrustPolicy {
  return JSON.parse(JSON.stringify(policy));
}

/**
 * 操作コマンドを正規化する
 */
export function normalizeCommand(command: string): string {
  return command.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * パターンマッチングを行う
 */
export function matchesPattern(text: string, patterns: string[]): boolean {
  const normalizedText = normalizeCommand(text);
  
  return patterns.some(pattern => {
    const normalizedPattern = normalizeCommand(pattern);
    
    // ワイルドカード対応
    if (normalizedPattern.includes('*')) {
      const regex = new RegExp(
        normalizedPattern.replace(/\*/g, '.*').replace(/\?/g, '.'),
        'i'
      );
      return regex.test(normalizedText);
    }
    
    // 部分一致
    return normalizedText.includes(normalizedPattern);
  });
}

/**
 * 設定ファイルパスを取得
 */
export function getPolicyFilePath(): string {
  return '.kiro/settings/trust-policy.json';
}

/**
 * デフォルト設定ファイルパスを取得
 */
export function getDefaultPolicyFilePath(): string {
  return '.kiro/lib/trust-policy/default-policy.json';
}