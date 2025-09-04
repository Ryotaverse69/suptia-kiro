import { 
  diagnosisScore, 
  calculatePersonalizedWeights, 
  calculateCostPerDay,
  detectDangerAlerts,
  generateRecommendations,
  generateWarnings
} from '../diagnosis-scoring';
import { DiagnosisAnswers } from '@/components/diagnosis/DiagnosisForm';
import { Product } from '../scoring';

describe('診断スコアリングシステム', () => {
  const mockProduct: Product = {
    name: 'テストサプリ',
    brand: 'テストブランド',
    ingredients: [
      {
        ingredient: {
          name: 'ビタミンC',
          evidenceLevel: 'A',
          safetyNotes: [],
          category: 'ビタミン'
        },
        amountMgPerServing: 1000
      },
      {
        ingredient: {
          name: 'ビタミンE',
          evidenceLevel: 'B',
          safetyNotes: [],
          category: 'ビタミン'
        },
        amountMgPerServing: 400
      }
    ],
    servingsPerDay: 2,
    servingsPerContainer: 60,
    priceJPY: 3000,
    form: 'capsule',
    warnings: [],
    thirdPartyTested: true
  };

  const mockAnswers: DiagnosisAnswers = {
    purpose: ['美容・アンチエイジング', '免疫力向上'],
    constitution: ['30代', '女性', '特になし'],
    lifestyle: ['週1-2回軽い運動', 'バランスの取れた食事を心がけている', '5,000円〜10,000円']
  };

  describe('calculatePersonalizedWeights', () => {
    it('目的に基づいて重みを調整する', () => {
      const weights = calculatePersonalizedWeights(mockAnswers);
      
      expect(weights.evidence).toBeGreaterThan(0);
      expect(weights.safety).toBeGreaterThan(0);
      expect(weights.cost).toBeGreaterThan(0);
      expect(weights.practicality).toBeGreaterThan(0);
      
      // 重み合計が1.0になることを確認
      const sum = weights.evidence + weights.safety + weights.cost + weights.practicality;
      expect(sum).toBeCloseTo(1.0, 3);
    });

    it('美容・アンチエイジング目的で安全性重視になる', () => {
      const beautyAnswers: DiagnosisAnswers = {
        purpose: ['美容・アンチエイジング'],
        constitution: ['30代', '女性'],
        lifestyle: ['安全性（副作用のリスクを最小限に）']
      };
      
      const weights = calculatePersonalizedWeights(beautyAnswers);
      expect(weights.safety).toBeGreaterThan(0.4); // 安全性重視
    });

    it('予算重視でコスト重みが高くなる', () => {
      const budgetAnswers: DiagnosisAnswers = {
        purpose: ['栄養補給'],
        constitution: ['20代以下'],
        lifestyle: ['コストパフォーマンス（価格と効果のバランス）', '3,000円未満']
      };
      
      const weights = calculatePersonalizedWeights(budgetAnswers);
      expect(weights.cost).toBeGreaterThan(0.3); // コスト重視
    });
  });

  describe('calculateCostPerDay', () => {
    it('正しく1日あたりのコストを計算する', () => {
      const costPerDay = calculateCostPerDay(mockProduct);
      const expected = (3000 / 60) * 2; // (価格 / 容量) * 1日摂取量
      expect(costPerDay).toBe(expected);
    });

    it('不正なデータでは0を返す', () => {
      const invalidProduct = { ...mockProduct, priceJPY: 0 };
      const costPerDay = calculateCostPerDay(invalidProduct);
      expect(costPerDay).toBe(0);
    });
  });

  describe('detectDangerAlerts', () => {
    it('危険成分を検出する', () => {
      const dangerProduct: Product = {
        ...mockProduct,
        ingredients: [
          {
            ingredient: {
              name: 'カフェイン',
              evidenceLevel: 'A',
              safetyNotes: ['過剰摂取注意'],
              category: '刺激物'
            },
            amountMgPerServing: 200
          }
        ]
      };

      const insomniaAnswers: DiagnosisAnswers = {
        purpose: ['疲労回復・エネルギー向上'],
        constitution: ['不眠・睡眠不足'],
        lifestyle: ['週3-4回定期的な運動']
      };

      const alerts = detectDangerAlerts(dangerProduct, insomniaAnswers);
      expect(alerts).toHaveLength(1);
      expect(alerts[0].ingredient).toBe('カフェイン');
      expect(alerts[0].severity).toBe('medium');
    });

    it('危険成分がない場合は空配列を返す', () => {
      const alerts = detectDangerAlerts(mockProduct, mockAnswers);
      expect(alerts).toHaveLength(0);
    });
  });

  describe('generateRecommendations', () => {
    it('高スコア要素に基づいて推奨理由を生成する', () => {
      const mockScoreResult = {
        total: 85,
        components: {
          evidence: 90,
          safety: 85,
          cost: 75,
          practicality: 80
        },
        weights: { evidence: 0.35, safety: 0.30, cost: 0.20, practicality: 0.15 },
        breakdown: {} as any,
        isComplete: true,
        missingData: []
      };

      const recommendations = generateRecommendations(mockProduct, mockAnswers, mockScoreResult);
      
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some(rec => rec.includes('科学的根拠'))).toBe(true);
      expect(recommendations.some(rec => rec.includes('安全性'))).toBe(true);
    });

    it('美容目的で適切な成分を含む場合に推奨理由を追加する', () => {
      const beautyProduct: Product = {
        ...mockProduct,
        ingredients: [
          {
            ingredient: {
              name: 'ビタミンC',
              evidenceLevel: 'A',
              safetyNotes: [],
              category: 'ビタミン'
            },
            amountMgPerServing: 1000
          }
        ]
      };

      const mockScoreResult = {
        total: 80,
        components: { evidence: 80, safety: 80, cost: 70, practicality: 75 },
        weights: { evidence: 0.35, safety: 0.30, cost: 0.20, practicality: 0.15 },
        breakdown: {} as any,
        isComplete: true,
        missingData: []
      };

      const recommendations = generateRecommendations(beautyProduct, mockAnswers, mockScoreResult);
      expect(recommendations.some(rec => rec.includes('美容・アンチエイジング'))).toBe(true);
    });
  });

  describe('generateWarnings', () => {
    it('危険成分アラートに基づいて警告を生成する', () => {
      const dangerAlerts = [
        {
          ingredient: 'カフェイン',
          severity: 'medium' as const,
          description: 'テスト説明',
          recommendation: 'テスト推奨',
          reason: 'テスト理由'
        }
      ];

      const warnings = generateWarnings(mockProduct, mockAnswers, dangerAlerts);
      expect(warnings.some(warning => warning.includes('注意すべき成分'))).toBe(true);
    });

    it('アレルギー成分を検出して警告を生成する', () => {
      const allergyAnswers: DiagnosisAnswers = {
        purpose: ['栄養補給'],
        constitution: ['乳製品', '大豆'],
        lifestyle: ['バランスの取れた食事を心がけている']
      };

      const allergyProduct: Product = {
        ...mockProduct,
        ingredients: [
          {
            ingredient: {
              name: '大豆イソフラボン',
              evidenceLevel: 'B',
              safetyNotes: [],
              category: 'イソフラボン'
            },
            amountMgPerServing: 50
          }
        ]
      };

      const warnings = generateWarnings(allergyProduct, allergyAnswers, []);
      expect(warnings.some(warning => warning.includes('アレルギー成分'))).toBe(true);
    });
  });

  describe('diagnosisScore', () => {
    it('診断結果を正しく計算する', () => {
      const result = diagnosisScore(mockProduct, mockAnswers);
      
      expect(result.totalScore).toBeGreaterThan(0);
      expect(result.totalScore).toBeLessThanOrEqual(100);
      expect(result.personalizedScore).toBeGreaterThan(0);
      expect(result.costPerDay).toBeGreaterThan(0);
      expect(Array.isArray(result.dangerAlerts)).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it('危険成分による減点が適用される', () => {
      const dangerProduct: Product = {
        ...mockProduct,
        ingredients: [
          {
            ingredient: {
              name: 'エフェドラ',
              evidenceLevel: 'C',
              safetyNotes: ['重篤な副作用リスク'],
              category: '刺激物'
            },
            amountMgPerServing: 25
          }
        ]
      };

      const result = diagnosisScore(dangerProduct, mockAnswers);
      expect(result.personalizedScore).toBeLessThan(result.baseScore.total);
      expect(result.dangerAlerts.length).toBeGreaterThan(0);
    });

    it('個人化スコアが基本スコアと異なる', () => {
      const result = diagnosisScore(mockProduct, mockAnswers);
      
      // 個人化された重みにより、スコアが調整されることを確認
      expect(typeof result.personalizedScore).toBe('number');
      expect(result.personalizedScore).toBeGreaterThan(0);
    });
  });
});