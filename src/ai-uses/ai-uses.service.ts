/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PaginationQueries } from 'src/common/dto/pagination-query.dto';
import { paginate } from 'src/common/pagination/paginate';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AiUsesService {
  constructor(private prisma: PrismaService) {}

  async findAll({ limit, page, search, sortedBy, orderBy }: PaginationQueries) {
    try {
      const perPage = Number(limit) || 10;
      const pageNumber = Number(page) || 1;

      const parseSearchParams = search?.split(';') || [];

      const whereClause: Prisma.AuditWhereInput = {};
      let orderByClause: Prisma.AuditOrderByWithRelationInput = {
        createdAt: 'desc',
      };

      const organizationIdQuery = parseSearchParams.find((param) =>
        param.startsWith('organizationId:'),
      );

      const dateFromQuery = parseSearchParams.find((param) =>
        param.startsWith('dateFrom:'),
      );
      const dateToQuery = parseSearchParams.find((param) =>
        param.startsWith('dateTo:'),
      );

      if (organizationIdQuery) {
        const id = organizationIdQuery.split(':')[1];
        whereClause.organizationId = Number(id);
      }

      /**
       * Date range filter
       */
      if (dateFromQuery || dateToQuery) {
        whereClause.createdAt = {};

        if (dateFromQuery) {
          const dateFrom = dateFromQuery.split(':')[1];
          whereClause.createdAt.gte = new Date(dateFrom);
        }

        if (dateToQuery) {
          const dateTo = dateToQuery.split(':')[1];
          whereClause.createdAt.lte = new Date(dateTo);
        }
      }

      if (sortedBy && orderBy) {
        orderByClause = {
          [orderBy]: sortedBy,
        };
      }

      /**
       * Overall audit stats
       */
      const [auditAggregate, organizationsCount] = await Promise.all([
        this.prisma.audit.aggregate({
          where: whereClause,
          _count: {
            id: true,
          },
          _sum: {
            aiTokensUsed: true,
          },
          _avg: {
            aiTokensUsed: true,
          },
        }),

        this.prisma.audit.groupBy({
          by: ['organizationId'],
          where: whereClause,
          _count: {
            id: true,
          },
          _sum: {
            aiTokensUsed: true,
          },
          _avg: {
            aiTokensUsed: true,
          },
          orderBy: {
            _sum: {
              aiTokensUsed: 'desc',
            },
          },
        }),
      ]);

      /**
       * Paginated organizations
       */
      const paginatedOrganizations = organizationsCount.slice(
        (pageNumber - 1) * perPage,
        pageNumber * perPage,
      );

      const organizationIds = paginatedOrganizations.map(
        (item) => item.organizationId,
      );

      const organizations = await this.prisma.organization.findMany({
        where: {
          id: {
            in: organizationIds,
          },
        },
        select: {
          id: true,
          name: true,
        },
      });

      const organizationMap = new Map(
        organizations.map((org) => [org.id, org]),
      );

      const formattedOrganizations = paginatedOrganizations.map((item) => ({
        organizationId: item.organizationId,
        organizationName:
          organizationMap.get(item.organizationId)?.name || null,
        auditCount: item._count.id,
        tokenUsage: item._sum.aiTokensUsed || 0,
        averageTokens: Math.round(item._avg.aiTokensUsed || 0),
      }));

      /**
       * Top 3 organizations
       */
      const top3OrganizationStats = organizationsCount.slice(0, 3);

      const top3Ids = top3OrganizationStats.map((item) => item.organizationId);

      const top3OrganizationsData = await this.prisma.organization.findMany({
        where: {
          id: {
            in: top3Ids,
          },
        },
        select: {
          id: true,
          name: true,
        },
      });

      const top3Map = new Map(
        top3OrganizationsData.map((org) => [org.id, org]),
      );

      const top3Organizations = top3OrganizationStats.map((item) => ({
        organizationId: item.organizationId,
        organizationName: top3Map.get(item.organizationId)?.name || null,
        auditCount: item._count.id,
        tokenUsage: item._sum.aiTokensUsed || 0,
      }));

      return {
        organizations: formattedOrganizations,

        audits: {
          totalAudits: auditAggregate._count.id,
          tokenUsageCount: auditAggregate._sum.aiTokensUsed || 0,
          avgTokenUsage: Math.round(auditAggregate._avg.aiTokensUsed || 0),
        },

        top3Organizations,

        meta: {
          page: pageNumber,
          limit: perPage,
          totalOrganizations: organizationsCount.length,
        },
      };
    } catch (error: any) {
      throw new InternalServerErrorException(
        error.message || 'An error occurred while fetching ai uses.',
      );
    }
  }

  async findOne(id: number) {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found.');
    }

    const [usage, tokenUsageCount, recentAudits] = await Promise.all([
      this.prisma.audit.aggregate({
        where: {
          organizationId: id,
        },
        _count: {
          id: true,
        },
        _sum: {
          aiTokensUsed: true,
        },
        _avg: {
          aiTokensUsed: true,
        },
      }),

      this.prisma.audit.count({
        where: {
          organizationId: id,
          aiTokensUsed: {
            gt: 0,
          },
        },
      }),

      this.prisma.audit.findMany({
        where: {
          organizationId: id,
        },
        select: {
          id: true,
          title: true,
          url: true,
          status: true,
          aiTokensUsed: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      }),
    ]);

    return {
      organization,

      usage: {
        totalAudits: usage._count.id,
        tokenUsageCount,
        totalTokens: usage._sum.aiTokensUsed || 0,
        averageTokens: Math.round(usage._avg.aiTokensUsed || 0),
      },

      recentAudits,
    };
  }
}
