import {
  getContrastRatio,
  isWCAGAACompliant,
  isWCAGAAACompliant,
  colorContrastChecks,
  generateImageAlt,
  generateScreenReaderText,
  keyboardNavigation,
} from '@/lib/accessibility';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';

describe('アクセシビリティ - コントラスト・画像alt対応', () => {
  describe('コントラスト比計算', () => {
    it('正しいコントラスト比を計算する', () => {
      // 黒と白のコントラスト比は21:1
      expect(getContrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1);

      // 同じ色のコントラスト比は1:1
      expect(getContrastRatio('#ffffff', '#ffffff')).toBe(1);

      // プライマリカラーと白のコントラスト比
      const primaryWhiteRatio = getContrastRatio('#2563eb', '#ffffff');
      expect(primaryWhiteRatio).toBeGreaterThan(4.5); // WCAG AA準拠
    });

    it('無効な色形式でエラーを投げる', () => {
      expect(() => getContrastRatio('invalid', '#ffffff')).toThrow(
        'Invalid color format'
      );
      expect(() => getContrastRatio('#ffffff', 'invalid')).toThrow(
        'Invalid color format'
      );
    });
  });

  describe('WCAG準拠チェック', () => {
    it('WCAG AA準拠を正しく判定する', () => {
      // 黒と白は確実にAA準拠
      expect(isWCAGAACompliant('#000000', '#ffffff')).toBe(true);

      // 薄いグレーと白は通常文字サイズでは非準拠
      expect(isWCAGAACompliant('#cccccc', '#ffffff')).toBe(false);

      // 大きなテキストでは基準が緩い
      expect(isWCAGAACompliant('#cccccc', '#ffffff', true)).toBe(false);
    });

    it('WCAG AAA準拠を正しく判定する', () => {
      // 黒と白はAAA準拠
      expect(isWCAGAAACompliant('#000000', '#ffffff')).toBe(true);

      // プライマリカラーはAA準拠だがAAA非準拠の可能性
      const isAAA = isWCAGAAACompliant('#2563eb', '#ffffff');
      expect(typeof isAAA).toBe('boolean');
    });
  });

  describe('プロジェクトカラーのコントラストチェック', () => {
    it('すべての主要カラーがWCAG AA準拠である', () => {
      Object.entries(colorContrastChecks).forEach(([key, check]) => {
        console.log(
          `${key}: ratio=${check.ratio.toFixed(2)}, compliant=${check.isCompliant}`
        );
        if (!check.isCompliant) {
          console.warn(
            `${key} is not WCAG AA compliant. Ratio: ${check.ratio.toFixed(2)}`
          );
        }
        expect(check.isCompliant).toBe(true);
        expect(check.ratio).toBeGreaterThan(4.5);
      });
    });

    it('コントラスト比が適切な値である', () => {
      expect(colorContrastChecks.primaryOnWhite.ratio).toBeGreaterThan(4.5);
      expect(colorContrastChecks.grayTextOnWhite.ratio).toBeGreaterThan(4.5);
      expect(colorContrastChecks.whiteOnPrimary.ratio).toBeGreaterThan(4.5);
    });
  });

  describe('画像alt属性生成', () => {
    it('商品画像のalt属性を正しく生成する', () => {
      const alt = generateImageAlt({
        type: 'product',
        name: 'ビタミンD3',
      });
      expect(alt).toBe('ビタミンD3の商品画像');
    });

    it('成分画像のalt属性を正しく生成する', () => {
      const alt = generateImageAlt({
        type: 'ingredient',
        name: 'ビタミンC',
      });
      expect(alt).toBe('ビタミンCの成分画像');
    });

    it('装飾的な画像では空のalt属性を生成する', () => {
      const alt = generateImageAlt({
        type: 'decorative',
        isDecorative: true,
      });
      expect(alt).toBe('');
    });

    it('アイコンのalt属性を正しく生成する', () => {
      const alt = generateImageAlt({
        type: 'icon',
        purpose: '検索',
      });
      expect(alt).toBe('検索');
    });
  });

  describe('スクリーンリーダー用テキスト生成', () => {
    it('完全なコンテキストでテキストを生成する', () => {
      const text = generateScreenReaderText({
        action: '詳細を見る',
        target: 'ビタミンD3',
        state: '選択中',
        additional: '新しいタブで開く',
      });
      expect(text).toBe('詳細を見る ビタミンD3 （選択中） 新しいタブで開く');
    });

    it('部分的なコンテキストでテキストを生成する', () => {
      const text = generateScreenReaderText({
        action: 'クリック',
        target: 'ボタン',
      });
      expect(text).toBe('クリック ボタン');
    });
  });

  describe('キーボードナビゲーション', () => {
    it('EnterキーとSpaceキーでアクションを実行する', () => {
      const mockCallback = vi.fn();
      const mockEvent = {
        key: 'Enter',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      keyboardNavigation.handleActivation(mockEvent, mockCallback);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockCallback).toHaveBeenCalled();
    });

    it('Spaceキーでアクションを実行する', () => {
      const mockCallback = vi.fn();
      const mockEvent = {
        key: ' ',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      keyboardNavigation.handleActivation(mockEvent, mockCallback);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockCallback).toHaveBeenCalled();
    });

    it('Escapeキーでモーダルを閉じる', () => {
      const mockCallback = vi.fn();
      const mockEvent = {
        key: 'Escape',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      keyboardNavigation.handleEscape(mockEvent, mockCallback);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockCallback).toHaveBeenCalled();
    });

    it('矢印キーでリスト内を移動する', () => {
      const mockOnIndexChange = vi.fn();
      const mockEvent = {
        key: 'ArrowDown',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      keyboardNavigation.handleArrowNavigation(
        mockEvent,
        0, // currentIndex
        2, // maxIndex
        mockOnIndexChange
      );

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockOnIndexChange).toHaveBeenCalledWith(1);
    });

    it('リストの最後から最初に戻る', () => {
      const mockOnIndexChange = vi.fn();
      const mockEvent = {
        key: 'ArrowDown',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      keyboardNavigation.handleArrowNavigation(
        mockEvent,
        2, // currentIndex (最後)
        2, // maxIndex
        mockOnIndexChange
      );

      expect(mockOnIndexChange).toHaveBeenCalledWith(0); // 最初に戻る
    });

    it('Homeキーで最初の要素に移動する', () => {
      const mockOnIndexChange = vi.fn();
      const mockEvent = {
        key: 'Home',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      keyboardNavigation.handleArrowNavigation(
        mockEvent,
        1, // currentIndex
        2, // maxIndex
        mockOnIndexChange
      );

      expect(mockOnIndexChange).toHaveBeenCalledWith(0);
    });

    it('Endキーで最後の要素に移動する', () => {
      const mockOnIndexChange = vi.fn();
      const mockEvent = {
        key: 'End',
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      keyboardNavigation.handleArrowNavigation(
        mockEvent,
        0, // currentIndex
        2, // maxIndex
        mockOnIndexChange
      );

      expect(mockOnIndexChange).toHaveBeenCalledWith(2);
    });
  });
});
