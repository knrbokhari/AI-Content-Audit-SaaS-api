/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async create(createSettingDto: CreateSettingDto) {
    try {
      const setting = await this.prisma.paymentGateway.create({
        data: {
          stripePublishableKey: createSettingDto.stripePublishableKey,
          stripeSecretKey: createSettingDto.stripeSecretKey,
          stripeWebhookSecret: createSettingDto.stripeWebhookSecret,
          paymentCancelUrl: createSettingDto.paymentCancelUrl,
          paymentSuccessUrl: createSettingDto.paymentSuccessUrl,
          stripeMode: createSettingDto.stripeMode,
          currency: createSettingDto.currency,
        },
      });
      return setting;
    } catch (error: any) {
      throw new InternalServerErrorException(
        error?.message || 'Failed to create setting',
      );
    }
  }

  findAll() {
    return `This action returns all settings`;
  }

  async findOne() {
    try {
      const setting = await this.prisma.paymentGateway.findFirst({});
      if (!setting?.id) {
        return null;
      }
      return setting;
    } catch (error: any) {
      throw new InternalServerErrorException(
        error?.message || 'Failed to find setting',
      );
    }
  }

  async update(id: number, updateSettingDto: UpdateSettingDto) {
    try {
      const isHaveSetting = await this.prisma.paymentGateway.findUnique({
        where: { id },
      });

      if (!isHaveSetting) {
        throw new NotFoundException('Setting not found');
      }
      const setting = await this.prisma.paymentGateway.update({
        where: { id },
        data: updateSettingDto,
      });

      return setting;
    } catch (error: any) {
      throw new InternalServerErrorException(
        error?.message || 'Failed to update setting',
      );
    }
  }

  remove(id: number) {
    return `This action removes a #${id} setting`;
  }
}
