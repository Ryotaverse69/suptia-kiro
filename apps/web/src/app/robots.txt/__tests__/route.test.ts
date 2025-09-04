import { describe, it, expect } from 'vitest';
import { GET } from '../route';

describe('robots.txt route', () => {
  it('returns text with sitemap entry', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('User-agent: *');
    expect(text).toMatch(/Sitemap:\s*https?:\/\/[^\s]+\/sitemap\.xml/);
    expect(res.headers.get('Content-Type')).toContain('text/plain');
  });
});

