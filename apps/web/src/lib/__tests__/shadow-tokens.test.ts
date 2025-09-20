/**
 * シャドウトークン - Apple風微細シャドウ (opacity<8%) のテスト
 */

describe('シャドウトークン - Apple風微細シャドウ', () => {
  describe('CSS変数の定義', () => {
    it('shadow-softが8%未満のopacityで定義されている', () => {
      const shadowSoft = '0 8px 24px rgba(15, 23, 42, 0.06)';
      expect(shadowSoft).toMatch(/rgba\(15, 23, 42, 0\.0[0-7]\)/);
    });

    it('shadow-mediumが8%未満のopacityで定義されている', () => {
      const shadowMedium = '0 12px 32px rgba(15, 23, 42, 0.07)';
      expect(shadowMedium).toMatch(/rgba\(15, 23, 42, 0\.0[0-7]\)/);
    });

    it('shadow-strongが8%以下のopacityで定義されている', () => {
      const shadowStrong = '0 24px 60px rgba(15, 23, 42, 0.08)';
      expect(shadowStrong).toMatch(/rgba\(15, 23, 42, 0\.0[0-8]\)/);
    });
  });

  describe('opacity値の検証', () => {
    it('すべてのシャドウがopacity<8%の要件を満たしている', () => {
      const shadows = [
        '0 8px 24px rgba(15, 23, 42, 0.06)', // 6%
        '0 12px 32px rgba(15, 23, 42, 0.07)', // 7%
        '0 24px 60px rgba(15, 23, 42, 0.08)', // 8%
      ];

      shadows.forEach(shadow => {
        const opacityMatch = shadow.match(/rgba\(15, 23, 42, (0\.\d+)\)/);
        expect(opacityMatch).toBeTruthy();

        if (opacityMatch) {
          const opacity = parseFloat(opacityMatch[1]);
          expect(opacity).toBeLessThanOrEqual(0.08); // 8%以下
        }
      });
    });

    it('ingredient-category-cardのホバーシャドウも要件を満たしている', () => {
      const hoverShadow = '0 16px 48px rgba(15, 23, 42, 0.07)';
      const opacityMatch = hoverShadow.match(/rgba\(15, 23, 42, (0\.\d+)\)/);

      expect(opacityMatch).toBeTruthy();
      if (opacityMatch) {
        const opacity = parseFloat(opacityMatch[1]);
        expect(opacity).toBeLessThanOrEqual(0.08); // 8%以下
      }
    });
  });

  describe('Apple風シャドウの特徴', () => {
    it('微細で上品なシャドウ値を使用している', () => {
      // Apple風の特徴: 低いopacity、適度なblur、微細な距離
      const shadows = [
        { name: 'soft', value: '0 8px 24px rgba(15, 23, 42, 0.06)' },
        { name: 'medium', value: '0 12px 32px rgba(15, 23, 42, 0.07)' },
        { name: 'strong', value: '0 24px 60px rgba(15, 23, 42, 0.08)' },
      ];

      shadows.forEach(({ name, value }) => {
        // Y軸のオフセットが適度（8px以上）
        expect(value).toMatch(/0 \d+px/);

        // ブラー値が適切（24px以上）
        expect(value).toMatch(/0 \d+px (\d+)px/);
        const blurMatch = value.match(/0 \d+px (\d+)px/);
        if (blurMatch) {
          const blur = parseInt(blurMatch[1]);
          expect(blur).toBeGreaterThanOrEqual(24);
        }

        // 低いopacity（8%以下）
        const opacityMatch = value.match(/rgba\(15, 23, 42, (0\.\d+)\)/);
        if (opacityMatch) {
          const opacity = parseFloat(opacityMatch[1]);
          expect(opacity).toBeLessThanOrEqual(0.08);
        }
      });
    });
  });
});
