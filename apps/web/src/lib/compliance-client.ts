// Client-safe compliance checker that avoids Node.js built-ins
export type {
  ComplianceResult,
  ComplianceViolation,
  ComplianceRule,
} from './compliance-simple';
import { checkTextSimple } from './compliance-simple';

export const checkText = checkTextSimple;

export function checkCompliance(text: string) {
  return checkTextSimple(text);
}

export function generateSampleDescription(productName: string): string {
  return `${productName}は高品質な成分を使用した製品です。安全性と効果を重視して開発されています。`;
}
