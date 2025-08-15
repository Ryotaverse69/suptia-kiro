"use client";

import type { ScoreResult } from "@/lib/scoring";

interface Props {
  score: ScoreResult;
  className?: string;
}

export function ScoreDisplay({ score, className = "" }: Props) {
  return (
    <section aria-label="製品スコア" className={`mb-6 ${className}`}>
      <div
        className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
        role="group"
        aria-roledescription="合成スコア"
      >
        <h2 className="text-lg font-semibold text-gray-900">総合スコア</h2>
        <p
          className="mt-2 text-4xl font-bold text-blue-700"
          aria-live="polite"
          aria-label={`総合スコアは ${score.total} 点です`}
        >
          {score.total}
          <span className="text-base font-normal text-gray-500 ml-1">
            / 100
          </span>
        </p>
      </div>
    </section>
  );
}
