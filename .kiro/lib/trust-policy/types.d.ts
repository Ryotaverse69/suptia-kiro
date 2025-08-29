/**
 * Trust承認ポリシーの型定義
 */
export interface TrustPolicy {
    version: string;
    lastUpdated: string;
    autoApprove: AutoApproveConfig;
    manualApprove: ManualApproveConfig;
    security: SecurityConfig;
}
export interface AutoApproveConfig {
    gitOperations: string[];
    fileOperations: string[];
    cliOperations: Record<string, string[]>;
    scriptExecution: ScriptConfig;
}
export interface ManualApproveConfig {
    deleteOperations: string[];
    forceOperations: string[];
    productionImpact: string[];
}
export interface SecurityConfig {
    maxAutoApprovalPerHour: number;
    suspiciousPatternDetection: boolean;
    logAllOperations: boolean;
}
export interface ScriptConfig {
    extensions: string[];
    allowedPaths: string[];
}
export interface Operation {
    type: OperationType;
    command: string;
    args: string[];
    context: OperationContext;
    timestamp: Date;
}
export interface ClassificationResult {
    operationType: OperationType;
    riskLevel: RiskLevel;
    requiresManualApproval: boolean;
    reason: string;
    patterns: string[];
    category: 'auto' | 'manual';
}
export interface OperationContext {
    workingDirectory: string;
    user: string;
    sessionId: string;
    mcpServer?: string;
    mcpTool?: string;
    environment?: string;
}
export interface TrustDecision {
    approved: boolean;
    requiresManualApproval: boolean;
    reason: string;
    riskLevel: RiskLevel;
}
export declare enum OperationType {
    GIT = "git",
    FILE = "file",
    CLI = "cli",
    SCRIPT = "script",
    MCP = "mcp",
    UNKNOWN = "unknown"
}
export declare enum RiskLevel {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export interface PolicyValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}
export interface ExecutionResult {
    success: boolean;
    executionTime: number;
    errorMessage?: string;
    output?: string;
}
export interface PolicyUpdateReport {
    id: string;
    timestamp: Date;
    previousPolicy: TrustPolicy;
    newPolicy: TrustPolicy;
    changes: PolicyChange[];
    impactAnalysis: ImpactAnalysis;
    expectedEffects: ExpectedEffect[];
    generatedBy: string;
}
export interface PolicyChange {
    section: string;
    field: string;
    changeType: 'added' | 'removed' | 'modified';
    previousValue?: any;
    newValue?: any;
    description: string;
}
export interface ImpactAnalysis {
    affectedOperations: string[];
    securityImpact: SecurityImpact;
    performanceImpact: PerformanceImpact;
    userExperienceImpact: UserExperienceImpact;
}
export interface SecurityImpact {
    level: RiskLevel;
    description: string;
    mitigations: string[];
}
export interface PerformanceImpact {
    expectedAutoApprovalRateChange: number;
    expectedResponseTimeChange: number;
    description: string;
}
export interface UserExperienceImpact {
    trustDialogFrequencyChange: number;
    workflowDisruptionLevel: 'none' | 'minimal' | 'moderate' | 'significant';
    description: string;
}
export interface ExpectedEffect {
    category: 'security' | 'performance' | 'usability' | 'maintenance';
    description: string;
    timeframe: 'immediate' | 'short-term' | 'long-term';
    measurable: boolean;
    metrics?: string[];
}
export interface SecurityEvent {
    type: string;
    description: string;
    timestamp: Date;
    severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
    details?: any;
}
