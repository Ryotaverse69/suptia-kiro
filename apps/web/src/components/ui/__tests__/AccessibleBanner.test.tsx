import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { AccessibleBanner } from '../AccessibleBanner';

describe('AccessibleBanner', () => {
  it('role="status"属性が設定される', () => {
    render(
      <AccessibleBanner
        type="info"
        message="情報メッセージ"
        role="status"
      />
    );

    const banner = screen.getByRole('status');
    expect(banner).toBeInTheDocument();
  });

  it('role="alert"属性が設定される', () => {
    render(
      <AccessibleBanner
        type="error"
        message="エラーメッセージ"
        role="alert"
      />
    );

    const banner = screen.getByRole('alert');
    expect(banner).toBeInTheDocument();
  });

  it('aria-live属性が設定される', () => {
    render(
      <AccessibleBanner
        type="warning"
        message="警告メッセージ"
        aria-live="assertive"
      />
    );

    const banner = screen.getByRole('status');
    expect(banner).toHaveAttribute('aria-live', 'assertive');
  });

  it('デフォルトでaria-live="polite"が設定される', () => {
    render(
      <AccessibleBanner
        type="success"
        message="成功メッセージ"
      />
    );

    const banner = screen.getByRole('status');
    expect(banner).toHaveAttribute('aria-live', 'polite');
  });

  it('各タイプに応じた適切なスタイルが適用される', () => {
    const { rerender } = render(
      <AccessibleBanner type="warning" message="警告" />
    );
    expect(screen.getByRole('status')).toHaveClass('bg-yellow-50', 'border-yellow-200', 'text-yellow-800');

    rerender(<AccessibleBanner type="error" message="エラー" />);
    expect(screen.getByRole('status')).toHaveClass('bg-red-50', 'border-red-200', 'text-red-800');

    rerender(<AccessibleBanner type="info" message="情報" />);
    expect(screen.getByRole('status')).toHaveClass('bg-blue-50', 'border-blue-200', 'text-blue-800');

    rerender(<AccessibleBanner type="success" message="成功" />);
    expect(screen.getByRole('status')).toHaveClass('bg-green-50', 'border-green-200', 'text-green-800');
  });

  it('dismissibleがtrueの場合、閉じるボタンが表示される', () => {
    const mockOnDismiss = vi.fn();
    render(
      <AccessibleBanner
        type="info"
        message="情報メッセージ"
        dismissible={true}
        onDismiss={mockOnDismiss}
      />
    );

    const dismissButton = screen.getByRole('button', { name: 'バナーを閉じる' });
    expect(dismissButton).toBeInTheDocument();
  });

  it('dismissibleがfalseの場合、閉じるボタンが表示されない', () => {
    render(
      <AccessibleBanner
        type="info"
        message="情報メッセージ"
        dismissible={false}
      />
    );

    const dismissButton = screen.queryByRole('button', { name: 'バナーを閉じる' });
    expect(dismissButton).not.toBeInTheDocument();
  });

  it('閉じるボタンをクリックするとonDismissが呼ばれる', () => {
    const mockOnDismiss = vi.fn();
    render(
      <AccessibleBanner
        type="info"
        message="情報メッセージ"
        dismissible={true}
        onDismiss={mockOnDismiss}
      />
    );

    const dismissButton = screen.getByRole('button', { name: 'バナーを閉じる' });
    fireEvent.click(dismissButton);

    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });

  it('キーボードナビゲーション（Enter）で閉じるボタンが動作する', () => {
    const mockOnDismiss = vi.fn();
    render(
      <AccessibleBanner
        type="info"
        message="情報メッセージ"
        dismissible={true}
        onDismiss={mockOnDismiss}
      />
    );

    const dismissButton = screen.getByRole('button', { name: 'バナーを閉じる' });
    fireEvent.keyDown(dismissButton, { key: 'Enter' });

    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });

  it('キーボードナビゲーション（Space）で閉じるボタンが動作する', () => {
    const mockOnDismiss = vi.fn();
    render(
      <AccessibleBanner
        type="info"
        message="情報メッセージ"
        dismissible={true}
        onDismiss={mockOnDismiss}
      />
    );

    const dismissButton = screen.getByRole('button', { name: 'バナーを閉じる' });
    fireEvent.keyDown(dismissButton, { key: ' ' });

    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });

  it('メッセージが正しく表示される', () => {
    render(
      <AccessibleBanner
        type="info"
        message="テストメッセージ"
      />
    );

    expect(screen.getByText('テストメッセージ')).toBeInTheDocument();
  });

  it('各タイプに応じた適切なアイコンが表示される', () => {
    const { rerender } = render(
      <AccessibleBanner type="warning" message="警告" />
    );
    expect(screen.getByText('⚠️')).toBeInTheDocument();

    rerender(<AccessibleBanner type="error" message="エラー" />);
    expect(screen.getByText('❌')).toBeInTheDocument();

    rerender(<AccessibleBanner type="info" message="情報" />);
    expect(screen.getByText('ℹ️')).toBeInTheDocument();

    rerender(<AccessibleBanner type="success" message="成功" />);
    expect(screen.getByText('✅')).toBeInTheDocument();
  });

  it('カスタムクラス名が適用される', () => {
    render(
      <AccessibleBanner
        type="info"
        message="情報メッセージ"
        className="custom-class"
      />
    );

    const banner = screen.getByRole('status');
    expect(banner).toHaveClass('custom-class');
  });
});