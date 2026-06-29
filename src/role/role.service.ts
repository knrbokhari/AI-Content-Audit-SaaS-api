/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from 'src/generated/prisma/client';

@Injectable()
export class RoleService {
  constructor(private prisma: PrismaService) {}

  async create(createRoleDto: CreateRoleDto) {
    try {
      const slug = this.prisma.toSnakeCase(createRoleDto.name);

      const role = await this.prisma.role.findUnique({
        where: { slug: slug },
      });
      if (role) throw new BadRequestException('Role Already Exist');
      const result = await this.prisma.role.create({
        data: {
          name: createRoleDto.name,
          slug: slug,
          isSystem: createRoleDto.isSystem,
        },
      });
      return result;
    } catch (error) {
      throw new InternalServerErrorException('Creating  Error');
    }
  }

  async findAll({ limit, page, search, sortedBy, orderBy }: any) {
    try {
      const perPage = Number(limit) || 20;
      const pageNumber = Number(page) || 1;
      const parseSearchParams: any[] = search?.split(';') || [];

      const whereClause: Prisma.RoleWhereInput = {};
      const orderByClause: any = {};

      if (parseSearchParams?.length > 0) {
        const nameQuery = parseSearchParams.find((param) =>
          param.startsWith('name:'),
        );

        if (nameQuery) {
          const name = nameQuery.split(':')[1];
          whereClause.name = {
            startsWith: name,
            mode: 'insensitive',
            // contains: name,
          };
        }
      }

      const result: any = await this.prisma.role.findMany({
        where: whereClause,
        orderBy: orderByClause,
        take: perPage * 1,
        skip: (pageNumber - 1) * perPage,
      });

      const totalCount = await this.prisma.role.count({
        where: whereClause,
      });

      const url = `/role?search=${search}&limit=${limit}`;
      return {
        data: result,
        // ...paginate(totalCount, page, limit, result.length, url),
      };
    } catch (error) {
      throw new InternalServerErrorException('Fetching  Error');
    }
  }

  async findOne(id: number) {
    try {
      const role = await this.prisma.role.findUnique({
        where: { id },
      });
      if (!role) throw new BadRequestException('Role not found');
      return role;
    } catch (error) {
      throw new InternalServerErrorException('Fetching  Error');
    }
  }

  async update(id: number, updateRoleDto: UpdateRoleDto) {
    try {
      const role = await this.prisma.role.findUnique({
        where: { id },
      });
      if (!role) throw new BadRequestException('Role not found');

      const slug = updateRoleDto.name
        ? this.prisma.toSnakeCase(updateRoleDto.name)
        : role.slug;

      const result = await this.prisma.role.update({
        where: { id },
        data: {
          name: updateRoleDto.name,
          slug,
          isSystem: updateRoleDto.isSystem,
        },
      });

      return result;
    } catch (error) {
      throw new InternalServerErrorException('Updating  Error');
    }
  }

  async remove(id: number) {
    try {
      const role = await this.prisma.role.findUnique({
        where: { id },
      });
      if (!role) throw new BadRequestException('Role not found');

      await this.prisma.role.delete({
        where: { id },
      });
    } catch (error) {
      throw new InternalServerErrorException('Deleting  Error');
    }
  }
}
