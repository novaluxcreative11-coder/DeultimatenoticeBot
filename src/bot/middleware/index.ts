import { NextFunction } from 'grammy';
import { BotContext } from '../../types/context.js';
import { UserService } from '../../services/userService.js';
import { config } from '../../config/index.js';
import { logger } from '../../utils/logger.js';
import { prisma } from '../../database/index.js';

/**
 * Middleware: Register / upsert user in database and attach dbUser and isAdmin flag to context
 */
export async function authMiddleware(ctx: BotContext, next: NextFunction): Promise<void> {
  const from = ctx.from;
  if (!from) {
    return next();
  }

  const telegramId = BigInt(from.id);
  const isAdmin = config.adminIds.includes(telegramId);
  ctx.isAdmin = isAdmin;

  try {
    const user = await UserService.upsertUser({
      telegramId,
      username: from.username || null,
      firstName: from.first_name || null,
      lastName: from.last_name || null,
    });
    ctx.dbUser = user;
  } catch (err: any) {
    logger.error({ err: err?.message, userId: from.id }, 'Error updating user in authMiddleware');
  }

  return next();
}

/**
 * Guard middleware for Admin-only routes
 */
export async function adminGuard(ctx: BotContext, next: NextFunction): Promise<void> {
  if (!ctx.isAdmin) {
    await ctx.reply('⛔ <b>Access Denied</b>\n\nYou are not authorized to access administrator commands.', {
      parse_mode: 'HTML',
    });
    return;
  }
  return next();
}

/**
 * Middleware: Deduplicate Telegram webhook updates to prevent processing twice
 */
export async function deduplicateUpdateMiddleware(ctx: BotContext, next: NextFunction): Promise<void> {
  const updateId = ctx.update?.update_id;
  if (!updateId) return next();

  try {
    const existing = await prisma.processedUpdate.findUnique({
      where: { updateId: BigInt(updateId) },
    });

    if (existing) {
      logger.warn({ updateId }, 'Duplicate Telegram update skipped');
      return;
    }

    await prisma.processedUpdate.create({
      data: { updateId: BigInt(updateId) },
    });
  } catch (err) {
    // If update already exists or database throws unique violation, ignore update
    logger.warn({ updateId, err }, 'Skipped update on unique constraint');
    return;
  }

  return next();
}
