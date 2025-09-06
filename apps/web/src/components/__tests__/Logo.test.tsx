import { render, screen } from '@testing-library/react';
import { Logo } from '../Logo';

describe('Logo Component', () => {
  test('フルロゴ（サプティア + Suptia + アイコン）が正しく表示される', () => {
    render(<Logo variant='full' size='md' />);

    // サプティアテキストが表示されることを確認
    expect(screen.getByText('サプティア')).toBeInTheDocument();

    // Suptiaテキストが表示されることを確認
    expect(screen.getByText('Suptia')).toBeInTheDocument();

    // アイコン（S）が表示されることを確認
    expect(screen.getByText('S')).toBeInTheDocument();
  });

  test('アイコンのみの表示が正しく動作する', () => {
    render(<Logo variant='icon-only' size='md' />);

    // アイコン（S）が表示されることを確認
    expect(screen.getByText('S')).toBeInTheDocument();

    // テキストが表示されないことを確認
    expect(screen.queryByText('サプティア')).not.toBeInTheDocument();
    expect(screen.queryByText('Suptia')).not.toBeInTheDocument();
  });

  test('テキストのみの表示が正しく動作する', () => {
    render(<Logo variant='text-only' size='md' />);

    // サプティアテキストが表示されることを確認
    expect(screen.getByText('サプティア')).toBeInTheDocument();

    // Suptiaテキストが表示されることを確認
    expect(screen.getByText('Suptia')).toBeInTheDocument();

    // アイコンが表示されないことを確認
    expect(screen.queryByText('S')).not.toBeInTheDocument();
  });

  test('サイズバリエーションが正しく適用される', () => {
    const { rerender } = render(<Logo variant='full' size='sm' />);

    // 小サイズのクラスが適用されることを確認
    let iconContainer = screen.getByText('S').parentElement;
    expect(iconContainer).toHaveClass('w-8', 'h-8');

    // 中サイズに変更
    rerender(<Logo variant='full' size='md' />);
    iconContainer = screen.getByText('S').parentElement;
    expect(iconContainer).toHaveClass('w-10', 'h-10');

    // 大サイズに変更
    rerender(<Logo variant='full' size='lg' />);
    iconContainer = screen.getByText('S').parentElement;
    expect(iconContainer).toHaveClass('w-12', 'h-12');
  });

  test('カスタムラベルが正しく設定される', () => {
    render(<Logo variant='full' size='md' label='カスタムラベル' />);

    // カスタムラベルが aria-label として設定されることを確認
    const logoContainer = screen.getByLabelText('カスタムラベル');
    expect(logoContainer).toBeInTheDocument();
  });

  test('デフォルトプロパティが正しく適用される', () => {
    render(<Logo />);

    // デフォルトでフルロゴが表示されることを確認
    expect(screen.getByText('サプティア')).toBeInTheDocument();
    expect(screen.getByText('Suptia')).toBeInTheDocument();
    expect(screen.getByText('S')).toBeInTheDocument();

    // デフォルトラベルが設定されることを確認
    expect(screen.getByLabelText('Suptia')).toBeInTheDocument();
  });

  test('グラデーション効果が適用される', () => {
    render(<Logo variant='full' size='md' />);

    // アイコンのグラデーション背景が適用されることを確認
    const iconContainer = screen.getByText('S').parentElement;
    expect(iconContainer).toHaveClass(
      'bg-gradient-to-br',
      'from-blue-600',
      'via-purple-600',
      'to-cyan-500'
    );

    // テキストのグラデーション効果が適用されることを確認
    const textElement = screen.getByText('サプティア');
    expect(textElement).toHaveClass(
      'bg-gradient-to-r',
      'from-blue-600',
      'to-purple-600',
      'bg-clip-text',
      'text-transparent'
    );
  });

  test('アクセシビリティ属性が適切に設定される', () => {
    render(<Logo variant='full' size='md' />);

    // アイコンが装飾的要素として適切にマークされることを確認
    const iconContainer = screen.getByText('S').parentElement;
    expect(iconContainer).toHaveAttribute('aria-hidden', 'true');

    // ロゴ全体が適切なaria-labelを持つことを確認
    expect(screen.getByLabelText('Suptia')).toBeInTheDocument();
  });

  test('近未来的でスタイリッシュなデザインが適用される', () => {
    render(<Logo variant='full' size='md' />);

    // 影効果が適用されることを確認
    const iconContainer = screen.getByText('S').parentElement;
    expect(iconContainer).toHaveClass('shadow-lg');

    // 角丸効果が適用されることを確認
    expect(iconContainer).toHaveClass('rounded-xl');

    // フォントの太さが適用されることを確認
    const suptiaText = screen.getByText('サプティア');
    expect(suptiaText).toHaveClass('font-bold');

    const englishText = screen.getByText('Suptia');
    expect(englishText).toHaveClass('font-medium');
  });
});
