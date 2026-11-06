import { prisma } from '../database/index.js';
import { generateReference } from '../utils/helpers.js';
import { SupportTicket, TicketMessage, TicketStatus, Role } from '@prisma/client';

export interface CreateTicketDto {
  userId: string;
  platform: string;
  issueType: string;
  errorMessage?: string;
  startedAt?: string;
  screenshotFileId?: string;
}

export class TicketService {
  static async createTicket(data: CreateTicketDto): Promise<SupportTicket> {
    const reference = generateReference('TCK');

    return prisma.supportTicket.create({
      data: {
        reference,
        userId: data.userId,
        platform: data.platform,
        issueType: data.issueType,
        errorMessage: data.errorMessage,
        startedAt: data.startedAt,
        screenshotFileId: data.screenshotFileId,
        status: TicketStatus.OPEN,
      },
      include: {
        user: true,
      },
    });
  }

  static async getByReference(reference: string) {
    return prisma.supportTicket.findUnique({
      where: { reference },
      include: {
        user: true,
        messages: {
          include: { sender: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  static async getById(id: string): Promise<SupportTicket | null> {
    return prisma.supportTicket.findUnique({
      where: { id },
      include: {
        user: true,
        messages: {
          include: { sender: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  static async getActiveTicketForUser(userId: string): Promise<SupportTicket | null> {
    return prisma.supportTicket.findFirst({
      where: {
        userId,
        status: { in: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.AWAITING_CUSTOMER] },
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  static async addMessage(data: {
    ticketId: string;
    senderId: string;
    senderRole: Role;
    content?: string;
    mediaFileId?: string;
    mediaType?: string;
  }): Promise<TicketMessage> {
    const message = await prisma.ticketMessage.create({
      data: {
        ticketId: data.ticketId,
        senderId: data.senderId,
        senderRole: data.senderRole,
        content: data.content,
        mediaFileId: data.mediaFileId,
        mediaType: data.mediaType,
      },
    });

    // Update ticket status
    const newStatus = data.senderRole === Role.ADMIN ? TicketStatus.AWAITING_CUSTOMER : TicketStatus.IN_PROGRESS;
    await prisma.supportTicket.update({
      where: { id: data.ticketId },
      data: {
        status: newStatus,
        updatedAt: new Date(),
      },
    });

    return message;
  }

  static async updateStatus(ticketId: string, status: TicketStatus): Promise<SupportTicket> {
    return prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status },
      include: { user: true },
    });
  }

  static async getRecentTickets(limit = 20) {
    return prisma.supportTicket.findMany({
      orderBy: { updatedAt: 'desc' },
      take: limit,
      include: { user: true },
    });
  }
}
