/**
 * Persona Rules Engine
 * 
 * Provides minimal persona-based warning system for supplement products.
 * Implements required fields: {tag, ingredient, severity, message}
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 6.1, 6.2, 6.3
 */

// Core interfaces with required fields
export interface PersonaRule {
  id: string;
  tag: 'pregnancy' | 'lactation' | 'medication' | 'stimulant-sensitivity'; // 必須フィールド
  ingredient: string; // 必須フィールド（ingredientPatternから変更）
  severity: 'low' | 'mid' | 'high'; // 必須フィールド
  message: string; // 必須フィールド（warningMessageから変更）
  recommendedAction?: string; // オプション
}

export interface PersonaWarning {
  ruleId: string;
  severity: 'low' | 'mid' | 'high';
  message: string;
  action?: string;
  affectedIngredients: string[];
}

export interface PersonaCheckResult {
  hasWarnings: boolean;
  warnings: PersonaWarning[];
}

// Product interface for type safety
export interface Product {
  _id: string;
  title?: string;
  description?: string;
  ingredients?: Array<{
    name: string;
    amount?: string;
  }>;
}

/**
 * Warning aggregation utility class
 * Handles severity-descending sort and message deduplication
 */
export class WarningAggregation {
  private warnings: PersonaWarning[];

  constructor(warnings: PersonaWarning[]) {
    this.warnings = warnings;
  }

  /**
   * Sort warnings by severity in descending order (high -> mid -> low)
   */
  sortBySeverity(): PersonaWarning[] {
    const severityOrder = { high: 3, mid: 2, low: 1 };
    
    return [...this.warnings].sort((a, b) => {
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  /**
   * Deduplicate warnings with the same message
   * Combines affected ingredients for duplicate messages
   */
  deduplicateMessages(): PersonaWarning[] {
    const messageMap = new Map<string, PersonaWarning>();

    for (const warning of this.warnings) {
      const existing = messageMap.get(warning.message);
      
      if (existing) {
        // Merge affected ingredients and keep highest severity
        const combinedIngredients = [...existing.affectedIngredients, ...warning.affectedIngredients];
        existing.affectedIngredients = Array.from(new Set(combinedIngredients));
        
        // Keep highest severity
        const severityOrder = { high: 3, mid: 2, low: 1 };
        if (severityOrder[warning.severity] > severityOrder[existing.severity]) {
          existing.severity = warning.severity;
        }
      } else {
        messageMap.set(warning.message, { ...warning });
      }
    }

    return Array.from(messageMap.values());
  }

  /**
   * Get processed warnings (sorted by severity, deduplicated)
   */
  getProcessedWarnings(): PersonaWarning[] {
    const deduplicated = this.deduplicateMessages();
    const aggregation = new WarningAggregation(deduplicated);
    return aggregation.sortBySeverity();
  }
}

/**
 * Get minimal persona rules for MVP
 * Covers basic pregnancy, lactation, medication, and stimulant sensitivity rules
 */
export function getMinimalPersonaRules(): PersonaRule[] {
  return [
    // Pregnancy rules
    {
      id: 'pregnancy-caffeine',
      tag: 'pregnancy',
      ingredient: 'カフェイン|caffeine',
      severity: 'high',
      message: '妊娠中はカフェインの摂取に注意が必要です',
      recommendedAction: '医師に相談してください'
    },
    {
      id: 'pregnancy-vitamin-a',
      tag: 'pregnancy',
      ingredient: 'ビタミンA|レチノール|vitamin a|retinol',
      severity: 'high',
      message: '妊娠中は過剰なビタミンA摂取は避けてください',
      recommendedAction: '医師に相談してください'
    },
    {
      id: 'pregnancy-herbs',
      tag: 'pregnancy',
      ingredient: 'セントジョーンズワート|聖ヨハネ草|st john|エキナセア|echinacea',
      severity: 'mid',
      message: '妊娠中は一部のハーブサプリメントの使用に注意が必要です',
      recommendedAction: '使用前に医師に相談してください'
    },

    // Lactation rules
    {
      id: 'lactation-herbs',
      tag: 'lactation',
      ingredient: 'セントジョーンズワート|聖ヨハネ草|st john',
      severity: 'mid',
      message: '授乳中は一部のハーブが母乳に影響する可能性があります',
      recommendedAction: '使用前に医師に相談してください'
    },
    {
      id: 'lactation-caffeine',
      tag: 'lactation',
      ingredient: 'カフェイン|caffeine',
      severity: 'mid',
      message: '授乳中のカフェイン摂取は適量に留めてください',
      recommendedAction: '1日200mg以下に制限することをお勧めします'
    },

    // Medication interaction rules
    {
      id: 'medication-vitamin-k',
      tag: 'medication',
      ingredient: 'ビタミンK|vitamin k|ワルファリン|warfarin',
      severity: 'high',
      message: '服薬中の方は成分の相互作用にご注意ください',
      recommendedAction: '医師または薬剤師に相談してください'
    },
    {
      id: 'medication-ginkgo',
      tag: 'medication',
      ingredient: 'イチョウ葉|ginkgo|銀杏',
      severity: 'mid',
      message: '血液凝固に影響する薬剤との相互作用の可能性があります',
      recommendedAction: '医師または薬剤師に相談してください'
    },

    // Stimulant sensitivity rules
    {
      id: 'stimulant-caffeine',
      tag: 'stimulant-sensitivity',
      ingredient: 'カフェイン|caffeine',
      severity: 'mid',
      message: '刺激物に敏感な方は注意が必要な成分が含まれています',
      recommendedAction: '少量から始めることをお勧めします'
    },
    {
      id: 'stimulant-theanine',
      tag: 'stimulant-sensitivity',
      ingredient: 'テアニン|theanine|ガラナ|guarana',
      severity: 'mid',
      message: '刺激物に敏感な方は注意が必要な成分が含まれています',
      recommendedAction: '少量から始めることをお勧めします'
    },
    {
      id: 'stimulant-taurine',
      tag: 'stimulant-sensitivity',
      ingredient: 'タウリン|taurine',
      severity: 'low',
      message: '刺激物に敏感な方は注意が必要な成分が含まれています',
      recommendedAction: '体調に注意して摂取してください'
    }
  ];
}

/**
 * Check persona rules against product ingredients
 * Returns warnings sorted by severity (descending) with deduplicated messages
 * 
 * @param product Product to check
 * @param personaTags Array of persona tags to check against
 * @returns PersonaCheckResult with warnings
 */
export function checkPersonaRules(
  product: Product,
  personaTags: string[]
): PersonaCheckResult {
  // Return early if no persona tags provided
  if (!personaTags || personaTags.length === 0) {
    return {
      hasWarnings: false,
      warnings: []
    };
  }

  // Get all rules and filter by persona tags
  const allRules = getMinimalPersonaRules();
  const applicableRules = allRules.filter(rule => 
    personaTags.includes(rule.tag)
  );

  // Return early if no applicable rules
  if (applicableRules.length === 0) {
    return {
      hasWarnings: false,
      warnings: []
    };
  }

  // Extract product text for ingredient matching
  const productText = extractProductText(product);
  
  // Check each rule against product ingredients
  const warnings: PersonaWarning[] = [];
  
  for (const rule of applicableRules) {
    const matchedIngredients = findMatchingIngredients(productText, rule.ingredient);
    
    if (matchedIngredients.length > 0) {
      warnings.push({
        ruleId: rule.id,
        severity: rule.severity,
        message: rule.message,
        action: rule.recommendedAction,
        affectedIngredients: matchedIngredients
      });
    }
  }

  // Process warnings: deduplicate and sort by severity
  const aggregation = new WarningAggregation(warnings);
  const processedWarnings = aggregation.getProcessedWarnings();

  return {
    hasWarnings: processedWarnings.length > 0,
    warnings: processedWarnings
  };
}

/**
 * Extract searchable text from product for ingredient matching
 */
function extractProductText(product: Product): string {
  // Handle null/undefined product
  if (!product) {
    return '';
  }

  const textParts: string[] = [];
  
  // Add product title and description
  if (product.title) {
    textParts.push(product.title);
  }
  
  if (product.description) {
    textParts.push(product.description);
  }
  
  // Add ingredient names
  if (product.ingredients && Array.isArray(product.ingredients)) {
    product.ingredients.forEach(ingredient => {
      if (ingredient && ingredient.name) {
        textParts.push(ingredient.name);
      }
    });
  }
  
  return textParts.join(' ').toLowerCase();
}

/**
 * Find ingredients that match the rule pattern
 */
function findMatchingIngredients(productText: string, ingredientPattern: string): string[] {
  const matches: string[] = [];
  
  try {
    // Split pattern by | to handle multiple ingredient names
    const patterns = ingredientPattern.split('|');
    
    for (const pattern of patterns) {
      const trimmedPattern = pattern.trim().toLowerCase();
      
      if (trimmedPattern && productText.includes(trimmedPattern)) {
        matches.push(trimmedPattern);
      }
    }
  } catch (error) {
    // Handle regex errors gracefully
    console.warn('Error matching ingredient pattern:', ingredientPattern, error);
  }
  
  // Return unique matches
  return Array.from(new Set(matches));
}

/**
 * Utility function to get rules by persona tag
 */
export function getRulesByPersonaTag(tag: PersonaRule['tag']): PersonaRule[] {
  return getMinimalPersonaRules().filter(rule => rule.tag === tag);
}

/**
 * Utility function to get rules by severity
 */
export function getRulesBySeverity(severity: PersonaRule['severity']): PersonaRule[] {
  return getMinimalPersonaRules().filter(rule => rule.severity === severity);
}

/**
 * Get all available persona tags
 */
export function getAvailablePersonaTags(): PersonaRule['tag'][] {
  return ['pregnancy', 'lactation', 'medication', 'stimulant-sensitivity'];
}