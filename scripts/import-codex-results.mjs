#!/usr/bin/env node

/**
 * Codex IDEの実行結果をKiroプロジェクトに取り込み
 */

import { readFile, writeFile, readdir, stat } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const CODEX_RESULTS_DIR = '.codex-results';
const KIRO_TASKS_FILE = '.kiro/specs/trivago-clone-complete/tasks.md';

async function importCodexResults() {
  console.log('🔄 Codex IDEの実行結果を取り込み中...');

  if (!existsSync(CODEX_RESULTS_DIR)) {
    console.log('❌ Codex結果ディレクトリが見つかりません:', CODEX_RESULTS_DIR);
    console.log('💡 Codex IDEで以下のディレクトリに結果を出力してください:');
    console.log(`   ${path.resolve(CODEX_RESULTS_DIR)}`);
    return;
  }

  try {
    // Codex結果ファイルを読み込み
    const resultFiles = await readdir(CODEX_RESULTS_DIR);
    const results = [];

    for (const file of resultFiles) {
      if (file.endsWith('.json')) {
        const filePath = path.join(CODEX_RESULTS_DIR, file);
        const content = await readFile(filePath, 'utf-8');
        const result = JSON.parse(content);
        results.push(result);
      }
    }

    console.log(`📊 ${results.length}個の結果ファイルを処理中...`);

    // 各結果を処理
    for (const result of results) {
      await processCodexResult(result);
    }

    // タスクステータスを更新
    await updateTaskStatuses(results);

    // コードレビュー結果をまとめる
    await generateCodeReviewSummary(results);

    console.log('✅ Codex結果の取り込みが完了しました');

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
  }
}

async function processCodexResult(result) {
  console.log(`🔍 処理中: ${result.task_id || result.id}`);

  // 生成されたコードファイルを確認
  if (result.generated_files) {
    for (const file of result.generated_files) {
      await validateGeneratedFile(file);
    }
  }

  // コードレビュー結果を処理
  if (result.code_review) {
    await processCodeReview(result.code_review, result.task_id);
  }

  // テスト結果を処理
  if (result.test_results) {
    await processTestResults(result.test_results, result.task_id);
  }
}

async function validateGeneratedFile(fileInfo) {
  const { path: filePath, content, type } = fileInfo;
  
  console.log(`📝 ファイル確認: ${filePath}`);

  // ファイルが存在するか確認
  if (existsSync(filePath)) {
    const existingContent = await readFile(filePath, 'utf-8');
    
    // 内容が変更されているか確認
    if (existingContent !== content) {
      console.log(`🔄 ファイルが更新されました: ${filePath}`);
      
      // バックアップを作成
      const backupPath = `${filePath}.backup.${Date.now()}`;
      await writeFile(backupPath, existingContent);
      console.log(`💾 バックアップ作成: ${backupPath}`);
    }
  } else {
    console.log(`✨ 新規ファイル作成: ${filePath}`);
  }

  // TypeScriptファイルの場合、型チェックを実行
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
    await validateTypeScript(filePath);
  }
}

async function validateTypeScript(filePath) {
  try {
    const { execSync } = await import('child_process');
    
    // TypeScript型チェック
    execSync(`npx tsc --noEmit --skipLibCheck ${filePath}`, { 
      stdio: 'pipe',
      cwd: process.cwd()
    });
    
    console.log(`✅ TypeScript型チェック成功: ${filePath}`);
  } catch (error) {
    console.log(`⚠️  TypeScript型エラー: ${filePath}`);
    console.log(error.stdout?.toString() || error.message);
  }
}

async function processCodeReview(codeReview, taskId) {
  console.log(`🔍 コードレビュー処理: ${taskId}`);

  const reviewSummary = {
    task_id: taskId,
    timestamp: new Date().toISOString(),
    overall_score: codeReview.overall_score || 0,
    issues: codeReview.issues || [],
    suggestions: codeReview.suggestions || [],
    auto_fixes_applied: codeReview.auto_fixes_applied || [],
  };

  // レビュー結果をファイルに保存
  const reviewPath = `.kiro/reviews/codex-review-${taskId}-${Date.now()}.json`;
  await writeFile(reviewPath, JSON.stringify(reviewSummary, null, 2));

  // 重要な問題があれば警告
  const criticalIssues = codeReview.issues?.filter(issue => 
    issue.severity === 'error' || issue.severity === 'critical'
  );

  if (criticalIssues && criticalIssues.length > 0) {
    console.log(`🚨 重要な問題が${criticalIssues.length}件見つかりました:`);
    criticalIssues.forEach(issue => {
      console.log(`   - ${issue.message} (${issue.file}:${issue.line})`);
    });
  }
}

async function processTestResults(testResults, taskId) {
  console.log(`🧪 テスト結果処理: ${taskId}`);

  const testSummary = {
    task_id: taskId,
    timestamp: new Date().toISOString(),
    total_tests: testResults.total || 0,
    passed: testResults.passed || 0,
    failed: testResults.failed || 0,
    coverage: testResults.coverage || {},
    failed_tests: testResults.failed_tests || [],
  };

  // テスト結果をファイルに保存
  const testPath = `.kiro/tests/codex-test-${taskId}-${Date.now()}.json`;
  await writeFile(testPath, JSON.stringify(testSummary, null, 2));

  if (testResults.failed > 0) {
    console.log(`❌ ${testResults.failed}件のテストが失敗しました`);
    testResults.failed_tests?.forEach(test => {
      console.log(`   - ${test.name}: ${test.error}`);
    });
  } else {
    console.log(`✅ 全${testResults.passed}件のテストが成功しました`);
  }
}

async function updateTaskStatuses(results) {
  console.log('📋 タスクステータスを更新中...');

  const tasksContent = await readFile(KIRO_TASKS_FILE, 'utf-8');
  let updatedContent = tasksContent;

  for (const result of results) {
    const taskId = result.task_id || result.id;
    const status = determineTaskStatus(result);
    
    // タスクステータスを更新
    const taskRegex = new RegExp(
      `(### [^\\n]*${taskId}[^\\n]*\\n[\\s\\S]*?)Status: [^\\n]*`,
      'i'
    );
    
    if (taskRegex.test(updatedContent)) {
      updatedContent = updatedContent.replace(taskRegex, `$1Status: ${status}`);
      console.log(`🔄 タスクステータス更新: ${taskId} → ${status}`);
    }
  }

  await writeFile(KIRO_TASKS_FILE, updatedContent);
}

function determineTaskStatus(result) {
  // エラーがある場合
  if (result.code_review?.issues?.some(issue => 
    issue.severity === 'error' || issue.severity === 'critical'
  )) {
    return 'needs_review';
  }

  // テストが失敗している場合
  if (result.test_results?.failed > 0) {
    return 'needs_testing';
  }

  // 正常に完了した場合
  if (result.status === 'completed' || result.execution_status === 'success') {
    return 'completed';
  }

  return 'in_progress';
}

async function generateCodeReviewSummary(results) {
  console.log('📊 コードレビューサマリーを生成中...');

  const summary = {
    generated_at: new Date().toISOString(),
    total_tasks_reviewed: results.length,
    overall_quality_score: 0,
    common_issues: {},
    recommendations: [],
    tasks_by_status: {
      completed: 0,
      needs_review: 0,
      needs_testing: 0,
      in_progress: 0,
    },
  };

  let totalScore = 0;
  let scoreCount = 0;

  for (const result of results) {
    // ステータス集計
    const status = determineTaskStatus(result);
    summary.tasks_by_status[status]++;

    // スコア集計
    if (result.code_review?.overall_score) {
      totalScore += result.code_review.overall_score;
      scoreCount++;
    }

    // 共通問題の集計
    result.code_review?.issues?.forEach(issue => {
      const key = issue.type || issue.category || 'other';
      summary.common_issues[key] = (summary.common_issues[key] || 0) + 1;
    });
  }

  // 平均スコア計算
  summary.overall_quality_score = scoreCount > 0 ? totalScore / scoreCount : 0;

  // 推奨事項生成
  summary.recommendations = generateRecommendations(summary.common_issues);

  // サマリーファイル保存
  const summaryPath = `.kiro/reviews/codex-summary-${Date.now()}.json`;
  await writeFile(summaryPath, JSON.stringify(summary, null, 2));

  console.log('📋 コードレビューサマリー:');
  console.log(`   品質スコア: ${summary.overall_quality_score.toFixed(1)}/10`);
  console.log(`   完了タスク: ${summary.tasks_by_status.completed}件`);
  console.log(`   要レビュー: ${summary.tasks_by_status.needs_review}件`);
  console.log(`   要テスト: ${summary.tasks_by_status.needs_testing}件`);
}

function generateRecommendations(commonIssues) {
  const recommendations = [];
  
  if (commonIssues.typescript > 5) {
    recommendations.push('TypeScript設定の見直しを推奨します');
  }
  
  if (commonIssues.accessibility > 3) {
    recommendations.push('アクセシビリティガイドラインの確認が必要です');
  }
  
  if (commonIssues.performance > 3) {
    recommendations.push('パフォーマンス最適化を検討してください');
  }
  
  if (commonIssues.security > 1) {
    recommendations.push('セキュリティ監査を実施してください');
  }

  return recommendations;
}

// スクリプト実行
if (process.argv[1].endsWith('import-codex-results.mjs')) {
  importCodexResults();
}

export { importCodexResults };