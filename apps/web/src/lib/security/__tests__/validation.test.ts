import { describe, it, expect, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import {
  ProductQuerySchema,
  SearchQuerySchema,
  ContactFormSchema,
  NewsletterSchema,
  ProductReviewSchema,
  withValidation,
  sanitize,
  validate,
} from '../validation';

describe('Enhanced Validation', () => {
  describe('Schema Validation', () => {
    describe('ProductQuerySchema', () => {
      it('有効なslugを受け入れる', () => {
        const validSlugs = ['vitamin-d3', 'omega-3-fish-oil', 'b-complex-100'];
        
        validSlugs.forEach(slug => {
          const result = ProductQuerySchema.safeParse({ slug });
          expect(result.success).toBe(true);
        });
      });

      it('無効なslugを拒否する', () => {
        const invalidSlugs = ['', 'UPPERCASE', 'with spaces', 'with_underscores', 'a'.repeat(101)];
        
        invalidSlugs.forEach(slug => {
          const result = ProductQuerySchema.safeParse({ slug });
          expect(result.success).toBe(false);
        });
      });
    });

    describe('SearchQuerySchema', () => {
      it('有効な検索クエリを受け入れる', () => {
        const validQuery = {
          q: 'vitamin d',
          page: '1',
          limit: '10',
          category: 'vitamins',
          sortBy: 'relevance',
          sortOrder: 'desc',
        };

        const result = SearchQuerySchema.safeParse(validQuery);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.q).toBe('vitamin d');
          expect(result.data.page).toBe(1);
          expect(result.data.limit).toBe(10);
        }
      });

      it('デフォルト値を適用する', () => {
        const minimalQuery = { q: 'test' };
        
        const result = SearchQuerySchema.safeParse(minimalQuery);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.page).toBe(1);
          expect(result.data.limit).toBe(10);
          expect(result.data.sortBy).toBe('relevance');
          expect(result.data.sortOrder).toBe('desc');
        }
      });

      it('無効な検索クエリを拒否する', () => {
        const invalidQueries = [
          { q: '' }, // 空のクエリ
          { q: 'a'.repeat(201) }, // 長すぎるクエリ
          { q: 'test', page: '0' }, // 無効なページ
          { q: 'test', limit: '51' }, // 制限超過
          { q: 'test', sortBy: 'invalid' }, // 無効なソート
        ];

        invalidQueries.forEach(query => {
          const result = SearchQuerySchema.safeParse(query);
          expect(result.success).toBe(false);
        });
      });
    });

    describe('ContactFormSchema', () => {
      it('有効なコンタクトフォームを受け入れる', () => {
        const validForm = {
          name: 'John Doe',
          email: 'john@example.com',
          subject: 'Product inquiry',
          message: 'I would like to know more about your vitamin D supplements.',
          honeypot: '',
        };

        const result = ContactFormSchema.safeParse(validForm);
        expect(result.success).toBe(true);
      });

      it('無効なコンタクトフォームを拒否する', () => {
        const invalidForms = [
          { name: '', email: 'john@example.com', subject: 'Test', message: 'Test message' }, // 空の名前
          { name: 'John', email: 'invalid-email', subject: 'Test', message: 'Test message' }, // 無効なメール
          { name: 'John', email: 'john@example.com', subject: '', message: 'Test message' }, // 空の件名
          { name: 'John', email: 'john@example.com', subject: 'Test', message: 'Short' }, // 短すぎるメッセージ
          { name: 'John', email: 'john@example.com', subject: 'Test', message: 'Test message', honeypot: 'bot' }, // ハニーポット
        ];

        invalidForms.forEach(form => {
          const result = ContactFormSchema.safeParse(form);
          expect(result.success).toBe(false);
        });
      });
    });

    describe('ProductReviewSchema', () => {
      it('有効なレビューを受け入れる', () => {
        const validReview = {
          productSlug: 'vitamin-d3',
          rating: 5,
          title: 'Great product!',
          content: 'This vitamin D supplement has really helped improve my energy levels.',
          name: 'Jane Smith',
          email: 'jane@example.com',
          verified: false,
        };

        const result = ProductReviewSchema.safeParse(validReview);
        expect(result.success).toBe(true);
      });

      it('無効なレビューを拒否する', () => {
        const invalidReviews = [
          { productSlug: 'vitamin-d3', rating: 0, title: 'Test', content: 'Test content', name: 'John', email: 'john@example.com' }, // 無効な評価
          { productSlug: 'vitamin-d3', rating: 6, title: 'Test', content: 'Test content', name: 'John', email: 'john@example.com' }, // 評価が高すぎる
          { productSlug: 'vitamin-d3', rating: 5, title: '', content: 'Test content', name: 'John', email: 'john@example.com' }, // 空のタイトル
          { productSlug: 'vitamin-d3', rating: 5, title: 'Test', content: 'Short', name: 'John', email: 'john@example.com' }, // 短すぎるコンテンツ
        ];

        invalidReviews.forEach(review => {
          const result = ProductReviewSchema.safeParse(review);
          expect(result.success).toBe(false);
        });
      });
    });
  });

  describe('Validation Middleware', () => {
    const createMockRequest = (url: string, body?: any) => {
      const request = {
        url,
        json: vi.fn().mockResolvedValue(body),
      } as unknown as NextRequest;
      
      return request;
    };

    const createMockHandler = (response: any = { success: true }) => {
      return vi.fn().mockResolvedValue(NextResponse.json(response));
    };

    it('クエリパラメータの検証を行う', async () => {
      const handler = createMockHandler();
      const validatedHandler = withValidation(ProductQuerySchema, 'query')(handler);
      
      const request = createMockRequest('http://localhost:3000/api/product?slug=vitamin-d3');
      
      const response = await validatedHandler(request);
      
      expect(handler).toHaveBeenCalledWith(request, { slug: 'vitamin-d3' });
      expect(response.status).not.toBe(400);
    });

    it('JSONボディの検証を行う', async () => {
      const handler = createMockHandler();
      const validatedHandler = withValidation(ContactFormSchema, 'body')(handler);
      
      const body = {
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Test',
        message: 'This is a test message.',
      };
      
      const request = createMockRequest('http://localhost:3000/api/contact', body);
      
      const response = await validatedHandler(request);
      
      expect(handler).toHaveBeenCalledWith(request, expect.objectContaining(body));
      expect(response.status).not.toBe(400);
    });

    it('バリデーションエラー時に400を返す', async () => {
      const handler = createMockHandler();
      const validatedHandler = withValidation(ProductQuerySchema, 'query')(handler);
      
      const request = createMockRequest('http://localhost:3000/api/product?slug=INVALID_SLUG');
      
      const response = await validatedHandler(request);
      
      expect(response.status).toBe(400);
      expect(handler).not.toHaveBeenCalled();
      
      const responseData = await response.json();
      expect(responseData.error).toBe('Validation failed');
      expect(responseData.details).toBeDefined();
    });

    it('無効なJSONに対して400を返す', async () => {
      const handler = createMockHandler();
      const validatedHandler = withValidation(ContactFormSchema, 'body')(handler);
      
      const request = {
        url: 'http://localhost:3000/api/contact',
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
      } as unknown as NextRequest;
      
      const response = await validatedHandler(request);
      
      expect(response.status).toBe(400);
      expect(handler).not.toHaveBeenCalled();
      
      const responseData = await response.json();
      expect(responseData.error).toBe('Invalid JSON');
    });
  });

  describe('Sanitization Utilities', () => {
    describe('sanitize.slug', () => {
      it('slugを正規化する', () => {
        const testCases = [
          { input: 'Vitamin D3', expected: 'vitamin-d3' },
          { input: 'Omega-3 Fish Oil', expected: 'omega-3-fish-oil' },
          { input: 'B-Complex (100mg)', expected: 'b-complex-100mg' },
          { input: '  Extra  Spaces  ', expected: 'extra-spaces' },
          { input: 'Multiple---Dashes', expected: 'multiple-dashes' },
          { input: '-Leading-Trailing-', expected: 'leading-trailing' },
        ];

        testCases.forEach(({ input, expected }) => {
          expect(sanitize.slug(input)).toBe(expected);
        });
      });

      it('長すぎるslugを切り詰める', () => {
        const longSlug = 'a'.repeat(150);
        const result = sanitize.slug(longSlug);
        expect(result.length).toBe(100);
      });
    });

    describe('sanitize.searchQuery', () => {
      it('危険な文字を除去する', () => {
        const testCases = [
          { input: 'vitamin <script>', expected: 'vitamin script' },
          { input: 'search "term"', expected: 'search term' },
          { input: "search 'term'", expected: 'search term' },
          { input: 'search & replace', expected: 'search  replace' },
        ];

        testCases.forEach(({ input, expected }) => {
          expect(sanitize.searchQuery(input)).toBe(expected);
        });
      });

      it('長すぎるクエリを切り詰める', () => {
        const longQuery = 'a'.repeat(250);
        const result = sanitize.searchQuery(longQuery);
        expect(result.length).toBe(200);
      });
    });

    describe('sanitize.html', () => {
      it('HTMLエンティティをエスケープする', () => {
        const testCases = [
          { input: '<script>alert("xss")</script>', expected: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;' },
          { input: 'A & B', expected: 'A &amp; B' },
          { input: "It's a test", expected: 'It&#x27;s a test' },
        ];

        testCases.forEach(({ input, expected }) => {
          expect(sanitize.html(input)).toBe(expected);
        });
      });
    });

    describe('sanitize.emailForLogging', () => {
      it('メールアドレスをマスクする', () => {
        const testCases = [
          { input: 'john@example.com', expected: 'j**n@example.com' },
          { input: 'a@example.com', expected: 'a*@example.com' },
          { input: 'longusername@example.com', expected: 'l**********e@example.com' },
        ];

        testCases.forEach(({ input, expected }) => {
          expect(sanitize.emailForLogging(input)).toBe(expected);
        });
      });

      it('無効なメールアドレスを処理する', () => {
        expect(sanitize.emailForLogging('invalid-email')).toBe('[invalid-email]');
      });
    });
  });

  describe('Validation Utilities', () => {
    describe('validate.productSlug', () => {
      it('有効なslugを検証・正規化する', () => {
        const result = validate.productSlug('Vitamin D3');
        expect(result.isValid).toBe(true);
        expect(result.sanitized).toBe('vitamin-d3');
        expect(result.errors).toBeUndefined();
      });

      it('無効なslugを拒否する', () => {
        const result = validate.productSlug('');
        expect(result.isValid).toBe(false);
        expect(result.errors).toBeDefined();
      });
    });

    describe('validate.email', () => {
      it('有効なメールアドレスを受け入れる', () => {
        const result = validate.email('John@Example.COM');
        expect(result.isValid).toBe(true);
        expect(result.sanitized).toBe('john@example.com');
        expect(result.errors).toBeUndefined();
      });

      it('使い捨てメールアドレスを拒否する', () => {
        const result = validate.email('test@10minutemail.com');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Disposable email addresses are not allowed');
      });

      it('無効なメールアドレスを拒否する', () => {
        const result = validate.email('invalid-email');
        expect(result.isValid).toBe(false);
        expect(result.errors).toBeDefined();
      });
    });

    describe('validate.searchQuery', () => {
      it('有効な検索クエリを受け入れる', () => {
        const result = validate.searchQuery('vitamin d supplements');
        expect(result.isValid).toBe(true);
        expect(result.sanitized).toBe('vitamin d supplements');
        expect(result.errors).toBeUndefined();
      });

      it('悪意のあるコンテンツを拒否する', () => {
        const maliciousQueries = [
          '<script>alert("xss")</script>',
          'javascript:alert(1)',
          'onclick="alert(1)"',
          'data:text/html,<script>alert(1)</script>',
        ];

        maliciousQueries.forEach(query => {
          const result = validate.searchQuery(query);
          expect(result.isValid).toBe(false);
          expect(result.errors).toContain('Query contains potentially malicious content');
        });
      });

      it('空のクエリを拒否する', () => {
        const result = validate.searchQuery('');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Query cannot be empty');
      });

      it('長すぎるクエリを拒否する', () => {
        const longQuery = 'a'.repeat(250);
        const result = validate.searchQuery(longQuery);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Query is too long');
      });
    });
  });

  describe('Security Features', () => {
    it('ハニーポットフィールドでボットを検出する', () => {
      const botForm = {
        name: 'Bot',
        email: 'bot@example.com',
        subject: 'Spam',
        message: 'This is spam',
        honeypot: 'I am a bot',
      };

      const result = ContactFormSchema.safeParse(botForm);
      expect(result.success).toBe(false);
    });

    it('SQLインジェクション攻撃を防ぐ', () => {
      const maliciousInputs = [
        "'; DROP TABLE users; --",
        "1' OR '1'='1",
        "admin'/*",
      ];

      maliciousInputs.forEach(input => {
        const sanitized = sanitize.searchQuery(input);
        expect(sanitized).not.toContain("'");
        expect(sanitized).not.toContain('"');
      });
    });

    it('XSS攻撃を防ぐ', () => {
      const xssInputs = [
        '<script>alert("xss")</script>',
        '<img src="x" onerror="alert(1)">',
        'javascript:alert(1)',
      ];

      xssInputs.forEach(input => {
        const sanitized = sanitize.html(input);
        expect(sanitized).not.toContain('<script>');
        expect(sanitized).not.toContain('onerror=');
        expect(sanitized).not.toContain('javascript:');
      });
    });

    it('過度に長い入力を制限する', () => {
      const schemas = [
        { schema: ProductQuerySchema, field: 'slug', maxLength: 100 },
        { schema: SearchQuerySchema, field: 'q', maxLength: 200 },
        { schema: ContactFormSchema, field: 'message', maxLength: 2000 },
      ];

      schemas.forEach(({ schema, field, maxLength }) => {
        const longInput = 'a'.repeat(maxLength + 1);
        const testData = { [field]: longInput };
        
        const result = schema.safeParse(testData);
        expect(result.success).toBe(false);
      });
    });
  });
});