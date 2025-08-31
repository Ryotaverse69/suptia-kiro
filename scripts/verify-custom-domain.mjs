#!/usr/bin/env node

import chalk from 'chalk';

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const VERCEL_ORG_ID = process.env.VERCEL_ORG_ID;

async function makeVercelRequest(endpoint, method = 'GET', body = null) {
  try {
    const url = `https://api.vercel.com${endpoint}`;
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(chalk.red(`❌ API request failed: ${error.message}`));
    return null;
  }
}

async function verifyDomainAccess(domain) {
  console.log(chalk.yellow(`\n🔍 ${domain} のアクセス検証中...`));

  try {
    const response = await fetch(`https://${domain}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Vercel-Domain-Verification/1.0'
      },
      timeout: 10000
    });

    console.log(`   HTTP ステータス: ${response.status} ${response.statusText}`);

    // Vercel ヘッダーの確認
    const vercelId = response.headers.get('x-vercel-id');
    const vercelCache = response.headers.get('x-vercel-cache');
    const server = response.headers.get('server');

    if (vercelId) {
      console.log(chalk.green(`   ✅ Vercel ID: ${vercelId}`));
    } else {
      console.log(chalk.red('   ❌ Vercel ID ヘッダーが見つかりません'));
      return false;
    }

    if (vercelCache) {
      console.log(`   キャッシュ状態: ${vercelCache}`);
    }

    if (server && server.includes('Vercel')) {
      console.log(chalk.green(`   ✅ サーバー: ${server}`));
    } else {
      console.log(chalk.yellow(`   ⚠️ サーバー: ${server || '不明'}`));
    }

    // コンテンツの確認
    if (response.status === 200) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        const html = await response.text();
        
        // Next.js の確認
        if (html.includes('__NEXT_DATA__') || html.includes('_next/')) {
          console.log(chalk.green('   ✅ Next.js アプリケーションが正常に配信されています'));
        } else {
          console.log(chalk.yellow('   ⚠️ Next.js の特徴的な要素が見つかりません'));
        }

        // タイトルの確認
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch) {
          console.log(`   ページタイトル: "${titleMatch[1]}"`);
        }

        return true;
      } else {
        console.log(chalk.yellow(`   ⚠️ HTML以外のコンテンツタイプ: ${contentType}`));
        return false;
      }
    } else if (response.status === 404) {
      console.log(chalk.red('   ❌ 404 Not Found - ルーティング設定に問題がある可能性があります'));
      return false;
    } else {
      console.log(chalk.red(`   ❌ 予期しないステータスコード: ${response.status}`));
      return false;
    }

  } catch (error) {
    console.log(chalk.red(`   ❌ アクセス検証に失敗: ${error.message}`));
    return false;
  }
}

async function checkDomainConfiguration(domain) {
  console.log(chalk.yellow(`\n⚙️ ${domain} の設定確認中...`));

  // プロジェクトのドメイン一覧を取得
  const domains = await makeVercelRequest(`/v9/projects/${VERCEL_PROJECT_ID}/domains?teamId=${VERCEL_ORG_ID}`);
  
  if (!domains || !domains.domains) {
    console.log(chalk.red('   ❌ ドメイン設定の取得に失敗しました'));
    return false;
  }

  const domainConfig = domains.domains.find(d => d.name === domain);
  
  if (!domainConfig) {
    console.log(chalk.red(`   ❌ ${domain} がプロジェクトに設定されていません`));
    return false;
  }

  console.log(chalk.green(`   ✅ ${domain} がプロジェクトに設定されています`));
  console.log(`   - 検証済み: ${domainConfig.verified ? '✅' : '❌'}`);
  console.log(`   - 作成日: ${new Date(domainConfig.createdAt).toLocaleString()}`);
  
  if (domainConfig.redirect) {
    console.log(`   - リダイレクト先: ${domainConfig.redirect}`);
  }

  return domainConfig.verified;
}

async function diagnose404Issues(domain) {
  console.log(chalk.yellow(`\n🔍 ${domain} の404エラー診断中...`));

  const testPaths = [
    '/',
    '/products',
    '/products/test-product',
    '/api/health',
    '/_next/static/css/app.css'
  ];

  const results = [];

  for (const path of testPaths) {
    try {
      const url = `https://${domain}${path}`;
      const response = await fetch(url, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'Vercel-404-Diagnostic/1.0'
        }
      });

      results.push({
        path,
        status: response.status,
        statusText: response.statusText,
        vercelId: response.headers.get('x-vercel-id')
      });

      const statusColor = response.status === 200 ? 'green' : 
                         response.status === 404 ? 'red' : 'yellow';
      
      console.log(chalk[statusColor](`   ${path}: ${response.status} ${response.statusText}`));

    } catch (error) {
      results.push({
        path,
        status: 'ERROR',
        error: error.message
      });
      console.log(chalk.red(`   ${path}: エラー - ${error.message}`));
    }
  }

  // 診断結果の分析
  const successfulPaths = results.filter(r => r.status === 200);
  const notFoundPaths = results.filter(r => r.status === 404);
  const errorPaths = results.filter(r => r.status === 'ERROR');

  console.log(chalk.blue('\n📊 診断結果:'));
  console.log(`   成功: ${successfulPaths.length}/${testPaths.length}`);
  console.log(`   404エラー: ${notFoundPaths.length}/${testPaths.length}`);
  console.log(`   その他エラー: ${errorPaths.length}/${testPaths.length}`);

  if (notFoundPaths.length > 0) {
    console.log(chalk.yellow('\n💡 404エラーの可能性のある原因:'));
    console.log('   - vercel.json の rewrites 設定が正しくない');
    console.log('   - Next.js のルーティング設定に問題がある');
    console.log('   - ビルド時にページが正しく生成されていない');
    console.log('   - outputDirectory の設定が間違っている');
  }

  return results;
}

async function checkDeploymentStatus() {
  console.log(chalk.yellow('\n🚀 最新デプロイメント状況確認中...'));

  try {
    const deployments = await makeVercelRequest(`/v6/deployments?projectId=${VERCEL_PROJECT_ID}&teamId=${VERCEL_ORG_ID}&limit=5`);
    
    if (!deployments || !deployments.deployments) {
      console.log(chalk.red('   ❌ デプロイメント情報の取得に失敗しました'));
      return false;
    }

    const latestDeployment = deployments.deployments[0];
    
    if (latestDeployment) {
      console.log(chalk.green('   ✅ 最新デプロイメント情報:'));
      console.log(`   - URL: ${latestDeployment.url}`);
      console.log(`   - 状態: ${latestDeployment.state}`);
      console.log(`   - 作成日: ${new Date(latestDeployment.createdAt).toLocaleString()}`);
      console.log(`   - ブランチ: ${latestDeployment.meta?.githubCommitRef || '不明'}`);
      
      if (latestDeployment.state === 'READY') {
        console.log(chalk.green('   ✅ デプロイメントは正常に完了しています'));
        return true;
      } else {
        console.log(chalk.yellow(`   ⚠️ デプロイメント状態: ${latestDeployment.state}`));
        return false;
      }
    } else {
      console.log(chalk.red('   ❌ デプロイメントが見つかりません'));
      return false;
    }

  } catch (error) {
    console.log(chalk.red(`   ❌ デプロイメント状況確認に失敗: ${error.message}`));
    return false;
  }
}

async function generateVerificationReport(domains, results) {
  console.log(chalk.blue('\n📋 検証レポート生成中...'));

  const report = {
    timestamp: new Date().toISOString(),
    domains: domains.map(domain => ({
      domain,
      results: results[domain] || {}
    })),
    summary: {
      totalDomains: domains.length,
      successfulDomains: 0,
      failedDomains: 0,
      issues: []
    }
  };

  // サマリーの計算
  for (const domain of domains) {
    const domainResults = results[domain];
    if (domainResults && domainResults.accessVerification && domainResults.configurationCheck) {
      report.summary.successfulDomains++;
    } else {
      report.summary.failedDomains++;
      report.summary.issues.push(`${domain}: 検証に失敗しました`);
    }
  }

  // レポートをファイルに保存
  const reportPath = 'domain-verification-report.json';
  await import('fs').then(fs => {
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  });

  console.log(chalk.green(`✅ 検証レポートを ${reportPath} に保存しました`));

  // サマリーの表示
  console.log(chalk.blue('\n📊 検証サマリー:'));
  console.log(`   成功したドメイン: ${report.summary.successfulDomains}/${report.summary.totalDomains}`);
  console.log(`   失敗したドメイン: ${report.summary.failedDomains}/${report.summary.totalDomains}`);

  if (report.summary.issues.length > 0) {
    console.log(chalk.yellow('\n⚠️ 検出された問題:'));
    for (const issue of report.summary.issues) {
      console.log(`   - ${issue}`);
    }
  }

  return report;
}

async function main() {
  if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID || !VERCEL_ORG_ID) {
    console.error(chalk.red('❌ 必要な環境変数が設定されていません'));
    console.error('   VERCEL_TOKEN, VERCEL_PROJECT_ID, VERCEL_ORG_ID が必要です');
    process.exit(1);
  }

  console.log(chalk.blue('🔍 カスタムドメイン検証ツール'));
  console.log(chalk.gray(`プロジェクト ID: ${VERCEL_PROJECT_ID}`));

  const domains = ['suptia.com', 'www.suptia.com'];
  const results = {};

  // デプロイメント状況の確認
  await checkDeploymentStatus();

  // 各ドメインの検証
  for (const domain of domains) {
    console.log(chalk.blue(`\n🌐 ${domain} の検証を開始...`));
    
    results[domain] = {
      configurationCheck: await checkDomainConfiguration(domain),
      accessVerification: await verifyDomainAccess(domain),
      diagnosticResults: await diagnose404Issues(domain)
    };
  }

  // 検証レポートの生成
  await generateVerificationReport(domains, results);

  // 最終結果の表示
  const allSuccessful = domains.every(domain => 
    results[domain].configurationCheck && results[domain].accessVerification
  );

  if (allSuccessful) {
    console.log(chalk.green('\n✅ すべてのドメインの検証が成功しました'));
    process.exit(0);
  } else {
    console.log(chalk.red('\n❌ 一部のドメインで問題が検出されました'));
    process.exit(1);
  }
}

main();