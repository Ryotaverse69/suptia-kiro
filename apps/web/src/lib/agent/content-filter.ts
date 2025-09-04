/**
 * LLM出力・外部コンテンツの安全性チェック
 * - 外部からの指示（プロンプトインジェクション）検出
 * - 機密操作の要求検出
 */

export interface ContentFilterResult {
  hasExternalInstruction: boolean;
  hasCredentialRequest: boolean;
  hasToolAbuse: boolean;
  matchedIndicators: string[];
}

const INDICATORS = [
  /ignore (all|previous) instructions/i,
  /disregard (the )?system prompt/i,
  /you are now .* system/i,
  /BEGIN\s*INSTRUCTIONS/i,
  /copy and paste.* token/i,
  /exfiltrate|leak|dump/i,
  /run shell|execute command|rm -rf/i,
  /openai|api key|secret/i,
  /set env|export\s+[A-Z_]+=/i,
  /fetch\s+http/i,
  /data:\s*text\/html;base64/i,
];

export function checkContentSafety(text: string): ContentFilterResult {
  const matched: string[] = [];
  let hasExternalInstruction = false;
  let hasCredentialRequest = false;
  let hasToolAbuse = false;

  for (const rx of INDICATORS) {
    if (rx.test(text)) {
      matched.push(rx.source);
      if (/ignore|disregard|system prompt/i.test(rx.source)) hasExternalInstruction = true;
      if (/api key|secret|token/i.test(rx.source)) hasCredentialRequest = true;
      if (/run shell|execute command|rm -rf/i.test(rx.source)) hasToolAbuse = true;
    }
  }

  return {
    hasExternalInstruction,
    hasCredentialRequest,
    hasToolAbuse,
    matchedIndicators: matched,
  };
}

