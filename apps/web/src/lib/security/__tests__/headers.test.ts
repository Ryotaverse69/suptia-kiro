import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  generateCSP,
  generateDevCSP,
  getSecurityHeaders,
  applySecurityHeaders,
  isAllowedDomain,
  sanitizeExternalUrl,
} from '../headers';

describe('Security Headers', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  describe('generateCSP', () => {
    it('本番環境用の厳格なCSPを生成する', () => {
      const csp = generateCSP();
      
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("script-src 'self'");
      expect(csp).toContain("style-src 'self' 'unsafe-inline'");
      expect(csp).toContain("img-src 'self' https://cdn.sanity.io data:");
      expect(csp).toContain("connect-src 'self' https://*.sanity.io");
      expect(csp).toContain("object-src 'none'");
      expect(csp).toContain("frame-ancestors 'none'");
      expect(csp).toContain("upgrade-insecure-requests");
    });

    it('nonceが提供された場合はscript-srcに含める', () => {
      const nonce = 'test-nonce-123';
      const csp = generateCSP(nonce);
      
      expect(csp).toContain(`script-src 'self' 'nonce-${nonce}'`);
    });

    it('unsafe-inlineを含まない（セキュリティ強化）', () => {
      const csp = generateCSP();
      
      expect(csp).not.toContain("script-src 'self' 'unsafe-inline'");
      expect(csp).not.toContain("'unsafe-eval'");
    });
  });

  describe('generateDevCSP', () => {
    it('開発環境用の緩いCSPを生成する', () => {
      const csp = generateDevCSP();
      
      expect(csp).toContain("script-src 'self' 'unsafe-eval' 'unsafe-inline'");
      expect(csp).toContain("connect-src 'self' https://*.sanity.io ws: wss:");
      expect(csp).toContain("img-src 'self' https://cdn.sanity.io data: blob:");
    });

    it('HMR用のWebSocket接続を許可する', () => {
      const csp = generateDevCSP();
      
      expect(csp).toContain("ws: wss:");
    });
  });

  describe('getSecurityHeaders', () => {
    it('標準的なセキュリティヘッダーを返す', () => {
      const headers = getSecurityHeaders();
      
      expect(headers['Strict-Transport-Security']).toBe('max-age=31536000; includeSubDomains');
      expect(headers['X-Content-Type-Options']).toBe('nosniff');
      expect(headers['X-Frame-Options']).toBe('DENY');
      expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
      expect(headers['Permissions-Policy']).toContain('camera=()');
      expect(headers['X-DNS-Prefetch-Control']).toBe('on');
    });

    it('すべての必要なセキュリティヘッダーが含まれる', () => {
      const headers = getSecurityHeaders();
      const requiredHeaders = [
        'Strict-Transport-Security',
        'X-Content-Type-Options',
        'X-Frame-Options',
        'Referrer-Policy',
        'Permissions-Policy',
        'X-DNS-Prefetch-Control'
      ];

      requiredHeaders.forEach(header => {
        expect(headers[header as keyof typeof headers]).toBeDefined();
      });
    });
  });

  describe('applySecurityHeaders', () => {
    it('本番環境でセキュリティヘッダーを適用する', () => {
      process.env.NODE_ENV = 'production';
      const response = new Response('test');
      const nonce = 'test-nonce';
      
      applySecurityHeaders(response, nonce);
      
      expect(response.headers.get('Content-Security-Policy')).toContain("script-src 'self'");
      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    });

    it('開発環境で開発用CSPを適用する', () => {
      process.env.NODE_ENV = 'development';
      const response = new Response('test');
      
      applySecurityHeaders(response);
      
      expect(response.headers.get('Content-Security-Policy')).toContain("'unsafe-eval'");
      expect(response.headers.get('Content-Security-Policy')).toContain("ws: wss:");
    });
  });

  describe('isAllowedDomain', () => {
    it('許可されたドメインを正しく識別する', () => {
      const allowedUrls = [
        'https://cdn.sanity.io/images/test.jpg',
        'https://suptia.com/page',
        'https://www.suptia.com/page',
        'https://subdomain.suptia.com/api'
      ];

      allowedUrls.forEach(url => {
        expect(isAllowedDomain(url)).toBe(true);
      });
    });

    it('許可されていないドメインを拒否する', () => {
      const disallowedUrls = [
        'https://evil.com/script.js',
        'https://malicious-suptia.com/page',
        'https://suptia.com.evil.com/page',
        'http://random-site.org/image.jpg'
      ];

      disallowedUrls.forEach(url => {
        expect(isAllowedDomain(url)).toBe(false);
      });
    });

    it('無効なURLを適切に処理する', () => {
      const invalidUrls = [
        'not-a-url',
        '',
        'javascript:alert(1)',
        'data:text/html,<script>alert(1)</script>'
      ];

      invalidUrls.forEach(url => {
        expect(isAllowedDomain(url)).toBe(false);
      });
    });
  });

  describe('sanitizeExternalUrl', () => {
    it('許可されたHTTPSのURLをそのまま返す', () => {
      const url = 'https://cdn.sanity.io/images/test.jpg';
      expect(sanitizeExternalUrl(url)).toBe(url);
    });

    it('許可されたHTTPのURLをHTTPSに変換する', () => {
      const httpUrl = 'http://cdn.sanity.io/images/test.jpg';
      const expectedHttpsUrl = 'https://cdn.sanity.io/images/test.jpg';
      
      expect(sanitizeExternalUrl(httpUrl)).toBe(expectedHttpsUrl);
    });

    it('localhostのHTTPを許可する', () => {
      const localhostUrl = 'http://localhost:3000/api/test';
      expect(sanitizeExternalUrl(localhostUrl)).toBe(localhostUrl);
    });

    it('許可されていないドメインに対してnullを返す', () => {
      const disallowedUrl = 'https://evil.com/script.js';
      expect(sanitizeExternalUrl(disallowedUrl)).toBeNull();
    });

    it('無効なURLに対してnullを返す', () => {
      const invalidUrl = 'not-a-valid-url';
      expect(sanitizeExternalUrl(invalidUrl)).toBeNull();
    });
  });

  describe('セキュリティ要件の検証', () => {
    it('CSPでunsafe-inlineスクリプトを禁止する', () => {
      const csp = generateCSP();
      expect(csp).not.toContain("script-src 'self' 'unsafe-inline'");
    });

    it('フレーム埋め込みを完全に禁止する', () => {
      const headers = getSecurityHeaders();
      expect(headers['X-Frame-Options']).toBe('DENY');
      
      const csp = generateCSP();
      expect(csp).toContain("frame-ancestors 'none'");
    });

    it('HTTPS強制を設定する', () => {
      const csp = generateCSP();
      expect(csp).toContain('upgrade-insecure-requests');
      
      const headers = getSecurityHeaders();
      expect(headers['Strict-Transport-Security']).toContain('max-age=31536000');
    });

    it('コンテンツタイプスニッフィングを防止する', () => {
      const headers = getSecurityHeaders();
      expect(headers['X-Content-Type-Options']).toBe('nosniff');
    });

    it('プライバシー侵害機能を無効化する', () => {
      const headers = getSecurityHeaders();
      expect(headers['Permissions-Policy']).toContain('interest-cohort=()');
      expect(headers['Permissions-Policy']).toContain('camera=()');
      expect(headers['Permissions-Policy']).toContain('microphone=()');
    });
  });
});