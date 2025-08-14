export type Persona = "general" | "medical_professional" | "underage";

export interface PersonaRule {
  pattern: string;
  suggest: string;
  personas?: Persona[]; // if omitted, applies to all
}

// Reuse ComplianceViolation shape for seamless WarningBanner integration
export interface ComplianceViolation {
  originalText: string;
  suggestedText: string;
  pattern: string;
}

// minimal, extensible ruleset
const BASE_RULES: PersonaRule[] = [
  {
    pattern: "完治",
    suggest: "改善が期待される",
    personas: ["general", "underage"],
  },
  {
    pattern: "即効|速攻",
    suggest: "短期間での変化が報告されている",
  },
  {
    pattern: "必ず痩せる",
    suggest: "体重管理をサポートする可能性",
    personas: ["general", "underage"],
  },
];

export interface EvaluateOptions {
  personas: Persona[];
}

export function evaluatePersonaWarnings(
  text: string,
  { personas }: EvaluateOptions,
): ComplianceViolation[] {
  if (!text || typeof text !== "string" || personas.length === 0) return [];

  const personaSet = new Set(personas);
  const violations: ComplianceViolation[] = [];

  for (const rule of BASE_RULES) {
    // skip if rule has persona constraint that doesn't intersect
    if (rule.personas && !rule.personas.some((p) => personaSet.has(p)))
      continue;

    const regex = new RegExp(rule.pattern, "gi");
    const matches = text.match(regex);
    if (!matches) continue;

    for (const match of matches) {
      violations.push({
        originalText: match,
        suggestedText: rule.suggest,
        pattern: rule.pattern,
      });
    }
  }

  return violations;
}

// Extension hook: allow callers to add/override rules in the future
export function withExtraRules(
  extra: PersonaRule[],
): (text: string, opts: EvaluateOptions) => ComplianceViolation[] {
  return (text, opts) => {
    const rules = [...BASE_RULES, ...extra];
    const personaSet = new Set(opts.personas);
    const violations: ComplianceViolation[] = [];
    for (const rule of rules) {
      if (rule.personas && !rule.personas.some((p) => personaSet.has(p)))
        continue;
      const regex = new RegExp(rule.pattern, "gi");
      const matches = text.match(regex);
      if (!matches) continue;
      for (const match of matches) {
        violations.push({
          originalText: match,
          suggestedText: rule.suggest,
          pattern: rule.pattern,
        });
      }
    }
    return violations;
  };
}
