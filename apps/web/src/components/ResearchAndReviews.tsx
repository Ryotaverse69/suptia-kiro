"use client";

import React from "react";

interface IngredientInfo {
  name: string;
  evidenceLevel?: "A" | "B" | "C";
}

export interface ResearchAndReviewsProps {
  ingredients: IngredientInfo[];
  className?: string;
}

function evidenceText(level?: "A" | "B" | "C"): { title: string; desc: string; badge: string } {
  switch (level) {
    case "A":
      return {
        title: "エビデンスレベルA",
        desc: "高品質の研究により効果が支持されています。複数の臨床試験やレビューが存在します。",
        badge: "bg-green-100 text-green-700",
      };
    case "B":
      return {
        title: "エビデンスレベルB",
        desc: "中等度の研究結果があり、効果が示唆されています。さらなる検証が望まれます。",
        badge: "bg-yellow-100 text-yellow-700",
      };
    case "C":
    default:
      return {
        title: "エビデンスレベルC",
        desc: "研究数や品質が限られており、効果は限定的または不確実です。",
        badge: "bg-gray-100 text-gray-700",
      };
  }
}

export function ResearchAndReviews({ ingredients, className = "" }: ResearchAndReviewsProps) {
  const items = (ingredients || []).slice(0, 6); // 表示数を制限

  // 口コミのダミー統計（将来的には実データで置換）
  const reviewStats = {
    average: 4.2,
    count: 128,
    summary: "多くのユーザーが体感や飲みやすさを評価していますが、個人差があります。",
  };

  return (
    <div className={`card p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
          <span className="text-2xl">📚</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">研究・口コミ</h2>
      </div>

      {/* 研究要約（簡易） */}
      {items.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">研究要約（成分別の概観）</h3>
          <ul className="space-y-3">
            {items.map((ing, idx) => {
              const info = evidenceText(ing.evidenceLevel);
              return (
                <li key={`${ing.name}-${idx}`} className="flex items-start gap-3">
                  <span className={`inline-block px-2 py-1 rounded-md text-xs font-medium ${info.badge}`}>{info.title}</span>
                  <div>
                    <div className="font-medium text-gray-900">{ing.name}</div>
                    <div className="text-sm text-gray-600">{info.desc}</div>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="mt-3 text-xs text-gray-500">
            ※ 本要約は成分のエビデンスレベルに基づく概観です。個別研究の出典は順次追加予定です。
          </div>
        </div>
      )}

      {/* 口コミ要約（ダミー） */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">口コミ要約</h3>
        <div className="flex items-center gap-3 mb-2">
          <div className="text-amber-600 font-bold">★ {reviewStats.average.toFixed(1)}</div>
          <div className="text-sm text-gray-600">({reviewStats.count}件)</div>
        </div>
        <p className="text-sm text-gray-700">{reviewStats.summary}</p>
        <div className="mt-2 text-xs text-gray-500">※ 評価は参考情報です。効果や体感には個人差があります。</div>
      </div>
    </div>
  );
}

export default ResearchAndReviews;

