#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const keys = new Set();
  
  // Parse environment variables (ignore comments and empty lines)
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    
    // Extract key name (everything before the first =)
    const equalIndex = trimmed.indexOf('=');
    if (equalIndex > 0) {
      const key = trimmed.substring(0, equalIndex).trim();
      keys.add(key);
    }
  }
  
  return keys;
}

function validateCIEnvironmentVariables(requiredKeys) {
  const requiredArray = Array.from(requiredKeys).sort();
  const missingKeys = [];
  const presentKeys = [];
  
  // Check which environment variables are available in CI
  for (const key of requiredArray) {
    if (process.env[key] !== undefined) {
      presentKeys.push(key);
    } else {
      // For CI, we allow certain keys to be missing if they have default values or are optional
      const optionalInCI = [
        'SANITY_STUDIO_URL', // Only needed for local development
        'NEXT_PUBLIC_BASE_URL' // Legacy fallback, can use NEXT_PUBLIC_SITE_URL
      ];
      
      if (!optionalInCI.includes(key)) {
        missingKeys.push(key);
      }
    }
  }
  
  if (missingKeys.length > 0) {
    log(colors.red, '❌ Missing required environment variables in CI:');
    for (const key of missingKeys) {
      log(colors.red, `   - ${key}`);
    }
    log(colors.red, '');
    log(colors.red, '💡 To fix this:');
    log(colors.red, '   1. Add missing environment variables to your CI/CD pipeline');
    log(colors.red, '   2. For Vercel deployments, ensure variables are set in both Production and Preview environments');
    log(colors.red, '   3. For GitHub Actions, add secrets to repository settings');
    process.exit(1);
  }
  
  log(colors.green, '✅ Environment variables validation passed in CI!');
  log(colors.green, `   Found ${presentKeys.length} required environment variables`);
  
  if (process.env.NODE_ENV !== 'test') {
    log(colors.blue, '');
    log(colors.blue, '📋 Available environment variables:');
    for (const key of presentKeys) {
      log(colors.blue, `   - ${key}`);
    }
  }
}

function main() {
  const webDir = path.join(__dirname, '..', 'apps', 'web');
  const examplePath = path.join(webDir, '.env.local.example');
  const localPath = path.join(webDir, '.env.local');
  
  log(colors.blue, '🔍 Checking environment variable synchronization...');
  
  // Parse both files
  const exampleKeys = parseEnvFile(examplePath);
  const localKeys = parseEnvFile(localPath);
  
  if (!exampleKeys) {
    log(colors.red, `❌ Error: .env.local.example not found at ${examplePath}`);
    process.exit(1);
  }
  
  // In CI environment, .env.local might not exist (which is expected)
  const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
  
  if (!localKeys) {
    if (isCI) {
      log(colors.blue, '📋 CI Environment: Validating required environment variables from .env.local.example');
      validateCIEnvironmentVariables(exampleKeys);
      return;
    } else {
      log(colors.yellow, `⚠️  Warning: .env.local not found at ${localPath}`);
      log(colors.yellow, '   This is expected for new developers. Please copy .env.local.example to .env.local and configure your values.');
      process.exit(0);
    }
  }
  
  // Compare keys
  const exampleArray = Array.from(exampleKeys).sort();
  const localArray = Array.from(localKeys).sort();
  
  const missingInLocal = exampleArray.filter(key => !localKeys.has(key));
  const extraInLocal = localArray.filter(key => !exampleKeys.has(key));
  
  let hasErrors = false;
  
  // Report missing keys
  if (missingInLocal.length > 0) {
    hasErrors = true;
    log(colors.red, `❌ Missing keys in .env.local:`);
    for (const key of missingInLocal) {
      log(colors.red, `   - ${key}`);
    }
  }
  
  // Report extra keys
  if (extraInLocal.length > 0) {
    hasErrors = true;
    log(colors.yellow, `⚠️  Extra keys in .env.local (not in .env.local.example):`);
    for (const key of extraInLocal) {
      log(colors.yellow, `   - ${key}`);
    }
  }
  
  if (hasErrors) {
    log(colors.red, '');
    log(colors.red, '💡 To fix this:');
    log(colors.red, '   1. Add missing keys to your .env.local file');
    log(colors.red, '   2. Remove extra keys from .env.local, or add them to .env.local.example if they should be documented');
    log(colors.red, '   3. Ensure both files have the same environment variable keys');
    process.exit(1);
  }
  
  // Success
  log(colors.green, '✅ Environment variables are synchronized!');
  log(colors.green, `   Found ${exampleArray.length} matching keys in both files`);
  
  if (process.env.NODE_ENV !== 'test') {
    log(colors.blue, '');
    log(colors.blue, '📋 Environment variables:');
    for (const key of exampleArray) {
      log(colors.blue, `   - ${key}`);
    }
  }
}

function checkVercelEnvironmentVariables() {
  log(colors.blue, '🔍 Checking Vercel environment variable recommendations...');
  
  const requiredForVercel = [
    'NEXT_PUBLIC_SANITY_PROJECT_ID',
    'NEXT_PUBLIC_SANITY_DATASET', 
    'NEXT_PUBLIC_SITE_URL',
    'SANITY_API_TOKEN',
    'SANITY_API_VERSION'
  ];
  
  const recommendations = [];
  const errors = [];
  
  // Check if we're in a Vercel environment
  const isVercel = process.env.VERCEL === '1';
  const isVercelBuild = process.env.VERCEL_ENV !== undefined;
  
  if (isVercel || isVercelBuild) {
    const vercelEnv = process.env.VERCEL_ENV; // 'production', 'preview', or 'development'
    log(colors.blue, `📦 Vercel environment detected: ${vercelEnv || 'unknown'}`);
    
    // Check required environment variables
    for (const key of requiredForVercel) {
      if (!process.env[key]) {
        errors.push(`Missing required environment variable: ${key}`);
        recommendations.push(`Set ${key} in Vercel dashboard for both Production and Preview environments`);
      }
    }
    
    // Environment-specific validations
    if (vercelEnv === 'production') {
      if (process.env.NEXT_PUBLIC_SITE_URL) {
        if (!process.env.NEXT_PUBLIC_SITE_URL.includes('suptia.com')) {
          errors.push('NEXT_PUBLIC_SITE_URL should point to production domain (suptia.com) in production environment');
        }
        if (process.env.NEXT_PUBLIC_SITE_URL.includes('vercel.app')) {
          errors.push('Production environment should not use vercel.app domain for NEXT_PUBLIC_SITE_URL');
        }
      }
      
      // Check for production-specific Sanity dataset
      if (process.env.NEXT_PUBLIC_SANITY_DATASET && process.env.NEXT_PUBLIC_SANITY_DATASET !== 'production') {
        recommendations.push('Consider using "production" dataset for production environment');
      }
    } else if (vercelEnv === 'preview') {
      if (process.env.NEXT_PUBLIC_SITE_URL) {
        if (process.env.NEXT_PUBLIC_SITE_URL.includes('suptia.com')) {
          errors.push('Preview environment should not use production domain (suptia.com) for NEXT_PUBLIC_SITE_URL');
        }
        if (!process.env.NEXT_PUBLIC_SITE_URL.includes('vercel.app')) {
          recommendations.push('Preview environment should typically use vercel.app domain for NEXT_PUBLIC_SITE_URL');
        }
      }
    }
    
    // Check for placeholder values
    const placeholderValues = ['your-project-id', 'your-dataset-name', 'demo', 'demo-token'];
    for (const key of requiredForVercel) {
      const value = process.env[key];
      if (value && placeholderValues.includes(value)) {
        errors.push(`Environment variable ${key} contains placeholder value: ${value}`);
      }
    }
    
    // Report errors
    if (errors.length > 0) {
      log(colors.red, '❌ Vercel environment variable errors:');
      for (const error of errors) {
        log(colors.red, `   - ${error}`);
      }
    }
    
    // Report recommendations
    if (recommendations.length > 0) {
      log(colors.yellow, '⚠️  Vercel environment variable recommendations:');
      for (const rec of recommendations) {
        log(colors.yellow, `   - ${rec}`);
      }
      log(colors.yellow, '');
      log(colors.yellow, '💡 To configure Vercel environment variables:');
      log(colors.yellow, '   1. Visit your Vercel project dashboard');
      log(colors.yellow, '   2. Go to Settings > Environment Variables');
      log(colors.yellow, '   3. Add variables for both Production and Preview environments');
      log(colors.yellow, '   4. Ensure Production uses suptia.com domain and Preview uses vercel.app domain');
      log(colors.yellow, '   5. Redeploy to apply changes');
    }
    
    if (errors.length === 0 && recommendations.length === 0) {
      log(colors.green, '✅ Vercel environment variables are properly configured!');
      log(colors.green, `   Environment: ${vercelEnv}`);
      log(colors.green, `   Site URL: ${process.env.NEXT_PUBLIC_SITE_URL || 'not set'}`);
      log(colors.green, `   Sanity Project: ${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'not set'}`);
      log(colors.green, `   Sanity Dataset: ${process.env.NEXT_PUBLIC_SANITY_DATASET || 'not set'}`);
    }
    
    // Exit with error if there are critical issues
    if (errors.length > 0) {
      log(colors.red, '');
      log(colors.red, '💥 Critical environment variable issues detected!');
      log(colors.red, '   Please fix the above errors before deploying.');
      process.exit(1);
    }
  } else {
    log(colors.blue, '📋 Not in Vercel environment - skipping Vercel-specific checks');
  }
}

// Run the check
try {
  main();
  
  // Additional Vercel-specific checks
  if (process.env.CI === 'true' || process.env.VERCEL === '1') {
    checkVercelEnvironmentVariables();
  }
} catch (error) {
  log(colors.red, `❌ Error: ${error.message}`);
  process.exit(1);
}