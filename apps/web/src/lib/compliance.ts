// Compliance checker with rules.json integration and safe fallbacks
// - Server: dynamically loads tools/phrase-checker/rules.json with caching
// - Client: falls back to built-in default rules (no fs dependency)

export type { ComplianceResult, ComplianceViolation, ComplianceRule } from "./compliance-simple";
import { checkTextSimple, type ComplianceResult, type ComplianceRule } from "./compliance-simple";

let cachedRules: ComplianceRule[] | null = null;
let lastLoaded = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function isServer() {
  return typeof window === 'undefined';
}

// Resolve candidate paths for rules.json in monorepo context
function getCandidatePaths(): string[] {
  const cwd = process.cwd();
  const override = process.env.COMPLIANCE_RULES_PATH;
  if (override) return [override];
  return [
    `${cwd}/tools/phrase-checker/rules.json`,
    `${cwd}/../tools/phrase-checker/rules.json`,
    `${cwd}/../../tools/phrase-checker/rules.json`,
  ];
}

export async function loadRules(): Promise<ComplianceRule[]> {
  if (!isServer()) {
    // Client cannot access fs; use default rules from simple checker
    return (null as any) as ComplianceRule[]; // signal to use fallback
  }

  const now = Date.now();
  if (cachedRules && now - lastLoaded < CACHE_TTL_MS) {
    return cachedRules;
  }

  try {
    const { default: fs } = await import('node:fs/promises');
    const { default: fssync } = await import('node:fs');
    const paths = getCandidatePaths();

    for (const p of paths) {
      try {
        if ((fssync as any).existsSync(p)) {
          const raw = await (fs as any).readFile(p, 'utf8');
          const json = JSON.parse(raw);
          const rules: ComplianceRule[] = Array.isArray(json?.ng) ? json.ng : [];
          if (rules.length > 0) {
            cachedRules = rules;
            lastLoaded = now;
            return rules;
          }
        }
      } catch {
        // try next path
      }
    }
  } catch {
    // ignore fs errors and fall back
  }

  // Fallback: indicate to use default rules in simple checker
  return (null as any) as ComplianceRule[];
}

export async function checkText(text: string): Promise<ComplianceResult> {
  const rules = await loadRules();
  if (!rules) {
    // Fallback to simple checker
    return checkTextSimple(text);
  }

  if (!text || typeof text !== 'string') {
    return { hasViolations: false, violations: [] };
  }

  const violations = [] as ComplianceResult['violations'];
  for (const rule of rules) {
    try {
      const regex = new RegExp(rule.pattern, 'gi');
      const matches = text.match(regex);
      if (matches) {
        for (const m of matches) {
          violations.push({ originalText: m, suggestedText: rule.suggest, pattern: rule.pattern });
        }
      }
    } catch {
      // ignore invalid regex entries
    }
  }

  return { hasViolations: violations.length > 0, violations };
}

// Additional functions for product pages
export function generateSampleDescription(productName: string): string {
  return `${productName}は高品質な成分を使用した製品です。安全性と効果を重視して開発されています。`;
}

export async function checkCompliance(text: string) {
  return checkText(text);
}

// Testing helper: clear cache (not exported in public API typings)
export function __clearComplianceCacheForTests() {
  cachedRules = null;
  lastLoaded = 0;
}
