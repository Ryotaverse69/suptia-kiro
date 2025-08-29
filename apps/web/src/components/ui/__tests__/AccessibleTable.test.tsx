import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { AccessibleTable, TableColumn } from '../AccessibleTable';

describe('AccessibleTable', () => {
  const mockHeaders: TableColumn[] = [
    { key: 'name', label: '商品名', sortable: true },
    { key: 'price', label: '価格', sortable: true },
    { key: 'category', label: 'カテゴリ', sortable: false },
  ];

  const mockData = [
    { name: '商品A', price: '1000円', category: 'カテゴリ1' },
    { name: '商品B', price: '2000円', category: 'カテゴリ2' },
  ];

  it('適切なcaption要素を含む', () => {
    render(
      <AccessibleTable
        caption="商品一覧テーブル"
        headers={mockHeaders}
        data={mockData}
      />
    );

    expect(screen.getByText('商品一覧テーブル')).toBeInTheDocument();
  });

  it('テーブルヘッダーに適切なscope属性を設定する', () => {
    render(
      <AccessibleTable
        caption="商品一覧テーブル"
        headers={mockHeaders}
        data={mockData}
      />
    );

    const nameHeader = screen.getByRole('columnheader', { name: /商品名/ });
    const priceHeader = screen.getByRole('columnheader', { name: /価格/ });
    const categoryHeader = screen.getByRole('columnheader', { name: /カテゴリ/ });

    expect(nameHeader).toHaveAttribute('scope', 'col');
    expect(priceHeader).toHaveAttribute('scope', 'col');
    expect(categoryHeader).toHaveAttribute('scope', 'col');
  });

  it('ソート可能なヘッダーにaria-sort属性を設定する', () => {
    render(
      <AccessibleTable
        caption="商品一覧テーブル"
        headers={mockHeaders}
        data={mockData}
      />
    );

    const nameHeader = screen.getByRole('columnheader', { name: /商品名/ });
    const priceHeader = screen.getByRole('columnheader', { name: /価格/ });
    const categoryHeader = screen.getByRole('columnheader', { name: /カテゴリ/ });

    expect(nameHeader).toHaveAttribute('aria-sort', 'none');
    expect(priceHeader).toHaveAttribute('aria-sort', 'none');
    expect(categoryHeader).not.toHaveAttribute('aria-sort');
  });

  it('ソートボタンをクリックするとaria-sortが更新される', () => {
    const mockOnSort = vi.fn();
    render(
      <AccessibleTable
        caption="商品一覧テーブル"
        headers={mockHeaders}
        data={mockData}
        onSort={mockOnSort}
      />
    );

    const sortButton = screen.getByRole('button', { name: /商品名でソート/ });
    fireEvent.click(sortButton);

    const nameHeader = screen.getByRole('columnheader', { name: /商品名/ });
    expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
    expect(mockOnSort).toHaveBeenCalledWith('name', 'asc');
  });

  it('キーボードナビゲーション（Enter）でソートが動作する', () => {
    const mockOnSort = vi.fn();
    render(
      <AccessibleTable
        caption="商品一覧テーブル"
        headers={mockHeaders}
        data={mockData}
        onSort={mockOnSort}
      />
    );

    const sortButton = screen.getByRole('button', { name: /商品名でソート/ });
    fireEvent.keyDown(sortButton, { key: 'Enter' });

    expect(mockOnSort).toHaveBeenCalledWith('name', 'asc');
  });

  it('キーボードナビゲーション（Space）でソートが動作する', () => {
    const mockOnSort = vi.fn();
    render(
      <AccessibleTable
        caption="商品一覧テーブル"
        headers={mockHeaders}
        data={mockData}
        onSort={mockOnSort}
      />
    );

    const sortButton = screen.getByRole('button', { name: /商品名でソート/ });
    fireEvent.keyDown(sortButton, { key: ' ' });

    expect(mockOnSort).toHaveBeenCalledWith('name', 'asc');
  });

  it('ソート状態が正しく循環する（none → asc → desc → asc）', () => {
    const mockOnSort = vi.fn();
    render(
      <AccessibleTable
        caption="商品一覧テーブル"
        headers={mockHeaders}
        data={mockData}
        onSort={mockOnSort}
      />
    );

    const sortButton = screen.getByRole('button', { name: /商品名でソート/ });
    const nameHeader = screen.getByRole('columnheader', { name: /商品名/ });

    // 初期状態: none
    expect(nameHeader).toHaveAttribute('aria-sort', 'none');

    // 1回目クリック: asc
    fireEvent.click(sortButton);
    expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
    expect(mockOnSort).toHaveBeenCalledWith('name', 'asc');

    // 2回目クリック: desc
    fireEvent.click(sortButton);
    expect(nameHeader).toHaveAttribute('aria-sort', 'desc');
    expect(mockOnSort).toHaveBeenCalledWith('name', 'desc');

    // 3回目クリック: asc（再び）
    fireEvent.click(sortButton);
    expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
    expect(mockOnSort).toHaveBeenCalledWith('name', 'asc');
  });

  it('aria-labelが設定される', () => {
    render(
      <AccessibleTable
        caption="商品一覧テーブル"
        headers={mockHeaders}
        data={mockData}
        aria-label="アクセシブルな商品テーブル"
      />
    );

    const table = screen.getByRole('table');
    expect(table).toHaveAttribute('aria-label', 'アクセシブルな商品テーブル');
  });

  it('データが正しく表示される', () => {
    render(
      <AccessibleTable
        caption="商品一覧テーブル"
        headers={mockHeaders}
        data={mockData}
      />
    );

    expect(screen.getByText('商品A')).toBeInTheDocument();
    expect(screen.getByText('1000円')).toBeInTheDocument();
    expect(screen.getByText('カテゴリ1')).toBeInTheDocument();
    expect(screen.getByText('商品B')).toBeInTheDocument();
    expect(screen.getByText('2000円')).toBeInTheDocument();
    expect(screen.getByText('カテゴリ2')).toBeInTheDocument();
  });
});