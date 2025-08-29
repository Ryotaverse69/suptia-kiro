/**
 * Domain Whitelist Tests
 * LLMエージェント安全フレームワーク用ドメインホワイトリストのテスト
 * 要件3.2: ネットワークアクセス制限の検証
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DomainWhitelist, ALLOWED_DOMAINS, BLOCKED_DOMAINS } from '../domain-whitelist';

describe('DomainWhitelist', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  let infoSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    infoSpy.mockRestore();
  });

  describe('isDomainAllowed', () => {
    it('許可されたドメインを正しく識別する', () => {
      const allowedDomains = [
        'api.sanity.io',
        'cdn.sanity.io',
        'suptia.com',
        'www.suptia.com',
        'localhost',
        '127.0.0.1',
      ];

      allowedDomains.forEach(domain => {
        expect(DomainWhitelist.isDomainAllowed(domain)).toBe(true);
      });
    });

    it('ワイルドカードパターンを正しく処理する', () => {
      const wildcardDomains = [
        'test.sanity.io',
        'api.sanity.io',
        'subdomain.suptia.com',
        'api.suptia.com',
      ];

      wildcardDomains.forEach(domain => {
        expect(DomainWhitelist.isDomainAllowed(domain)).toBe(true);
      });
    });

    it('許可されていないドメインを拒否する', () => {
      const blockedDomains = [
        'google.com',
        'github.com',
        'malicious.com',
        'evil.org',
      ];

      blockedDomains.forEach(domain => {
        expect(DomainWhitelist.isDomainAllowed(domain)).toBe(false);
      });
    });

    it('URLからドメインを抽出して検証する', () => {
      expect(DomainWhitelist.isDomainAllowed('https://api.sanity.io/v1/data')).toBe(true);
      expect(DomainWhitelist.isDomainAllowed('http://localhost:3000/api')).toBe(true);
      expect(DomainWhitelist.isDomainAllowed('https://malicious.com/payload')).toBe(false);
    });
  });

  describe('isDomainBlocked', () => {
    it('明示的に禁止されたドメインを識別する', () => {
      const explicitlyBlocked = [
        'bit.ly',
        'tinyurl.com',
        'goo.gl',
        't.co',
      ];

      explicitlyBlocked.forEach(domain => {
        expect(DomainWhitelist.isDomainBlocked(domain)).toBe(true);
      });
    });

    it('禁止リストにないドメインは通す', () => {
      const notBlocked = [
        'sanity.io',
        'suptia.com',
        'localhost',
        'example.com',
      ];

      notBlocked.forEach(domain => {
        expect(DomainWhitelist.isDomainBlocked(domain)).toBe(false);
      });
    });
  });

  describe('validateNetworkAccess', () => {
    it('許可されたドメインへのアクセスを承認する', () => {
      const result = DomainWhitelist.validateNetworkAccess('https://api.sanity.io/v1/data');

      expect(result.isAllowed).toBe(true);
      expect(result.riskLevel).toBe('safe');
      expect(result.domain).toBe('api.sanity.io');
      expect(result.reason).toContain('許可されています');
    });

    it('明示的に禁止されたドメインへのアクセスを拒否する', () => {
      const result = DomainWhitelist.validateNetworkAccess('https://bit.ly/malicious');

      expect(result.isAllowed).toBe(false);
      expect(result.riskLevel).toBe('blocked');
      expect(result.domain).toBe('bit.ly');
      expect(result.reason).toContain('明示的に禁止されています');
    });

    it('許可リストにないドメインへのアクセスを拒否する', () => {
      const result = DomainWhitelist.validateNetworkAccess('https://unknown.com/api');

      expect(result.isAllowed).toBe(false);
      expect(result.riskLevel).toBe('suspicious');
      expect(result.domain).toBe('unknown.com');
      expect(result.reason).toContain('許可リストに含まれていません');
    });

    it('無効なURLを適切に処理する', () => {
      const result = DomainWhitelist.validateNetworkAccess('invalid-url');

      expect(result.isAllowed).toBe(false);
      expect(result.domain).toBe('invalid-url');
    });
  });

  describe('validateMultipleUrls', () => {
    it('複数のURLを一括検証する', () => {
      const urls = [
        'https://api.sanity.io/v1/data',
        'https://malicious.com/payload',
        'http://localhost:3000/api',
      ];

      const results = DomainWhitelist.validateMultipleUrls(urls);

      expect(results).toHaveLength(3);
      expect(results[0].isAllowed).toBe(true);
      expect(results[1].isAllowed).toBe(false);
      expect(results[2].isAllowed).toBe(true);
    });
  });

  describe('logDomainAccess', () => {
    it('ブロックされたドメインアクセスのログを出力する', () => {
      const url = 'https://malicious.com/payload';
      const result = DomainWhitelist.validateNetworkAccess(url);

      DomainWhitelist.logDomainAccess(url, result);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[SECURITY] Domain access blocked:',
        expect.objectContaining({
          url,
          domain: 'malicious.com',
          reason: expect.stringContaining('許可リストに含まれていません'),
          riskLevel: 'suspicious',
          timestamp: expect.any(String),
        })
      );
    });

    it('許可されたドメインアクセスのログを出力する', () => {
      const url = 'https://api.sanity.io/v1/data';
      const result = DomainWhitelist.validateNetworkAccess(url);

      DomainWhitelist.logDomainAccess(url, result);

      expect(infoSpy).toHaveBeenCalledWith(
        '[SECURITY] Domain access allowed:',
        expect.objectContaining({
          url,
          domain: 'api.sanity.io',
          timestamp: expect.any(String),
        })
      );
    });
  });

  describe('validateFetchRequest', () => {
    it('許可されたURLのフェッチリクエストを承認する', () => {
      const url = 'https://api.sanity.io/v1/data';
      const isAllowed = DomainWhitelist.validateFetchRequest(url);

      expect(isAllowed).toBe(true);
      expect(infoSpy).toHaveBeenCalled();
    });

    it('禁止されたURLのフェッチリクエストを拒否する', () => {
      const url = 'https://malicious.com/payload';
      const isAllowed = DomainWhitelist.validateFetchRequest(url);

      expect(isAllowed).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('getAllowedDomains', () => {
    it('許可されたドメインのリストを返す', () => {
      const domains = DomainWhitelist.getAllowedDomains();
      expect(domains).toBe(ALLOWED_DOMAINS);
      expect(domains).toContain('*.sanity.io');
      expect(domains).toContain('*.suptia.com');
    });
  });

  describe('getBlockedDomains', () => {
    it('禁止されたドメインのリストを返す', () => {
      const domains = DomainWhitelist.getBlockedDomains();
      expect(domains).toBe(BLOCKED_DOMAINS);
      expect(domains).toContain('bit.ly');
      expect(domains).toContain('tinyurl.com');
    });
  });
});