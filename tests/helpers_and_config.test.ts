import { describe, it, expect } from 'vitest';
import { generateReference, formatDate, escapeHtml, formatStatus } from '../src/utils/helpers.js';
import { loadConfig } from '../src/config/index.js';

describe('Helper Utilities', () => {
  it('generates properly formatted reference strings', () => {
    const reqRef = generateReference('REQ');
    const tckRef = generateReference('TCK');
    const ordRef = generateReference('ORD');

    expect(reqRef).toMatch(/^REQ-\d{6}$/);
    expect(tckRef).toMatch(/^TCK-\d{6}$/);
    expect(ordRef).toMatch(/^ORD-\d{6}$/);
  });

  it('escapes HTML special characters for Telegram message safety', () => {
    const dangerous = '<script>alert("xss") & test</script>';
    const safe = escapeHtml(dangerous);
    expect(safe).toBe('&lt;script&gt;alert(&quot;xss&quot;) &amp; test&lt;/script&gt;');
  });

  it('formats status enum values into human readable titles', () => {
    expect(formatStatus('UNDER_REVIEW')).toBe('Under Review');
    expect(formatStatus('AWAITING_CUSTOMER')).toBe('Awaiting Customer');
    expect(formatStatus('IN_PROGRESS')).toBe('In Progress');
  });

  it('formats dates consistently', () => {
    const d = new Date('2026-05-15T12:00:00Z');
    const formatted = formatDate(d);
    expect(formatted).toContain('May 15, 2026');
    expect(formatted).toContain('UTC');
  });
});

describe('Configuration parsing', () => {
  it('parses comma-separated admin IDs correctly', () => {
    process.env.ADMIN_IDS = '123456789, 987654321, invalid, 112233';
    process.env.BOT_TOKEN = 'test_token_123';
    const cfg = loadConfig();

    expect(cfg.adminIds).toHaveLength(3);
    expect(cfg.adminIds[0]).toBe(123456789n);
    expect(cfg.adminIds[1]).toBe(987654321n);
    expect(cfg.adminIds[2]).toBe(112233n);
    expect(cfg.webhookSecret).toHaveLength(64); // sha256 hex
  });
});
