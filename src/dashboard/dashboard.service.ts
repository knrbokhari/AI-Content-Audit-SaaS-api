/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async dashboardReport(organizationId: number) {
    try {
      const total_user = await this.prisma.user.count({
        where: {
          organizationId,
        },
      });
      const total_audit_score = await this.prisma.audit.aggregate({
        where: {
          organizationId,
        },
        _sum: {
          overallScore: true,
        },
      });
      const total_audit = await this.prisma.audit.count({
        where: {
          organizationId,
        },
      });

      return {
        total_user,
        total_audit,
        avg_audit_score:
          (total_audit_score._sum.overallScore || 0) / total_audit,
        total_audit_score: total_audit_score._sum.overallScore,
      };
    } catch (error: any) {
      throw new InternalServerErrorException(
        error.message || 'An error occurred while fetching.',
      );
    }
  }

  async recentAudit(organizationId: number) {
    try {
      const res = await this.prisma.audit.findMany({
        where: { organizationId },
        orderBy: {
          id: 'desc',
        },
        take: 4,
        select: {
          id: true,
          overallScore: true,
          seoScore: true,
          createdAt: true,
          url: true,
          createdBy: {
            select: {
              name: true,
            },
          },
        },
      });

      return res;
    } catch (error: any) {
      throw new InternalServerErrorException(
        error.message || 'An error occurred while fetching.',
      );
    }
  }

  async recentInvoice(organizationId: number) {
    try {
      const res = await this.prisma.invoice.findMany({
        where: {
          subscriptions: {
            organizationId,
          },
        },
        orderBy: {
          id: 'desc',
        },
        take: 5,
      });

      return res;
    } catch (error: any) {
      throw new InternalServerErrorException(
        error.message || 'An error occurred while fetching.',
      );
    }
  }

  // Admin services
  async recentOrganizations() {
    try {
      const res = await this.prisma.organization.findMany({
        orderBy: {
          id: 'desc',
        },
        take: 3,
        include: {
          _count: {
            select: {
              users: true,
              audits: true,
            },
          },
          branding: true,
          subscriptions: {
            select: {
              status: true,
              planName: true,
            },
          },
        },
      });

      return res;
    } catch (error: any) {
      throw new InternalServerErrorException(
        error.message || 'An error occurred while fetching.',
      );
    }
  }

  async recentPayments() {
    try {
      const res = await this.prisma.subscriptions.findMany({
        orderBy: {
          id: 'desc',
        },
        take: 3,
      });

      return res;
    } catch (error: any) {
      throw new InternalServerErrorException(
        error.message || 'An error occurred while fetching.',
      );
    }
  }

  async recentUserRegistrations() {
    try {
      const res = await this.prisma.user.findMany({
        orderBy: {
          id: 'desc',
        },
        take: 5,
        select: {
          name: true,
          email: true,
          phone: true,
          plan_type: true,
          role: {
            select: {
              name: true,
            },
          },
          organization: {
            select: {
              name: true,
            },
          },
          created_at: true,
        },
      });

      return res;
    } catch (error: any) {
      throw new InternalServerErrorException(
        error.message || 'An error occurred while fetching.',
      );
    }
  }

  async adminDashboardReport() {
    try {
      const total_user = await this.prisma.user.count();
      const total_organization = await this.prisma.organization.count();
      const total_revenue = await this.prisma.invoice.aggregate({
        _count: {
          amount: true,
        },
      });
      const total_audit = await this.prisma.audit.count();

      return {
        total_user,
        total_organization,
        total_revenue: total_revenue._count.amount,
        total_audit,
      };
    } catch (error: any) {
      throw new InternalServerErrorException(
        error.message || 'An error occurred while fetching.',
      );
    }
  }
}
