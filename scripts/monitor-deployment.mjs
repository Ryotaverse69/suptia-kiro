#!/usr/bin/env node

/**
 * Vercelデプロイ監視とヘルスチェックスクリプト
 * デプロイ状況の監視とカスタムドメインのヘルスチェックを実行
 */

import { execSync } from 'child_process';
import https from 'https';
import http from 'http';

class DeploymentMonitor {
  constructor(options = {}) {
    this.projectId = options.projectId || process.env.VERCEL_PROJECT_ID;
    this.orgId = options.orgId || process.env.VERCEL_ORG_ID;
    this.token = options.token || process.env.VERCEL_TOKEN;
    this.domains = options.domains || ['suptia.com', 'www.suptia.com'];
    this.timeout = options.timeout || 30000; // 30秒
    this.maxRetries = options.maxRetries || 5;
  }

  async monitor() {
    console.log('🔍 Vercelデプロイ監視を開始します...\n');

    try {
      // 最新のデプロイメント情報を取得
      const deployment = await this.getLatestDeployment();
      if (!deployment) {
        console.error('❌ 最新のデプロイメントが見つかりません');
        process.exit(1);
      }

      console.log(`📋 最新デプロイメント: ${deployment.uid}`);
      console.log(`🔗 URL: ${deployment.url}`);
      console.log(`📅 作成日時: ${new Date(deployment.createdAt).toLocaleString()}`);
      console.log(`📊 状態: ${deployment.readyState}\n`);

      // デプロイメントの完了を待機
      await this.waitForDeployment(deployment);

      // ヘルスチェック実行
      await this.performHealthChecks(deployment);

      console.log('\n✅ 監視完了');

    } catch (error) {
      console.error('❌ 監視中にエラーが発生しました:', error.message);
      process.exit(1);
    }
  }

  async getLatestDeployment() {
    try {
      const output = execSync(`curl -s -H "Authorization: Bearer ${this.token}" "https://api.vercel.com/v6/deployments?projectId=${this.projectId}&limit=1"`, {
        encoding: 'utf8'
      });

      const response = JSON.parse(output);
      return response.deployments && response.deployments[0] ? response.deployments[0] : null;

    } catch (error) {
      console.error('デプロイメント情報の取得に失敗:', error.message);
      return null;
    }
  }

  async waitForDeployment(deployment) {
    console.log('⏳ デプロイメント完了を待機中...');

    let attempts = 0;
    const maxAttempts = 20; // 最大10分待機（30秒 × 20回）

    while (attempts < maxAttempts) {
      try {
        const output = execSync(`curl -s -H "Authorization: Bearer ${this.token}" "https://api.vercel.com/v13/deployments/${deployment.uid}"`, {
          encoding: 'utf8'
        });

        const currentDeployment = JSON.parse(output);
        console.log(`  状態確認 (${attempts + 1}/${maxAttempts}): ${currentDeployment.readyState}`);

        if (currentDeployment.readyState === 'READY') {
          console.log('✅ デプロイメントが完了しました');
          return currentDeployment;
        }

        if (currentDeployment.readyState === 'ERROR') {
          throw new Error('デプロイメントがエラー状態になりました');
        }

        attempts++;
        if (attempts < maxAttempts) {
          console.log('  30秒待機中...');
          await this.sleep(30000);
        }

      } catch (error) {
        console.error(`  状態確認エラー: ${error.message}`);
        attempts++;
        if (attempts < maxAttempts) {
          await this.sleep(30000);
        }
      }
    }

    throw new Error('デプロイメント完了の待機がタイムアウトしました');
  }

  async performHealthChecks(deployment) {
    console.log('\n🏥 ヘルスチェックを実行中...');

    // デプロイメントURLのチェック
    if (deployment.url) {
      await this.checkUrl(`https://${deployment.url}`, 'デプロイメントURL');
    }

    // カスタムドメインのチェック
    for (const domain of this.domains) {
      await this.checkUrl(`https://${domain}`, `カスタムドメイン (${domain})`);
    }
  }

  async checkUrl(url, description) {
    console.log(`\n🔍 ${description} をチェック中: ${url}`);

    let lastError = null;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await this.httpRequest(url);
        
        console.log(`  ✅ HTTP ${result.statusCode} - ${description} は正常です`);
        
        // Vercelヘッダーの確認
        if (result.headers['x-vercel-id']) {
          console.log(`  🆔 Vercel ID: ${result.headers['x-vercel-id']}`);
        }
        
        // キャッシュヘッダーの確認
        if (result.headers['x-vercel-cache']) {
          console.log(`  💾 Cache: ${result.headers['x-vercel-cache']}`);
        }

        return result;

      } catch (error) {
        lastError = error;
        console.log(`  ⚠️ 試行 ${attempt}/${this.maxRetries} 失敗: ${error.message}`);
        
        if (attempt < this.maxRetries) {
          console.log(`  ⏳ 10秒後にリトライします...`);
          await this.sleep(10000);
        }
      }
    }

    console.log(`  ❌ ${description} のチェックに失敗しました: ${lastError.message}`);
    throw lastError;
  }

  httpRequest(url) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const client = urlObj.protocol === 'https:' ? https : http;

      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        timeout: this.timeout,
        headers: {
          'User-Agent': 'Vercel-Deployment-Monitor/1.0'
        }
      };

      const req = client.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data
          });
        });
      });

      req.on('error', (error) => {
        reject(new Error(`HTTP request failed: ${error.message}`));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('HTTP request timeout'));
      });

      req.end();
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 詳細なドメイン診断
  async diagnoseDomain(domain) {
    console.log(`\n🔬 ${domain} の詳細診断を実行中...`);

    try {
      // DNS解決の確認
      const dnsOutput = execSync(`nslookup ${domain}`, { encoding: 'utf8' });
      console.log(`  📡 DNS解決結果:`);
      console.log(dnsOutput.split('\n').map(line => `    ${line}`).join('\n'));

      // SSL証明書の確認
      try {
        const sslOutput = execSync(`echo | openssl s_client -servername ${domain} -connect ${domain}:443 2>/dev/null | openssl x509 -noout -dates`, { encoding: 'utf8' });
        console.log(`  🔒 SSL証明書情報:`);
        console.log(sslOutput.split('\n').map(line => `    ${line}`).join('\n'));
      } catch (sslError) {
        console.log(`  ⚠️ SSL証明書の確認に失敗: ${sslError.message}`);
      }

    } catch (error) {
      console.log(`  ❌ DNS診断に失敗: ${error.message}`);
    }
  }
}

// CLI実行
if (import.meta.url === `file://${process.argv[1]}`) {
  const monitor = new DeploymentMonitor();
  
  // コマンドライン引数の処理
  const args = process.argv.slice(2);
  if (args.includes('--diagnose')) {
    const domain = args[args.indexOf('--diagnose') + 1] || 'suptia.com';
    monitor.diagnoseDomain(domain).catch(console.error);
  } else {
    monitor.monitor().catch(console.error);
  }
}

export default DeploymentMonitor;