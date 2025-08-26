import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Loading from '../loading';

describe('Loading Page', () => {
  it('ローディングページが正しく表示される', () => {
    render(<Loading />);

    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('スピナーが表示される', () => {
    const { container } = render(<Loading />);

    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('適切なCSSクラスが適用される', () => {
    const { container } = render(<Loading />);

    const mainContainer = container.firstChild;
    expect(mainContainer).toHaveClass('min-h-screen', 'bg-gray-50', 'flex', 'items-center', 'justify-center');
  });

  it('スピナーのスタイルが適切に設定される', () => {
    const { container } = render(<Loading />);

    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toHaveClass('rounded-full', 'h-12', 'w-12', 'border-b-2', 'border-blue-600', 'mx-auto', 'mb-4');
  });

  it('テキストのスタイルが適切に設定される', () => {
    render(<Loading />);

    const text = screen.getByText('読み込み中...');
    expect(text).toHaveClass('text-gray-600');
  });

  it('中央揃えのレイアウトが適用される', () => {
    const { container } = render(<Loading />);

    const textContainer = screen.getByText('読み込み中...').parentElement;
    expect(textContainer).toHaveClass('text-center');
  });

  it('アクセシビリティを考慮した構造になっている', () => {
    render(<Loading />);

    // ローディング状態を示すテキストが存在する
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('レスポンシブデザインが適用される', () => {
    const { container } = render(<Loading />);

    const mainContainer = container.firstChild;
    expect(mainContainer).toHaveClass('min-h-screen');
  });

  it('スピナーアニメーションクラスが適用される', () => {
    const { container } = render(<Loading />);

    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('animate-spin');
  });

  it('適切な色とサイズが設定される', () => {
    const { container } = render(<Loading />);

    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toHaveClass('border-blue-600'); // ブランドカラー
    expect(spinner).toHaveClass('h-12', 'w-12'); // 適切なサイズ
  });

  it('マージンとパディングが適切に設定される', () => {
    const { container } = render(<Loading />);

    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toHaveClass('mx-auto', 'mb-4'); // 中央揃えと下マージン
  });

  it('背景色が適切に設定される', () => {
    const { container } = render(<Loading />);

    const mainContainer = container.firstChild;
    expect(mainContainer).toHaveClass('bg-gray-50'); // 薄いグレー背景
  });
});