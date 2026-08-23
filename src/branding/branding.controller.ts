import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
} from '@nestjs/common';
import { BrandingService } from './branding.service';
import { CreateBrandingDto } from './dto/create-branding.dto';
import { UpdateBrandingDto } from './dto/update-branding.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('branding')
export class BrandingController {
  constructor(private readonly brandingService: BrandingService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Body() createBrandingDto: CreateBrandingDto,
    @CurrentUser() user: { organizationId: string },
  ) {
    return this.brandingService.create({
      ...createBrandingDto,
      organizationId: +user?.organizationId,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  findOne(@CurrentUser() user: { organizationId: string }) {
    return this.brandingService.findOne(+user?.organizationId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateBrandingDto: UpdateBrandingDto,
  ) {
    return this.brandingService.update(+id, updateBrandingDto);
  }
}
