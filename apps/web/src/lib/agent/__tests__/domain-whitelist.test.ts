import { describe, it, expect } from 'vitest';
import { DomainWhitelist } from '../../lib/agent/domain-whitelist';

describe('DomainWhitelist', () => {
  it('allows sanity domain', () => {
    const r = DomainWhitelist.validateNetworkAccess('https://cdn.sanity.io/images/...');
    expect(r.isAllowed).toBeTruthy();
  });

  it('blocks common shortener', () => {
    const r = DomainWhitelist.validateNetworkAccess('https://bit.ly/abc');
    expect(r.isAllowed).toBeFalsy();
    expect(r.riskLevel).toBe('blocked');
  });

  it('flags unknown domain as suspicious', () => {
    const r = DomainWhitelist.validateNetworkAccess('https://unknown.example.com');
    expect(r.isAllowed).toBeFalsy();
    expect(r.riskLevel).toBe('suspicious');
  });
});

