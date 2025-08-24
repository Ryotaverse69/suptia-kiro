#!/usr/bin/env node

/**
 * JSON-LD Validator
 * 
 * このスクリプトは、アプリケーションの構造化データ（JSON-LD）が適切に設定されているかを確認します。
 */

import { execSync } from 'child_process';

const REQUIRED_SCHEMAS = [
  'Organization',
  'WebSite',
  'WebPage'
];

const OPTIONAL_SCHEMAS = [
  'BreadcrumbList',
  'Article',
  'Product',
  'Service'
];

async function validateJsonLD() {
  console.log('📋 Validating JSON-LD structured data...');
  
  try {
    // アプリケーションからHTMLを取得
    const html = execSync('curl -s http://localhost:3000', { encoding: 'utf8' });
    
    // JSON-LDスクリプトタグを抽出
    const jsonLdMatches = html.match(/<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs);
    
    if (!jsonLdMatches || jsonLdMatches.length === 0) {
      console.error('❌ No JSON-LD structured data found!');
      process.exit(1);
    }
    
    console.log(`📊 Found ${jsonLdMatches.length} JSON-LD script(s)`);
    
    const foundSchemas = new Set();
    let hasErrors = false;
    
    // 各JSON-LDスクリプトを検証
    for (let i = 0; i < jsonLdMatches.length; i++) {
      const match = jsonLdMatches[i];
      const jsonContent = match.replace(/<script[^>]*>/, '').replace(/<\/script>/, '').trim();
      
      try {
        const jsonLd = JSON.parse(jsonContent);
        console.log(`\n📄 Validating JSON-LD script ${i + 1}:`);
        
        const result = validateJsonLdObject(jsonLd);
        if (result.schemas) {
          result.schemas.forEach(schema => foundSchemas.add(schema));
        }
        
        if (result.errors.length > 0) {
          hasErrors = true;
          result.errors.forEach(error => console.error(`  ❌ ${error}`));
        }
        
        if (result.warnings.length > 0) {
          result.warnings.forEach(warning => console.warn(`  ⚠️  ${warning}`));
        }
        
        if (result.success.length > 0) {
          result.success.forEach(success => console.log(`  ✅ ${success}`));
        }
        
      } catch (parseError) {
        console.error(`  ❌ Invalid JSON in script ${i + 1}: ${parseError.message}`);
        hasErrors = true;
      }
    }
    
    // 必須スキーマの確認
    console.log('\n📋 Schema coverage check:');
    for (const requiredSchema of REQUIRED_SCHEMAS) {
      if (foundSchemas.has(requiredSchema)) {
        console.log(`  ✅ ${requiredSchema} schema found`);
      } else {
        console.error(`  ❌ Missing required schema: ${requiredSchema}`);
        hasErrors = true;
      }
    }
    
    // オプションスキーマの確認
    for (const optionalSchema of OPTIONAL_SCHEMAS) {
      if (foundSchemas.has(optionalSchema)) {
        console.log(`  ℹ️  ${optionalSchema} schema found`);
      }
    }
    
    if (hasErrors) {
      console.error('\n❌ JSON-LD validation failed!');
      process.exit(1);
    } else {
      console.log('\n✅ All JSON-LD structured data is valid!');
    }
    
  } catch (error) {
    console.error('❌ Failed to validate JSON-LD:', error.message);
    process.exit(1);
  }
}

function validateJsonLdObject(jsonLd) {
  const result = {
    schemas: [],
    errors: [],
    warnings: [],
    success: []
  };
  
  // 配列の場合は各要素を検証
  if (Array.isArray(jsonLd)) {
    for (const item of jsonLd) {
      const itemResult = validateJsonLdObject(item);
      result.schemas.push(...itemResult.schemas);
      result.errors.push(...itemResult.errors);
      result.warnings.push(...itemResult.warnings);
      result.success.push(...itemResult.success);
    }
    return result;
  }
  
  // @contextの確認
  if (!jsonLd['@context']) {
    result.errors.push('Missing @context property');
  } else if (jsonLd['@context'] !== 'https://schema.org' && 
             !jsonLd['@context'].includes('schema.org')) {
    result.warnings.push('@context should reference schema.org');
  } else {
    result.success.push('@context is properly set');
  }
  
  // @typeの確認
  if (!jsonLd['@type']) {
    result.errors.push('Missing @type property');
  } else {
    const type = Array.isArray(jsonLd['@type']) ? jsonLd['@type'][0] : jsonLd['@type'];
    result.schemas.push(type);
    result.success.push(`Found ${type} schema`);
    
    // 特定のスキーマタイプに対する追加検証
    validateSpecificSchema(jsonLd, type, result);
  }
  
  return result;
}

function validateSpecificSchema(jsonLd, type, result) {
  switch (type) {
    case 'Organization':
      if (!jsonLd.name) result.errors.push('Organization missing required "name" property');
      if (!jsonLd.url) result.warnings.push('Organization missing recommended "url" property');
      break;
      
    case 'WebSite':
      if (!jsonLd.name) result.errors.push('WebSite missing required "name" property');
      if (!jsonLd.url) result.errors.push('WebSite missing required "url" property');
      break;
      
    case 'WebPage':
      if (!jsonLd.name && !jsonLd.title) {
        result.errors.push('WebPage missing required "name" or "title" property');
      }
      break;
      
    case 'Article':
      if (!jsonLd.headline) result.errors.push('Article missing required "headline" property');
      if (!jsonLd.author) result.warnings.push('Article missing recommended "author" property');
      if (!jsonLd.datePublished) result.warnings.push('Article missing recommended "datePublished" property');
      break;
      
    case 'BreadcrumbList':
      if (!jsonLd.itemListElement || !Array.isArray(jsonLd.itemListElement)) {
        result.errors.push('BreadcrumbList missing required "itemListElement" array');
      }
      break;
  }
}

// スクリプトが直接実行された場合のみ実行
if (import.meta.url === `file://${process.argv[1]}`) {
  validateJsonLD();
}

export { validateJsonLD };