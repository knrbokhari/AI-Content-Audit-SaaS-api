import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @UseGuards(JwtAuthGuard)
  @Get('report')
  dashboardReport(@CurrentUser() user: { organizationId: string }) {
    return this.dashboardService.dashboardReport(+user.organizationId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('recent-audit')
  recentAudit(@CurrentUser() user: { organizationId: string }) {
    return this.dashboardService.recentAudit(+user.organizationId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('recent-invoice')
  recentInvoice(@CurrentUser() user: { organizationId: string }) {
    return this.dashboardService.recentInvoice(+user.organizationId);
  }
}

@Controller('admin-dashboard')
export class AdminDashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @UseGuards(JwtAuthGuard)
  @Get('recent-organizations')
  recentOrganizations() {
    return this.dashboardService.recentOrganizations();
  }

  @UseGuards(JwtAuthGuard)
  @Get('recent-payments')
  recentPayments() {
    return this.dashboardService.recentPayments();
  }

  @UseGuards(JwtAuthGuard)
  @Get('recent-user-registrations')
  recentUserRegistrations() {
    return this.dashboardService.recentUserRegistrations();
  }

  @UseGuards(JwtAuthGuard)
  @Get('dashboard-report')
  dashboardReport() {
    return this.dashboardService.adminDashboardReport();
  }
}
