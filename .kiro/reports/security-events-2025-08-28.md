# セキュリティイベントログ - 2025-08-28

このファイルは Trust承認システムのセキュリティイベントログです。

**生成日時**: 2025-08-28T14:23:36.016Z  
**ファイル**: security-events-2025-08-28.md  

---

## EXTERNAL_THREAT - HIGH

**時刻**: 2025-08-28T14:23:36.016Z
**説明**: 外部からの不正操作要求: 外部要求検証に失敗: invalid_session_id, suspicious_timing
**詳細**: ```json
{
  "operation": {
    "command": "git",
    "args": [
      "commit",
      "-m",
      "test commit"
    ],
    "type": "git"
  },
  "context": {
    "workingDirectory": "/test",
    "user": "testuser",
    "sessionId": "full-integration-test"
  },
  "threatIndicators": [
    "invalid_session_id",
    "suspicious_timing"
  ]
}
```

---

## SUSPICIOUS_PATTERN - HIGH

**時刻**: 2025-08-28T14:23:36.024Z
**説明**: 不審な操作パターン: 不審なパターンを検出: frequency, dangerous_command
**詳細**: ```json
{
  "operation": {
    "command": "rm",
    "args": [
      "-rf",
      "/important/data0"
    ],
    "type": "file"
  },
  "patterns": [
    "frequency",
    "dangerous_command"
  ],
  "severity": 3,
  "confidence": 0.6
}
```

---

## MODE_CHANGE - HIGH

**時刻**: 2025-08-28T14:23:36.024Z
**説明**: 手動承認モードに切り替え: 不審なパターンを検出: frequency, dangerous_command


---

