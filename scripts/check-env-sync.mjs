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
  
  if (!localKeys) {
    log(colors.yellow, `⚠️  Warning: .env.local not found at ${localPath}`);
    log(colors.yellow, '   This is expected for new developers. Please copy .env.local.example to .env.local and configure your values.');
    process.exit(0);
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

// Run the check
try {
  main();
} catch (error) {
  log(colors.red, `❌ Error: ${error.message}`);
  process.exit(1);
}