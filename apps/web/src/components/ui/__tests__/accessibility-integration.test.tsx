import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { AccessibleTable, AccessibleBanner, TableColumn } from '../index';

describe('Accessibility Integration Tests', () => {
  describe('AccessibleTable + AccessibleBanner Integration', () => {
    const mockHeaders: TableColumn[] = [
      { key: 'name', label: '商品名', sortable: true },
      { key: 'status', label: 'ステータス', sortable: false },
    ];

    const mockData = [
      { name: '商品A', status: 'active' },
      { name: '商品B', status: 'inactive' },
    ];

    it('テーブルとバナーが同時に表示される場合のアクセシビリティ', () => {
      const mockOnSort = vi.fn();
      const mockOnDismiss = vi.fn();

      render(
        <div>
          <AccessibleBanner
            type="info"
            message="テーブルが更新されました"
            dismissible={true}
            onDismiss={mockOnDismiss}
            role="status"
          />
          <AccessibleTable
            caption="商品一覧テーブル"
            headers={mockHeaders}
            data={mockData}
            onSort={mockOnSort}
          />
        </div>
      );

      // バナーとテーブルの両方が存在することを確認
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByRole('table')).toBeInTheDocument();

      // バナーを閉じる
      const dismissButton = screen.getByRole('button', { name: 'バナーを閉じる' });
      fireEvent.click(dismissButton);
      expect(mockOnDismiss).toHaveBeenCalled();

      // テーブルのソート機能が正常に動作することを確認
      const sortButton = screen.getByRole('button', { name: /商品名でソート/ });
      fireEvent.click(sortButton);
      expect(mockOnSort).toHaveBeenCalledWith('name', 'asc');
    });

    it('複数のバナーが表示される場合のaria-live管理', () => {
      render(
        <div>
          <AccessibleBanner
            type="error"
            message="エラーが発生しました"
            role="alert"
            aria-live="assertive"
          />
          <AccessibleBanner
            type="info"
            message="情報を更新しました"
            role="status"
            aria-live="polite"
          />
        </div>
      );

      const alertBanner = screen.getByRole('alert');
      const statusBanner = screen.getByRole('status');

      expect(alertBanner).toHaveAttribute('aria-live', 'assertive');
      expect(statusBanner).toHaveAttribute('aria-live', 'polite');
    });

    it('テーブル内でのキーボードナビゲーション順序', () => {
      const mockOnSort = vi.fn();

      render(
        <AccessibleTable
          caption="商品一覧テーブル"
          headers={mockHeaders}
          data={mockData}
          onSort={mockOnSort}
        />
      );

      const sortableButton = screen.getByRole('button', { name: /商品名でソート/ });
      
      // フォーカスを設定
      sortableButton.focus();
      expect(document.activeElement).toBe(sortableButton);

      // Enterキーでソート実行
      fireEvent.keyDown(sortableButton, { key: 'Enter' });
      expect(mockOnSort).toHaveBeenCalledWith('name', 'asc');
    });

    it('スクリーンリーダー用のaria属性が適切に設定される', () => {
      render(
        <div>
          <AccessibleBanner
            type="warning"
            message="注意が必要です"
            role="status"
          />
          <AccessibleTable
            caption="商品データテーブル"
            headers={mockHeaders}
            data={mockData}
            aria-label="商品管理テーブル"
          />
        </div>
      );

      // バナーのaria属性
      const banner = screen.getByRole('status');
      expect(banner).toHaveAttribute('aria-live', 'polite');

      // テーブルのaria属性
      const table = screen.getByRole('table');
      expect(table).toHaveAttribute('aria-label', '商品管理テーブル');

      // テーブルヘッダーのscope属性
      const nameHeader = screen.getByRole('columnheader', { name: /商品名/ });
      const statusHeader = screen.getByRole('columnheader', { name: /ステータス/ });
      
      expect(nameHeader).toHaveAttribute('scope', 'col');
      expect(statusHeader).toHaveAttribute('scope', 'col');
    });

    it('動的なソート状態の変更がaria-sortに反映される', () => {
      const mockOnSort = vi.fn();

      render(
        <AccessibleTable
          caption="商品一覧テーブル"
          headers={mockHeaders}
          data={mockData}
          onSort={mockOnSort}
        />
      );

      const nameHeader = screen.getByRole('columnheader', { name: /商品名/ });
      const sortButton = screen.getByRole('button', { name: /商品名でソート/ });

      // 初期状態
      expect(nameHeader).toHaveAttribute('aria-sort', 'none');

      // 昇順ソート
      fireEvent.click(sortButton);
      expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');

      // 降順ソート
      fireEvent.click(sortButton);
      expect(nameHeader).toHaveAttribute('aria-sort', 'desc');

      // 再び昇順ソート
      fireEvent.click(sortButton);
      expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
    });
  });

  describe('WCAG 2.1 AA Compliance', () => {
    it('フォーカス管理が適切に行われる', () => {
      const mockOnDismiss = vi.fn();

      render(
        <AccessibleBanner
          type="info"
          message="テストメッセージ"
          dismissible={true}
          onDismiss={mockOnDismiss}
        />
      );

      const dismissButton = screen.getByRole('button', { name: 'バナーを閉じる' });
      
      // フォーカスリングが表示されることを確認（CSSクラスで判定）
      expect(dismissButton).toHaveClass('focus:outline-none', 'focus:ring-2');
    });

    it('色に依存しない情報伝達', () => {
      render(
        <div>
          <AccessibleBanner type="error" message="エラー" />
          <AccessibleBanner type="warning" message="警告" />
          <AccessibleBanner type="success" message="成功" />
          <AccessibleBanner type="info" message="情報" />
        </div>
      );

      // アイコンが色以外の情報も提供していることを確認
      expect(screen.getByText('❌')).toBeInTheDocument(); // エラー
      expect(screen.getByText('⚠️')).toBeInTheDocument(); // 警告
      expect(screen.getByText('✅')).toBeInTheDocument(); // 成功
      expect(screen.getByText('ℹ️')).toBeInTheDocument(); // 情報
    });

    it('適切なセマンティック構造', () => {
      const mockHeaders: TableColumn[] = [
        { key: 'name', label: '商品名', sortable: true },
      ];
      const mockData = [{ name: '商品A' }];

      render(
        <AccessibleTable
          caption="商品テーブル"
          headers={mockHeaders}
          data={mockData}
        />
      );

      // セマンティックな要素が適切に使用されていることを確認
      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByRole('columnheader')).toBeInTheDocument();
      expect(screen.getByRole('cell')).toBeInTheDocument();
      expect(screen.getByText('商品テーブル')).toBeInTheDocument(); // caption
    });
  });
});