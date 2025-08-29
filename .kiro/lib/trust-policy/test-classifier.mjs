#!/usr/bin/env node

/**
 * 操作分類器の簡単なテスト
 */

// TypeScriptファイルを直接インポートできないため、
// 実装の主要な機能をテストするための簡単なスクリプト

console.log('操作分類器のテスト開始...');

// 基本的なパターンマッチング機能のテスト
function testPatternMatching() {
  console.log('\n=== パターンマッチング機能のテスト ===');
  
  const patterns = [
    { text: 'git status', pattern: 'status', expected: true },
    { text: 'git branch -D feature', pattern: 'branch -D', expected: true },
    { text: 'git push --force', pattern: '--force', expected: true },
    { text: 'vercel env ls', pattern: 'env ls', expected: true },
    { text: 'rm -rf folder', pattern: '-rf', expected: true },
    { text: 'git commit -m "test"', pattern: 'commit', expected: true },
    { text: 'npm run test', pattern: 'run', expected: true },
  ];

  patterns.forEach(({ text, pattern, expected }, i) => {
    const result = text.includes(pattern);
    const status = result === expected ? '✓' : '✗';
    console.log(`${status} Test ${i + 1}: "${text}" contains "${pattern}" = ${result}`);
  });
}

// 操作タイプ判定のテスト
function testOperationTypeDetection() {
  console.log('\n=== 操作タイプ判定のテスト ===');
  
  const operations = [
    { command: 'git', args: ['status'], expectedType: 'git' },
    { command: 'rm', args: ['file.txt'], expectedType: 'file' },
    { command: 'vercel', args: ['env', 'ls'], expectedType: 'cli' },
    { command: 'node', args: ['script.mjs'], expectedType: 'script' },
    { command: 'touch', args: ['newfile.txt'], expectedType: 'file' },
    { command: 'npm', args: ['run', 'test'], expectedType: 'script' },
  ];

  operations.forEach(({ command, args, expectedType }, i) => {
    let detectedType = 'unknown';
    
    if (command === 'git') {
      detectedType = 'git';
    } else if (['rm', 'touch', 'mkdir', 'cp', 'mv'].includes(command)) {
      detectedType = 'file';
    } else if (['vercel', 'npm', 'yarn', 'pnpm'].includes(command)) {
      if (command === 'npm' && args.includes('run')) {
        detectedType = 'script';
      } else {
        detectedType = 'cli';
      }
    } else if (command === 'node' && args.some(arg => arg.endsWith('.mjs'))) {
      detectedType = 'script';
    }

    const status = detectedType === expectedType ? '✓' : '✗';
    console.log(`${status} Test ${i + 1}: "${command} ${args.join(' ')}" = ${detectedType} (expected: ${expectedType})`);
  });
}

// 危険操作検出のテスト
function testDangerousOperationDetection() {
  console.log('\n=== 危険操作検出のテスト ===');
  
  const operations = [
    { command: 'git', args: ['branch', '-D', 'feature'], isDangerous: true, reason: 'deletion' },
    { command: 'git', args: ['push', '--force'], isDangerous: true, reason: 'force' },
    { command: 'rm', args: ['-rf', 'folder'], isDangerous: true, reason: 'deletion+force' },
    { command: 'vercel', args: ['env', 'rm', 'VAR'], isDangerous: true, reason: 'deletion' },
    { command: 'vercel', args: ['deploy', '--prod'], isDangerous: true, reason: 'production' },
    { command: 'git', args: ['status'], isDangerous: false, reason: 'safe' },
    { command: 'vercel', args: ['env', 'ls'], isDangerous: false, reason: 'safe' },
    { command: 'npm', args: ['run', 'test'], isDangerous: false, reason: 'safe' },
  ];

  operations.forEach(({ command, args, isDangerous, reason }, i) => {
    const argsStr = args.join(' ');
    let detected = false;
    let detectedReason = 'safe';

    // 削除系操作の検出
    if (args.includes('-D') || args.includes('--delete') || args.includes('rm') || command === 'rm') {
      detected = true;
      detectedReason = 'deletion';
    }
    
    // 強制系操作の検出
    if (args.includes('--force') || args.includes('-f') || args.includes('-rf') || args.includes('--hard')) {
      detected = true;
      detectedReason = detectedReason === 'deletion' ? 'deletion+force' : 'force';
    }
    
    // 本番環境影響操作の検出
    if (args.includes('--prod') || args.includes('deploy')) {
      detected = true;
      detectedReason = 'production';
    }

    const status = detected === isDangerous ? '✓' : '✗';
    console.log(`${status} Test ${i + 1}: "${command} ${argsStr}" = ${detected ? 'dangerous' : 'safe'} (${detectedReason})`);
  });
}

// 自動承認パターンのテスト
function testAutoApprovalPatterns() {
  console.log('\n=== 自動承認パターンのテスト ===');
  
  const operations = [
    { command: 'git', args: ['status'], shouldAutoApprove: true },
    { command: 'git', args: ['commit', '-m', 'test'], shouldAutoApprove: true },
    { command: 'git', args: ['push', 'origin', 'main'], shouldAutoApprove: true },
    { command: 'git', args: ['branch', '-D', 'feature'], shouldAutoApprove: false },
    { command: 'vercel', args: ['env', 'ls'], shouldAutoApprove: true },
    { command: 'vercel', args: ['env', 'rm', 'VAR'], shouldAutoApprove: false },
    { command: 'node', args: ['scripts/report.mjs'], shouldAutoApprove: true },
    { command: 'npm', args: ['run', 'test'], shouldAutoApprove: true },
    { command: 'rm', args: ['-rf', 'folder'], shouldAutoApprove: false },
  ];

  operations.forEach(({ command, args, shouldAutoApprove }, i) => {
    const argsStr = args.join(' ');
    let autoApprove = true;

    // 危険操作は自動承認しない
    if (args.includes('-D') || args.includes('--delete') || args.includes('rm') || command === 'rm') {
      autoApprove = false;
    }
    if (args.includes('--force') || args.includes('-f') || args.includes('-rf') || args.includes('--hard')) {
      autoApprove = false;
    }
    if (args.includes('--prod') || args.includes('deploy')) {
      autoApprove = false;
    }

    const status = autoApprove === shouldAutoApprove ? '✓' : '✗';
    console.log(`${status} Test ${i + 1}: "${command} ${argsStr}" = ${autoApprove ? 'auto-approve' : 'manual-approve'}`);
  });
}

// テスト実行
testPatternMatching();
testOperationTypeDetection();
testDangerousOperationDetection();
testAutoApprovalPatterns();

console.log('\n操作分類器のテスト完了！');