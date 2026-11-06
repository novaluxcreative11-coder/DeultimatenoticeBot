import { createBot } from './bot/index.js';
import { createExpressApp } from './server.js';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { prisma } from './database/index.js';
import { TutorialService } from './services/tutorialService.js';

async function bootstrap() {
  logger.info('Starting DEULTIMATEADSOLUTION Telegram Support Bot...');

  // Check database connection and seed defaults if database is reachable
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');
    try {
      await TutorialService.seedDefaultTutorials();
    } catch (seedErr: any) {
      logger.warn({ err: seedErr?.message }, 'Could not seed tutorials (tables may be pending migration)');
    }
  } catch (err: any) {
    logger.warn({ err: err?.message }, 'Database connection deferred or pending initialization');
  }

  // Create Bot
  const bot = createBot();

  // Create Web Server
  const app = createExpressApp(bot);

  const server = app.listen(config.port, '0.0.0.0', async () => {
    logger.info(`Server listening on 0.0.0.0:${config.port}`);

    // If running on Render with external URL or production mode, configure webhook automatically
    if (config.renderExternalUrl && config.botToken) {
      const webhookUrl = `${config.renderExternalUrl.replace(/\/+$/, '')}${config.webhookPath}`;
      try {
        logger.info({ webhookUrl }, 'Registering Telegram Webhook with Render external URL');
        await bot.api.setWebhook(webhookUrl, {
          secret_token: config.webhookSecret,
          allowed_updates: ['message', 'callback_query'],
          drop_pending_updates: false,
        });
        logger.info('Telegram Webhook registered successfully');
      } catch (err: any) {
        logger.error({ err: err?.message }, 'Failed to automatically register Telegram webhook');
      }
    } else if (!config.renderExternalUrl && config.botToken && config.nodeEnv !== 'test') {
      // Local development fallback: Long Polling
      logger.info('RENDER_EXTERNAL_URL not set; starting bot in Long Polling mode for local testing');
      bot.start({
        onStart: (botInfo) => {
          logger.info({ username: botInfo.username }, 'Telegram Bot long polling started');
        },
      });
    }
  });

  // Graceful shutdown handling
  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutdown signal received. Closing gracefully...');
    server.close(async () => {
      logger.info('HTTP server closed');
      await prisma.$disconnect();
      logger.info('Database disconnected. Exiting process.');
      process.exit(0);
    });

    setTimeout(() => {
      logger.error('Graceful shutdown timed out, force exiting.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.fatal({ err }, 'Fatal error during application startup');
  process.exit(1);
});
