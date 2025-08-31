// Compatibility layer for compliance checks
// Provides `checkText` and types expected by components.

export type { ComplianceResult, ComplianceViolation, ComplianceRule } from "./compliance-simple";
import { checkTextSimple } from "./compliance-simple";

export const checkText = checkTextSimple;

