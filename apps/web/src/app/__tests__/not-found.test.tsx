import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import NotFound from '../not-found';

describe('NotFound Page', () => {
  it('404ページが正しく表示される', () => {
    render(<NotFound />);

    expect(screen.getByText('ページが見つかりません')).toBeInTheDocument();
    expect(screen.getByText('お探しのページは存在しないか、移動された可能性があります。')).toBeInTheDocument();
    expect(screen.getByText('🔍')).toBeInTheDocument();
  });

  it('ホームに戻るリンクが表示される', () => {
    render(<NotFound />);

    const homeLink = screen.getByRole('link', { name: 'ホームに戻る' });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('成分ガイドリンクが表示される', () => {
    render(<NotFound />);

    const ingredientsLink = screen.getByRole('link', { name: '成分ガイドを見る' });
    expect(ingredientsLink).toBeInTheDocument();
    expect(ingredientsLink).toHaveAttribute('href', '/ingredients');
  });

  it('適切なCSSクラスが適用される', () => {
    render(<NotFound />);

    const container = screen.getByText('ページが見つかりません').closest('div');
    expect(container).toHaveClass('max-w-md', 'w-full', 'bg-white', 'rounded-lg');
  });

  it('レスポンシブデザインクラスが適用される', () => {
    const { container } = render(<NotFound />);

    const mainContainer = container.firstChild;
    expect(mainContainer).toHaveClass('min-h-screen', 'bg-gray-50', 'flex', 'items-center', 'justify-center', 'px-4');
  });

  it('リンクのホバー効果クラスが適用される', () => {
    render(<NotFound />);

    const homeLink = screen.getByRole('link', { name: 'ホームに戻る' });
    expect(homeLink).toHaveClass('hover:bg-blue-700', 'transition-colors');

    const ingredientsLink = screen.getByRole('link', { name: '成分ガイドを見る' });
    expect(ingredientsLink).toHaveClass('hover:bg-gray-200', 'transition-colors');
  });

  it('アクセシビリティ属性が適切に設定される', () => {
    render(<NotFound />);

    const homeLink = screen.getByRole('link', { name: 'ホームに戻る' });
    expect(homeLink).toBeInTheDocument();

    const ingredientsLink = screen.getByRole('link', { name: '成分ガイドを見る' });
    expect(ingredientsLink).toBeInTheDocument();
  });

  it('見出しが適切な階層で設定される', () => {
    render(<NotFound />);

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('ページが見つかりません');
  });

  it('テキストの色とサイズが適切に設定される', () => {
    render(<NotFound />);

    const heading = screen.getByText('ページが見つかりません');
    expect(heading).toHaveClass('text-2xl', 'font-bold', 'text-gray-900');

    const description = screen.getByText('お探しのページは存在しないか、移動された可能性があります。');
    expect(description).toHaveClass('text-gray-600');
  });

  it('ボタンスタイルが適切に適用される', () => {
    render(<NotFound />);

    const homeLink = screen.getByRole('link', { name: 'ホームに戻る' });
    expect(homeLink).toHaveClass('bg-blue-600', 'text-white', 'rounded-md');

    const ingredientsLink = screen.getByRole('link', { name: '成分ガイドを見る' });
    expect(ingredientsLink).toHaveClass('bg-gray-100', 'text-gray-700', 'rounded-md');
  });

  it('レイアウトスペーシングが適切に設定される', () => {
    render(<NotFound />);

    const container = screen.getByText('ページが見つかりません').closest('div');
    expect(container).toHaveClass('p-8', 'text-center');

    const buttonContainer = container?.querySelector('.space-y-3');
    expect(buttonContainer).toBeInTheDocument();
  });
});