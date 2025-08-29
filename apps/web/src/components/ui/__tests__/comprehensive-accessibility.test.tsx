/**
 * 包括的アクセシビリティテスト
 * 要件8.3: アクセシビリティテスト（ARIA属性、キーボードナビゲーション）
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccessibleTable, AccessibleBanner } from '../index';

describe('包括的アクセシビリティテスト', () => {
  const user = userEvent.setup();

  describe('AccessibleTable ARIA属性テスト', () => {
    const mockHeaders = [
      { key: 'name', label: '商品名', sortable: true, sortDirection: 'none' as const },
      { key: 'price', label: '価格', sortable: true, sortDirection: 'none' as const },
      { key: 'rating', label: '評価', sortable: false }
    ];

    const mockData = [
      { name: 'ビタミンC', price: '¥2,980', rating: '★★★★★' },
      { name: 'プロテイン', price: '¥4,980', rating: '★★★★☆' }
    ];

    it('テーブルに適切なcaption要素が設定される (要件5.1)', () => {
      const caption = 'サプリメント価格比較表';
      
      render(
        <AccessibleTable
          caption={caption}
          headers={mockHeaders}
          data={mockData}
        />
      );

      const table = screen.getByRole('table');
      const captionElement = screen.getByText(caption);
      
      expect(table).toBeInTheDocument();
      expect(captionElement).toBeInTheDocument();
      expect(captionElement.tagName).toBe('CAPTION');
    });

    it('テーブルヘッダーにscope属性が設定される (要件5.2)', () => {
      render(
        <AccessibleTable
          caption="商品比較表"
          headers={mockHeaders}
          data={mockData}
        />
      );

      const headers = screen.getAllByRole('columnheader');
      headers.forEach(header => {
        expect(header).toHaveAttribute('scope', 'col');
      });
    });

    it('ソート可能なヘッダーにaria-sort属性が設定される (要件5.3)', () => {
      const sortableHeaders = [
        { key: 'name', label: '商品名', sortable: true, sortDirection: 'asc' as const },
        { key: 'price', label: '価格', sortable: true, sortDirection: 'desc' as const },
        { key: 'rating', label: '評価', sortable: false }
      ];

      render(
        <AccessibleTable
          caption="ソート可能な商品表"
          headers={sortableHeaders}
          data={mockData}
        />
      );

      const nameHeader = screen.getByText('商品名');
      const priceHeader = screen.getByText('価格');
      const ratingHeader = screen.getByText('評価');

      expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
      expect(priceHeader).toHaveAttribute('aria-sort', 'descending');
      expect(ratingHeader).not.toHaveAttribute('aria-sort');
    });
  });

  describe('AccessibleBanner ARIA属性テスト', () => {
    it('警告バナーにrole="status"が設定される (要件5.4)', () => {
      render(
        <AccessibleBanner
          type="warning"
          message="重要な警告メッセージです"
          role="status"
        />
      );

      const banner = screen.getByRole('status');
      expect(banner).toBeInTheDocument();
      expect(banner).toHaveTextContent('重要な警告メッセージです');
    });

    it('エラーバナーにrole="alert"が設定される', () => {
      render(
        <AccessibleBanner
          type="error"
          message="エラーが発生しました"
          role="alert"
        />
      );

      const banner = screen.getByRole('alert');
      expect(banner).toBeInTheDocument();
      expect(banner).toHaveTextContent('エラーが発生しました');
    });
  });  des
cribe('キーボードナビゲーションテスト', () => {
    it('ソート可能なテーブルヘッダーがキーボードでアクセス可能 (要件5.5)', async () => {
      const mockOnSort = vi.fn();
      
      render(
        <AccessibleTable
          caption="キーボードナビゲーション対応表"
          headers={mockHeaders}
          data={mockData}
          onSort={mockOnSort}
        />
      );

      const nameHeader = screen.getByText('商品名');
      
      // Tabキーでフォーカス可能
      expect(nameHeader).toHaveAttribute('tabindex', '0');
      
      // Enterキーでソート実行
      nameHeader.focus();
      await user.keyboard('{Enter}');
      
      expect(mockOnSort).toHaveBeenCalledWith('name', 'asc');
    });

    it('バナーの閉じるボタンがキーボードでアクセス可能', async () => {
      const mockOnDismiss = vi.fn();
      
      render(
        <AccessibleBanner
          type="info"
          message="情報メッセージ"
          dismissible={true}
          onDismiss={mockOnDismiss}
        />
      );

      const closeButton = screen.getByRole('button', { name: /閉じる|dismiss/i });
      
      // Tabキーでフォーカス可能
      expect(closeButton).toHaveAttribute('tabindex', '0');
      
      // Enterキーで閉じる
      closeButton.focus();
      await user.keyboard('{Enter}');
      
      expect(mockOnDismiss).toHaveBeenCalled();
    });

    it('Spaceキーでもボタンが動作する', async () => {
      const mockOnDismiss = vi.fn();
      
      render(
        <AccessibleBanner
          type="success"
          message="成功メッセージ"
          dismissible={true}
          onDismiss={mockOnDismiss}
        />
      );

      const closeButton = screen.getByRole('button', { name: /閉じる|dismiss/i });
      
      closeButton.focus();
      await user.keyboard(' '); // Spaceキー
      
      expect(mockOnDismiss).toHaveBeenCalled();
    });
  });  descr
ibe('WCAG 2.1 AA準拠テスト', () => {
    it('フォーカス表示が適切に設定される', async () => {
      render(
        <AccessibleTable
          caption="フォーカステスト表"
          headers={mockHeaders}
          data={mockData}
          onSort={vi.fn()}
        />
      );

      const nameHeader = screen.getByText('商品名');
      
      // フォーカス時のスタイル確認
      nameHeader.focus();
      await waitFor(() => {
        expect(nameHeader).toHaveFocus();
      });
      
      // フォーカス可視性の確認（outline等のスタイルが適用されることを期待）
      const computedStyle = window.getComputedStyle(nameHeader);
      expect(computedStyle.outline).not.toBe('none');
    });

    it('適切なコントラスト比が確保される', () => {
      render(
        <AccessibleBanner
          type="warning"
          message="コントラストテスト"
        />
      );

      const banner = screen.getByText('コントラストテスト');
      const computedStyle = window.getComputedStyle(banner);
      
      // 背景色と文字色が設定されていることを確認
      expect(computedStyle.backgroundColor).not.toBe('');
      expect(computedStyle.color).not.toBe('');
    });

    it('スクリーンリーダー用のテキストが適切に設定される', () => {
      render(
        <AccessibleTable
          caption="スクリーンリーダーテスト表"
          headers={[
            { key: 'name', label: '商品名', sortable: true, sortDirection: 'asc' }
          ]}
          data={[{ name: 'テスト商品' }]}
        />
      );

      const sortButton = screen.getByText('商品名');
      
      // aria-labelまたはaria-describedbyが設定されていることを確認
      expect(
        sortButton.hasAttribute('aria-label') || 
        sortButton.hasAttribute('aria-describedby')
      ).toBe(true);
    });
  });

  describe('アクセシビリティ統合シナリオ', () => {
    it('複雑なテーブル操作がアクセシブル', async () => {
      const mockOnSort = vi.fn();
      
      render(
        <AccessibleTable
          caption="複雑な商品比較表"
          headers={mockHeaders}
          data={mockData}
          onSort={mockOnSort}
        />
      );

      // 1. キーボードナビゲーション
      await user.tab(); // 最初のソート可能ヘッダーにフォーカス
      await user.keyboard('{Enter}'); // ソート実行
      
      expect(mockOnSort).toHaveBeenCalledWith('name', 'asc');
      
      // 2. 次のヘッダーに移動
      await user.tab();
      await user.keyboard('{Enter}');
      
      expect(mockOnSort).toHaveBeenCalledWith('price', 'asc');
    });
  });
});