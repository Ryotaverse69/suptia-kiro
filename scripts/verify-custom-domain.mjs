#!/usr/bin/env node

/**
 * カスタムドメイン検証スクリプト
 * DNS解決、SSL証明書、リダイレクト機能を包括的にテスト
 */

import https from 'https';
import http from 'http';
import { execSync } from 'child_process';

const PRIMARY_DOMAIN = 'suptia.com';
const WWW_DOMAIN = 'www.suptia.com';
const LEGACY_DOMAIN = 'suptia-kiro.vercel.app';

/**
 * DNS解決テスト
 */
async function testDNSResolution(domain) {
  try {
    console.log(`🌍 DNS解決テスト: ${domain}`);
    
    const result = execSync(`nslookup ${domain}`, { encoding: 'utf8' });
    
    // Vercel DNSまたは適切なIPアドレスが返されているかチェック
    const hasValidDNS = result.includes('vercel-dns.com') || 
                       result.includes('76.76.19.61') ||
                       /\d+\.\d+\.\d+\.\d+/.test(result);
    
    if (hasValidDNS) {
      console.log(`  ✅ DNS解決成功`);
      return { success: true, result };
    } else {
      console.log(`  ❌ DNS解決失敗: 適切なレコードが見つかりません`);
      return { success: false, error: 'Invalid DNS records', result };
    }
  } catch (error) {
    console.log(`  ❌ DNS解決エラー: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * SSL証明書テスト
 */
async function testSSLCertificate(domain) {
  return new Promise((resolve) => {
    console.log(`🔒 SSL証明書テスト: ${domain}`);
    
    const options = {
      hostname: domain,
      port: 443,
      path: '/',
      method: 'HEAD',
      timeout: 10000,
      rejectUnauthorized: true, // SSL証明書を厳密にチェック
    };

    const req = https.request(options, (res) => {
      const cert = res.socket.getPeerCertificate();
      
      if (cert && cert.subject) {
        const now = new Date();
        const validFrom = new Date(cert.valid_from);
        const validTo = new Date(cert.valid_to);
        const isValid = now >= validFrom && now <= validTo;
        
        console.log(`  ✅ SSL証明書有効`);
        console.log(`    発行者: ${cert.issuer.CN}`);
        console.log(`    サブジェクト: ${cert.subject.CN}`);
        console.log(`    有効期間: ${cert.valid_from} - ${cert.valid_to}`);
        console.log(`    残り日数: ${Math.ceil((validTo - now) / (1000 * 60 * 60 * 24))}日`);
        
        resolve({
          success: isValid,
          certificate: {
            issuer: cert.issuer.CN,
            subject: cert.subject.CN,
            validFrom: cert.valid_from,
            validTo: cert.valid_to,
            daysRemaining: Math.ceil((validTo - now) / (1000 * 60 * 60 * 24)),
            isValid,
          }
        });
      } else {
        console.log(`  ❌ SSL証明書情報を取得できません`);
        resolve({ success: false, error: 'Certificate information not available' });
      }
    });

    req.on('error', (error) => {
      console.log(`  ❌ SSL接続エラー: ${error.message}`);
      resolve({ success: false, error: error.message });
    });

    req.on('timeout', () => {
      console.log(`  ❌ SSL接続タイムアウト`);
      req.destroy();
      resolve({ success: false, error: 'Connection timeout' });
    });

    req.end();
  });
}

/**
 * HTTPリダイレクトテスト
 */
async function testRedirect(fromDomain, toDomain, path = '/') {
  return new Promise((resolve) => {
    console.log(`🔄 リダイレクトテスト: ${fromDomain}${path} → ${toDomain}`);
    
    const url = new URL(`https://${fromDomain}${path}`);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: 'HEAD',
      timeout: 10000,
      headers: {
        'User-Agent': 'Suptia-Domain-Verification/1.0'
      }
    };

    const req = https.request(options, (res) => {
      const isRedirect = res.statusCode >= 300 && res.statusCode < 400;
      const location = res.headers.location;
      
      if (isRedirect && location) {
        const expectedUrl = `https://${toDomain}${path}`;
        const isCorrectRedirect = location === expectedUrl || location.startsWith(`https://${toDomain}`);
        
        if (isCorrectRedirect) {
          console.log(`  ✅ リダイレクト成功: ${res.statusCode} → ${location}`);
          resolve({
            success: true,
            statusCode: res.statusCode,
            location,
            isCorrectRedirect: true
          });
        } else {
          console.log(`  ❌ リダイレクト先が不正: 期待=${expectedUrl}, 実際=${location}`);
          resolve({
            success: false,
            statusCode: res.statusCode,
            location,
            expectedLocation: expectedUrl,
            isCorrectRedirect: false
          });
        }
      } else if (res.statusCode === 200) {
        console.log(`  ⚠️  リダイレクトされていません: ${res.statusCode}`);
        resolve({
          success: false,
          statusCode: res.statusCode,
          error: 'No redirect configured'
        });
      } else {
        console.log(`  ❌ 予期しないレスポンス: ${res.statusCode}`);
        resolve({
          success: false,
          statusCode: res.statusCode,
          error: `Unexpected status code: ${res.statusCode}`
        });
      }
    });

    req.on('error', (error) => {
      console.log(`  ❌ リダイレクトテストエラー: ${error.message}`);
      resolve({ success: false, error: error.message });
    });

    req.on('timeout', () => {
      console.log(`  ❌ リダイレクトテストタイムアウト`);
      req.destroy();
      resolve({ success: false, error: 'Connection timeout' });
    });

    req.end();
  });
}

/**
 * ページアクセシビリティテスト
 */
async function testPageAccessibility(domain, paths = ['/']) {
  const results = [];
  
  for (const path of paths) {
    try {
      console.log(`📄 ページアクセステスト: https://${domain}${path}`);
      
      const startTime = Date.now();
      const response = await fetch(`https://${domain}${path}`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(10000),
        headers: {
          'User-Agent': 'Suptia-Domain-Verification/1.0'
        }
      });
      const responseTime = Date.now() - startTime;
      
      const success = response.ok;
      console.log(`  ${success ? '✅' : '❌'} ${response.status} ${response.statusText} (${responseTime}ms)`);
      
      results.push({
        path,
        success,
        statusCode: response.status,
        statusText: response.statusText,
        responseTime,
        headers: Object.fromEntries(response.headers.entries())
      });
    } catch (error) {
      console.log(`  ❌ アクセスエラー: ${error.message}`);
      results.push({
        path,
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
}

/**
 * パフォーマンステスト
 */
async function testPerformance(domain) {
  console.log(`⚡ パフォーマンステスト: ${domain}`);
  
  const tests = [];
  const testCount = 3;
  
  for (let i = 0; i < testCount; i++) {
    try {
      const startTime = Date.now();
      const response = await fetch(`https://${domain}/`, {
        signal: AbortSignal.timeout(15000),
        headers: {
          'User-Agent': 'Suptia-Performance-Test/1.0'
        }
      });
      const responseTime = Date.now() - startTime;
      
      tests.push({
        attempt: i + 1,
        success: response.ok,
        responseTime,
        statusCode: response.status
      });
      
      console.log(`  テスト ${i + 1}: ${responseTime}ms (${response.status})`);
    } catch (error) {
      tests.push({
        attempt: i + 1,
        success: false,
        error: error.message
      });
      console.log(`  テスト ${i + 1}: エラー - ${error.message}`);
    }
  }
  
  const successfulTests = tests.filter(t => t.success);
  const averageTime = successfulTests.length > 0 
    ? Math.round(successfulTests.reduce((sum, t) => sum + t.responseTime, 0) / successfulTests.length)
    : null;
  
  console.log(`  平均レスポンス時間: ${averageTime ? averageTime + 'ms' : 'N/A'}`);
  
  return {
    tests,
    averageResponseTime: averageTime,
    successRate: (successfulTests.length / testCount) * 100
  };
}

/**
 * メイン検証関数
 */
async function main() {
  console.log('🚀 カスタムドメイン検証を開始します...\n');
  
  const results = {
    timestamp: new Date().toISOString(),
    domains: {},
    summary: {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
    }
  };
  
  const domains = [PRIMARY_DOMAIN, WWW_DOMAIN, LEGACY_DOMAIN];
  const testPaths = ['/', '/about', '/products/vitamin-c'];
  
  for (const domain of domains) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`🌐 ドメイン検証: ${domain}`);
    console.log(`${'='.repeat(50)}`);
    
    const domainResults = {
      domain,
      dns: await testDNSResolution(domain),
      ssl: await testSSLCertificate(domain),
      accessibility: await testPageAccessibility(domain, testPaths),
      performance: await testPerformance(domain),
      redirects: []
    };
    
    // リダイレクトテスト（プライマリドメイン以外）
    if (domain !== PRIMARY_DOMAIN) {
      console.log(`\n🔄 リダイレクトテスト`);
      for (const path of testPaths) {
        const redirectResult = await testRedirect(domain, PRIMARY_DOMAIN, path);
        domainResults.redirects.push({
          path,
          ...redirectResult
        });
      }
    }
    
    results.domains[domain] = domainResults;
    
    // 統計更新
    const domainTests = [
      domainResults.dns,
      domainResults.ssl,
      ...domainResults.accessibility,
      ...domainResults.redirects
    ];
    
    domainTests.forEach(test => {
      results.summary.totalTests++;
      if (test.success) {
        results.summary.passedTests++;
      } else {
        results.summary.failedTests++;
      }
    });
  }
  
  // 結果サマリー
  console.log(`\n${'='.repeat(50)}`);
  console.log('📊 検証結果サマリー');
  console.log(`${'='.repeat(50)}`);
  
  const successRate = Math.round((results.summary.passedTests / results.summary.totalTests) * 100);
  
  console.log(`総テスト数: ${results.summary.totalTests}`);
  console.log(`成功: ${results.summary.passedTests}`);
  console.log(`失敗: ${results.summary.failedTests}`);
  console.log(`成功率: ${successRate}%`);
  
  // 重要な問題の報告
  console.log(`\n🔍 重要な問題:`);
  
  let criticalIssues = 0;
  
  // プライマリドメインのSSL/DNS問題
  const primaryDomain = results.domains[PRIMARY_DOMAIN];
  if (!primaryDomain.dns.success) {
    console.log(`❌ ${PRIMARY_DOMAIN}のDNS解決に失敗`);
    criticalIssues++;
  }
  if (!primaryDomain.ssl.success) {
    console.log(`❌ ${PRIMARY_DOMAIN}のSSL証明書に問題`);
    criticalIssues++;
  }
  
  // リダイレクト問題
  for (const [domain, data] of Object.entries(results.domains)) {
    if (domain !== PRIMARY_DOMAIN && data.redirects.length > 0) {
      const failedRedirects = data.redirects.filter(r => !r.success);
      if (failedRedirects.length > 0) {
        console.log(`❌ ${domain}からのリダイレクトに問題 (${failedRedirects.length}件)`);
        criticalIssues++;
      }
    }
  }
  
  if (criticalIssues === 0) {
    console.log(`✅ 重要な問題は検出されませんでした`);
  }
  
  // JSON出力（CI/CD用）
  if (process.env.OUTPUT_JSON === 'true') {
    console.log(`\n📄 JSON結果:`);
    console.log(JSON.stringify(results, null, 2));
  }
  
  // 終了コード
  const exitCode = criticalIssues > 0 ? 1 : 0;
  console.log(`\n${exitCode === 0 ? '🎉' : '❌'} 検証完了 (終了コード: ${exitCode})`);
  
  process.exit(exitCode);
}

// スクリプト実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { testDNSResolution, testSSLCertificate, testRedirect, testPageAccessibility, testPerformance };