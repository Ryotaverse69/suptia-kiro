#!/usr/bin/env node

/**
 * Security Headers Checker
 * 
 * このスクリプトは、アプリケーションのセキュリティヘッダーが適切に設定されているかを確認します。
 */

import { execSync } from 'child_process';

const REQUIRED_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': ['DENY', 'SAMEORIGIN'],
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': null, // 値は任意だが存在する必要がある
  'Content-Security-Policy': null, // 値は任意だが存在する必要がある
};

const OPTIONAL_HEADERS = {
  'Referrer-Policy': null,
  'Permissions-Policy': null,
};

async function checkHeaders() {
  console.log('🔒 Checking security headers...');
  
  try {
    // curlでヘッダーを取得
    const result = execSync('curl -I -s http://localhost:3000', { encoding: 'utf8' });
    const headers = parseHeaders(result);
    
    let hasErrors = false;
    
    // 必須ヘッダーのチェック
    for (const [headerName, expectedValue] of Object.entries(REQUIRED_HEADERS)) {
      const actualValue = headers[headerName.toLowerCase()];
      
      if (!actualValue) {
        console.error(`❌ Missing required header: ${headerName}`);
        hasErrors = true;
        continue;
      }
      
      if (expectedValue && Array.isArray(expectedValue)) {
        if (!expectedValue.includes(actualValue)) {
          console.error(`❌ Invalid value for ${headerName}: expected one of [${expectedValue.join(', ')}], got "${actualValue}"`);
          hasErrors = true;
        } else {
          console.log(`✅ ${headerName}: ${actualValue}`);
        }
      } else if (expectedValue && actualValue !== expectedValue) {
        console.error(`❌ Invalid value for ${headerName}: expected "${expectedValue}", got "${actualValue}"`);
        hasErrors = true;
      } else {
        console.log(`✅ ${headerName}: ${actualValue}`);
      }
    }
    
    // オプションヘッダーの確認
    for (const [headerName] of Object.entries(OPTIONAL_HEADERS)) {
      const actualValue = headers[headerName.toLowerCase()];
      if (actualValue) {
        console.log(`ℹ️  ${headerName}: ${actualValue}`);
      } else {
        console.log(`⚠️  Optional header not set: ${headerName}`);
      }
    }
    
    if (hasErrors) {
      console.error('\n❌ Security headers check failed!');
      process.exit(1);
    } else {
      console.log('\n✅ All required security headers are properly configured!');
    }
    
  } catch (error) {
    console.error('❌ Failed to check headers:', error.message);
    process.exit(1);
  }
}

function parseHeaders(headerString) {
  const headers = {};
  const lines = headerString.split('\n');
  
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const name = line.substring(0, colonIndex).trim().toLowerCase();
      const value = line.substring(colonIndex + 1).trim();
      headers[name] = value;
    }
  }
  
  return headers;
}

// スクリプトが直接実行された場合のみ実行
if (import.meta.url === `file://${process.argv[1]}`) {
  checkHeaders();
}

export { checkHeaders };