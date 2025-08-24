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
      const vercelCache = response.headers.get('x-vercel-cache');
      const age = response.headers.get('age');
      
      console.log(`   Status: ${status}`);
      console.log(`   Server: ${server || 'Unknown'}`);
      console.log(`   x-vercel-id: ${vercelId || 'Not found'}`);
      console.log(`   x-vercel-cache: ${vercelCache || 'Not found'}`);
      console.log(`   Age: ${age || 'Not found'}`);
      
      // Vercelヘッダーの詳細分析
      if (vercelId) {
        console.log(chalk.green(`   ✅ Vercel deployment detected`));
        
        // Vercel IDの形式チェック
        if (vercelId.startsWith('dpl_')) {
          console.log(`   📋 Deployment ID format: Valid`);
        } else if (vercelId === 'DEPLOYMENT_NOT_FOUND') {
          this.issues.push('Vercel reports DEPLOYMENT_NOT_FOUND');
          this.recommendations.push('Ensure a production deployment exists for this domain');
          this.recommendations.push('Check domain configuration in Vercel dashboard');
          this.recommendations.push('Verify that the domain is correctly assigned to the production deployment');
        } else {
          console.log(`   ⚠️ Unexpected Vercel ID format: ${vercelId}`);
        }
      } else {
        this.issues.push(`No x-vercel-id header found for ${url}`);
        this.recommendations.push('Verify that the domain is properly configured in Vercel');
        this.recommendations.push('Check if the domain is pointing to the correct Vercel deployment');
      }
      
      if (status === 404) {
        this.issues.push(`${url} returns 404 Not Found`);
        
        if (vercelId === 'DEPLOYMENT_NOT_FOUND') {
          this.recommendations.push('Run: vercel domains ls to check domain configuration');
          this.recommendations.push('Run: vercel deployments ls --prod to check production deployments');
          this.recommendations.push('Ensure the domain is assigned to the correct project');
        } else {
          this.recommendations.push('Check if the application is properly built and deployed');
          this.recommendations.push('Verify routing configuration in your application');
        }
      } else if (status >= 400) {
        this.issues.push(`${url} returns error status ${status}`);
        this.recommendations.push(`Investigate the cause of HTTP ${status} error`);
      } else {
        console.log(chalk.green(`✅ ${url} is accessible`));
      }
      
      return {
        url,
        status,
        vercelId,
        server,
        vercelCache,
        age,
        accessible: status >= 200 && status < 400
      };
    } catch (error) {
      console.log(chalk.red(`❌ Failed to check ${url}: ${error.message}`));
      this.issues.push(`Failed to access ${url}: ${error.message}`);
      
      // ネットワークエラーの詳細分析
      if (error.message.includes('ENOTFOUND')) {
        this.recommendations.push('DNS resolution failed - check DNS configuration');
        this.recommendations.push('Verify that DNS records are properly configured');
      } else if (error.message.includes('ECONNREFUSED')) {
        this.recommendations.push('Connection refused - check if the service is running');
      } else if (error.message.includes('timeout')) {
        this.recommendations.push('Request timeout - check network connectivity and server response time');
      }
      
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
      // Check A record
      const dnsApiUrl = `https://dns.google/resolve?name=${this.domain}&type=A`;
      const response = await fetch(dnsApiUrl);
      const dnsData = await response.json();
      
      if (dnsData.Answer && dnsData.Answer.length > 0) {
        console.log(chalk.green(`✅ DNS A record found for ${this.domain}`));
        dnsData.Answer.forEach(record => {
          console.log(`   ${record.name} -> ${record.data}`);
          
          // Check if pointing to Vercel IPs
          const vercelIPs = ['76.76.19.61', '76.223.126.88'];
          if (vercelIPs.includes(record.data)) {
            console.log(chalk.green(`   ✅ Points to Vercel IP`));
          } else {
            console.log(chalk.yellow(`   ⚠️ Not pointing to known Vercel IP`));
          }
        });
        
        // Check CNAME record for www subdomain
        await this.checkCnameRecord();
        
        return { hasDnsRecord: true, records: dnsData.Answer };
      } else {
        this.issues.push(`No DNS A record found for ${this.domain}`);
        this.recommendations.push('Configure DNS A record to point to Vercel (76.76.19.61)');
        this.recommendations.push('Or configure CNAME record to point to cname.vercel-dns.com');
        return { hasDnsRecord: false };
      }
    } catch (error) {
      console.log(chalk.yellow(`⚠️ Could not check DNS records: ${error.message}`));
      return { hasDnsRecord: null, error: error.message };
    }
  }

  async checkCnameRecord() {
    try {
      const cnameApiUrl = `https://dns.google/resolve?name=${this.wwwDomain}&type=CNAME`;
      const response = await fetch(cnameApiUrl);
      const cnameData = await response.json();
      
      if (cnameData.Answer && cnameData.Answer.length > 0) {
        console.log(chalk.green(`✅ CNAME record found for ${this.wwwDomain}`));
        cnameData.Answer.forEach(record => {
          console.log(`   ${record.name} -> ${record.data}`);
          
          if (record.data.includes('vercel')) {
            console.log(chalk.green(`   ✅ Points to Vercel`));
          }
        });
      } else {
        console.log(chalk.yellow(`⚠️ No CNAME record found for ${this.wwwDomain}`));
        this.recommendations.push(`Consider adding CNAME record for ${this.wwwDomain} -> cname.vercel-dns.com`);
      }
    } catch (error) {
      console.log(chalk.yellow(`⚠️ Could not check CNAME record: ${error.message}`));
    }
  }

  async checkVercelDomainConfig() {
    console.log(chalk.blue('🔍 Checking Vercel domain configuration...'));
    
    const token = process.env.VERCEL_TOKEN;
    if (!token) {
      console.log(chalk.yellow('⚠️ VERCEL_TOKEN not found, skipping Vercel API checks'));
      return { checked: false, reason: 'No token' };
    }
    
    try {
      // Get domains for the project
      const projectId = process.env.VERCEL_PROJECT_ID;
      if (!projectId) {
        console.log(chalk.yellow('⚠️ VERCEL_PROJECT_ID not found'));
        return { checked: false, reason: 'No project ID' };
      }
      
      const domainsResponse = await fetch(`https://api.vercel.com/v9/projects/${projectId}/domains`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!domainsResponse.ok) {
        throw new Error(`Vercel API error: ${domainsResponse.status}`);
      }
      
      const domainsData = await domainsResponse.json();
      console.log(`   Found ${domainsData.domains.length} configured domains`);
      
      const targetDomain = domainsData.domains.find(d => d.name === this.domain);
      if (targetDomain) {
        console.log(chalk.green(`✅ Domain ${this.domain} is configured in Vercel`));
        console.log(`   Verification: ${targetDomain.verified ? '✅ Verified' : '❌ Not verified'}`);
        console.log(`   Created: ${new Date(targetDomain.createdAt).toLocaleString()}`);
        
        if (!targetDomain.verified) {
          this.issues.push(`Domain ${this.domain} is not verified in Vercel`);
          this.recommendations.push('Verify the domain in Vercel dashboard');
          this.recommendations.push('Check DNS configuration and wait for propagation');
        }
      } else {
        this.issues.push(`Domain ${this.domain} is not configured in Vercel project`);
        this.recommendations.push(`Add domain ${this.domain} to Vercel project`);
        this.recommendations.push('Run: vercel domains add ' + this.domain);
      }
      
      return { checked: true, domains: domainsData.domains, targetDomain };
    } catch (error) {
      console.log(chalk.yellow(`⚠️ Could not check Vercel domain config: ${error.message}`));
      return { checked: false, error: error.message };
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
      
      // Vercel domain configuration check (first)
      await this.checkVercelDomainConfig();
      
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