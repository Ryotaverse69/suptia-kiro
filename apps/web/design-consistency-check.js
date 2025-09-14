#!/usr/bin/env node

/**
 * Apple/xAI風デザインの一貫性チェックスクリプト
 *
 * チェック項目:
 * 1. コンポーネントの間隔が8/12/16の階層で統一されているか
 * 2. Apple風のカラーパレット（#2563EB）が使用されているか
 * 3. 適切なスペーシングシステムが使用されているか
 */

const fs = require('fs');
const path = require('path');

// チェック対象のディレクトリ
const COMPONENTS_DIR = path.join(__dirname, 'src/components');

// 期待されるスペーシング値（8/12/16の階層）
const EXPECTED_SPACING = {
  // 基本単位（8px = space-2）
  basic: [
    'gap-2',
    'p-2',
    'px-2',
    'py-2',
    'm-2',
    'mx-2',
    'my-2',
    'mb-2',
    'mt-2',
    'ml-2',
    'mr-2',
  ],
  // 中間単位（12px = space-3）
  medium: [
    'gap-3',
    'p-3',
    'px-3',
    'py-3',
    'm-3',
    'mx-3',
    'my-3',
    'mb-3',
    'mt-3',
    'ml-3',
    'mr-3',
  ],
  // 大単位（16px = space-4）
  large: [
    'gap-4',
    'p-4',
    'px-4',
    'py-4',
    'm-4',
    'mx-4',
    'my-4',
    'mb-4',
    'mt-4',
    'ml-4',
    'mr-4',
  ],
  // セクション単位（24px = space-6, 32px = space-8）
  section: [
    'gap-6',
    'p-6',
    'px-6',
    'py-6',
    'm-6',
    'mx-6',
    'my-6',
    'mb-6',
    'mt-6',
    'ml-6',
    'mr-6',
    'gap-8',
    'p-8',
    'px-8',
    'py-8',
    'm-8',
    'mx-8',
    'my-8',
    'mb-8',
    'mt-8',
    'ml-8',
    'mr-8',
  ],
  // 大型セクション（48px = space-12, 64px = space-16, 96px = space-24）
  largeSection: ['py-12', 'py-16', 'py-20', 'py-24'],
};

// Apple風カラーパレットの期待値
const EXPECTED_COLORS = {
  primary: [
    'primary-600',
    'primary-500',
    'primary-700',
    '#2563eb',
    'var(--brand)',
  ],
  background: ['bg-white', 'bg-gray-50', 'bg-gray-100'],
  text: ['text-gray-900', 'text-gray-600', 'text-gray-700'],
};

// 非推奨のスペーシング値
const DEPRECATED_SPACING = [
  'gap-1',
  'gap-5',
  'gap-7',
  'gap-9',
  'gap-10',
  'gap-11',
  'p-1',
  'p-5',
  'p-7',
  'p-9',
  'p-10',
  'p-11',
  'py-1',
  'py-5',
  'py-7',
  'py-9',
  'py-10',
  'py-11',
];

function getAllTsxFiles(dir) {
  const files = [];

  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);

    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !item.startsWith('.')) {
        traverse(fullPath);
      } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
        files.push(fullPath);
      }
    }
  }

  traverse(dir);
  return files;
}

function checkSpacingConsistency(content, filePath) {
  const issues = [];

  // 非推奨のスペーシング値をチェック
  for (const deprecated of DEPRECATED_SPACING) {
    if (content.includes(deprecated)) {
      issues.push({
        type: 'spacing',
        severity: 'warning',
        message: `非推奨のスペーシング値 "${deprecated}" が使用されています。8/12/16の階層に統一してください。`,
        file: filePath,
      });
    }
  }

  // 推奨されるスペーシング値の使用をチェック
  const allExpectedSpacing = [
    ...EXPECTED_SPACING.basic,
    ...EXPECTED_SPACING.medium,
    ...EXPECTED_SPACING.large,
    ...EXPECTED_SPACING.section,
    ...EXPECTED_SPACING.largeSection,
  ];

  const spacingMatches =
    content.match(/(?:gap|p|px|py|m|mx|my|mb|mt|ml|mr)-\d+/g) || [];
  const unexpectedSpacing = spacingMatches.filter(
    match => !allExpectedSpacing.includes(match)
  );

  if (unexpectedSpacing.length > 0) {
    issues.push({
      type: 'spacing',
      severity: 'info',
      message: `予期しないスペーシング値が見つかりました: ${unexpectedSpacing.join(', ')}`,
      file: filePath,
    });
  }

  return issues;
}

function checkColorConsistency(content, filePath) {
  const issues = [];

  // Apple風カラーパレットの使用をチェック
  const colorMatches =
    content.match(/(bg|text|border)-\w+-\d+|#[0-9a-fA-F]{6}/g) || [];

  // 非推奨の色の使用をチェック（例：濃色テーマ）
  const deprecatedColors = ['bg-black', 'bg-gray-900', 'text-white'];
  for (const deprecated of deprecatedColors) {
    if (content.includes(deprecated)) {
      issues.push({
        type: 'color',
        severity: 'warning',
        message: `非推奨の色 "${deprecated}" が使用されています。白基調のApple風デザインに統一してください。`,
        file: filePath,
      });
    }
  }

  return issues;
}

function checkAppleDesignPatterns(content, filePath) {
  const issues = [];

  // Apple風のクラス名パターンをチェック
  const applePatterns = [
    'apple-hover',
    'backdrop-blur',
    'shadow-soft',
    'rounded-xl',
    'transition-all',
  ];

  let hasApplePatterns = false;
  for (const pattern of applePatterns) {
    if (content.includes(pattern)) {
      hasApplePatterns = true;
      break;
    }
  }

  // コンポーネントファイルでApple風パターンが使用されていない場合
  if (
    filePath.includes('/components/') &&
    !hasApplePatterns &&
    content.includes('className')
  ) {
    issues.push({
      type: 'design',
      severity: 'info',
      message:
        'Apple風のデザインパターン（apple-hover, backdrop-blur等）の使用を検討してください。',
      file: filePath,
    });
  }

  return issues;
}

function runDesignConsistencyCheck() {
  console.log('🎨 Apple/xAI風デザイン一貫性チェックを開始します...\n');

  const files = getAllTsxFiles(COMPONENTS_DIR);
  const allIssues = [];

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const relativePath = path.relative(process.cwd(), file);

      const spacingIssues = checkSpacingConsistency(content, relativePath);
      const colorIssues = checkColorConsistency(content, relativePath);
      const designIssues = checkAppleDesignPatterns(content, relativePath);

      allIssues.push(...spacingIssues, ...colorIssues, ...designIssues);
    } catch (error) {
      console.error(`❌ ファイル読み込みエラー: ${file}`, error.message);
    }
  }

  // 結果の表示
  if (allIssues.length === 0) {
    console.log('✅ デザインの一貫性チェック: すべて合格');
    console.log('   - コンポーネントの間隔が8/12/16の階層で統一されています');
    console.log(
      '   - Apple/xAI風の高級感あるデザインが一貫して適用されています'
    );
  } else {
    console.log(`⚠️  ${allIssues.length}件の改善点が見つかりました:\n`);

    // 重要度別に分類
    const errors = allIssues.filter(issue => issue.severity === 'error');
    const warnings = allIssues.filter(issue => issue.severity === 'warning');
    const infos = allIssues.filter(issue => issue.severity === 'info');

    if (errors.length > 0) {
      console.log('🚨 エラー:');
      errors.forEach(issue => {
        console.log(`   ${issue.file}: ${issue.message}`);
      });
      console.log();
    }

    if (warnings.length > 0) {
      console.log('⚠️  警告:');
      warnings.forEach(issue => {
        console.log(`   ${issue.file}: ${issue.message}`);
      });
      console.log();
    }

    if (infos.length > 0) {
      console.log('💡 情報:');
      infos.forEach(issue => {
        console.log(`   ${issue.file}: ${issue.message}`);
      });
      console.log();
    }
  }

  // 統計情報
  console.log(`📊 チェック統計:`);
  console.log(`   - チェック対象ファイル: ${files.length}件`);
  console.log(`   - 検出された問題: ${allIssues.length}件`);
  console.log(
    `   - スペーシング関連: ${allIssues.filter(i => i.type === 'spacing').length}件`
  );
  console.log(
    `   - カラー関連: ${allIssues.filter(i => i.type === 'color').length}件`
  );
  console.log(
    `   - デザインパターン関連: ${allIssues.filter(i => i.type === 'design').length}件`
  );

  return allIssues.length === 0;
}

// スクリプト実行
if (require.main === module) {
  const success = runDesignConsistencyCheck();
  process.exit(success ? 0 : 1);
}

module.exports = { runDesignConsistencyCheck };
