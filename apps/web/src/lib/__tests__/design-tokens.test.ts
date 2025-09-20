/**
 * デザイントークン - 色彩設計の一貫性テスト
 */

import {
  colors,
  validateColorConsistency,
  accessibleCombinations,
} from '../design-tokens';

describe('デザイントークン - 色彩設計', () => {
  describe('基本色彩パレット', () => {
    it('背景色が正しく定義されている', () => {
      expect(colors.background.primary).toBe('#ffffff');
      expect(colors.background.subtle).toBe('#f8fafc');
      expect(colors.background.surface).toBe('#f1f5f9');
    });

    it('テキスト色が正しく定義されている', () => {
      expect(colors.text.primary).toBe('#0f172a');
      expect(colors.text.subtle).toBe('#334155');
      expect(colors.text.muted).toBe('#64748b');
    });

    it('アクセント色が正しく定義されている', () => {
      expect(colors.accent.primary).toBe('#2563eb');
      expect(colors.accent.strong).toBe('#1d4ed8');
      expect(colors.accent.soft).toBe('rgba(37, 99, 235, 0.1)');
    });

    it('ボーダー色が正しく定義されている', () => {
      expect(colors.border.default).toBe('#e5e7eb');
      expect(colors.border.strong).toBe('#cbd5f5');
      expect(colors.border.muted).toBe('rgba(148, 163, 184, 0.24)');
    });
  });

  describe('色彩の一貫性', () => {
    it('必須色彩が要件通りに定義されている', () => {
      // タスク要件: #2563EB アクセント、#FFFFFF背景、#0F172A本文
      expect(colors.accent.primary).toBe('#2563eb');
      expect(colors.background.primary).toBe('#ffffff');
      expect(colors.text.primary).toBe('#0f172a');
    });

    it('色彩の一貫性チェックが通る', () => {
      expect(validateColorConsistency()).toBe(true);
    });
  });

  describe('アクセシビリティ対応', () => {
    it('アクセシブルな色彩組み合わせが定義されている', () => {
      expect(accessibleCombinations.primaryText.foreground).toBe('#0f172a');
      expect(accessibleCombinations.primaryText.background).toBe('#ffffff');

      expect(accessibleCombinations.accentText.foreground).toBe('#2563eb');
      expect(accessibleCombinations.accentText.background).toBe('#ffffff');

      expect(accessibleCombinations.primaryButton.foreground).toBe('#ffffff');
      expect(accessibleCombinations.primaryButton.background).toBe('#2563eb');
    });
  });

  describe('状態色', () => {
    it('状態色が適切に定義されている', () => {
      expect(colors.state.success).toBe('#10b981');
      expect(colors.state.warning).toBe('#f59e0b');
      expect(colors.state.danger).toBe('#ef4444');
    });
  });
});
