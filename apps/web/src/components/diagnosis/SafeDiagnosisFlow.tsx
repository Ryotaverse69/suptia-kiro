/**
 * Safe Diagnosis Flow Component
 * 薬機法準拠の安全な診断フローコンポーネント（テスト用簡易版）
 */

"use client";

import React, { useState } from "react";
import {
  SAFE_QUESTIONS,
  SafeQuestionnaireAnalyzer,
  type SafeRecommendationCategory,
} from "../../lib/diagnosis/safe-questionnaire";

interface SafeDiagnosisFlowProps {
  onComplete?: (recommendations: SafeRecommendationCategory[]) => void;
  className?: string;
}

export const SafeDiagnosisFlow: React.FC<SafeDiagnosisFlowProps> = ({
  onComplete,
  className = "",
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Map<string, any>>(new Map());
  const [isCompleted, setIsCompleted] = useState(false);
  const [recommendations, setRecommendations] = useState<
    SafeRecommendationCategory[]
  >([]);

  const currentQuestion = SAFE_QUESTIONS[currentQuestionIndex];
  const analyzer = new SafeQuestionnaireAnalyzer();

  const handleAnswerChange = (value: any) => {
    const newResponses = new Map(responses);
    newResponses.set(currentQuestion.id, value);
    setResponses(newResponses);
  };

  const handleNext = () => {
    if (currentQuestionIndex < SAFE_QUESTIONS.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // 診断完了
      const responseArray = Array.from(responses.entries()).map(
        ([questionId, answer]) => ({
          questionId,
          answer,
          timestamp: new Date().toISOString(),
        }),
      );

      const analysisResult = analyzer.analyzeResponses(responseArray);
      setRecommendations(analysisResult);
      setIsCompleted(true);
      onComplete?.(analysisResult);
    }
  };

  if (isCompleted) {
    return (
      <div className={`max-w-2xl mx-auto ${className}`}>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            診断が完了しました
          </h2>
          <div className="space-y-4">
            {recommendations.map((category) => (
              <div
                key={category.id}
                className="p-4 border border-gray-200 rounded-lg"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {category.name}
                </h3>
                <p className="text-gray-600">{category.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-2xl mx-auto ${className}`}>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {currentQuestion.text}
          </h2>
        </div>

        <div className="space-y-3 mb-6">
          {currentQuestion.options?.map((option, index) => (
            <label
              key={index}
              className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="radio"
                name={currentQuestion.id}
                value={option}
                onChange={(e) => handleAnswerChange(e.target.value)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="text-sm text-gray-700">{option}</span>
            </label>
          ))}
        </div>

        <button
          onClick={handleNext}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {currentQuestionIndex === SAFE_QUESTIONS.length - 1
            ? "診断完了"
            : "次へ"}
        </button>
      </div>
    </div>
  );
};

export default SafeDiagnosisFlow;
