/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from 'src/generated/prisma/client';

@Injectable()
export class PermissionService {
  constructor(private prisma: PrismaService) {}
  async create(createPermissionDto: CreatePermissionDto) {
    try {
      const permission = await this.prisma.permission.findFirst({
        where: {
          roleId: createPermissionDto.roleId,
          resourceId: createPermissionDto.resourceId,
          action: createPermissionDto.action,
        },
      });

      if (permission) throw new BadRequestException('Permission Already Exist');
      const result = await this.prisma.permission.create({
        data: {
          role: {
            connect: {
              id: createPermissionDto.roleId,
            },
          },
          resource: {
            connect: {
              id: createPermissionDto.resourceId,
            },
          },
          action: createPermissionDto.action,
        },
      });
      return result;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Creating  Error');
    }
  }
  async findAll({ limit, page, search, sortedBy, orderBy }: any) {
    try {
      const perPage = Number(limit) || 20;
      const pageNumber = Number(page) || 1;
      const parseSearchParams = search?.split(';') || [];

      const whereClause: Prisma.PermissionWhereInput = {};
      if (parseSearchParams?.length > 0) {
        const nameQuery = parseSearchParams.find((param) =>
          param.startsWith('name:'),
        );

        const roleQuery = parseSearchParams.find((param) =>
          param.startsWith('role.slug:'),
        );

        const resourceQuery = parseSearchParams.find((param) =>
          param.startsWith('resource:'),
        );

        const actionQuery = parseSearchParams.find((param) =>
          param.startsWith('action:'),
        );

        if (nameQuery) {
          const name = nameQuery.split(':')[1];
          whereClause.resource = {
            name: {
              startsWith: name,
              mode: 'insensitive',
            },
          };
        }

        if (roleQuery) {
          const role = roleQuery.split(':')[1];
          whereClause.role = {
            slug: role,
          };
        }

        if (resourceQuery) {
          const resource = resourceQuery.split(':')[1];
          whereClause.resource = {
            slug: resource,
          };
        }

        if (actionQuery) {
          const action = actionQuery.split(':')[1];
          whereClause.action = action;
        }
      }
      const resources = await this.prisma.permission.findMany({
        where: whereClause,
        take: perPage,
        skip: (pageNumber - 1) * perPage,
        include: {
          resource: true,
          role: true,
        },
      });

      const totalCount = await this.prisma.permission.count({
        where: whereClause,
      });

      const url = `/permission?search=${search}&limit=${limit}`;
      return {
        data: resources,
        // ...paginate(totalCount, page, limit, resources.length, url),
      };
    } catch (error) {
      throw new InternalServerErrorException('Fetching  Error');
    }
  }

  async findOne(id: number) {
    try {
      const isPermission = await this.prisma.permission.findFirst({
        where: {
          id,
        },
      });

      if (isPermission) throw new BadRequestException('Permission Not Found');

      const permission = await this.prisma.permission.findUnique({
        where: {
          id: id,
        },
        include: {
          resource: true,
          role: true,
        },
      });
      return permission;
    } catch (error) {
      throw new InternalServerErrorException('Fetching  Error');
    }
  }

  async update(id: number, updatePermissionDto: UpdatePermissionDto) {
    try {
      const isPermission = await this.prisma.permission.findFirst({
        where: {
          id,
        },
      });

      if (isPermission) throw new BadRequestException('Permission Not Found');

      const result = await this.prisma.permission.update({
        where: {
          id,
        },
        data: {
          role: {
            connect: {
              id: updatePermissionDto.roleId,
            },
          },
          resource: {
            connect: {
              id: updatePermissionDto.resourceId,
            },
          },
          action: updatePermissionDto.action,
        },
      });
      return result;
    } catch (error) {
      throw new InternalServerErrorException('Updating  Error');
    }
  }

  async remove(id: number) {
    try {
      const isPermission = await this.prisma.permission.findFirst({
        where: {
          id,
        },
      });

      if (isPermission) throw new BadRequestException('Permission Not Found');

      await this.prisma.permission.delete({
        where: {
          id,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException('Deleting  Error');
    }
  }
}
