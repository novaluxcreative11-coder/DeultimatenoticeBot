import { prisma } from '../database/index.js';
import { generateReference } from '../utils/helpers.js';
import { ServiceRequest, ServiceRequestStatus } from '@prisma/client';

export interface CreateServiceRequestDto {
  userId: string;
  customerName: string;
  platform: string;
  serviceTitle: string;
  objective: string;
  budgetRange: string;
  details?: string;
}

export class ServiceRequestService {
  static async create(data: CreateServiceRequestDto): Promise<ServiceRequest> {
    const reference = generateReference('REQ');

    return prisma.serviceRequest.create({
      data: {
        reference,
        userId: data.userId,
        customerName: data.customerName,
        platform: data.platform,
        serviceTitle: data.serviceTitle,
        objective: data.objective,
        budgetRange: data.budgetRange,
        details: data.details,
        status: ServiceRequestStatus.SUBMITTED,
      },
    });
  }

  static async getByReference(reference: string) {
    return prisma.serviceRequest.findUnique({
      where: { reference },
      include: { user: true },
    });
  }

  static async getByUserId(userId: string): Promise<ServiceRequest[]> {
    return prisma.serviceRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getRecent(limit = 20) {
    return prisma.serviceRequest.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { user: true },
    });
  }

  static async updateStatus(id: string, status: ServiceRequestStatus, adminNotes?: string): Promise<ServiceRequest> {
    return prisma.serviceRequest.update({
      where: { id },
      data: {
        status,
        adminNotes: adminNotes ?? undefined,
      },
      include: { user: true },
    });
  }
}
