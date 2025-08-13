#!/usr/bin/env node

/**
 * Security Headers Validation Script
 * Checks for required security headers on localhost:3000
 */

const REQUIRED_HEADERS = [
  'content-security-policy',
  'x-content-type-options',
  'x-frame-options',
  'referrer-policy',
  'permissions-policy'
];

async function checkHeaders() {
  try {
    console.log('🔍 Checking security headers on http://localhost:3000...');
    
    const response = await fetch('http://localhost:3000');
    
    if (!response.ok) {
      console.error(`❌ Failed to fetch: ${response.status} ${response.statusText}`);
      process.exit(1);
    }

    const headers = response.headers;
    const missingHeaders = [];
    const foundHeaders = [];

    for (const headerName of REQUIRED_HEADERS) {
      const headerValue = headers.get(headerName);
      if (headerValue) {
        foundHeaders.push(`✅ ${headerName}: ${headerValue.substring(0, 50)}${headerValue.length > 50 ? '...' : ''}`);
      } else {
        missingHeaders.push(headerName);
      }
    }

    console.log('\n📋 Security Headers Status:');
    foundHeaders.forEach(header => console.log(header));

    if (missingHeaders.length > 0) {
      console.error('\n❌ Missing required security headers:');
      missingHeaders.forEach(header => console.error(`   - ${header}`));
      console.error('\n💡 Add these headers in next.config.mjs or middleware');
      process.exit(1);
    }

    console.log('\n🎉 All required security headers are present!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error checking headers:', error.message);
    console.error('💡 Make sure the app is running on http://localhost:3000');
    process.exit(1);
  }
}

checkHeaders();