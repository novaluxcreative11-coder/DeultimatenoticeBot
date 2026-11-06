import { prisma } from '../database/index.js';
import { generateReference } from '../utils/helpers.js';
import { Order, OrderStatus, OrderUpdate } from '@prisma/client';

export interface CreateOrderDto {
  userId: string;
  serviceRequestId?: string;
  serviceTitle: string;
  platform: string;
  notes?: string;
}

export class OrderService {
  static async createOrder(data: CreateOrderDto): Promise<Order> {
    const reference = generateReference('ORD');

    const order = await prisma.order.create({
      data: {
        reference,
        userId: data.userId,
        serviceRequestId: data.serviceRequestId,
        serviceTitle: data.serviceTitle,
        platform: data.platform,
        status: OrderStatus.PENDING,
        notes: data.notes || 'Order received and waiting for team review.',
      },
      include: {
        user: true,
      },
    });

    await prisma.orderUpdate.create({
      data: {
        orderId: order.id,
        previousStatus: OrderStatus.PENDING,
        newStatus: OrderStatus.PENDING,
        adminNotes: data.notes || 'Order created.',
      },
    });

    return order;
  }

  static async getByReference(reference: string) {
    return prisma.order.findUnique({
      where: { reference },
      include: {
        user: true,
        updates: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  static async getOrdersByUserId(userId: string): Promise<Order[]> {
    return prisma.order.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        updates: {
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
      },
    });
  }

  static async updateOrderStatus(data: {
    orderId: string;
    newStatus: OrderStatus;
    adminNotes?: string;
    adminTelegramId?: bigint;
  }): Promise<{ order: Order; update: OrderUpdate }> {
    const currentOrder = await prisma.order.findUniqueOrThrow({
      where: { id: data.orderId },
    });

    const [order, update] = await prisma.$transaction([
      prisma.order.update({
        where: { id: data.orderId },
        data: {
          status: data.newStatus,
          notes: data.adminNotes ?? currentOrder.notes,
          updatedAt: new Date(),
        },
        include: { user: true },
      }),
      prisma.orderUpdate.create({
        data: {
          orderId: data.orderId,
          previousStatus: currentOrder.status,
          newStatus: data.newStatus,
          adminNotes: data.adminNotes,
          updatedByAdminId: data.adminTelegramId,
        },
      }),
    ]);

    return { order, update };
  }

  static async getRecentOrders(limit = 20) {
    return prisma.order.findMany({
      orderBy: { updatedAt: 'desc' },
      take: limit,
      include: { user: true },
    });
  }
}
