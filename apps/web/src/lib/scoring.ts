export interface ScoreInput {
  evidence: number; // 0-100
  safety: number; // 0-100
  cost: number; // 0-100 (高いほど良コスパ)
  practicality: number; // 0-100
}

export interface ScoreBreakdown {
  evidence: number;
  safety: number;
  cost: number;
  practicality: number;
}

export interface ScoreResult {
  total: number; // 0-100
  breakdown: ScoreBreakdown; // 各要素の重み反映後のスコア
}

const WEIGHTS = {
  evidence: 35,
  safety: 30,
  cost: 20,
  practicality: 15,
} as const;

function clamp01(x: number): number {
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(100, x));
}

export function scoreProduct(input: ScoreInput): ScoreResult {
  const e = clamp01(input.evidence);
  const s = clamp01(input.safety);
  const c = clamp01(input.cost);
  const p = clamp01(input.practicality);

  const breakdown = {
    evidence: (e * WEIGHTS.evidence) / 100,
    safety: (s * WEIGHTS.safety) / 100,
    cost: (c * WEIGHTS.cost) / 100,
    practicality: (p * WEIGHTS.practicality) / 100,
  } satisfies ScoreBreakdown;

  const total =
    breakdown.evidence +
    breakdown.safety +
    breakdown.cost +
    breakdown.practicality;

  // normalize to 0..100 because weights sum to 100
  return { total: Math.round(total), breakdown };
}

// Simple heuristic to derive inputs when full data not available
export function deriveScoreInputFromProduct(product: {
  priceJPY: number;
  servingsPerContainer: number;
  servingsPerDay: number;
  description?: string;
}): ScoreInput {
  const descLen = (product.description || "").length;
  const evidence = Math.min(100, Math.floor(descLen / 5));
  const safety = 80; // conservative default
  // cheaper per serving => higher cost score
  const perServing =
    product.servingsPerDay > 0
      ? product.priceJPY / (product.servingsPerContainer || 1)
      : product.priceJPY;
  const cost = Math.max(0, Math.min(100, Math.round(100 - perServing / 10)));
  const practicality = Math.max(
    0,
    Math.min(100, 100 - Math.abs(product.servingsPerDay - 1) * 20),
  );

  return { evidence, safety, cost, practicality };
}
