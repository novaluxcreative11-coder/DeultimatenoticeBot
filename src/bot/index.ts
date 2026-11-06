import { Bot, session } from 'grammy';
import { BotContext, SessionData } from '../types/context.js';
import { config } from '../config/index.js';
import { authMiddleware, deduplicateUpdateMiddleware } from './middleware/index.js';
import { registerBotHandlers } from './handlers/index.js';
import { registerAdminHandlers } from './handlers/admin.js';
import { logger } from '../utils/logger.js';

export function createBot(token?: string): Bot<BotContext> {
  const botToken = token || config.botToken;
  const bot = new Bot<BotContext>(botToken);

  // Session middleware
  bot.use(
    session({
      initial: (): SessionData => ({}),
    })
  );

  // Update deduplication
  bot.use(deduplicateUpdateMiddleware);

  // User authentication and registration
  bot.use(authMiddleware);

  // Register Handlers
  registerBotHandlers(bot);
  registerAdminHandlers(bot);

  // Global error handler
  bot.catch((err) => {
    logger.error({ err: err.error, ctx: err.ctx.update }, 'Error in Telegram bot handler');
  });

  return bot;
}
