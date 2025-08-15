"use client";

import type { ScoreResult } from "@/lib/scoring";

interface Props {
  score: ScoreResult;
  className?: string;
}

export function ScoreBreakdown({ score, className = "" }: Props) {
  const items = [
    {
      key: "evidence",
      label: "Evidence (35)",
      value: score.breakdown.evidence,
    },
    { key: "safety", label: "Safety (30)", value: score.breakdown.safety },
    { key: "cost", label: "Cost (20)", value: score.breakdown.cost },
    {
      key: "practicality",
      label: "Practicality (15)",
      value: score.breakdown.practicality,
    },
  ];
  const max = 35; // highest single weight for bar normalization

  return (
    <section aria-label="スコア内訳" className={className}>
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900">内訳</h3>
        <ul className="mt-3 space-y-3">
          {items.map((it) => {
            const pct = Math.round((it.value / max) * 100);
            return (
              <li key={it.key}>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{it.label}</span>
                  <span className="text-sm text-gray-900 font-medium">
                    {Math.round(it.value)}
                  </span>
                </div>
                <div
                  className="mt-1 h-3 w-full rounded bg-gray-100"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={max}
                  aria-valuenow={Math.round(it.value)}
                  aria-label={`${it.label} スコア ${Math.round(it.value)} / ${max}`}
                >
                  <div
                    className="h-3 rounded bg-blue-600"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
