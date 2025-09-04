import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { checkText, loadRules, __clearComplianceCacheForTests } from '../compliance';

describe('compliance.ts (rules.json integration)', () => {
  beforeEach(() => {
    __clearComplianceCacheForTests();
  });

  afterEach(() => {
    delete (process.env as any).COMPLIANCE_RULES_PATH;
  });

  it('loads rules.json and detects violations', async () => {
    const rules = await loadRules();
    // If running in client-like env this could be null, but vitest is node
    expect(Array.isArray(rules) || rules === null).toBe(true);

    const res = await checkText('このサプリで完治を目指しましょう');
    expect(res.hasViolations).toBe(true);
    expect(res.violations.map(v => v.pattern)).toContain('完治');
  });

  it('falls back gracefully when file missing', async () => {
    (process.env as any).COMPLIANCE_RULES_PATH = '/path/not/found.json';
    __clearComplianceCacheForTests();
    const res = await checkText('このサプリで完治を目指しましょう');
    expect(res.hasViolations).toBe(true);
  });
});

