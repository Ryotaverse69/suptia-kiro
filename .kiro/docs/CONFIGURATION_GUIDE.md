# システム品質保証 設定ガイド

**バージョン:** 1.0  
**最終更新:** 2025-08-29  
**対象:** システム管理者、DevOps担当者

## 概要

このドキュメントは、システム品質保証機能の設定方法について詳細に説明します。品質ゲート、パフォーマンス閾値、テスト設定、自動修正機能の設定方法を包括的にカバーします。

## 設定ファイル一覧

### 主要設定ファイル

| ファイル | 用途 | 必須 |
|---------|------|------|
| `.kiro/settings/trust-policy.json` | Trust承認ポリシー設定 | ✅ |
| `.kiro/settings/quality-gates.json` | 品質ゲート設定 | ✅ |
| `.kiro/settings/performance-thresholds.json` | パフォーマンス閾値設定 | ✅ |
| `.kiro/settings/test-configuration.json` | テスト実行設定 | ✅ |
| `.kiro/settings/auto-fix-configuration.json` | 自動修正設定 | ⚠️ |

### バックアップファイル

| ディレクトリ | 用途 |
|-------------|------|
| `.kiro/backups/` | 設定ファイルのバックアップ |
| `.kiro/reports/` | 実行結果レポート |
| `.kiro/logs/` | システムログ |

## 1. Trust承認ポリシー設定

### 基本設定

```json
{
  "version": "2.0",
  "lastUpdated": "2025-08-29T00:00:00.000Z",
  "autoApprove": {
    "gitOperations": [
      "status", "commit", "push", "pull", "merge", "log",
      "diff", "show", "branch", "checkout", "switch"
    ],
    "fileOperations": [
      "read", "write", "create", "update", "mkdir"
    ],
    "cliOperations": {
      "vercel": ["env ls", "domains ls", "deployments ls", "status", "whoami"],
      "npm": ["install", "run build", "run test", "run lint"]
    },
    "scriptExecution": {
      "extensions": [".mjs", ".js"],
      "allowedPaths": ["scripts/", ".kiro/scripts/", ".kiro/lib/"]
    }
  },
  "manualApprove": {
    "deleteOperations": [
      "git branch -D", "git push --delete", "rm -rf",
      "vercel env rm", "vercel domain rm"
    ],
    "forceOperations": [
      "git reset --hard", "git push --force", "git push -f"
    ],
    "productionImpact": [
      "github:write", "sanity-dev:write",
      "vercel:envSet", "vercel:addDomain"
    ]
  },
  "security": {
    "maxAutoApprovalPerHour": 1000,
    "suspiciousPatternDetection": true,
    "logAllOperations": true,
    "enableAuditTrail": true
  }
}
```

### 高度な設定

#### 操作分類の詳細設定

```json
{
  "operationClassification": {
    "patterns": {
      "safe": [
        "^git (status|log|show|diff)$",
        "^npm (list|ls|info)$",
        "^cat .*\\.md$",
        "^ls -la$"
      ],
      "risky": [
        "^rm -rf .*$",
        "^git reset --hard.*$",
        "^npm publish.*$"
      ],
      "production": [
        "^vercel --prod.*$",
        "^git push origin master$",
        "^npm run deploy:production$"
      ]
    },
    "contextRules": {
      "branchRestrictions": {
        "master": ["read-only"],
        "dev": ["full-access"],
        "feature/*": ["limited-access"]
      },
      "timeRestrictions": {
        "productionDeployment": {
          "allowedHours": [9, 10, 11, 14, 15, 16],
          "allowedDays": [1, 2, 3, 4, 5],
          "timezone": "Asia/Tokyo"
        }
      }
    }
  }
}
```

## 2. 品質ゲート設定

### 基本品質ゲート設定

```json
{
  "version": "1.0",
  "lastUpdated": "2025-08-29T00:00:00.000Z",
  "gates": [
    {
      "id": "critical-functionality",
      "name": "Critical Functionality",
      "level": "critical",
      "description": "Essential functionality must work correctly",
      "criteria": [
        {
          "id": "test-pass-rate",
          "name": "Test Pass Rate",
          "description": "Percentage of tests that pass",
          "metric": "test_pass_rate",
          "threshold": 100,
          "operator": "==",
          "weight": 10,
          "mandatory": true,
          "category": "testing"
        },
        {
          "id": "critical-bugs",
          "name": "Critical Bugs",
          "description": "Number of critical bugs",
          "metric": "critical_bugs",
          "threshold": 0,
          "operator": "==",
          "weight": 10,
          "mandatory": true,
          "category": "quality"
        }
      ],
      "blocking": true,
      "enabled": true,
      "order": 1,
      "dependencies": [],
      "timeout": 300
    },
    {
      "id": "performance-standards",
      "name": "Performance Standards",
      "level": "major",
      "description": "Performance must meet acceptable standards",
      "criteria": [
        {
          "id": "response-time",
          "name": "Response Time",
          "description": "Average response time in milliseconds",
          "metric": "responseTime",
          "threshold": 100,
          "operator": "<=",
          "weight": 8,
          "mandatory": true,
          "category": "performance"
        },
        {
          "id": "memory-usage",
          "name": "Memory Usage",
          "description": "Memory usage in MB",
          "metric": "memoryUsage",
          "threshold": 512,
          "operator": "<=",
          "weight": 6,
          "mandatory": false,
          "category": "performance"
        }
      ],
      "blocking": true,
      "enabled": true,
      "order": 2,
      "dependencies": ["critical-functionality"],
      "timeout": 180
    },
    {
      "id": "quality-metrics",
      "name": "Quality Metrics",
      "level": "minor",
      "description": "Code quality metrics should meet standards",
      "criteria": [
        {
          "id": "code-coverage",
          "name": "Code Coverage",
          "description": "Test code coverage percentage",
          "metric": "code_coverage",
          "threshold": 80,
          "operator": ">=",
          "weight": 5,
          "mandatory": false,
          "category": "quality"
        },
        {
          "id": "quality-score",
          "name": "Quality Score",
          "description": "Overall quality score",
          "metric": "quality_score",
          "threshold": 75,
          "operator": ">=",
          "weight": 4,
          "mandatory": false,
          "category": "quality"
        }
      ],
      "blocking": false,
      "enabled": true,
      "order": 3,
      "dependencies": ["performance-standards"],
      "timeout": 120
    }
  ],
  "globalSettings": {
    "enableParallelExecution": false,
    "maxConcurrentGates": 3,
    "defaultTimeout": 300,
    "failFast": true,
    "retryAttempts": 2,
    "retryDelay": 1000
  },
  "thresholds": {
    "critical": {
      "minPassRate": 100,
      "maxFailures": 0
    },
    "major": {
      "minPassRate": 90,
      "maxFailures": 1
    },
    "minor": {
      "minPassRate": 80,
      "maxFailures": 2
    }
  }
}
```

### カスタム品質ゲートの追加

```json
{
  "gates": [
    {
      "id": "security-compliance",
      "name": "Security Compliance",
      "level": "critical",
      "description": "Security requirements must be met",
      "criteria": [
        {
          "id": "vulnerability-count",
          "name": "Vulnerability Count",
          "description": "Number of security vulnerabilities",
          "metric": "vulnerability_count",
          "threshold": 0,
          "operator": "==",
          "weight": 10,
          "mandatory": true,
          "category": "security"
        },
        {
          "id": "security-score",
          "name": "Security Score",
          "description": "Overall security score",
          "metric": "security_score",
          "threshold": 90,
          "operator": ">=",
          "weight": 8,
          "mandatory": true,
          "category": "security"
        }
      ],
      "blocking": true,
      "enabled": true,
      "order": 4,
      "dependencies": ["critical-functionality"],
      "timeout": 600
    }
  ]
}
```

## 3. パフォーマンス閾値設定

### 基本パフォーマンス設定

```json
{
  "version": "1.0",
  "lastUpdated": "2025-08-29T00:00:00.000Z",
  "thresholds": {
    "executionTime": {
      "target": 100,
      "warning": 150,
      "critical": 200,
      "unit": "milliseconds"
    },
    "memoryUsage": {
      "target": 256,
      "warning": 512,
      "critical": 1024,
      "unit": "MB"
    },
    "cpuUsage": {
      "target": 50,
      "warning": 70,
      "critical": 90,
      "unit": "percentage"
    },
    "responseTime": {
      "target": 50,
      "warning": 100,
      "critical": 200,
      "unit": "milliseconds"
    }
  },
  "monitoring": {
    "interval": 5000,
    "sampleSize": 100,
    "alertThreshold": 3,
    "enableRealTimeMonitoring": true
  },
  "optimization": {
    "enableAutoOptimization": true,
    "optimizationStrategies": [
      "cache-optimization",
      "memory-cleanup",
      "parallel-processing"
    ]
  }
}
```

### 動的閾値調整設定

```json
{
  "dynamicThresholds": {
    "enabled": true,
    "adjustmentFactors": {
      "timeOfDay": {
        "peak": {
          "hours": [9, 10, 11, 14, 15, 16],
          "multiplier": 1.2
        },
        "offPeak": {
          "hours": [0, 1, 2, 3, 4, 5, 22, 23],
          "multiplier": 0.8
        }
      },
      "systemLoad": {
        "high": {
          "cpuThreshold": 80,
          "multiplier": 1.5
        },
        "low": {
          "cpuThreshold": 30,
          "multiplier": 0.9
        }
      }
    },
    "learningMode": {
      "enabled": true,
      "learningPeriod": 7,
      "confidenceThreshold": 0.8
    }
  }
}
```

## 4. テスト設定

### 基本テスト設定

```json
{
  "version": "1.0",
  "lastUpdated": "2025-08-29T00:00:00.000Z",
  "testTypes": {
    "unit": {
      "enabled": true,
      "timeout": 30000,
      "retryAttempts": 3,
      "parallelExecution": true,
      "coverage": {
        "threshold": 80,
        "includePattern": ["src/**/*.ts", "src/**/*.tsx"],
        "excludePattern": ["**/*.test.ts", "**/*.spec.ts", "**/*.d.ts"]
      }
    },
    "integration": {
      "enabled": true,
      "timeout": 60000,
      "retryAttempts": 2,
      "parallelExecution": false,
      "setupTimeout": 30000,
      "teardownTimeout": 10000
    },
    "acceptance": {
      "enabled": true,
      "timeout": 120000,
      "retryAttempts": 1,
      "parallelExecution": false,
      "browser": "chromium",
      "headless": true
    },
    "performance": {
      "enabled": true,
      "timeout": 180000,
      "retryAttempts": 1,
      "parallelExecution": false,
      "warmupRuns": 3,
      "measurementRuns": 10
    }
  },
  "reporting": {
    "formats": ["json", "html", "junit"],
    "outputDirectory": ".kiro/reports/test-results",
    "includeStackTrace": true,
    "includeCoverage": true
  },
  "environment": {
    "variables": {
      "NODE_ENV": "test",
      "LOG_LEVEL": "error"
    },
    "cleanup": {
      "afterEach": true,
      "afterAll": true
    }
  }
}
```

### 高度なテスト設定

```json
{
  "advancedSettings": {
    "testSelection": {
      "strategy": "smart",
      "changedFilesOnly": false,
      "affectedTestsOnly": true,
      "priorityTests": [
        "**/*.critical.test.ts",
        "**/*.smoke.test.ts"
      ]
    },
    "testData": {
      "generation": "automatic",
      "cleanup": "afterEach",
      "isolation": true
    },
    "mocking": {
      "strategy": "automatic",
      "mockExternalAPIs": true,
      "mockFileSystem": false
    },
    "debugging": {
      "enableDebugMode": false,
      "breakOnFailure": false,
      "verboseLogging": false
    }
  }
}
```

## 5. 自動修正設定

### 基本自動修正設定

```json
{
  "version": "1.0",
  "lastUpdated": "2025-08-29T00:00:00.000Z",
  "enabled": true,
  "maxAttempts": 3,
  "rollbackOnFailure": true,
  "supportedIssueTypes": [
    "missing_method",
    "invalid_config",
    "performance_degradation",
    "initialization_error",
    "test_failure",
    "dependency_issue"
  ],
  "fixStrategies": {
    "missing_method": {
      "strategy": "template-based",
      "templates": {
        "initialize": "async initialize(): Promise<void> { /* Auto-generated */ }",
        "cleanup": "async cleanup(): Promise<void> { /* Auto-generated */ }"
      },
      "validation": "compile-check"
    },
    "invalid_config": {
      "strategy": "schema-based",
      "schemaValidation": true,
      "defaultValues": true,
      "validation": "runtime-check"
    },
    "performance_degradation": {
      "strategy": "optimization-based",
      "optimizations": [
        "cache-implementation",
        "parallel-processing",
        "memory-optimization"
      ],
      "validation": "performance-test"
    }
  },
  "safety": {
    "backupBeforeFix": true,
    "dryRunFirst": true,
    "requireValidation": true,
    "maxRiskLevel": "medium"
  }
}
```

### カスタム修正ルールの追加

```json
{
  "customRules": [
    {
      "id": "custom-security-fix",
      "issueType": "security_vulnerability",
      "pattern": "SQL injection detected",
      "fixAction": {
        "type": "code-replacement",
        "searchPattern": "query\\s*=\\s*['\"].*\\$\\{.*\\}.*['\"]",
        "replacePattern": "query = db.prepare('...').bind(...)",
        "validation": "security-scan"
      },
      "riskLevel": "high",
      "requiresApproval": true
    },
    {
      "id": "custom-performance-fix",
      "issueType": "performance_degradation",
      "pattern": "Slow database query",
      "fixAction": {
        "type": "optimization",
        "strategy": "add-index",
        "validation": "performance-test"
      },
      "riskLevel": "medium",
      "requiresApproval": false
    }
  ]
}
```

## 6. 環境別設定

### 開発環境設定

```json
{
  "environment": "development",
  "settings": {
    "qualityGates": {
      "strictMode": false,
      "allowExceptions": true,
      "skipNonCritical": true
    },
    "performance": {
      "relaxedThresholds": true,
      "thresholdMultiplier": 1.5
    },
    "testing": {
      "quickMode": true,
      "skipSlowTests": true,
      "parallelExecution": true
    },
    "autoFix": {
      "aggressiveMode": true,
      "autoApprove": true
    }
  }
}
```

### 本番環境設定

```json
{
  "environment": "production",
  "settings": {
    "qualityGates": {
      "strictMode": true,
      "allowExceptions": false,
      "skipNonCritical": false
    },
    "performance": {
      "relaxedThresholds": false,
      "thresholdMultiplier": 1.0
    },
    "testing": {
      "quickMode": false,
      "skipSlowTests": false,
      "parallelExecution": false
    },
    "autoFix": {
      "aggressiveMode": false,
      "autoApprove": false,
      "requireApproval": true
    }
  }
}
```

## 7. 設定の検証と適用

### 設定ファイルの検証

```bash
# 設定ファイルの構文チェック
node -e "JSON.parse(require('fs').readFileSync('.kiro/settings/trust-policy.json', 'utf8'))"

# 設定の妥当性チェック
node .kiro/scripts/validate-configuration.mjs

# 設定の整合性チェック
node .kiro/scripts/check-configuration-consistency.mjs
```

### 設定の適用

```bash
# 設定の再読み込み
node .kiro/scripts/reload-configuration.mjs

# 設定変更の適用
node .kiro/scripts/apply-configuration-changes.mjs

# 設定の動作確認
node .kiro/scripts/test-configuration.mjs
```

### 設定のバックアップと復元

```bash
# 設定のバックアップ
node .kiro/scripts/backup-configuration.mjs

# 設定の復元
node .kiro/scripts/restore-configuration.mjs --backup-id=20250829-120000

# バックアップ一覧の確認
ls -la .kiro/backups/
```

## 8. 監視とアラート設定

### 基本監視設定

```json
{
  "monitoring": {
    "enabled": true,
    "interval": 60000,
    "metrics": [
      "quality_score",
      "performance_metrics",
      "test_results",
      "error_rate"
    ],
    "alerts": {
      "email": {
        "enabled": true,
        "recipients": ["admin@example.com"],
        "threshold": "critical"
      },
      "slack": {
        "enabled": true,
        "webhook": "https://hooks.slack.com/...",
        "channel": "#quality-alerts",
        "threshold": "major"
      }
    }
  }
}
```

### カスタムアラートルール

```json
{
  "alertRules": [
    {
      "id": "quality-degradation",
      "condition": "quality_score < 70",
      "severity": "major",
      "message": "Quality score has dropped below acceptable threshold",
      "actions": [
        "send-notification",
        "create-issue",
        "trigger-investigation"
      ]
    },
    {
      "id": "performance-threshold-exceeded",
      "condition": "responseTime > 200",
      "severity": "critical",
      "message": "Response time exceeded critical threshold",
      "actions": [
        "send-immediate-alert",
        "trigger-auto-optimization",
        "escalate-to-oncall"
      ]
    }
  ]
}
```

## 9. トラブルシューティング

### よくある設定問題

#### 問題: 設定ファイルが読み込まれない

**症状**: `Configuration file not found` エラー

**解決方法**:

```bash
# ファイルの存在確認
ls -la .kiro/settings/

# 権限の確認
chmod 644 .kiro/settings/*.json

# 初期化スクリプトの実行
node .kiro/scripts/init-trust-policy.mjs
```

#### 問題: 品質ゲートが実行されない

**症状**: `Quality gate execution skipped` 警告

**解決方法**:

```bash
# 品質ゲート設定の確認
cat .kiro/settings/quality-gates.json

# 依存関係の確認
node .kiro/scripts/check-quality-gate-dependencies.mjs

# 手動実行テスト
node .kiro/lib/trust-policy/demo-quality-gate-manager.mjs
```

#### 問題: パフォーマンス閾値が適用されない

**症状**: パフォーマンステストが常に成功する

**解決方法**:

```bash
# 閾値設定の確認
cat .kiro/settings/performance-thresholds.json

# パフォーマンス監視の状態確認
node .kiro/lib/trust-policy/demo-performance-monitor.mjs

# 閾値の手動テスト
node .kiro/scripts/test-performance-thresholds.mjs
```

## 10. ベストプラクティス

### 設定管理のベストプラクティス

1. **バージョン管理**
   - 設定変更は必ずバックアップを作成
   - 変更履歴をコミットメッセージに記録
   - 段階的な設定変更を実施

2. **テスト**
   - 設定変更前に必ずテスト実行
   - 本番適用前にステージング環境で検証
   - ロールバック手順を事前に確認

3. **監視**
   - 設定変更後の動作を継続監視
   - アラート設定の定期的な見直し
   - パフォーマンス影響の測定

4. **ドキュメント**
   - 設定変更の理由と影響を文書化
   - 運用手順書の定期的な更新
   - チーム内での設定変更の共有

### セキュリティのベストプラクティス

1. **アクセス制御**
   - 設定ファイルの適切な権限設定
   - 機密情報の暗号化
   - アクセスログの記録

2. **検証**
   - 設定値の入力検証
   - 不正な設定の検出
   - セキュリティスキャンの実施

## 関連ドキュメント

- [システム品質保証ガイド](.kiro/docs/SYSTEM_QUALITY_ASSURANCE_GUIDE.md)
- [開発者向けガイド](.kiro/docs/DEVELOPER_GUIDE.md)
- [API仕様書](.kiro/docs/API_SPECIFICATION.md)
- [Trust承認ポリシー運用ガイド](.kiro/steering/trust-usage.md)

## 更新履歴

| バージョン | 日付 | 変更内容 |
|-----------|------|----------|
| 1.0 | 2025-08-29 | 初版作成 |

---

**注意**: 設定変更は慎重に行い、必ず事前にバックアップを作成してください。本番環境での設定変更は、十分なテストを経てから実施することを強く推奨します。