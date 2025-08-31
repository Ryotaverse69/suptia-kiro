#!/usr/bin/env node

import { execSync } from 'child_process';
import chalk from 'chalk';

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const VERCEL_ORG_ID = process.env.VERCEL_ORG_ID;

if (!VERCEL_TOKEN) {
  console.error(chalk.red('❌ VERCEL_TOKEN environment variable is required'));
  process.exit(1);
}

if (!VERCEL_PROJECT_ID) {
  console.error(chalk.red('❌ VERCEL_PROJECT_ID environment variable is required'));
  process.exit(1);
}

if (!VERCEL_ORG_ID) {
  console.error(chalk.red('❌ VERCEL_ORG_ID environment variable is required'));
  process.exit(1);
}

console.log(chalk.blue('🔍 Vercel ドメイン設定診断を開始します...'));

async function makeVercelRequest(endpoint, method = 'GET') {
  try {
    const url = `https://api.vercel.com${endpoint}`;
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(chalk.red(`❌ API request failed: ${error.message}`));
    return null;
  }
}

async function checkDomainSettings() {
  console.log(chalk.yellow('\n📋 ドメイン設定を確認中...'));

  // プロジェクトのドメイン一覧を取得
  const domains = await makeVercelRequest(`/v9/projects/${VERCEL_PROJECT_ID}/domains?teamId=${VERCEL_ORG_ID}`);
  
  if (!domains) {
    console.error(chalk.red('❌ ドメイン情報の取得に失敗しました'));
    return false;
  }

  console.log(chalk.green(`✅ ${domains.domains?.length || 0} 個のドメインが設定されています`));

  if (domains.domains && domains.domains.length > 0) {
    for (const domain of domains.domains) {
      console.log(chalk.cyan(`\n🌐 ドメイン: ${domain.name}`));
      console.log(`   - 作成日: ${new Date(domain.createdAt).toLocaleString()}`);
      console.log(`   - 検証済み: ${domain.verified ? '✅' : '❌'}`);
      console.log(`   - リダイレクト: ${domain.redirect || 'なし'}`);
      
      if (domain.configuredBy) {
        console.log(`   - 設定者: ${domain.configuredBy}`);
      }
    }
  } else {
    console.log(chalk.yellow('⚠️ 設定されているドメインがありません'));
  }

  return true;
}

async function checkDNSRecords() {
  console.log(chalk.yellow('\n🔍 DNS レコードを確認中...'));

  const domains = ['suptia.com', 'www.suptia.com'];
  
  for (const domain of domains) {
    try {
      console.log(chalk.cyan(`\n🌐 ${domain} の DNS 確認:`));
      
      // A レコードの確認
      try {
        const aRecords = execSync(`dig +short A ${domain}`, { encoding: 'utf8' }).trim();
        if (aRecords) {
          console.log(`   A レコード: ${aRecords.split('\n').join(', ')}`);
        } else {
          console.log(chalk.yellow('   A レコード: 設定なし'));
        }
      } catch (error) {
        console.log(chalk.yellow('   A レコード: 確認できませんでした'));
      }

      // CNAME レコードの確認
      try {
        const cnameRecords = execSync(`dig +short CNAME ${domain}`, { encoding: 'utf8' }).trim();
        if (cnameRecords) {
          console.log(`   CNAME レコード: ${cnameRecords}`);
        } else {
          console.log(chalk.yellow('   CNAME レコード: 設定なし'));
        }
      } catch (error) {
        console.log(chalk.yellow('   CNAME レコード: 確認できませんでした'));
      }

    } catch (error) {
      console.log(chalk.red(`   ❌ ${domain} の DNS 確認に失敗: ${error.message}`));
    }
  }
}

async function checkSSLCertificates() {
  console.log(chalk.yellow('\n🔒 SSL証明書を確認中...'));

  const domains = ['suptia.com', 'www.suptia.com'];
  
  for (const domain of domains) {
    try {
      console.log(chalk.cyan(`\n🔒 ${domain} の SSL証明書:`));
      
      const certInfo = execSync(`echo | openssl s_client -servername ${domain} -connect ${domain}:443 2>/dev/null | openssl x509 -noout -dates -subject -issuer`, { encoding: 'utf8' });
      
      if (certInfo) {
        const lines = certInfo.split('\n');
        for (const line of lines) {
          if (line.trim()) {
            console.log(`   ${line.trim()}`);
          }
        }
      }
    } catch (error) {
      console.log(chalk.red(`   ❌ ${domain} の SSL証明書確認に失敗`));
    }
  }
}

async function checkHTTPStatus() {
  console.log(chalk.yellow('\n🌐 HTTP ステータス確認中...'));

  const urls = ['https://suptia.com', 'https://www.suptia.com'];
  
  for (const url of urls) {
    try {
      console.log(chalk.cyan(`\n📡 ${url}:`));
      
      const response = await fetch(url, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'Vercel-Domain-Diagnostic/1.0'
        }
      });

      console.log(`   HTTP ステータス: ${response.status} ${response.statusText}`);
      
      // Vercel ヘッダーの確認
      const vercelId = response.headers.get('x-vercel-id');
      if (vercelId) {
        console.log(`   ✅ Vercel ID: ${vercelId}`);
      } else {
        console.log(chalk.yellow('   ⚠️ Vercel ID ヘッダーが見つかりません'));
      }

      const server = response.headers.get('server');
      if (server) {
        console.log(`   サーバー: ${server}`);
      }

      const cacheControl = response.headers.get('cache-control');
      if (cacheControl) {
        console.log(`   キャッシュ制御: ${cacheControl}`);
      }

    } catch (error) {
      console.log(chalk.red(`   ❌ ${url} へのアクセスに失敗: ${error.message}`));
    }
  }
}

async function generateDiagnosticReport() {
  console.log(chalk.blue('\n📊 診断レポートを生成中...'));

  const report = {
    timestamp: new Date().toISOString(),
    domains: [],
    recommendations: []
  };

  // ドメイン設定の確認
  const domains = await makeVercelRequest(`/v9/projects/${VERCEL_PROJECT_ID}/domains?teamId=${VERCEL_ORG_ID}`);
  
  if (domains && domains.domains) {
    report.domains = domains.domains.map(domain => ({
      name: domain.name,
      verified: domain.verified,
      createdAt: domain.createdAt,
      redirect: domain.redirect
    }));

    // 推奨事項の生成
    const unverifiedDomains = domains.domains.filter(d => !d.verified);
    if (unverifiedDomains.length > 0) {
      report.recommendations.push({
        type: 'warning',
        message: `未検証のドメインがあります: ${unverifiedDomains.map(d => d.name).join(', ')}`
      });
    }

    const hasApexDomain = domains.domains.some(d => d.name === 'suptia.com');
    const hasWwwDomain = domains.domains.some(d => d.name === 'www.suptia.com');

    if (!hasApexDomain) {
      report.recommendations.push({
        type: 'error',
        message: 'suptia.com ドメインが設定されていません'
      });
    }

    if (!hasWwwDomain) {
      report.recommendations.push({
        type: 'warning',
        message: 'www.suptia.com ドメインが設定されていません'
      });
    }
  }

  // レポートをファイルに保存
  const reportPath = 'domain-diagnostic-report.json';
  await import('fs').then(fs => {
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  });

  console.log(chalk.green(`✅ 診断レポートを ${reportPath} に保存しました`));

  // 推奨事項の表示
  if (report.recommendations.length > 0) {
    console.log(chalk.yellow('\n💡 推奨事項:'));
    for (const rec of report.recommendations) {
      const icon = rec.type === 'error' ? '❌' : '⚠️';
      console.log(`   ${icon} ${rec.message}`);
    }
  } else {
    console.log(chalk.green('\n✅ ドメイン設定に問題は見つかりませんでした'));
  }

  return report;
}

async function main() {
  try {
    console.log(chalk.blue('🚀 Vercel ドメイン設定診断ツール'));
    console.log(chalk.gray(`プロジェクト ID: ${VERCEL_PROJECT_ID}`));
    console.log(chalk.gray(`組織 ID: ${VERCEL_ORG_ID}`));

    await checkDomainSettings();
    await checkDNSRecords();
    await checkSSLCertificates();
    await checkHTTPStatus();
    await generateDiagnosticReport();

    console.log(chalk.green('\n✅ ドメイン設定診断が完了しました'));

  } catch (error) {
    console.error(chalk.red(`❌ 診断中にエラーが発生しました: ${error.message}`));
    process.exit(1);
  }
}

main();