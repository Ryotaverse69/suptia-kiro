#!/usr/bin/env node

/**
 * リダイレクト機能のテストスクリプト
 * レガシードメインから新ドメインへの301リダイレクトを検証
 */

import https from 'https';
import http from 'http';

const TEST_URLS = [
  {
    name: 'Legacy domain root',
    url: 'https://suptia-kiro.vercel.app/',
    expectedRedirect: 'https://suptia.com/'
  },
  {
    name: 'Legacy domain products page',
    url: 'https://suptia-kiro.vercel.app/products/vitamin-c',
    expectedRedirect: 'https://suptia.com/products/vitamin-c'
  },
  {
    name: 'Legacy domain about page',
    url: 'https://suptia-kiro.vercel.app/about',
    expectedRedirect: 'https://suptia.com/about'
  },
  {
    name: 'WWW redirect',
    url: 'https://www.suptia.com/',
    expectedRedirect: 'https://suptia.com/'
  },
  {
    name: 'WWW redirect with path',
    url: 'https://www.suptia.com/ingredients',
    expectedRedirect: 'https://suptia.com/ingredients'
  }
];

/**
 * HTTPリダイレクトをテストする関数
 */
function testRedirect(testCase) {
  return new Promise((resolve) => {
    const url = new URL(testCase.url);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: 'HEAD',
      headers: {
        'User-Agent': 'Suptia-Redirect-Test/1.0'
      }
    };

    const client = url.protocol === 'https:' ? https : http;
    
    const req = client.request(options, (res) => {
      const result = {
        name: testCase.name,
        url: testCase.url,
        statusCode: res.statusCode,
        location: res.headers.location,
        expectedRedirect: testCase.expectedRedirect,
        success: false,
        message: ''
      };

      if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307 || res.statusCode === 308) {
        if (res.headers.location === testCase.expectedRedirect) {
          result.success = true;
          result.message = `✅ 正常にリダイレクト: ${res.statusCode}`;
        } else {
          result.message = `❌ リダイレクト先が不正: 期待値=${testCase.expectedRedirect}, 実際=${res.headers.location}`;
        }
      } else if (res.statusCode === 200) {
        result.message = `⚠️  リダイレクトされていません: ${res.statusCode}`;
      } else {
        result.message = `❌ 予期しないステータス: ${res.statusCode}`;
      }

      resolve(result);
    });

    req.on('error', (error) => {
      resolve({
        name: testCase.name,
        url: testCase.url,
        success: false,
        message: `❌ リクエストエラー: ${error.message}`
      });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        name: testCase.name,
        url: testCase.url,
        success: false,
        message: '❌ タイムアウト'
      });
    });

    req.end();
  });
}

/**
 * メイン実行関数
 */
async function main() {
  console.log('🔄 リダイレクトテストを開始します...\n');

  const results = [];
  
  for (const testCase of TEST_URLS) {
    console.log(`テスト中: ${testCase.name}`);
    const result = await testRedirect(testCase);
    results.push(result);
    console.log(`  ${result.message}\n`);
  }

  // 結果サマリー
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  console.log('📊 テスト結果サマリー');
  console.log('='.repeat(50));
  console.log(`成功: ${successCount}/${totalCount}`);
  console.log(`失敗: ${totalCount - successCount}/${totalCount}`);
  
  if (successCount === totalCount) {
    console.log('\n🎉 すべてのリダイレクトテストが成功しました！');
    process.exit(0);
  } else {
    console.log('\n❌ 一部のリダイレクトテストが失敗しました。');
    
    // 失敗したテストの詳細を表示
    const failedTests = results.filter(r => !r.success);
    console.log('\n失敗したテスト:');
    failedTests.forEach(test => {
      console.log(`- ${test.name}: ${test.message}`);
    });
    
    process.exit(1);
  }
}

// スクリプト実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { testRedirect, TEST_URLS };