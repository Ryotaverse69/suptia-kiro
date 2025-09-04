/**
 * 診断履歴管理ライブラリ
 * ローカルストレージを使用して診断履歴を管理
 */

export interface DiagnosisAnswers {
  purpose: string[];
  constitution: string[];
  lifestyle: string[];
  age?: number;
  weight?: number;
  gender?: 'male' | 'female' | 'other';
  allergies?: string[];
  medications?: string[];
}

export interface DiagnosisResults {
  totalScore: number;
  breakdown: {
    evidence: number;
    safety: number;
    cost: number;
    practicality: number;
  };
  costPerDay: number;
  dangerAlerts: Array<{
    ingredient: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    recommendation: string;
  }>;
  recommendedProducts: string[];
}

export interface DiagnosisHistory {
  id: string;
  timestamp: string;
  answers: DiagnosisAnswers;
  results: DiagnosisResults;
  title?: string;
  notes?: string;
}

const DIAGNOSIS_HISTORY_KEY = 'suptia-diagnosis-history';

/**
 * 診断履歴一覧を取得
 */
export function getDiagnosisHistory(): DiagnosisHistory[] {
  try {
    const history = localStorage.getItem(DIAGNOSIS_HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('診断履歴の取得に失敗しました:', error);
    return [];
  }
}

/**
 * 特定の診断履歴を取得
 */
export function getDiagnosisById(id: string): DiagnosisHistory | null {
  const history = getDiagnosisHistory();
  return history.find(item => item.id === id) || null;
}

/**
 * 診断履歴を保存
 */
export function saveDiagnosisHistory(
  answers: DiagnosisAnswers,
  results: DiagnosisResults,
  title?: string,
  notes?: string
): DiagnosisHistory {
  try {
    const history = getDiagnosisHistory();
    const newEntry: DiagnosisHistory = {
      id: `diagnosis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      answers,
      results,
      title: title || `診断結果 ${new Date().toLocaleDateString('ja-JP')}`,
      notes,
    };

    const updatedHistory = [newEntry, ...history];
    localStorage.setItem(DIAGNOSIS_HISTORY_KEY, JSON.stringify(updatedHistory));
    
    return newEntry;
  } catch (error) {
    console.error('診断履歴の保存に失敗しました:', error);
    throw error;
  }
}

/**
 * 診断履歴を更新
 */
export function updateDiagnosisHistory(
  id: string,
  updates: Partial<Pick<DiagnosisHistory, 'title' | 'notes'>>
): void {
  try {
    const history = getDiagnosisHistory();
    const updatedHistory = history.map(item => 
      item.id === id ? { ...item, ...updates } : item
    );
    localStorage.setItem(DIAGNOSIS_HISTORY_KEY, JSON.stringify(updatedHistory));
  } catch (error) {
    console.error('診断履歴の更新に失敗しました:', error);
    throw error;
  }
}

/**
 * 診断履歴を削除
 */
export function deleteDiagnosisHistory(id: string): void {
  try {
    const history = getDiagnosisHistory();
    const updatedHistory = history.filter(item => item.id !== id);
    localStorage.setItem(DIAGNOSIS_HISTORY_KEY, JSON.stringify(updatedHistory));
  } catch (error) {
    console.error('診断履歴の削除に失敗しました:', error);
    throw error;
  }
}

/**
 * 複数の診断履歴を削除
 */
export function deleteDiagnosisHistoryBatch(ids: string[]): void {
  try {
    const history = getDiagnosisHistory();
    const updatedHistory = history.filter(item => !ids.includes(item.id));
    localStorage.setItem(DIAGNOSIS_HISTORY_KEY, JSON.stringify(updatedHistory));
  } catch (error) {
    console.error('診断履歴の一括削除に失敗しました:', error);
    throw error;
  }
}

/**
 * 診断履歴をフィルタリング
 */
export function filterDiagnosisHistory(
  filters: {
    dateFrom?: Date;
    dateTo?: Date;
    minScore?: number;
    maxScore?: number;
    purposes?: string[];
  }
): DiagnosisHistory[] {
  const history = getDiagnosisHistory();
  
  return history.filter(item => {
    const itemDate = new Date(item.timestamp);
    
    // 日付フィルタ
    if (filters.dateFrom && itemDate < filters.dateFrom) return false;
    if (filters.dateTo && itemDate > filters.dateTo) return false;
    
    // スコアフィルタ
    if (filters.minScore && item.results.totalScore < filters.minScore) return false;
    if (filters.maxScore && item.results.totalScore > filters.maxScore) return false;
    
    // 目的フィルタ
    if (filters.purposes && filters.purposes.length > 0) {
      const hasMatchingPurpose = filters.purposes.some(purpose =>
        item.answers.purpose.includes(purpose)
      );
      if (!hasMatchingPurpose) return false;
    }
    
    return true;
  });
}

/**
 * 診断履歴の統計情報を取得
 */
export function getDiagnosisStatistics(): {
  totalCount: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  mostCommonPurposes: Array<{ purpose: string; count: number }>;
  recentTrend: 'improving' | 'declining' | 'stable';
} {
  const history = getDiagnosisHistory();
  
  if (history.length === 0) {
    return {
      totalCount: 0,
      averageScore: 0,
      highestScore: 0,
      lowestScore: 0,
      mostCommonPurposes: [],
      recentTrend: 'stable',
    };
  }
  
  const scores = history.map(item => item.results.totalScore);
  const totalScore = scores.reduce((sum, score) => sum + score, 0);
  
  // 目的の集計
  const purposeCount: Record<string, number> = {};
  history.forEach(item => {
    item.answers.purpose.forEach(purpose => {
      purposeCount[purpose] = (purposeCount[purpose] || 0) + 1;
    });
  });
  
  const mostCommonPurposes = Object.entries(purposeCount)
    .map(([purpose, count]) => ({ purpose, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  
  // 最近のトレンド分析（直近5件と前5件を比較）
  let recentTrend: 'improving' | 'declining' | 'stable' = 'stable';
  if (history.length >= 6) {
    const recent5 = history.slice(0, 5);
    const previous5 = history.slice(5, 10);
    
    const recentAvg = recent5.reduce((sum, item) => sum + item.results.totalScore, 0) / 5;
    const previousAvg = previous5.reduce((sum, item) => sum + item.results.totalScore, 0) / 5;
    
    const difference = recentAvg - previousAvg;
    if (difference > 5) recentTrend = 'improving';
    else if (difference < -5) recentTrend = 'declining';
  }
  
  return {
    totalCount: history.length,
    averageScore: totalScore / history.length,
    highestScore: Math.max(...scores),
    lowestScore: Math.min(...scores),
    mostCommonPurposes,
    recentTrend,
  };
}

/**
 * 診断履歴を比較
 */
export function compareDiagnosisHistory(ids: string[]): {
  items: DiagnosisHistory[];
  comparison: {
    scoreComparison: Array<{
      id: string;
      title: string;
      totalScore: number;
      breakdown: DiagnosisResults['breakdown'];
    }>;
    answerComparison: Array<{
      question: string;
      answers: Array<{
        id: string;
        title: string;
        answer: string[];
      }>;
    }>;
  };
} {
  const history = getDiagnosisHistory();
  const items = history.filter(item => ids.includes(item.id));
  
  const scoreComparison = items.map(item => ({
    id: item.id,
    title: item.title || '無題',
    totalScore: item.results.totalScore,
    breakdown: item.results.breakdown,
  }));
  
  const answerComparison = [
    {
      question: '目的',
      answers: items.map(item => ({
        id: item.id,
        title: item.title || '無題',
        answer: item.answers.purpose,
      })),
    },
    {
      question: '体質',
      answers: items.map(item => ({
        id: item.id,
        title: item.title || '無題',
        answer: item.answers.constitution,
      })),
    },
    {
      question: 'ライフスタイル',
      answers: items.map(item => ({
        id: item.id,
        title: item.title || '無題',
        answer: item.answers.lifestyle,
      })),
    },
  ];
  
  return {
    items,
    comparison: {
      scoreComparison,
      answerComparison,
    },
  };
}

/**
 * 診断履歴データをクリア（開発・テスト用）
 */
export function clearDiagnosisHistory(): void {
  try {
    localStorage.removeItem(DIAGNOSIS_HISTORY_KEY);
  } catch (error) {
    console.error('診断履歴データのクリアに失敗しました:', error);
    throw error;
  }
}

/**
 * 診断履歴をエクスポート（JSON形式）
 */
export function exportDiagnosisHistory(): string {
  const history = getDiagnosisHistory();
  return JSON.stringify(history, null, 2);
}

/**
 * 診断履歴をインポート（JSON形式）
 */
export function importDiagnosisHistory(jsonData: string): void {
  try {
    const importedHistory = JSON.parse(jsonData) as DiagnosisHistory[];
    
    // データの妥当性チェック
    if (!Array.isArray(importedHistory)) {
      throw new Error('無効なデータ形式です');
    }
    
    const existingHistory = getDiagnosisHistory();
    const mergedHistory = [...importedHistory, ...existingHistory];
    
    // 重複を除去（IDベース）
    const uniqueHistory = mergedHistory.filter((item, index, array) =>
      array.findIndex(other => other.id === item.id) === index
    );
    
    localStorage.setItem(DIAGNOSIS_HISTORY_KEY, JSON.stringify(uniqueHistory));
  } catch (error) {
    console.error('診断履歴のインポートに失敗しました:', error);
    throw error;
  }
}