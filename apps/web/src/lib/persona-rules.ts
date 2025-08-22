export type Persona = "general" | "medical_professional" | "underage";
export type Severity = "low" | "mid" | "high";

export interface PersonaRule {
  tag: string;
  ingredient: string;
  severity: Severity;
  message: string;
  personas?: Persona[]; // if omitted, applies to all
}

export interface PersonaWarning {
  tag: string;
  ingredient: string;
  severity: Severity;
  message: string;
  personas: Persona[];
}

// Legacy interface for backward compatibility
export interface ComplianceViolation {
  originalText: string;
  suggestedText: string;
  pattern: string;
}

// Minimal persona rules with required fields
const MINIMAL_PERSONA_RULES: PersonaRule[] = [
  // Pregnancy-related warnings
  {
    tag: "pregnancy",
    ingredient: "カフェイン",
    severity: "high",
    message:
      "妊娠中のカフェイン摂取は胎児への影響が懸念されます。医師にご相談ください。",
    personas: ["general"],
  },
  {
    tag: "pregnancy",
    ingredient: "ビタミンA",
    severity: "high",
    message:
      "妊娠中の過剰なビタミンA摂取は胎児の先天性異常のリスクを高める可能性があります。",
    personas: ["general"],
  },

  // Lactation-related warnings
  {
    tag: "lactation",
    ingredient: "カフェイン",
    severity: "mid",
    message:
      "授乳中のカフェイン摂取は乳児への影響が考えられます。適量を心がけてください。",
    personas: ["general"],
  },
  {
    tag: "lactation",
    ingredient: "ハーブエキス",
    severity: "mid",
    message:
      "授乳中のハーブ摂取は乳児への影響が不明な場合があります。医師にご相談ください。",
    personas: ["general"],
  },

  // Medication interaction warnings
  {
    tag: "medication",
    ingredient: "ビタミンK",
    severity: "high",
    message:
      "血液凝固阻止薬（ワルファリンなど）を服用中の方は、ビタミンKが薬効に影響する可能性があります。",
    personas: ["general", "medical_professional"],
  },
  {
    tag: "medication",
    ingredient: "セントジョーンズワート",
    severity: "high",
    message:
      "多くの処方薬との相互作用が報告されています。服薬中の方は医師にご相談ください。",
    personas: ["general", "medical_professional"],
  },

  // Stimulant sensitivity warnings
  {
    tag: "stimulant",
    ingredient: "カフェイン",
    severity: "mid",
    message:
      "カフェインに敏感な方は、不眠や動悸などの症状が現れる可能性があります。",
    personas: ["general"],
  },
  {
    tag: "stimulant",
    ingredient: "ガラナエキス",
    severity: "mid",
    message: "天然カフェインを含むため、刺激に敏感な方はご注意ください。",
    personas: ["general"],
  },

  // Age-related warnings (3 new cases added)
  {
    tag: "underage",
    ingredient: "クレアチン",
    severity: "mid",
    message:
      "18歳未満の方への安全性が十分に確立されていません。使用前に医師にご相談ください。",
    personas: ["underage"],
  },
  {
    tag: "underage",
    ingredient: "プロテイン",
    severity: "low",
    message: "成長期の栄養バランスを考慮し、過剰摂取にご注意ください。",
    personas: ["underage"],
  },
  {
    tag: "elderly",
    ingredient: "高用量ビタミンD",
    severity: "mid",
    message:
      "高齢者の方は腎機能の低下により、高用量ビタミンDの蓄積リスクがあります。",
    personas: ["general"],
  },
];

export interface EvaluateOptions {
  personas: Persona[];
  ingredients?: string[]; // Optional ingredient list for matching
}

// Get minimal persona rules
export function getMinimalPersonaRules(): PersonaRule[] {
  return [...MINIMAL_PERSONA_RULES];
}

// Check persona rules with severity-descending sort and message deduplication
export function checkPersonaRules(
  text: string,
  ingredients: string[],
  personas: Persona[],
): PersonaWarning[] {
  if (!text || typeof text !== "string") return [];
  if (!personas || personas.length === 0) return [];
  if (!ingredients || ingredients.length === 0) return [];

  // Filter out empty ingredients
  const validIngredients = ingredients.filter(
    (ing) => ing && ing.trim().length > 0,
  );
  if (validIngredients.length === 0) return [];

  const personaSet = new Set(personas);
  const warnings: PersonaWarning[] = [];
  const seenMessages = new Set<string>();

  // Check each rule against ingredients and personas
  for (const rule of MINIMAL_PERSONA_RULES) {
    // Skip if rule has persona constraint that doesn't intersect
    if (rule.personas && !rule.personas.some((p) => personaSet.has(p))) {
      continue;
    }

    // Check if any ingredient matches (case-insensitive)
    const hasMatchingIngredient = validIngredients.some(
      (ingredient) =>
        ingredient.toLowerCase().includes(rule.ingredient.toLowerCase()) ||
        rule.ingredient.toLowerCase().includes(ingredient.toLowerCase()),
    );

    if (hasMatchingIngredient && !seenMessages.has(rule.message)) {
      warnings.push({
        tag: rule.tag,
        ingredient: rule.ingredient,
        severity: rule.severity,
        message: rule.message,
        personas: rule.personas || personas,
      });
      seenMessages.add(rule.message);
    }
  }

  // Sort by severity (high > mid > low)
  const severityOrder = { high: 3, mid: 2, low: 1 };
  warnings.sort(
    (a, b) => severityOrder[b.severity] - severityOrder[a.severity],
  );

  return warnings;
}

// Legacy function for backward compatibility
export function evaluatePersonaWarnings(
  text: string,
  { personas, ingredients = [] }: EvaluateOptions,
): ComplianceViolation[] {
  const warnings = checkPersonaRules(text, ingredients, personas);

  // Convert to legacy format
  return warnings.map((warning) => ({
    originalText: warning.ingredient,
    suggestedText: warning.message,
    pattern: warning.tag,
  }));
}

// Warning aggregation logic for folding duplicate messages
export function aggregateWarnings(
  warnings: PersonaWarning[],
): PersonaWarning[] {
  const aggregated = new Map<string, PersonaWarning>();

  for (const warning of warnings) {
    const key = `${warning.message}-${warning.severity}`;

    if (!aggregated.has(key)) {
      aggregated.set(key, { ...warning });
    } else {
      // Merge personas if same message and severity
      const existing = aggregated.get(key)!;
      const mergedPersonas = Array.from(
        new Set([...existing.personas, ...warning.personas]),
      );
      aggregated.set(key, { ...existing, personas: mergedPersonas });
    }
  }

  return Array.from(aggregated.values());
}

// Extension hook: allow callers to add/override rules in the future
export function withExtraRules(
  extra: PersonaRule[],
): (
  text: string,
  ingredients: string[],
  personas: Persona[],
) => PersonaWarning[] {
  return (text, ingredients, personas) => {
    const rules = [...MINIMAL_PERSONA_RULES, ...extra];
    const personaSet = new Set(personas);
    const warnings: PersonaWarning[] = [];
    const seenMessages = new Set<string>();

    for (const rule of rules) {
      if (rule.personas && !rule.personas.some((p) => personaSet.has(p))) {
        continue;
      }

      const hasMatchingIngredient = ingredients.some(
        (ingredient) =>
          ingredient.toLowerCase().includes(rule.ingredient.toLowerCase()) ||
          rule.ingredient.toLowerCase().includes(ingredient.toLowerCase()),
      );

      if (hasMatchingIngredient && !seenMessages.has(rule.message)) {
        warnings.push({
          tag: rule.tag,
          ingredient: rule.ingredient,
          severity: rule.severity,
          message: rule.message,
          personas: rule.personas || personas,
        });
        seenMessages.add(rule.message);
      }
    }

    const severityOrder = { high: 3, mid: 2, low: 1 };
    warnings.sort(
      (a, b) => severityOrder[b.severity] - severityOrder[a.severity],
    );

    return aggregateWarnings(warnings);
  };
}
