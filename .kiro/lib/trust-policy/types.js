/**
 * Trust承認ポリシーの型定義
 */
export var OperationType;
(function (OperationType) {
    OperationType["GIT"] = "git";
    OperationType["FILE"] = "file";
    OperationType["CLI"] = "cli";
    OperationType["SCRIPT"] = "script";
    OperationType["MCP"] = "mcp";
    OperationType["UNKNOWN"] = "unknown";
})(OperationType || (OperationType = {}));
export var RiskLevel;
(function (RiskLevel) {
    RiskLevel["LOW"] = "low";
    RiskLevel["MEDIUM"] = "medium";
    RiskLevel["HIGH"] = "high";
    RiskLevel["CRITICAL"] = "critical";
})(RiskLevel || (RiskLevel = {}));
