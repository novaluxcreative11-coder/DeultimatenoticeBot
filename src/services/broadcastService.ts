import { Bot } from 'grammy';
import { prisma } from '../database/index.js';
import { logger } from '../utils/logger.js';
import { UserService } from './userService.js';

export interface BroadcastOptions {
  text: string;
  photoFileId?: string;
  adminTelegramId: bigint;
}

export class BroadcastService {
  /**
   * Broadcast message safely with Telegram rate limit throttling (approx 25-30 msgs/second)
   */
  static async sendBroadcast(bot: Bot<any>, options: BroadcastOptions): Promise<{ sent: number; failed: number }> {
    const subscribers = await UserService.getSubscribers();
    let sent = 0;
    let failed = 0;

    const announcement = await prisma.announcement.create({
      data: {
        content: options.text,
        mediaFileId: options.photoFileId,
        sentByAdminId: options.adminTelegramId,
        totalSubscribers: subscribers.length,
      },
    });

    for (const sub of subscribers) {
      try {
        const targetChatId = Number(sub.telegramId);

        if (options.photoFileId) {
          await bot.api.sendPhoto(targetChatId, options.photoFileId, {
            caption: options.text,
            parse_mode: 'HTML',
          });
        } else {
          await bot.api.sendMessage(targetChatId, options.text, {
            parse_mode: 'HTML',
          });
        }
        sent++;
      } catch (err: any) {
        failed++;
        logger.warn({ err: err?.message, telegramId: sub.telegramId.toString() }, 'Failed to deliver broadcast to user');

        // If user blocked bot or deactivated account, mark unsubscribed
        if (err?.error_code === 403 || err?.description?.includes('bot was blocked')) {
          await UserService.setSubscription(sub.telegramId, false).catch(() => {});
        }
      }

      // 40ms delay to respect 30 messages/sec rate limit
      await new Promise((resolve) => setTimeout(resolve, 40));
    }

    await prisma.announcement.update({
      where: { id: announcement.id },
      data: {
        sentCount: sent,
        failedCount: failed,
      },
    });

    return { sent, failed };
  }
}
