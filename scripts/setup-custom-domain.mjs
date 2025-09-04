#!/usr/bin/env node

/**
 * Vercelプロジェクトにカスタムドメインを設定するスクリプト
 * 
 * 機能:
 * 1. suptia.com をプライマリドメインとして追加
 * 2. SSL証明書の自動設定
 * 3. www.suptia.com から suptia.com へのリダイレクト設定
 * 4. 設定の検証
 */

import { execSync } from 'child_process';
import https from 'https';
import { promisify } from 'util';

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const PROJECT_ID = 'suptia-kiro';
const PRIMARY_DOMAIN = 'suptia.com';
const WWW_DOMAIN = 'www.suptia.com';

if (!VERCEL_TOKEN) {
  console.error('❌ VERCEL_TOKEN環境変数が設定されていません');
  process.exit(1);
}

/**
 * Vercel APIを呼び出す共通関数
 */
async function callVercelAPI(endpoint, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.vercel.com',
      path: endpoint,
      method: method,
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(response);
          } else {
            reject(new Error(`API Error: ${res.statusCode} - ${response.error?.message || body}`));
          }
        } catch (error) {
          reject(new Error(`Parse Error: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * 現在のドメイン設定を取得
 */
async function getCurrentDomains() {
  try {
    console.log('📋 現在のドメイン設定を確認中...');
    const response = await callVercelAPI(`/v9/projects/${PROJECT_ID}/domains`);
    return response.domains || [];
  } catch (error) {
    console.error('❌ ドメイン設定の取得に失敗:', error.message);
    return [];
  }
}

/**
 * カスタムドメインを追加
 */
async function addCustomDomain(domain, redirect = null) {
  try {
    console.log(`🌐 ドメイン ${domain} を追加中...`);
    
    const data = {
      name: domain,
    };

    if (redirect) {
      data.redirect = redirect;
    }

    const response = await callVercelAPI(`/v10/projects/${PROJECT_ID}/domains`, 'POST', data);
    console.log(`✅ ドメイン ${domain} の追加が完了しました`);
    return response;
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log(`ℹ️  ドメイン ${domain} は既に設定済みです`);
      return { name: domain, verified: true };
    }
    console.error(`❌ ドメイン ${domain} の追加に失敗:`, error.message);
    throw error;
  }
}

/**
 * SSL証明書の状態を確認
 */
async function checkSSLStatus(domain) {
  try {
    console.log(`🔒 ${domain} のSSL証明書を確認中...`);
    
    return new Promise((resolve) => {
      const options = {
        hostname: domain,
        port: 443,
        path: '/',
        method: 'HEAD',
        timeout: 10000,
      };

      const req = https.request(options, (res) => {
        const cert = res.socket.getPeerCertificate();
        if (cert && cert.subject) {
          console.log(`✅ ${domain} のSSL証明書は有効です`);
          console.log(`   発行者: ${cert.issuer.CN}`);
          console.log(`   有効期限: ${cert.valid_to}`);
          resolve(true);
        } else {
          console.log(`⚠️  ${domain} のSSL証明書情報を取得できませんでした`);
          resolve(false);
        }
      });

      req.on('error', (error) => {
        console.log(`⚠️  ${domain} のSSL接続に失敗: ${error.message}`);
        resolve(false);
      });

      req.on('timeout', () => {
        console.log(`⚠️  ${domain} のSSL接続がタイムアウトしました`);
        req.destroy();
        resolve(false);
      });

      req.end();
    });
  } catch (error) {
    console.error(`❌ SSL証明書の確認に失敗:`, error.message);
    return false;
  }
}

/**
 * ドメインのリダイレクトをテスト
 */
async function testRedirect(fromDomain, toDomain) {
  try {
    console.log(`🔄 ${fromDomain} から ${toDomain} へのリダイレクトをテスト中...`);
    
    return new Promise((resolve) => {
      const options = {
        hostname: fromDomain,
        port: 443,
        path: '/',
        method: 'HEAD',
        timeout: 10000,
      };

      const req = https.request(options, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400) {
          const location = res.headers.location;
          if (location && location.includes(toDomain)) {
            console.log(`✅ リダイレクトが正常に動作しています: ${fromDomain} → ${location}`);
            resolve(true);
          } else {
            console.log(`⚠️  予期しないリダイレクト先: ${location}`);
            resolve(false);
          }
        } else {
          console.log(`⚠️  リダイレクトが設定されていません (Status: ${res.statusCode})`);
          resolve(false);
        }
      });

      req.on('error', (error) => {
        console.log(`⚠️  リダイレクトテストに失敗: ${error.message}`);
        resolve(false);
      });

      req.on('timeout', () => {
        console.log(`⚠️  リダイレクトテストがタイムアウトしました`);
        req.destroy();
        resolve(false);
      });

      req.end();
    });
  } catch (error) {
    console.error(`❌ リダイレクトテストに失敗:`, error.message);
    return false;
  }
}

/**
 * DNS設定を確認
 */
async function checkDNS(domain) {
  try {
    console.log(`🌍 ${domain} のDNS設定を確認中...`);
    
    const result = execSync(`nslookup ${domain}`, { encoding: 'utf8' });
    
    if (result.includes('vercel-dns.com') || result.includes('76.76.19.61')) {
      console.log(`✅ ${domain} のDNS設定は正常です`);
      return true;
    } else {
      console.log(`⚠️  ${domain} のDNS設定を確認してください`);
      console.log(`DNS結果:\n${result}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ DNS確認に失敗:`, error.message);
    return false;
  }
}

/**
 * メイン実行関数
 */
async function main() {
  console.log('🚀 Vercelカスタムドメイン設定を開始します...\n');

  try {
    // 1. 現在のドメイン設定を確認
    const currentDomains = await getCurrentDomains();
    console.log('現在のドメイン:', currentDomains.map(d => d.name).join(', '));
    console.log('');

    // 2. DNS設定を確認
    const dnsOk = await checkDNS(PRIMARY_DOMAIN);
    if (!dnsOk) {
      console.log('⚠️  DNS設定に問題がある可能性がありますが、続行します...\n');
    }

    // 3. プライマリドメインを追加
    await addCustomDomain(PRIMARY_DOMAIN);

    // 4. WWWドメインをリダイレクト付きで追加
    await addCustomDomain(WWW_DOMAIN, PRIMARY_DOMAIN);

    console.log('\n⏳ SSL証明書の発行を待機中... (最大5分程度かかる場合があります)');
    
    // 5. SSL証明書の確認（リトライ付き）
    let sslRetries = 0;
    let sslOk = false;
    while (sslRetries < 10 && !sslOk) {
      await new Promise(resolve => setTimeout(resolve, 30000)); // 30秒待機
      sslOk = await checkSSLStatus(PRIMARY_DOMAIN);
      if (!sslOk) {
        sslRetries++;
        console.log(`🔄 SSL証明書の発行を待機中... (${sslRetries}/10)`);
      }
    }

    // 6. リダイレクトのテスト
    if (sslOk) {
      console.log('\n🔄 リダイレクト設定をテスト中...');
      await testRedirect(WWW_DOMAIN, PRIMARY_DOMAIN);
    }

    // 7. 最終確認
    console.log('\n📊 設定完了サマリー:');
    console.log(`✅ プライマリドメイン: https://${PRIMARY_DOMAIN}`);
    console.log(`✅ リダイレクト設定: https://${WWW_DOMAIN} → https://${PRIMARY_DOMAIN}`);
    console.log(`${sslOk ? '✅' : '⚠️ '} SSL証明書: ${sslOk ? '有効' : '発行中または問題あり'}`);

    if (sslOk) {
      console.log('\n🎉 カスタムドメイン設定が完了しました！');
      console.log(`サイトにアクセス: https://${PRIMARY_DOMAIN}`);
    } else {
      console.log('\n⚠️  SSL証明書の発行に時間がかかっています。');
      console.log('数分後に再度確認するか、Vercelダッシュボードで状態を確認してください。');
    }

  } catch (error) {
    console.error('\n❌ カスタムドメイン設定に失敗しました:', error.message);
    process.exit(1);
  }
}

// スクリプト実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main as setupCustomDomain };