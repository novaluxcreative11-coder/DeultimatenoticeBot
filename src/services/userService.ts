import { prisma } from '../database/index.js';
import { Role, User } from '@prisma/client';
import { config } from '../config/index.js';

export class UserService {
  static async upsertUser(data: {
    telegramId: bigint;
    username?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  }): Promise<User> {
    const isAdmin = config.adminIds.includes(data.telegramId);
    const role: Role = isAdmin ? Role.ADMIN : Role.CUSTOMER;

    return prisma.user.upsert({
      where: { telegramId: data.telegramId },
      update: {
        username: data.username,
        firstName: data.firstName,
        lastName: data.lastName,
        role: isAdmin ? Role.ADMIN : undefined,
      },
      create: {
        telegramId: data.telegramId,
        username: data.username,
        firstName: data.firstName,
        lastName: data.lastName,
        role,
        isSubscribed: true,
      },
    });
  }

  static async findByTelegramId(telegramId: bigint): Promise<User | null> {
    return prisma.user.findUnique({
      where: { telegramId },
    });
  }

  static async setSubscription(telegramId: bigint, isSubscribed: boolean): Promise<User> {
    return prisma.user.update({
      where: { telegramId },
      data: { isSubscribed },
    });
  }

  static async getSubscribers(): Promise<User[]> {
    return prisma.user.findMany({
      where: { isSubscribed: true },
    });
  }

  static async getAllUsers(limit = 50): Promise<User[]> {
    return prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  static async getStatistics() {
    const [totalUsers, totalSubscribers, totalRequests, totalTickets, totalOrders] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isSubscribed: true } }),
      prisma.serviceRequest.count(),
      prisma.supportTicket.count(),
      prisma.order.count(),
    ]);

    const activeTickets = await prisma.supportTicket.count({
      where: { status: { in: ['OPEN', 'IN_PROGRESS', 'AWAITING_CUSTOMER'] } },
    });

    const activeOrders = await prisma.order.count({
      where: { status: { in: ['PENDING', 'UNDER_REVIEW', 'IN_PROGRESS', 'AWAITING_CUSTOMER'] } },
    });

    return {
      totalUsers,
      totalSubscribers,
      totalRequests,
      totalTickets,
      activeTickets,
      totalOrders,
      activeOrders,
    };
  }
}
