#!/usr/bin/env node

import { execSync } from 'child_process';
import chalk from 'chalk';

/**
 * Vercel プロジェクト設定診断スクリプト
 * 
 * 機能:
 * - Vercel API を使用してプロジェクト設定を取得
 * - Git連携状況、ブランチ設定、環境変数の確認
 * - 問題箇所の自動検出とレポート生成
 */

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

class VercelDiagnostics {
  constructor() {
    this.baseUrl = 'https://api.vercel.com';
    this.headers = {
      'Authorization': `Bearer ${VERCEL_TOKEN}`,
      'Content-Type': 'application/json'
    };
    this.issues = [];
    this.recommendations = [];
  }

  async makeRequest(endpoint) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: this.headers
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(chalk.red(`❌ API Request failed: ${error.message}`));
      throw error;
    }
  }

  async getProjectInfo() {
    console.log(chalk.blue('🔍 Fetching project information...'));
    
    try {
      const project = await this.makeRequest(`/v9/projects/${VERCEL_PROJECT_ID}`);
      
      console.log(chalk.green('✅ Project found:'));
      console.log(`   Name: ${project.name}`);
      console.log(`   Framework: ${project.framework || 'Not specified'}`);
      console.log(`   Root Directory: ${project.rootDirectory || '/'}`);
      console.log(`   Build Command: ${project.buildCommand || 'Default'}`);
      console.log(`   Output Directory: ${project.outputDirectory || 'Default'}`);
      console.log(`   Install Command: ${project.installCommand || 'Default'}`);
      
      return project;
    } catch (error) {
      this.issues.push('Failed to fetch project information');
      throw error;
    }
  }

  async getGitIntegration() {
    console.log(chalk.blue('🔍 Checking Git integration...'));
    
    try {
      const project = await this.makeRequest(`/v9/projects/${VERCEL_PROJECT_ID}`);
      
      if (project.link) {
        console.log(chalk.green('✅ Git integration configured:'));
        console.log(`   Type: ${project.link.type}`);
        console.log(`   Repository: ${project.link.repo}`);
        console.log(`   Production Branch: ${project.link.productionBranch || 'main'}`);
        
        if (project.link.productionBranch !== 'master') {
          this.issues.push(`Production branch is set to '${project.link.productionBranch}' instead of 'master'`);
          this.recommendations.push('Update production branch to "master" in Vercel project settings');
        }
      } else {
        this.issues.push('No Git integration found');
        this.recommendations.push('Configure Git integration in Vercel project settings');
        console.log(chalk.red('❌ No Git integration configured'));
      }
      
      return project.link;
    } catch (error) {
      this.issues.push('Failed to check Git integration');
      throw error;
    }
  }

  async getEnvironmentVariables() {
    console.log(chalk.blue('🔍 Checking environment variables...'));
    
    try {
      const envVars = await this.makeRequest(`/v9/projects/${VERCEL_PROJECT_ID}/env`);
      
      const requiredVars = [
        'NEXT_PUBLIC_SANITY_PROJECT_ID',
        'NEXT_PUBLIC_SANITY_DATASET', 
        'NEXT_PUBLIC_SITE_URL',
        'SANITY_API_VERSION'
      ];
      
      console.log(chalk.green(`✅ Found ${envVars.envs.length} environment variables`));
      
      const existingVars = envVars.envs.map(env => env.key);
      const missingVars = requiredVars.filter(required => !existingVars.includes(required));
      
      if (missingVars.length > 0) {
        this.issues.push(`Missing required environment variables: ${missingVars.join(', ')}`);
        this.recommendations.push(`Add missing environment variables: ${missingVars.join(', ')}`);
        console.log(chalk.red(`❌ Missing variables: ${missingVars.join(', ')}`));
      } else {
        console.log(chalk.green('✅ All required environment variables are present'));
      }
      
      // Check for production environment
      const productionVars = envVars.envs.filter(env => 
        env.target.includes('production')
      );
      
      console.log(`   Production variables: ${productionVars.length}`);
      
      return envVars.envs;
    } catch (error) {
      this.issues.push('Failed to fetch environment variables');
      throw error;
    }
  }

  async getRecentDeployments() {
    console.log(chalk.blue('🔍 Checking recent deployments...'));
    
    try {
      const deployments = await this.makeRequest(`/v6/deployments?projectId=${VERCEL_PROJECT_ID}&limit=10`);
      
      console.log(chalk.green(`✅ Found ${deployments.deployments.length} recent deployments`));
      
      const productionDeploys = deployments.deployments.filter(d => d.target === 'production');
      const previewDeploys = deployments.deployments.filter(d => d.target === 'preview');
      
      console.log(`   Production deployments: ${productionDeploys.length}`);
      console.log(`   Preview deployments: ${previewDeploys.length}`);
      
      if (productionDeploys.length === 0) {
        this.issues.push('No production deployments found');
        this.recommendations.push('Trigger a production deployment from master branch');
        console.log(chalk.red('❌ No production deployments found'));
      } else {
        const latest = productionDeploys[0];
        console.log(`   Latest production: ${latest.state} (${new Date(latest.createdAt).toLocaleString()})`);
        
        if (latest.state !== 'READY') {
          this.issues.push(`Latest production deployment state: ${latest.state}`);
        }
      }
      
      return deployments.deployments;
    } catch (error) {
      this.issues.push('Failed to fetch deployments');
      throw error;
    }
  }

  async getDomains() {
    console.log(chalk.blue('🔍 Checking custom domains...'));
    
    try {
      const domains = await this.makeRequest(`/v9/projects/${VERCEL_PROJECT_ID}/domains`);
      
      console.log(chalk.green(`✅ Found ${domains.length} domains`));
      
      const suptiaComDomain = domains.find(d => d.name === 'suptia.com' || d.name === 'www.suptia.com');
      
      if (suptiaComDomain) {
        console.log(`   suptia.com status: ${suptiaComDomain.verified ? 'Verified' : 'Not verified'}`);
        
        if (!suptiaComDomain.verified) {
          this.issues.push('suptia.com domain is not verified');
          this.recommendations.push('Verify suptia.com domain in Vercel dashboard');
        }
      } else {
        this.issues.push('suptia.com domain not found');
        this.recommendations.push('Add suptia.com as custom domain');
        console.log(chalk.red('❌ suptia.com domain not configured'));
      }
      
      return domains;
    } catch (error) {
      this.issues.push('Failed to fetch domains');
      throw error;
    }
  }

  async checkDomainHealth() {
    console.log(chalk.blue('🔍 Testing domain accessibility...'));
    
    try {
      const response = await fetch('https://www.suptia.com', {
        method: 'HEAD',
        timeout: 10000
      });
      
      const vercelId = response.headers.get('x-vercel-id');
      
      console.log(`   Status: ${response.status}`);
      console.log(`   x-vercel-id: ${vercelId || 'Not found'}`);
      
      if (response.status === 404) {
        this.issues.push('suptia.com returns 404 error');
        this.recommendations.push('Check domain configuration and latest production deployment');
      }
      
      if (vercelId === 'DEPLOYMENT_NOT_FOUND') {
        this.issues.push('Domain shows DEPLOYMENT_NOT_FOUND');
        this.recommendations.push('Ensure production deployment exists and domain is properly configured');
      }
      
      return { status: response.status, vercelId };
    } catch (error) {
      this.issues.push(`Domain accessibility test failed: ${error.message}`);
      console.log(chalk.red(`❌ Domain test failed: ${error.message}`));
      return null;
    }
  }

  generateReport() {
    console.log(chalk.blue('\n📋 Diagnostic Report'));
    console.log('='.repeat(50));
    
    if (this.issues.length === 0) {
      console.log(chalk.green('✅ No issues detected!'));
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
    console.log(chalk.blue('🚀 Starting Vercel Project Diagnostics\n'));
    
    try {
      await this.getProjectInfo();
      await this.getGitIntegration();
      await this.getEnvironmentVariables();
      await this.getRecentDeployments();
      await this.getDomains();
      await this.checkDomainHealth();
      
      this.generateReport();
      
      if (this.issues.length > 0) {
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red(`\n💥 Diagnostics failed: ${error.message}`));
      process.exit(1);
    }
  }
}

// GitHub Actions で実行される場合の環境変数チェック
if (process.env.GITHUB_ACTIONS) {
  console.log(chalk.blue('🔧 Running in GitHub Actions environment'));
  
  // GitHub Secrets から環境変数を取得
  if (!VERCEL_TOKEN && process.env.GITHUB_TOKEN) {
    console.log(chalk.yellow('⚠️  VERCEL_TOKEN not found, check GitHub Secrets'));
  }
}

const diagnostics = new VercelDiagnostics();
diagnostics.run().catch(error => {
  console.error(chalk.red(`Fatal error: ${error.message}`));
  process.exit(1);
});