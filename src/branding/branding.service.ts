/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateBrandingDto } from './dto/create-branding.dto';
import { UpdateBrandingDto } from './dto/update-branding.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class BrandingService {
  constructor(private prisma: PrismaService) {}

  async create(createBrandingDto: CreateBrandingDto) {
    try {
      const org = await this.prisma.organization.findFirst({
        where: {
          id: createBrandingDto?.organizationId || 0,
        },
      });

      if (!org) {
        throw new BadRequestException('Organization not found');
      }
      const res = await this.prisma.branding.create({
        data: {
          logo: createBrandingDto.logo,
          primaryColor: createBrandingDto.primaryColor,
          primaryColorDark: createBrandingDto.primaryColorDark,
          logoUrl: createBrandingDto.logoUrl,
          secondaryColor: createBrandingDto.secondaryColor,
          secondaryColorDark: createBrandingDto.secondaryColorDark,
          organizationId: createBrandingDto?.organizationId || 0,
        },
      });

      return res;
    } catch (error: any) {
      throw new InternalServerErrorException(
        error.message || 'An error occurred while fetching.',
      );
    }
  }

  async findOne(id: number) {
    try {
      const org = await this.prisma.organization.findUnique({
        where: {
          id: id,
        },
      });

      if (!org) {
        throw new BadRequestException('Organization not found');
      }

      const res = await this.prisma.branding.findFirst({
        where: {
          organizationId: org.id,
        },
      });

      return res;
    } catch (error: any) {
      console.log(error)
      throw new InternalServerErrorException(
        error.message || 'An error occurred while fetching.',
      );
    }
  }

  async update(id: number, updateBrandingDto: UpdateBrandingDto) {
    try {
      const org = await this.prisma.branding.findFirst({
        where: {
          id,
        },
      });

      if (!org) {
        throw new BadRequestException('Branding not found');
      }
      const res = await this.prisma.branding.update({
        where: { id },
        data: {
          logo: updateBrandingDto.logo,
          primaryColor: updateBrandingDto.primaryColor,
          primaryColorDark: updateBrandingDto.primaryColorDark,
          logoUrl: updateBrandingDto.logoUrl,
          secondaryColor: updateBrandingDto.secondaryColor,
          secondaryColorDark: updateBrandingDto.secondaryColorDark,
        },
      });

      return res;
    } catch (error: any) {
      throw new InternalServerErrorException(
        error.message || 'An error occurred while fetching.',
      );
    }
  }
}
