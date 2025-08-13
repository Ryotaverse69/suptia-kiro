#!/usr/bin/env node

/**
 * JSON-LD Validation Script
 * Validates Product schema.org structured data
 */

import { parse } from 'node-html-parser';

async function validateJsonLd() {
  try {
    console.log('🔍 Validating JSON-LD structured data...');
    
    // Try products page first, then fallback to home page
    const urls = [
      'http://localhost:3000/products',
      'http://localhost:3000'
    ];

    let response;
    let url;
    
    for (const testUrl of urls) {
      try {
        response = await fetch(testUrl);
        if (response.ok) {
          url = testUrl;
          break;
        }
      } catch (error) {
        console.log(`⚠️  Could not fetch ${testUrl}, trying next...`);
      }
    }

    if (!response || !response.ok) {
      console.error('❌ Could not fetch any test URLs');
      process.exit(1);
    }

    console.log(`📄 Fetching HTML from ${url}...`);
    const html = await response.text();
    const root = parse(html);

    // Find JSON-LD script tags
    const jsonLdScripts = root.querySelectorAll('script[type="application/ld+json"]');
    
    if (jsonLdScripts.length === 0) {
      console.error('❌ No JSON-LD script tags found');
      console.error('💡 Add <script type="application/ld+json"> with Product schema');
      process.exit(1);
    }

    console.log(`📊 Found ${jsonLdScripts.length} JSON-LD script(s)`);

    let productFound = false;

    for (let i = 0; i < jsonLdScripts.length; i++) {
      const script = jsonLdScripts[i];
      const jsonText = script.innerHTML.trim();
      
      if (!jsonText) {
        console.log(`⚠️  Script ${i + 1} is empty, skipping...`);
        continue;
      }

      try {
        const jsonData = JSON.parse(jsonText);
        console.log(`📋 Validating JSON-LD script ${i + 1}...`);

        // Handle arrays of structured data
        const items = Array.isArray(jsonData) ? jsonData : [jsonData];

        for (const item of items) {
          if (item['@type'] === 'Product') {
            productFound = true;
            console.log('✅ Found Product schema');

            // Validate required fields
            const validations = [
              { field: '@context', expected: 'https://schema.org', actual: item['@context'] },
              { field: '@type', expected: 'Product', actual: item['@type'] },
              { field: 'name', type: 'string', actual: item.name },
              { field: 'brand', type: 'string', actual: item.brand }
            ];

            // Check offers
            if (item.offers) {
              const offers = Array.isArray(item.offers) ? item.offers[0] : item.offers;
              validations.push(
                { field: 'offers.price', type: 'number', actual: offers.price },
                { field: 'offers.priceCurrency', expected: 'JPY', actual: offers.priceCurrency }
              );
            } else {
              console.error('❌ Missing offers field in Product schema');
              process.exit(1);
            }

            // Validate each field
            for (const validation of validations) {
              if (validation.expected !== undefined) {
                if (validation.actual !== validation.expected) {
                  console.error(`❌ ${validation.field}: expected "${validation.expected}", got "${validation.actual}"`);
                  process.exit(1);
                }
                console.log(`✅ ${validation.field}: ${validation.actual}`);
              } else if (validation.type) {
                if (typeof validation.actual !== validation.type) {
                  console.error(`❌ ${validation.field}: expected ${validation.type}, got ${typeof validation.actual}`);
                  process.exit(1);
                }
                console.log(`✅ ${validation.field}: ${validation.actual} (${validation.type})`);
              }
            }
          }
        }
      } catch (parseError) {
        console.error(`❌ Failed to parse JSON-LD script ${i + 1}:`, parseError.message);
        process.exit(1);
      }
    }

    if (!productFound) {
      console.error('❌ No Product schema found in JSON-LD');
      console.error('💡 Add Product schema with @context, @type, name, brand, offers.price, offers.priceCurrency');
      process.exit(1);
    }

    console.log('\n🎉 JSON-LD Product schema validation passed!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error validating JSON-LD:', error.message);
    console.error('💡 Make sure the app is running on http://localhost:3000');
    process.exit(1);
  }
}

validateJsonLd();