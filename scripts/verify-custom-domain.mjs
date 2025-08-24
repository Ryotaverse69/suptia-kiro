#!/usr/bin/env node

import chalk from 'chalk';

/**
 * カスタムドメイン検証スクリプト
 * 
 * 機能:
 * - HTTP ステータス、Vercel ヘッダー、コンテンツの自動検証
 * - 404エラーの根本原因特定と修正手順の提供
 * - ドメインアクセス権限の確認と修正
 */

class DomainVerifier {
  constructor(domain = 'suptia.com') {
    this.domain = domain;
    this.wwwDomain = `www.${domain}`;
    this.issues = [];
    this.recommendations = [];
  }

  async checkHttpStatus(url) {
    console.log(chalk.blue(`🔍 Checking HTTP status for ${url}...`));
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        timeout: 10000,
        headers: {
          'User-Agent': 'Suptia-Domain-Verifier/1.0'
        }
      });
      
      const status = response.status;
      const vercelId = response.headers.get('x-vercel-id');
      const server = response.headers.get('server');
      
      console.log(`   Status: ${status}`);
      console.log(`   Server: ${server || 'Unknown'}`);
      console.log(`   x-vercel-id: ${vercelId || 'Not found'}`);
      
      if (status === 404) {
        this.issues.push(`${url} returns 404 Not Found`);
        
        if (vercelId === 'DEPLOYMENT_NOT_FOUND') {
          this.issues.push('Vercel reports DEPLOYMENT_NOT_FOUND');
          this.recommendations.push('Ensure a production deployment exists');
          this.recommendations.push('Check domain configuration in Vercel dashboard');
        }
      } else if (status >= 400) {
        this.issues.push(`${url} returns error status ${status}`);
      } else {
        console.log(chalk.green(`✅ ${url} is accessible`));
      }
      
      return {
        url,
        status,
        vercelId,
        server,
        accessible: status >= 200 && status < 400
      };
    } catch (error) {
      console.log(chalk.red(`❌ Failed to check ${url}: ${error.message}`));
      this.issues.push(`Failed to access ${url}: ${error.message}`);
      return {
        url,
        status: null,
        error: error.message,
        accessible: false
      };
    }
  }

  async checkContent(url) {
    console.log(chalk.blue(`🔍 Checking content for ${url}...`));
    
    try {
      const response = await fetch(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Suptia-Domain-Verifier/1.0'
        }
      });
      
      if (!response.ok) {
        return { hasExpectedContent: false, reason: `HTTP ${response.status}` };
      }
      
      const html = await response.text();
      
      // Check for expected content
      const expectedPatterns = [
        'Suptia',
        'suptia',
        '<title>',
        'next.js'
      ];
      
      const foundPatterns = expectedPatterns.filter(pattern => 
        html.toLowerCase().includes(pattern.toLowerCase())
      );
      
      console.log(`   Found patterns: ${foundPatterns.join(', ')}`);
      
      if (foundPatterns.length === 0) {
        this.issues.push(`${url} does not contain expected content`);
        return { hasExpectedContent: false, reason: 'No expected patterns found' };
      }
      
      console.log(chalk.green(`✅ ${url} contains expected content`));
      return { hasExpectedContent: true, foundPatterns };
    } catch (error) {
      console.log(chalk.red(`❌ Failed to check content for ${url}: ${error.message}`));
      return { hasExpectedContent: false, reason: error.message };
    }
  }

  async checkDnsRecords() {
    console.log(chalk.blue('🔍 Checking DNS records...'));
    
    try {
      // Use a simple DNS lookup via HTTP API
      const dnsApiUrl = `https://dns.google/resolve?name=${this.domain}&type=A`;
      const response = await fetch(dnsApiUrl);
      const dnsData = await response.json();
      
      if (dnsData.Answer && dnsData.Answer.length > 0) {
        console.log(chalk.green(`✅ DNS A record found for ${this.domain}`));
        dnsData.Answer.forEach(record => {
          console.log(`   ${record.name} -> ${record.data}`);
        });
        return { hasDnsRecord: true, records: dnsData.Answer };
      } else {
        this.issues.push(`No DNS A record found for ${this.domain}`);
        this.recommendations.push('Configure DNS A record to point to Vercel');
        return { hasDnsRecord: false };
      }
    } catch (error) {
      console.log(chalk.yellow(`⚠️ Could not check DNS records: ${error.message}`));
      return { hasDnsRecord: null, error: error.message };
    }
  }

  async checkSslCertificate(url) {
    console.log(chalk.blue(`🔍 Checking SSL certificate for ${url}...`));
    
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        timeout: 10000
      });
      
      // If we can make an HTTPS request successfully, SSL is working
      console.log(chalk.green(`✅ SSL certificate is valid for ${url}`));
      return { sslValid: true };
    } catch (error) {
      if (error.message.includes('certificate') || error.message.includes('SSL')) {
        this.issues.push(`SSL certificate issue for ${url}`);
        this.recommendations.push('Check SSL certificate configuration in Vercel');
        return { sslValid: false, error: error.message };
      }
      
      // Other errors might not be SSL-related
      return { sslValid: null, error: error.message };
    }
  }

  generateReport() {
    console.log(chalk.blue('\n📋 Domain Verification Report'));
    console.log('='.repeat(50));
    
    if (this.issues.length === 0) {
      console.log(chalk.green('✅ All domain checks passed!'));
    } else {
      console.log(chalk.red(`❌ Found ${this.issues.length} issues:`));
      this.issues.forEach((issue, index) => {
        console.log(chalk.red(`   ${index + 1}. ${issue}`));
      });
    }
    
    if (this.recommendations.length > 0) {
      console.log(chalk.yellow(`\n💡 Recommendations:`));
      this.recommendations.forEach((rec, index) => {
        console.log(chalk.yellow(`   ${index + 1}. ${rec}`));
      });
    }
    
    console.log('\n' + '='.repeat(50));
  }

  async run() {
    console.log(chalk.blue(`🚀 Starting Domain Verification for ${this.domain}\n`));
    
    try {
      // Check both domain variants
      const httpsUrl = `https://${this.domain}`;
      const wwwHttpsUrl = `https://${this.wwwDomain}`;
      
      // HTTP Status checks
      const domainResult = await this.checkHttpStatus(httpsUrl);
      const wwwResult = await this.checkHttpStatus(wwwHttpsUrl);
      
      // Content checks (only if accessible)
      if (domainResult.accessible) {
        await this.checkContent(httpsUrl);
      }
      
      if (wwwResult.accessible) {
        await this.checkContent(wwwHttpsUrl);
      }
      
      // DNS and SSL checks
      await this.checkDnsRecords();
      await this.checkSslCertificate(httpsUrl);
      
      this.generateReport();
      
      // Exit with error code if issues found
      if (this.issues.length > 0) {
        process.exit(1);
      }
      
      console.log(chalk.green('\n🎉 Domain verification completed successfully!'));
    } catch (error) {
      console.error(chalk.red(`\n💥 Domain verification failed: ${error.message}`));
      process.exit(1);
    }
  }
}

// Command line usage
const domain = process.argv[2] || 'suptia.com';
const verifier = new DomainVerifier(domain);
verifier.run().catch(error => {
  console.error(chalk.red(`Fatal error: ${error.message}`));
  process.exit(1);
});