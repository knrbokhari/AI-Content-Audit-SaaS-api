import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { WebsiteAuditsService } from './website-audits.service';
import { CreateWebsiteAuditDto } from './dto/create-website-audit.dto';
// import { UpdateWebsiteAuditDto } from './dto/update-website-audit.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PaginationQueries } from 'src/common/dto/pagination-query.dto';

@Controller('website-audits')
export class WebsiteAuditsController {
  constructor(private readonly websiteAuditsService: WebsiteAuditsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Body() createWebsiteAuditDto: CreateWebsiteAuditDto,
    @CurrentUser() user: { id: number },
  ) {
    return this.websiteAuditsService.create(createWebsiteAuditDto, user?.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(
    @Query() query: PaginationQueries,
    @CurrentUser() user: { organizationId: string },
  ) {
    return this.websiteAuditsService.findAll({
      ...query,
      search: `${query.search};organizationId:${user.organizationId}`,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.websiteAuditsService.findOne(+id);
  }

  // @Patch(':id')
  // update(
  //   @Param('id') id: string,
  //   @Body() updateWebsiteAuditDto: UpdateWebsiteAuditDto,
  // ) {
  //   return this.websiteAuditsService.update(+id, updateWebsiteAuditDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.websiteAuditsService.remove(+id);
  // }
}
