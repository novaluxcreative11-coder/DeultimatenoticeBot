import crypto from 'node:crypto';
import dotenv from 'dotenv';

dotenv.config();

export interface AppConfig {
  botToken: string;
  adminIds: bigint[];
  port: number;
  nodeEnv: string;
  databaseUrl: string;
  renderExternalUrl?: string;
  webhookPath: string;
  webhookSecret: string;
  isProduction: boolean;
}

function parseAdminIds(raw?: string): bigint[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id.length > 0)
    .map((id) => {
      try {
        return BigInt(id);
      } catch {
        return null;
      }
    })
    .filter((id): id is bigint => id !== null);
}

function deriveWebhookSecret(botToken: string): string {
  // Deterministic secret derived safely from the BOT_TOKEN
  return crypto.createHash('sha256').update(`webhook_secret_${botToken}`).digest('hex');
}

export function loadConfig(): AppConfig {
  const botToken = process.env.BOT_TOKEN || '';
  const adminIds = parseAdminIds(process.env.ADMIN_IDS);
  const port = parseInt(process.env.PORT || '3000', 10);
  const nodeEnv = process.env.NODE_ENV || 'production';
  const databaseUrl = process.env.DATABASE_URL || '';
  let renderExternalUrl = process.env.RENDER_EXTERNAL_URL?.trim();
  if (!renderExternalUrl && process.env.RENDER_EXTERNAL_HOSTNAME) {
    renderExternalUrl = `https://${process.env.RENDER_EXTERNAL_HOSTNAME.trim()}`;
  }
  const webhookPath = process.env.WEBHOOK_PATH || '/telegram-webhook';
  const webhookSecret = process.env.WEBHOOK_SECRET || (botToken ? deriveWebhookSecret(botToken) : 'default_secret');

  const isProduction = nodeEnv === 'production' || !!renderExternalUrl;

  return {
    botToken,
    adminIds,
    port,
    nodeEnv,
    databaseUrl,
    renderExternalUrl,
    webhookPath,
    webhookSecret,
    isProduction,
  };
}

export const config = loadConfig();
