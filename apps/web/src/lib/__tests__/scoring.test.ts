import { describe, it, expect } from "vitest";
import { scoreProduct } from "@/lib/scoring";

describe("scoring", () => {
  it("boundary: all zeros -> total 0", () => {
    const r = scoreProduct({
      evidence: 0,
      safety: 0,
      cost: 0,
      practicality: 0,
    });
    expect(r.total).toBe(0);
  });

  it("boundary: all 100 -> total 100", () => {
    const r = scoreProduct({
      evidence: 100,
      safety: 100,
      cost: 100,
      practicality: 100,
    });
    expect(r.total).toBe(100);
  });

  it("weights respected: emphasis on evidence and safety", () => {
    const low = scoreProduct({
      evidence: 0,
      safety: 0,
      cost: 100,
      practicality: 100,
    });
    const high = scoreProduct({
      evidence: 100,
      safety: 100,
      cost: 0,
      practicality: 0,
    });
    expect(high.total).toBeGreaterThan(low.total);
  });

  it("composite: mixed inputs produce expected total", () => {
    const r = scoreProduct({
      evidence: 80,
      safety: 70,
      cost: 50,
      practicality: 60,
    });
    // 80*.35 + 70*.30 + 50*.20 + 60*.15 = 28 + 21 + 10 + 9 = 68
    expect(r.total).toBe(68);
  });
});
