/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { PaginationQueries } from 'src/common/dto/pagination-query.dto';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { paginate } from 'src/common/pagination/paginate';

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  async findAll({ limit, page, search, sortedBy, orderBy }: PaginationQueries) {
    try {
      const perPage = Number(limit) || 10;
      const pageNumber = Number(page) || 1;
      const parseSearchParams = search?.split(';') || [];
      const whereClause: Prisma.OrganizationWhereInput = {};
      let orderByClause: Prisma.OrganizationOrderByWithRelationInput = {};

      if (parseSearchParams?.length > 0) {
        const organizationIdQuery = parseSearchParams.find((param) =>
          param.startsWith('organizationId:'),
        );

        if (organizationIdQuery) {
          // const id = organizationIdQuery.split(':')[1];
          // whereClause.organizationId = Number(id);
        }
      }

      if (sortedBy && orderBy) {
        orderByClause = { [orderBy]: sortedBy };
      }

      const result = await this.prisma.organization.findMany({
        where: whereClause,
        orderBy: orderByClause,
        take: perPage,
        skip: (pageNumber - 1) * perPage,
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

      const totalCount = await this.prisma.organization.count({
        where: whereClause,
      });
      const url = `/organization?search=${search}&limit=${limit}`;

      return {
        data: result,
        ...paginate(totalCount, page, limit, result.length, url),
      };
    } catch (error: any) {
      throw new InternalServerErrorException(
        error.message || 'An error occurred while fetching organizations.',
      );
    }
  }

  async findOne(id: number) {
    try {
      const organization = await this.prisma.organization.findUnique({
        where: { id },
        include: {
          branding: true,
          // paymentMethod: true,
          subscriptions: true,
        },
      });

      if (!organization) {
        throw new NotFoundException('Organization not found');
      }

      return organization;
    } catch (error: any) {
      throw new InternalServerErrorException(
        error.message || 'An error occurred while fetching organization.',
      );
    }
  }

  async update(id: number, updateOrganizationDto: UpdateOrganizationDto) {
    try {
      const result = await this.prisma.organization.update({
        where: {
          id,
        },
        data: {
          name: updateOrganizationDto.name,
          country: updateOrganizationDto.country,
        },
      });

      return result;
    } catch (error: any) {
      throw new InternalServerErrorException(
        error.message || 'An error occurred while fetching organization.',
      );
    }
  }
}
