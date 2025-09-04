import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { Button } from '../Button';

describe('Button', () => {
    it('デフォルトのプライマリボタンをレンダリングする', () => {
        render(<Button>テストボタン</Button>);
        const button = screen.getByRole('button', { name: 'テストボタン' });
        expect(button).toBeInTheDocument();
        expect(button).toHaveClass('bg-gradient-to-r', 'from-primary-600', 'to-primary-700');
    });

    it('セカンダリバリアントを正しく適用する', () => {
        render(<Button variant="secondary">セカンダリボタン</Button>);
        const button = screen.getByRole('button', { name: 'セカンダリボタン' });
        expect(button).toHaveClass('bg-gradient-to-r', 'from-secondary-500', 'to-secondary-600');
    });

    it('アウトラインバリアントを正しく適用する', () => {
        render(<Button variant="outline">アウトラインボタン</Button>);
        const button = screen.getByRole('button', { name: 'アウトラインボタン' });
        expect(button).toHaveClass('bg-white', 'border', 'border-gray-200');
    });

    it('ゴーストバリアントを正しく適用する', () => {
        render(<Button variant="ghost">ゴーストボタン</Button>);
        const button = screen.getByRole('button', { name: 'ゴーストボタン' });
        expect(button).toHaveClass('bg-transparent');
    });

    it('サイズバリアントを正しく適用する', () => {
        render(<Button size="sm">小さいボタン</Button>);
        const button = screen.getByRole('button', { name: '小さいボタン' });
        expect(button).toHaveClass('py-2', 'px-4', 'text-sm');
    });

    it('大きいサイズを正しく適用する', () => {
        render(<Button size="lg">大きいボタン</Button>);
        const button = screen.getByRole('button', { name: '大きいボタン' });
        expect(button).toHaveClass('py-4', 'px-8', 'text-lg');
    });

    it('無効状態を正しく処理する', () => {
        render(<Button disabled>無効ボタン</Button>);
        const button = screen.getByRole('button', { name: '無効ボタン' });
        expect(button).toBeDisabled();
        expect(button).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed');
    });

    it('クリックイベントを正しく処理する', () => {
        const handleClick = vi.fn();
        render(<Button onClick={handleClick}>クリックボタン</Button>);
        const button = screen.getByRole('button', { name: 'クリックボタン' });

        fireEvent.click(button);
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('カスタムクラス名を適用する', () => {
        render(<Button className="custom-class">カスタムボタン</Button>);
        const button = screen.getByRole('button', { name: 'カスタムボタン' });
        expect(button).toHaveClass('custom-class');
    });

    it('フォーカス時に適切なスタイルを適用する', () => {
        render(<Button>フォーカスボタン</Button>);
        const button = screen.getByRole('button', { name: 'フォーカスボタン' });

        button.focus();
        expect(button).toHaveClass('focus:ring-2', 'focus:ring-primary-500');
    });
});