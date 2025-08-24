#!/usr/bin/env node

/**
 * Vercel環境変数設定確認スクリプト
 * 必要な環境変数の一覧作成と現状確認を行う
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// GitHub Secretsに設定すべき環境変数
const GITHUB_SECRETS = {
  'VERCEL_TOKEN': {
    description: 'Vercel API Token for GitHub Actions deployments',
    required: true
  },
  'VERCEL_ORG_ID': {
    description: 'Vercel Organization ID for GitHub Actions',
    required: true
  },
  'VERCEL_PROJECT_ID': {
    description: 'Vercel Project ID for GitHub Actions',
    required: true
  }
};

// Vercel環境変数として設定すべき環境変数
const REQUIRED_ENV_VARS = {
  // アプリケーション関連
  'NEXT_PUBLIC_APP_URL': {
    description: 'Public application URL',
    scope: ['production'],
    required: true,
    type: 'plain',
    expectedValue: 'https://suptia.com'
  },
  'NEXT_PUBLIC_PREVIEW_URL': {
    description: 'Preview environment URL',
    scope: ['preview'],
    required: false,
    type: 'plain'
  },
  
  // データベース関連（もし使用している場合）
  'DATABASE_URL': {
    description: 'Database connection URL',
    scope: ['production', 'preview'],
    required: false,
    type: 'secret'
  },
  
  // API関連
  'API_SECRET_KEY': {
    description: 'API secret key for authentication',
    scope: ['production', 'preview'],
    required: false,
    type: 'secret'
  }
};

class VercelEnvChecker {
  constructor() {
    this.projectId = null;
    this.orgId = null;
    this.token = null;
    this.results = {
      local: {},
      github: {},
      vercel: {
        production: {},
        preview: {}
      },
      missing: [],
      recommendations: []
    };
  }

  async init() {
    console.log('🔍 Vercel環境変数設定確認を開始します...\n');
    
    // Vercel CLIの確認
    try {
      execSync('vercel --version', { stdio: 'pipe' });
    } catch (error) {
      console.error('❌ Vercel CLIがインストールされていません');
      console.log('📦 インストール: npm i -g vercel');
      process.exit(1);
    }

    // プロジェクト情報の取得
    await this.getProjectInfo();
    
    // 環境変数の確認
    await this.checkGitHubSecrets();
    await this.checkLocalEnv();
    await this.checkVercelEnv();
    
    // 結果の表示
    this.displayResults();
    this.generateRecommendations();
  }

  async getProjectInfo() {
    try {
      // .vercel/project.jsonから情報を取得
      const projectPath = '.vercel/project.json';
      if (fs.existsSync(projectPath)) {
        const projectData = JSON.parse(fs.readFileSync(projectPath, 'utf8'));
        this.projectId = projectData.projectId;
        this.orgId = projectData.orgId;
        console.log(`📋 プロジェクト: ${this.projectId}`);
        console.log(`🏢 組織: ${this.orgId}\n`);
      } else {
        console.log('⚠️  .vercel/project.json が見つかりません');
        console.log('💡 vercel link を実行してプロジェクトをリンクしてください\n');
      }
    } catch (error) {
      console.error('❌ プロジェクト情報の取得に失敗:', error.message);
    }
  }

  async checkGitHubSecrets() {
    console.log('🔐 GitHub Secrets の確認...');
    
    try {
      const output = execSync('gh secret list', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      const lines = output.split('\n');
      Object.keys(GITHUB_SECRETS).forEach(secretName => {
        const found = lines.some(line => line.startsWith(secretName));
        if (found) {
          this.results.github[secretName] = {
            status: 'found'
          };
          console.log(`  ✅ ${secretName} が設定済み`);
        } else {
          console.log(`  ❌ ${secretName} が未設定`);
        }
      });
      
    } catch (error) {
      console.log('  ⚠️  GitHub CLI が利用できません。手動で確認してください');
    }
    
    console.log();
  }

  checkLocalEnv() {
    console.log('📁 ローカル環境変数の確認...');
    
    // .env.local の確認
    const envFiles = ['.env.local', '.env', '.env.production', '.env.development'];
    
    envFiles.forEach(file => {
      if (fs.existsSync(file)) {
        console.log(`  ✅ ${file} が存在します`);
        const content = fs.readFileSync(file, 'utf8');
        
        Object.keys(REQUIRED_ENV_VARS).forEach(varName => {
          if (content.includes(varName)) {
            this.results.local[varName] = {
              file: file,
              status: 'found'
            };
          }
        });
      }
    });
    
    console.log();
  }

  async checkVercelEnv() {
    console.log('☁️  Vercel環境変数の確認...');
    
    if (!this.projectId) {
      console.log('⚠️  プロジェクトIDが不明のため、Vercel環境変数を確認できません\n');
      return;
    }

    try {
      // Production環境の環境変数を取得
      const prodEnvs = await this.getVercelEnvVars('production');
      this.results.vercel.production = prodEnvs;
      
      // Preview環境の環境変数を取得
      const previewEnvs = await this.getVercelEnvVars('preview');
      this.results.vercel.preview = previewEnvs;
      
    } catch (error) {
      console.error('❌ Vercel環境変数の取得に失敗:', error.message);
      console.log('💡 vercel login を実行してログインしてください\n');
    }
  }

  async getVercelEnvVars(environment) {
    try {
      const output = execSync(`vercel env ls ${environment}`, { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      const envVars = {};
      const lines = output.split('\n');
      
      lines.forEach(line => {
        // より柔軟な正規表現でマッチング
        const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s+/);
        if (match) {
          const varName = match[1];
          if (REQUIRED_ENV_VARS[varName]) {
            envVars[varName] = {
              status: 'found',
              environment: environment
            };
          }
        }
      });
      
      console.log(`  📊 ${environment}: ${Object.keys(envVars).length}個の環境変数を確認`);
      
      // デバッグ用: 検出された環境変数を表示
      if (Object.keys(envVars).length > 0) {
        console.log(`    検出: ${Object.keys(envVars).join(', ')}`);
      }
      
      return envVars;
      
    } catch (error) {
      console.log(`  ⚠️  ${environment}環境の環境変数取得に失敗: ${error.message}`);
      return {};
    }
  }

  displayResults() {
    console.log('\n📊 環境変数確認結果\n');
    console.log('=' .repeat(60));
    
    // GitHub Secrets の表示
    console.log('\n🔐 GitHub Secrets (GitHub Actions用)');
    Object.entries(GITHUB_SECRETS).forEach(([secretName, config]) => {
      console.log(`\n🔧 ${secretName}`);
      console.log(`   説明: ${config.description}`);
      console.log(`   必須: ${config.required ? '✅ はい' : '⚪ いいえ'}`);
      
      if (this.results.github[secretName]) {
        console.log(`   GitHub: ✅ 設定済み`);
      } else {
        console.log(`   GitHub: ❌ 未設定`);
        if (config.required) {
          this.results.missing.push({
            varName: secretName,
            environment: 'github',
            config: config,
            type: 'github_secret'
          });
        }
      }
    });
    
    // Vercel環境変数の表示
    console.log('\n☁️  Vercel環境変数');
    Object.entries(REQUIRED_ENV_VARS).forEach(([varName, config]) => {
      console.log(`\n🔧 ${varName}`);
      console.log(`   説明: ${config.description}`);
      console.log(`   必須: ${config.required ? '✅ はい' : '⚪ いいえ'}`);
      console.log(`   タイプ: ${config.type}`);
      console.log(`   スコープ: ${config.scope.join(', ')}`);
      
      // ローカル環境での状況
      if (this.results.local[varName]) {
        console.log(`   ローカル: ✅ ${this.results.local[varName].file} に設定済み`);
      } else {
        console.log(`   ローカル: ❌ 未設定`);
      }
      
      // Vercel環境での状況
      config.scope.forEach(env => {
        if (this.results.vercel[env] && this.results.vercel[env][varName]) {
          console.log(`   Vercel ${env}: ✅ 設定済み`);
        } else {
          console.log(`   Vercel ${env}: ❌ 未設定`);
          if (config.required) {
            this.results.missing.push({
              varName,
              environment: env,
              config,
              type: 'vercel_env'
            });
          }
        }
      });
    });
  }

  generateRecommendations() {
    console.log('\n\n💡 推奨アクション\n');
    console.log('=' .repeat(60));
    
    if (this.results.missing.length === 0) {
      console.log('✅ すべての必須環境変数が設定されています！');
      return;
    }
    
    console.log('❌ 以下の必須環境変数が不足しています:\n');
    
    // GitHub Secretsの不足分
    const githubMissing = this.results.missing.filter(item => item.type === 'github_secret');
    if (githubMissing.length > 0) {
      console.log('🔐 GitHub Secrets:');
      githubMissing.forEach(item => {
        console.log(`   ${item.varName}: ${item.config.description}`);
        console.log(`   設定コマンド: gh secret set ${item.varName}`);
      });
      console.log();
    }
    
    // Vercel環境変数の不足分
    const vercelMissing = this.results.missing.filter(item => item.type === 'vercel_env');
    if (vercelMissing.length > 0) {
      console.log('☁️  Vercel環境変数:');
      
      const groupedMissing = {};
      vercelMissing.forEach(item => {
        if (!groupedMissing[item.varName]) {
          groupedMissing[item.varName] = [];
        }
        groupedMissing[item.varName].push(item.environment);
      });
      
      Object.entries(groupedMissing).forEach(([varName, environments]) => {
        const config = REQUIRED_ENV_VARS[varName];
        console.log(`   ${varName}: ${config.description}`);
        
        if (config.type === 'secret') {
          environments.forEach(env => {
            console.log(`   設定コマンド: vercel env add ${varName} ${env}`);
          });
        } else {
          if (config.expectedValue) {
            environments.forEach(env => {
              console.log(`   設定コマンド: echo "${config.expectedValue}" | vercel env add ${varName} ${env}`);
            });
          } else {
            environments.forEach(env => {
              console.log(`   設定コマンド: vercel env add ${varName} ${env}`);
            });
          }
        }
      });
      console.log();
    }
    
    console.log('📚 詳細な設定方法:');
    console.log('   GitHub Secrets: https://docs.github.com/en/actions/security-guides/encrypted-secrets');
    console.log('   Vercel環境変数: https://vercel.com/docs/concepts/projects/environment-variables');
    console.log('\n🔄 設定後は以下を実行してください:');
    console.log('   vercel --prod  # 本番デプロイで設定を反映');
  }
}

// スクリプト実行
const checker = new VercelEnvChecker();
checker.init().catch(console.error);