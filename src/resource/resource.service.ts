/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from 'src/generated/prisma/client';

@Injectable()
export class ResourceService {
  constructor(private prisma: PrismaService) {}

  async create(createResourceDto: CreateResourceDto) {
    try {
      const slug = this.prisma.toSnakeCase(createResourceDto.name);

      const resource = await this.prisma.resource.findUnique({
        where: { slug },
      });
      if (resource) throw new BadRequestException('Resource Already Exist');
      const result = await this.prisma.resource.create({
        data: {
          name: createResourceDto.name,
          slug,
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
      const parseSearchParams = search?.split(';') || [];

      const whereClause: Prisma.ResourceWhereInput = {};
      if (parseSearchParams?.length > 0) {
        const nameQuery = parseSearchParams.find((param) =>
          param.startsWith('name:'),
        );

        if (nameQuery) {
          const name = nameQuery.split(':')[1];
          whereClause.name = {
            startsWith: name,
            mode: 'insensitive',
          };
        }
      }

      const resources = await this.prisma.resource.findMany({
        where: whereClause,
        take: perPage,
        skip: (pageNumber - 1) * perPage,
      });

      const totalCount = await this.prisma.resource.count({
        where: whereClause,
      });

      const url = `/resource?search=${search}&limit=${limit}`;
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
      const resource = await this.prisma.resource.findUnique({
        where: { id },
      });

      if (!resource) {
        throw new BadRequestException(`Resource Not Found`);
      }

      return resource;
    } catch (error) {
      throw new InternalServerErrorException('Fetching  Error');
    }
  }

  async update(id: number, updateResourceDto: UpdateResourceDto) {
    try {
      const isResource = await this.prisma.resource.findFirst({
        where: {
          id,
        },
      });

      if (!isResource) {
        throw new BadRequestException(`Resource Not Found`);
      }

      const slug = this.prisma.toSnakeCase(updateResourceDto.name);

      await this.prisma.resource.update({
        where: { id },
        data: {
          name: updateResourceDto.name,
          slug,
        },
      });

      return;
    } catch (error) {
      throw new InternalServerErrorException('Updating Error');
    }
  }

  async remove(id: number) {
    try {
      const isResource = await this.prisma.resource.findFirst({
        where: {
          id,
        },
      });

      if (!isResource) {
        throw new BadRequestException(`Resource Not Found`);
      }

      await this.prisma.resource.delete({
        where: { id },
      });

      return true;
    } catch (error) {
      throw new InternalServerErrorException('Deleting Error');
    }
  }
}
