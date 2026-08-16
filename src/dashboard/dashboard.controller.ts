import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PaginationQueries } from 'src/common/dto/pagination-query.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  dashboardReport(
    @Query() query: PaginationQueries,
    @CurrentUser() user: { organizationId: string },
  ) {
    return this.dashboardService.dashboardReport(+user.organizationId);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  recentAudit(
    @Query() query: PaginationQueries,
    @CurrentUser() user: { organizationId: string },
  ) {
    return this.dashboardService.recentAudit(+user.organizationId);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  recentInvoice(
    @Query() query: PaginationQueries,
    @CurrentUser() user: { organizationId: string },
  ) {
    return this.dashboardService.recentInvoice(+user.organizationId);
  }
}

@Controller('admin-dashboard')
export class AdminDashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  recentOrganizations() {
    return this.dashboardService.recentOrganizations();
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  recentPayments() {
    return this.dashboardService.recentPayments();
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  recentUserRegistrations() {
    return this.dashboardService.recentUserRegistrations();
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  dashboardReport() {
    return this.dashboardService.adminDashboardReport();
  }
}
