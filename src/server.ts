import express, { Request, Response, NextFunction } from 'express';
import { webhookCallback } from 'grammy';
import { Bot } from 'grammy';
import { BotContext } from './types/context.js';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { prisma } from './database/index.js';

export function createExpressApp(bot: Bot<BotContext>): express.Express {
  const app = express();

  // Basic health-check endpoint
  app.get('/health', async (_req: Request, res: Response) => {
    let dbStatus = 'ok';
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'disconnected';
    }

    res.status(200).json({
      status: 'healthy',
      service: 'DEULTIMATEADSOLUTION Telegram Client Support Bot',
      version: '1.0.0',
      database: dbStatus,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  // Root landing endpoint
  app.get('/', (_req: Request, res: Response) => {
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>DEULTIMATEADSOLUTION Bot Server</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; text-align: center; padding: 50px; }
            h1 { color: #38bdf8; }
            .card { background: #1e293b; padding: 30px; border-radius: 12px; display: inline-block; max-width: 500px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>DEULTIMATEADSOLUTION</h1>
            <p>Smart Advertising. Better Reach. Real Growth.</p>
            <p>Telegram Support Bot &amp; Webhook Service is active.</p>
          </div>
        </body>
      </html>
    `);
  });

  // Telegram webhook route
  if (config.botToken) {
    app.use(
      express.json()
    );

    app.use(
      config.webhookPath,
      webhookCallback(bot, 'express', {
        secretToken: config.webhookSecret,
      })
    );
  }

  return app;
}
