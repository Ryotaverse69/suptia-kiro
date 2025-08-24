#!/usr/bin/env node

import fs from 'fs';

const content = fs.readFileSync('.github/workflows/ci.yml', 'utf8');
const lines = content.split('\n');

let hasError = false;
let lineNum = 0;

for (const line of lines) {
  lineNum++;
  if (line.trim() === '' || line.trim().startsWith('#')) continue;
  
  const indent = line.length - line.trimStart().length;
  const trimmed = line.trim();
  
  // Check for basic YAML structure issues
  if (trimmed.includes(':') && !trimmed.startsWith('-')) {
    if (indent % 2 !== 0) {
      console.log(`Warning: Odd indentation at line ${lineNum}: ${trimmed}`);
    }
  }
  
  // Check for common YAML errors
  if (trimmed.includes('\t')) {
    console.log(`Error: Tab character found at line ${lineNum} (use spaces)`);
    hasError = true;
  }
}

if (!hasError) {
  console.log('✅ Basic YAML structure check passed');
} else {
  console.log('❌ YAML structure issues found');
  process.exit(1);
}