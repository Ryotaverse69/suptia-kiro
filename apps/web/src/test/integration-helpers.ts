/**
 * 統合テスト用ヘルパー関数
 * 重要なユーザーフローのテストをサポート
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ReactElement } from 'react';
import { expect } from 'vitest';

// テスト用のプロバイダーでコンポーネントをラップ
export function renderWithProviders(ui: ReactElement) {
  return render(ui);
}

// モックデータ
export const mockProduct = {
  id: 'test-product-1',
  name: 'テストサプリメント',
  brand: 'テストブランド',
  description: 'テスト用のサプリメント説明',
  slug: { current: 'test-supplement' },
  images: [
    {
      asset: { url: 'https://example.com/test-image.jpg' },
      alt: 'テスト画像',
    },
  ],
  ingredients: [
    {
      name: 'ビタミンC',
      amount: 1000,
      unit: 'mg',
      dailyValue: 1111,
      form: 'アスコルビン酸',
    },
    {
      name: 'ビタミンD',
      amount: 25,
      unit: 'μg',
      dailyValue: 500,
      form: 'コレカルシフェロール',
    },
  ],
  pricing: {
    price: 2980,
    currency: 'JPY',
    servingsPerContainer: 30,
    normalizedPricePerMg: 2.98,
    costPerDay: 99.33,
  },
  research: {
    studyCount: 15,
    evidenceLevel: 'high' as const,
    keyFindings: ['免疫機能の向上', '抗酸化作用'],
    lastUpdated: new Date('2024-01-01'),
  },
  reviews: {
    averageRating: 4.5,
    totalReviews: 128,
    sentimentScore: 0.8,
    commonBenefits: ['体調が良くなった', '疲れにくくなった'],
    commonSideEffects: ['特になし'],
  },
  priceHistory: [
    { date: new Date('2024-01-01'), price: 3200, source: 'Amazon' },
    { date: new Date('2024-02-01'), price: 2980, source: 'Amazon' },
  ],
  interactions: [],
  contraindications: ['妊娠中の方は医師に相談してください'],
};

export const mockDiagnosisAnswers = {
  purpose: ['疲労回復', '免疫向上'],
  constitution: ['健康'],
  lifestyle: ['運動習慣あり'],
};

export const mockDiagnosisResults = {
  totalScore: 85.5,
  breakdown: {
    evidence: 90,
    safety: 95,
    cost: 75,
    practicality: 82,
  },
  costPerDay: 99.33,
  dangerAlerts: [],
  recommendedProducts: ['test-product-1'],
};

// ユーザーイベントのヘルパー
export const userActions = {
  // 検索フローのシミュレーション
  async performSearch(searchTerm: string) {
    const searchInput = screen.getByRole('searchbox');
    
    fireEvent.change(searchInput, { target: { value: searchTerm } });
    fireEvent.keyDown(searchInput, { key: 'Enter', code: 'Enter' });
    
    return waitFor(() => {
      expect(screen.getByText(/検索結果/)).toBeInTheDocument();
    });
  },

  // 要素をクリック
  async clickElement(element: HTMLElement) {
    fireEvent.click(element);
  },

  // テキストを入力
  async typeText(element: HTMLElement, text: string) {
    fireEvent.change(element, { target: { value: text } });
  },

  // キーを押す
  async pressKey(key: string) {
    fireEvent.keyDown(document.activeElement || document.body, { key, code: key });
  },

  // 診断フローのシミュレーション
  async completeDiagnosis() {
    // 目的を選択
    const purposeOption = screen.getByLabelText(/疲労回復/);
    fireEvent.click(purposeOption);
    
    // 体質を選択
    const constitutionOption = screen.getByLabelText(/健康/);
    fireEvent.click(constitutionOption);
    
    // ライフスタイルを選択
    const lifestyleOption = screen.getByLabelText(/運動習慣/);
    fireEvent.click(lifestyleOption);
    
    // 診断実行
    const submitButton = screen.getByRole('button', { name: /診断/ });
    fireEvent.click(submitButton);
    
    return waitFor(() => {
      expect(screen.getByText(/診断結果/)).toBeInTheDocument();
    });
  },

  // お気に入り追加のシミュレーション
  async addToFavorites() {
    const favoriteButton = screen.getByRole('button', { name: /お気に入り/ });
    fireEvent.click(favoriteButton);
    
    return waitFor(() => {
      expect(screen.getByText(/お気に入りに追加/)).toBeInTheDocument();
    });
  },

  // 比較機能のシミュレーション
  async addToComparison() {
    const compareButton = screen.getByRole('button', { name: /比較/ });
    fireEvent.click(compareButton);
    
    return waitFor(() => {
      expect(screen.getByText(/比較リストに追加/)).toBeInTheDocument();
    });
  },

  // フィルター操作のシミュレーション
  async applyFilters(filters: { category?: string; priceRange?: [number, number] }) {
    if (filters.category) {
      const categoryFilter = screen.getByLabelText(filters.category);
      fireEvent.click(categoryFilter);
    }
    
    if (filters.priceRange) {
      const minPriceInput = screen.getByLabelText(/最小価格/);
      const maxPriceInput = screen.getByLabelText(/最大価格/);
      
      fireEvent.change(minPriceInput, { target: { value: filters.priceRange[0].toString() } });
      fireEvent.change(maxPriceInput, { target: { value: filters.priceRange[1].toString() } });
    }
    
    const applyButton = screen.getByRole('button', { name: /適用/ });
    fireEvent.click(applyButton);
    
    return waitFor(() => {
      expect(screen.getByText(/フィルター適用済み/)).toBeInTheDocument();
    });
  },
};

// アクセシビリティテストのヘルパー
export const accessibilityHelpers = {
  // キーボードナビゲーションのテスト
  async testKeyboardNavigation() {
    // Tabキーでフォーカス移動
    fireEvent.keyDown(document.body, { key: 'Tab', code: 'Tab' });
    const firstFocusable = document.activeElement;
    expect(firstFocusable).toBeVisible();
    
    fireEvent.keyDown(document.body, { key: 'Tab', code: 'Tab' });
    const secondFocusable = document.activeElement;
    expect(secondFocusable).toBeVisible();
    expect(secondFocusable).not.toBe(firstFocusable);
    
    // Shift+Tabで逆方向移動
    fireEvent.keyDown(document.body, { key: 'Tab', code: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(firstFocusable);
  },

  // スクリーンリーダー対応のテスト
  testScreenReaderSupport() {
    // aria-labelの確認
    const elementsWithAriaLabel = screen.getAllByLabelText(/.*/);
    expect(elementsWithAriaLabel.length).toBeGreaterThan(0);
    
    // 見出し構造の確認
    const headings = screen.getAllByRole('heading');
    expect(headings.length).toBeGreaterThan(0);
    
    // h1が1つだけであることを確認
    const h1Elements = headings.filter(heading => heading.tagName === 'H1');
    expect(h1Elements.length).toBe(1);
  },

  // フォーカス管理のテスト
  async testFocusManagement() {
    // モーダルを開く
    const modalTrigger = screen.getByRole('button', { name: /詳細/ });
    fireEvent.click(modalTrigger);
    
    // モーダル内の最初の要素にフォーカスが移動することを確認
    const modal = screen.getByRole('dialog');
    const firstFocusableInModal = modal.querySelector('[tabindex="0"], button, input, select, textarea, a[href]');
    expect(document.activeElement).toBe(firstFocusableInModal);
  },
};

// パフォーマンステストのヘルパー
export const performanceHelpers = {
  // レンダリング時間の測定
  measureRenderTime(renderFn: () => void): number {
    const startTime = performance.now();
    renderFn();
    const endTime = performance.now();
    return endTime - startTime;
  },

  // メモリ使用量の測定（開発環境のみ）
  measureMemoryUsage(): number | null {
    if (typeof window !== 'undefined' && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return null;
  },

  // 非同期操作の時間測定
  async measureAsyncOperation<T>(operation: () => Promise<T>): Promise<{ result: T; duration: number }> {
    const startTime = performance.now();
    const result = await operation();
    const endTime = performance.now();
    return { result, duration: endTime - startTime };
  },
};

// テストデータのクリーンアップ
export const cleanup = {
  // ローカルストレージのクリア
  clearLocalStorage() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.clear();
      } catch (error) {
        // ローカルストレージがモックされている場合は無視
      }
    }
  },

  // セッションストレージのクリア
  clearSessionStorage() {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        window.sessionStorage.clear();
      } catch (error) {
        // セッションストレージがモックされている場合は無視
      }
    }
  },

  // すべてのストレージをクリア
  clearAllStorage() {
    this.clearLocalStorage();
    this.clearSessionStorage();
  },
};

// カスタムマッチャー
export const customMatchers = {
  // スコア値の範囲チェック
  toBeValidScore(received: number) {
    const pass = received >= 0 && received <= 100;
    return {
      message: () => `expected ${received} to be a valid score (0-100)`,
      pass,
    };
  },

  // 価格形式のチェック
  toBeValidPrice(received: string) {
    const priceRegex = /^¥[\d,]+$/;
    const pass = priceRegex.test(received);
    return {
      message: () => `expected ${received} to be a valid price format`,
      pass,
    };
  },

  // 日付形式のチェック
  toBeValidDate(received: string) {
    const date = new Date(received);
    const pass = !isNaN(date.getTime());
    return {
      message: () => `expected ${received} to be a valid date`,
      pass,
    };
  },
};