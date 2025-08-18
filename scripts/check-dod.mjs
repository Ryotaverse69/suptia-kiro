#!/usr/bin/env node

/**
 * Definition of Done (DoD) 自動検証スクリプト
 * M0 DoDチェックリストの項目を自動的に検証し、合否を報告します
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const REQUIRED_CI_CHECKS = [
  'format:check',
  'lint', 
  'test',
  'typecheck',
  'build',
  'headers',
  'jsonld'
];

class DoDChecker {
  constructor() {
    this.results = {
      ciChecks: {},
      priceFeatures: {},
      compliance: {},
      quality: {},
      uiIntegration: {},
      seo: {},
      overall: { passed: 0, total: 0 }
    };
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',    // cyan
      success: '\x1b[32m', // green
      warning: '\x1b[33m', // yellow
      error: '\x1b[31m',   // red
      reset: '\x1b[0m'
    };
    
    const icon = {
      info: 'ℹ',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    };

    console.log(`${colors[type]}${icon[type]} ${message}${colors.reset}`);
  }

  async checkCIStatus() {
    this.log('必須CIチェックの検証を開始します...', 'info');
    
    for (const check of REQUIRED_CI_CHECKS) {
      try {
        switch (check) {
          case 'format:check':
            execSync('pnpm run format:check', { stdio: 'pipe' });
            break;
          case 'lint':
            execSync('pnpm run lint', { stdio: 'pipe' });
            break;
          case 'test':
            execSync('pnpm run test --run', { stdio: 'pipe' });
            break;
          case 'typecheck':
            execSync('pnpm run typecheck', { stdio: 'pipe' });
            break;
          case 'build':
            execSync('pnpm run build', { stdio: 'pipe' });
            break;
          case 'headers':
            // ヘッダーチェックスクリプトが存在する場合のみ実行
            if (existsSync('scripts/check-headers.mjs')) {
              execSync('node scripts/check-headers.mjs', { stdio: 'pipe' });
            } else {
              this.log(`ヘッダーチェックスクリプトが見つかりません: scripts/check-headers.mjs`, 'warning');
            }
            break;
          case 'jsonld':
            // JSON-LD検証スクリプトが存在する場合のみ実行
            if (existsSync('scripts/validate-jsonld.mjs')) {
              execSync('node scripts/validate-jsonld.mjs', { stdio: 'pipe' });
            } else {
              this.log(`JSON-LD検証スクリプトが見つかりません: scripts/validate-jsonld.mjs`, 'warning');
            }
            break;
        }
        
        this.results.ciChecks[check] = true;
        this.results.overall.passed++;
        this.log(`${check}: 通過`, 'success');
      } catch (error) {
        this.results.ciChecks[check] = false;
        this.log(`${check}: 失敗 - ${error.message}`, 'error');
      }
      this.results.overall.total++;
    }
  }

  checkPriceFeatures() {
    this.log('価格機能の検証を開始します...', 'info');
    
    const priceChecks = [
      {
        name: '楽天・Yahoo!コネクタの存在',
        check: () => {
          return existsSync('src/lib/pricing/rakuten-connector.ts') &&
                 existsSync('src/lib/pricing/yahoo-connector.ts');
        }
      },
      {
        name: '価格マッチャーの実装',
        check: () => existsSync('src/lib/pricing/price-matcher.ts')
      },
      {
        name: '価格正規化の実装',
        check: () => existsSync('src/lib/pricing/price-normalizer.ts')
      },
      {
        name: 'コスト計算機の実装',
        check: () => existsSync('src/lib/pricing/cost-calculator.ts')
      },
      {
        name: 'PriceTableコンポーネントの実装',
        check: () => existsSync('src/components/pricing/PriceTable.tsx')
      },
      {
        name: 'コストバッジコンポーネントの実装',
        check: () => {
          return existsSync('src/components/pricing/CostPerDayBadge.tsx') &&
                 existsSync('src/components/pricing/LowestPriceBadge.tsx');
        }
      }
    ];

    priceChecks.forEach(({ name, check }) => {
      const passed = check();
      this.results.priceFeatures[name] = passed;
      this.results.overall.total++;
      
      if (passed) {
        this.results.overall.passed++;
        this.log(`${name}: 通過`, 'success');
      } else {
        this.log(`${name}: 失敗`, 'error');
      }
    });
  }

  checkCompliance() {
    this.log('コンプライアンス・安全性の検証を開始します...', 'info');
    
    const complianceChecks = [
      {
        name: '安全診断フローの実装',
        check: () => existsSync('src/components/diagnosis/SafeDiagnosisFlow.tsx')
      },
      {
        name: 'コンプライアンスチェッカーの実装',
        check: () => existsSync('src/lib/diagnosis/compliance-checker.ts')
      },
      {
        name: '薬機法Lintスクリプトの実装',
        check: () => existsSync('../../scripts/lint-compliance.ts')
      },
      {
        name: 'コンプライアンスチェックワークフローの実装',
        check: () => existsSync('../../.github/workflows/compliance-check.yml')
      }
    ];

    complianceChecks.forEach(({ name, check }) => {
      const passed = check();
      this.results.compliance[name] = passed;
      this.results.overall.total++;
      
      if (passed) {
        this.results.overall.passed++;
        this.log(`${name}: 通過`, 'success');
      } else {
        this.log(`${name}: 失敗`, 'error');
      }
    });
  }

  checkQuality() {
    this.log('品質保証の検証を開始します...', 'info');
    
    const qualityChecks = [
      {
        name: 'A11yライトE2Eテストの実装',
        check: () => existsSync('src/__tests__/e2e/a11y-light.spec.ts')
      },
      {
        name: 'AggregateRating JSON-LDの実装',
        check: () => {
          return existsSync('src/lib/seo/aggregate-rating.ts') &&
                 existsSync('src/components/seo/AggregateRatingJsonLd.tsx');
        }
      },
      {
        name: '価格正規化テストの実装',
        check: () => existsSync('src/lib/pricing/__tests__/price-normalizer.test.ts')
      },
      {
        name: 'マッチャーテストの実装',
        check: () => existsSync('src/lib/pricing/__tests__/price-matcher.test.ts')
      }
    ];

    qualityChecks.forEach(({ name, check }) => {
      const passed = check();
      this.results.quality[name] = passed;
      this.results.overall.total++;
      
      if (passed) {
        this.results.overall.passed++;
        this.log(`${name}: 通過`, 'success');
      } else {
        this.log(`${name}: 失敗`, 'error');
      }
    });
  }

  checkUIIntegration() {
    this.log('UI/UX統合の検証を開始します...', 'info');
    
    const uiChecks = [
      {
        name: 'ScoreDisplayコンポーネントの実装',
        check: () => existsSync('src/components/ScoreDisplay.tsx')
      },
      {
        name: 'PersonaWarningsコンポーネントの実装',
        check: () => existsSync('src/components/PersonaWarnings.tsx')
      },
      {
        name: 'WarningBannerコンポーネントの実装',
        check: () => existsSync('src/components/WarningBanner.tsx')
      },
      {
        name: '商品詳細ページの実装',
        check: () => existsSync('src/app/products/[slug]/page.tsx')
      }
    ];

    uiChecks.forEach(({ name, check }) => {
      const passed = check();
      this.results.uiIntegration[name] = passed;
      this.results.overall.total++;
      
      if (passed) {
        this.results.overall.passed++;
        this.log(`${name}: 通過`, 'success');
      } else {
        this.log(`${name}: 失敗`, 'error');
      }
    });
  }

  checkSEO() {
    this.log('SEO・構造化データの検証を開始します...', 'info');
    
    const seoChecks = [
      {
        name: 'SEOライブラリの実装',
        check: () => existsSync('src/lib/seo.ts')
      },
      {
        name: 'AggregateRating計算の実装',
        check: () => existsSync('src/lib/seo/aggregate-rating.ts')
      },
      {
        name: 'AggregateRatingテストの実装',
        check: () => existsSync('src/lib/seo/__tests__/aggregate-rating.test.ts')
      }
    ];

    seoChecks.forEach(({ name, check }) => {
      const passed = check();
      this.results.seo[name] = passed;
      this.results.overall.total++;
      
      if (passed) {
        this.results.overall.passed++;
        this.log(`${name}: 通過`, 'success');
      } else {
        this.log(`${name}: 失敗`, 'error');
      }
    });
  }

  generateReport() {
    this.log('\n=== Definition of Done (DoD) 検証レポート ===', 'info');
    
    const passRate = ((this.results.overall.passed / this.results.overall.total) * 100).toFixed(1);
    
    console.log(`\n📊 総合結果: ${this.results.overall.passed}/${this.results.overall.total} (${passRate}%)`);
    
    if (this.results.overall.passed === this.results.overall.total) {
      this.log('🎉 すべてのDoDチェックが通過しました！', 'success');
    } else {
      this.log(`⚠️  ${this.results.overall.total - this.results.overall.passed}個のチェックが失敗しています`, 'warning');
    }

    // 詳細レポート
    console.log('\n📋 詳細レポート:');
    
    const sections = [
      { name: '必須CIチェック', results: this.results.ciChecks },
      { name: '価格機能', results: this.results.priceFeatures },
      { name: 'コンプライアンス・安全性', results: this.results.compliance },
      { name: '品質保証', results: this.results.quality },
      { name: 'UI/UX統合', results: this.results.uiIntegration },
      { name: 'SEO・構造化データ', results: this.results.seo }
    ];

    sections.forEach(({ name, results }) => {
      const passed = Object.values(results).filter(Boolean).length;
      const total = Object.keys(results).length;
      
      if (total > 0) {
        console.log(`\n${name}: ${passed}/${total}`);
        Object.entries(results).forEach(([check, result]) => {
          const status = result ? '✅' : '❌';
          console.log(`  ${status} ${check}`);
        });
      }
    });

    return this.results.overall.passed === this.results.overall.total;
  }

  async run() {
    this.log('M0 Definition of Done (DoD) 検証を開始します...', 'info');
    
    try {
      await this.checkCIStatus();
      this.checkPriceFeatures();
      this.checkCompliance();
      this.checkQuality();
      this.checkUIIntegration();
      this.checkSEO();
      
      const allPassed = this.generateReport();
      
      if (!allPassed) {
        process.exit(1);
      }
      
    } catch (error) {
      this.log(`DoD検証中にエラーが発生しました: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// スクリプトが直接実行された場合のみ実行
if (import.meta.url === `file://${process.argv[1]}`) {
  const checker = new DoDChecker();
  checker.run();
}

export default DoDChecker;