import { describe, it, expect, beforeEach } from "vitest";
import {
  checkPersonaRules,
  getMinimalPersonaRules,
  getRulesByPersonaTag,
  getRulesBySeverity,
  getAvailablePersonaTags,
  WarningAggregation,
  type PersonaRule,
  type PersonaWarning,
  type PersonaCheckResult,
  type Product,
} from "../persona-rules";

describe("Persona Rules Engine", () => {
  // Sample products for testing
  const sampleProducts: Record<string, Product> = {
    caffeineProduct: {
      _id: "caffeine-1",
      title: "エナジーサプリメント",
      description: "カフェイン配合の高エネルギーサプリメント",
      ingredients: [
        { name: "カフェイン", amount: "100mg" },
        { name: "ビタミンB", amount: "50mg" }
      ]
    },
    vitaminAProduct: {
      _id: "vitamin-a-1",
      title: "ビタミンAサプリ",
      description: "レチノール配合の美容サプリメント",
      ingredients: [
        { name: "ビタミンA", amount: "5000IU" },
        { name: "ビタミンE", amount: "30mg" }
      ]
    },
    herbProduct: {
      _id: "herb-1",
      title: "ハーブサプリメント",
      description: "セントジョーンズワート配合のリラックスサプリ",
      ingredients: [
        { name: "セントジョーンズワート", amount: "300mg" },
        { name: "カモミール", amount: "200mg" }
      ]
    },
    multiIngredientProduct: {
      _id: "multi-1",
      title: "総合サプリメント",
      description: "カフェインとビタミンAを含む総合サプリメント",
      ingredients: [
        { name: "カフェイン", amount: "50mg" },
        { name: "ビタミンA", amount: "3000IU" },
        { name: "ビタミンC", amount: "100mg" }
      ]
    },
    cleanProduct: {
      _id: "clean-1",
      title: "ビタミンCサプリ",
      description: "純粋なビタミンCサプリメント",
      ingredients: [
        { name: "ビタミンC", amount: "1000mg" },
        { name: "ローズヒップ", amount: "50mg" }
      ]
    },
    emptyProduct: {
      _id: "empty-1",
      title: "",
      description: "",
      ingredients: []
    },
    noIngredientsProduct: {
      _id: "no-ingredients-1",
      title: "テストサプリ",
      description: "成分情報なし"
    }
  };

  describe("getMinimalPersonaRules", () => {
    it("最小限のペルソナルールセットを返す", () => {
      const rules = getMinimalPersonaRules();
      
      expect(rules).toHaveLength(10);
      expect(rules.every(rule => rule.id)).toBe(true);
      expect(rules.every(rule => rule.tag)).toBe(true);
      expect(rules.every(rule => rule.ingredient)).toBe(true);
      expect(rules.every(rule => rule.severity)).toBe(true);
      expect(rules.every(rule => rule.message)).toBe(true);
    });

    it("必須フィールドが正しく設定されている", () => {
      const rules = getMinimalPersonaRules();
      
      rules.forEach(rule => {
        expect(rule).toHaveProperty('id');
        expect(rule).toHaveProperty('tag');
        expect(rule).toHaveProperty('ingredient');
        expect(rule).toHaveProperty('severity');
        expect(rule).toHaveProperty('message');
        
        expect(typeof rule.id).toBe('string');
        expect(['pregnancy', 'lactation', 'medication', 'stimulant-sensitivity']).toContain(rule.tag);
        expect(typeof rule.ingredient).toBe('string');
        expect(['low', 'mid', 'high']).toContain(rule.severity);
        expect(typeof rule.message).toBe('string');
      });
    });

    it("各ペルソナタグのルールが含まれている", () => {
      const rules = getMinimalPersonaRules();
      const tags = rules.map(rule => rule.tag);
      
      expect(tags).toContain('pregnancy');
      expect(tags).toContain('lactation');
      expect(tags).toContain('medication');
      expect(tags).toContain('stimulant-sensitivity');
    });

    it("各重要度レベルのルールが含まれている", () => {
      const rules = getMinimalPersonaRules();
      const severities = rules.map(rule => rule.severity);
      
      expect(severities).toContain('low');
      expect(severities).toContain('mid');
      expect(severities).toContain('high');
    });
  });

  describe("getRulesByPersonaTag", () => {
    it("指定されたペルソナタグのルールのみを返す", () => {
      const pregnancyRules = getRulesByPersonaTag('pregnancy');
      const lactationRules = getRulesByPersonaTag('lactation');
      
      expect(pregnancyRules.every(rule => rule.tag === 'pregnancy')).toBe(true);
      expect(lactationRules.every(rule => rule.tag === 'lactation')).toBe(true);
      expect(pregnancyRules.length).toBeGreaterThan(0);
      expect(lactationRules.length).toBeGreaterThan(0);
    });

    it("存在しないペルソナタグで空配列を返す", () => {
      const rules = getRulesByPersonaTag('nonexistent' as any);
      expect(rules).toHaveLength(0);
    });
  });

  describe("getRulesBySeverity", () => {
    it("指定された重要度のルールのみを返す", () => {
      const highRules = getRulesBySeverity('high');
      const midRules = getRulesBySeverity('mid');
      const lowRules = getRulesBySeverity('low');
      
      expect(highRules.every(rule => rule.severity === 'high')).toBe(true);
      expect(midRules.every(rule => rule.severity === 'mid')).toBe(true);
      expect(lowRules.every(rule => rule.severity === 'low')).toBe(true);
    });

    it("存在しない重要度で空配列を返す", () => {
      const rules = getRulesBySeverity('critical' as any);
      expect(rules).toHaveLength(0);
    });
  });

  describe("getAvailablePersonaTags", () => {
    it("利用可能なペルソナタグを返す", () => {
      const tags = getAvailablePersonaTags();
      
      expect(tags).toHaveLength(4);
      expect(tags).toContain('pregnancy');
      expect(tags).toContain('lactation');
      expect(tags).toContain('medication');
      expect(tags).toContain('stimulant-sensitivity');
    });
  });

  describe("WarningAggregation", () => {
    let sampleWarnings: PersonaWarning[];

    beforeEach(() => {
      sampleWarnings = [
        {
          ruleId: 'rule-1',
          severity: 'low',
          message: 'Low severity warning',
          affectedIngredients: ['ingredient1']
        },
        {
          ruleId: 'rule-2',
          severity: 'high',
          message: 'High severity warning',
          affectedIngredients: ['ingredient2']
        },
        {
          ruleId: 'rule-3',
          severity: 'mid',
          message: 'Mid severity warning',
          affectedIngredients: ['ingredient3']
        },
        {
          ruleId: 'rule-4',
          severity: 'high',
          message: 'High severity warning', // Duplicate message
          affectedIngredients: ['ingredient4']
        }
      ];
    });

    describe("sortBySeverity", () => {
      it("重要度降順でソートする", () => {
        const aggregation = new WarningAggregation(sampleWarnings);
        const sorted = aggregation.sortBySeverity();
        
        expect(sorted[0].severity).toBe('high');
        expect(sorted[1].severity).toBe('high');
        expect(sorted[2].severity).toBe('mid');
        expect(sorted[3].severity).toBe('low');
      });

      it("空の警告配列を適切に処理する", () => {
        const aggregation = new WarningAggregation([]);
        const sorted = aggregation.sortBySeverity();
        
        expect(sorted).toHaveLength(0);
      });
    });

    describe("deduplicateMessages", () => {
      it("重複するメッセージを統合する", () => {
        const aggregation = new WarningAggregation(sampleWarnings);
        const deduplicated = aggregation.deduplicateMessages();
        
        expect(deduplicated).toHaveLength(3);
        
        const highWarning = deduplicated.find(w => w.message === 'High severity warning');
        expect(highWarning).toBeDefined();
        expect(highWarning!.affectedIngredients).toContain('ingredient2');
        expect(highWarning!.affectedIngredients).toContain('ingredient4');
        expect(highWarning!.severity).toBe('high');
      });

      it("より高い重要度を保持する", () => {
        const warnings: PersonaWarning[] = [
          {
            ruleId: 'rule-1',
            severity: 'low',
            message: 'Same message',
            affectedIngredients: ['ingredient1']
          },
          {
            ruleId: 'rule-2',
            severity: 'high',
            message: 'Same message',
            affectedIngredients: ['ingredient2']
          }
        ];

        const aggregation = new WarningAggregation(warnings);
        const deduplicated = aggregation.deduplicateMessages();
        
        expect(deduplicated).toHaveLength(1);
        expect(deduplicated[0].severity).toBe('high');
        expect(deduplicated[0].affectedIngredients).toHaveLength(2);
      });

      it("重複する成分を除去する", () => {
        const warnings: PersonaWarning[] = [
          {
            ruleId: 'rule-1',
            severity: 'mid',
            message: 'Same message',
            affectedIngredients: ['ingredient1', 'ingredient2']
          },
          {
            ruleId: 'rule-2',
            severity: 'mid',
            message: 'Same message',
            affectedIngredients: ['ingredient2', 'ingredient3']
          }
        ];

        const aggregation = new WarningAggregation(warnings);
        const deduplicated = aggregation.deduplicateMessages();
        
        expect(deduplicated).toHaveLength(1);
        expect(deduplicated[0].affectedIngredients).toHaveLength(3);
        expect(deduplicated[0].affectedIngredients).toContain('ingredient1');
        expect(deduplicated[0].affectedIngredients).toContain('ingredient2');
        expect(deduplicated[0].affectedIngredients).toContain('ingredient3');
      });
    });

    describe("getProcessedWarnings", () => {
      it("重複除去とソートを組み合わせて処理する", () => {
        const aggregation = new WarningAggregation(sampleWarnings);
        const processed = aggregation.getProcessedWarnings();
        
        expect(processed).toHaveLength(3);
        expect(processed[0].severity).toBe('high');
        expect(processed[1].severity).toBe('mid');
        expect(processed[2].severity).toBe('low');
        
        const highWarning = processed[0];
        expect(highWarning.message).toBe('High severity warning');
        expect(highWarning.affectedIngredients).toHaveLength(2);
      });
    });
  });

  describe("checkPersonaRules", () => {
    describe("基本的な機能", () => {
      it("ペルソナタグが空の場合は警告なしを返す", () => {
        const result = checkPersonaRules(sampleProducts.caffeineProduct, []);
        
        expect(result.hasWarnings).toBe(false);
        expect(result.warnings).toHaveLength(0);
      });

      it("ペルソナタグがnullの場合は警告なしを返す", () => {
        const result = checkPersonaRules(sampleProducts.caffeineProduct, null as any);
        
        expect(result.hasWarnings).toBe(false);
        expect(result.warnings).toHaveLength(0);
      });

      it("ペルソナタグがundefinedの場合は警告なしを返す", () => {
        const result = checkPersonaRules(sampleProducts.caffeineProduct, undefined as any);
        
        expect(result.hasWarnings).toBe(false);
        expect(result.warnings).toHaveLength(0);
      });

      it("該当しないペルソナタグの場合は警告なしを返す", () => {
        const result = checkPersonaRules(sampleProducts.caffeineProduct, ['nonexistent'] as any);
        
        expect(result.hasWarnings).toBe(false);
        expect(result.warnings).toHaveLength(0);
      });

      it("該当する成分がない場合は警告なしを返す", () => {
        const result = checkPersonaRules(sampleProducts.cleanProduct, ['pregnancy']);
        
        expect(result.hasWarnings).toBe(false);
        expect(result.warnings).toHaveLength(0);
      });
    });

    describe("妊娠中ペルソナ", () => {
      it("カフェイン含有商品で高重要度警告を生成する", () => {
        const result = checkPersonaRules(sampleProducts.caffeineProduct, ['pregnancy']);
        
        expect(result.hasWarnings).toBe(true);
        expect(result.warnings).toHaveLength(1);
        expect(result.warnings[0].severity).toBe('high');
        expect(result.warnings[0].message).toContain('妊娠中はカフェインの摂取に注意');
        expect(result.warnings[0].affectedIngredients).toContain('カフェイン');
      });

      it("ビタミンA含有商品で高重要度警告を生成する", () => {
        const result = checkPersonaRules(sampleProducts.vitaminAProduct, ['pregnancy']);
        
        expect(result.hasWarnings).toBe(true);
        expect(result.warnings).toHaveLength(1);
        expect(result.warnings[0].severity).toBe('high');
        expect(result.warnings[0].message).toContain('妊娠中は過剰なビタミンA摂取');
        expect(result.warnings[0].affectedIngredients).toContain('ビタミンa');
      });

      it("ハーブ含有商品で中重要度警告を生成する", () => {
        const result = checkPersonaRules(sampleProducts.herbProduct, ['pregnancy']);
        
        expect(result.hasWarnings).toBe(true);
        expect(result.warnings).toHaveLength(1);
        expect(result.warnings[0].severity).toBe('mid');
        expect(result.warnings[0].message).toContain('妊娠中は一部のハーブサプリメント');
        expect(result.warnings[0].affectedIngredients).toContain('セントジョーンズワート');
      });
    });

    describe("授乳中ペルソナ", () => {
      it("ハーブ含有商品で中重要度警告を生成する", () => {
        const result = checkPersonaRules(sampleProducts.herbProduct, ['lactation']);
        
        expect(result.hasWarnings).toBe(true);
        expect(result.warnings).toHaveLength(1);
        expect(result.warnings[0].severity).toBe('mid');
        expect(result.warnings[0].message).toContain('授乳中は一部のハーブが母乳に影響');
        expect(result.warnings[0].affectedIngredients).toContain('セントジョーンズワート');
      });

      it("カフェイン含有商品で中重要度警告を生成する", () => {
        const result = checkPersonaRules(sampleProducts.caffeineProduct, ['lactation']);
        
        expect(result.hasWarnings).toBe(true);
        expect(result.warnings).toHaveLength(1);
        expect(result.warnings[0].severity).toBe('mid');
        expect(result.warnings[0].message).toContain('授乳中のカフェイン摂取は適量');
        expect(result.warnings[0].affectedIngredients).toContain('カフェイン');
      });
    });

    describe("服薬中ペルソナ", () => {
      it("ビタミンK関連成分で高重要度警告を生成する", () => {
        const vitaminKProduct: Product = {
          _id: "vitamin-k-1",
          title: "ビタミンKサプリ",
          description: "ビタミンK配合サプリメント",
          ingredients: [{ name: "ビタミンK", amount: "100mcg" }]
        };

        const result = checkPersonaRules(vitaminKProduct, ['medication']);
        
        expect(result.hasWarnings).toBe(true);
        expect(result.warnings).toHaveLength(1);
        expect(result.warnings[0].severity).toBe('high');
        expect(result.warnings[0].message).toContain('服薬中の方は成分の相互作用');
        expect(result.warnings[0].affectedIngredients).toContain('ビタミンk');
      });

      it("イチョウ葉含有商品で中重要度警告を生成する", () => {
        const ginkgoProduct: Product = {
          _id: "ginkgo-1",
          title: "イチョウ葉サプリ",
          description: "イチョウ葉エキス配合",
          ingredients: [{ name: "イチョウ葉", amount: "120mg" }]
        };

        const result = checkPersonaRules(ginkgoProduct, ['medication']);
        
        expect(result.hasWarnings).toBe(true);
        expect(result.warnings).toHaveLength(1);
        expect(result.warnings[0].severity).toBe('mid');
        expect(result.warnings[0].message).toContain('血液凝固に影響する薬剤');
        expect(result.warnings[0].affectedIngredients).toContain('イチョウ葉');
      });
    });

    describe("刺激物敏感ペルソナ", () => {
      it("カフェイン含有商品で中重要度警告を生成する", () => {
        const result = checkPersonaRules(sampleProducts.caffeineProduct, ['stimulant-sensitivity']);
        
        expect(result.hasWarnings).toBe(true);
        expect(result.warnings).toHaveLength(1);
        expect(result.warnings[0].severity).toBe('mid');
        expect(result.warnings[0].message).toContain('刺激物に敏感な方は注意が必要');
        expect(result.warnings[0].affectedIngredients).toContain('カフェイン');
      });

      it("テアニン含有商品で中重要度警告を生成する", () => {
        const theanineProduct: Product = {
          _id: "theanine-1",
          title: "テアニンサプリ",
          description: "テアニン配合リラックスサプリ",
          ingredients: [{ name: "テアニン", amount: "200mg" }]
        };

        const result = checkPersonaRules(theanineProduct, ['stimulant-sensitivity']);
        
        expect(result.hasWarnings).toBe(true);
        expect(result.warnings).toHaveLength(1);
        expect(result.warnings[0].severity).toBe('mid');
        expect(result.warnings[0].message).toContain('刺激物に敏感な方は注意が必要');
        expect(result.warnings[0].affectedIngredients).toContain('テアニン');
      });

      it("タウリン含有商品で低重要度警告を生成する", () => {
        const taurineProduct: Product = {
          _id: "taurine-1",
          title: "タウリンサプリ",
          description: "タウリン配合エナジーサプリ",
          ingredients: [{ name: "タウリン", amount: "1000mg" }]
        };

        const result = checkPersonaRules(taurineProduct, ['stimulant-sensitivity']);
        
        expect(result.hasWarnings).toBe(true);
        expect(result.warnings).toHaveLength(1);
        expect(result.warnings[0].severity).toBe('low');
        expect(result.warnings[0].message).toContain('刺激物に敏感な方は注意が必要');
        expect(result.warnings[0].affectedIngredients).toContain('タウリン');
      });
    });

    describe("複数ペルソナタグ", () => {
      it("複数のペルソナタグで複数の警告を生成する", () => {
        const result = checkPersonaRules(
          sampleProducts.caffeineProduct, 
          ['pregnancy', 'lactation', 'stimulant-sensitivity']
        );
        
        expect(result.hasWarnings).toBe(true);
        expect(result.warnings.length).toBeGreaterThan(1);
        
        // 重要度順にソートされていることを確認
        for (let i = 0; i < result.warnings.length - 1; i++) {
          const severityOrder = { high: 3, mid: 2, low: 1 };
          expect(severityOrder[result.warnings[i].severity])
            .toBeGreaterThanOrEqual(severityOrder[result.warnings[i + 1].severity]);
        }
      });

      it("複数成分含有商品で複数の警告を生成する", () => {
        const result = checkPersonaRules(sampleProducts.multiIngredientProduct, ['pregnancy']);
        
        expect(result.hasWarnings).toBe(true);
        expect(result.warnings.length).toBeGreaterThan(1);
        
        const messages = result.warnings.map(w => w.message);
        expect(messages.some(m => m.includes('カフェイン'))).toBe(true);
        expect(messages.some(m => m.includes('ビタミンA'))).toBe(true);
      });
    });

    describe("警告の統合とソート", () => {
      it("重要度降順でソートされる", () => {
        const result = checkPersonaRules(
          sampleProducts.multiIngredientProduct, 
          ['pregnancy', 'stimulant-sensitivity']
        );
        
        if (result.hasWarnings && result.warnings.length > 1) {
          const severityOrder = { high: 3, mid: 2, low: 1 };
          for (let i = 0; i < result.warnings.length - 1; i++) {
            expect(severityOrder[result.warnings[i].severity])
              .toBeGreaterThanOrEqual(severityOrder[result.warnings[i + 1].severity]);
          }
        }
      });

      it("重複するメッセージが統合される", () => {
        // Create a product that would trigger the same warning from different rules
        const duplicateWarningProduct: Product = {
          _id: "duplicate-1",
          title: "刺激物サプリ",
          description: "カフェインとテアニン配合",
          ingredients: [
            { name: "カフェイン", amount: "100mg" },
            { name: "テアニン", amount: "200mg" }
          ]
        };

        const result = checkPersonaRules(duplicateWarningProduct, ['stimulant-sensitivity']);
        
        expect(result.hasWarnings).toBe(true);
        
        // Check if messages are deduplicated
        const uniqueMessages = new Set(result.warnings.map(w => w.message));
        expect(uniqueMessages.size).toBeLessThanOrEqual(result.warnings.length);
      });
    });

    describe("エッジケース", () => {
      it("空の商品情報を適切に処理する", () => {
        const result = checkPersonaRules(sampleProducts.emptyProduct, ['pregnancy']);
        
        expect(result.hasWarnings).toBe(false);
        expect(result.warnings).toHaveLength(0);
      });

      it("成分情報がない商品を適切に処理する", () => {
        const result = checkPersonaRules(sampleProducts.noIngredientsProduct, ['pregnancy']);
        
        expect(result.hasWarnings).toBe(false);
        expect(result.warnings).toHaveLength(0);
      });

      it("null商品を適切に処理する", () => {
        const result = checkPersonaRules(null as any, ['pregnancy']);
        
        expect(result.hasWarnings).toBe(false);
        expect(result.warnings).toHaveLength(0);
      });

      it("undefined商品を適切に処理する", () => {
        const result = checkPersonaRules(undefined as any, ['pregnancy']);
        
        expect(result.hasWarnings).toBe(false);
        expect(result.warnings).toHaveLength(0);
      });

      it("成分配列がnullの商品を適切に処理する", () => {
        const nullIngredientsProduct: Product = {
          _id: "null-ingredients-1",
          title: "テストサプリ",
          description: "テスト用",
          ingredients: null as any
        };

        const result = checkPersonaRules(nullIngredientsProduct, ['pregnancy']);
        
        expect(result.hasWarnings).toBe(false);
        expect(result.warnings).toHaveLength(0);
      });

      it("成分名がnullの成分を適切に処理する", () => {
        const nullIngredientNameProduct: Product = {
          _id: "null-name-1",
          title: "テストサプリ",
          description: "カフェイン配合",
          ingredients: [
            { name: null as any, amount: "100mg" },
            { name: "カフェイン", amount: "50mg" }
          ]
        };

        const result = checkPersonaRules(nullIngredientNameProduct, ['pregnancy']);
        
        expect(result.hasWarnings).toBe(true);
        expect(result.warnings).toHaveLength(1);
        expect(result.warnings[0].affectedIngredients).toContain('カフェイン');
      });

      it("大文字小文字を区別しない成分マッチングを行う", () => {
        const mixedCaseProduct: Product = {
          _id: "mixed-case-1",
          title: "テストサプリ",
          description: "CAFFEINE配合",
          ingredients: [
            { name: "CAFFEINE", amount: "100mg" }
          ]
        };

        const result = checkPersonaRules(mixedCaseProduct, ['pregnancy']);
        
        expect(result.hasWarnings).toBe(true);
        expect(result.warnings).toHaveLength(1);
        expect(result.warnings[0].affectedIngredients).toContain('caffeine');
      });

      it("英語と日本語の成分名を適切にマッチングする", () => {
        const bilingualProduct: Product = {
          _id: "bilingual-1",
          title: "バイリンガルサプリ",
          description: "caffeine and ビタミンA配合",
          ingredients: [
            { name: "caffeine", amount: "100mg" },
            { name: "retinol", amount: "5000IU" }
          ]
        };

        const result = checkPersonaRules(bilingualProduct, ['pregnancy']);
        
        expect(result.hasWarnings).toBe(true);
        expect(result.warnings.length).toBeGreaterThanOrEqual(2);
        
        const affectedIngredients = result.warnings.flatMap(w => w.affectedIngredients);
        expect(affectedIngredients).toContain('caffeine');
        expect(affectedIngredients).toContain('retinol');
      });
    });

    describe("パフォーマンステスト", () => {
      it("大量の成分を含む商品を効率的に処理する", () => {
        const largeProduct: Product = {
          _id: "large-1",
          title: "大容量サプリ",
          description: "多数の成分を含む総合サプリメント",
          ingredients: Array.from({ length: 100 }, (_, i) => ({
            name: `成分${i}`,
            amount: "10mg"
          })).concat([
            { name: "カフェイン", amount: "100mg" },
            { name: "ビタミンA", amount: "5000IU" }
          ])
        };

        const startTime = Date.now();
        const result = checkPersonaRules(largeProduct, ['pregnancy']);
        const endTime = Date.now();
        
        expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
        expect(result.hasWarnings).toBe(true);
        expect(result.warnings.length).toBeGreaterThan(0);
      });

      it("多数のペルソナタグを効率的に処理する", () => {
        const allTags = getAvailablePersonaTags();
        
        const startTime = Date.now();
        const result = checkPersonaRules(sampleProducts.multiIngredientProduct, allTags);
        const endTime = Date.now();
        
        expect(endTime - startTime).toBeLessThan(50); // Should complete within 50ms
        expect(result.hasWarnings).toBe(true);
      });
    });
  });
});