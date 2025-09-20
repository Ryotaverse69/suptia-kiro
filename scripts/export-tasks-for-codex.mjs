#!/usr/bin/env node

/**
 * KiroのタスクをCodex IDE用フォーマットでエクスポート
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const CODEX_OUTPUT_DIR = '.codex-tasks';
const TASKS_FILE = '.kiro/specs/trivago-clone-complete/tasks.md';
const REQUIREMENTS_FILE = '.kiro/specs/trivago-clone-complete/requirements.md';
const DESIGN_FILE = '.kiro/specs/trivago-clone-complete/design.md';

async function exportTasksForCodex() {
  console.log('🚀 KiroタスクをCodex IDE用にエクスポート中...');

  // 出力ディレクトリを作成
  if (!existsSync(CODEX_OUTPUT_DIR)) {
    await mkdir(CODEX_OUTPUT_DIR, { recursive: true });
  }

  try {
    // タスクファイルを読み込み
    const tasksContent = await readFile(TASKS_FILE, 'utf-8');
    const requirementsContent = await readFile(REQUIREMENTS_FILE, 'utf-8');
    const designContent = await readFile(DESIGN_FILE, 'utf-8');

    // タスクを解析
    const tasks = parseTasksFromMarkdown(tasksContent);
    
    // 各タスクをCodex用フォーマットで出力
    for (const task of tasks) {
      await exportSingleTask(task, requirementsContent, designContent);
    }

    // インデックスファイルを作成
    await createTaskIndex(tasks);

    console.log(`✅ ${tasks.length}個のタスクをエクスポートしました`);
    console.log(`📁 出力先: ${CODEX_OUTPUT_DIR}/`);
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
  }
}

function parseTasksFromMarkdown(content) {
  const tasks = [];
  const lines = content.split('\n');
  let currentTask = null;
  let inTaskDetails = false;

  for (const line of lines) {
    // タスクタイトルの検出
    const taskMatch = line.match(/^### (.+)$/);
    if (taskMatch) {
      if (currentTask) {
        tasks.push(currentTask);
      }
      currentTask = {
        title: taskMatch[1],
        status: 'not started',
        details: [],
        requirements: [],
        files: [],
      };
      inTaskDetails = false;
      continue;
    }

    if (!currentTask) continue;

    // ステータスの検出
    const statusMatch = line.match(/Status: (.+)$/);
    if (statusMatch) {
      currentTask.status = statusMatch[1];
      continue;
    }

    // タスク詳細の開始
    if (line.includes('Task details:')) {
      inTaskDetails = true;
      continue;
    }

    // 要件参照の検出
    const reqMatch = line.match(/_Requirements: (.+)_/);
    if (reqMatch) {
      currentTask.requirements.push(reqMatch[1]);
      continue;
    }

    // タスク詳細の内容
    if (inTaskDetails && line.startsWith('- ')) {
      currentTask.details.push(line.substring(2));
    }
  }

  if (currentTask) {
    tasks.push(currentTask);
  }

  return tasks;
}

async function exportSingleTask(task, requirements, design) {
  const taskId = task.title.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-');

  const codexTask = {
    id: taskId,
    title: task.title,
    status: task.status,
    priority: task.status === 'completed' ? 'low' : 'high',
    type: 'implementation',
    
    // Codex用の詳細な指示
    instructions: {
      summary: task.details.join('\n'),
      requirements: extractRelevantRequirements(task.requirements, requirements),
      design: extractRelevantDesign(task.title, design),
      acceptance_criteria: generateAcceptanceCriteria(task),
      files_to_modify: suggestFilesToModify(task),
      testing_requirements: generateTestingRequirements(task),
      
      // 追加の仕様書情報
      project_context: {
        name: 'Suptia - トリバゴクローン',
        description: 'サプリメント価格比較サイト（トリバゴのUI/UXを完全再現）',
        target_audience: 'サプリメント購入を検討している日本のユーザー',
        key_features: [
          '価格比較機能',
          '人気検索カード',
          'AI推奨システム',
          'レスポンシブデザイン',
          'アクセシビリティ対応'
        ]
      },
      
      technical_specifications: {
        framework: 'Next.js 14 (App Router)',
        language: 'TypeScript',
        styling: 'Tailwind CSS',
        cms: 'Sanity',
        deployment: 'Vercel',
        testing: 'Jest + React Testing Library',
        accessibility: 'WCAG 2.1 AA準拠',
        performance: 'Core Web Vitals最適化'
      },
      
      design_system: {
        colors: {
          primary: '#0066CC (トリバゴブルー)',
          secondary: '#FF6B35',
          success: '#28A745',
          warning: '#FFC107',
          error: '#DC3545'
        },
        typography: {
          font_family: 'Inter, system-ui, sans-serif',
          sizes: '12px, 14px, 16px, 18px, 20px, 24px, 32px, 48px'
        },
        spacing: '4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px, 64px, 80px',
        breakpoints: 'sm: 640px, md: 768px, lg: 1024px, xl: 1280px, 2xl: 1536px'
      },
      
      quality_standards: {
        code_coverage: '80%以上',
        accessibility_score: '90%以上',
        performance_score: '85%以上',
        typescript_strict: true,
        eslint_max_warnings: 0,
        prettier_formatting: true
      }
    },

    // コードチェック用の設定
    code_review: {
      enabled: true,
      checks: [
        'typescript_errors',
        'react_best_practices',
        'accessibility',
        'performance',
        'security',
        'code_style',
      ],
      auto_fix: false, // 手動確認を推奨
    },

    // 実行環境の設定
    environment: {
      framework: 'Next.js 14',
      language: 'TypeScript',
      styling: 'Tailwind CSS',
      cms: 'Sanity',
      deployment: 'Vercel',
    },

    // 参照すべきファイル・ドキュメント
    reference_files: {
      specifications: [
        '.kiro/specs/trivago-clone-complete/requirements.md',
        '.kiro/specs/trivago-clone-complete/design.md',
        '.kiro/specs/trivago-clone-complete/tasks.md'
      ],
      existing_components: [
        'apps/web/src/components/index.ts',
        'apps/web/src/components/Header.tsx',
        'apps/web/src/components/Footer.tsx',
        'apps/web/src/app/layout.tsx',
        'apps/web/src/app/page.tsx'
      ],
      schemas: [
        'packages/schemas/category.ts',
        'packages/schemas/product.ts',
        'packages/schemas/ingredient.ts'
      ],
      libraries: [
        'apps/web/src/lib/categories.ts',
        'apps/web/src/lib/sanity.client.ts'
      ],
      config_files: [
        'tailwind.config.js',
        'tsconfig.json',
        '.eslintrc.json',
        'sanity.config.ts'
      ]
    },

    // 実装ガイドライン
    implementation_guidelines: {
      component_structure: [
        'TypeScript + React Functional Components',
        'Props interfaceの明確な定義',
        'デフォルトpropsの適切な設定',
        'エラーハンドリングの実装'
      ],
      styling_approach: [
        'Tailwind CSSクラスの使用',
        'レスポンシブデザインの実装',
        'ダークモード対応（将来対応）',
        'カスタムCSSは最小限に'
      ],
      accessibility_requirements: [
        'セマンティックHTMLの使用',
        'ARIA属性の適切な設定',
        'キーボードナビゲーション対応',
        'スクリーンリーダー対応'
      ],
      performance_optimization: [
        'React.memoの適切な使用',
        '画像の最適化（Next.js Image）',
        'コード分割の実装',
        'バンドルサイズの最適化'
      ]
    },
  };

  const filename = `${CODEX_OUTPUT_DIR}/task-${taskId}.json`;
  await writeFile(filename, JSON.stringify(codexTask, null, 2));
  
  console.log(`📝 エクスポート: ${task.title} → ${filename}`);
}

function extractRelevantRequirements(reqIds, requirementsContent) {
  if (!reqIds || reqIds.length === 0) {
    // 要件IDが指定されていない場合は、全体の要件を返す
    return requirementsContent;
  }
  
  const requirements = [];
  for (const reqId of reqIds) {
    // より柔軟な正規表現で要件を抽出
    const patterns = [
      new RegExp(`### ${reqId}[\\s\\S]*?(?=###|$)`, 'g'),
      new RegExp(`## ${reqId}[\\s\\S]*?(?=##|$)`, 'g'),
      new RegExp(`# ${reqId}[\\s\\S]*?(?=#|$)`, 'g'),
    ];
    
    for (const pattern of patterns) {
      const match = requirementsContent.match(pattern);
      if (match) {
        requirements.push(match[0]);
        break;
      }
    }
  }
  
  // 要件が見つからない場合は、関連キーワードで検索
  if (requirements.length === 0) {
    for (const reqId of reqIds) {
      const lines = requirementsContent.split('\n');
      const relevantLines = [];
      let inRelevantSection = false;
      
      for (const line of lines) {
        if (line.toLowerCase().includes(reqId.toLowerCase())) {
          inRelevantSection = true;
          relevantLines.push(line);
        } else if (inRelevantSection && line.startsWith('#')) {
          break;
        } else if (inRelevantSection) {
          relevantLines.push(line);
        }
      }
      
      if (relevantLines.length > 0) {
        requirements.push(relevantLines.join('\n'));
      }
    }
  }
  
  return requirements.length > 0 ? requirements.join('\n\n') : requirementsContent;
}

function extractRelevantDesign(taskTitle, designContent) {
  // タスクタイトルに関連するデザイン情報を抽出
  const keywords = taskTitle.toLowerCase().split(/\s+/).filter(word => 
    word.length > 2 && !['phase', 'task', 'タスク'].includes(word)
  );
  
  const lines = designContent.split('\n');
  const relevantSections = [];
  
  // キーワードマッチングでセクションを抽出
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (keywords.some(keyword => line.includes(keyword))) {
      // 関連セクションを抽出（次の見出しまで）
      let section = lines[i];
      for (let j = i + 1; j < lines.length && !lines[j].match(/^#{1,3}\s/); j++) {
        section += '\n' + lines[j];
      }
      relevantSections.push(section);
    }
  }
  
  // 特定のセクションも含める
  const importantSections = [
    'デザインシステム',
    'コンポーネント',
    'レイアウト',
    'スタイリング',
    'UI/UX',
    'ビジュアル',
    'カラー',
    'タイポグラフィ',
    'レスポンシブ'
  ];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (importantSections.some(section => line.includes(section))) {
      let section = lines[i];
      for (let j = i + 1; j < lines.length && !lines[j].match(/^#{1,3}\s/); j++) {
        section += '\n' + lines[j];
      }
      if (!relevantSections.some(existing => existing.includes(section))) {
        relevantSections.push(section);
      }
    }
  }
  
  // 関連セクションが見つからない場合は、全体のデザイン情報を返す
  return relevantSections.length > 0 ? relevantSections.join('\n\n') : designContent;
}

function generateAcceptanceCriteria(task) {
  const criteria = [
    'コンポーネントが正常にレンダリングされる',
    'TypeScriptエラーが発生しない',
    'レスポンシブデザインが適用されている',
    'アクセシビリティ要件を満たしている',
  ];

  // タスク内容に応じて追加の基準を生成
  if (task.title.includes('API') || task.title.includes('データ')) {
    criteria.push('APIからのデータ取得が正常に動作する');
    criteria.push('エラーハンドリングが適切に実装されている');
  }

  if (task.title.includes('検索') || task.title.includes('フィルタ')) {
    criteria.push('検索・フィルタ機能が正常に動作する');
    criteria.push('パフォーマンスが最適化されている');
  }

  return criteria;
}

function suggestFilesToModify(task) {
  const files = [];
  
  // タスク内容に基づいてファイルを推測
  if (task.title.includes('コンポーネント')) {
    files.push('apps/web/src/components/*.tsx');
  }
  
  if (task.title.includes('ページ')) {
    files.push('apps/web/src/app/**/page.tsx');
  }
  
  if (task.title.includes('API') || task.title.includes('データ')) {
    files.push('apps/web/src/lib/*.ts');
    files.push('apps/web/src/app/api/**/route.ts');
  }
  
  if (task.title.includes('スキーマ') || task.title.includes('Sanity')) {
    files.push('packages/schemas/*.ts');
  }

  return files;
}

function generateTestingRequirements(task) {
  return [
    'ユニットテストの作成（Jest + React Testing Library）',
    'インテグレーションテストの実行',
    'ビジュアルリグレッションテストの確認',
    'パフォーマンステストの実行',
    'アクセシビリティテストの実行',
  ];
}

async function createTaskIndex(tasks) {
  const index = {
    project: 'Suptia - Trivago Clone',
    generated_at: new Date().toISOString(),
    total_tasks: tasks.length,
    tasks_by_status: {
      'not started': tasks.filter(t => t.status === 'not started').length,
      'in_progress': tasks.filter(t => t.status === 'in_progress').length,
      'completed': tasks.filter(t => t.status === 'completed').length,
    },
    
    // Codex実行順序の提案
    execution_order: tasks
      .filter(t => t.status !== 'completed')
      .map(t => ({
        id: t.title.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-'),
        title: t.title,
        priority: determinePriority(t),
        estimated_time: estimateTime(t),
      }))
      .sort((a, b) => b.priority - a.priority),

    // 全体的なコードチェック設定
    global_code_review: {
      eslint_config: '.eslintrc.json',
      typescript_config: 'tsconfig.json',
      prettier_config: '.prettierrc',
      test_command: 'npm run test',
      build_command: 'npm run build',
    },
  };

  await writeFile(`${CODEX_OUTPUT_DIR}/index.json`, JSON.stringify(index, null, 2));
  console.log('📋 タスクインデックスを作成しました');
}

function determinePriority(task) {
  // 基盤となるタスクは高優先度
  if (task.title.includes('スキーマ') || task.title.includes('データ')) return 10;
  if (task.title.includes('コンポーネント')) return 8;
  if (task.title.includes('ページ')) return 6;
  if (task.title.includes('統合') || task.title.includes('テスト')) return 4;
  return 5;
}

function estimateTime(task) {
  const details = task.details.join(' ').toLowerCase();
  
  if (details.includes('複雑') || details.includes('統合')) return '4-6時間';
  if (details.includes('コンポーネント') || details.includes('ページ')) return '2-4時間';
  if (details.includes('設定') || details.includes('修正')) return '1-2時間';
  
  return '2-3時間';
}

// スクリプト実行
if (process.argv[1].endsWith('export-tasks-for-codex.mjs')) {
  exportTasksForCodex();
}

export { exportTasksForCodex };