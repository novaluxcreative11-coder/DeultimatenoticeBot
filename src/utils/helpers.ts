import crypto from 'node:crypto';

/**
 * Generate a unique customer-friendly reference number
 * Example: REQ-748219, TCK-204851, ORD-918234
 */
export function generateReference(prefix: 'REQ' | 'TCK' | 'ORD'): string {
  const randomNum = crypto.randomInt(100000, 999999);
  return `${prefix}-${randomNum}`;
}

/**
 * Format a Date to a clean, readable UTC string
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(date) + ' UTC';
}

/**
 * Escape HTML special characters for safe Telegram HTML formatting
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Clean status string for human-readable presentation
 */
export function formatStatus(status: string): string {
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
