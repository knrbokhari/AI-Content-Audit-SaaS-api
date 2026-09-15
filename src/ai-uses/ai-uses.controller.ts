import { Controller, Get, Param, UseGuards, Query } from '@nestjs/common';
import { AiUsesService } from './ai-uses.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PaginationQueries } from 'src/common/dto/pagination-query.dto';

@Controller('ai-uses')
export class AiUsesController {
  constructor(private readonly aiUsesService: AiUsesService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query() query: PaginationQueries) {
    return this.aiUsesService.findAll(query);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.aiUsesService.findOne(+id);
  }
}
