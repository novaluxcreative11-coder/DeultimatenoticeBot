import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ServiceRequestService } from '../src/services/serviceRequestService.js';
import { OrderService } from '../src/services/orderService.js';
import { TicketService } from '../src/services/ticketService.js';
import { prisma } from '../src/database/index.js';

vi.mock('../src/database/index.js', () => {
  return {
    prisma: {
      serviceRequest: {
        create: vi.fn(),
        findUnique: vi.fn(),
      },
      order: {
        create: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      orderUpdate: {
        create: vi.fn(),
      },
      supportTicket: {
        create: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      ticketMessage: {
        create: vi.fn(),
      },
      $transaction: vi.fn(),
    },
  };
});

describe('ServiceRequestService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates service request with unique reference code', async () => {
    (prisma.serviceRequest.create as any).mockImplementation(({ data }: any) => {
      return Promise.resolve({
        id: 'req-uuid',
        ...data,
      });
    });

    const res = await ServiceRequestService.create({
      userId: 'user-uuid',
      customerName: 'Alex Doe',
      platform: 'Telegram Ads',
      serviceTitle: 'Telegram Ads Campaign Setup',
      objective: 'Channel Subscribers Growth',
      budgetRange: '$1,000 - $3,000',
      details: 'Targeting crypto and fintech channels',
    });

    expect(res.reference).toMatch(/^REQ-\d{6}$/);
    expect(res.customerName).toBe('Alex Doe');
    expect(res.status).toBe('SUBMITTED');
    expect(prisma.serviceRequest.create).toHaveBeenCalledOnce();
  });
});

describe('OrderService', () => {
  it('creates order and initial audit update log', async () => {
    (prisma.order.create as any).mockResolvedValue({
      id: 'order-123',
      reference: 'ORD-123456',
      userId: 'user-1',
      serviceTitle: 'TikTok Ads Campaign Setup',
      platform: 'TikTok Ads',
      status: 'PENDING',
    });
    (prisma.orderUpdate.create as any).mockResolvedValue({});

    const order = await OrderService.createOrder({
      userId: 'user-1',
      serviceTitle: 'TikTok Ads Campaign Setup',
      platform: 'TikTok Ads',
    });

    expect(order.id).toBe('order-123');
    expect(prisma.order.create).toHaveBeenCalled();
    expect(prisma.orderUpdate.create).toHaveBeenCalled();
  });
});
